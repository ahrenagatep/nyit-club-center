// /clubs/:id/events: create/edit/delete a club's events (officer or president of that club, or admin)
// mounted separately so routes/clubs.js stays unchanged; mergeParams exposes :id to requireRole

const express = require('express');
const { createEvent, updateEvent, deleteEvent, validateClubId } = require('../controllers/eventsController');
const { requireAuth } = require('../middleware/auth');
const { requireProfile } = require('../middleware/requireProfile');
const { requireRole } = require('../middleware/requireRole');

const router = express.Router({ mergeParams: true });

// club id is checked before requireRole, which looks it up in memberships
const canManage = [requireAuth, requireProfile, validateClubId, requireRole('officer', 'president', 'admin')];

router.post('/', canManage, createEvent);              // body: { title, event_date, ends_at?, location?, description?, category? } → 201 { event }
router.put('/:eventId', canManage, updateEvent);       // body: any of the same fields → { event }
router.delete('/:eventId', canManage, deleteEvent);    // → { message, event_id }

module.exports = router;
