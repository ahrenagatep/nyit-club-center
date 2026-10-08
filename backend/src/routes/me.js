// /api/me/profile/bio
// Routes for the logged-in user aka "me".
// Mounted at /api/me, so this route is PATCH /api/me/profile/bio.
const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { updateBio } = require('../controllers/profileController');

const router = express.Router();

router.patch('/profile/bio', requireAuth, updateBio);

module.exports = router;
