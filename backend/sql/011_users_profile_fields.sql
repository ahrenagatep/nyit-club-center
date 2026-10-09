-- 011_users_profile_fields.sql
-- Profile fields the app's Edit Profile pop-up saves through PATCH /users/me.
-- bio already exists (001); this adds major and school_year and limits all three
-- to what the app allows. Every statement is idempotent, so running it again changes nothing.

ALTER TABLE users ADD COLUMN IF NOT EXISTS major       VARCHAR(80);
ALTER TABLE users ADD COLUMN IF NOT EXISTS school_year VARCHAR(20);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'users'::regclass AND conname = 'users_school_year_check'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT users_school_year_check
            CHECK (school_year IN ('Freshman', 'Sophomore', 'Junior', 'Senior'));
    END IF;

    -- matches the 200-character limit in the app and the API
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'users'::regclass AND conname = 'users_bio_length_check'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT users_bio_length_check
            CHECK (char_length(bio) <= 200);
    END IF;
END $$;
