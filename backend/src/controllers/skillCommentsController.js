// comments on Skill Exchange posts
// anyone signed in can comment; only the post's owner replies to a comment (one level deep)
// notifications: a comment on someone else's post tells the poster; the poster's reply tells
// the person replied to; the poster's own top-level comments notify no one

const pool = require('../config/db');
const { findProfaneField } = require('../utils/profanity');
const { createNotification, snippet, displayName } = require('../utils/notifications');

const MAX_BODY = 1000; // same as sql/013
const MAX_COMMENTS = 500;
const ID_PATTERN = /^[1-9]\d{0,9}$/;

const readId = (raw) => (ID_PATTERN.test(String(raw)) ? Number(raw) : null);
const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

const COMMENT_COLUMNS = `
  c.comment_id::int AS comment_id, c.post_id::int AS post_id, c.parent_comment_id::int AS parent_comment_id,
  c.body, c.created_at,
  json_build_object(
    'user_id', u.user_id::int, 'username', u.username, 'first_name', u.first_name,
    'last_name', u.last_name, 'nyit_email', u.nyit_email,
    'kudos', (SELECT count(*)::int FROM kudos k WHERE k.receiver_id = u.user_id)
  ) AS author`;

const withMine = (comment, req) => ({ ...comment, is_mine: comment.author.user_id === Number(req.user.user_id) });

// GET /skill-exchange/posts/:id/comments → { comments } oldest first; replies have parent_comment_id
async function listComments(req, res) {
  const postId = readId(req.params.id);
  if (!postId) {
    return res.status(400).json({ error: 'Invalid post id' });
  }

  try {
    const post = await pool.query('SELECT 1 FROM skill_posts WHERE post_id = $1', [postId]);
    if (!post.rows[0]) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const result = await pool.query(
      `SELECT ${COMMENT_COLUMNS}
       FROM skill_comments c JOIN users u ON u.user_id = c.user_id
       WHERE c.post_id = $1
       ORDER BY c.created_at, c.comment_id
       LIMIT ${MAX_COMMENTS}`,
      [postId]
    );
    res.json({ comments: result.rows.map((comment) => withMine(comment, req)) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load comments' });
  }
}

// POST /skill-exchange/posts/:id/comments  body: { body, parent_comment_id? }
async function createComment(req, res) {
  const postId = readId(req.params.id);
  if (!postId) {
    return res.status(400).json({ error: 'Invalid post id' });
  }

  const input = req.body;
  if (!isPlainObject(input)) {
    return res.status(400).json({ error: 'Request body must be a JSON object' });
  }
  const unknown = Object.keys(input).filter((field) => !['body', 'parent_comment_id'].includes(field));
  if (unknown.length) {
    return res.status(400).json({ error: `Unknown fields: ${unknown.join(', ')}` });
  }

  if (input.body !== undefined && input.body !== null && typeof input.body !== 'string') {
    return res.status(400).json({ error: 'body must be text' });
  }
  const body = (input.body || '').trim();
  if (!body) {
    return res.status(400).json({ error: 'Write a comment first' });
  }
  if (body.length > MAX_BODY) {
    return res.status(400).json({ error: `Comments must be ${MAX_BODY} characters or fewer` });
  }
  if (findProfaneField({ body })) {
    return res.status(400).json({ error: "Comment contains language that isn't allowed. Please remove it and try again." });
  }

  let parentId = null;
  if (input.parent_comment_id !== undefined && input.parent_comment_id !== null) {
    parentId = readId(input.parent_comment_id);
    if (!parentId) {
      return res.status(400).json({ error: 'Invalid parent_comment_id' });
    }
  }

  const me = req.user;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const postResult = await client.query('SELECT user_id, kind, title FROM skill_posts WHERE post_id = $1', [postId]);
    const post = postResult.rows[0];
    if (!post) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Post not found' });
    }
    const iAmPoster = String(post.user_id) === String(me.user_id);

    let parent = null;
    if (parentId) {
      if (!iAmPoster) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: 'Only the poster can reply to a comment' });
      }
      const parentResult = await client.query(
        'SELECT user_id, parent_comment_id FROM skill_comments WHERE comment_id = $1 AND post_id = $2',
        [parentId, postId]
      );
      parent = parentResult.rows[0];
      if (!parent) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: "That comment isn't on this post" });
      }
      if (parent.parent_comment_id) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'You can only reply to a top-level comment' });
      }
    }

    const inserted = await client.query(
      'INSERT INTO skill_comments (post_id, user_id, parent_comment_id, body) VALUES ($1, $2, $3, $4) RETURNING comment_id',
      [postId, me.user_id, parentId, body]
    );

    const name = displayName(me);
    const postTitle = snippet(post.title, 60);
    if (!iAmPoster) {
      await createNotification(client, {
        userId: post.user_id,
        type: 'skill_comment',
        title: `New comment on your ${post.kind}`,
        message: `${name} commented on "${postTitle}": ${snippet(body, 100)}`,
        actorId: me.user_id,
        postId,
      });
    } else if (parent && String(parent.user_id) !== String(me.user_id)) {
      await createNotification(client, {
        userId: parent.user_id,
        type: 'skill_reply',
        title: `${name} replied to your comment`,
        message: `On "${postTitle}": ${snippet(body, 100)}`,
        actorId: me.user_id,
        postId,
      });
    }

    const comment = await client.query(
      `SELECT ${COMMENT_COLUMNS} FROM skill_comments c JOIN users u ON u.user_id = c.user_id WHERE c.comment_id = $1`,
      [inserted.rows[0].comment_id]
    );
    await client.query('COMMIT');
    res.status(201).json({ message: 'Comment posted', comment: withMine(comment.rows[0], req) });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error(err);
    res.status(500).json({ error: 'Failed to post comment' });
  } finally {
    client.release();
  }
}

// DELETE /skill-exchange/comments/:id (its author or an admin); replies to it go too
async function deleteComment(req, res) {
  const commentId = readId(req.params.id);
  if (!commentId) {
    return res.status(400).json({ error: 'Invalid comment id' });
  }

  try {
    const existing = await pool.query('SELECT user_id FROM skill_comments WHERE comment_id = $1', [commentId]);
    const row = existing.rows[0];
    if (!row) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    if (String(row.user_id) !== String(req.user.user_id) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only the person who wrote this comment or an admin can delete it' });
    }

    await pool.query('DELETE FROM skill_comments WHERE comment_id = $1', [commentId]);
    res.json({ message: 'Comment deleted', comment_id: commentId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
}

module.exports = { listComments, createComment, deleteComment };
