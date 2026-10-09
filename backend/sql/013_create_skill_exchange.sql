-- 013_create_skill_exchange.sql
-- (numbered 012 until 2026-10-09; renamed because main added 012_clubs_unique_name.sql.
--  Contents unchanged; already applied to the shared database.)
-- Skill Exchange: students post requests ("I need help with...") and offers
-- ("I can help with..."), comment on them, express interest, agree on a time,
-- and award Kudos once the help is given.
-- Every statement is idempotent, so running it again changes nothing.

-- one row per request or offer post
CREATE TABLE IF NOT EXISTS skill_posts (
    post_id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id           BIGINT       NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    kind              VARCHAR(10)  NOT NULL CHECK (kind IN ('request', 'offer')),
    title             VARCHAR(100) NOT NULL CHECK (char_length(btrim(title)) > 0),
    description       TEXT         NOT NULL CHECK (char_length(btrim(description)) BETWEEN 1 AND 2000),
    extras            TEXT         CHECK (char_length(extras) <= 500),
    location          VARCHAR(150),
    location_flexible BOOLEAN      NOT NULL DEFAULT false,
    -- requests: open -> closed (helper agreed) -> complete; offers: available <-> unavailable
    status            VARCHAR(12)  NOT NULL CHECK (
                          (kind = 'request' AND status IN ('open', 'closed', 'complete'))
                       OR (kind = 'offer'   AND status IN ('available', 'unavailable'))
                      ),
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_skill_posts_kind_status_created ON skill_posts(kind, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_skill_posts_user_id ON skill_posts(user_id);

-- tags as the poster typed or picked them; matching is case-insensitive
CREATE TABLE IF NOT EXISTS skill_post_tags (
    post_id BIGINT      NOT NULL REFERENCES skill_posts(post_id) ON DELETE CASCADE,
    tag     VARCHAR(30) NOT NULL CHECK (char_length(btrim(tag)) > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_skill_post_tags_post_tag ON skill_post_tags(post_id, lower(tag));
CREATE INDEX IF NOT EXISTS idx_skill_post_tags_tag ON skill_post_tags(lower(tag));

-- when the poster is available (offers) or needs the help by (requests);
-- an all-day date is stored as midnight to midnight New York time
CREATE TABLE IF NOT EXISTS skill_post_slots (
    slot_id   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    post_id   BIGINT      NOT NULL REFERENCES skill_posts(post_id) ON DELETE CASCADE,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at   TIMESTAMPTZ NOT NULL,
    CHECK (ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS idx_skill_post_slots_post_id ON skill_post_slots(post_id, starts_at);

-- comments; only the post's owner replies to a comment (parent_comment_id), one level deep
CREATE TABLE IF NOT EXISTS skill_comments (
    comment_id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    post_id           BIGINT      NOT NULL REFERENCES skill_posts(post_id) ON DELETE CASCADE,
    user_id           BIGINT      NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    parent_comment_id BIGINT      REFERENCES skill_comments(comment_id) ON DELETE CASCADE,
    body              TEXT        NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 1000),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_skill_comments_post_id ON skill_comments(post_id, created_at);

-- a user's interest in a post (the "I can help" / "I'd like this" button) and,
-- once the poster accepts, the agreement between them
CREATE TABLE IF NOT EXISTS skill_engagements (
    engagement_id      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    post_id            BIGINT       NOT NULL REFERENCES skill_posts(post_id) ON DELETE CASCADE,
    user_id            BIGINT       NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,  -- who pressed the button
    starts_at          TIMESTAMPTZ  NOT NULL,
    ends_at            TIMESTAMPTZ  NOT NULL,
    location           VARCHAR(150),
    message            VARCHAR(300),
    status             VARCHAR(10)  NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled', 'completed')),
    response_message   VARCHAR(300),  -- the poster's note when accepting or declining
    cancelled_by       BIGINT       REFERENCES users(user_id) ON DELETE SET NULL,
    cancel_message     VARCHAR(300),
    kudos_requested_at TIMESTAMPTZ,   -- offers: when the poster asked for Kudos
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CHECK (ends_at > starts_at)
);

-- one pending interest per user per post
CREATE UNIQUE INDEX IF NOT EXISTS idx_skill_engagements_one_pending
    ON skill_engagements(post_id, user_id) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_skill_engagements_post_status ON skill_engagements(post_id, status);
CREATE INDEX IF NOT EXISTS idx_skill_engagements_user_id ON skill_engagements(user_id);

-- one Kudos per completed agreement; kept if the post is deleted later
CREATE TABLE IF NOT EXISTS kudos (
    kudos_id      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    engagement_id BIGINT      UNIQUE REFERENCES skill_engagements(engagement_id) ON DELETE SET NULL,
    giver_id      BIGINT      NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    receiver_id   BIGINT      NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (giver_id <> receiver_id)
);

CREATE INDEX IF NOT EXISTS idx_kudos_receiver_id ON kudos(receiver_id);

-- Like every other table in the shared Supabase database: row level security on with
-- no policies, so Supabase's public API (anon/authenticated) can't read or write these.
-- The backend connects as the table owner, which RLS doesn't apply to.
ALTER TABLE skill_posts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_post_tags   ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_post_slots  ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_comments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE kudos             ENABLE ROW LEVEL SECURITY;
