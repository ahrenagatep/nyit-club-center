/**
 * App-wide state for club memberships and RSVPs.
 *
 * Memberships come from the backend: joined clubs load from GET /users/me/memberships
 * on login, and toggleJoin calls POST / DELETE /clubs/:id/join.
 * RSVPs are still TEMPORARY in-memory state until the events endpoints exist. !!!
 */

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode, useEffect } from 'react';
import { useAuth } from '@/state/auth';
import { clubsApi, membershipsApi } from '@/lib/api';

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

  const { session } = useAuth(); // the logged in user's session (token)

  // starts empty, filled in from the backend below
  const [joinedClubIds, setJoinedClubIds] = useState<number[]>([]);

  // load user's clubs when they log in / out
  useEffect(() => {
    if (!session) {
      setJoinedClubIds([]); // logged out , no clubs
      return;
    }

    async function loadMemberships(token: string) {
      try {
        const rows = await membershipsApi.mine(token);
        setJoinedClubIds(rows.map((row) => row.club_id));
      } catch {
        // offline / expired session, keep what we have
      }
    }

    loadMemberships(session.access_token);
  }, [session?.access_token]);

  const [rsvpEventIds, setRsvpEventIds] = useState<number[]>([]);

  const toggleJoin = useCallback(async(clubId: number) => {
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

      setJoinedClubIds((ids) => toggleId(ids, clubId)); // only reached if the request succeeded
    } catch {
      // request failed (like a president can't leave), keep the button as it was
    }
  }, [session, joinedClubIds]);

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
