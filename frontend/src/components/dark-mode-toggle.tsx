import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import type { ThemeColors } from '@/constants/theme';
import { useDarkMode } from '@/state/dark-mode';
import { useThemedStyles } from '@/state/theme';

type DarkModeToggleProps = {
  /** Extra spacing/positioning for the header it sits in. */
  style?: StyleProp<ViewStyle>;
};

/**
 * Small square button for the blue screen headers that turns dark mode on
 * and off. The inner square is filled while dark mode is on.
 */
export function DarkModeToggle({ style }: DarkModeToggleProps) {
  const styles = useThemedStyles(createStyles);
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  return (
    <Pressable
      onPress={toggleDarkMode}
      style={({ pressed }) => [styles.button, pressed && styles.pressed, style]}
      hitSlop={6}
      accessibilityRole="switch"
      accessibilityLabel="Dark mode"
      accessibilityState={{ checked: isDarkMode }}>
      <View style={[styles.inner, isDarkMode && styles.innerOn]} />
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.onHeader,
    backgroundColor: colors.headerButton,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inner: {
    width: 14,
    height: 14,
    borderRadius: 3,
    borderWidth: 2,
    borderColor: colors.onHeader,
  },
  innerOn: {
    backgroundColor: colors.onHeader,
  },
  pressed: {
    opacity: 0.7,
  },
});
