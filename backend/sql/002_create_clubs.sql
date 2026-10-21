-- 002_create_clubs.sql

CREATE TABLE IF NOT EXISTS clubs (
    club_id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    president_id    BIGINT NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    name            VARCHAR(150) NOT NULL,
    description     TEXT,
    category        VARCHAR(50),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clubs_president_id ON clubs(president_id);
CREATE INDEX IF NOT EXISTS idx_clubs_category ON clubs(category);
