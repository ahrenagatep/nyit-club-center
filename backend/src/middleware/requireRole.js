// role check for Student / Moderator / Admin after requireAuth has run

function requireRole(...allowedRoles) {
  const allowed = allowedRoles.map((role) => String(role).toLowerCase());

  return (req, res, next) => {
    const role = (req.user && req.user.role) || '';

    if (!allowed.includes(String(role).toLowerCase())) {
      return res.status(403).json({ error: 'Insufficient role' });
    }

    next();
  };
}

module.exports = { requireRole };
