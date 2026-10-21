-- 008_create_favorites.sql
-- junction table: clubs a user has favorited/saved

CREATE TABLE IF NOT EXISTS favorites (
    club_id     BIGINT NOT NULL REFERENCES clubs(club_id) ON DELETE CASCADE,
    user_id     BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (club_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
