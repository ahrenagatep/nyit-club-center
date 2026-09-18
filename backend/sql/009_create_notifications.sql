-- 009_create_notifications.sql

CREATE TABLE IF NOT EXISTS notifications (
    notification_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    title           VARCHAR(150) NOT NULL,
    message         TEXT NOT NULL,
    type            VARCHAR(30) NOT NULL DEFAULT 'general' CHECK (type IN ('general', 'event_reminder', 'announcement', 'message_alert')),
    sent_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
