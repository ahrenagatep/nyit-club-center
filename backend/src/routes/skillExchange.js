// /skill-exchange: request and offer posts and their comments (any signed-in user; editing is owner-only)

const express = require('express');
const {
  listTags, listPosts, getPost, createPost, updatePost, deletePost, getSummary,
} = require('../controllers/skillExchangeController');
const { listComments, createComment, deleteComment } = require('../controllers/skillCommentsController');
const {
  expressInterest, listPostEngagements, getEngagement, acceptEngagement, declineEngagement, cancelEngagement,
  completeEngagement, giveKudos,
} = require('../controllers/skillEngagementsController');
const { requireAuth } = require('../middleware/auth');
const { requireProfile } = require('../middleware/requireProfile');

const router = express.Router();

router.use(requireAuth, requireProfile);

router.get('/tags', listTags);              // returns { groups: [{ name, tags }] }
router.get('/summary', getSummary);         // the caller's own: { post_count, request_count, offer_count, kudos, recent }
router.get('/posts', listPosts);            // ?kind=request|offer&q=&tags=&status=&mine=&sort=&limit=&offset= → { posts, limit, offset, has_more }
router.post('/posts', createPost);          // body: { kind, title, description, extras?, location?, location_flexible?, tags, slots } → 201 { message, post }
router.get('/posts/:id', getPost);          // returns { post } (with slots)
router.patch('/posts/:id', updatePost);     // owner only; body: any of { description, extras, tags, status (offers) } → { message, post }
router.delete('/posts/:id', deletePost);    // owner or admin → { message, post_id }

router.get('/posts/:id/comments', listComments);     // → { comments } oldest first; replies have parent_comment_id
router.post('/posts/:id/comments', createComment);   // body: { body, parent_comment_id? (poster only) } → 201 { message, comment }
router.delete('/comments/:id', deleteComment);       // its author or admin → { message, comment_id }

// "I can help" / "I'd like this" → the poster accepts or declines → either side can cancel
router.post('/posts/:id/interest', expressInterest);           // not the poster; body: { starts_at, ends_at, location?, message? } → 201 { message, engagement }
router.get('/posts/:id/engagements', listPostEngagements);     // poster: all; others: their own → { engagements }
router.get('/engagements/:id', getEngagement);                 // the two people involved or admin → { engagement }
router.post('/engagements/:id/accept', acceptEngagement);      // poster; body: { message? } → { message, engagement }
router.post('/engagements/:id/decline', declineEngagement);    // poster; body: { message? } (silent without one)
router.post('/engagements/:id/cancel', cancelEngagement);      // accepted: either person; pending: the sender withdraws
router.post('/engagements/:id/complete', completeEngagement);  // poster, accepted; body: { award_kudos? } (requests); offers ask for Kudos
router.post('/engagements/:id/kudos', giveKudos);              // completed; request: poster gives, offer: the person helped gives

module.exports = router;
