// fetches the club list from the backend (GET /clubs) for Explore and Home.
import { useFocusEffect } from 'expo-router';
import { useCallback, useState, useEffect } from 'react';

import { ApiError, clubsApi, type ApiClub } from './api';

export const CATEGORIES = ['Academic', 'Sports', 'Arts', 'Tech', 'Social'] as const;
export type Category = (typeof CATEGORIES)[number];

export function isCategory(value: unknown): value is Category {
  return typeof value === 'string' && (CATEGORIES as readonly string[]).includes(value);
}

// type definition , this is what Club objects should look like for the frontend to properly display it
export type Club = {
  club_id: number;
  name: string;
  description: string;
  category: Category;
  emoji: string;
  member_count: number;
  rating: number;
};

// translates the category into emojis for the frontend
const CATEGORY_EMOJI: Record<Category, string> = {
  Academic: '📚',
  Sports: '🏀',
  Arts: '🎨',
  Tech: '💻',
  Social: '🎉',
};
// converts each database row into Club shape as defined above (see type definition)
function toClub(row: ApiClub): Club {
  const category: Category = isCategory(row.category) ? row.category : 'Social';

  return {
    club_id: row.club_id,
    name: row.name,
    description: row.description ?? '',
    category,
    emoji: CATEGORY_EMOJI[category],
    member_count: row.member_count,
    rating: 0, // no ratings in the database; the screens hide a rating of 0
  };
}

// loads the club list from the backend (GET /clubs) for Explore and Home tab
export function useClubs() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // run every time the screen comes into view
  useFocusEffect(
    useCallback(() => {
      clubsApi
        .list()
        .then((rows) => {
          setClubs(rows.map(toClub));
          setError(null);
        })
        .catch((e) => setError(e instanceof ApiError ? e.message : 'Could not load clubs.'))
        .finally(() => setLoading(false));
    }, []),
  );

  return { clubs, loading, error };
}

// loads one club from the backend (GET /clubs/:id) for the club page
export function useClub(id: number) {
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    clubsApi
      .get(id)
      .then((row) => setClub(toClub(row)))
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Could not load club.'))
      .finally(() => setLoading(false));
  }, [id]);

  return { club, loading, error };
}