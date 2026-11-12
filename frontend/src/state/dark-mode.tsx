/**
 * App-wide theme setting.
 *
 * The choice is a theme ('light', 'dark', 'nyit', 'cosmo') or 'system' (light or dark,
 * following the device's setting), picked in Profile → Settings → Theme and saved
 * between launches (lib/theme-storage.ts); with nothing saved, the app follows the device. The provider sits at the top of
 * the root layout, so the setting stays the same while moving between screens.
 *
 * It renders nothing until the saved choice has been read, so the first screen
 * already has the right colors: on phones the splash screen stays up meanwhile,
 * and on the web app/+html.tsx paints the right background before the app loads.
 *
 * AppThemeProvider (state/theme.tsx) reads `theme` to give every screen that theme's
 * colors from constants/theme.ts.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';

import { Themes, type ThemeName } from '@/constants/theme';
import { loadThemePreference, saveThemePreference, type ThemePreference } from '@/lib/theme-storage';

type DarkModeState = {
  /** The theme showing right now ('system' already turned into light or dark). */
  theme: ThemeName;
  /** Whether that theme's page is dark (Dark, NYIT, Cosmo). */
  isDarkMode: boolean;
  /** What the user picked; 'system' follows the device. */
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
};

const DarkModeContext = createContext<DarkModeState | null>(null);

export function DarkModeProvider({ children }: { children: ReactNode }) {
  const deviceScheme = useColorScheme();
  // null until the saved choice has been read
  const [preference, setPreferenceState] = useState<ThemePreference | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadThemePreference().then((saved) => {
      if (!cancelled) setPreferenceState(saved ?? 'system');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    saveThemePreference(next);
  }, []);

  const theme: ThemeName = preference === 'system' || !preference ? (deviceScheme === 'dark' ? 'dark' : 'light') : preference;
  const isDarkMode = Themes[theme].dark;

  const value = useMemo(
    () => (preference ? { theme, isDarkMode, preference, setPreference } : null),
    [theme, isDarkMode, preference, setPreference],
  );

  if (!value) return null;

  return <DarkModeContext.Provider value={value}>{children}</DarkModeContext.Provider>;
}

export function useDarkMode(): DarkModeState {
  const state = useContext(DarkModeContext);
  if (!state) {
    throw new Error('useDarkMode must be used inside DarkModeProvider');
  }
  return state;
}
