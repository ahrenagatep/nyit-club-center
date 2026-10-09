// verifies a Supabase Auth access token on protected routes
// expects: Authorization: Bearer <access_token>

const supabase = require('../config/supabase');
const pool = require('../config/db');

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

  let profile = null;

  try {
    const result = await pool.query(
      'SELECT user_id, nyit_email, username, first_name, last_name, role FROM users WHERE auth_user_id = $1',
      [data.user.id]  // lookup by supabase's id , not email
    );
    profile = result.rows[0] || null;
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to load user profile' });
  }

  req.authUser = data.user;
  req.user = profile || {
    auth_user_id: data.user.id,
    nyit_email: normalizeEmail(data.user.email || ''),
    role: 'student',
  };

  next();
}

module.exports = { requireAuth };
