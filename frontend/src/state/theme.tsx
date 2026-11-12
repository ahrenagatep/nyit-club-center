/**
 * Gives every screen the current theme's colors (see constants/theme.ts): Light, Dark,
 * NYIT or Cosmo, as picked in Settings → Theme. Must sit inside DarkModeProvider
 * (state/dark-mode.tsx).
 *
 * Anything inside <OnSurface> (a card, popup, or other surface drawn on top of the
 * page) gets the "on surface" color for the plain job names, e.g. `colors.text`
 * there is `textOnSurface`. Shared pieces like a post's author row use it so the
 * same component is right on the page and inside a card.
 */
import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { Platform } from 'react-native';
import * as SystemUI from 'expo-system-ui';

import { Themes, type ThemeColorName, type ThemeColors } from '@/constants/theme';
import { useDarkMode } from '@/state/dark-mode';

type Theme = {
  colors: ThemeColors;
};

/** Plain job -> the job it becomes inside <OnSurface>. */
const ON_SURFACE: Partial<Record<ThemeColorName, ThemeColorName>> = {
  text: 'textOnSurface',
  textLabel: 'textLabelOnSurface',
  textSecondary: 'textSecondaryOnSurface',
  textMuted: 'textMutedOnSurface',
  textAccent: 'textAccentOnSurface',
  primary: 'primaryOnSurface',
  onPrimary: 'onPrimaryOnSurface',
  border: 'borderOnSurface',
  borderStrong: 'borderStrongOnSurface',
  placeholder: 'placeholderOnSurface',
  placeholderForm: 'placeholderFormOnSurface',
  switchTrackOn: 'switchTrackOnOnSurface',
  switchTrackOff: 'switchTrackOffOnSurface',
  switchThumb: 'switchThumbOnSurface',
};

function onSurfaceColors(colors: ThemeColors): ThemeColors {
  const mapped = { ...colors };
  for (const [job, surfaceJob] of Object.entries(ON_SURFACE) as [ThemeColorName, ThemeColorName][]) {
    mapped[job] = colors[surfaceJob];
  }
  return mapped;
}

const ThemeContext = createContext<{ page: Theme; surface: Theme } | null>(null);
const OnSurfaceContext = createContext(false);

/** Wrap the contents of a card, popup or other surface so they use the "on surface" colors. */
export function OnSurface({ children }: { children: ReactNode }) {
  return <OnSurfaceContext.Provider value={true}>{children}</OnSurfaceContext.Provider>;
}

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const { theme, isDarkMode } = useDarkMode();
  const value = useMemo(() => {
    const { colors } = Themes[theme];
    return { page: { colors }, surface: { colors: onSurfaceColors(colors) } };
  }, [theme]);
  const pageColors = value.page.colors;

  // Color what's behind the app (the web page, or the phone's window) to match,
  // so nothing white shows at the edges, during transitions, or when scrolling past the end.
  useEffect(() => {
    if (Platform.OS === 'web') {
      const style = document.documentElement.style;
      style.backgroundColor = pageColors.background;
      style.colorScheme = isDarkMode ? 'dark' : 'light';
    } else {
      SystemUI.setBackgroundColorAsync(pageColors.background).catch(() => {});
    }
  }, [pageColors, isDarkMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * The current colors, e.g. `const { colors } = useTheme();` then `color={colors.primary}`.
 * Inside <OnSurface> these are the "on surface" colors.
 */
export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  const onSurface = useContext(OnSurfaceContext);
  if (!theme) {
    throw new Error('useTheme must be used inside AppThemeProvider');
  }
  return onSurface ? theme.surface : theme.page;
}

/**
 * Builds a screen's styles from the current colors, and rebuilds them only when
 * the colors change. Pass a function defined outside the component:
 *
 *   const createStyles = (colors: ThemeColors) => StyleSheet.create({ ... });
 *   const styles = useThemedStyles(createStyles);
 *
 * Pass 'surface' for the same styles in the "on surface" colors, for the parts of a
 * screen drawn inside a card or box: `const boxStyles = useThemedStyles(createStyles, 'surface');`
 */
export function useThemedStyles<T>(createStyles: (colors: ThemeColors) => T, layer?: 'surface'): T {
  const theme = useContext(ThemeContext);
  const onSurface = useContext(OnSurfaceContext);
  if (!theme) {
    throw new Error('useThemedStyles must be used inside AppThemeProvider');
  }
  const { colors } = onSurface || layer === 'surface' ? theme.surface : theme.page;
  return useMemo(() => createStyles(colors), [createStyles, colors]);
}
