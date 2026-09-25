// Auth endpoints backed by Supabase Auth (email + password)
// local `users` rows are created so the rest of the app can use user_id / role

const bcrypt = require('bcrypt');
const supabase = require('../config/supabase');
const pool = require('../config/db');
const { isNyitEmail, normalizeEmail } = require('../utils/nyitEmail');

const SALT_ROUNDS = 10;

function missingFields(body, fields) {
  return fields.filter((field) => {
    const value = body[field];
    return value === undefined || value === null || String(value).trim() === '';
  });
}

async function upsertLocalUser({ nyit_email, password, username, first_name, last_name }) {
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const existing = await pool.query(
    'SELECT user_id, nyit_email, username, first_name, last_name, role FROM users WHERE nyit_email = $1',
    [nyit_email]
  );

  if (existing.rows[0]) {
    return existing.rows[0];
  }

  const inserted = await pool.query(
    `INSERT INTO users (nyit_email, password, username, first_name, last_name, role)
     VALUES ($1, $2, $3, $4, $5, 'student')
     RETURNING user_id, nyit_email, username, first_name, last_name, role`,
    [nyit_email, passwordHash, username, first_name, last_name]
  );

  return inserted.rows[0];
}

function sessionPayload(session, profile) {
  return {
    user: profile,
    session: session
      ? {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at,
          token_type: session.token_type,
        }
      : null,
  };
}

// POST /auth/register
async function register(req, res) {
  const required = ['nyit_email', 'password', 'username', 'first_name', 'last_name'];
  const missing = missingFields(req.body || {}, required);

  if (missing.length) {
    return res.status(400).json({ error: `Missing fields: ${missing.join(', ')}` });
  }

  const nyit_email = normalizeEmail(req.body.nyit_email);
  const password = String(req.body.password);
  const username = String(req.body.username).trim();
  const first_name = String(req.body.first_name).trim();
  const last_name = String(req.body.last_name).trim();

  if (!isNyitEmail(nyit_email)) {
    return res.status(400).json({ error: 'Email must be a valid @nyit.edu address' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const { data, error } = await supabase.auth.signUp({
    email: nyit_email,
    password,
    options: {
      data: { username, first_name, last_name },
    },
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  let profile;
  try {
    profile = await upsertLocalUser({
      nyit_email,
      password,
      username,
      first_name,
      last_name,
    });
  } catch (err) {
    console.error(err);
    return res.status(409).json({
      error: 'Supabase account created, but local user profile could not be saved (email or username may already exist)',
    });
  }

  return res.status(201).json({
    message: data.session
      ? 'Registered'
      : 'Registered. Check your NYIT email to verify the account before logging in.',
    ...sessionPayload(data.session, profile),
  });
}

// POST /auth/login
async function login(req, res) {
  const required = ['nyit_email', 'password'];
  const missing = missingFields(req.body || {}, required);

  if (missing.length) {
    return res.status(400).json({ error: `Missing fields: ${missing.join(', ')}` });
  }

  const nyit_email = normalizeEmail(req.body.nyit_email);
  const password = String(req.body.password);

  if (!isNyitEmail(nyit_email)) {
    return res.status(400).json({ error: 'Email must be a valid @nyit.edu address' });
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: nyit_email,
    password,
  });

  if (error || !data.session) {
    return res.status(401).json({ error: error?.message || 'Invalid email or password' });
  }

  let profile;
  try {
    const result = await pool.query(
      'SELECT user_id, nyit_email, username, first_name, last_name, role FROM users WHERE nyit_email = $1',
      [nyit_email]
    );
    profile = result.rows[0] || { nyit_email, role: 'student' };
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Login succeeded but profile lookup failed' });
  }

  return res.json({
    message: 'Logged in',
    ...sessionPayload(data.session, profile),
  });
}

// POST /auth/verify
// uses the 6-digit (or token hash) code from the Supabase confirmation email
async function verify(req, res) {
  const emailRaw = req.body?.nyit_email || req.body?.email;
  const token = req.body?.token;

  if (!emailRaw || !token) {
    return res.status(400).json({ error: 'Missing fields: nyit_email (or email), token' });
  }

  const nyit_email = normalizeEmail(emailRaw);

  if (!isNyitEmail(nyit_email)) {
    return res.status(400).json({ error: 'Email must be a valid @nyit.edu address' });
  }

  const { data, error } = await supabase.auth.verifyOtp({
    email: nyit_email,
    token: String(token).trim(),
    type: 'signup',
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  let profile = null;
  try {
    const result = await pool.query(
      'SELECT user_id, nyit_email, username, first_name, last_name, role FROM users WHERE nyit_email = $1',
      [nyit_email]
    );
    profile = result.rows[0] || { nyit_email, role: 'student' };
  } catch (err) {
    console.error(err);
  }

  return res.json({
    message: 'Email verified',
    ...sessionPayload(data.session, profile),
  });
}

module.exports = { register, login, verify };
