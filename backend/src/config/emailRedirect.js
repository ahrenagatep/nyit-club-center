// where the link in the confirmation email sends the user after Supabase verifies them.
// set EMAIL_REDIRECT_URL in .env for later deployment(e.g. https://<api>.onrender.com/verified);
// without it, local development uses this server's own /verified page

// loads .env into process.env (should not overwrite vars already set)
require('dotenv').config();

// ?. avoids a crash when unset; || also treats "" as unset; default matches server.js's port
const EMAIL_REDIRECT_URL =
  process.env.EMAIL_REDIRECT_URL?.trim() || `http://localhost:${process.env.PORT || 3000}/verified`;

// fail at startup on a typo instead of sending broken links in real emails
let protocol; // "https:", "http:", ... or null if not a URL
try {
  protocol = new URL(EMAIL_REDIRECT_URL).protocol; // throws on text that isn't a full URL
} catch {
  protocol = null;
}
// checking the scheme also rejects "localhost:3000/verified", which parses as scheme "localhost:"
if (protocol !== 'http:' && protocol !== 'https:') {
  throw new Error(`EMAIL_REDIRECT_URL must be a full http(s) URL, got: ${EMAIL_REDIRECT_URL}`); // stops startup
}

module.exports = EMAIL_REDIRECT_URL; // runs once, require() caches it

// Ex: 
// https://api.onrender.com/verified -> parses -> passes
// http://localhost:3000/verified -> parses -> passes
// api.onrender.com/verified -> throws -> startup error (no protocol)
