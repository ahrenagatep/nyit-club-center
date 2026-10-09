// after requireAuth: stops a valid token that has no users row (requireAuth lets it
// through with a stand-in user that has no user_id) before a route needs req.user.user_id

function requireProfile(req, res, next) {
  if (!req.user?.user_id) {
    return res.status(404).json({ error: 'Profile not found' });
  }
  next();
}

module.exports = { requireProfile };
