import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useDarkMode } from '@/state/dark-mode';

type DarkModeOverlayProps = {
  /** e.g. border radii, so the overlay matches a rounded popup card. */
  style?: StyleProp<ViewStyle>;
};

/**
 * Inverts every color drawn underneath it while dark mode is on.
 *
 * A white layer with the "difference" blend mode turns each color into its
 * opposite (white → black, blue → orange) and works the same on iOS, Android
 * and web. Touches pass through it to the screen below.
 *
 * Put it last inside the view it should cover. The root layout covers every
 * screen; a <Modal> opens in its own layer, so its popup card needs its own.
 */
export function DarkModeOverlay({ style }: DarkModeOverlayProps) {
  const { isDarkMode } = useDarkMode();
  if (!isDarkMode) return null;

  return <View style={[styles.overlay, style]} importantForAccessibility="no-hide-descendants" />;
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#FFFFFF',
    mixBlendMode: 'difference',
    pointerEvents: 'none',
    zIndex: 1000,
  },
});
