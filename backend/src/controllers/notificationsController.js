// the signed-in user's own notifications (any role, own rows only)

const pool = require('../config/db');

const ID_PATTERN = /^[1-9]\d{0,9}$/;

async function unreadCount(userId) {
  const result = await pool.query(
    'SELECT count(*)::int AS n FROM notifications WHERE user_id = $1 AND NOT is_read',
    [userId]
  );
  return result.rows[0].n;
}

// GET /notifications?unread=true&limit=&offset= → { notifications, unread_count, limit, offset, has_more }
// newest first; post_kind tells the app whether the linked post still exists
async function listNotifications(req, res) {
  const limit = req.query.limit === undefined ? 30 : Number(req.query.limit);
  const offset = req.query.offset === undefined ? 0 : Number(req.query.offset);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    return res.status(400).json({ error: 'limit must be a whole number from 1 to 100' });
  }
  if (!Number.isInteger(offset) || offset < 0 || offset > 10000) {
    return res.status(400).json({ error: 'offset must be a whole number from 0 to 10000' });
  }
  if (req.query.unread !== undefined && !['true', 'false'].includes(req.query.unread)) {
    return res.status(400).json({ error: 'unread must be true or false' });
  }
  const onlyUnread = req.query.unread === 'true';

  try {
    const [list, unread] = await Promise.all([
      pool.query(
        `SELECT n.notification_id::int AS notification_id, n.type, n.title, n.message, n.sent_at, n.is_read,
                n.post_id::int AS post_id, n.engagement_id::int AS engagement_id, p.kind AS post_kind,
                CASE WHEN a.user_id IS NULL THEN NULL ELSE json_build_object(
                  'user_id', a.user_id::int, 'username', a.username,
                  'first_name', a.first_name, 'last_name', a.last_name
                ) END AS actor
         FROM notifications n
         LEFT JOIN users a ON a.user_id = n.actor_user_id
         LEFT JOIN skill_posts p ON p.post_id = n.post_id
         WHERE n.user_id = $1 ${onlyUnread ? 'AND NOT n.is_read' : ''}
         ORDER BY n.sent_at DESC, n.notification_id DESC
         LIMIT $2 OFFSET $3`,
        [req.user.user_id, limit + 1, offset]
      ),
      unreadCount(req.user.user_id),
    ]);

    res.json({
      notifications: list.rows.slice(0, limit),
      unread_count: unread,
      limit,
      offset,
      has_more: list.rows.length > limit,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load notifications' });
  }
}

// POST /notifications/:id/read → { notification_id, unread_count }
// someone else's notification answers 404, the same as a missing one
async function markRead(req, res) {
  if (!ID_PATTERN.test(String(req.params.id))) {
    return res.status(400).json({ error: 'Invalid notification id' });
  }
  const notificationId = Number(req.params.id);

  try {
    const result = await pool.query(
      'UPDATE notifications SET is_read = true WHERE notification_id = $1 AND user_id = $2 RETURNING notification_id',
      [notificationId, req.user.user_id]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json({ notification_id: notificationId, unread_count: await unreadCount(req.user.user_id) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update notification' });
  }
}

// POST /notifications/read-all → { updated, unread_count: 0 }
async function markAllRead(req, res) {
  try {
    const result = await pool.query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1 AND NOT is_read',
      [req.user.user_id]
    );
    res.json({ updated: result.rowCount, unread_count: 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
}

module.exports = { listNotifications, markRead, markAllRead };
