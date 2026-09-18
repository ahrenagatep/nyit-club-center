-- 004_create_events.sql

CREATE TABLE IF NOT EXISTS events (
    event_id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    club_id         BIGINT NOT NULL REFERENCES clubs(club_id) ON DELETE CASCADE,
    title           VARCHAR(150) NOT NULL,
    description     TEXT,
    event_date      TIMESTAMPTZ NOT NULL,
    location        VARCHAR(255),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_club_id ON events(club_id);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);
