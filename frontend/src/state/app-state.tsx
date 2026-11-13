/**
 * App-wide state for club memberships and RSVPs.
 *
 * Memberships come from the backend: joined clubs load from GET /users/me/memberships
 * on login, and toggleJoin calls POST / DELETE /clubs/:id/join.
 * RSVPs come from the backend too: GET /users/me/events on login, and toggleRsvp calls
 * POST / DELETE /events/:id/rsvp.
 */

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import { useAuth } from '@/state/auth';
import { ApiError, clubsApi, eventsApi, membershipsApi } from '@/lib/api';
import { toClub, type MyClub } from '@/lib/clubs';
import { toEvent, type ClubEvent } from '@/lib/events';

type AppState = {
  joinedClubIds: number[];
  myClubs: MyClub[];
  rsvpEventIds: number[];
  /** The user's upcoming RSVP'd events (GET /users/me/events), soonest first. */
  rsvpEvents: ClubEvent[];
  isJoined: (clubId: number) => boolean;
  hasRsvp: (eventId: number) => boolean;
  toggleJoin: (clubId: number) => void;
  /** RSVP or cancel; resolves to an error message (already shown to the user) or null. */
  toggleRsvp: (eventId: number) => Promise<string | null>;
  rsvpPending: (eventId: number) => boolean;
  /** The event's count, updated right after this user's RSVP changes it. */
  attendeeCount: (event: Pick<ClubEvent, 'event_id' | 'attendee_count'>) => number;
};

const AppStateContext = createContext<AppState | null>(null);

// RN's Alert does nothing on web, so web uses the browser's alert
function showRsvpError(message: string) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.alert(message);
  } else {
    Alert.alert("Couldn't update your RSVP", message);
  }
}

export function AppStateProvider({ children }: { children: ReactNode }) {

  const { session } = useAuth(); // the logged in user's session (token)
  const [myClubs, setMyClubs] = useState<MyClub[]>([]);

  // starts empty, filled in from the backend below
  const [joinedClubIds, setJoinedClubIds] = useState<number[]>([]);

  const loadMemberships = useCallback(async (token: string) => {
    try {
      const rows = await membershipsApi.mine(token);
      setJoinedClubIds(rows.map((row) => row.club_id));
      setMyClubs(rows.map((row) => ({ ...toClub(row), role: row.role })));
    } catch {
      // offline / expired session, keep what we have
    }
  }, []);

  // load user's clubs when they log in / out
  useEffect(() => {
    if (!session) {
      setJoinedClubIds([]); // logged out , no clubs
      setMyClubs([]);
      return;
    }

    loadMemberships(session.access_token);

  }, [session?.access_token, loadMemberships]);

  const [rsvpEventIds, setRsvpEventIds] = useState<number[]>([]); // what hasRsvp / the Going filter check
  const [rsvpEvents, setRsvpEvents] = useState<ClubEvent[]>([]); // full rows, for Profile's list
  const [pendingIds, setPendingIds] = useState<number[]>([]); // RSVP requests in flight (buttons disabled)
  // counts returned by the last RSVP/cancel, so every card shows the new number without refetching its list
  const [countOverrides, setCountOverrides] = useState<Record<number, number>>({});

  const loadRsvps = useCallback(async (token: string) => {
    try {
      const { events } = await eventsApi.mine(token);
      setRsvpEvents(events.map(toEvent));
      setRsvpEventIds(events.map((event) => event.event_id));
    } catch {
      // offline / expired session, keep what we have
    }
  }, []);

  // load the user's RSVPs when they log in; clear them on log out
  useEffect(() => {
    if (!session) {
      setRsvpEventIds([]);
      setRsvpEvents([]);
      setPendingIds([]);
      setCountOverrides({});
      return;
    }
    loadRsvps(session.access_token);
  }, [session?.access_token, loadRsvps]);

  const toggleJoin = useCallback(async (clubId: number) => {
    if (!session) {
      return; // must be logged in to join / leave
    }

    const token = session.access_token;
    const joined = joinedClubIds.includes(clubId);

    try {
      // if joined, call leave, otherwise call join
      if (joined) {
        await clubsApi.leave(clubId, token);
      } else {
        await clubsApi.join(clubId, token);
      }

      await loadMemberships(token); // only reached if the request succeeded
    } catch {
      // request failed (like a president can't leave), keep the button as it was
    }
  }, [session, joinedClubIds, loadMemberships]);

  const toggleRsvp = useCallback(async (eventId: number): Promise<string | null> => {
    if (!session || pendingIds.includes(eventId)) return null; // ignore a second tap while saving

    const token = session.access_token;
    const going = rsvpEventIds.includes(eventId);
    setPendingIds((ids) => [...ids, eventId]);

    try {
      const result = going ? await eventsApi.cancelRsvp(eventId, token) : await eventsApi.rsvp(eventId, token);
      // trust the server's answer (going true/false), not what we expected
      setRsvpEventIds((ids) =>
        result.going ? (ids.includes(eventId) ? ids : [...ids, eventId]) : ids.filter((id) => id !== eventId),
      );
      setCountOverrides((counts) => ({ ...counts, [eventId]: result.attendee_count }));
      loadRsvps(token); // refreshes the event list Profile shows
      return null;
    } catch (e) {
      // request failed: keep the button as it was and say why
      const message =
        e instanceof ApiError && e.status === 401
          ? 'Your session has expired. Sign out and log in again.'
          : e instanceof Error
            ? e.message
            : "Couldn't update your RSVP. Please try again.";
      showRsvpError(message);
      return message;
    } finally {
      setPendingIds((ids) => ids.filter((id) => id !== eventId));
    }
  }, [session, pendingIds, rsvpEventIds, loadRsvps]);

  const value = useMemo<AppState>(
    () => ({
      joinedClubIds,
      myClubs,
      rsvpEventIds,
      rsvpEvents,
      isJoined: (clubId) => joinedClubIds.includes(clubId),
      hasRsvp: (eventId) => rsvpEventIds.includes(eventId),
      toggleJoin,
      toggleRsvp,
      rsvpPending: (eventId) => pendingIds.includes(eventId),
      attendeeCount: (event) => countOverrides[event.event_id] ?? event.attendee_count,
    }),
    [joinedClubIds, myClubs, rsvpEventIds, rsvpEvents, toggleJoin, toggleRsvp, pendingIds, countOverrides],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppState {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used inside <AppStateProvider>');
  }
  return context;
}
