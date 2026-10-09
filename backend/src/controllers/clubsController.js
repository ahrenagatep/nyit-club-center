// CRUD + browsing for clubs
// GET routes are public (for browsing)
// POST needs requireAuth only (any student can create clubs)
// PUT/DELETE require auth + officer/president/admin role

const pool = require('../config/db');

const CATEGORIES = ['Academic', 'Sports', 'Arts', 'Tech', 'Social']; // from mock-data.ts CATEGORIES

function missingFields(body, fields) {
  return fields.filter((field) => {
    const value = body[field];
    return value === undefined || value === null || String(value).trim() === '';
  });
}

// case insensitive match for club categories , null if not recognized
function normalizeCategory(value) {
  const wanted = String(value).trim().toLowerCase();
  return CATEGORIES.find((c) => c.toLowerCase() === wanted) || null;
}

// GET /clubs?search=...&category=...
// Browse/search all clubs, optionally filtered by category or a text search on name.
async function listClubs(req, res) {
  const { search, category } = req.query;

  const conditions = [];
  const values = [];

  if (search) {
    values.push(`%${search}%`);
    conditions.push(`(c.name ILIKE $${values.length} OR c.description ILIKE $${values.length})`);
  }

  if (category) {
    values.push(category);
    conditions.push(`c.category = $${values.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const result = await pool.query(
      `SELECT c.club_id, c.president_id, c.name, c.description, c.category, c.created_at,
              COUNT(m.user_id)::int AS member_count
       FROM clubs c
       LEFT JOIN memberships m ON m.club_id = c.club_id
       ${whereClause}
       GROUP BY c.club_id
       ORDER BY c.created_at DESC`,
      values
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch clubs' });
  }
}

// GET /clubs/:id
// now includes member count
async function getClub(req, res) {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT c.club_id, c.president_id, c.name, c.description, c.category, c.created_at,
              COUNT(m.user_id)::int AS member_count
       FROM clubs c
       LEFT JOIN memberships m ON m.club_id = c.club_id
       WHERE c.club_id = $1
       GROUP BY c.club_id`,
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
// Requires requireAuth , any student can create a club -> becomes the president of club
async function createClub(req, res) {
  const required = ['name', 'description', 'category'];
  const missing = missingFields(req.body || {}, required);

  if (missing.length) {
    return res.status(400).json({ error: `Missing fields: ${missing.join(', ')}` });
  }

  const { name, description, category } = req.body;

  const chosenCategory = normalizeCategory(category);
  if (!chosenCategory) {
    return res.status(400).json({ error: `Invalid category, must be one of: ${CATEGORIES.join(', ')}` });
  }

  const president_id = req.user.user_id; // the creator becomes the club's president
  const client = await pool.connect(); // dedicated connection for this transaction

  try {
    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO clubs (president_id, name, description, category)
       VALUES ($1, $2, $3, $4)
       RETURNING club_id, president_id, name, description, category, created_at`,
      [president_id, String(name).trim(), String(description).trim(), chosenCategory]
    );

    const club = result.rows[0];

    // add the creator as the president in the memberships table
    await client.query(
      `INSERT INTO memberships (user_id, club_id, role, status)
       VALUES ($1, $2, 'president', 'active')`,
      [president_id, club.club_id]
    );

    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');

    if (err.code === '23505') { // unique violation aka same club name
      return res.status(409).json({ error: 'A club with that name already exists!' });
    }

    console.error(err);
    res.status(500).json({ error: 'Failed to create club' });
  } finally {
    client.release();
  }
}

// PUT /clubs/:id
// Requires requireAuth + requireRole('officer', 'president', 'admin') in the route.
async function updateClub(req, res) {
  const { id } = req.params;
  const { name, description, category } = req.body;

  // validate required fields
  if (name !== undefined && !String(name).trim()) {
    return res.status(400).json({ error: 'Name cannot be empty' });
  }

  if (description !== undefined && !String(description).trim()) {
    return res.status(400).json({ error: 'Description cannot be empty' });
  }

  let chosenCategory = null;
  if (category !== undefined) {
    chosenCategory = normalizeCategory(category);
    if (!chosenCategory) {
      return res.status(400).json({ error: `Invalid category, must be one of: ${CATEGORIES.join(', ')}` });
    }
  }

  try {
    const existing = await pool.query('SELECT club_id FROM clubs WHERE club_id = $1', [id]);

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
      [
        name !== undefined ? String(name).trim() : null,
        description !== undefined ? String(description).trim() : null,
        chosenCategory,
        id,
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') { // same name violation like in createClub
      return res.status(409).json({ error: 'A club with that name already exists!' });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to update club' });
  }
}

// DELETE /clubs/:id
// requires requireAuth + requireRole('admin', 'president') in the route.
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

// ENDPOINTS FOR JOINING / LEAVING CLUBS

// POST /clubs/:id/join
// requires requireAuth, any logged-in user can join
// joins are instantly status set to active for now.
async function joinClub(req, res) {
  const { id } = req.params;
  const user_id = req.user.user_id;

  try {
    const club = await pool.query('SELECT club_id FROM clubs WHERE club_id = $1', [id]);

    if (!club.rows[0]) {
      return res.status(404).json({ error: 'Club not found' });
    }

    const result = await pool.query(
      `INSERT INTO memberships (user_id, club_id, role, status)
       VALUES ($1, $2, 'member', 'active')
       RETURNING user_id, club_id, role, status, joined_at`,
      [user_id, id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') { // composite PK already exists
      return res.status(409).json({ error: 'You are already a member of this club' });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to join club' });
  }
}

// DELETE /clubs/:id/join
// requires requireAuth anyone can leave clubs (except the president)
// removes the caller's own membership
async function leaveClub(req, res) {
  const { id } = req.params;
  const user_id = req.user.user_id;

  try {
    const membership = await pool.query(
      'SELECT role FROM memberships WHERE user_id = $1 AND club_id = $2',
      [user_id, id]
    );

    if (!membership.rows[0]) {
      return res.status(404).json({ error: 'You are not a member of this club' });
    }

    if (membership.rows[0].role === 'president') {
      return res.status(403).json({ error: 'The president cannot leave their club' }); // !! should add president transfership so prezzies can leave when they graduate...
    }

    await pool.query(
      'DELETE FROM memberships WHERE user_id = $1 AND club_id = $2',
      [user_id, id]
    );

    res.json({ message: 'Left club', club_id: Number(id) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to leave club' });
  }
}


module.exports = { listClubs, getClub, createClub, updateClub, deleteClub, joinClub, leaveClub };