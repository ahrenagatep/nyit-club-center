/**
 * Signed-in user and Supabase session, shared app-wide.
 *
 * On launch the saved session is restored if it hasn't expired. There is no
 * refresh endpoint yet, so an expired session means logging in again.
 * The root layout uses `status` to decide which screens are reachable.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { AuthSession, AuthUser } from '@/lib/api';
import { clearStoredAuth, loadStoredAuth, saveStoredAuth } from '@/lib/session-storage';

type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

type AuthState = {
  status: AuthStatus;
  user: AuthUser | null;
  session: AuthSession | null;
  signIn: (user: AuthUser, session: AuthSession) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

function isExpired(session: AuthSession): boolean {
  return session.expires_at * 1000 <= Date.now();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadStoredAuth().then(async (stored) => {
      if (cancelled) return;
      if (stored && !isExpired(stored.session)) {
        setUser(stored.user);
        setSession(stored.session);
        setStatus('signedIn');
      } else {
        if (stored) await clearStoredAuth();
        setStatus('signedOut');
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (nextUser: AuthUser, nextSession: AuthSession) => {
    try {
      await saveStoredAuth({ user: nextUser, session: nextSession });
    } catch {
      // Couldn't persist; the user stays signed in until the app closes.
    }
    setUser(nextUser);
    setSession(nextSession);
    setStatus('signedIn');
  }, []);

  const signOut = useCallback(async () => {
    try {
      await clearStoredAuth();
    } finally {
      setUser(null);
      setSession(null);
      setStatus('signedOut');
    }
  }, []);

  const value = useMemo<AuthState>(
    () => ({ status, user, session, signIn, signOut }),
    [status, user, session, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return context;
}
