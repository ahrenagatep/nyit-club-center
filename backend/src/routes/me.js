const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { updateBio } = require('../controllers/profileController');

const router = express.Router();

router.patch('/profile/bio', requireAuth, updateBio);

module.exports = router;
