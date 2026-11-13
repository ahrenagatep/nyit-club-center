-- 016_events_end_category.sql
-- Events API: optional end time and category on events, an index for "my RSVPs",
-- and RLS on events/attendance (no-op where it's already on; keeps fresh builds matching live).
-- Every statement is idempotent, so running it again changes nothing.

ALTER TABLE events ADD COLUMN IF NOT EXISTS ends_at  TIMESTAMPTZ;
-- NULL means "use the club's category"
ALTER TABLE events ADD COLUMN IF NOT EXISTS category VARCHAR(20);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'events'::regclass AND conname = 'events_ends_at_check'
    ) THEN
        ALTER TABLE events ADD CONSTRAINT events_ends_at_check
            CHECK (ends_at IS NULL OR ends_at > event_date);
    END IF;

    -- the club categories plus Workshop (the Events tab's filter chips)
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'events'::regclass AND conname = 'events_category_check'
    ) THEN
        ALTER TABLE events ADD CONSTRAINT events_category_check
            CHECK (category IS NULL OR category IN ('Academic', 'Sports', 'Arts', 'Tech', 'Social', 'Workshop'));
    END IF;
END $$;

-- GET /users/me/events: one user's active RSVPs
CREATE INDEX IF NOT EXISTS idx_attendance_user_status ON attendance(user_id, status);

ALTER TABLE events     ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
