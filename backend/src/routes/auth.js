// /auth/register, /auth/login, /auth/verify, /auth/resend,
// /auth/forgot-password, /auth/reset-password

const express = require('express');
const {
  register,
  login,
  verify,
  resend,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify', verify);
router.post('/resend', resend);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
