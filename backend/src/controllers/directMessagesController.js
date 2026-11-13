// one-on-one direct messages between two users (signed-in user only sees their own conversations)

const pool = require('../config/db');
const { containsProfanity } = require('../utils/profanity');

const ID_PATTERN = /^[1-9]\d{0,9}$/;
const MAX_LENGTH = 2000;

// one row per person I've messaged (either direction) w/ the newest msg between us, newest convo first.
const CONVERSATIONS_SQL = `
  WITH latest AS (
    SELECT DISTINCT ON (other_id) message_id, sender_id, content, sent_at, other_id
    FROM (
      SELECT message_id, sender_id, content, sent_at,
             CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END AS other_id
      FROM direct_messages
      WHERE sender_id = $1 OR receiver_id = $1
    ) AS mine
    ORDER BY other_id, sent_at DESC, message_id DESC
  )
  SELECT u.user_id::int AS user_id, u.username, u.first_name, u.last_name, u.profile_image,
         latest.content AS last_message, latest.sent_at AS last_sent_at,
         latest.sender_id = $1 AS last_from_me
  FROM latest
  JOIN users u ON u.user_id = latest.other_id
  ORDER BY latest.sent_at DESC, latest.message_id DESC`;

// POST /direct-messages  body: { receiver_id, content } -> the new message
async function sendMessage(req, res) {
  const { receiver_id, content } = req.body || {};

  if (!ID_PATTERN.test(String(receiver_id))) {
    return res.status(400).json({ error: 'receiver_id must be a valid user id' });
  }
  const receiverId = Number(receiver_id);

  if (receiverId === Number(req.user.user_id)) { // pg returns BIGINT as a string
    return res.status(400).json({ error: 'You cannot message yourself' });
  }

  const text = typeof content === 'string' ? content.trim() : '';
  if (!text) {
    return res.status(400).json({ error: 'content is required' });
  }
  if (text.length > MAX_LENGTH) {
    return res.status(400).json({ error: `content must be ${MAX_LENGTH} characters or less` });
  }
  if (containsProfanity(text)) {
    return res.status(400).json({ error: 'Message contains inappropriate language' });
  }

  try {
    const receiver = await pool.query('SELECT user_id FROM users WHERE user_id = $1', [receiverId]);
    if (!receiver.rows[0]) {
      return res.status(404).json({ error: 'User not found' });
    }

    const result = await pool.query(
      `INSERT INTO direct_messages (sender_id, receiver_id, content)
       VALUES ($1, $2, $3)
       RETURNING message_id::int AS message_id, sender_id::int AS sender_id,
                 receiver_id::int AS receiver_id, content, sent_at`,
      [req.user.user_id, receiverId, text]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send message' });
  }
}

// GET /direct-messages/:userId -> { messages } oldest first, both directions between you and :userId
async function getConversation(req, res) {
  if (!ID_PATTERN.test(String(req.params.userId))) {
    return res.status(400).json({ error: 'Invalid user id' });
  }
  const otherId = Number(req.params.userId);

  try {
    const result = await pool.query(
      `SELECT message_id::int AS message_id, sender_id::int AS sender_id,
              receiver_id::int AS receiver_id, content, sent_at
       FROM direct_messages
       WHERE (sender_id = $1 AND receiver_id = $2)
          OR (sender_id = $2 AND receiver_id = $1)
       ORDER BY sent_at ASC, message_id ASC`,
      [req.user.user_id, otherId]
    );
    res.json({ messages: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load messages' });
  }
}

// GET /direct-messages -> { conversations } one row per person I've messaged, newest first
async function listConversations(req, res) {
  try {
    const result = await pool.query(CONVERSATIONS_SQL, [req.user.user_id]);
    res.json({ conversations: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load conversations' });
  }
}

module.exports = { sendMessage, getConversation, listConversations };
