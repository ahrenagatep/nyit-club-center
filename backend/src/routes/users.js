// /users/me: the signed-in user's own profile (any role, own row only)

const express = require('express');
const { getMe, updateMe, uploadAvatar, deleteAvatar } = require('../controllers/usersController');
const { requireAuth } = require('../middleware/auth');
const { requireProfile } = require('../middleware/requireProfile');

const router = express.Router();

// reads the raw image bytes into req.body (a Buffer); same 2MB / jpeg+png limits as the avatars bucket
// a bigger file gets a 413 from the error handler in app.js
const readImage = express.raw({ type: ['image/jpeg', 'image/png'], limit: '2mb' });

router.get('/me', requireAuth, getMe);       // returns { user }
router.patch('/me', requireAuth, updateMe);  // body: any of { major, school_year, bio }; returns { message, user }
router.put('/me/avatar', requireAuth, requireProfile, readImage, uploadAvatar);  // body: the image file, Content-Type image/jpeg or image/png; returns { message, user }
router.delete('/me/avatar', requireAuth, requireProfile, deleteAvatar);          // returns { message, user }

module.exports = router;
