const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('./db');

const app = express();
app.use(cors());
app.use(express.json());
const SECRET = process.env.JWT_SECRET || 'dev-secret';

function auth(req, res, next) {
  try {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    req.user = jwt.verify(token, SECRET);
    next();
  } catch (err) {
    res.status(401).json({ error: 'Please log in' });
  }
}

async function getRole(teamId, userId) {
  const r = await pool.query('SELECT role FROM memberships WHERE team_id=$1 AND user_id=$2', [teamId, userId]);
  return r.rows[0] ? r.rows[0].role : null;
}

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Story A1: register and log in
app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !email.includes('@') || !password || password.length < 6) {
    return res.status(400).json({ error: 'Enter a name, a valid email, and a password of 6+ characters' });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    const r = await pool.query('INSERT INTO users (name, email, password_hash) VALUES ($1,$2,$3) RETURNING id, name', [name, email.toLowerCase(), hash]);
    const user = r.rows[0];
    res.json({ token: jwt.sign({ id: user.id, name: user.name }, SECRET, { expiresIn: '7d' }) });
  } catch (err) {
    res.status(400).json({ error: 'That email is already registered' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const r = await pool.query('SELECT * FROM users WHERE email=$1', [(email || '').toLowerCase()]);
  const user = r.rows[0];
  if (!user || !(await bcrypt.compare(password || '', user.password_hash))) {
    return res.status(401).json({ error: 'Wrong email or password' });
  }
  res.json({ token: jwt.sign({ id: user.id, name: user.name }, SECRET, { expiresIn: '7d' }) });
});

// Stories A2 and A3: create and join teams
app.get('/api/teams', auth, async (req, res) => {
  const r = await pool.query(
    'SELECT t.id, t.name, t.sport, t.invite_code, m.role FROM teams t JOIN memberships m ON m.team_id=t.id WHERE m.user_id=$1 ORDER BY t.id',
    [req.user.id]
  );
  res.json(r.rows);
});

app.post('/api/teams', auth, async (req, res) => {
  const { name, sport } = req.body;
  if (!name) return res.status(400).json({ error: 'Team name is required' });
  const code = Math.random().toString(36).slice(2, 8).toUpperCase();
  const t = await pool.query('INSERT INTO teams (name, sport, invite_code) VALUES ($1,$2,$3) RETURNING *', [name, sport || '', code]);
  await pool.query("INSERT INTO memberships (team_id, user_id, role) VALUES ($1,$2,'captain')", [t.rows[0].id, req.user.id]);
  res.json(t.rows[0]);
});

app.post('/api/teams/join', auth, async (req, res) => {
  const t = await pool.query('SELECT id FROM teams WHERE invite_code=$1', [(req.body.invite_code || '').toUpperCase()]);
  if (!t.rows[0]) return res.status(404).json({ error: 'Invalid invite code' });
  await pool.query("INSERT INTO memberships (team_id, user_id, role) VALUES ($1,$2,'player') ON CONFLICT DO NOTHING", [t.rows[0].id, req.user.id]);
  res.json({ joined: true });
});

// Stories B1 and B2: create events and view the calendar
app.get('/api/teams/:id/events', auth, async (req, res) => {
  if (!(await getRole(req.params.id, req.user.id))) return res.status(403).json({ error: 'Not on this team' });
  const r = await pool.query(
    `SELECT e.*,
      (SELECT COUNT(*) FROM rsvps r WHERE r.event_id=e.id AND r.status='going')::int AS going,
      (SELECT status FROM rsvps r WHERE r.event_id=e.id AND r.user_id=$2) AS my_status
     FROM events e WHERE e.team_id=$1 ORDER BY e.starts_at`,
    [req.params.id, req.user.id]
  );
  res.json(r.rows);
});

app.post('/api/teams/:id/events', auth, async (req, res) => {
  if ((await getRole(req.params.id, req.user.id)) !== 'captain') {
    return res.status(403).json({ error: 'Only captains can create events' });
  }
  const { title, type, starts_at, location } = req.body;
  if (!title || !starts_at) return res.status(400).json({ error: 'Title and date are required' });
  const r = await pool.query(
    'INSERT INTO events (team_id, title, type, starts_at, location) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [req.params.id, title, type || 'practice', starts_at, location || '']
  );
  res.json(r.rows[0]);
});

// Story B3: RSVP
app.post('/api/events/:id/rsvp', auth, async (req, res) => {
  const { status } = req.body;
  if (!['going', 'maybe', 'not_going'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  const ev = await pool.query('SELECT team_id FROM events WHERE id=$1', [req.params.id]);
  if (!ev.rows[0]) return res.status(404).json({ error: 'Event not found' });
  if (!(await getRole(ev.rows[0].team_id, req.user.id))) return res.status(403).json({ error: 'Not on this team' });
  await pool.query(
    'INSERT INTO rsvps (event_id, user_id, status) VALUES ($1,$2,$3) ON CONFLICT (event_id, user_id) DO UPDATE SET status=$3',
    [req.params.id, req.user.id, status]
  );
  res.json({ status });
});

const PORT = process.env.PORT || 5000;
pool.init()
  .then(() => app.listen(PORT, () => console.log('Backend running on port ' + PORT)))
  .catch((err) => { console.error(err); process.exit(1); });