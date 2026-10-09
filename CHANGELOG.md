# Changelog
## 2026-10-09
### Backend
#### Anthony Dominguez
- Skill Exchange, part 1 of 5 (posts). `sql/013` and `sql/014` are **already applied to the shared Supabase database** (2026-10-09; written as 012/013, renamed after `main` added `012_clubs_unique_name.sql`, contents unchanged). Anyone using a different database must run them in order (after 011) before using these routes
- New migration `sql/013_create_skill_exchange.sql` (idempotent): tables `skill_posts` (kind `request`/`offer`; status `open`/`closed`/`complete` for requests, `available`/`unavailable` for offers), `skill_post_tags` (unique per post ignoring case), `skill_post_slots` (dates/times), `skill_comments`, `skill_engagements` (interest → agreement), `kudos` (one per agreement, kept if the post is deleted); row level security on with no policies, like every other table, so Supabase's public API can't reach them
    - comments, engagements, and Kudos have no routes yet (parts 3–5)
- New migration `sql/014_notifications_skill_exchange.sql` (idempotent): `notifications` gains `is_read`, `actor_user_id`, `post_id`, `engagement_id`, and the types `skill_comment`, `skill_reply`, `skill_interest`, `skill_accepted`, `skill_declined`, `skill_cancelled`, `skill_kudos_request` (existing types unchanged)
- New routes under `/skill-exchange` (any signed-in user; 401 without a valid token, 404 if the token has no `users` row):
    - `GET /tags`: `{ groups: [{ name, tags }] }`, about 200 premade academic tags in 12 groups (`src/utils/skillTags.js`)
    - `GET /posts?kind=request|offer`: optional `q` (every word must match title, description, extras, tags, or poster name), `tags` (comma list, any of them, case-insensitive), `status`, `mine=true`, `sort=newest|oldest|soonest`, `limit` (1–50, default 20), `offset`; returns `{ posts, limit, offset, has_more }`. Completed requests are left out unless `mine=true` or `status=complete`
    - `POST /posts`: `{ kind, title, description, extras?, location?, location_flexible?, tags: [1–10], slots: [{ starts_at, ends_at }] (1–100) }` → 201 `{ message, post }`. Limits: title 100, description 2000, extras 500, location 150, tag 30 characters; a tag matching a premade one is saved with the premade spelling
    - `GET /posts/:id` → `{ post }` with `slots` and `is_owner`
    - `PATCH /posts/:id` (poster only): any of `description`, `extras`, `tags`, and for offers `status` (`available`/`unavailable`). Title, location, and dates are locked after posting (400)
    - `DELETE /posts/:id` (poster or admin)
    - every post has `author` (`user_id`, `username`, `first_name`, `last_name`, `nyit_email`, `kudos`), `tags`, `comment_count`; ids are numbers
- Profanity filter (`src/utils/profanity.js`) on every text field and tag: slurs and severe profanity → 400 naming the field; mild words (damn, crap, hell, ass) allowed. Whole-word matching, so words like "Scunthorpe" or "spicy" pass; catches f*ck, fuuuck, f u c k, sh1t
- New `middleware/requireProfile.js`: 404 when a valid token has no `users` row
- Tested against a throwaway Postgres built from `sql/001–014` (013/014 run twice) with Supabase faked: API 28/28, profanity 93/93; users API 21/21 and controller 7/7 still pass
- Skill Exchange, part 3 of 5 (comments + notifications). No DB changes (uses the `sql/014` columns)
    - `GET /skill-exchange/posts/:id/comments` (any signed-in user): `{ comments }` oldest first, each with `author` (name, NYIT email, Kudos), `parent_comment_id` (replies), `is_mine`
    - `POST /skill-exchange/posts/:id/comments`: `{ body, parent_comment_id? }` → 201 `{ message, comment }`. 1–1000 characters, profanity filter. Only the post's owner can reply (403), and only to a top-level comment on the same post (400). Works on closed and completed posts
    - `DELETE /skill-exchange/comments/:id` (its author or an admin; replies go with it)
    - notifications: a comment on someone else's post → the poster gets `skill_comment` ("New comment on your request/offer", "<name> commented on "<post>": <first 100 characters>"); the poster's reply → the person replied to gets `skill_reply`; the poster's own top-level comments and self-replies notify no one. Saved in the same transaction as the comment (`src/utils/notifications.js`)
    - new `GET /notifications?unread=true&limit=&offset=` (own only): `{ notifications, unread_count, limit, offset, has_more }`, newest first; each has `actor` (name, no email), `post_id`, and `post_kind` (null when the post was deleted)
    - new `POST /notifications/:id/read` → `{ notification_id, unread_count }` (someone else's → 404) and `POST /notifications/read-all` → `{ updated, unread_count: 0 }`
    - Tested (throwaway Postgres, Supabase faked): comments + notifications 17/17; posts API 28/28, users API 21/21, controller 7/7 still pass
- Skill Exchange, part 4 of 5 (interest → accept/decline → cancel). No DB changes (uses the `sql/013` `skill_engagements` table)
    - `POST /skill-exchange/posts/:id/interest` (anyone but the poster): `{ starts_at, ends_at, location?, message? }` → 201 `{ message, engagement }`
        - requests must be open, offers available (409); one pending/accepted response per person per post (409)
        - the time must sit inside one of the post's dates (400) and, for offers, not overlap an accepted booking (409); it must not have started
        - a different `location` only if the post's is flexible or empty (400), otherwise the post's location is used; message ≤ 300 characters; profanity filter
        - the poster gets `skill_interest` (who, which post, time, place, message)
    - `GET /skill-exchange/posts/:id/engagements`: the poster gets every response (pending first), anyone else only their own; `GET /skill-exchange/engagements/:id` (the two people involved or an admin; 403 otherwise)
    - `POST /skill-exchange/engagements/:id/accept` (poster, pending only, time not passed): `{ message? }`
        - request → `closed`, its other pending responses are closed silently; offer → stays `available`, the accepted time is blocked and overlapping pending responses are closed silently
        - **both people get `skill_accepted` with the other's name, NYIT email, time, and place** (plus the poster's message)
    - `POST /skill-exchange/engagements/:id/decline` (poster): `{ message? }`; silent unless there's a message (`skill_declined`)
    - `POST /skill-exchange/engagements/:id/cancel`: accepted → either person cancels, the other gets `skill_cancelled` (with the optional message), a request goes back to `open`; pending → the sender withdraws it silently
    - every change locks the post row (`SELECT … FOR UPDATE`), so two accepts of the same request, or two bookings of the same offer time, can't both succeed
    - `GET /skill-exchange/posts/:id` adds `busy` (an offer's booked times, no names) and `my_engagement` (the viewer's pending/accepted response or null)
    - `DELETE /skill-exchange/posts/:id` now runs in a transaction and tells everyone with an accepted agreement that it's off (`skill_cancelled`)
    - Tested (throwaway Postgres, Supabase faked): agreements 20/20 (incl. both races); posts 28, comments 17, users 21, controller 7 still pass
- Skill Exchange, part 5 of 5 (complete + Kudos + Profile numbers). No DB changes (uses `kudos` and `skill_engagements.kudos_requested_at` from `sql/013`)
    - `POST /skill-exchange/engagements/:id/complete` (poster, accepted only; pending → 409 "Accept it first"): `{ award_kudos? }`
        - request: agreement → `completed`, request → `complete` (leaves the Requests tab); `award_kudos: true` gives the helper Kudos, otherwise the helper is told it was marked complete
        - offer: agreement → `completed`, `kudos_requested_at` set, the other person gets `skill_kudos_request`; `award_kudos` → 400 (on an offer the person helped gives the Kudos); the offer stays `available`
    - `POST /skill-exchange/engagements/:id/kudos` (completed only, once): request → the poster gives it; offer → the person who was helped gives it (403 for anyone else, 409 if already given). The receiver gets a `general` notification "⭐ <name> gave you Kudos"
    - one Kudos per agreement (unique `kudos.engagement_id`; two at once → one 200, one 409); Kudos stay if the post is deleted
    - engagement responses add `kudos_given`
    - new `GET /skill-exchange/summary` (own only): `{ post_count, request_count, offer_count, kudos, recent }` (3 newest posts)
    - Tested (throwaway Postgres, Supabase faked): complete + Kudos + summary 9/9; agreements 20, comments 17, posts 28, users 21, controller 7 still pass
### Frontend
#### Anthony Dominguez
- Skill Exchange, part 2 of 5 (screens). The tab now uses the real API; the hard-coded cards (including teammates' names) are gone
    - `(tabs)/skill-exchange.tsx` (layout from PR #42 kept): **Requests | Offers** switch; search (title, description, extras, tags, poster name; waits 300 ms after typing); the Filter sheet now filters: tags from the premade list or typed (any of them), sort (newest / oldest / soonest date), status, "Only my posts"; active filters show as chips (tap to remove, "Clear all"); pull to refresh, "Load more" (20 at a time), loading / empty / error states (expired session gets its own message); `filterVisble` typo gone
    - post card: poster name, NYIT email, Kudos ⭐, post age, kind and status badges, title, tags, comment count; "Show details" expands the description, extras, and location in place; tapping the title or "Open" opens the post
    - new `skill/[id].tsx` (post screen): everything above plus the dates and the poster's tools: Edit, Available switch (offers), Delete (asks first, inline). Admins can delete any post. Reloads when you come back to it; deleted/missing posts show "Post not found"
    - new `skill/new.tsx` (post form, also edit with `?id=`): Request/Offer switch, title, description (with counters), tags, dates, location + "Flexible location", extras; inline errors; server errors (e.g. profanity) shown on the form. Editing shows the title, location, and dates as locked
    - dates use a calendar: requests pick "Need it by a date" (any time until the end of that day) or specific dates; offers pick specific dates. One time window for all picked dates (or all day), and "Repeat weekly" for up to 15 more weeks. Always campus (New York) time, whatever the phone's time zone; times already past today are left out
    - new components: `skill-cards.tsx`, `tag-picker.tsx` (browse groups, search, add your own; premade list loaded once), `slot-picker.tsx`; new `lib/skill-dates.ts` (campus-time date math), `lib/calendar.ts` (month grid, now shared with the Events calendar)
    - `lib/api.ts`: `skillApi` (tags, list, get, create, update, remove), Skill Exchange types, `SKILL_LIMITS`
    - accessibility: labels and roles on every control, selected/expanded states, 44 px touch targets, badge colours meet WCAG AA
- No new dependencies. Comments, "I can help", notifications, and Kudos come in parts 3–5; Profile's Skill Posts stat is still 0 until part 5
- Tested: `tsc`; web (23 routes) + Android exports; date helpers 36/36 in six phone time zones; new Skill Exchange click-through 22/22 against the real backend + a throwaway Postgres (Supabase faked); navigation 37, auth 27, forgot password 15, Profile 31, API address 7, `pickApiUrl` 21, all passing
- Skill Exchange, part 3 of 5 (comments + notifications)
    - post screen: **Comments** section. Each comment shows name, Kudos, NYIT email, time, and a "Poster" badge on the poster's comments; the poster's replies are indented under the comment. The poster gets "Reply" on other people's comments; authors (and admins) get "Delete" (asks first; deleting a comment removes its replies). The box below says who will be notified; profanity and other server errors show under it. Pull to refresh reloads the comments
    - **Notifications screen now uses the API** (`GET /notifications`): unread items are highlighted with a dot; "Mark all as read"; pull to refresh; "Load more". Tapping one marks it read and opens the post (comments and replies open it scrolled to the comments); if the post was deleted it says so. **The mock club/event notifications are gone** (no backend for them yet)
    - 🔔 on Home, Explore, and Events shows a red unread badge (screen readers: "Notifications, 2 unread"), refreshed when the screen opens; no background polling (shared `NotificationBell` + `state/notifications.tsx`)
    - `lib/api.ts`: `skillCommentsApi`, `notificationsApi`, comment/notification types; `data/mock-data.ts`: mock notifications removed
- Tested: `tsc`; web (23 routes) + Android exports; new two-user comments/notifications click-through 14/14 (real backend + throwaway Postgres); Skill Exchange 22, navigation 37, auth 27, forgot password 15, Profile 31, `pickApiUrl` 21 still pass (the navigation and Profile tests now expect the new Notifications screen)
- Skill Exchange, part 4 of 5 (interest → accept/decline → cancel)
    - post screen: **"🙋 I can help"** on open requests and **"📩 Request this offer"** on available offers (not on your own post). After responding it shows "Waiting for <poster> to reply" or "You're all set with <poster>" with their email; closed/unavailable posts say so. Offers list "Already booked" times
    - new `skill/interest.tsx`: calendar where only days with free time can be picked, free-time chips when a day has several, start/end steppers that stay inside the free time (30-minute steps), place (editable only if the post's location is flexible or empty; otherwise "Meets at …"), optional message, then a **confirm panel** ("This will notify … Send it?") before anything is sent
    - new `skill/engagement/[id].tsx`: the response/agreement. Poster: optional message, Accept / Decline, each confirmed (Decline says it's silent without a message). Responder: "Withdraw my response". Agreed: contact card with the other person's NYIT email, both messages, "Cancel this agreement" with an optional message (confirmed)
    - poster's post screen: **Responses** list (pending first, Kudos, time, place, message) → opens each one
    - Notifications: interest / accepted / declined / cancelled open the agreement screen
    - new `components/month-calendar.tsx` (shared by the post form and the interest screen; the post form's picker now uses it), `lib/skill-dates.ts` `freeWindows()` / `slotDays()`, `engagementsApi` + types in `lib/api.ts`
    - accessibility: the confirm panels' "Go back" was renamed "Not now" (it clashed with the header's back button for screen readers); 44 px targets checked
- Tested: `tsc`; web (25 routes) + Android exports; date helpers 49/49 in six phone time zones; new two-user agreement click-through 15/15 (real backend + throwaway Postgres); Skill Exchange 22, comments 14, navigation 37, auth 27, forgot password 15, Profile 31, `pickApiUrl` 21 still pass
- Skill Exchange, part 5 of 5 (complete + Kudos + Profile numbers)
    - agreement screen, poster of an agreed post: **"Done?"** box. Requests: "Give <helper> Kudos ⭐" switch (on by default) + "✓ Mark complete". Offers: "✓ Mark complete & ask for Kudos". Both confirmed first
    - completed agreements: the person who gives Kudos (request: the poster; offer: the person helped) gets "⭐ Give <name> Kudos" (confirmed); afterwards everyone sees "You gave … Kudos" / "… gave you Kudos"; the poster of an offer sees "Waiting for … to give Kudos"
    - Kudos notifications ("asks for Kudos", "gave you Kudos", "marked it complete") open the agreement
    - poster's Responses list keeps completed agreements (COMPLETED)
    - **Profile**: "Skill Posts" now counts your posts (was always 0), a "⭐ N Kudos (requests and offers fulfilled)" line, and the Skill Exchange section lists your 3 newest posts (kind · status) → opens them; refreshed each time Profile opens (`GET /skill-exchange/summary`)
- Tested: `tsc`; web (25 routes) + Android exports; new two-user complete/Kudos click-through 11/11; Skill Exchange 22, comments 14, agreements 15, navigation 37, auth 27, forgot password 15, Profile 31, `pickApiUrl` 21 still pass
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
#### Ahren Agatep
- Add `POST /clubs/:id/join` for students to join clubs
- Add `DELETE /clubs/:id/join` for students to leave clubs
    - Presidents can't leave their own club
        - PENDING: Add logic to transfer ownership of club so graduating presidents can leave
- Enforced unique club names (not case sensitive) with a lower(name) index
    - Dupes return 409 on create/update
- Aligned the clubs API with the frontend mock data
    - category allow-list
    - `member_count` on `GET /clubs/:id`
    - BIGINT IDs returned as numbers
- Updated `clubsController.js` with category validation
- Still needed to align w/ the frontend:
    - `end_date` and `category` on events
    - `club_id` and `event_id` on notifs
    - `attendee_count` can be computed with a `COUNT`
    - Need to confer with frontend before schema changes 
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
