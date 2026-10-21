-- 006_create_club_messages.sql
-- group chat messages scoped to a club

CREATE TABLE IF NOT EXISTS club_messages (
    message_id  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    club_id     BIGINT NOT NULL REFERENCES clubs(club_id) ON DELETE CASCADE,
    sender_id   BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    content     TEXT NOT NULL,
    sent_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_club_messages_club_id ON club_messages(club_id);
CREATE INDEX IF NOT EXISTS idx_club_messages_sender_id ON club_messages(sender_id);
