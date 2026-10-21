// Auth endpoints backed by Supabase Auth (email + password)
// local `users` rows are created so the rest of the app can use user_id / role

const supabase = require('../config/supabase');
const { createRequestClient } = require('../config/supabaseRequestClient');
const pool = require('../config/db');
const { isNyitEmail, normalizeEmail } = require('../utils/nyitEmail');

// where the link in the confirmation email sends the user after Supabase verifies them
const EMAIL_REDIRECT_URL = 'http://localhost:3000/verified';

function missingFields(body, fields) {
  return fields.filter((field) => {
    const value = body[field];
    return value === undefined || value === null || String(value).trim() === '';
  });
}

// auth_user_id is supabase's own user id (data.user.id from signUp/getUser)
// bridges between supabase auth and our local users table

async function upsertLocalUser({ auth_user_id, nyit_email, username, first_name, last_name }) { 
  const existing = await pool.query(
    'SELECT user_id, auth_user_id, nyit_email, username, first_name, last_name, role FROM users WHERE auth_user_id = $1',
    [auth_user_id]
  );

  if (existing.rows[0]) {
    return existing.rows[0];
  }

  const inserted = await pool.query(
    `INSERT INTO users (auth_user_id, nyit_email, username, first_name, last_name, role)
     VALUES ($1, $2, $3, $4, $5, 'student')
     RETURNING user_id, auth_user_id, nyit_email, username, first_name, last_name, role`,
    [auth_user_id, nyit_email, username, first_name, last_name]
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

  // check email/username are free BEFORE creating the supabase account,
  // otherwise a taken username leaves an orphaned supabase account behind
  try {
    const taken = await pool.query(
      'SELECT nyit_email, username FROM users WHERE nyit_email = $1 OR username = $2',
      [nyit_email, username]
    );

    if (taken.rows.some((row) => row.nyit_email === nyit_email)) {
      return res.status(409).json({ error: 'An account with this email already exists. Try logging in.' });
    }

    if (taken.rows.length) {
      return res.status(409).json({ error: 'That username is taken. Try another one.' });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Could not check account availability' });
  }

  const { data, error } = await supabase.auth.signUp({
    email: nyit_email,
    password,
    options: {
      data: { username, first_name, last_name },
      emailRedirectTo: EMAIL_REDIRECT_URL,
    },
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  let profile;
  try {
    profile = await upsertLocalUser({
      auth_user_id: data.user.id, // <-- supabase's real user id saved as the link
      nyit_email,
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
      'SELECT user_id, auth_user_id, nyit_email, username, first_name, last_name, role FROM users WHERE auth_user_id = $1',
      [data.user.id]  // change to lookup by supabase id , not email
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
// uses the 6-digit (or token hash) code from the confirmation email
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
      'SELECT user_id, auth_user_id, nyit_email, username, first_name, last_name, role FROM users WHERE auth_user_id = $1',
      [data.user.id] // <-- lookup by supabase's id , not email
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

// POST /auth/resend
// re-sends the signup confirmation email (supabase rate-limits this per address)
async function resend(req, res) {
  const emailRaw = req.body?.nyit_email || req.body?.email;

  if (!emailRaw || String(emailRaw).trim() === '') {
    return res.status(400).json({ error: 'Missing fields: nyit_email (or email)' });
  }

  const nyit_email = normalizeEmail(emailRaw);

  if (!isNyitEmail(nyit_email)) {
    return res.status(400).json({ error: 'Email must be a valid @nyit.edu address' });
  }

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: nyit_email,
    options: { emailRedirectTo: EMAIL_REDIRECT_URL },
  });

  if (error) {
    return res.status(error.status === 429 ? 429 : 400).json({ error: error.message });
  }

  return res.json({ message: 'Verification email sent' });
}

// POST /auth/forgot-password
// emails a password reset code. Always answers the same way whether or not the
// account exists, so this can't be used to find out who has an account.
// The code comes from {{ .Token }} in the Supabase "Reset Password" email template.
async function forgotPassword(req, res) {
  const emailRaw = req.body?.nyit_email || req.body?.email;

  if (!emailRaw || String(emailRaw).trim() === '') {
    return res.status(400).json({ error: 'Missing fields: nyit_email (or email)' });
  }

  const nyit_email = normalizeEmail(emailRaw);

  if (!isNyitEmail(nyit_email)) {
    return res.status(400).json({ error: 'Email must be a valid @nyit.edu address' });
  }

  const { error } = await supabase.auth.resetPasswordForEmail(nyit_email);

  if (error) {
    if (error.status === 429) {
      return res.status(429).json({ error: error.message });
    }
    // supabase doesn't error for unknown emails, so this is a real failure (e.g. SMTP)
    console.error('resetPasswordForEmail failed:', error.message);
    return res.status(500).json({ error: "Couldn't send the reset email. Try again later." });
  }

  return res.json({ message: 'If an account exists for that email, we sent a reset code.' });
}

// POST /auth/reset-password
// checks the emailed code, sets the new password, then signs the account out
// everywhere so anyone using the old password loses access
async function resetPassword(req, res) {
  const required = ['nyit_email', 'token', 'new_password'];
  const missing = missingFields(req.body || {}, required);

  if (missing.length) {
    return res.status(400).json({ error: `Missing fields: ${missing.join(', ')}` });
  }

  const nyit_email = normalizeEmail(req.body.nyit_email);
  const token = String(req.body.token).trim();
  const new_password = String(req.body.new_password);

  if (!isNyitEmail(nyit_email)) {
    return res.status(400).json({ error: 'Email must be a valid @nyit.edu address' });
  }

  if (!/^\d{6,10}$/.test(token)) {
    return res.status(400).json({ error: 'Enter the code from the email' });
  }

  if (new_password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  // per-request client: verifyOtp signs the user in, and that session must not
  // end up on the shared client
  const client = createRequestClient();

  const { data, error } = await client.auth.verifyOtp({
    email: nyit_email,
    token,
    type: 'recovery',
  });

  if (error || !data?.session) {
    return res.status(400).json({ error: 'That code is invalid or has expired. Request a new one.' });
  }

  const { error: updateError } = await client.auth.updateUser({ password: new_password });

  if (updateError) {
    return res.status(400).json({ error: updateError.message });
  }

  // revokes every refresh token for this account (other devices + this recovery session)
  const { error: signOutError } = await client.auth.signOut({ scope: 'global' });
  if (signOutError) {
    // the password is already changed, so don't fail the request over this
    console.error('signOut after password reset failed:', signOutError.message);
  }

  return res.json({ message: 'Password updated. Log in with your new password.' });
}

module.exports = { register, login, verify, resend, forgotPassword, resetPassword };
