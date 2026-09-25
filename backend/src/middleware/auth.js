// verifies a Supabase Auth access token on protected routes
// expects: Authorization: Bearer <access_token>

const supabase = require('../config/supabase');
const pool = require('../config/db');
const { normalizeEmail } = require('../utils/nyitEmail');

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';

  if (!token) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const email = normalizeEmail(data.user.email || '');
  let profile = null;

  try {
    const result = await pool.query(
      'SELECT user_id, nyit_email, username, first_name, last_name, role FROM users WHERE nyit_email = $1',
      [email]
    );
    profile = result.rows[0] || null;
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to load user profile' });
  }

  req.authUser = data.user;
  req.user = profile || {
    nyit_email: email,
    role: 'student',
  };

  next();
}

module.exports = { requireAuth };
