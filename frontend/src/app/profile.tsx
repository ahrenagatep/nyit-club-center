import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';

import { cardStyles } from '@/components/club-cards';
import { ScreenHeader } from '@/components/screen-header';
import { Brand } from '@/constants/brand';
import { CURRENT_USER } from '@/data/mock-data';
import { useAppState } from '@/state/app-state';

/**
 * Profile (Home → 👤). Shows account info and links to the user's clubs,
 * events, and notifications. Editing, themes, and favorites (FR-8) are
 * listed as "Coming soon" until those features are built.
 */
export default function ProfileScreen() {
  const { joinedClubIds, rsvpEventIds } = useAppState();
  const fullName = `${CURRENT_USER.first_name} ${CURRENT_USER.last_name}`;
  const roleLabel = CURRENT_USER.role.charAt(0).toUpperCase() + CURRENT_USER.role.slice(1);

  const links: { icon: string; label: string; detail?: string; href: Href }[] = [
    { icon: '🏛️', label: 'Your Clubs', detail: `${joinedClubIds.length}`, href: '/my-clubs' },
    {
      icon: '📅',
      label: 'Upcoming Events',
      detail: `${rsvpEventIds.length} going`,
      href: '/events',
    },
    { icon: '🔔', label: 'Notifications', href: '/notifications' },
  ];

  const comingSoon = [
    { icon: '✏️', label: 'Edit profile' },
    { icon: '⭐', label: 'Favorites' },
    { icon: '🎨', label: 'Themes' },
  ];

  const signOut = () => {
    // TODO: clear the JWT/session once real auth is merged.
    if (router.canDismiss()) router.dismissAll();
    router.replace('/');
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <ScreenHeader title="Profile" />

      <View style={styles.identity}>
        <View style={styles.avatar}>
          <Text style={styles.avatarIcon} importantForAccessibility="no">
            👤
          </Text>
        </View>
        <Text style={styles.name} accessibilityRole="header">
          {fullName}
        </Text>
        <Text style={styles.email}>{CURRENT_USER.nyit_email}</Text>
        <View style={styles.roleTag}>
          <Text style={styles.roleText}>{roleLabel}</Text>
        </View>
        <Text style={styles.bio}>{CURRENT_USER.bio}</Text>
      </View>

      <Text style={cardStyles.sectionTitle} accessibilityRole="header">
        Your activity
      </Text>
      {links.map((link) => (
        <Pressable
          key={link.label}
          onPress={() => router.navigate(link.href)}
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={link.detail ? `${link.label}, ${link.detail}` : link.label}>
          <Text style={styles.rowIcon} importantForAccessibility="no">
            {link.icon}
          </Text>
          <Text style={styles.rowLabel}>{link.label}</Text>
          {link.detail ? <Text style={styles.rowDetail}>{link.detail}</Text> : null}
          <Text style={styles.chevron} importantForAccessibility="no">
            ›
          </Text>
        </Pressable>
      ))}

      <Text style={cardStyles.sectionTitle} accessibilityRole="header">
        Settings
      </Text>
      {comingSoon.map((item) => (
        <View
          key={item.label}
          style={[styles.row, styles.rowDisabled]}
          accessible
          accessibilityState={{ disabled: true }}
          accessibilityLabel={`${item.label}, coming soon`}>
          <Text style={styles.rowIcon} importantForAccessibility="no">
            {item.icon}
          </Text>
          <Text style={styles.rowLabel}>{item.label}</Text>
          <Text style={styles.rowDetail}>Coming soon</Text>
        </View>
      ))}

      <Pressable
        onPress={signOut}
        style={({ pressed }) => [styles.signOut, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Sign out">
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
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
  identity: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 24,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: Brand.primaryTint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarIcon: {
    fontSize: 40,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Brand.text,
    marginTop: 12,
  },
  email: {
    fontSize: 15,
    color: Brand.textMuted,
    marginTop: 4,
  },
  roleTag: {
    marginTop: 10,
    backgroundColor: Brand.tagBackground,
    borderRadius: 14,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  roleText: {
    color: Brand.primary,
    fontSize: 14,
  },
  bio: {
    fontSize: 15,
    color: Brand.text,
    textAlign: 'center',
    marginTop: 14,
    lineHeight: 22,
  },
  row: {
    marginHorizontal: 20,
    marginBottom: 10,
    minHeight: 56,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Brand.white,
  },
  rowDisabled: {
    backgroundColor: Brand.chip,
  },
  rowIcon: {
    fontSize: 20,
    width: 32,
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: Brand.text,
  },
  rowDetail: {
    fontSize: 14,
    color: Brand.textMuted,
  },
  chevron: {
    fontSize: 26,
    color: Brand.textMuted,
    marginLeft: 8,
  },
  pressed: {
    opacity: 0.7,
  },
  signOut: {
    marginHorizontal: 20,
    marginTop: 20,
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Brand.danger,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signOutText: {
    color: Brand.danger,
    fontSize: 17,
    fontWeight: 'bold',
  },
});
