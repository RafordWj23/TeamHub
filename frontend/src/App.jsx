import { useState, useEffect } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const input = { display: 'block', width: '100%', margin: '6px 0', padding: 8, boxSizing: 'border-box' };

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [teams, setTeams] = useState([]);
  const [team, setTeam] = useState(null);
  const [events, setEvents] = useState([]);
  const [newTeam, setNewTeam] = useState({ name: '', sport: '' });
  const [code, setCode] = useState('');
  const [newEvent, setNewEvent] = useState({ title: '', type: 'practice', starts_at: '', location: '' });

  const call = async (path, method = 'GET', body) => {
    const res = await fetch(API + path, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Something went wrong');
    return data;
  };
  const run = async (fn) => {
    try { setError(''); await fn(); } catch (e) { setError(e.message); }
  };
  const loadTeams = () => run(async () => setTeams(await call('/api/teams')));
  const loadEvents = (t) => run(async () => setEvents(await call('/api/teams/' + t.id + '/events')));
  useEffect(() => { if (token) loadTeams(); }, [token]);

  const submitAuth = (e) => {
    e.preventDefault();
    run(async () => {
      const data = await call(mode === 'login' ? '/api/login' : '/api/register', 'POST', form);
      localStorage.setItem('token', data.token);
      setToken(data.token);
    });
  };
  const logout = () => { localStorage.removeItem('token'); setToken(null); setTeam(null); setTeams([]); };
  const createTeam = (e) => {
    e.preventDefault();
    run(async () => { await call('/api/teams', 'POST', newTeam); setNewTeam({ name: '', sport: '' }); await loadTeams(); });
  };
  const joinTeam = (e) => {
    e.preventDefault();
    run(async () => { await call('/api/teams/join', 'POST', { invite_code: code }); setCode(''); await loadTeams(); });
  };
  const openTeam = (t) => { setTeam(t); loadEvents(t); };
  const createEvent = (e) => {
    e.preventDefault();
    run(async () => {
      await call('/api/teams/' + team.id + '/events', 'POST', newEvent);
      setNewEvent({ title: '', type: 'practice', starts_at: '', location: '' });
      await loadEvents(team);
    });
  };
  const rsvp = (id, status) => run(async () => { await call('/api/events/' + id + '/rsvp', 'POST', { status }); await loadEvents(team); });

  if (!token) {
    return (
      <div style={{ maxWidth: 360, margin: '40px auto', fontFamily: 'sans-serif' }}>
        <h1>TeamHub</h1>
        <form onSubmit={submitAuth}>
          {mode === 'register' && <input style={input} placeholder='Name' value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />}
          <input style={input} placeholder='Email' value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input style={input} type='password' placeholder='Password' value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <button>{mode === 'login' ? 'Log in' : 'Sign up'}</button>
        </form>
        <p style={{ color: 'red' }}>{error}</p>
        <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? 'Need an account? Sign up' : 'Have an account? Log in'}
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640, margin: '20px auto', fontFamily: 'sans-serif' }}>
      <h1>TeamHub <button onClick={logout}>Log out</button></h1>
      <p style={{ color: 'red' }}>{error}</p>
      <h2>My Teams</h2>
      {teams.map((t) => (
        <div key={t.id}>
          <button onClick={() => openTeam(t)}>{t.name} ({t.role})</button>
          {t.role === 'captain' && <small> Invite code: {t.invite_code}</small>}
        </div>
      ))}
      <form onSubmit={createTeam}>
        <h3>Create a team</h3>
        <input style={input} placeholder='Team name' value={newTeam.name} onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })} />
        <input style={input} placeholder='Sport' value={newTeam.sport} onChange={(e) => setNewTeam({ ...newTeam, sport: e.target.value })} />
        <button>Create team</button>
      </form>
      <form onSubmit={joinTeam}>
        <h3>Join a team</h3>
        <input style={input} placeholder='Invite code' value={code} onChange={(e) => setCode(e.target.value)} />
        <button>Join</button>
      </form>
      {team && (
        <div>
          <h2>{team.name} Calendar</h2>
          {events.length === 0 && <p>No events yet.</p>}
          {events.map((ev) => (
            <div key={ev.id} style={{ border: '1px solid #ccc', padding: 10, margin: '8px 0' }}>
              <b>{ev.title}</b> ({ev.type})<br />
              {new Date(ev.starts_at).toLocaleString()} at {ev.location || 'TBD'}<br />
              Going: {ev.going} | Your RSVP: {ev.my_status || 'none'}<br />
              <button onClick={() => rsvp(ev.id, 'going')}>Going</button>
              <button onClick={() => rsvp(ev.id, 'maybe')}>Maybe</button>
              <button onClick={() => rsvp(ev.id, 'not_going')}>Not going</button>
            </div>
          ))}
          {team.role === 'captain' && (
            <form onSubmit={createEvent}>
              <h3>Create an event</h3>
              <input style={input} placeholder='Title' value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} />
              <select style={input} value={newEvent.type} onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}>
                <option value='practice'>Practice</option>
                <option value='game'>Game</option>
                <option value='meeting'>Meeting</option>
              </select>
              <input style={input} type='datetime-local' value={newEvent.starts_at} onChange={(e) => setNewEvent({ ...newEvent, starts_at: e.target.value })} />
              <input style={input} placeholder='Location' value={newEvent.location} onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })} />
              <button>Create event</button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}