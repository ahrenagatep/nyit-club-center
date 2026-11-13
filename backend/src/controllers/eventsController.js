// Club events and RSVPs (events + attendance tables, sql/004, 005, 016)
// GET routes are public; RSVP and "my events" need requireAuth + requireProfile;
// creating/editing needs officer/president of the club or admin (requireRole on /clubs/:id/events)

const pool = require('../config/db');
const { containsProfanity } = require('../utils/profanity');

const CATEGORIES = ['Academic', 'Sports', 'Arts', 'Tech', 'Social', 'Workshop']; // same list as sql/016
const LIMITS = { title: 150, location: 255, description: 5000 }; // title/location match the column sizes in sql/004
const ID_PATTERN = /^[1-9]\d{0,9}$/; // positive whole number that fits a BIGINT, so a bad id is a 400, not a DB error
// full date-time with a zone (Z or ±hh:mm), so the server's own time zone never matters
const ISO_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,6})?)?(Z|[+-]\d{2}:?\d{2})$/;
const MIN_YEAR = 2000; // rejects typos like 0202 before they reach Postgres
const MAX_YEAR = 2100;
const MAX_RANGE_DAYS = 93; // enough for any calendar month view, small enough to keep the query cheap
const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 200;
// attendance statuses that count as "going"; cancelled and no_show don't
const GOING = `('registered', 'checked_in')`;

// one event row as every endpoint returns it; attendee_count is one indexed count per row (no N+1)
const EVENT_SELECT = `
  SELECT e.event_id, e.club_id, c.name AS club_name, e.title, e.description, e.event_date, e.ends_at,
         e.location, COALESCE(e.category, c.category) AS category, a.attendee_count, e.created_at
  FROM events e
  JOIN clubs c ON c.club_id = e.club_id
  LEFT JOIN LATERAL (
    SELECT count(*)::int AS attendee_count FROM attendance att
    WHERE att.event_id = e.event_id AND att.status IN ${GOING}
  ) a ON true`;

// an event is over once its end time passes, or its start time when it has no end
const ENDED = 'COALESCE(e.ends_at, e.event_date) < now()';

const readId = (raw) => (ID_PATTERN.test(String(raw)) ? Number(raw) : null);

// returns a Date, or null if the value isn't an ISO date-time with a zone in a sane year
function readDate(raw) {
  if (typeof raw !== 'string' || !ISO_PATTERN.test(raw.trim())) return null;
  const date = new Date(raw.trim());
  if (Number.isNaN(date.getTime())) return null;
  const [y, m, d] = raw.trim().slice(0, 10).split('-').map(Number);
  const calendar = new Date(Date.UTC(y, m - 1, d));
  if (calendar.getUTCMonth() !== m - 1 || calendar.getUTCDate() !== d) return null; // e.g. Feb 31 rolls over
  const year = date.getUTCFullYear();
  return year >= MIN_YEAR && year <= MAX_YEAR ? date : null;
}

const DATE_HELP = 'an ISO 8601 date-time with a time zone, e.g. 2026-11-20T18:00:00-05:00';

// case-insensitive match ("workshop" → "Workshop"), null if not in the list
function normalizeCategory(value) {
  const wanted = String(value).trim().toLowerCase();
  return CATEGORIES.find((c) => c.toLowerCase() === wanted) || null;
}

// text field: trimmed; "" / null → null (an error when required); length + profanity checked
function readText(body, field, { required = false } = {}) {
  const raw = body[field];
  if (raw === undefined || raw === null || (typeof raw === 'string' && !raw.trim())) {
    return required ? { error: `${field} is required` } : { value: null };
  }
  if (typeof raw !== 'string') return { error: `${field} must be text` };
  const value = raw.trim();
  if (value.length > LIMITS[field]) return { error: `${field} must be ${LIMITS[field]} characters or fewer` };
  if (containsProfanity(value)) return { error: `${field} contains inappropriate language` };
  return { value };
}

// validates the event fields present in body; with partial = true (PUT) missing fields are skipped
function readEventFields(body, { partial = false } = {}) {
  const fields = {};

  for (const field of ['title', 'location', 'description']) {
    if (partial && !(field in body)) continue;
    const { value, error } = readText(body, field, { required: field === 'title' });
    if (error) return { error };
    fields[field] = value;
  }

  if (!partial || 'event_date' in body) {
    const date = readDate(body.event_date);
    if (!date) return { error: `event_date is required and must be ${DATE_HELP}` };
    fields.event_date = date;
  }

  if (!partial || 'ends_at' in body) {
    if (body.ends_at === undefined || body.ends_at === null || body.ends_at === '') {
      fields.ends_at = null;
    } else {
      const date = readDate(body.ends_at);
      if (!date) return { error: `ends_at must be ${DATE_HELP}` };
      fields.ends_at = date;
    }
  }

  if (!partial || 'category' in body) {
    if (body.category === undefined || body.category === null || body.category === '') {
      fields.category = null; // falls back to the club's category
    } else {
      const category = normalizeCategory(body.category);
      if (!category) return { error: `category must be one of: ${CATEGORIES.join(', ')}` };
      fields.category = category;
    }
  }

  return { fields };
}

// one event in the standard row shape, or null; db is the pool or a transaction client
async function fetchEvent(db, eventId) {
  const result = await db.query(`${EVENT_SELECT} WHERE e.event_id = $1`, [eventId]);
  return result.rows[0] || null;
}

// fresh "going" count after an RSVP change, so the app can update the number without refetching the event
async function attendeeCount(eventId) {
  const result = await pool.query(
    `SELECT count(*)::int AS n FROM attendance WHERE event_id = $1 AND status IN ${GOING}`,
    [eventId]
  );
  return result.rows[0].n;
}

// GET /events?from=&to=&club_id=&limit=
// no from/to: events that haven't ended, soonest first; from + to: event_date in [from, to), past included
async function listEvents(req, res) {
  const { from, to, club_id, limit } = req.query;
  const conditions = [];
  const values = [];

  if ((from === undefined) !== (to === undefined)) {
    return res.status(400).json({ error: 'from and to must be given together' });
  }

  if (from !== undefined) {
    const start = readDate(from);
    const end = readDate(to);
    if (!start || !end) return res.status(400).json({ error: `from and to must each be ${DATE_HELP}` });
    if (end <= start) return res.status(400).json({ error: 'to must be after from' });
    if (end - start > MAX_RANGE_DAYS * 24 * 60 * 60 * 1000) {
      return res.status(400).json({ error: `The date range can be at most ${MAX_RANGE_DAYS} days` });
    }
    values.push(start, end);
    conditions.push(`e.event_date >= $1 AND e.event_date < $2`); // $1/$2: these are always the first two values
  } else {
    conditions.push(`NOT (${ENDED})`);
  }

  if (club_id !== undefined) {
    const clubId = readId(club_id);
    if (!clubId) return res.status(400).json({ error: 'club_id must be a positive whole number' });
    values.push(clubId);
    conditions.push(`e.club_id = $${values.length}`);
  }

  let max = DEFAULT_LIMIT;
  if (limit !== undefined) {
    max = readId(limit);
    if (!max || max > MAX_LIMIT) return res.status(400).json({ error: `limit must be between 1 and ${MAX_LIMIT}` });
  }
  values.push(max);

  try {
    const result = await pool.query(
      `${EVENT_SELECT}
       WHERE ${conditions.join(' AND ')}
       ORDER BY e.event_date, e.event_id
       LIMIT $${values.length}`,
      values
    );
    res.json({ events: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
}

// GET /events/:id
async function getEvent(req, res) {
  const eventId = readId(req.params.id);
  if (!eventId) return res.status(400).json({ error: 'Invalid event id' });

  try {
    const event = await fetchEvent(pool, eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json({ event });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
}

// GET /users/me/events: the caller's RSVP'd events that haven't ended, soonest first
async function listMyEvents(req, res) {
  try {
    const result = await pool.query(
      `${EVENT_SELECT}
       JOIN attendance mine ON mine.event_id = e.event_id AND mine.user_id = $1 AND mine.status IN ${GOING}
       WHERE NOT (${ENDED})
       ORDER BY e.event_date, e.event_id`,
      [req.user.user_id]
    );
    res.json({ events: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch your events' });
  }
}

// 404 / 409 checks shared by RSVP and cancel; returns null when the response was already sent
async function findOpenEvent(req, res) {
  const eventId = readId(req.params.id);
  if (!eventId) {
    res.status(400).json({ error: 'Invalid event id' });
    return null;
  }
  const result = await pool.query(`SELECT e.event_id, ${ENDED} AS ended FROM events e WHERE e.event_id = $1`, [eventId]);
  const row = result.rows[0];
  if (!row) {
    res.status(404).json({ error: 'Event not found' });
    return null;
  }
  if (row.ended) {
    res.status(409).json({ error: 'This event has ended' });
    return null;
  }
  return eventId;
}

// POST /events/:id/rsvp: one atomic upsert (primary key user_id + event_id), so repeats never double-count
async function rsvp(req, res) {
  try {
    const eventId = await findOpenEvent(req, res);
    if (!eventId) return;

    // new row → registered; cancelled/no_show → registered again; registered/checked_in → left as is
    await pool.query(
      `INSERT INTO attendance (user_id, event_id, status) VALUES ($1, $2, 'registered')
       ON CONFLICT (user_id, event_id) DO UPDATE
         SET status = 'registered', registered_at = now(), checked_in_at = NULL
         WHERE attendance.status IN ('cancelled', 'no_show')`,
      [req.user.user_id, eventId]
    );

    res.json({ event_id: eventId, going: true, attendee_count: await attendeeCount(eventId) });
  } catch (err) {
    if (err.code === '23503') return res.status(404).json({ error: 'Event not found' }); // deleted meanwhile
    console.error(err);
    res.status(500).json({ error: 'Failed to RSVP' });
  }
}

// DELETE /events/:id/rsvp: registered → cancelled; no RSVP is fine (same 200)
async function cancelRsvp(req, res) {
  try {
    const eventId = await findOpenEvent(req, res);
    if (!eventId) return;

    // only 'registered' is cancelled; a checked-in record is attendance history, so it stays
    await pool.query(
      `UPDATE attendance SET status = 'cancelled'
       WHERE user_id = $1 AND event_id = $2 AND status = 'registered'`,
      [req.user.user_id, eventId]
    );

    res.json({ event_id: eventId, going: false, attendee_count: await attendeeCount(eventId) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to cancel RSVP' });
  }
}

// POST /clubs/:id/events (officer/president of the club, or admin)
async function createEvent(req, res) {
  const clubId = Number(req.params.id); // checked by validateClubId
  const { fields, error } = readEventFields(req.body || {});
  if (error) return res.status(400).json({ error });
  // checked here too (not just by the DB constraint) so the user gets a clear 400
  if (fields.ends_at && fields.ends_at <= fields.event_date) {
    return res.status(400).json({ error: 'ends_at must be after event_date' });
  }

  try {
    // admins pass requireRole for any id, so check the club exists to answer 404 instead of a FK error
    const club = await pool.query('SELECT 1 FROM clubs WHERE club_id = $1', [clubId]);
    if (!club.rows[0]) return res.status(404).json({ error: 'Club not found' });

    const inserted = await pool.query(
      `INSERT INTO events (club_id, title, description, event_date, ends_at, location, category)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING event_id`,
      [clubId, fields.title, fields.description, fields.event_date, fields.ends_at, fields.location, fields.category]
    );

    res.status(201).json({ event: await fetchEvent(pool, inserted.rows[0].event_id) });
  } catch (err) {
    if (err.code === '23503') return res.status(404).json({ error: 'Club not found' }); // deleted meanwhile
    console.error(err);
    res.status(500).json({ error: 'Failed to create event' });
  }
}

// PUT /clubs/:id/events/:eventId (same roles); body: any of the create fields
async function updateEvent(req, res) {
  const clubId = Number(req.params.id);
  const eventId = readId(req.params.eventId);
  if (!eventId) return res.status(400).json({ error: 'Invalid event id' });

  const body = req.body || {};
  const editable = ['title', 'event_date', 'ends_at', 'location', 'description', 'category'];
  if (!editable.some((field) => field in body)) {
    return res.status(400).json({ error: `Send at least one of: ${editable.join(', ')}` });
  }
  const { fields, error } = readEventFields(body, { partial: true });
  if (error) return res.status(400).json({ error });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // lock the row so the end-after-start check below can't race another edit;
    // club_id in the WHERE keeps an officer of club A from editing club B's event via /clubs/A/...
    const current = await client.query(
      'SELECT event_date, ends_at FROM events WHERE event_id = $1 AND club_id = $2 FOR UPDATE',
      [eventId, clubId]
    );
    if (!current.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Event not found in this club' });
    }

    // compare against the stored value for whichever date wasn't sent
    const start = fields.event_date ?? current.rows[0].event_date;
    const end = 'ends_at' in fields ? fields.ends_at : current.rows[0].ends_at;
    if (end && end <= start) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'ends_at must be after event_date' });
    }

    // column names come from readEventFields' fixed list (never from the request); values stay parameterized
    const columns = Object.keys(fields);
    await client.query(
      `UPDATE events SET ${columns.map((column, i) => `${column} = $${i + 2}`).join(', ')} WHERE event_id = $1`,
      [eventId, ...columns.map((column) => fields[column])]
    );
    await client.query('COMMIT');

    res.json({ event: await fetchEvent(pool, eventId) });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error(err);
    res.status(500).json({ error: 'Failed to update event' });
  } finally {
    client.release();
  }
}

// DELETE /clubs/:id/events/:eventId (same roles); its RSVPs go with it (ON DELETE CASCADE)
async function deleteEvent(req, res) {
  const clubId = Number(req.params.id);
  const eventId = readId(req.params.eventId);
  if (!eventId) return res.status(400).json({ error: 'Invalid event id' });

  try {
    // club_id match: requireRole only checked the club in the URL, so the event must belong to it
    const result = await pool.query(
      'DELETE FROM events WHERE event_id = $1 AND club_id = $2 RETURNING event_id',
      [eventId, clubId]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Event not found in this club' });
    res.json({ message: 'Event deleted', event_id: eventId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete event' });
  }
}

// before requireRole, which queries with req.params.id as the club id
function validateClubId(req, res, next) {
  if (!readId(req.params.id)) return res.status(400).json({ error: 'Invalid club id' });
  next();
}

module.exports = {
  listEvents, getEvent, listMyEvents, rsvp, cancelRsvp, createEvent, updateEvent, deleteEvent, validateClubId,
};
