// the 🔔 + profile picture pair that sits at the top right of every main tab's blue header
// (TODO: "all major tabs must have the bell and the profile button"). one component so all
// six tabs look and behave the same, like CampusGroups' top bar.

import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { ChatAvatar } from '@/components/chat-avatar';
import { NotificationBell } from '@/components/notification-bell';
import type { ThemeColors } from '@/constants/theme';
import { useAuth } from '@/state/auth';
import { useThemedStyles } from '@/state/theme';

const AVATAR_SIZE = 40;

export function HeaderActions() {
  const styles = useThemedStyles(createStyles);
  const { user } = useAuth();
  // name for the initial fallback; username covers accounts w/o a first name
  const name = user?.first_name || user?.username || '?';

  return (
    <View style={styles.row}>
      <NotificationBell style={styles.button} pressedStyle={styles.pressed} iconStyle={styles.bellIcon} />

      {/* push = Profile opens on top of the current tab, so Back returns right here */}
      <Pressable
        onPress={() => router.push('/profile')}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        hitSlop={4}
        accessibilityRole="button"
        accessibilityLabel="Your profile">
        {/* their picture if they uploaded one, else the first letter of their name */}
        <ChatAvatar name={name} imageUrl={user?.profile_image} size={AVATAR_SIZE} style={styles.avatar} />
      </Pressable>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    // 44x44 = the minimum comfy touch target (WCAG / our a11y rule)
    button: {
      minWidth: 44,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pressed: {
      opacity: 0.7,
    },
    bellIcon: {
      color: colors.onHeader,
      fontSize: 24,
    },
    avatar: {
      marginRight: 0, // ChatAvatar has a right margin for chat rows; not wanted here
      borderWidth: 2,
      borderColor: colors.onHeader, // white ring so the avatar pops on the blue header
    },
  });
