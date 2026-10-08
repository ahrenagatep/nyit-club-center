// Authenticated profile updates. Identity always comes from requireAuth
// (Supabase token -> users.auth_user_id -> users.user_id), never from the body.

const pool = require('../config/db');

const BIO_MAX_LENGTH = 300;

function parseBio(body) {
  if (body === undefined || body === null || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Request body must be a JSON object' };
  }

  if (!Object.prototype.hasOwnProperty.call(body, 'bio')) {
    return { error: 'Missing fields: bio' };
  }

  if (typeof body.bio !== 'string') {
    return { error: 'bio must be a string' };
  }

  if (body.bio.length > BIO_MAX_LENGTH) {
    return { error: `bio must be ${BIO_MAX_LENGTH} characters or fewer` };
  }

  return { bio: body.bio };
}

// PATCH /api/me/profile/bio
async function updateBio(req, res) {
  const parsed = parseBio(req.body);
  if (parsed.error) {
    return res.status(400).json({ error: parsed.error });
  }

  const userId = req.user?.user_id;
  if (!userId) {
    return res.status(404).json({ error: 'User profile not found' });
  }

  try {
    const result = await pool.query(
      'UPDATE users SET bio = $1 WHERE user_id = $2 RETURNING bio',
      [parsed.bio, userId]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    return res.json({ bio: result.rows[0].bio });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to update bio' });
  }
}

module.exports = { BIO_MAX_LENGTH, parseBio, updateBio };
