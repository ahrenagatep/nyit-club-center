/**
 * Client-side form checks for Login and Sign Up. They mirror the backend
 * (/auth) rules and the users table column limits so mistakes are caught
 * before a request; the backend still validates everything.
 * Each check returns an error message, or null when the value is fine.
 */

// Same pattern as backend/src/utils/nyitEmail.js (any domain while the NYIT-only check is off).
const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const USERNAME_REGEX = /^[A-Za-z0-9_.]+$/;

export const MIN_PASSWORD_LENGTH = 6; // backend register rule
const USERNAME_MIN = 3;
const USERNAME_MAX = 50; // users.username VARCHAR(50)
const NAME_MAX = 100; // users.first_name / last_name VARCHAR(100)

export function validateEmail(email: string): string | null {
  const value = email.trim();
  if (!value) return 'Enter your email.';
  if (!EMAIL_REGEX.test(value)) return 'Enter a valid email address.';
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Enter a password.';
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return null;
}

export function validateUsername(username: string): string | null {
  const value = username.trim();
  if (!value) return 'Choose a username.';
  if (value.length < USERNAME_MIN || value.length > USERNAME_MAX) {
    return `Username must be ${USERNAME_MIN}–${USERNAME_MAX} characters.`;
  }
  if (!USERNAME_REGEX.test(value)) return 'Use only letters, numbers, "_" or ".".';
  return null;
}

/** Supabase email codes are 6 digits by default (up to 10 if the project changes it). */
export function validateResetCode(code: string): string | null {
  const value = code.trim();
  if (!value) return 'Enter the code from the email.';
  if (!/^\d{6,10}$/.test(value)) return 'The code is the 6-digit number in the email.';
  return null;
}

export function validateName(name: string, label: string): string | null {
  const value = name.trim();
  if (!value) return `Enter your ${label}.`;
  if (value.length > NAME_MAX) return `${label[0].toUpperCase()}${label.slice(1)} is too long.`;
  return null;
}
