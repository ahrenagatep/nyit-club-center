/**
 * Dates and times for Skill Exchange posts, always in campus (New York) time,
 * whatever time zone the phone is set to. Dates are "YYYY-MM-DD" keys; times of
 * day are minutes after midnight (0–1440).
 */
import type { SkillSlot } from '@/lib/api';

export const CAMPUS_TIME_ZONE = 'America/New_York';
const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;

const partsFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: CAMPUS_TIME_ZONE,
  hour12: false,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

/** Campus wall-clock parts of a moment. */
function campusParts(ms: number) {
  const parts: Record<string, number> = {};
  for (const { type, value } of partsFormat.formatToParts(new Date(ms))) {
    if (type !== 'literal') parts[type] = Number(value);
  }
  return { ...parts, hour: parts.hour % 24 } as { year: number; month: number; day: number; hour: number; minute: number; second: number };
}

/** Minutes campus time is ahead of UTC at that moment (-240 in summer, -300 in winter). */
function campusOffsetMinutes(ms: number): number {
  const p = campusParts(ms);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return Math.round((asUtc - Math.floor(ms / 1000) * 1000) / MINUTE);
}

function splitKey(key: string): [number, number, number] {
  const [y, m, d] = key.split('-').map(Number);
  return [y, m, d];
}

/** The moment (ISO) for a campus date and time of day; 1440 minutes = midnight that night. */
export function campusTimeToIso(key: string, minutes: number): string {
  const [y, m, d] = splitKey(key);
  const guess = Date.UTC(y, m - 1, d, 0, minutes);
  let ms = guess - campusOffsetMinutes(guess) * MINUTE;
  const corrected = guess - campusOffsetMinutes(ms) * MINUTE; // across a DST change
  if (corrected !== ms) ms = corrected;
  return new Date(ms).toISOString();
}

/** Campus date key ("YYYY-MM-DD") of a moment. */
export function campusDateKeyOf(iso: string | number): string {
  const p = campusParts(typeof iso === 'number' ? iso : new Date(iso).getTime());
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}

/** Minutes after campus midnight of a moment. */
export function campusMinutesOf(iso: string): number {
  const p = campusParts(new Date(iso).getTime());
  return p.hour * 60 + p.minute;
}

export function todayKey(): string {
  return campusDateKeyOf(Date.now());
}

export function addDays(key: string, days: number): string {
  const [y, m, d] = splitKey(key);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}

/** Last day a post can use (the API allows dates up to a year ahead). */
export function lastSelectableKey(): string {
  return addDays(todayKey(), 364);
}

// ---------- building slots ----------

export type TimeWindow = { start: number; end: number };

export type SlotSelection =
  | {
      mode: 'dates';
      /** Selected days, any order. */
      dates: string[];
      /** The time on every date (null = all day), unless perDay is on. */
      window: TimeWindow | null;
      /** Also add the same weekday every week up to this many weeks after each date (0 = no repeat). */
      repeatWeeks: number;
      /** Each picked date has its own time (windows), e.g. Mon 2–3 PM and Wed 12:30–1:30 PM. */
      perDay?: boolean;
      /** perDay: the time for each picked date (null = all day); a date missing here uses window. */
      windows?: Record<string, TimeWindow | null>;
    }
  | {
      /** Requests: "any time from now until the end of this day". */
      mode: 'deadline';
      deadline: string | null;
    };

/** The days a selection covers (with weekly repeats), sorted, no duplicates. */
export function selectedDays(selection: SlotSelection): string[] {
  if (selection.mode === 'deadline') return selection.deadline ? [selection.deadline] : [];
  const last = lastSelectableKey();
  const days = new Set<string>();
  for (const date of selection.dates) {
    for (let week = 0; week <= selection.repeatWeeks; week++) {
      const day = addDays(date, week * 7);
      if (day <= last) days.add(day);
    }
  }
  return [...days].sort();
}

/** The time for one picked date (null = all day). Weekly repeats use the same time. */
export function windowForDate(selection: Extract<SlotSelection, { mode: 'dates' }>, date: string): TimeWindow | null {
  if (selection.perDay && selection.windows && date in selection.windows) return selection.windows[date];
  return selection.window;
}

// every slot the selection describes, including ones that already ended
function allSlots(selection: SlotSelection): SkillSlot[] {
  if (selection.mode === 'deadline') {
    if (!selection.deadline) return [];
    return [{ starts_at: campusTimeToIso(todayKey(), 0), ends_at: campusTimeToIso(selection.deadline, 1440) }];
  }
  const last = lastSelectableKey();
  const unique = new Map<string, SkillSlot>();
  for (const date of selection.dates) {
    const { start, end } = windowForDate(selection, date) ?? { start: 0, end: 1440 };
    for (let week = 0; week <= selection.repeatWeeks; week++) {
      const day = addDays(date, week * 7);
      if (day > last) break;
      const slot = { starts_at: campusTimeToIso(day, start), ends_at: campusTimeToIso(day, end) };
      unique.set(`${slot.starts_at}|${slot.ends_at}`, slot);
    }
  }
  return [...unique.values()].sort((a, b) => a.starts_at.localeCompare(b.starts_at));
}

/** The slots to send to the API; times that have already ended today are left out. */
export function buildSlots(selection: SlotSelection): SkillSlot[] {
  return upcomingSlots(allSlots(selection));
}

/** Problem with a selection, or null when it can be posted. */
export function slotSelectionError(selection: SlotSelection, maxSlots: number): string | null {
  if (selection.mode === 'deadline') {
    return selection.deadline ? null : 'Pick the date you need help by.';
  }
  if (!selection.dates.length) return 'Pick at least one date.';
  for (const date of [...selection.dates].sort()) {
    const w = windowForDate(selection, date);
    if (w && w.end <= w.start) {
      return selection.perDay
        ? `On ${formatDayKey(date)}, the end time must be after the start time.`
        : 'The end time must be after the start time.';
    }
  }
  const count = allSlots(selection).length;
  if (count > maxSlots) return `That's ${count} dates; the limit is ${maxSlots}. Pick fewer dates or weeks.`;
  if (!buildSlots(selection).length) return 'That time has already passed today. Pick a later time or another date.';
  return null;
}

// ---------- formatting ----------

/** 750 → "12:30 PM"; 1440 → "12:00 AM" (midnight). */
export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

/** "2026-10-12" → "Mon, Oct 12". */
export function formatDayKey(key: string, withYear = false): string {
  const [y, m, d] = splitKey(key);
  return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    ...(withYear && { year: 'numeric' }),
    timeZone: 'UTC',
  });
}

/**
 * One slot as text: "Mon, Oct 12 · All day", "Mon, Oct 12 · 2:00 PM – 5:00 PM",
 * or for a span of days "Any time until Fri, Oct 20".
 */
export function formatSlot(slot: SkillSlot): string {
  const startKey = campusDateKeyOf(slot.starts_at);
  const startMin = campusMinutesOf(slot.starts_at);
  const endMs = new Date(slot.ends_at).getTime();
  // an all-day slot ends at midnight, which belongs to the next day
  const endKey = campusDateKeyOf(endMs - 1);
  const endMin = campusMinutesOf(slot.ends_at);

  if (startKey === endKey) {
    if (startMin === 0 && endMin === 0) return `${formatDayKey(startKey)} · All day`;
    return `${formatDayKey(startKey)} · ${formatMinutes(startMin)} – ${formatMinutes(endMin === 0 ? 1440 : endMin)}`;
  }
  if (startMin === 0 && endMin === 0) {
    return startKey <= todayKey()
      ? `Any time until ${formatDayKey(endKey)}`
      : `${formatDayKey(startKey)} – ${formatDayKey(endKey)}`;
  }
  return `${formatDayKey(startKey)} ${formatMinutes(startMin)} – ${formatDayKey(endKey)} ${formatMinutes(endMin)}`;
}

/** Slots that haven't ended yet. */
export function upcomingSlots(slots: SkillSlot[] = []): SkillSlot[] {
  const now = Date.now();
  return slots.filter((slot) => new Date(slot.ends_at).getTime() > now);
}

/** "just now", "5m ago", "3h ago", "2d ago", then "Oct 3". */
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < MINUTE) return 'just now';
  if (diff < 60 * MINUTE) return `${Math.floor(diff / MINUTE)}m ago`;
  if (diff < DAY) return `${Math.floor(diff / (60 * MINUTE))}h ago`;
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: CAMPUS_TIME_ZONE });
}

/** Full post date for screen readers and the detail screen: "October 3, 2026". */
export function formatPostDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: CAMPUS_TIME_ZONE,
  });
}

// ---------- picking a time inside a post's dates ("I can help" / "I'd like this") ----------

export type DayWindow = { start: number; end: number }; // minutes after campus midnight
const STEP_MINUTES = 30;

/**
 * Free time on one campus day, rounded inward to 30-minute marks: the post's slots on
 * that day, minus what has already passed and minus booked times (offers).
 */
export function freeWindows(day: string, slots: SkillSlot[] = [], busy: SkillSlot[] = [], nowMs = Date.now()): DayWindow[] {
  const dayStart = new Date(campusTimeToIso(day, 0)).getTime();
  const dayEnd = new Date(campusTimeToIso(day, 1440)).getTime();
  const from = Math.max(dayStart, nowMs);

  let pieces: [number, number][] = [];
  for (const slot of slots) {
    const s = Math.max(new Date(slot.starts_at).getTime(), from);
    const e = Math.min(new Date(slot.ends_at).getTime(), dayEnd);
    if (e > s) pieces.push([s, e]);
  }
  for (const booked of busy) {
    const bs = new Date(booked.starts_at).getTime();
    const be = new Date(booked.ends_at).getTime();
    pieces = pieces.flatMap(([s, e]): [number, number][] =>
      be <= s || bs >= e ? [[s, e]] : [...(bs > s ? [[s, bs] as [number, number]] : []), ...(be < e ? [[be, e] as [number, number]] : [])],
    );
  }

  // merge, then convert to wall-clock minutes on 30-minute marks
  pieces.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const piece of pieces) {
    const last = merged[merged.length - 1];
    if (last && piece[0] <= last[1]) last[1] = Math.max(last[1], piece[1]);
    else merged.push([...piece]);
  }
  const wallMinutes = (ms: number) => campusMinutesOf(new Date(ms).toISOString()); // rounds down to the minute
  const startMinutes = (ms: number) => wallMinutes(ms) + (ms % 60000 ? 1 : 0); // rounds up
  const endMinutes = (ms: number) => (ms >= dayEnd ? 1440 : wallMinutes(ms));
  return merged
    .map(([s, e]) => ({
      start: Math.ceil(startMinutes(s) / STEP_MINUTES) * STEP_MINUTES,
      end: Math.floor(endMinutes(e) / STEP_MINUTES) * STEP_MINUTES,
    }))
    .filter((w) => w.end - w.start >= STEP_MINUTES);
}

/** Campus days (sorted) that any of the slots touch, from today on. */
export function slotDays(slots: SkillSlot[] = []): string[] {
  const today = todayKey();
  const last = lastSelectableKey();
  const days = new Set<string>();
  for (const slot of slots) {
    let day = campusDateKeyOf(slot.starts_at);
    const endDay = campusDateKeyOf(new Date(slot.ends_at).getTime() - 1);
    if (day < today) day = today;
    for (let i = 0; day <= endDay && day <= last && i < 400; i++, day = addDays(day, 1)) days.add(day);
  }
  return [...days].sort();
}
