-- 003_create_memberships.sql
-- junction table: which users belong to which clubs, and in what capacity

CREATE TABLE IF NOT EXISTS memberships (
    user_id     BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    club_id     BIGINT NOT NULL REFERENCES clubs(club_id) ON DELETE CASCADE,
    role        VARCHAR(20) NOT NULL DEFAULT 'member'
                CHECK (role IN ('member', 'officer', 'president')),
    status      VARCHAR(20) NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'pending', 'removed')),
    joined_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, club_id)
);

CREATE INDEX IF NOT EXISTS idx_memberships_club_id ON memberships(club_id);
