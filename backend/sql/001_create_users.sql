-- 001_create_users.sql

CREATE TABLE IF NOT EXISTS users (
    user_id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nyit_email VARCHAR(255) NOT NULL UNIQUE CHECK (nyit_email ~* '^[A-Za-z0-9._%+-]+@nyit\.edu$'),
    password        VARCHAR(255) NOT NULL,           -- bcrypt hash
    username        VARCHAR(50)  NOT NULL UNIQUE,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    bio             TEXT,
    profile_image   TEXT,
    role            VARCHAR(20)  NOT NULL DEFAULT 'student'
                    CHECK (role IN ('student', 'moderator', 'admin')),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- INDEX speeds up lookups/filters on this column (e.g. WHERE role = '...')
-- no changes needed to queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
