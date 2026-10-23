// the signed-in user's own profile: GET /users/me, PATCH /users/me,
// PUT /users/me/avatar, DELETE /users/me/avatar
// requireAuth runs first and sets req.user from the users row linked to the token

const pool = require('../config/db');
const { USER_COLUMNS } = require('../utils/userColumns');

const { createRequestClient } = require('../config/supabaseRequestClient');
const AVATAR_BUCKET = 'avatars';

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

// each user has one file in the bucket, in a folder named after their Supabase auth id
// (the bucket's policies only let a user write inside their own folder)
function avatarPath(req) {
  return `${req.authUser.id}/avatar`;
}

// checks the file's first bytes so a renamed non-image can't be uploaded with a fake Content-Type
function looksLikeImage(buffer, type) {
  if (type === 'image/png') {
    return buffer.length > 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }
  return buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
}

// PUT /users/me/avatar
// body: the raw image (Content-Type image/jpeg or image/png, 2MB max); replaces any old picture
async function uploadAvatar(req, res) {
  const type = req.headers['content-type']?.split(';')[0].trim();

  // express.raw only fills req.body for jpeg/png, so anything else lands here
  if (!Buffer.isBuffer(req.body) || !req.body.length) {
    return res.status(400).json({ error: 'Send a JPEG or PNG image with Content-Type image/jpeg or image/png' });
  }

  if (!looksLikeImage(req.body, type)) {
    return res.status(400).json({ error: 'File is not a valid JPEG or PNG image' });
  }

  const storage = createRequestClient(req.accessToken).storage.from(AVATAR_BUCKET);
  const path = avatarPath(req);

  const { error: uploadError } = await storage.upload(path, req.body, { contentType: type, upsert: true });

  if (uploadError) {
    console.error(uploadError);
    return res.status(502).json({ error: 'Failed to upload profile picture' });
  }

  // the path never changes, so add ?v= to make the app (and Supabase's CDN) load the new picture
  const { data } = storage.getPublicUrl(path);
  const imageUrl = `${data.publicUrl}?v=${Date.now()}`;

  try {
    const result = await pool.query(
      `UPDATE users SET profile_image = $1 WHERE user_id = $2 RETURNING ${USER_COLUMNS}`,
      [imageUrl, req.user.user_id]
    );

    res.json({ message: 'Profile picture updated', user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save profile picture' });
  }
}

// DELETE /users/me/avatar
// removes the picture from the bucket and clears profile_image
async function deleteAvatar(req, res) {
  const storage = createRequestClient(req.accessToken).storage.from(AVATAR_BUCKET);

  // removing a file that isn't there is not an error, so this is safe to call twice
  const { error: removeError } = await storage.remove([avatarPath(req)]);

  if (removeError) {
    console.error(removeError);
    return res.status(502).json({ error: 'Failed to remove profile picture' });
  }

  try {
    const result = await pool.query(
      `UPDATE users SET profile_image = NULL WHERE user_id = $1 RETURNING ${USER_COLUMNS}`,
      [req.user.user_id]
    );

    res.json({ message: 'Profile picture removed', user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to remove profile picture' });
  }
}

module.exports = { getMe, updateMe, uploadAvatar, deleteAvatar };
