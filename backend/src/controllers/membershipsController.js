const pool = require('../config/db');

// GET /users/me/memberships

// returns all clubs the user is a member of + details of club, with their role in each club
// requires a login (Authorization: Bearer <token>)
// requireAuth verifies the token with Supabase, looks up users row and puts it on req.user

// returns the same club fields as GET /clubs + the user's role
// so frontend can convert each row with toClub function

async function listMyMemberships(req, res) {
    const user_id = req.user.user_id; // database id for logged-in user

    // return club_id, president_id, name, description, category, created_at, member_count, role (from memberships table)
    // note: member_count is a subquery so it counts everyone in the club
    // the WHERE below only keeps the logged in user's own rows, which would make a plain COUNT always 1
    try {
        const result = await pool.query(
            `SELECT c.club_id, c.president_id, c.name, c.description, c.category, c.created_at, 
                (SELECT COUNT(*) FROM memberships m2 WHERE m2.club_id = c.club_id AND m2.status = 'active')::int AS member_count, m.role
                FROM clubs c
                JOIN memberships m ON m.club_id = c.club_id
                WHERE m.user_id = $1 AND m.status = 'active'`,
            [user_id] // pass user_id as parameter for $1 , prevents SQL injection
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch memberships' });
    }
}

module.exports = { listMyMemberships };