/**
 * TEMPORARY mock data for the mobile client.
 *
 * Field names mirror the PostgreSQL schema in backend/sql (clubs, events,
 * memberships) so that swapping these arrays for real API
 * calls (e.g. GET /clubs, GET /clubs/:id) only changes where the data comes
 * from, not how screens read it.
 *
 * UI-only extras that are not in the schema yet are marked "UI-only".
 */

export const CATEGORIES = ['Academic', 'Sports', 'Arts', 'Tech', 'Social'] as const;
export type Category = (typeof CATEGORIES)[number];

/** Event filters on the Events tab: every club category plus "Workshop". */
export const EVENT_CATEGORIES = [...CATEGORIES, 'Workshop'] as const;
export type EventCategory = (typeof EVENT_CATEGORIES)[number];

export type Club = {
  club_id: number;
  name: string;
  description: string;
  category: Category;
  emoji: string; // UI-only: placeholder until clubs have logos
  member_count: number; // returned by GET /clubs
  rating: number; // UI-only: shown on Explore; no ratings table yet
};

export type ClubEvent = {
  event_id: number;
  club_id: number;
  title: string;
  description: string;
  event_date: string; // ISO timestamp (TIMESTAMPTZ)
  end_date?: string; // UI-only: events table has no end time yet
  location: string;
  category: EventCategory; // UI-only: events table has no category yet
  attendee_count: number; // UI-only: will come from COUNT(attendance)
};

export type MembershipRole = 'member' | 'officer' | 'president';

export type Membership = {
  club_id: number;
  role: MembershipRole;
};

export type CurrentUser = {
  user_id: number;
  first_name: string;
  last_name: string;
  username: string;
  nyit_email: string;
  bio: string;
  role: 'student' | 'moderator' | 'admin';
};

export const CURRENT_USER: CurrentUser = {
  user_id: 1,
  first_name: 'Student',
  last_name: 'User',
  username: 'student',
  nyit_email: 'student@nyit.edu',
  bio: 'NYIT student. Update your bio from the profile page once editing is available.',
  role: 'student',
};

export const CLUBS: Club[] = [
  {
    club_id: 1,
    name: 'Robotics Club',
    description:
      'Design, build, and program robots for campus showcases and intercollegiate competitions. No experience needed.',
    category: 'Tech',
    emoji: '🤖',
    member_count: 124,
    rating: 4.9,
  },
  {
    club_id: 2,
    name: 'Photography Club',
    description:
      'Weekly photo walks around campus and the city, editing workshops, and an end-of-semester gallery show.',
    category: 'Arts',
    emoji: '📷',
    member_count: 89,
    rating: 4.2,
  },
  {
    club_id: 3,
    name: 'Gaming Club',
    description:
      'Casual game nights, esports scrimmages, and tournaments. All platforms and skill levels welcome.',
    category: 'Social',
    emoji: '🎮',
    member_count: 102,
    rating: 4.4,
  },
  {
    club_id: 4,
    name: 'Computer Science Club',
    description:
      'Tech talks, coding nights, interview prep, and hackathon teams for anyone interested in computing.',
    category: 'Tech',
    emoji: '💻',
    member_count: 156,
    rating: 4.7,
  },
  {
    club_id: 5,
    name: 'Arts Club',
    description:
      'Painting, drawing, and mixed-media sessions with supplies provided. Share your work at open studio nights.',
    category: 'Arts',
    emoji: '🎨',
    member_count: 64,
    rating: 4.3,
  },
  {
    club_id: 6,
    name: 'Music Club',
    description:
      'Jam sessions, open mics, and the annual Fall Concert. Singers, players, and listeners all welcome.',
    category: 'Arts',
    emoji: '🎵',
    member_count: 77,
    rating: 4.5,
  },
  {
    club_id: 7,
    name: 'Pre-Med Society',
    description:
      'MCAT study groups, shadowing info sessions, and talks from NYITCOM faculty and students.',
    category: 'Academic',
    emoji: '🩺',
    member_count: 143,
    rating: 4.6,
  },
  {
    club_id: 8,
    name: 'Basketball Club',
    description: 'Pickup games twice a week and intramural league play. Bring your sneakers.',
    category: 'Sports',
    emoji: '🏀',
    member_count: 58,
    rating: 4.5,
  },
  {
    club_id: 9,
    name: 'Debate Team',
    description:
      'Practice public speaking, debate current topics, and travel to regional debate tournaments.',
    category: 'Academic',
    emoji: '🎤',
    member_count: 41,
    rating: 3.4,
  },
  {
    club_id: 10,
    name: 'Student Council',
    description:
      'The student government. Plans campus-wide events and brings student concerns to the administration.',
    category: 'Social',
    emoji: '🏛️',
    member_count: 35,
    rating: 4.1,
  },
  {
    club_id: 11,
    name: 'Engineering Society',
    description:
      'Project teams, industry site visits, and the yearly STEM Symposium for all engineering majors.',
    category: 'Academic',
    emoji: '⚙️',
    member_count: 98,
    rating: 4.4,
  },
  {
    club_id: 12,
    name: 'Theatre Club',
    description:
      'Acting workshops, a fall play and spring musical, and monthly open mic nights for every kind of performer.',
    category: 'Arts',
    emoji: '🎭',
    member_count: 46,
    rating: 4.0,
  },
];

/**
 * Mock events are scheduled relative to today so "upcoming" lists never go
 * empty. Times are built in the device's local time zone.
 */
function daysFromNow(days: number, hour: number, minute = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

export const EVENTS: ClubEvent[] = [
  {
    event_id: 1,
    club_id: 4,
    title: 'Tech Talk: Rise of AI',
    description:
      'A guest speaker from industry walks through how modern AI systems are built and deployed, followed by Q&A.',
    event_date: daysFromNow(1, 17),
    location: 'Room 301',
    category: 'Tech',
    attendee_count: 35,
  },
  {
    event_id: 2,
    club_id: 6,
    title: 'Fall Concert',
    description:
      'The Music Club’s annual fall showcase featuring student bands, soloists, and a closing group performance.',
    event_date: daysFromNow(9, 19),
    location: 'SAC Gym',
    category: 'Arts',
    attendee_count: 100,
  },
  {
    event_id: 3,
    club_id: 1,
    title: 'Robot Build Night',
    description: 'Hands-on build session for the upcoming competition robot. Pizza provided.',
    event_date: daysFromNow(6, 18),
    location: 'Engineering Lab 105',
    category: 'Workshop',
    attendee_count: 22,
  },
  {
    event_id: 4,
    club_id: 2,
    title: 'Campus Photo Walk',
    description: 'Golden-hour photo walk around campus. Any camera, including phones, is fine.',
    event_date: daysFromNow(13, 17, 30),
    location: 'Meet at Student Center',
    category: 'Arts',
    attendee_count: 18,
  },
  {
    event_id: 5,
    club_id: 3,
    title: 'Smash Tournament',
    description: 'Double-elimination bracket with prizes for the top three players.',
    event_date: daysFromNow(16, 15),
    location: 'Student Lounge',
    category: 'Social',
    attendee_count: 48,
  },
  {
    event_id: 6,
    club_id: 10,
    title: 'Club Mixer Night',
    description:
      'Meet officers from every club on campus, grab food, and find a club that fits you.',
    event_date: daysFromNow(5, 18),
    end_date: daysFromNow(5, 21),
    location: 'SAC',
    category: 'Social',
    attendee_count: 64,
  },
  {
    event_id: 7,
    club_id: 11,
    title: 'STEM Symposium',
    description:
      'Student research posters and short talks from engineering and science majors, with judges from industry.',
    event_date: daysFromNow(20, 10),
    end_date: daysFromNow(20, 12),
    location: 'Anna Rubin, Rm 301',
    category: 'Academic',
    attendee_count: 40,
  },
  {
    event_id: 8,
    club_id: 12,
    title: 'Open Mic Night',
    description: 'Music, poetry, and comedy. Sign up at the door for a five-minute slot.',
    event_date: daysFromNow(35, 19),
    end_date: daysFromNow(35, 22),
    location: 'Auditorium',
    category: 'Arts',
    attendee_count: 30,
  },
];

/** Clubs the signed-in user belongs to (memberships table, status = 'active'). */
export const MY_MEMBERSHIPS: Membership[] = [
  { club_id: 4, role: 'member' },
  { club_id: 5, role: 'member' },
];

/** Club IDs shown under "Recommended for You" (placeholder until a recommendation query exists). */
export const RECOMMENDED_CLUB_IDS: number[] = [1, 2, 3];

/** Club IDs shown under "Trending" on Explore (placeholder until there's a trending query). */
export const TRENDING_CLUB_IDS: number[] = [1, 2];

// ---------- Lookup helpers ----------

/** "Member" / "Officer" / "President" for a club the user belongs to. */
export function getMembershipRoleLabel(clubId: number): string {
  const role = MY_MEMBERSHIPS.find((m) => m.club_id === clubId)?.role ?? 'member';
  return role.charAt(0).toUpperCase() + role.slice(1);
}

/**
 * Member count adjusted for the user joining or leaving this session.
 * member_count already includes the user's starting memberships.
 */
export function getMemberCount(club: Club, joined: boolean): number {
  const wasMember = MY_MEMBERSHIPS.some((m) => m.club_id === club.club_id);
  return club.member_count + (joined ? 1 : 0) - (wasMember ? 1 : 0);
}

export function getClubById(id: number): Club | undefined {
  return CLUBS.find((club) => club.club_id === id);
}

export function getEventById(id: number): ClubEvent | undefined {
  return EVENTS.find((event) => event.event_id === id);
}

export function getEventsForClub(clubId: number): ClubEvent[] {
  return getUpcomingEvents().filter((event) => event.club_id === clubId);
}

/** Events that haven't ended yet, soonest first. */
export function getUpcomingEvents(): ClubEvent[] {
  const now = Date.now();
  return sortByDate(
    EVENTS.filter((event) => new Date(event.end_date ?? event.event_date).getTime() >= now),
  );
}

export function isCategory(value: unknown): value is Category {
  return typeof value === 'string' && (CATEGORIES as readonly string[]).includes(value);
}

/** Case-insensitive name/description search plus optional category filter (mirrors GET /clubs?search=&category=). */
export function searchClubs(query: string, category: Category | null): Club[] {
  const q = query.trim().toLowerCase();
  return CLUBS.filter((club) => {
    const matchesCategory = category === null || club.category === category;
    const matchesQuery =
      q === '' || club.name.toLowerCase().includes(q) || club.description.toLowerCase().includes(q);
    return matchesCategory && matchesQuery;
  });
}

function sortByDate(events: ClubEvent[]): ClubEvent[] {
  return [...events].sort(
    (a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime(),
  );
}

// ---------- Formatting helpers ----------

/** Events are shown in campus time so dates don't shift for users whose phone is set elsewhere. */
export const CAMPUS_TIME_ZONE = 'America/New_York';

export function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: CAMPUS_TIME_ZONE,
  });
}

/** Month and day as separate strings, for the stacked date badge on the Events tab. */
export function formatEventMonthDay(iso: string): { month: string; day: string } {
  const date = new Date(iso);
  return {
    month: date.toLocaleDateString('en-US', { month: 'short', timeZone: CAMPUS_TIME_ZONE }),
    day: date.toLocaleDateString('en-US', { day: 'numeric', timeZone: CAMPUS_TIME_ZONE }),
  };
}

export function formatEventTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: CAMPUS_TIME_ZONE,
  });
}

/** "6:00 PM – 9:00 PM", or just the start time when the event has no end time. */
export function formatEventTimeRange(event: ClubEvent): string {
  const start = formatEventTime(event.event_date);
  return event.end_date ? `${start} – ${formatEventTime(event.end_date)}` : start;
}

export function formatEventDateLong(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: CAMPUS_TIME_ZONE,
  });
}

/** "YYYY-MM-DD" in campus time; used to match events to calendar days. */
export function campusDateKey(iso: string): string {
  // en-CA formats dates as YYYY-MM-DD.
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: CAMPUS_TIME_ZONE });
}
