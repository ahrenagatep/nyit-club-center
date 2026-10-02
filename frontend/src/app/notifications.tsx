import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { EmptyState, openClub, openEvent } from '@/components/club-cards';
import { ScreenHeader } from '@/components/screen-header';
import { Brand } from '@/constants/brand';
import { NOTIFICATIONS, type AppNotification, type NotificationType } from '@/data/mock-data';

const ICONS: Record<NotificationType, string> = {
  general: '📣',
  event_reminder: '📅',
  announcement: '📢',
  message_alert: '💬',
};

function formatSentAt(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'America/New_York',
  });
}

/** Where tapping a notification should go, if anywhere. */
function targetFor(notification: AppNotification): (() => void) | null {
  if (notification.event_id !== undefined) {
    const eventId = notification.event_id;
    return () => openEvent(eventId);
  }
  if (notification.club_id !== undefined) {
    const clubId = notification.club_id;
    return () => openClub(clubId);
  }
  return null;
}

/** Notification inbox (Home → 🔔). Mirrors the notifications table. */
export default function NotificationsScreen() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <ScreenHeader title="Notifications" subtitle="Announcements, reminders, and messages" />

      <View style={styles.list}>
        {NOTIFICATIONS.length === 0 ? (
          <EmptyState
            emoji="🔔"
            title="You're all caught up"
            message="New notifications will show up here."
          />
        ) : (
          NOTIFICATIONS.map((notification) => {
            const onPress = targetFor(notification);
            const body = (
              <>
                <Text style={styles.icon} importantForAccessibility="no">
                  {ICONS[notification.type]}
                </Text>
                <View style={styles.text}>
                  <View style={styles.titleRow}>
                    <Text style={styles.title}>{notification.title}</Text>
                    <Text style={styles.date}>{formatSentAt(notification.sent_at)}</Text>
                  </View>
                  <Text style={styles.message}>{notification.message}</Text>
                </View>
                {onPress && (
                  <Text style={styles.chevron} importantForAccessibility="no">
                    ›
                  </Text>
                )}
              </>
            );

            const label = `${notification.title}. ${notification.message}. ${formatSentAt(notification.sent_at)}`;

            return onPress ? (
              <Pressable
                key={notification.notification_id}
                onPress={onPress}
                style={({ pressed }) => [styles.card, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={label}>
                {body}
              </Pressable>
            ) : (
              <View
                key={notification.notification_id}
                style={styles.card}
                accessible
                accessibilityLabel={label}>
                {body}
              </View>
            );
          })
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
  list: {
    paddingTop: 20,
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
  pressed: {
    opacity: 0.7,
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
    fontWeight: '600',
    color: Brand.text,
    flexShrink: 1,
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
  chevron: {
    fontSize: 28,
    color: Brand.textMuted,
    marginLeft: 8,
  },
});
