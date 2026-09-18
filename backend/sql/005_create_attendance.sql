-- 005_create_attendance.sql
-- junction table: event registration + check-in status per user

CREATE TABLE IF NOT EXISTS attendance (
    user_id         BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    event_id        BIGINT NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    status          VARCHAR(20) NOT NULL DEFAULT 'registered'
                    CHECK (status IN ('registered', 'checked_in', 'cancelled', 'no_show')),
    checked_in_at   TIMESTAMPTZ,
    registered_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_attendance_event_id ON attendance(event_id);
