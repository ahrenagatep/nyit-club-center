/**
 * App-wide light/dark setting.
 *
 * The choice is 'light', 'dark' or 'system' (follow the device's setting), picked
 * in Profile → Settings → Theme and saved between launches (lib/theme-storage.ts);
 * with nothing saved, the app follows the device. The provider sits at the top of
 * the root layout, so the setting stays the same while moving between screens.
 *
 * It renders nothing until the saved choice has been read, so the first screen
 * already has the right colors: on phones the splash screen stays up meanwhile,
 * and on the web app/+html.tsx paints the right background before the app loads.
 *
 * AppThemeProvider (state/theme.tsx) reads isDarkMode to give every screen
 * DarkColors or LightColors from constants/theme.ts.
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

import { loadThemePreference, saveThemePreference, type ThemePreference } from '@/lib/theme-storage';

type DarkModeState = {
  /** Whether the app is showing dark colors right now. */
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

  const isDarkMode = preference === 'dark' || (preference === 'system' && deviceScheme === 'dark');

  const value = useMemo(
    () => (preference ? { isDarkMode, preference, setPreference } : null),
    [isDarkMode, preference, setPreference],
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
