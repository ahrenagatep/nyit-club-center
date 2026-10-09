// /users/me: the signed-in user's own profile (any role, own row only)

const express = require('express');
const { getMe, updateMe } = require('../controllers/usersController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/me', requireAuth, getMe);       // returns { user }
router.patch('/me', requireAuth, updateMe);  // body: any of { major, school_year, bio }; returns { message, user }

module.exports = router;
