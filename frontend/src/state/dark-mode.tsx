/**
 * App-wide dark mode on/off switch.
 *
 * The provider sits in the root layout, above every screen, so the setting
 * stays the same while moving between screens. It is kept in memory, so it
 * resets to light mode when the app reloads.
 *
 * For now "dark mode" is the light screens with every color inverted (see
 * DarkModeOverlay). The screens now read their colors from the theme
 * (state/theme.tsx), so a real dark palette can replace the inversion.
 */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

type DarkModeState = {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
};

const DarkModeContext = createContext<DarkModeState | null>(null);

export function DarkModeProvider({ children }: { children: ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode((on) => !on);
  }, []);

  const value = useMemo(() => ({ isDarkMode, toggleDarkMode }), [isDarkMode, toggleDarkMode]);

  return <DarkModeContext.Provider value={value}>{children}</DarkModeContext.Provider>;
}

export function useDarkMode(): DarkModeState {
  const state = useContext(DarkModeContext);
  if (!state) {
    throw new Error('useDarkMode must be used inside DarkModeProvider');
  }
  return state;
}
