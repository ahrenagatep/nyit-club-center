// /clubs browsing is public, managing clubs requires auth + role

const express = require('express');
const { listClubs, getClub, createClub, updateClub, deleteClub } = require('../controllers/clubsController');
// const { requireAuth } = require('../middleware/auth');
// const { requireRole } = require('../middleware/requireRole');

// TEMPORARY mock authentication , replace with above code once auth branch is fixed and merged
const { requireAuth, requireRole } = require('../middleware/mockAuth');

const router = express.Router();

// anyone can browse/search clubs
router.get('/', listClubs);     // returns array of clubs in json
router.get('/:id', getClub);    // returns specific club by ID

// must be logged in and a moderator or admin
router.post('/', requireAuth, requireRole('moderator', 'admin'), createClub);   // creates new club + returns new object with status 201 (successfully created)
router.put('/:id', requireAuth, requireRole('moderator', 'admin'), updateClub); // updates existing club + returns updated object or 404 (not found)

// admin only
router.delete('/:id', requireAuth, requireRole('admin'), deleteClub);   // returns { message: 'Club deleted', club_id: <id> } or 404 (not found)

module.exports = router;