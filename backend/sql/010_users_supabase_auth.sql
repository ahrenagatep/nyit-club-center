-- 010_users_supabase_auth.sql
-- Brings the users table from 001 in line with the live database after the
-- switch to Supabase Auth (changes that were first applied by hand on 2026-09-28/30).
-- Every statement is idempotent: on the live database this file changes nothing.

-- Supabase Auth holds credentials, so the local bcrypt column is gone.
ALTER TABLE users DROP COLUMN IF EXISTS password;

-- Links each local profile to its Supabase Auth user (data.user.id).
-- NOT NULL is safe here because every user is created through /auth/register.
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_user_id UUID NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'users'::regclass AND conname = 'users_auth_user_id_key'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT users_auth_user_id_key UNIQUE (auth_user_id);
    END IF;
END $$;

-- TEMPORARY: the @nyit.edu-only check is off until NYIT's mail servers accept
-- our verification emails (see CHANGELOG 2026-09-30). The app still checks the
-- format in backend/src/utils/nyitEmail.js. Re-enable with a new migration:
--   ALTER TABLE users ADD CONSTRAINT users_nyit_email_check
--       CHECK (nyit_email ~* '^[A-Za-z0-9._%+-]+@nyit\.edu$');
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_nyit_email_check;
