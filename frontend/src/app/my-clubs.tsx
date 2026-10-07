import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { ClubRow, EmptyState } from '@/components/club-cards';
import { ScreenHeader } from '@/components/screen-header';
import { Brand } from '@/constants/brand';
import { CLUBS, getMembershipRoleLabel } from '@/data/mock-data';
import { useAppState } from '@/state/app-state';

/** Clubs the user has joined (Home → "View all" under Your Clubs, and Profile). */
export default function MyClubsScreen() {
  const { joinedClubIds } = useAppState();
  const clubs = CLUBS.filter((club) => joinedClubIds.includes(club.club_id));

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <ScreenHeader
        title="Your Clubs"
        subtitle={`${clubs.length} ${clubs.length === 1 ? 'club' : 'clubs'} joined`}
      />

      <View style={styles.spacer} />

      {clubs.length === 0 ? (
        <EmptyState
          emoji="🔍"
          title="You haven't joined any clubs yet"
          message="Browse clubs and tap Join Club to add them here."
        />
      ) : (
        clubs.map((club) => (
          <ClubRow
            key={club.club_id}
            club={club}
            subtitle={`${getMembershipRoleLabel(club.club_id)} · ${club.category}`}
          />
        ))
      )}

      <Pressable
        onPress={() => router.navigate('/explore')}
        style={({ pressed }) => [styles.browseButton, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Browse more clubs">
        <Text style={styles.browseText}>Browse more clubs</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.white,
  },
  content: {
    paddingBottom: 35,
  },
  spacer: {
    height: 20,
  },
  browseButton: {
    marginHorizontal: 20,
    marginTop: 12,
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  browseText: {
    color: Brand.primary,
    fontSize: 17,
    fontWeight: 'bold',
  },
  pressed: {
    opacity: 0.7,
  },
});
