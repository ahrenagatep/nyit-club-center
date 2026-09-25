// CRUD + browsing for clubs
// GET routes are public (for browsing), POST/PUT/DELETE require auth + moderator/admin role

const pool = require('../config/db');

function missingFields(body, fields) {
  return fields.filter((field) => {
    const value = body[field];
    return value === undefined || value === null || String(value).trim() === '';
  });
}

// GET /clubs?search=...&category=...
// Browse/search all clubs, optionally filtered by category or a text search on name.
async function listClubs(req, res) {
  const { search, category } = req.query;

  const conditions = [];
  const values = [];

  if (search) {
    values.push(`%${search}%`);
    conditions.push(`name ILIKE $${values.length}`);
  }

  if (category) {
    values.push(category);
    conditions.push(`category = $${values.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const result = await pool.query(
      `SELECT club_id, president_id, name, description, category, created_at
       FROM clubs
       ${whereClause}
       ORDER BY created_at DESC`,
      values
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch clubs' });
  }
}

// GET /clubs/:id
async function getClub(req, res) {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT club_id, president_id, name, description, category, created_at
       FROM clubs WHERE club_id = $1`,
      [id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Club not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch club' });
  }
}

// POST /clubs
// Requires requireAuth + requireRole('moderator', 'admin') in the route.
async function createClub(req, res) {
  const required = ['name'];
  const missing = missingFields(req.body || {}, required);

  if (missing.length) {
    return res.status(400).json({ error: `Missing fields: ${missing.join(', ')}` });
  }

  const { name, description, category } = req.body;
  const president_id = req.user.user_id; // the creator becomes the club's president

  try {
    const result = await pool.query(
      `INSERT INTO clubs (president_id, name, description, category)
       VALUES ($1, $2, $3, $4)
       RETURNING club_id, president_id, name, description, category, created_at`,
      [president_id, name.trim(), description || null, category || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create club' });
  }
}

// PUT /clubs/:id
// Requires requireAuth + requireRole('moderator', 'admin') in the route.
async function updateClub(req, res) {
  const { id } = req.params;
  const { name, description, category } = req.body;

  try {
    const existing = await pool.query('SELECT * FROM clubs WHERE club_id = $1', [id]);

    if (!existing.rows[0]) {
      return res.status(404).json({ error: 'Club not found' });
    }

    const result = await pool.query(
      `UPDATE clubs
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           category = COALESCE($3, category)
       WHERE club_id = $4
       RETURNING club_id, president_id, name, description, category, created_at`,
      [name, description, category, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update club' });
  }
}

// DELETE /clubs/:id
// Requires requireAuth + requireRole('admin') in the route.
async function deleteClub(req, res) {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM clubs WHERE club_id = $1 RETURNING club_id', [id]);

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Club not found' });
    }

    res.json({ message: 'Club deleted', club_id: result.rows[0].club_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete club' });
  }
}

module.exports = { listClubs, getClub, createClub, updateClub, deleteClub };