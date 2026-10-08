// role check for Student / Moderator / Admin after requireAuth has run
// UPDATE: added club specific role , checks role in memberships table

const pool = require('../config/db');

function requireRole(...allowedRoles) {
  const allowed = allowedRoles.map((role) => String(role).toLowerCase());

  return async (req, res, next) => {
    const { id: club_id } = req.params;

    if (req.user.role === 'admin') {
      return next();
    }

    try {
      const result = await pool.query(
        'SELECT role FROM memberships WHERE user_id = $1 AND club_id = $2',
        [req.user.user_id, club_id]
      );

      const role = String(result.rows[0]?.role).toLowerCase();

      if (allowed.includes(role)) {
        return next();
      }

      return res.status(403).json({ error: 'Insufficient role' });

    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
}

module.exports = { requireRole };
