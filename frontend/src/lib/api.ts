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
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
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

/** Row from the local users table, as returned by /auth/register, /auth/login, and /users/me. */
export type AuthUser = {
  user_id?: number;
  auth_user_id?: string;
  nyit_email: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  role: 'student' | 'moderator' | 'admin';
  /** Edited from Profile (PATCH /users/me); null until set. Missing from sessions saved before these existed. */
  major?: string | null;
  school_year?: SchoolYear | null;
  bio?: string | null;
};

/** Allowed school_year values (sql/011, PATCH /users/me). */
export const SCHOOL_YEARS = ['Freshman', 'Sophomore', 'Junior', 'Senior'] as const;
export type SchoolYear = (typeof SCHOOL_YEARS)[number];

/** Limits shared with the API and sql/011. */
export const PROFILE_LIMITS = { major: 80, bio: 200 } as const;

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

// ---------- Users (/users) ----------

/** Fields a user can change about themselves. Omitted fields stay the same; "" or null clears one. */
export type ProfileUpdate = {
  major?: string | null;
  school_year?: SchoolYear | null;
  bio?: string | null;
};

export const usersApi = {
  /** The signed-in user's row, e.g. to pick up edits made on another device. */
  me: (token: string) => apiRequest<{ user: AuthUser }>('/users/me', { token }),

  updateMe: (token: string, update: ProfileUpdate) =>
    apiRequest<{ message: string; user: AuthUser }>('/users/me', {
      method: 'PATCH',
      body: update,
      token,
    }),
};

// ---------- Skill Exchange (/skill-exchange) ----------

export type SkillKind = 'request' | 'offer';
export type RequestStatus = 'open' | 'closed' | 'complete';
export type OfferStatus = 'available' | 'unavailable';
export type SkillStatus = RequestStatus | OfferStatus;
export type SkillSort = 'newest' | 'oldest' | 'soonest';

/** A time the poster is available (offers) or needs help by (requests). ISO 8601. */
export type SkillSlot = { slot_id?: number; starts_at: string; ends_at: string };

export type SkillAuthor = {
  user_id: number;
  username: string;
  first_name: string;
  last_name: string;
  nyit_email: string;
  /** Requests and offers this person has fulfilled. */
  kudos: number;
};

export type SkillPost = {
  post_id: number;
  kind: SkillKind;
  title: string;
  description: string;
  extras: string | null;
  location: string | null;
  location_flexible: boolean;
  status: SkillStatus;
  created_at: string;
  updated_at: string;
  author: SkillAuthor;
  tags: string[];
  comment_count: number;
  is_owner: boolean;
  /** Only on a single post (GET /skill-exchange/posts/:id, create, update). */
  slots?: SkillSlot[];
  /** Offers, GET /skill-exchange/posts/:id: times already booked (no names). */
  busy?: SkillSlot[];
  /** GET /skill-exchange/posts/:id: the viewer's pending or accepted response, or null. */
  my_engagement?: MyEngagement | null;
};

export type EngagementStatus = 'pending' | 'accepted' | 'declined' | 'cancelled' | 'completed';

export type MyEngagement = {
  engagement_id: number;
  status: 'pending' | 'accepted';
  starts_at: string;
  ends_at: string;
  location: string | null;
};

export type SkillTagGroup = { name: string; tags: string[] };

export type SkillPostQuery = {
  kind: SkillKind;
  q?: string;
  tags?: string[];
  status?: SkillStatus;
  mine?: boolean;
  sort?: SkillSort;
  limit?: number;
  offset?: number;
};

export type NewSkillPost = {
  kind: SkillKind;
  title: string;
  description: string;
  extras?: string | null;
  location?: string | null;
  location_flexible?: boolean;
  tags: string[];
  slots: SkillSlot[];
};

/** Title, location, and dates are locked after posting; status is offers only. */
export type SkillPostUpdate = {
  description?: string;
  extras?: string | null;
  tags?: string[];
  status?: OfferStatus;
};

/** Same limits as the API and sql/013. */
export const SKILL_LIMITS = {
  title: 100,
  description: 2000,
  extras: 500,
  location: 150,
  tag: 30,
  tags: 10,
  slots: 100,
} as const;

function skillQueryString(query: SkillPostQuery): string {
  const params: string[] = [`kind=${query.kind}`];
  const add = (key: string, value: string | number | undefined) => {
    if (value !== undefined && value !== '') params.push(`${key}=${encodeURIComponent(value)}`);
  };
  add('q', query.q?.trim());
  add('tags', query.tags?.length ? query.tags.join(',') : undefined);
  add('status', query.status);
  add('mine', query.mine ? 'true' : undefined);
  add('sort', query.sort);
  add('limit', query.limit);
  add('offset', query.offset);
  return params.join('&');
}

export const skillApi = {
  tags: (token: string) => apiRequest<{ groups: SkillTagGroup[] }>('/skill-exchange/tags', { token }),

  list: (token: string, query: SkillPostQuery) =>
    apiRequest<{ posts: SkillPost[]; limit: number; offset: number; has_more: boolean }>(
      `/skill-exchange/posts?${skillQueryString(query)}`,
      { token },
    ),

  get: (token: string, postId: number) =>
    apiRequest<{ post: SkillPost }>(`/skill-exchange/posts/${postId}`, { token }),

  create: (token: string, post: NewSkillPost) =>
    apiRequest<{ message: string; post: SkillPost }>('/skill-exchange/posts', {
      method: 'POST',
      body: post,
      token,
    }),

  update: (token: string, postId: number, update: SkillPostUpdate) =>
    apiRequest<{ message: string; post: SkillPost }>(`/skill-exchange/posts/${postId}`, {
      method: 'PATCH',
      body: update,
      token,
    }),

  remove: (token: string, postId: number) =>
    apiRequest<{ message: string; post_id: number }>(`/skill-exchange/posts/${postId}`, {
      method: 'DELETE',
      token,
    }),

  summary: (token: string) => apiRequest<SkillSummary>('/skill-exchange/summary', { token }),
};

export type SkillComment = {
  comment_id: number;
  post_id: number;
  /** Set on the poster's replies; replies are one level deep. */
  parent_comment_id: number | null;
  body: string;
  created_at: string;
  author: SkillAuthor;
  is_mine: boolean;
};

export const COMMENT_MAX_LENGTH = 1000;

export const skillCommentsApi = {
  list: (token: string, postId: number) =>
    apiRequest<{ comments: SkillComment[] }>(`/skill-exchange/posts/${postId}/comments`, { token }),

  /** parentCommentId: only the post's owner can reply to a (top-level) comment. */
  add: (token: string, postId: number, body: string, parentCommentId?: number) =>
    apiRequest<{ message: string; comment: SkillComment }>(`/skill-exchange/posts/${postId}/comments`, {
      method: 'POST',
      body: { body, ...(parentCommentId && { parent_comment_id: parentCommentId }) },
      token,
    }),

  remove: (token: string, commentId: number) =>
    apiRequest<{ message: string; comment_id: number }>(`/skill-exchange/comments/${commentId}`, {
      method: 'DELETE',
      token,
    }),
};

// ---------- Notifications (/notifications) ----------

export type NotificationType =
  | 'general'
  | 'event_reminder'
  | 'announcement'
  | 'message_alert'
  | 'skill_comment'
  | 'skill_reply'
  | 'skill_interest'
  | 'skill_accepted'
  | 'skill_declined'
  | 'skill_cancelled'
  | 'skill_kudos_request';

export type AppNotification = {
  notification_id: number;
  type: NotificationType;
  title: string;
  message: string;
  sent_at: string;
  is_read: boolean;
  /** null if the notification isn't about a post, or the post was deleted. */
  post_id: number | null;
  /** null when the linked post no longer exists. */
  post_kind: SkillKind | null;
  engagement_id: number | null;
  actor: Pick<SkillAuthor, 'user_id' | 'username' | 'first_name' | 'last_name'> | null;
};

export const notificationsApi = {
  list: (token: string, options: { limit?: number; offset?: number; unread?: boolean } = {}) => {
    const params = [
      options.limit !== undefined && `limit=${options.limit}`,
      options.offset !== undefined && `offset=${options.offset}`,
      options.unread && 'unread=true',
    ].filter(Boolean);
    return apiRequest<{
      notifications: AppNotification[];
      unread_count: number;
      limit: number;
      offset: number;
      has_more: boolean;
    }>(`/notifications${params.length ? `?${params.join('&')}` : ''}`, { token });
  },

  markRead: (token: string, notificationId: number) =>
    apiRequest<{ notification_id: number; unread_count: number }>(`/notifications/${notificationId}/read`, {
      method: 'POST',
      token,
    }),

  markAllRead: (token: string) =>
    apiRequest<{ updated: number; unread_count: number }>('/notifications/read-all', { method: 'POST', token }),
};

// ---------- Skill Exchange agreements ("engagements") ----------

/** Someone's response to a post ("I can help" / "I'd like this") and, once accepted, the agreement. */
export type SkillEngagement = {
  engagement_id: number;
  post_id: number;
  status: EngagementStatus;
  starts_at: string;
  ends_at: string;
  location: string | null;
  /** From the person who responded. */
  message: string | null;
  /** The poster's note when accepting or declining. */
  response_message: string | null;
  cancel_message: string | null;
  cancelled_by: number | null;
  /** Offers: when the poster marked it complete and asked for Kudos. */
  kudos_requested_at: string | null;
  /** Kudos was given for this agreement (at most once). */
  kudos_given: boolean;
  created_at: string;
  updated_at: string;
  /** The person who responded. */
  user: SkillAuthor;
  post: {
    post_id: number;
    kind: SkillKind;
    title: string;
    status: SkillStatus;
    location: string | null;
    location_flexible: boolean;
    author: SkillAuthor;
  };
  /** The viewer wrote the post. */
  is_poster: boolean;
  /** The viewer is the person who responded. */
  is_requester: boolean;
};

export const ENGAGEMENT_MESSAGE_MAX = 300;

type EngagementResponse = { message: string; engagement: SkillEngagement };

export const engagementsApi = {
  /** Not on your own post; the time must sit inside one of the post's dates (and, for offers, not overlap a booked time). */
  interest: (token: string, postId: number, input: { starts_at: string; ends_at: string; location?: string | null; message?: string | null }) =>
    apiRequest<EngagementResponse>(`/skill-exchange/posts/${postId}/interest`, { method: 'POST', body: input, token }),

  /** The poster gets every response; anyone else only their own. */
  forPost: (token: string, postId: number) =>
    apiRequest<{ engagements: SkillEngagement[] }>(`/skill-exchange/posts/${postId}/engagements`, { token }),

  get: (token: string, engagementId: number) =>
    apiRequest<{ engagement: SkillEngagement }>(`/skill-exchange/engagements/${engagementId}`, { token }),

  accept: (token: string, engagementId: number, message?: string | null) =>
    apiRequest<EngagementResponse>(`/skill-exchange/engagements/${engagementId}/accept`, { method: 'POST', body: { message: message || null }, token }),

  /** The other person is only told if there's a message. */
  decline: (token: string, engagementId: number, message?: string | null) =>
    apiRequest<EngagementResponse>(`/skill-exchange/engagements/${engagementId}/decline`, { method: 'POST', body: { message: message || null }, token }),

  /** Accepted: either person cancels (the other is told). Pending: the sender withdraws it. */
  cancel: (token: string, engagementId: number, message?: string | null) =>
    apiRequest<EngagementResponse>(`/skill-exchange/engagements/${engagementId}/cancel`, { method: 'POST', body: { message: message || null }, token }),

  /** Poster, accepted only. Requests: the request becomes complete (awardKudos thanks the helper). Offers: asks the other person for Kudos. */
  complete: (token: string, engagementId: number, awardKudos?: boolean) =>
    apiRequest<EngagementResponse>(`/skill-exchange/engagements/${engagementId}/complete`, {
      method: 'POST',
      body: awardKudos === undefined ? {} : { award_kudos: awardKudos },
      token,
    }),

  /** Completed only, once. Requests: the poster gives it. Offers: the person who was helped gives it. */
  kudos: (token: string, engagementId: number) =>
    apiRequest<EngagementResponse>(`/skill-exchange/engagements/${engagementId}/kudos`, { method: 'POST', body: {}, token }),
};

/** The signed-in user's Skill Exchange numbers (Profile). */
export type SkillSummary = {
  post_count: number;
  request_count: number;
  offer_count: number;
  /** Kudos received: requests and offers fulfilled. */
  kudos: number;
  /** Newest 3 of their posts. */
  recent: Pick<SkillPost, 'post_id' | 'kind' | 'title' | 'status' | 'created_at'>[];
};
