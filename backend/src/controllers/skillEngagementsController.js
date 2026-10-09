// Skill Exchange agreements ("engagements"): someone expresses interest in a post, the
// poster accepts or declines, and either side can cancel an accepted agreement.
//
// requests: open → (accept) closed → (cancel) open, or → (complete) complete; accepting closes
//           the other pending interests; the poster can give the helper Kudos
// offers:   stay available; an accepted time is blocked for others, and pending interests
//           that overlap it are closed; completing asks the other person for Kudos.
// Declines and those automatic closes are silent. One Kudos per agreement.
//
// Every state change locks the post row first (SELECT … FOR UPDATE), so two people can't
// book the same request or offer time at once.

const pool = require('../config/db');
const { findProfaneField } = require('../utils/profanity');
const { createNotification, snippet, displayName } = require('../utils/notifications');

const ID_PATTERN = /^[1-9]\d{0,9}$/;
const MAX_MESSAGE = 300; // same as sql/013
const MAX_LOCATION = 150;
const CAMPUS_TIME_ZONE = 'America/New_York';
const ACTIVE = ['pending', 'accepted'];

const readId = (raw) => (ID_PATTERN.test(String(raw)) ? Number(raw) : null);
const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

// "Mon, Oct 12, 2:00 PM – 3:00 PM" in campus time
function formatRange(startsAt, endsAt) {
  const starts = new Date(startsAt);
  const ends = new Date(endsAt);
  const day = (d) => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: CAMPUS_TIME_ZONE });
  const time = (d) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: CAMPUS_TIME_ZONE });
  return day(starts) === day(new Date(ends.getTime() - 1))
    ? `${day(starts)}, ${time(starts)} – ${time(ends)}`
    : `${day(starts)}, ${time(starts)} – ${day(ends)}, ${time(ends)}`;
}

// optional text: trimmed; "" or null → null
function readOptionalText(body, field, max, label) {
  const raw = body[field];
  if (raw === undefined || raw === null) return { value: null };
  if (typeof raw !== 'string') return { error: `${field} must be text` };
  const value = raw.trim();
  if (value.length > max) return { error: `${label} must be ${max} characters or fewer` };
  return { value: value || null };
}

function readBody(req, allowed) {
  const body = req.body === undefined ? {} : req.body;
  if (!isPlainObject(body)) return { error: 'Request body must be a JSON object' };
  const unknown = Object.keys(body).filter((field) => !allowed.includes(field));
  if (unknown.length) return { error: `Unknown fields: ${unknown.join(', ')}` };
  return { body };
}

const ENGAGEMENT_COLUMNS = `
  e.engagement_id::int AS engagement_id, e.post_id::int AS post_id, e.status, e.starts_at, e.ends_at,
  e.location, e.message, e.response_message, e.cancel_message, e.cancelled_by::int AS cancelled_by,
  e.kudos_requested_at, e.created_at, e.updated_at,
  EXISTS (SELECT 1 FROM kudos kg WHERE kg.engagement_id = e.engagement_id) AS kudos_given,
  json_build_object(
    'user_id', u.user_id::int, 'username', u.username, 'first_name', u.first_name,
    'last_name', u.last_name, 'nyit_email', u.nyit_email,
    'kudos', (SELECT count(*)::int FROM kudos k WHERE k.receiver_id = u.user_id)
  ) AS user,
  json_build_object(
    'post_id', p.post_id::int, 'kind', p.kind, 'title', p.title, 'status', p.status,
    'location', p.location, 'location_flexible', p.location_flexible,
    'author', json_build_object(
      'user_id', a.user_id::int, 'username', a.username, 'first_name', a.first_name,
      'last_name', a.last_name, 'nyit_email', a.nyit_email,
      'kudos', (SELECT count(*)::int FROM kudos k WHERE k.receiver_id = a.user_id)
    )
  ) AS post`;

const ENGAGEMENT_FROM = `
  FROM skill_engagements e
  JOIN users u ON u.user_id = e.user_id
  JOIN skill_posts p ON p.post_id = e.post_id
  JOIN users a ON a.user_id = p.user_id`;

function withRoles(engagement, req) {
  const me = Number(req.user.user_id);
  return { ...engagement, is_poster: engagement.post.author.user_id === me, is_requester: engagement.user.user_id === me };
}

async function fetchEngagement(db, engagementId) {
  const result = await db.query(`SELECT ${ENGAGEMENT_COLUMNS} ${ENGAGEMENT_FROM} WHERE e.engagement_id = $1`, [engagementId]);
  return result.rows[0] || null;
}

// the post row, locked for the rest of the transaction
async function lockPost(db, postId) {
  const result = await db.query(
    `SELECT p.post_id, p.user_id, p.kind, p.title, p.status, p.location, p.location_flexible,
            u.first_name, u.last_name, u.username, u.nyit_email
     FROM skill_posts p JOIN users u ON u.user_id = p.user_id
     WHERE p.post_id = $1 FOR UPDATE OF p`,
    [postId]
  );
  return result.rows[0] || null;
}

// the engagement + its post, both locked
async function lockEngagement(db, engagementId) {
  const found = await db.query('SELECT post_id FROM skill_engagements WHERE engagement_id = $1', [engagementId]);
  if (!found.rows[0]) return {};
  const post = await lockPost(db, found.rows[0].post_id);
  const result = await db.query(
    `SELECT e.engagement_id, e.post_id, e.user_id, e.status, e.starts_at, e.ends_at, e.location,
            u.first_name, u.last_name, u.username, u.nyit_email
     FROM skill_engagements e JOIN users u ON u.user_id = e.user_id
     WHERE e.engagement_id = $1 FOR UPDATE OF e`,
    [engagementId]
  );
  return { post, engagement: result.rows[0] || null };
}

async function respond(client, req, res, status, engagementId, message) {
  const engagement = await fetchEngagement(client, engagementId);
  await client.query('COMMIT');
  res.status(status).json({ message, engagement: withRoles(engagement, req) });
}

async function inTransaction(res, failMessage, work) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await work(client, async (status, error) => {
      await client.query('ROLLBACK');
      res.status(status).json({ error });
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error(err);
    if (!res.headersSent) res.status(500).json({ error: failMessage });
  } finally {
    client.release();
  }
}

// POST /skill-exchange/posts/:id/interest  body: { starts_at, ends_at, location?, message? }
async function expressInterest(req, res) {
  const postId = readId(req.params.id);
  if (!postId) return res.status(400).json({ error: 'Invalid post id' });

  const read = readBody(req, ['starts_at', 'ends_at', 'location', 'message']);
  if (read.error) return res.status(400).json({ error: read.error });
  const { body } = read;

  if (typeof body.starts_at !== 'string' || typeof body.ends_at !== 'string') {
    return res.status(400).json({ error: 'Pick a start and end time' });
  }
  const starts = new Date(body.starts_at);
  const ends = new Date(body.ends_at);
  if (Number.isNaN(starts.getTime()) || Number.isNaN(ends.getTime())) {
    return res.status(400).json({ error: 'Times must be valid ISO 8601 times' });
  }
  if (ends <= starts) return res.status(400).json({ error: 'The end time must be after the start time' });
  if (starts.getTime() < Date.now() - 60 * 1000) return res.status(400).json({ error: "Pick a time that hasn't started yet" });

  const location = readOptionalText(body, 'location', MAX_LOCATION, 'Location');
  const message = readOptionalText(body, 'message', MAX_MESSAGE, 'Message');
  const textError = [location, message].find((t) => t.error);
  if (textError) return res.status(400).json({ error: textError.error });
  const profane = findProfaneField({ Location: location.value, Message: message.value });
  if (profane) return res.status(400).json({ error: `${profane} contains language that isn't allowed. Please remove it and try again.` });

  await inTransaction(res, 'Failed to send interest', async (client, fail) => {
    const post = await lockPost(client, postId);
    if (!post) return fail(404, 'Post not found');
    if (String(post.user_id) === String(req.user.user_id)) return fail(403, "You can't respond to your own post");
    if (post.kind === 'request' && post.status !== 'open') return fail(409, 'This request is closed');
    if (post.kind === 'offer' && post.status !== 'available') return fail(409, "This offer isn't available right now");

    const mine = await client.query(
      'SELECT status FROM skill_engagements WHERE post_id = $1 AND user_id = $2 AND status = ANY($3::text[])',
      [postId, req.user.user_id, ACTIVE]
    );
    if (mine.rows[0]) {
      return fail(409, mine.rows[0].status === 'pending'
        ? "You've already sent your interest. Withdraw it to pick a different time."
        : "You're already set up for this post.");
    }

    // the whole time must fit inside one of the poster's dates
    const fits = await client.query(
      'SELECT 1 FROM skill_post_slots WHERE post_id = $1 AND starts_at <= $2 AND ends_at >= $3 LIMIT 1',
      [postId, starts.toISOString(), ends.toISOString()]
    );
    if (!fits.rows[0]) return fail(400, "That time isn't within the poster's dates. Pick a time inside one of them.");

    if (post.kind === 'offer') {
      const busy = await client.query(
        `SELECT 1 FROM skill_engagements
         WHERE post_id = $1 AND status = 'accepted' AND starts_at < $3 AND ends_at > $2 LIMIT 1`,
        [postId, starts.toISOString(), ends.toISOString()]
      );
      if (busy.rows[0]) return fail(409, 'Someone already booked part of that time. Pick another time.');
    }

    // a different place only when the poster's location is flexible or empty
    let place = post.location;
    if (location.value && location.value !== post.location) {
      if (post.location && !post.location_flexible) {
        return fail(400, "This post's location isn't flexible");
      }
      place = location.value;
    }

    const inserted = await client.query(
      `INSERT INTO skill_engagements (post_id, user_id, starts_at, ends_at, location, message)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING engagement_id`,
      [postId, req.user.user_id, starts.toISOString(), ends.toISOString(), place, message.value]
    );
    const engagementId = inserted.rows[0].engagement_id;

    const name = displayName(req.user);
    await createNotification(client, {
      userId: post.user_id,
      type: 'skill_interest',
      title: post.kind === 'request' ? `${name} can help with your request` : `${name} would like your offer`,
      message: `"${snippet(post.title, 60)}" · ${formatRange(starts, ends)}${place ? ` · ${place}` : ''}${
        message.value ? ` · "${snippet(message.value, 120)}"` : ''
      }. Tap to accept or decline.`,
      actorId: req.user.user_id,
      postId,
      engagementId,
    });

    await respond(client, req, res, 201, engagementId, 'Interest sent');
  });
}

// GET /skill-exchange/posts/:id/engagements → { engagements }
// the poster sees everyone's (pending first); anyone else sees only their own
async function listPostEngagements(req, res) {
  const postId = readId(req.params.id);
  if (!postId) return res.status(400).json({ error: 'Invalid post id' });

  try {
    const post = await pool.query('SELECT user_id FROM skill_posts WHERE post_id = $1', [postId]);
    if (!post.rows[0]) return res.status(404).json({ error: 'Post not found' });
    const isPoster = String(post.rows[0].user_id) === String(req.user.user_id);

    const result = await pool.query(
      `SELECT ${ENGAGEMENT_COLUMNS} ${ENGAGEMENT_FROM}
       WHERE e.post_id = $1 ${isPoster ? '' : 'AND e.user_id = $2'}
       ORDER BY CASE e.status WHEN 'pending' THEN 0 WHEN 'accepted' THEN 1 ELSE 2 END, e.starts_at, e.engagement_id
       LIMIT 200`,
      isPoster ? [postId] : [postId, req.user.user_id]
    );
    res.json({ engagements: result.rows.map((e) => withRoles(e, req)) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load responses' });
  }
}

// GET /skill-exchange/engagements/:id (the poster, the person who responded, or an admin)
async function getEngagement(req, res) {
  const engagementId = readId(req.params.id);
  if (!engagementId) return res.status(400).json({ error: 'Invalid engagement id' });

  try {
    const engagement = await fetchEngagement(pool, engagementId);
    if (!engagement) return res.status(404).json({ error: 'Not found' });
    const roles = withRoles(engagement, req);
    if (!roles.is_poster && !roles.is_requester && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only the two people involved can see this' });
    }
    res.json({ engagement: roles });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load' });
  }
}

// POST /skill-exchange/engagements/:id/accept  body: { message? } (poster only)
async function acceptEngagement(req, res) {
  const engagementId = readId(req.params.id);
  if (!engagementId) return res.status(400).json({ error: 'Invalid engagement id' });
  const read = readBody(req, ['message']);
  if (read.error) return res.status(400).json({ error: read.error });
  const message = readOptionalText(read.body, 'message', MAX_MESSAGE, 'Message');
  if (message.error) return res.status(400).json({ error: message.error });
  if (findProfaneField({ Message: message.value })) {
    return res.status(400).json({ error: "Message contains language that isn't allowed. Please remove it and try again." });
  }

  await inTransaction(res, 'Failed to accept', async (client, fail) => {
    const { post, engagement } = await lockEngagement(client, engagementId);
    if (!engagement) return fail(404, 'Not found');
    if (String(post.user_id) !== String(req.user.user_id)) return fail(403, 'Only the poster can accept');
    if (engagement.status !== 'pending') return fail(409, `This was already ${engagement.status}`);
    if (new Date(engagement.ends_at).getTime() <= Date.now()) return fail(409, 'That time has already passed');
    if (post.kind === 'request' && post.status !== 'open') return fail(409, 'This request is already closed. Cancel the current agreement first.');

    if (post.kind === 'offer') {
      const clash = await client.query(
        `SELECT 1 FROM skill_engagements
         WHERE post_id = $1 AND status = 'accepted' AND starts_at < $3 AND ends_at > $2 LIMIT 1`,
        [post.post_id, engagement.starts_at, engagement.ends_at]
      );
      if (clash.rows[0]) return fail(409, 'You already accepted someone for part of that time');
    }

    await client.query(
      `UPDATE skill_engagements SET status = 'accepted', response_message = $2, updated_at = now() WHERE engagement_id = $1`,
      [engagementId, message.value]
    );

    // close the others silently: every other pending one on a request, overlapping ones on an offer
    if (post.kind === 'request') {
      await client.query(`UPDATE skill_posts SET status = 'closed', updated_at = now() WHERE post_id = $1`, [post.post_id]);
      await client.query(
        `UPDATE skill_engagements SET status = 'declined', updated_at = now()
         WHERE post_id = $1 AND status = 'pending' AND engagement_id <> $2`,
        [post.post_id, engagementId]
      );
    } else {
      await client.query(
        `UPDATE skill_engagements SET status = 'declined', updated_at = now()
         WHERE post_id = $1 AND status = 'pending' AND engagement_id <> $2 AND starts_at < $4 AND ends_at > $3`,
        [post.post_id, engagementId, engagement.starts_at, engagement.ends_at]
      );
    }

    const when = formatRange(engagement.starts_at, engagement.ends_at);
    const where = engagement.location ? ` · ${engagement.location}` : '';
    const postTitle = snippet(post.title, 60);
    const posterName = displayName(post);
    const requesterName = displayName(engagement);

    // both people get the other's contact details
    await createNotification(client, {
      userId: engagement.user_id,
      type: 'skill_accepted',
      title: `${posterName} accepted! You're all set`,
      message: `"${postTitle}" · ${when}${where}. Contact ${posterName} at ${post.nyit_email}.${
        message.value ? ` Their message: "${snippet(message.value, 120)}"` : ''
      }`,
      actorId: post.user_id,
      postId: post.post_id,
      engagementId,
    });
    await createNotification(client, {
      userId: post.user_id,
      type: 'skill_accepted',
      title: `You're all set with ${requesterName}`,
      message: `"${postTitle}" · ${when}${where}. Contact ${requesterName} at ${engagement.nyit_email}.`,
      actorId: engagement.user_id,
      postId: post.post_id,
      engagementId,
    });

    await respond(client, req, res, 200, engagementId, 'Accepted');
  });
}

// POST /skill-exchange/engagements/:id/decline  body: { message? } (poster only)
// the other person is told only if there's a message
async function declineEngagement(req, res) {
  const engagementId = readId(req.params.id);
  if (!engagementId) return res.status(400).json({ error: 'Invalid engagement id' });
  const read = readBody(req, ['message']);
  if (read.error) return res.status(400).json({ error: read.error });
  const message = readOptionalText(read.body, 'message', MAX_MESSAGE, 'Message');
  if (message.error) return res.status(400).json({ error: message.error });
  if (findProfaneField({ Message: message.value })) {
    return res.status(400).json({ error: "Message contains language that isn't allowed. Please remove it and try again." });
  }

  await inTransaction(res, 'Failed to decline', async (client, fail) => {
    const { post, engagement } = await lockEngagement(client, engagementId);
    if (!engagement) return fail(404, 'Not found');
    if (String(post.user_id) !== String(req.user.user_id)) return fail(403, 'Only the poster can decline');
    if (engagement.status !== 'pending') return fail(409, `This was already ${engagement.status}`);

    await client.query(
      `UPDATE skill_engagements SET status = 'declined', response_message = $2, updated_at = now() WHERE engagement_id = $1`,
      [engagementId, message.value]
    );

    if (message.value) {
      await createNotification(client, {
        userId: engagement.user_id,
        type: 'skill_declined',
        title: `${displayName(post)} replied to your interest`,
        message: `On "${snippet(post.title, 60)}": "${snippet(message.value, 150)}"`,
        actorId: post.user_id,
        postId: post.post_id,
        engagementId,
      });
    }

    await respond(client, req, res, 200, engagementId, 'Declined');
  });
}

// POST /skill-exchange/engagements/:id/cancel  body: { message? }
// accepted: either person can cancel; the other is told; a request goes back to open
// pending: the person who sent it can withdraw it (silently)
async function cancelEngagement(req, res) {
  const engagementId = readId(req.params.id);
  if (!engagementId) return res.status(400).json({ error: 'Invalid engagement id' });
  const read = readBody(req, ['message']);
  if (read.error) return res.status(400).json({ error: read.error });
  const message = readOptionalText(read.body, 'message', MAX_MESSAGE, 'Message');
  if (message.error) return res.status(400).json({ error: message.error });
  if (findProfaneField({ Message: message.value })) {
    return res.status(400).json({ error: "Message contains language that isn't allowed. Please remove it and try again." });
  }

  await inTransaction(res, 'Failed to cancel', async (client, fail) => {
    const { post, engagement } = await lockEngagement(client, engagementId);
    if (!engagement) return fail(404, 'Not found');
    const me = String(req.user.user_id);
    const iAmPoster = String(post.user_id) === me;
    const iAmRequester = String(engagement.user_id) === me;
    if (!iAmPoster && !iAmRequester) return fail(403, 'Only the two people involved can cancel');

    if (engagement.status === 'pending') {
      if (!iAmRequester) return fail(409, 'Decline it instead');
      await client.query(
        `UPDATE skill_engagements SET status = 'cancelled', cancelled_by = $2, updated_at = now() WHERE engagement_id = $1`,
        [engagementId, req.user.user_id]
      );
      return respond(client, req, res, 200, engagementId, 'Withdrawn');
    }
    if (engagement.status !== 'accepted') return fail(409, `This was already ${engagement.status}`);

    await client.query(
      `UPDATE skill_engagements SET status = 'cancelled', cancelled_by = $2, cancel_message = $3, updated_at = now()
       WHERE engagement_id = $1`,
      [engagementId, req.user.user_id, message.value]
    );
    if (post.kind === 'request' && post.status === 'closed') {
      await client.query(`UPDATE skill_posts SET status = 'open', updated_at = now() WHERE post_id = $1`, [post.post_id]);
    }

    const canceller = iAmPoster ? post : engagement;
    await createNotification(client, {
      userId: iAmPoster ? engagement.user_id : post.user_id,
      type: 'skill_cancelled',
      title: `${displayName(canceller)} cancelled`,
      message: `"${snippet(post.title, 60)}" · ${formatRange(engagement.starts_at, engagement.ends_at)} is off.${
        message.value ? ` Their message: "${snippet(message.value, 150)}"` : ''
      }${post.kind === 'request' ? ' The request is open again.' : ''}`,
      actorId: req.user.user_id,
      postId: post.post_id,
      engagementId,
    });

    await respond(client, req, res, 200, engagementId, 'Cancelled');
  });
}

// who gives the Kudos for an agreement: on a request the poster thanks the helper;
// on an offer the person who was helped thanks the poster
function kudosRoles(post, engagement) {
  return post.kind === 'request'
    ? { giver: post, giverId: post.user_id, receiver: engagement, receiverId: engagement.user_id }
    : { giver: engagement, giverId: engagement.user_id, receiver: post, receiverId: post.user_id };
}

async function insertKudos(client, post, engagement) {
  const { giver, giverId, receiverId } = kudosRoles(post, engagement);
  await client.query(
    'INSERT INTO kudos (engagement_id, giver_id, receiver_id) VALUES ($1, $2, $3)',
    [engagement.engagement_id, giverId, receiverId]
  );
  await createNotification(client, {
    userId: receiverId,
    type: 'general',
    title: `⭐ ${displayName(giver)} gave you Kudos`,
    message: `For "${snippet(post.title, 60)}". It now counts toward your Kudos.`,
    actorId: giverId,
    postId: post.post_id,
    engagementId: engagement.engagement_id,
  });
}

// POST /skill-exchange/engagements/:id/complete  body: { award_kudos? } (poster, accepted only)
// request: the agreement and the request become complete; award_kudos gives the helper Kudos
// offer: the agreement becomes complete and the other person is asked for Kudos
async function completeEngagement(req, res) {
  const engagementId = readId(req.params.id);
  if (!engagementId) return res.status(400).json({ error: 'Invalid engagement id' });
  const read = readBody(req, ['award_kudos']);
  if (read.error) return res.status(400).json({ error: read.error });
  const award = read.body.award_kudos;
  if (award !== undefined && typeof award !== 'boolean') return res.status(400).json({ error: 'award_kudos must be true or false' });

  await inTransaction(res, 'Failed to mark complete', async (client, fail) => {
    const { post, engagement } = await lockEngagement(client, engagementId);
    if (!engagement) return fail(404, 'Not found');
    if (String(post.user_id) !== String(req.user.user_id)) return fail(403, 'Only the poster can mark it complete');
    if (engagement.status === 'pending') return fail(409, 'Accept it first');
    if (engagement.status !== 'accepted') return fail(409, `This was already ${engagement.status}`);
    if (post.kind === 'offer' && award) return fail(400, 'On an offer, the person you helped gives the Kudos');

    await client.query(
      `UPDATE skill_engagements
       SET status = 'completed', updated_at = now(), kudos_requested_at = CASE WHEN $2 THEN now() ELSE kudos_requested_at END
       WHERE engagement_id = $1`,
      [engagementId, post.kind === 'offer']
    );
    const postTitle = snippet(post.title, 60);

    if (post.kind === 'request') {
      await client.query(`UPDATE skill_posts SET status = 'complete', updated_at = now() WHERE post_id = $1`, [post.post_id]);
      if (award) {
        await insertKudos(client, post, engagement);
      } else {
        await createNotification(client, {
          userId: engagement.user_id,
          type: 'general',
          title: `${displayName(post)} marked it complete`,
          message: `"${postTitle}" is done. Thanks for helping!`,
          actorId: post.user_id,
          postId: post.post_id,
          engagementId,
        });
      }
    } else {
      await createNotification(client, {
        userId: engagement.user_id,
        type: 'skill_kudos_request',
        title: `${displayName(post)} asks for Kudos`,
        message: `For "${postTitle}" (${formatRange(engagement.starts_at, engagement.ends_at)}). If it went well, tap to give Kudos.`,
        actorId: post.user_id,
        postId: post.post_id,
        engagementId,
      });
    }

    await respond(client, req, res, 200, engagementId, 'Completed');
  });
}

// POST /skill-exchange/engagements/:id/kudos (completed only; request: the poster gives it,
// offer: the person who was helped gives it); once per agreement
async function giveKudos(req, res) {
  const engagementId = readId(req.params.id);
  if (!engagementId) return res.status(400).json({ error: 'Invalid engagement id' });
  const read = readBody(req, []);
  if (read.error) return res.status(400).json({ error: read.error });

  await inTransaction(res, 'Failed to give Kudos', async (client, fail) => {
    const { post, engagement } = await lockEngagement(client, engagementId);
    if (!engagement) return fail(404, 'Not found');
    const { giverId } = kudosRoles(post, engagement);
    if (String(giverId) !== String(req.user.user_id)) {
      return fail(403, post.kind === 'request' ? 'Only the poster gives Kudos on a request' : 'Only the person who was helped gives Kudos on an offer');
    }
    if (engagement.status !== 'completed') return fail(409, 'It has to be marked complete first');
    const existing = await client.query('SELECT 1 FROM kudos WHERE engagement_id = $1', [engagementId]);
    if (existing.rows[0]) return fail(409, 'You already gave Kudos for this');

    await insertKudos(client, post, engagement);
    await respond(client, req, res, 200, engagementId, 'Kudos given');
  });
}

// used by deletePost: tell everyone with an accepted agreement that it's off
async function notifyAgreementsEndedByDelete(client, post, deleterId) {
  const accepted = await client.query(
    `SELECT e.user_id, e.starts_at, e.ends_at FROM skill_engagements e WHERE e.post_id = $1 AND e.status = 'accepted'`,
    [post.post_id]
  );
  for (const row of accepted.rows) {
    await createNotification(client, {
      userId: row.user_id,
      type: 'skill_cancelled',
      title: `${post.kind === 'offer' ? 'An offer' : 'A request'} you agreed to was deleted`,
      message: `"${snippet(post.title, 60)}" · ${formatRange(row.starts_at, row.ends_at)} is off because the post was deleted.`,
      actorId: deleterId,
    });
  }
}

module.exports = {
  expressInterest,
  listPostEngagements,
  getEngagement,
  acceptEngagement,
  declineEngagement,
  cancelEngagement,
  completeEngagement,
  giveKudos,
  notifyAgreementsEndedByDelete,
  formatRange,
};
