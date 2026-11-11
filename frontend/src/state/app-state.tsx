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
import { toClub, type MyClub } from '@/lib/clubs';

type AppState = {
  joinedClubIds: number[];
  myClubs: MyClub[];
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

  const [rsvpEventIds, setRsvpEventIds] = useState<number[]>([]);

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

  const toggleRsvp = useCallback((eventId: number) => {
    setRsvpEventIds((ids) => toggleId(ids, eventId));
  }, []);

  const value = useMemo<AppState>(
    () => ({
      joinedClubIds,
      myClubs,
      rsvpEventIds,
      isJoined: (clubId) => joinedClubIds.includes(clubId),
      hasRsvp: (eventId) => rsvpEventIds.includes(eventId),
      toggleJoin,
      toggleRsvp,
    }),
    [joinedClubIds, myClubs, rsvpEventIds, toggleJoin, toggleRsvp],
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
