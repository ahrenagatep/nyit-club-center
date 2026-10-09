// Skill Exchange posts: requests ("I need help with...") and offers ("I can help with...")
// requireAuth + requireProfile run first, so req.user.user_id is always set

const pool = require('../config/db');
const { SKILL_TAG_GROUPS, PREMADE_BY_KEY } = require('../utils/skillTags');
const { findProfaneField } = require('../utils/profanity');
const { notifyAgreementsEndedByDelete } = require('./skillEngagementsController');

// same limits as sql/013
const LIMITS = { title: 100, description: 2000, extras: 500, location: 150, tag: 30 };
const MAX_TAGS = 10;
const MAX_SLOTS = 100; // the app expands "repeat weekly" into one slot per week
const MAX_SLOT_SPAN_MS = 366 * 24 * 60 * 60 * 1000;
const TAG_PATTERN = /^[\p{L}\p{N} &+#./'-]+$/u; // allows "C++", "C#", "Node.js", "HTML & CSS"
const ID_PATTERN = /^[1-9]\d{0,9}$/;

const STATUSES = { request: ['open', 'closed', 'complete'], offer: ['available', 'unavailable'] };
const NEW_STATUS = { request: 'open', offer: 'available' };
// what the lists show when no status filter is given (completed requests leave the tab)
const LISTED_STATUSES = { request: ['open', 'closed'], offer: ['available', 'unavailable'] };

const CREATE_FIELDS = ['kind', 'title', 'description', 'extras', 'location', 'location_flexible', 'tags', 'slots'];
const EDITABLE_FIELDS = ['description', 'extras', 'tags', 'status'];
const LOCKED_FIELDS = ['kind', 'title', 'location', 'location_flexible', 'slots'];

const FIELD_LABELS = { title: 'Title', description: 'Description', extras: 'Additional information', location: 'Location', tags: 'Tags' };
const profanityError = (field) =>
  `${FIELD_LABELS[field]} contains language that isn't allowed. Please remove it and try again.`;

// one post with its author, tags, counts, and next dates; ids are cast to int so the app gets numbers
const POST_COLUMNS = `
  p.post_id::int AS post_id, p.kind, p.title, p.description, p.extras, p.location,
  p.location_flexible, p.status, p.created_at, p.updated_at,
  json_build_object(
    'user_id', u.user_id::int, 'username', u.username, 'first_name', u.first_name,
    'last_name', u.last_name, 'nyit_email', u.nyit_email,
    'kudos', (SELECT count(*)::int FROM kudos k WHERE k.receiver_id = u.user_id)
  ) AS author,
  COALESCE((SELECT json_agg(t.tag ORDER BY lower(t.tag)) FROM skill_post_tags t WHERE t.post_id = p.post_id), '[]'::json) AS tags,
  (SELECT count(*)::int FROM skill_comments c WHERE c.post_id = p.post_id) AS comment_count,
  -- for the list cards: the next 3 dates that haven't ended, and how many there are in all
  COALESCE((SELECT json_agg(json_build_object('starts_at', u.starts_at, 'ends_at', u.ends_at) ORDER BY u.starts_at)
            FROM (SELECT s.starts_at, s.ends_at FROM skill_post_slots s
                  WHERE s.post_id = p.post_id AND s.ends_at > now() ORDER BY s.starts_at LIMIT 3) u), '[]'::json) AS upcoming_slots,
  (SELECT count(*)::int FROM skill_post_slots s WHERE s.post_id = p.post_id AND s.ends_at > now()) AS upcoming_slot_count`;

const SLOT_COLUMN = `
  COALESCE((SELECT json_agg(json_build_object('slot_id', s.slot_id::int, 'starts_at', s.starts_at, 'ends_at', s.ends_at)
                            ORDER BY s.starts_at)
            FROM skill_post_slots s WHERE s.post_id = p.post_id), '[]'::json) AS slots`;

const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

// text field: trimmed; "" or null becomes null (an error if required)
function readText(body, field, { required = false } = {}) {
  const raw = body[field];

  if (raw === undefined || raw === null || (typeof raw === 'string' && !raw.trim())) {
    return required ? { error: `${FIELD_LABELS[field]} is required` } : { value: null };
  }
  if (typeof raw !== 'string') {
    return { error: `${field} must be text` };
  }

  const value = raw.trim();
  if (value.length > LIMITS[field]) {
    return { error: `${FIELD_LABELS[field]} must be ${LIMITS[field]} characters or fewer` };
  }
  return { value };
}

// tags: 1–10, each 1–30 characters; premade tags keep their premade spelling; duplicates dropped
function readTags(raw) {
  if (raw === undefined || raw === null) {
    return { error: 'Add at least one tag' };
  }
  if (!Array.isArray(raw)) {
    return { error: 'tags must be a list' };
  }

  const tags = [];
  const seen = new Set();

  for (const item of raw) {
    if (typeof item !== 'string') {
      return { error: 'Each tag must be text' };
    }
    const cleaned = item.trim().replace(/\s+/g, ' ');
    if (!cleaned) continue;
    if (cleaned.length > LIMITS.tag) {
      return { error: `Each tag must be ${LIMITS.tag} characters or fewer` };
    }
    if (!TAG_PATTERN.test(cleaned)) {
      return { error: `Tag "${cleaned}" can only use letters, numbers, spaces, and & + # . / ' -` };
    }
    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    tags.push(PREMADE_BY_KEY.get(key) || cleaned);
  }

  if (!tags.length) {
    return { error: 'Add at least one tag' };
  }
  if (tags.length > MAX_TAGS) {
    return { error: `Use ${MAX_TAGS} tags or fewer` };
  }
  return { tags };
}

// slots: 1–100 { starts_at, ends_at } ISO times; each must end in the future, within a year
function readSlots(raw) {
  if (!Array.isArray(raw) || !raw.length) {
    return { error: 'Pick at least one date' };
  }
  if (raw.length > MAX_SLOTS) {
    return { error: `Pick ${MAX_SLOTS} dates or fewer` };
  }

  const now = Date.now();
  const unique = new Map();

  for (const slot of raw) {
    if (!isPlainObject(slot) || typeof slot.starts_at !== 'string' || typeof slot.ends_at !== 'string') {
      return { error: 'Each date needs starts_at and ends_at times' };
    }
    const starts = new Date(slot.starts_at);
    const ends = new Date(slot.ends_at);

    if (Number.isNaN(starts.getTime()) || Number.isNaN(ends.getTime())) {
      return { error: 'Dates must be valid ISO 8601 times' };
    }
    if (ends <= starts) {
      return { error: 'Each date must end after it starts' };
    }
    if (ends.getTime() <= now) {
      return { error: 'Dates must be in the future' };
    }
    if (starts.getTime() > now + MAX_SLOT_SPAN_MS || ends - starts > MAX_SLOT_SPAN_MS) {
      return { error: 'Dates must be within the next year' };
    }
    unique.set(`${starts.toISOString()}|${ends.toISOString()}`, { starts, ends });
  }

  const slots = [...unique.values()].sort((a, b) => a.starts - b.starts);
  return { slots };
}

function readId(raw) {
  return ID_PATTERN.test(String(raw)) ? Number(raw) : null;
}

async function fetchPost(db, postId) {
  const result = await db.query(
    `SELECT ${POST_COLUMNS}, ${SLOT_COLUMN}
     FROM skill_posts p JOIN users u ON u.user_id = p.user_id
     WHERE p.post_id = $1`,
    [postId]
  );
  return result.rows[0] || null;
}

const withOwner = (post, req) => ({ ...post, is_owner: post.author.user_id === Number(req.user.user_id) });

// GET /skill-exchange/tags
function listTags(req, res) {
  res.json({ groups: SKILL_TAG_GROUPS });
}

// GET /skill-exchange/posts?kind=request|offer&q=&tags=a,b&status=&mine=true&sort=newest|oldest|soonest&limit=&offset=
// q matches every word against title, description, extras, tags, and the poster's name;
// tags matches posts with any of the given tags (case-insensitive)
async function listPosts(req, res) {
  const { kind, q, status, mine, sort = 'newest' } = req.query;

  if (!STATUSES[kind]) {
    return res.status(400).json({ error: 'kind must be request or offer' });
  }
  if (!['newest', 'oldest', 'soonest'].includes(sort)) {
    return res.status(400).json({ error: 'sort must be newest, oldest, or soonest' });
  }

  const limit = req.query.limit === undefined ? 20 : Number(req.query.limit);
  const offset = req.query.offset === undefined ? 0 : Number(req.query.offset);
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
    return res.status(400).json({ error: 'limit must be a whole number from 1 to 50' });
  }
  if (!Number.isInteger(offset) || offset < 0 || offset > 10000) {
    return res.status(400).json({ error: 'offset must be a whole number from 0 to 10000' });
  }

  const onlyMine = mine === 'true';
  const conditions = ['p.kind = $1'];
  const values = [kind];

  if (status !== undefined) {
    if (!STATUSES[kind].includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${STATUSES[kind].join(', ')}` });
    }
    values.push(status);
    conditions.push(`p.status = $${values.length}`);
  } else if (!onlyMine) {
    values.push(LISTED_STATUSES[kind]);
    conditions.push(`p.status = ANY($${values.length}::text[])`);
  }

  if (onlyMine) {
    values.push(req.user.user_id);
    conditions.push(`p.user_id = $${values.length}`);
  }

  if (q !== undefined) {
    if (typeof q !== 'string' || q.length > 100) {
      return res.status(400).json({ error: 'q must be text of 100 characters or fewer' });
    }
    const words = q.trim().split(/\s+/).filter(Boolean).slice(0, 8);
    for (const word of words) {
      values.push(`%${word.replace(/[\\%_]/g, '\\$&')}%`);
      const n = values.length;
      conditions.push(`(p.title ILIKE $${n} OR p.description ILIKE $${n} OR p.extras ILIKE $${n}
        OR u.first_name ILIKE $${n} OR u.last_name ILIKE $${n} OR u.username ILIKE $${n}
        OR EXISTS (SELECT 1 FROM skill_post_tags t WHERE t.post_id = p.post_id AND t.tag ILIKE $${n}))`);
    }
  }

  if (req.query.tags !== undefined) {
    const raw = Array.isArray(req.query.tags) ? req.query.tags : [req.query.tags];
    if (raw.some((tag) => typeof tag !== 'string')) {
      return res.status(400).json({ error: 'tags must be a comma-separated list' });
    }
    const tags = [...new Set(raw.flatMap((tag) => tag.split(',')).map((tag) => tag.trim().toLowerCase()).filter(Boolean))];
    if (tags.length > MAX_TAGS) {
      return res.status(400).json({ error: `Filter by ${MAX_TAGS} tags or fewer` });
    }
    if (tags.length) {
      values.push(tags);
      conditions.push(`EXISTS (SELECT 1 FROM skill_post_tags t WHERE t.post_id = p.post_id AND lower(t.tag) = ANY($${values.length}::text[]))`);
    }
  }

  const orderBy = {
    newest: 'p.created_at DESC, p.post_id DESC',
    oldest: 'p.created_at ASC, p.post_id ASC',
    // the soonest date that hasn't ended yet; posts with none go last
    soonest: `(SELECT min(s.starts_at) FROM skill_post_slots s WHERE s.post_id = p.post_id AND s.ends_at > now()) ASC NULLS LAST,
              p.created_at DESC`,
  }[sort];

  values.push(limit + 1, offset); // one extra row tells us whether there's another page

  try {
    const result = await pool.query(
      `SELECT ${POST_COLUMNS}
       FROM skill_posts p JOIN users u ON u.user_id = p.user_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY ${orderBy}
       LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );

    const posts = result.rows.slice(0, limit).map((post) => withOwner(post, req));
    res.json({ posts, limit, offset, has_more: result.rows.length > limit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load posts' });
  }
}

// GET /skill-exchange/posts/:id (completed requests stay reachable here)
// also: busy (an offer's booked times, without names) and my_engagement (the viewer's
// pending or accepted response to this post, or null)
async function getPost(req, res) {
  const postId = readId(req.params.id);
  if (!postId) {
    return res.status(400).json({ error: 'Invalid post id' });
  }

  try {
    const [post, busy, mine] = await Promise.all([
      fetchPost(pool, postId),
      pool.query(
        `SELECT starts_at, ends_at FROM skill_engagements
         WHERE post_id = $1 AND status = 'accepted' AND ends_at > now() ORDER BY starts_at`,
        [postId]
      ),
      pool.query(
        `SELECT engagement_id::int AS engagement_id, status, starts_at, ends_at, location
         FROM skill_engagements
         WHERE post_id = $1 AND user_id = $2 AND status IN ('pending', 'accepted')
         ORDER BY created_at DESC LIMIT 1`,
        [postId, req.user.user_id]
      ),
    ]);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json({
      post: {
        ...withOwner(post, req),
        busy: post.kind === 'offer' ? busy.rows : [],
        my_engagement: mine.rows[0] || null,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load post' });
  }
}

// POST /skill-exchange/posts
async function createPost(req, res) {
  const body = req.body;

  if (!isPlainObject(body)) {
    return res.status(400).json({ error: 'Request body must be a JSON object' });
  }

  const unknown = Object.keys(body).filter((field) => !CREATE_FIELDS.includes(field));
  if (unknown.length) {
    return res.status(400).json({ error: `Unknown fields: ${unknown.join(', ')}` });
  }

  const { kind } = body;
  if (!STATUSES[kind]) {
    return res.status(400).json({ error: 'kind must be request or offer' });
  }

  const title = readText(body, 'title', { required: true });
  const description = readText(body, 'description', { required: true });
  const extras = readText(body, 'extras');
  const location = readText(body, 'location');
  const firstError = [title, description, extras, location].find((field) => field.error);
  if (firstError) {
    return res.status(400).json({ error: firstError.error });
  }

  if (body.location_flexible !== undefined && typeof body.location_flexible !== 'boolean') {
    return res.status(400).json({ error: 'location_flexible must be true or false' });
  }

  const tags = readTags(body.tags);
  if (tags.error) {
    return res.status(400).json({ error: tags.error });
  }
  const slots = readSlots(body.slots);
  if (slots.error) {
    return res.status(400).json({ error: slots.error });
  }

  const profane = findProfaneField({
    title: title.value, description: description.value, extras: extras.value, location: location.value, tags: tags.tags,
  });
  if (profane) {
    return res.status(400).json({ error: profanityError(profane) });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const inserted = await client.query(
      `INSERT INTO skill_posts (user_id, kind, title, description, extras, location, location_flexible, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING post_id`,
      [req.user.user_id, kind, title.value, description.value, extras.value, location.value,
        body.location_flexible === true, NEW_STATUS[kind]]
    );
    const postId = inserted.rows[0].post_id;

    await client.query(
      'INSERT INTO skill_post_tags (post_id, tag) SELECT $1, unnest($2::text[])',
      [postId, tags.tags]
    );
    await client.query(
      `INSERT INTO skill_post_slots (post_id, starts_at, ends_at)
       SELECT $1, starts_at, ends_at FROM unnest($2::timestamptz[], $3::timestamptz[]) AS s(starts_at, ends_at)`,
      [postId, slots.slots.map((slot) => slot.starts.toISOString()), slots.slots.map((slot) => slot.ends.toISOString())]
    );

    const post = await fetchPost(client, postId);
    await client.query('COMMIT');
    res.status(201).json({ message: 'Post created', post: withOwner(post, req) });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error(err);
    res.status(500).json({ error: 'Failed to create post' });
  } finally {
    client.release();
  }
}

// PATCH /skill-exchange/posts/:id (owner only)
// title, location, and dates are locked after posting; a request's status only
// changes through its agreements, an offer's owner switches available/unavailable
async function updatePost(req, res) {
  const postId = readId(req.params.id);
  if (!postId) {
    return res.status(400).json({ error: 'Invalid post id' });
  }

  const body = req.body;
  if (!isPlainObject(body)) {
    return res.status(400).json({ error: 'Request body must be a JSON object' });
  }

  const fields = Object.keys(body);
  const locked = fields.filter((field) => LOCKED_FIELDS.includes(field));
  if (locked.length) {
    return res.status(400).json({ error: `${locked.join(', ')} can't be changed after posting` });
  }
  const unknown = fields.filter((field) => !EDITABLE_FIELDS.includes(field));
  if (unknown.length) {
    return res.status(400).json({ error: `Unknown fields: ${unknown.join(', ')}. You can update: ${EDITABLE_FIELDS.join(', ')}` });
  }
  if (!fields.length) {
    return res.status(400).json({ error: `Nothing to update. Send any of: ${EDITABLE_FIELDS.join(', ')}` });
  }

  const sets = [];
  const values = [];
  const checks = {};

  for (const field of ['description', 'extras']) {
    if (!(field in body)) continue;
    const text = readText(body, field, { required: field === 'description' });
    if (text.error) {
      return res.status(400).json({ error: text.error });
    }
    checks[field] = text.value;
    values.push(text.value);
    sets.push(`${field} = $${values.length}`); // field names come from the fixed list above
  }

  let tags = null;
  if ('tags' in body) {
    const read = readTags(body.tags);
    if (read.error) {
      return res.status(400).json({ error: read.error });
    }
    tags = read.tags;
    checks.tags = tags;
  }

  const profane = findProfaneField(checks);
  if (profane) {
    return res.status(400).json({ error: profanityError(profane) });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existing = await client.query('SELECT user_id, kind FROM skill_posts WHERE post_id = $1 FOR UPDATE', [postId]);
    const row = existing.rows[0];
    if (!row) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Post not found' });
    }
    if (String(row.user_id) !== String(req.user.user_id)) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Only the poster can edit this post' });
    }

    if ('status' in body) {
      if (row.kind !== 'offer') {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: "A request's status changes when someone agrees to help or it's marked complete" });
      }
      if (!STATUSES.offer.includes(body.status)) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'status must be available or unavailable' });
      }
      values.push(body.status);
      sets.push(`status = $${values.length}`);
    }

    values.push(postId);
    await client.query(
      `UPDATE skill_posts SET ${[...sets, 'updated_at = now()'].join(', ')} WHERE post_id = $${values.length}`,
      values
    );

    if (tags) {
      await client.query('DELETE FROM skill_post_tags WHERE post_id = $1', [postId]);
      await client.query('INSERT INTO skill_post_tags (post_id, tag) SELECT $1, unnest($2::text[])', [postId, tags]);
    }

    const post = await fetchPost(client, postId);
    await client.query('COMMIT');
    res.json({ message: 'Post updated', post: withOwner(post, req) });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error(err);
    res.status(500).json({ error: 'Failed to update post' });
  } finally {
    client.release();
  }
}

// DELETE /skill-exchange/posts/:id (owner or admin); tags, dates, comments, and
// agreements go with it; Kudos already given are kept; people with an accepted
// agreement are told it's off
async function deletePost(req, res) {
  const postId = readId(req.params.id);
  if (!postId) {
    return res.status(400).json({ error: 'Invalid post id' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const existing = await client.query('SELECT post_id, user_id, kind, title FROM skill_posts WHERE post_id = $1 FOR UPDATE', [postId]);
    const row = existing.rows[0];
    if (!row) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Post not found' });
    }
    if (String(row.user_id) !== String(req.user.user_id) && req.user.role !== 'admin') {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Only the poster or an admin can delete this post' });
    }

    await notifyAgreementsEndedByDelete(client, row, req.user.user_id);
    await client.query('DELETE FROM skill_posts WHERE post_id = $1', [postId]);
    await client.query('COMMIT');
    res.json({ message: 'Post deleted', post_id: postId });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error(err);
    res.status(500).json({ error: 'Failed to delete post' });
  } finally {
    client.release();
  }
}

// GET /skill-exchange/summary → the signed-in user's own numbers for Profile:
// { post_count, request_count, offer_count, kudos, recent: [{ post_id, kind, title, status, created_at }] (3) }
async function getSummary(req, res) {
  try {
    const [counts, recent] = await Promise.all([
      pool.query(
        `SELECT count(*)::int AS post_count,
                count(*) FILTER (WHERE kind = 'request')::int AS request_count,
                count(*) FILTER (WHERE kind = 'offer')::int AS offer_count,
                (SELECT count(*)::int FROM kudos WHERE receiver_id = $1) AS kudos
         FROM skill_posts WHERE user_id = $1`,
        [req.user.user_id]
      ),
      pool.query(
        `SELECT post_id::int AS post_id, kind, title, status, created_at
         FROM skill_posts WHERE user_id = $1 ORDER BY created_at DESC, post_id DESC LIMIT 3`,
        [req.user.user_id]
      ),
    ]);
    res.json({ ...counts.rows[0], recent: recent.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load your Skill Exchange summary' });
  }
}

module.exports = { listTags, listPosts, getPost, createPost, updatePost, deletePost, getSummary };
