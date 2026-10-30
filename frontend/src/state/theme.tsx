/**
 * Gives every screen the app's current colors (see constants/theme.ts):
 * DarkColors while dark mode is on, LightColors otherwise. Must sit inside
 * DarkModeProvider (state/dark-mode.tsx).
 */
import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { Platform } from 'react-native';
import * as SystemUI from 'expo-system-ui';

import { DarkColors, LightColors, type ThemeColors } from '@/constants/theme';
import { useDarkMode } from '@/state/dark-mode';

type Theme = {
  colors: ThemeColors;
};

const ThemeContext = createContext<Theme | null>(null);

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const { isDarkMode } = useDarkMode();
  const value = useMemo<Theme>(() => ({ colors: isDarkMode ? DarkColors : LightColors }), [isDarkMode]);

  // Color what's behind the app (the web page, or the phone's window) to match,
  // so nothing white shows at the edges, during transitions, or when scrolling past the end.
  useEffect(() => {
    if (Platform.OS === 'web') {
      const style = document.documentElement.style;
      style.backgroundColor = value.colors.background;
      style.colorScheme = isDarkMode ? 'dark' : 'light';
    } else {
      SystemUI.setBackgroundColorAsync(value.colors.background).catch(() => {});
    }
  }, [value, isDarkMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** The current colors, e.g. `const { colors } = useTheme();` then `color={colors.primary}`. */
export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useTheme must be used inside AppThemeProvider');
  }
  return theme;
}

/**
 * Builds a screen's styles from the current colors, and rebuilds them only when
 * the colors change. Pass a function defined outside the component:
 *
 *   const createStyles = (colors: ThemeColors) => StyleSheet.create({ ... });
 *   const styles = useThemedStyles(createStyles);
 */
export function useThemedStyles<T>(createStyles: (colors: ThemeColors) => T): T {
  const { colors } = useTheme();
  return useMemo(() => createStyles(colors), [createStyles, colors]);
}
