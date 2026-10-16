import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Brand } from '@/constants/brand';
import { useDarkMode } from '@/state/dark-mode';

type DarkModeToggleProps = {
  /** Extra spacing/positioning for the header it sits in. */
  style?: StyleProp<ViewStyle>;
};

/**
 * Small square button for the blue screen headers that turns dark mode on
 * and off. The inner square is filled while dark mode is on.
 */
export function DarkModeToggle({ style }: DarkModeToggleProps) {
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

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Brand.white,
    backgroundColor: 'rgba(255,255,255,0.20)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inner: {
    width: 14,
    height: 14,
    borderRadius: 3,
    borderWidth: 2,
    borderColor: Brand.white,
  },
  innerOn: {
    backgroundColor: Brand.white,
  },
  pressed: {
    opacity: 0.7,
  },
});
