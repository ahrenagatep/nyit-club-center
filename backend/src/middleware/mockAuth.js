// TEMPORARY mock auth - lets you test clubs routes without the real auth system
// DELETE this file once real auth (middleware/auth.js) is merged and working and switch clubs.js back to requiring the real requireAuth/requireRole.

// Fakes a logged-in user by reading a role from a header, so you can test
// role-protected routes without a real token.
// usage in Postman: add header x-mock-role: admin (or moderator / student)

function mockRequireAuth(req, res, next) {
  const role = req.headers['x-mock-role'] || 'student';

  req.user = {
    user_id: 1, // fake user_id - make sure a users row with id 1 exists, or adjust this to an id inserted
    nyit_email: 'mockuser@nyit.edu',
    username: 'mockuser',
    role,
  };

  next();
}

// same interface/signature as the real requireRole, so clubs.js doesn't change at all.
function mockRequireRole(...allowedRoles) {
  const allowed = allowedRoles.map((r) => r.toLowerCase());

  return (req, res, next) => {
    const role = (req.user && req.user.role) || '';

    if (!allowed.includes(role.toLowerCase())) {
      return res.status(403).json({ error: 'Insufficient role' });
    }

    next();
  };
}

module.exports = { requireAuth: mockRequireAuth, requireRole: mockRequireRole };