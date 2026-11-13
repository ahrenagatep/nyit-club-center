// Club events from the backend (GET /events, /events/:id) mapped to the UI shape, plus campus-time date helpers.
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { ApiError, eventsApi, type ApiEvent, type EventQuery } from './api';
import { CATEGORIES } from './clubs';
import { CAMPUS_TIME_ZONE, campusTimeToIso } from './skill-dates';
import { pad, type CalendarMonth } from './calendar';

/** Event filters on the Events tab: every club category plus "Workshop" (same list as sql/016). */
export const EVENT_CATEGORIES = [...CATEGORIES, 'Workshop'] as const;
export type EventCategory = (typeof EVENT_CATEGORIES)[number];

export function isEventCategory(value: unknown): value is EventCategory {
  return typeof value === 'string' && (EVENT_CATEGORIES as readonly string[]).includes(value);
}

export type ClubEvent = {
  event_id: number;
  club_id: number;
  club_name: string;
  title: string;
  description: string;
  event_date: string; // ISO start
  end_date?: string; // ISO end (API ends_at), when the event has one
  location: string;
  category: EventCategory;
  attendee_count: number; // RSVPs from the API; useAppState().attendeeCount(event) has the latest after a toggle
};

// API row → UI shape; fills in null description/location and maps an unknown category to Social (like toClub)
export function toEvent(row: ApiEvent): ClubEvent {
  return {
    event_id: row.event_id,
    club_id: row.club_id,
    club_name: row.club_name,
    title: row.title,
    description: row.description ?? '',
    event_date: row.event_date,
    end_date: row.ends_at ?? undefined,
    location: row.location ?? 'Location TBA',
    category: isEventCategory(row.category) ? row.category : 'Social',
    attendee_count: row.attendee_count,
  };
}

const errorMessage = (e: unknown, fallback: string) => (e instanceof ApiError ? e.message : fallback);

/** Events from GET /events (no params = upcoming); reloads whenever the screen comes into view or params change. */
export function useEvents(query: EventQuery = {}) {
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadedKey = useRef<string | null>(null); // params of the results currently shown
  const key = JSON.stringify(query); // callers pass a new object each render; a string key only changes when the values do

  useFocusEffect(
    useCallback(() => {
      let cancelled = false; // set on cleanup, so a late reply for old params (e.g. last month) is ignored
      if (loadedKey.current !== key) setLoading(true); // new params: don't show the old results meanwhile
      eventsApi
        .list(JSON.parse(key) as EventQuery)
        .then(({ events: rows }) => {
          if (cancelled) return;
          setEvents(rows.map(toEvent));
          setError(null);
          loadedKey.current = key;
        })
        .catch((e) => {
          if (!cancelled) setError(errorMessage(e, 'Could not load events.'));
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }, [key]),
  );

  return { events, loading, error };
}

/** One event from GET /events/:id; reloads on focus so the count stays current. */
export function useEvent(id: number) {
  const [event, setEvent] = useState<ClubEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      // a bad id in the URL is "not found" without asking the server
      if (!Number.isInteger(id) || id <= 0) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      eventsApi
        .get(id)
        .then(({ event: row }) => {
          if (cancelled) return;
          setEvent(toEvent(row));
          setError(null);
          setNotFound(false);
        })
        .catch((e) => {
          if (cancelled) return;
          // 404/400 → "not found" page; anything else (offline, 500) → error message
          if (e instanceof ApiError && (e.status === 404 || e.status === 400)) setNotFound(true);
          else setError(errorMessage(e, 'Could not load this event.'));
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }, [id]),
  );

  return { event, loading, error, notFound };
}

/** True once the event has ended (or started, when it has no end time); same rule as the API's 409. */
export function isPast(event: Pick<ClubEvent, 'event_date' | 'end_date'>, now = Date.now()): boolean {
  return new Date(event.end_date ?? event.event_date).getTime() < now;
}

/** [from, to) for a calendar month: campus midnight on the 1st through campus midnight on the next 1st.
 *  Uses New York time so an 11:30 PM event isn't pulled into the next month on a phone set to another zone. */
export function campusMonthRange({ year, month }: CalendarMonth): { from: string; to: string } {
  const next = month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 };
  return {
    from: campusTimeToIso(`${year}-${pad(month + 1)}-01`, 0),
    to: campusTimeToIso(`${next.year}-${pad(next.month + 1)}-01`, 0),
  };
}

// ---------- Formatting (campus time, so dates don't shift on phones set to another zone) ----------

export function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: CAMPUS_TIME_ZONE,
  });
}

/** Month and day as separate strings, for the stacked date badge on the Events tab. */
export function formatEventMonthDay(iso: string): { month: string; day: string } {
  const date = new Date(iso);
  return {
    month: date.toLocaleDateString('en-US', { month: 'short', timeZone: CAMPUS_TIME_ZONE }),
    day: date.toLocaleDateString('en-US', { day: 'numeric', timeZone: CAMPUS_TIME_ZONE }),
  };
}

export function formatEventTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: CAMPUS_TIME_ZONE,
  });
}

/** "6:00 PM – 9:00 PM", or just the start time when the event has no end time. */
export function formatEventTimeRange(event: Pick<ClubEvent, 'event_date' | 'end_date'>): string {
  const start = formatEventTime(event.event_date);
  return event.end_date ? `${start} – ${formatEventTime(event.end_date)}` : start;
}

export function formatEventDateLong(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: CAMPUS_TIME_ZONE,
  });
}

/** "YYYY-MM-DD" in campus time; used to match events to calendar days. */
export function campusDateKey(iso: string): string {
  // en-CA formats dates as YYYY-MM-DD.
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: CAMPUS_TIME_ZONE });
}
