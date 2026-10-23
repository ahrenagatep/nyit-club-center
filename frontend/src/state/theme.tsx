/**
 * Gives every screen the app's current colors (see constants/theme.ts).
 *
 * For now the app always uses LightColors. Dark mode (Phase 2) only has to pick
 * a dark palette here; screens already read their colors from this provider.
 */
import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { LightColors, type ThemeColors } from '@/constants/theme';

type Theme = {
  colors: ThemeColors;
};

const ThemeContext = createContext<Theme | null>(null);

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const value = useMemo<Theme>(() => ({ colors: LightColors }), []);

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
