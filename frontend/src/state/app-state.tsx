/**
 * TEMPORARY in-memory app state for RSVPs and club memberships.
 *
 * Lets Home, Explore, Club, and Event screens agree on "have I joined this
 * club / RSVP'd to this event" while the backend endpoints for memberships
 * and attendance don't exist yet. State resets when the app reloads.
 *
 * When the API is ready, keep this hook's shape and replace the setters with
 * calls to e.g. POST /clubs/:id/join and POST /events/:id/rsvp.
 */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { MY_MEMBERSHIPS } from '@/data/mock-data';

type AppState = {
  joinedClubIds: number[];
  rsvpEventIds: number[];
  isJoined: (clubId: number) => boolean;
  hasRsvp: (eventId: number) => boolean;
  toggleJoin: (clubId: number) => void;
  toggleRsvp: (eventId: number) => void;
};

const AppStateContext = createContext<AppState | null>(null);

function toggleId(ids: number[], id: number): number[] {
  return ids.includes(id) ? ids.filter((existing) => existing !== id) : [...ids, id];
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [joinedClubIds, setJoinedClubIds] = useState<number[]>(() =>
    MY_MEMBERSHIPS.map((membership) => membership.club_id),
  );
  const [rsvpEventIds, setRsvpEventIds] = useState<number[]>([]);

  const toggleJoin = useCallback((clubId: number) => {
    setJoinedClubIds((ids) => toggleId(ids, clubId));
  }, []);

  const toggleRsvp = useCallback((eventId: number) => {
    setRsvpEventIds((ids) => toggleId(ids, eventId));
  }, []);

  const value = useMemo<AppState>(
    () => ({
      joinedClubIds,
      rsvpEventIds,
      isJoined: (clubId) => joinedClubIds.includes(clubId),
      hasRsvp: (eventId) => rsvpEventIds.includes(eventId),
      toggleJoin,
      toggleRsvp,
    }),
    [joinedClubIds, rsvpEventIds, toggleJoin, toggleRsvp],
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
