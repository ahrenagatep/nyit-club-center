// /auth/register, /auth/login, /auth/verify, /auth/resend

const express = require('express');
const { register, login, verify, resend } = require('../controllers/authController');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify', verify);
router.post('/resend', resend);

module.exports = router;
