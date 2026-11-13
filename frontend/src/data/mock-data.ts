/**
 * TEMPORARY mock data for the mobile client (clubs only; events come from the API, lib/events.ts).
 *
 * Field names mirror the PostgreSQL schema in backend/sql (clubs, memberships)
 * so that swapping these arrays for real API calls (e.g. GET /clubs, GET /clubs/:id)
 * only changes where the data comes from, not how screens read it.
 *
 * UI-only extras that are not in the schema yet are marked "UI-only".
 */

export const CATEGORIES = ['Academic', 'Sports', 'Arts', 'Tech', 'Social'] as const;
export type Category = (typeof CATEGORIES)[number];

export type Club = {
  club_id: number;
  name: string;
  description: string;
  category: Category;
  emoji: string; // UI-only: placeholder until clubs have logos
  member_count: number; // returned by GET /clubs
  rating: number; // UI-only: shown on Explore; no ratings table yet
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

export function isCategory(value: unknown): value is Category {
  return typeof value === 'string' && (CATEGORIES as readonly string[]).includes(value);
}

/** Case-insensitive name/description search plus optional category filter (mirrors GET /clubs?search=&category=). */
export function searchClubs(query: string, category: Category | null, clubs: Club[] = CLUBS): Club[] {
  const q = query.trim().toLowerCase();
  return clubs.filter((club) => {
    const matchesCategory = category === null || club.category === category;
    const matchesQuery =
      q === '' || club.name.toLowerCase().includes(q) || club.description.toLowerCase().includes(q);
    return matchesCategory && matchesQuery;
  });
}
