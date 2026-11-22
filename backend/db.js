const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

pool.init = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS teams (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      sport TEXT,
      invite_code TEXT UNIQUE NOT NULL
    );
    CREATE TABLE IF NOT EXISTS memberships (
      team_id INT REFERENCES teams(id),
      user_id INT REFERENCES users(id),
      role TEXT NOT NULL,
      PRIMARY KEY (team_id, user_id)
    );
    CREATE TABLE IF NOT EXISTS events (
      id SERIAL PRIMARY KEY,
      team_id INT REFERENCES teams(id),
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      starts_at TIMESTAMP NOT NULL,
      location TEXT
    );
    CREATE TABLE IF NOT EXISTS rsvps (
      event_id INT REFERENCES events(id),
      user_id INT REFERENCES users(id),
      status TEXT NOT NULL,
      PRIMARY KEY (event_id, user_id)
    );
  `);
};

module.exports = pool;