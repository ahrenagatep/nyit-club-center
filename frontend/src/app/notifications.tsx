import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import { EmptyState } from '@/components/club-cards';
import { openSkillEngagement } from '@/components/skill-cards';
import { ScreenHeader } from '@/components/screen-header';
import { Brand } from '@/constants/brand';
import { ApiError, notificationsApi, type AppNotification, type NotificationType } from '@/lib/api';
import { formatPostDate, timeAgo } from '@/lib/skill-dates';
import { useAuth } from '@/state/auth';
import { useNotifications } from '@/state/notifications';

const PAGE_SIZE = 30;

const ICONS: Record<NotificationType, string> = {
  general: '📣',
  event_reminder: '📅',
  announcement: '📢',
  message_alert: '💬',
  skill_comment: '💬',
  skill_reply: '↩️',
  skill_interest: '🙋',
  skill_accepted: '🤝',
  skill_declined: '✉️',
  skill_cancelled: '⚠️',
  skill_kudos_request: '⭐',
};

// comments and replies open the post scrolled to its comments
const OPENS_COMMENTS: NotificationType[] = ['skill_comment', 'skill_reply'];

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'Your session has expired. Sign out and log in again.';
    return error.message;
  }
  return 'Something went wrong. Please try again.';
}

/** Notification inbox (🔔 on Home, Explore, Events; Profile → Settings). */
export default function NotificationsScreen() {
  const { session } = useAuth();
  const { unreadCount, setUnreadCount } = useNotifications();

  const [items, setItems] = useState<AppNotification[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(
    async (more = false) => {
      if (!session) return;
      if (more) setLoadingMore(true);
      try {
        const result = await notificationsApi.list(session.access_token, {
          limit: PAGE_SIZE,
          offset: more ? items.length : 0,
        });
        setItems((current) => (more ? [...current, ...result.notifications] : result.notifications));
        setHasMore(result.has_more);
        setUnreadCount(result.unread_count);
        setError(null);
      } catch (e) {
        setError(errorMessage(e));
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [session, items.length, setUnreadCount],
  );

  // reload each time the screen opens (new notifications since last time)
  const loadRef = useRef(load);
  loadRef.current = load;
  useFocusEffect(
    useCallback(() => {
      loadRef.current();
    }, []),
  );

  const markRead = async (notification: AppNotification) => {
    if (!session || notification.is_read) return;
    setItems((current) =>
      current.map((n) => (n.notification_id === notification.notification_id ? { ...n, is_read: true } : n)),
    );
    setUnreadCount(Math.max(0, unreadCount - 1));
    try {
      const { unread_count } = await notificationsApi.markRead(session.access_token, notification.notification_id);
      setUnreadCount(unread_count);
    } catch {
      // stays read on screen; the next reload shows the server's state
    }
  };

  const open = (notification: AppNotification) => {
    markRead(notification);
    // interest, accepted, declined, cancelled, Kudos asked/given: open the agreement
    if (notification.engagement_id) {
      openSkillEngagement(notification.engagement_id, 'notifications');
    } else if (notification.post_id && notification.post_kind) {
      router.push({
        pathname: '/skill-exchange/[id]',
        params: {
          id: String(notification.post_id),
          ...(OPENS_COMMENTS.includes(notification.type) && { focus: 'comments' }),
          from: 'notifications',
        },
      });
    }
  };

  const markAllRead = async () => {
    if (!session) return;
    setActionError(null);
    try {
      await notificationsApi.markAllRead(session.access_token);
      setItems((current) => current.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (e) {
      setActionError(errorMessage(e));
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
        />
      }>
      <ScreenHeader
        title="Notifications"
        subtitle={unreadCount ? `${unreadCount} unread` : 'Comments, replies, and updates'}
      />

      {unreadCount > 0 && !loading && !error && (
        <View style={styles.toolbar}>
          <Pressable
            onPress={markAllRead}
            style={({ pressed }) => [styles.markAll, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Mark all as read">
            <Text style={styles.markAllText}>Mark all as read</Text>
          </Pressable>
        </View>
      )}
      {actionError ? (
        <Text style={styles.errorText} accessibilityRole="alert">
          {actionError}
        </Text>
      ) : null}

      <View style={styles.list}>
        {loading ? (
          <ActivityIndicator style={styles.spinner} size="large" color={Brand.primary} accessibilityLabel="Loading notifications" />
        ) : error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText} accessibilityRole="alert">
              {error}
            </Text>
            <Pressable
              onPress={() => {
                setLoading(true);
                load();
              }}
              style={({ pressed }) => [styles.retry, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Try again">
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        ) : items.length === 0 ? (
          <EmptyState emoji="🔔" title="You're all caught up" message="New notifications will show up here." />
        ) : (
          <>
            {items.map((notification) => {
              const unread = !notification.is_read;
              const linked = Boolean(notification.engagement_id || (notification.post_id && notification.post_kind));
              const gone = !linked && notification.type.startsWith('skill_');
              const label = `${unread ? 'Unread. ' : ''}${notification.title}. ${notification.message}. ${formatPostDate(notification.sent_at)}${gone ? '. This post was deleted' : ''}`;

              return (
                <Pressable
                  key={notification.notification_id}
                  onPress={() => open(notification)}
                  style={({ pressed }) => [styles.card, unread && styles.cardUnread, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel={label}
                  accessibilityHint={linked ? 'Opens it' : unread ? 'Marks it as read' : undefined}>
                  <Text style={styles.icon} importantForAccessibility="no">
                    {ICONS[notification.type] ?? '🔔'}
                  </Text>
                  <View style={styles.text}>
                    <View style={styles.titleRow}>
                      <Text style={[styles.title, unread && styles.titleUnread]}>{notification.title}</Text>
                      <Text style={styles.date}>{timeAgo(notification.sent_at)}</Text>
                    </View>
                    <Text style={styles.message}>{notification.message}</Text>
                    {gone ? <Text style={styles.gone}>This post was deleted.</Text> : null}
                  </View>
                  {unread ? <View style={styles.dot} /> : linked ? (
                    <Text style={styles.chevron} importantForAccessibility="no">
                      ›
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
            {hasMore && (
              <Pressable
                onPress={() => load(true)}
                disabled={loadingMore}
                style={({ pressed }) => [styles.retry, styles.more, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Load more notifications">
                <Text style={styles.retryText}>{loadingMore ? 'Loading…' : 'Load more'}</Text>
              </Pressable>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.white,
  },
  content: {
    paddingBottom: 35,
  },
  pressed: {
    opacity: 0.7,
  },
  spinner: {
    marginTop: 40,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  markAll: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  markAllText: {
    color: Brand.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  list: {
    paddingTop: 12,
  },
  card: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Brand.white,
  },
  cardUnread: {
    backgroundColor: '#F3F7FD',
    borderColor: '#C9DAF3',
  },
  icon: {
    fontSize: 26,
  },
  text: {
    flex: 1,
    marginLeft: 14,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: Brand.text,
    flexShrink: 1,
  },
  titleUnread: {
    fontWeight: '700',
  },
  date: {
    fontSize: 13,
    color: Brand.textMuted,
    marginLeft: 8,
  },
  message: {
    fontSize: 15,
    color: Brand.textMuted,
    marginTop: 4,
    lineHeight: 21,
  },
  gone: {
    fontSize: 13,
    color: Brand.textMuted,
    fontStyle: 'italic',
    marginTop: 4,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Brand.primary,
    marginLeft: 10,
  },
  chevron: {
    fontSize: 28,
    color: Brand.textMuted,
    marginLeft: 8,
  },
  errorBox: {
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    color: '#C62828',
    fontSize: 15,
    textAlign: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
  },
  retry: {
    minHeight: 44,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  more: {
    marginHorizontal: 20,
  },
  retryText: {
    color: Brand.primary,
    fontWeight: '600',
    fontSize: 15,
  },
});
