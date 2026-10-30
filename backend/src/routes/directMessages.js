// /direct-messages: just one-on-one messages between two authenticated users

const express = require('express');
const { sendMessage, getConversation } = require('../controllers/directMessagesController');
const { requireAuth } = require('../middleware/auth');
const { requireProfile } = require('../middleware/requireProfile');

const router = express.Router();

router.use(requireAuth, requireProfile);

router.post('/', sendMessage);              // body: { receiver_id, content } → new message (201)
router.get('/:userId', getConversation);    // → { messages } between me and :userId, oldest first

module.exports = router;
