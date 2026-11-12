// /clubs browsing is public, managing clubs requires auth + role

const express = require('express');
const { listClubs, getClub, createClub, updateClub, deleteClub, joinClub, leaveClub, transferOwnership, createAnnouncement, listAnnouncements, updateAnnouncement, deleteAnnouncement } = require('../controllers/clubsController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');
const { requireProfile } = require('../middleware/requireProfile');

const router = express.Router();

// anyone can browse/search/create clubs
router.get('/', listClubs);     // returns array of clubs in json
router.get('/:id', getClub);    // returns specific club by ID
router.post('/', requireAuth, createClub);   // creates new club + returns new object with status 201 (successfully created)

// anyone can join/leave clubs
router.post('/:id/join', requireAuth, joinClub);
router.delete('/:id/join', requireAuth, leaveClub);

// announcements: anyone can read, only officers / president / admin can post
router.get('/:id/announcements', listAnnouncements);  // returns array of the club's announcements, newest first
router.post('/:id/announcements', requireAuth, requireProfile, requireRole('officer', 'president', 'admin'), createAnnouncement); // 201 + new announcement
router.put('/:id/announcements/:announcementId', requireAuth, requireProfile, requireRole('officer', 'president', 'admin'), updateAnnouncement); // 200 + updated announcement
router.delete('/:id/announcements/:announcementId', requireAuth, requireProfile, requireRole('officer', 'president', 'admin'), deleteAnnouncement); // 200 { message, announcement_id }

// only admin / officers / president can update a club
router.put('/:id', requireAuth, requireRole('officer', 'president', 'admin'), updateClub); // updates existing club + returns updated object or 404 (not found)

// admin / club president only
router.delete('/:id', requireAuth, requireRole('president', 'admin'), deleteClub);   // returns { message: 'Club deleted', club_id: <id> } or 404 (not found)
router.post('/:id/transfer', requireAuth, requireRole('president', 'admin'), transferOwnership); // transfers club ownership to another active member

module.exports = router;