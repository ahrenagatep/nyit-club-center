/**
 * Unread notification count, shared by every 🔔 button and the Notifications screen.
 * Refreshed when a screen with a bell comes into view (no background polling).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { notificationsApi } from '@/lib/api';
import { useAuth } from '@/state/auth';

type NotificationsState = {
  unreadCount: number;
  /** Asks the API for the current count; failures keep the last known count. */
  refreshUnread: () => Promise<void>;
  /** For screens that already know the count (e.g. after marking something read). */
  setUnreadCount: (count: number) => void;
};

const NotificationsContext = createContext<NotificationsState | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  // signing out (or in as someone else) starts from zero
  useEffect(() => {
    setUnreadCount(0);
  }, [session?.access_token]);

  const refreshUnread = useCallback(async () => {
    if (!session) return;
    try {
      const { unread_count } = await notificationsApi.list(session.access_token, { limit: 1 });
      setUnreadCount(unread_count);
    } catch {
      // offline or expired session: the bell keeps its last count
    }
  }, [session]);

  const value = useMemo(() => ({ unreadCount, refreshUnread, setUnreadCount }), [unreadCount, refreshUnread]);

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications(): NotificationsState {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used inside <NotificationsProvider>');
  }
  return context;
}
