# Changelog
## 2026-10-02
### Backend
#### Anthony Dominguez
- Added `POST /auth/resend` (re-sends the signup confirmation email)
- Added `POST /auth/forgot-password` and `POST /auth/reset-password` (6-digit code from email → new password; signs the account out on all devices)
    - **needs `{{ .Token }}` in the Supabase "Reset Password" email template** (Authentication → Email Templates)
- `POST /auth/register` now checks the email/username are free before creating the Supabase account (no more orphaned Supabase accounts)
- JSON error handler in `app.js`: malformed JSON / oversized bodies / unhandled errors return JSON instead of an HTML stack trace
- Added `sql/010_users_supabase_auth.sql` so a fresh DB built from 001–010 matches the live `users` table (no-op on the live DB)
### Frontend
#### Anthony Dominguez
- Login, Sign Up, Verification, and new Forgot Password screens call the auth API; session saved with `expo-secure-store`; route guard
## 2026-09-30
### Backend
#### Ahren Agatep
- Temporarily disabled NYIT-only email restriction (regex + DB constraint) to allow testing with any email address, since our sending domain isn't yet trusted by NYIT's mail servers
    - to be re-enabled later (possibly)
## 2026-09-28
### Backend
#### Ahren Agatep
- Fixed `supabase.js` to read SUPABASE_URL/SUPABASE_ANON_KEY from .env instead of hardcoded placeholders
- Added `auth_user_id` column to `users` table, linking Supabase Auth accounts to local profiles by ID instead of matching email strings
- Dropped unused local `password` column (Supabase Auth handles credentials)
- Verified register → verify → login flow end-to-end via Postman
- Merged fixes into → `auth` → `main`

## 2026-09-26
### Backend
#### Ahren Agatep
- Reviewed teammate's auth implementation (Supabase Auth-backed register/login/verify, JWT-style middleware, role check)
- Flagged three open issues for next standup (see [PR comment](https://github.com/ahrenagatep/nyit-club-center/pull/35))
- Built `/clubs` routes and controller (`src/routes/clubs.js`, `src/controllers/clubsController.js`):
    - `GET /clubs` - public, list/search/filter clubs by name or category
    - `GET /clubs/:id` - public, fetch a single club
    - `POST /clubs` - moderator/admin only, create a club
    - `PUT /clubs/:id` - moderator/admin only, update a club
    - `DELETE /clubs/:id` - admin only, delete a club
- Created temporary mock auth middleware (`src/middleware/mockAuth.js`) to test clubs routes independently, since real auth isn't merged to `main` yet (to be removed once the real auth branch is fixed and merged)
- Verified full CRUD + role protection end-to-end via Postman
#### Anson Chen
- Added email/password auth through Supabase Auth (can definitely be improved)
    - POST /auth/register : NYIT-email-only signup (`@nyit.edu`), creates a Supabase Auth user and a matching `users` profile row
    - POST /auth/login : sign-in via `signInWithPassword`, returns a Supabase access/refresh token session
    - POST /auth/verify : confirms the signup email using the OTP/token from the confirmation message (`verifyOtp`, type `signup`)
- Wired JWT-style protection to the Supabase access token (`Authorization: Bearer ...`) plus a Student/Moderator/Admin role check middleware
- Placeholders in `src/config/supabase.js`: `SUPABASE_URL`, `SUPABASE_ANON_KEY`

## 2026-09-21
### Backend
#### Ahren Agatep
- Set up PostgreSQL connection pool (src/config/db.js) using pg + DATABASE_URL
    - hit an ENOTFOUND error on the direct connection string due to IPv6-only DNS resolution on local network; switched to Supabase's pooled connection string (port 6543) to resolve
- Scaffolded Express app (src/app.js) and entry point (src/server.js)
- Added GET /health route to verify Express -> pg -> Supabase connection end-to-end
- Created src/routes, src/controllers, src/middleware, src/utils folders for auth work

## 2026-09-17
### Backend
#### Ahren Agatep
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

## 2026-09-16
### Backend
#### Ahren Agatep
- Initialized /backend and installed core dependencies
    - express : web framework and router
    - pg : PostgreSQL database client
    - dotenv : environment variables loader
    - bcrypt : password hashing utility
    - jsonwebtoken : secure user session token generator
    - cors : Cross-Origin Request manager
    - nodemon : auto-restarts your server on file changes
