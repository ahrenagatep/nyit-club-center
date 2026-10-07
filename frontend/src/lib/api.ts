/**
 * Small client for the Express API.
 *
 * Where requests go (decided once at startup, see pickApiUrl):
 * 1. EXPO_PUBLIC_API_URL, if set. Always wins; use it for the deployed API
 *    (e.g. https://<api>.onrender.com) and for tunnels. See .env.example.
 * 2. Web: the host the page was loaded from, port 3000 (localhost on desktop,
 *    the computer's LAN IP when opened from a phone's browser).
 * 3. iOS/Android in development: the host the app loaded its code from
 *    (Expo's hostUri, e.g. 192.168.1.20), port 3000. With `expo start --localhost`,
 *    an Android emulator uses 10.0.2.2 (its alias for the computer) and a phone on
 *    USB uses localhost, which `adb reverse` forwards (npm run android:usb).
 * A release build without EXPO_PUBLIC_API_URL has no way to find the server,
 * so always set it for production builds.
 */
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

const API_PORT = 3000;
const REQUEST_TIMEOUT_MS = 15000;
/** Requests that send an email (signup, resend, reset) wait on the mail server, so give them longer. */
const EMAIL_REQUEST_TIMEOUT_MS = 30000;

/** Expo's tunnel (exp.direct / ngrok) and VS Code port forwarding (devtunnels.ms). */
const TUNNEL_HOST = /\.exp\.direct$|ngrok|\.devtunnels\.ms$/i;

type ApiUrlChoice = {
  url: string;
  /** Short description of how the URL was chosen, for the dev log. */
  source: string;
  /** Set when the chosen URL probably won't work. */
  warning?: string;
};

/** Pure so it can be unit-tested for every platform without a device. */
export function pickApiUrl(input: {
  envUrl?: string;
  platform: string;
  /** Expo dev server address the app loaded from, e.g. "192.168.1.20:8081". Dev only. */
  hostUri?: string;
  /** window.location.hostname on web. */
  webHostname?: string;
  /** false on emulators/simulators (expo-device). */
  isDevice?: boolean;
}): ApiUrlChoice {
  const envUrl = input.envUrl?.trim();
  if (envUrl) {
    return { url: envUrl.replace(/\/+$/, ''), source: 'EXPO_PUBLIC_API_URL' };
  }

  if (input.platform === 'web') {
    const host = input.webHostname || 'localhost';
    if (TUNNEL_HOST.test(host)) return tunnelFallback();
    return { url: `http://${host}:${API_PORT}`, source: 'web page host' };
  }

  // "192.168.1.20:8081" or "abc-anonymous-8081.exp.direct" → host part only
  const host = input.hostUri?.split('/')[0].split(':')[0];
  if (!host) {
    return {
      url: `http://localhost:${API_PORT}`,
      source: 'fallback',
      warning: 'No API address available. Set EXPO_PUBLIC_API_URL (required for release builds).',
    };
  }

  if (host === 'localhost' || host === '127.0.0.1') {
    if (input.platform === 'android' && input.isDevice) {
      return { url: `http://localhost:${API_PORT}`, source: 'Expo dev server (localhost, USB via adb reverse)' };
    }
    if (input.platform === 'android') {
      return { url: `http://10.0.2.2:${API_PORT}`, source: 'Expo dev server (localhost, emulator)' };
    }
    return { url: `http://localhost:${API_PORT}`, source: 'Expo dev server (localhost)' };
  }

  if (TUNNEL_HOST.test(host)) return tunnelFallback();

  return { url: `http://${host}:${API_PORT}`, source: 'Expo dev server host' };
}

// A tunnel only forwards the dev server, not the backend on port 3000.
function tunnelFallback(): ApiUrlChoice {
  return {
    url: `http://localhost:${API_PORT}`,
    source: 'fallback (tunnel)',
    warning:
      'Tunnels only forward the Expo dev server. Set EXPO_PUBLIC_API_URL to an address the phone can reach for the backend.',
  };
}

const apiUrlChoice = pickApiUrl({
  envUrl: process.env.EXPO_PUBLIC_API_URL,
  platform: Platform.OS,
  hostUri: Constants.expoConfig?.hostUri,
  webHostname: typeof window !== 'undefined' ? window.location?.hostname : undefined,
  isDevice: Device.isDevice,
});

export const API_URL = apiUrlChoice.url;

/**
 * VS Code port forwarding (Microsoft dev tunnels) shows a one-time warning page
 * to browsers instead of passing the request on; this header skips it.
 */
const isDevTunnel = /\.devtunnels\.ms(?::\d+)?$/i.test(API_URL.split('/')[2] ?? '');

if (__DEV__ && typeof window !== 'undefined') {
  console.log(`[api] Using ${API_URL} (${apiUrlChoice.source})`);
  if (apiUrlChoice.warning) console.warn(`[api] ${apiUrlChoice.warning}`);
}

/**
 * Thrown for any failed request. `status` is 0 when no response came back;
 * `code` then says whether the server was unreachable or too slow.
 */
export class ApiError extends Error {
  status: number;
  code?: 'NETWORK' | 'TIMEOUT';

  constructor(status: number, message: string, code?: 'NETWORK' | 'TIMEOUT') {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

/** In development, name the address so a screenshot shows where the app was trying to connect. */
const serverLabel = __DEV__ ? `the server at ${API_URL}` : 'the server';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  /** Supabase access token for protected routes. */
  token?: string;
  timeoutMs?: number;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token, timeoutMs = REQUEST_TIMEOUT_MS } = options;
  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(isDevTunnel && { 'X-Tunnel-Skip-AntiPhishing-Page': 'true' }),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch {
    if (timedOut) {
      throw new ApiError(
        0,
        `${serverLabel[0].toUpperCase()}${serverLabel.slice(1)} is taking too long to respond. Please try again.`,
        'TIMEOUT',
      );
    }
    throw new ApiError(
      0,
      `Can't reach ${serverLabel}. Check your connection and try again.`,
      'NETWORK',
    );
  } finally {
    clearTimeout(timeout);
  }

  // The API always answers with JSON; fall back to an empty object if it doesn't.
  const data: unknown = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof data === 'object' && data !== null && 'error' in data && typeof data.error === 'string'
        ? data.error
        : `Request failed (${response.status})`;
    throw new ApiError(response.status, message);
  }

  return data as T;
}

// ---------- Auth (/auth) ----------

/** Row from the local users table, as returned by /auth/register and /auth/login. */
export type AuthUser = {
  user_id?: number;
  auth_user_id?: string;
  nyit_email: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  role: 'student' | 'moderator' | 'admin';
};

export type AuthSession = {
  access_token: string;
  refresh_token: string;
  /** Unix time in seconds. */
  expires_at: number;
  token_type: string;
};

export type AuthResponse = {
  message: string;
  user: AuthUser;
  /** null after register when the email still has to be confirmed. */
  session: AuthSession | null;
};

export type RegisterInput = {
  nyit_email: string;
  password: string;
  username: string;
  first_name: string;
  last_name: string;
};

export const authApi = {
  register: (input: RegisterInput) =>
    apiRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: input,
      timeoutMs: EMAIL_REQUEST_TIMEOUT_MS,
    }),

  login: (nyit_email: string, password: string) =>
    apiRequest<AuthResponse>('/auth/login', { method: 'POST', body: { nyit_email, password } }),

  resendVerification: (nyit_email: string) =>
    apiRequest<{ message: string }>('/auth/resend', {
      method: 'POST',
      body: { nyit_email },
      timeoutMs: EMAIL_REQUEST_TIMEOUT_MS,
    }),

  /** Emails a reset code. Same answer whether or not the account exists. */
  forgotPassword: (nyit_email: string) =>
    apiRequest<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: { nyit_email },
      timeoutMs: EMAIL_REQUEST_TIMEOUT_MS,
    }),

  /** Sets a new password using the emailed code; signs the account out everywhere. */
  resetPassword: (nyit_email: string, token: string, new_password: string) =>
    apiRequest<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: { nyit_email, token, new_password },
    }),
};
