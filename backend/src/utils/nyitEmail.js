// NYIT-only email check (theres probably a better way to do this)

// const NYIT_EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@nyit\.edu$/i;
const NYIT_EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/i; // change to currently accept any email

function isNyitEmail(email) {
  return typeof email === 'string' && NYIT_EMAIL_REGEX.test(email.trim());
}

function normalizeEmail(email) {
  return String(email).trim().toLowerCase();
}

module.exports = { isNyitEmail, normalizeEmail };
