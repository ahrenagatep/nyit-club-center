// the signed-in user's own profile: GET /users/me, PATCH /users/me
// requireAuth runs first and sets req.user from the users row linked to the token

const pool = require('../config/db');
const { USER_COLUMNS } = require('../utils/userColumns');

// fields a user may change about themselves (never role, email, or username)
const EDITABLE_FIELDS = ['major', 'school_year', 'bio'];
const SCHOOL_YEARS = ['Freshman', 'Sophomore', 'Junior', 'Senior'];
// same limits as sql/011 and the app's Edit Profile pop-up
const MAX_LENGTH = { major: 80, bio: 200 };

// GET /users/me
async function getMe(req, res) {
  if (!req.user.user_id) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  try {
    const result = await pool.query(`SELECT ${USER_COLUMNS} FROM users WHERE user_id = $1`, [req.user.user_id]);

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load profile' });
  }
}

// PATCH /users/me
// body: any of { major, school_year, bio }; a field left out is unchanged, "" or null clears it
async function updateMe(req, res) {
  const body = req.body;

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({ error: 'Request body must be a JSON object' });
  }

  const fields = Object.keys(body);
  const unknown = fields.filter((field) => !EDITABLE_FIELDS.includes(field));

  if (unknown.length) {
    return res.status(400).json({
      error: `Unknown fields: ${unknown.join(', ')}. You can update: ${EDITABLE_FIELDS.join(', ')}`,
    });
  }

  if (!fields.length) {
    return res.status(400).json({ error: `Nothing to update. Send any of: ${EDITABLE_FIELDS.join(', ')}` });
  }

  const sets = [];
  const values = [];

  for (const field of fields) {
    const raw = body[field];

    if (raw !== null && typeof raw !== 'string') {
      return res.status(400).json({ error: `${field} must be text or null` });
    }

    const value = raw === null ? null : raw.trim() || null;

    if (field === 'school_year' && value !== null && !SCHOOL_YEARS.includes(value)) {
      return res.status(400).json({ error: `school_year must be one of: ${SCHOOL_YEARS.join(', ')}` });
    }

    if (MAX_LENGTH[field] && value !== null && value.length > MAX_LENGTH[field]) {
      return res.status(400).json({ error: `${field} must be ${MAX_LENGTH[field]} characters or fewer` });
    }

    // field names come from EDITABLE_FIELDS above, values are parameterized
    values.push(value);
    sets.push(`${field} = $${values.length}`);
  }

  if (!req.user.user_id) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  values.push(req.user.user_id);

  try {
    const result = await pool.query(
      `UPDATE users SET ${sets.join(', ')} WHERE user_id = $${values.length} RETURNING ${USER_COLUMNS}`,
      values
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({ message: 'Profile updated', user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
}

module.exports = { getMe, updateMe };
