// NYIT-only email check (theres probably a better way to do this)

const NYIT_EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@nyit\.edu$/i;

function isNyitEmail(email) {
  return typeof email === 'string' && NYIT_EMAIL_REGEX.test(email.trim());
}

function normalizeEmail(email) {
  return String(email).trim().toLowerCase();
}

module.exports = { isNyitEmail, normalizeEmail };
