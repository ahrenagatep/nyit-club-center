-- 014_notifications_skill_exchange.sql
-- (numbered 013 until 2026-10-09; renamed with 013_create_skill_exchange.sql.
--  Contents unchanged; already applied to the shared database.)
-- Lets notifications point at what they're about (so tapping one opens it),
-- adds read/unread, and adds the Skill Exchange notification types.
-- Needs 013. Every statement is idempotent, so running it again changes nothing.

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read       BOOLEAN NOT NULL DEFAULT false;
-- who caused it (the commenter, the person who expressed interest, ...)
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS actor_user_id BIGINT REFERENCES users(user_id) ON DELETE SET NULL;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS post_id       BIGINT REFERENCES skill_posts(post_id) ON DELETE SET NULL;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS engagement_id BIGINT REFERENCES skill_engagements(engagement_id) ON DELETE SET NULL;

-- 009 created the type check inline, so Postgres named it notifications_type_check
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'notifications'::regclass
          AND conname = 'notifications_type_check'
          AND pg_get_constraintdef(oid) LIKE '%skill_kudos_request%'
    ) THEN
        ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
        ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (type IN (
            'general', 'event_reminder', 'announcement', 'message_alert',
            'skill_comment',        -- someone commented on your post
            'skill_reply',          -- the poster replied to your comment
            'skill_interest',       -- someone expressed interest in your post
            'skill_accepted',       -- the poster accepted your interest
            'skill_declined',       -- the poster declined and left a message (silent declines send nothing)
            'skill_cancelled',      -- the other side cancelled the agreement
            'skill_kudos_request'   -- an offer's poster asks you for Kudos
        ));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_notifications_user_sent ON notifications(user_id, sent_at DESC);
