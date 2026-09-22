### Changelog
---
#### 9/21/26 @ 9 pm
#### Backend - Ahren Agatep
- Set up PostgreSQL connection pool (src/config/db.js) using pg + DATABASE_URL
    - hit an ENOTFOUND error on the direct connection string due to IPv6-only DNS resolution on local network; switched to Supabase's pooled connection string (port 6543) to resolve
- Scaffolded Express app (src/app.js) and entry point (src/server.js)
- Added GET /health route to verify Express -> pg -> Supabase connection end-to-end
- Created src/routes, src/controllers, src/middleware, src/utils folders for auth work
#### Frontend
- N/A
---
### 9/17/26 @ 9 pm
#### Backend - Ahren Agatep
- Added .sql files for tables (9 total, still need to run, in order due to foreign key dependencies)
    - 001_create_users.sql : core user accounts, NYIT-email-only via CHECK constraint, role (student/moderator/admin)
    - 002_create_clubs.sql : club info, references users(president_id)
    - 003_create_memberships.sql : junction table linking users <-> clubs, tracks role/status per member
    - 004_create_events.sql : event info, references clubs(club_id)
    - 005_create_attendance.sql : junction table linking users <-> events, tracks registration/check-in status
    - 006_create_club_messages.sql : club group chat messages
    - 007_create_direct_messages.sql : one-on-one private messages between users
    - 008_create_favorites.sql : junction table for users' saved/favorited clubs
    - 009_create_notifications.sql : push notification records per user
- Used `BIGINT GENERATED ALWAYS AS IDENTITY` for all primary keys instead of `SERIAL` (current Postgres/Supabase best practice, avoids sequence ownership quirks)
- Added CHECK constraints to enforce enums at the DB level (role, membership status, attendance status, notification type) , matches server-side role enforcement requirement
- Added indexes on frequently-queried foreign key columns (e.g. `idx_memberships_club_id`, `idx_attendance_event_id`, `idx_users_role`) to speed up lookups without changing how queries are written
#### Frontend
- N/A
---
### 9/16/26 @ 3 am
#### Backend - Ahren Agatep
- Initialized /backend and installed core dependencies
    - express : web framework and router
    - pg : PostgreSQL database client
    - dotenv : environment variables loader
    - bcrypt : password hashing utility
    - jsonwebtoken : secure user session token generator
    - cors : Cross-Origin Request manager
    - nodemon : auto-restarts your server on file changes
#### Frontend
- N/A
