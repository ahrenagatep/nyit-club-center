/**
 * Saves the light/dark choice between app launches, the same way the login is
 * saved (lib/session-storage.ts): expo-secure-store on iOS/Android, localStorage
 * on the web. It has its own key so signing out doesn't reset it.
 */
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/** 'system' follows the device's own light/dark setting. */
export type ThemePreference = 'light' | 'dark' | 'system';

/** Also read by the web page's head script (app/+html.tsx) before the app loads. */
export const THEME_KEY = 'nyit.theme';

function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

/** The saved choice, or null when nothing (or something unreadable) is saved. */
export async function loadThemePreference(): Promise<ThemePreference | null> {
  try {
    const value =
      Platform.OS === 'web'
        ? globalThis.localStorage?.getItem(THEME_KEY)
        : await SecureStore.getItemAsync(THEME_KEY);
    return isThemePreference(value) ? value : null;
  } catch {
    return null;
  }
}

export async function saveThemePreference(preference: ThemePreference): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      globalThis.localStorage?.setItem(THEME_KEY, preference);
    } else {
      await SecureStore.setItemAsync(THEME_KEY, preference);
    }
  } catch {
    // Storage blocked (e.g. private mode): the choice still applies until the app closes.
  }
}
