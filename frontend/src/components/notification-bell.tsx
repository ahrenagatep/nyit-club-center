import { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import { useNotifications } from '@/state/notifications';

/**
 * 🔔 button for the blue headers: opens Notifications and shows the unread count.
 * Each screen passes its own button/icon styles so the header layouts stay as they were.
 */
export function NotificationBell({
  style,
  iconStyle,
  pressedStyle,
}: {
  style?: StyleProp<ViewStyle>;
  iconStyle?: StyleProp<TextStyle>;
  pressedStyle?: StyleProp<ViewStyle>;
}) {
  const { unreadCount, refreshUnread } = useNotifications();

  useFocusEffect(
    useCallback(() => {
      refreshUnread();
    }, [refreshUnread]),
  );

  const badge = unreadCount > 99 ? '99+' : String(unreadCount);

  return (
    <Pressable
      onPress={() => router.push('/notifications')}
      style={({ pressed }) => [style, pressed && pressedStyle]}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'}>
      <View>
        <Text style={iconStyle}>🔔</Text>
        {unreadCount > 0 && (
          <View style={styles.badge} importantForAccessibility="no-hide-descendants">
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    backgroundColor: '#C62828',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 13,
  },
});
