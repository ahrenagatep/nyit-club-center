-- 015_create_announcements.sql

CREATE TABLE IF NOT EXISTS announcements (
    announcement_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    club_id     BIGINT NOT NULL REFERENCES clubs(club_id) ON DELETE CASCADE,
    title      VARCHAR(200) NOT NULL,
    content    TEXT NOT NULL,
    sent_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_announcements_club_id ON announcements(club_id);
