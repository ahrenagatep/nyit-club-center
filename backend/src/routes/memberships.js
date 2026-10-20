// GET /users/me/memberships: the logged-in user's clubs (requires login)

const express = require('express');
const { listMyMemberships } = require('../controllers/membershipsController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, listMyMemberships); // returns array of {club_id, president_id, name, description, category, created_at, member_count, role}

module.exports = router;