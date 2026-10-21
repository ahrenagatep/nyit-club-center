import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Brand } from '@/constants/brand';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  /** Hide the back button on top-level (tab) screens. */
  showBack?: boolean;
  /** Extra content rendered under the title, e.g. a search bar. */
  children?: ReactNode;
};

/**
 * Blue header used by every screen that isn't Login/Home, matching the
 * Home tab's header style. The back button falls back to Home when there
 * is no screen to go back to (e.g. after a deep link or web refresh).
 */
export function ScreenHeader({ title, subtitle, showBack = true, children }: ScreenHeaderProps) {
  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/home');
    }
  };

  return (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        {showBack && (
          <Pressable
            onPress={goBack}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>
        )}

        <View style={styles.titleText}>
          <Text style={styles.title} accessibilityRole="header" numberOfLines={2}>
            {title}
          </Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Brand.primary,
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.20)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  backIcon: {
    color: Brand.white,
    fontSize: 32,
    lineHeight: 34,
    fontWeight: '600',
    marginTop: -3,
  },
  titleText: {
    flex: 1,
  },
  title: {
    color: Brand.white,
    fontSize: 26,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#E6EEFB',
    fontSize: 15,
    marginTop: 4,
  },
  pressed: {
    opacity: 0.7,
  },
});
