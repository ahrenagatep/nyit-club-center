// /events: browsing is public; RSVP needs a signed-in user with a profile (members and non-members alike)

const express = require('express');
const { listEvents, getEvent, rsvp, cancelRsvp } = require('../controllers/eventsController');
const { requireAuth } = require('../middleware/auth');
const { requireProfile } = require('../middleware/requireProfile');

const router = express.Router();

router.get('/', listEvents);    // ?from=&to=&club_id=&limit= → { events } (no from/to: upcoming only)
router.get('/:id', getEvent);   // → { event }
router.post('/:id/rsvp', requireAuth, requireProfile, rsvp);          // → { event_id, going: true, attendee_count }; 409 if ended
router.delete('/:id/rsvp', requireAuth, requireProfile, cancelRsvp);  // → { event_id, going: false, attendee_count }; 409 if ended

module.exports = router;
