// creates in-app notifications (the Notifications screen reads them with GET /notifications)
// pass the transaction's client so a notification is only saved if the action is

// "a long comment that goes on and on" → "a long comment that…"
function snippet(text, max) {
  const flat = String(text).replace(/\s+/g, ' ').trim();
  return flat.length > max ? `${flat.slice(0, max - 1).trimEnd()}…` : flat;
}

function displayName(user) {
  return `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || 'Someone';
}

async function createNotification(db, { userId, type, title, message, actorId = null, postId = null, engagementId = null }) {
  await db.query(
    `INSERT INTO notifications (user_id, type, title, message, actor_user_id, post_id, engagement_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [userId, type, snippet(title, 150), message, actorId, postId, engagementId]
  );
}

module.exports = { createNotification, snippet, displayName };
