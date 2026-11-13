// small helpers shared by the Chats list and the New Message screen.

import type { DmConversation, UserSearchResult } from '@/lib/api';

type Person = Pick<DmConversation | UserSearchResult, 'first_name' | 'last_name' | 'username'>;

export function fullName(p: Person): string {
  return `${p.first_name} ${p.last_name}`.trim() || p.username;
}

// does a search box string match this person's name or username? (case-insensitive, any part)
export function matchesPerson(p: Person, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return fullName(p).toLowerCase().includes(q) || p.username.toLowerCase().includes(q);
}

// "You: " prefix when I sent the latest msg, like the design doc's list rows.
export function previewText(c: DmConversation): string {
  return c.last_from_me ? `You: ${c.last_message}` : c.last_message;
}

// list-row time in the phone's time zone: "3:42 PM" today, "Yesterday", "Mon" this week, then "Oct 12" ("Oct 12, 2025" for older years).
export function formatListTime(iso: string, now = new Date()): string {
  const sent = new Date(iso);
  if (Number.isNaN(sent.getTime())) return '';
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const daysAgo = Math.round((startOfDay(now) - startOfDay(sent)) / 86_400_000);
  if (daysAgo <= 0) return sent.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (daysAgo === 1) return 'Yesterday';
  if (daysAgo < 7) return sent.toLocaleDateString('en-US', { weekday: 'short' });
  const sameYear = sent.getFullYear() === now.getFullYear();
  return sent.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }) });
}
