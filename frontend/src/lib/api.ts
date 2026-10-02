/**
 * Small client for the Express API.
 *
 * The base URL comes from EXPO_PUBLIC_API_URL (set it in frontend/.env, see
 * .env.example). It defaults to http://localhost:3000, which works for the
 * web build and the iOS simulator. An Android emulator needs
 * http://10.0.2.2:3000, and a physical phone needs your computer's LAN IP.
 */

export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(
  /\/+$/,
  '',
);

const REQUEST_TIMEOUT_MS = 15000;

/** Thrown for any failed request. `status` is 0 when the server couldn't be reached. */
export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  /** Supabase access token for protected routes. */
  token?: string;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch {
    throw new ApiError(0, "Can't reach the server. Check your connection and try again.");
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
    apiRequest<AuthResponse>('/auth/register', { method: 'POST', body: input }),

  login: (nyit_email: string, password: string) =>
    apiRequest<AuthResponse>('/auth/login', { method: 'POST', body: { nyit_email, password } }),

  resendVerification: (nyit_email: string) =>
    apiRequest<{ message: string }>('/auth/resend', { method: 'POST', body: { nyit_email } }),

  /** Emails a reset code. Same answer whether or not the account exists. */
  forgotPassword: (nyit_email: string) =>
    apiRequest<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: { nyit_email },
    }),

  /** Sets a new password using the emailed code; signs the account out everywhere. */
  resetPassword: (nyit_email: string, token: string, new_password: string) =>
    apiRequest<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: { nyit_email, token, new_password },
    }),
};
