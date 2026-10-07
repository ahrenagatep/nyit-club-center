-- 007_create_direct_messages.sql
-- one-on-one private messaging between two users

CREATE TABLE IF NOT EXISTS direct_messages (
    message_id  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sender_id   BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    receiver_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    content     TEXT NOT NULL,
    sent_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (sender_id <> receiver_id)
);

CREATE INDEX IF NOT EXISTS idx_dm_sender_id ON direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_dm_receiver_id ON direct_messages(receiver_id);
