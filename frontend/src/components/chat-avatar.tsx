// round avatar for chat rows: the user's profile picture if they have one, else their first initial.

import { useState } from 'react';
import { Image, StyleSheet, Text, View, type ImageStyle, type StyleProp } from 'react-native';

import type { ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/state/theme';

type ChatAvatarProps = {
  name: string;
  imageUrl?: string | null;
  size?: number;
  // extra styles on top, e.g. the header button drops the row's right margin
  style?: StyleProp<ImageStyle>; // ImageStyle works for both the <Image> and the fallback <View>
};

export function ChatAvatar({ name, imageUrl, size = 52, style }: ChatAvatarProps) {
  const styles = useThemedStyles(createStyles);
  const [broken, setBroken] = useState(false); // bad/expired URL -> fall back to the initial
  const shape = { width: size, height: size, borderRadius: size / 2 };

  if (imageUrl && !broken) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={[styles.avatar, shape, style]}
        onError={() => setBroken(true)}
        accessibilityIgnoresInvertColors
        importantForAccessibility="no"
      />
    );
  }
  return (
    <View style={[styles.avatar, shape, style]} importantForAccessibility="no-hide-descendants">
      <Text style={[styles.initial, { fontSize: Math.round(size * 0.38) }]}>
        {name.trim().charAt(0).toUpperCase() || '?'}
      </Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    avatar: {
      backgroundColor: colors.primaryTintChat,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
    },
    initial: {
      color: colors.textAccentOnSurface, // readable on primaryTintChat in every theme (matches dm-chat)
      fontWeight: 'bold',
    },
  });
