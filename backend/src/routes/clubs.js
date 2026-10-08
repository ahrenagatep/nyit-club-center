// /clubs browsing is public, managing clubs requires auth + role

const express = require('express');
const { listClubs, getClub, createClub, updateClub, deleteClub } = require('../controllers/clubsController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');

const router = express.Router();

// anyone can browse/search/create clubs
router.get('/', listClubs);     // returns array of clubs in json
router.get('/:id', getClub);    // returns specific club by ID
router.post('/', requireAuth, createClub);   // creates new club + returns new object with status 201 (successfully created)

// only admin / officers / president can update a club
router.put('/:id', requireAuth, requireRole('officer', 'president', 'admin'), updateClub); // updates existing club + returns updated object or 404 (not found)

// admin / club president only
router.delete('/:id', requireAuth, requireRole('president', 'admin'), deleteClub);   // returns { message: 'Club deleted', club_id: <id> } or 404 (not found)

module.exports = router;