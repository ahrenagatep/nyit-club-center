# Changelog
## 2026-10-08
### Backend
#### Anthony Dominguez
- `sql/011` is **already applied to the shared Supabase database** (2026-10-08). Anyone using a different database must run 011 before running this code: login, register, and verify now select `major` and `school_year`
- New migration `sql/011_users_profile_fields.sql` (idempotent): adds `users.major VARCHAR(80)` and `users.school_year VARCHAR(20)`; adds checks `users_school_year_check` (Freshman / Sophomore / Junior / Senior or NULL) and `users_bio_length_check` (bio ≤ 200 characters; `bio` already existed)
- New `GET /users/me` (any signed-in user): `{ user }`, the caller's own row
- New `PATCH /users/me` (any signed-in user, own row only): body has any of `major`, `school_year`, `bio`; omitted fields stay the same, `""`/`null` clears one; returns `{ message, user }`
    - 400 for unknown fields (e.g. `role`, `nyit_email`, `username` can't be changed this way), non-text values, a school year outside the list, major > 80 / bio > 200 characters, an empty body, or a non-object body; 401 without a valid token; 404 if the token has no `users` row
    - values are trimmed; field names come from a fixed list and values are parameterized
- `/auth/register`, `/auth/login`, `/auth/verify` responses: `user` now also has `major`, `school_year`, `bio` (additive; shared column list in `src/utils/userColumns.js`)
- Fixed `requireAuth` (`middleware/auth.js`): it called `normalizeEmail` without importing it, so a valid token with no `users` row crashed into a 500 instead of reaching the route
- Tested against a throwaway Postgres built from `sql/001–011` (010/011 run twice) with Supabase faked: 21/21 (schema + constraints, every validation case, own-row-only updates, SQL-looking input, CORS preflight for PATCH, response time)
### Frontend
#### Anthony Dominguez
- Fixed the Profile regression from PR #42 (`ui-login-navigation`, kept in #44): the rewritten Profile and new More tab didn't use the signed-in user, there was no way to sign out, and a teammate's name and personal email were hard-coded
    - `profile.tsx` (layout and edit pop-up from #42/#44 kept):
        - name, `nyit_email`, and role come from `useAuth`; the hard-coded name, email, major, year, and bio are gone
        - the ✎ pop-up now **saves major, school year, and bio to the account** (`PATCH /users/me`): "Saving…" while it waits, errors shown in the pop-up (expired session gets its own message), tapping the selected year again clears it; Profile refreshes from `GET /users/me` when it opens, so edits from another device show up
        - **Sign out** button restored
        - "My Involvement" stats and lists use the shared join/RSVP state: Clubs Joined, Events Going (was a fixed "Events Attended"), Skill Posts (0 until Skill Exchange saves posts); Recent Clubs (newest first) and Upcoming Events (RSVP'd, soonest first) open the club/event; empty lists link to Explore/Events/Skill Exchange
        - every button works: stat cards and "View All" open My Clubs / Events / Skill Exchange; ⚙️ opens a Settings sheet (Notifications, plus Favorites and Themes marked "Coming soon")
        - back arrow falls back to Home when there's no previous screen (deep link, web refresh)
        - accessibility: labels/roles on the back, ⚙️, ✎, ✕, "View All", and year buttons; labelled inputs; 44 px touch targets; section headings; muted grey `#777B8A` → `Brand.textMuted` (`#777B8A` fails WCAG AA contrast on white)
        - "Freshmen" → "Freshman" in the edit pop-up
    - `(tabs)/more.tsx`: signed-in name and email instead of the hard-coded name/major; **Sign out** button; accessibility labels; same contrast fix
    - `(tabs)/_layout.tsx`: tab title typo "Skill Exchnange" → "Skill Exchange"; emoji icons on all five tabs (they showed React Navigation's ▼ placeholder)
- `src/lib/api.ts`: `usersApi.me` / `usersApi.updateMe`, `AuthUser` gains `major` / `school_year` / `bio`, shared `SCHOOL_YEARS` and `PROFILE_LIMITS`; `src/state/auth.tsx`: `updateUser()` replaces the signed-in user and saves it with the session
- No new dependencies; Skill Exchange screen untouched (separate branch)
- Tested: `tsc`, web + Android exports, new Profile click-through 31/31 (stub API), navigation 37, auth 27, forgot password 15, API address 7, `pickApiUrl` 21, all passing
## 2026-10-06
### Frontend
#### Anthony Dominguez
- Fixed "Can't reach the server" on Android emulators and phones: the app defaulted the API to `http://localhost:3000`, which on a device means the device itself
    - New `pickApiUrl()` in `src/lib/api.ts` picks the backend address once at startup:
        - `EXPO_PUBLIC_API_URL` always wins (required for release builds and tunnels)
        - web → the page's host, port 3000
        - phones/emulators in development → the computer running `expo start`, port 3000
        - with `--localhost`: Android emulator → `10.0.2.2`, Android phone on USB → `localhost` (via `adb reverse`, detected with `expo-device`)
    - Tunnel hosts (Expo `--tunnel`, VS Code port forwarding `*.devtunnels.ms`) log a warning asking for `EXPO_PUBLIC_API_URL`; requests to `*.devtunnels.ms` send `X-Tunnel-Skip-AntiPhishing-Page`
    - Development builds log the choice once: `[api] Using <url> (<source>)`
- Separate "Can't reach the server" and "taking too long to respond" errors (`ApiError.code` = `NETWORK` / `TIMEOUT`); development builds include the server address in the message
- Timeouts: 15 s by default, 30 s for register / resend / forgot-password (they wait on Supabase sending email)
- Sign Up timeout now says the account may already exist (check email before retrying); Forgot Password timeout moves on to the code step in case the code still arrives
- New `npm run android:usb` (adb reverse 8081 + 3000, then `expo start --localhost --android`): Android phones over USB work on Windows "Public" networks and campus Wi-Fi
- `.env.example` no longer sets a value and explains when to set `EXPO_PUBLIC_API_URL` (deployed builds, tunnels, backend elsewhere)
    - **if you copied the old `.env.example` to `.env.local`, delete its `EXPO_PUBLIC_API_URL=http://localhost:3000` line** and restart with `npx expo start --clear`
- No API, DB, or backend changes; no new dependencies
- Tested: `tsc`, web + Android exports, `pickApiUrl` unit tests 21/21, web click-throughs against a stub API (auth 27, forgot password 15, navigation 37, address/timeouts 7, all passing); not yet run on a physical phone or emulator
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
