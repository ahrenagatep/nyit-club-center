/**
 * Saves the signed-in session between app launches.
 *
 * iOS/Android use expo-secure-store (Keychain / Keystore). The web build has
 * no secure store, so it falls back to localStorage. The session and user are
 * stored under separate keys to stay under SecureStore's per-value size limit.
 */
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import type { AuthSession, AuthUser } from '@/lib/api';

const SESSION_KEY = 'nyit.auth.session';
const USER_KEY = 'nyit.auth.user';

export type StoredAuth = { session: AuthSession; user: AuthUser };

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      globalThis.localStorage?.setItem(key, value);
    } catch {
      // Storage blocked (e.g. private mode): the session just won't survive a reload.
    }
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      globalThis.localStorage?.removeItem(key);
    } catch {
      // Nothing stored, nothing to clear.
    }
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export async function loadStoredAuth(): Promise<StoredAuth | null> {
  try {
    const [session, user] = await Promise.all([getItem(SESSION_KEY), getItem(USER_KEY)]);
    if (!session || !user) return null;
    return { session: JSON.parse(session), user: JSON.parse(user) };
  } catch {
    return null;
  }
}

export async function saveStoredAuth({ session, user }: StoredAuth): Promise<void> {
  await Promise.all([
    setItem(SESSION_KEY, JSON.stringify(session)),
    setItem(USER_KEY, JSON.stringify(user)),
  ]);
}

export async function clearStoredAuth(): Promise<void> {
  await Promise.all([deleteItem(SESSION_KEY), deleteItem(USER_KEY)]);
}
