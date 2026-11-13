// GET /users/me/events: the signed-in user's upcoming RSVP'd events

const express = require('express');
const { listMyEvents } = require('../controllers/eventsController');
const { requireAuth } = require('../middleware/auth');
const { requireProfile } = require('../middleware/requireProfile');

const router = express.Router();

router.get('/', requireAuth, requireProfile, listMyEvents); // → { events }, soonest first

module.exports = router;
