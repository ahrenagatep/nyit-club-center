import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { EmptyState, EventCard, cardStyles } from '@/components/club-cards';
import { ScreenHeader } from '@/components/screen-header';
import { Brand } from '@/constants/brand';
import { getClubById, getEventsForClub, getMemberCount } from '@/data/mock-data';
import { useAppState } from '@/state/app-state';

/** Club detail: about, join/leave, and the club's upcoming events. */
export default function ClubScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const club = getClubById(Number(id));
  const { isJoined, toggleJoin } = useAppState();

  if (!club) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Club not found" />
        <EmptyState
          emoji="🤔"
          title="We couldn't find that club"
          message="It may have been removed. Go back and try another one."
        />
      </View>
    );
  }

  const joined = isJoined(club.club_id);
  const events = getEventsForClub(club.club_id);
  const memberCount = getMemberCount(club, joined);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <ScreenHeader title={club.name} subtitle={`${club.category} · ${memberCount} members`} />

      <View style={styles.hero}>
        <Text style={styles.heroEmoji} importantForAccessibility="no">
          {club.emoji}
        </Text>
        <View style={styles.tag}>
          <Text style={styles.tagText}>{club.category}</Text>
        </View>
      </View>

      <Pressable
        onPress={() => toggleJoin(club.club_id)}
        style={({ pressed }) => [
          styles.joinButton,
          joined && styles.joinButtonJoined,
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityState={{ selected: joined }}
        accessibilityLabel={joined ? `Leave ${club.name}` : `Join ${club.name}`}>
        <Text style={[styles.joinText, joined && styles.joinTextJoined]}>
          {joined ? '✓ Joined' : 'Join Club'}
        </Text>
      </Pressable>

      <Text style={cardStyles.sectionTitle} accessibilityRole="header">
        About
      </Text>
      <Text style={styles.body}>{club.description}</Text>

      <Text style={cardStyles.sectionTitle} accessibilityRole="header">
        Upcoming Events
      </Text>
      {events.length === 0 ? (
        <EmptyState
          emoji="📅"
          title="No upcoming events"
          message="Check back later for new events from this club."
        />
      ) : (
        events.map((event) => <EventCard key={event.event_id} event={event} showClub={false} />)
      )}
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
  hero: {
    alignItems: 'center',
    marginTop: 24,
  },
  heroEmoji: {
    fontSize: 64,
  },
  tag: {
    marginTop: 12,
    backgroundColor: Brand.tagBackground,
    borderRadius: 14,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  tagText: {
    color: Brand.primary,
    fontSize: 14,
  },
  joinButton: {
    marginHorizontal: 20,
    marginTop: 22,
    minHeight: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Brand.primary,
    borderWidth: 2,
    borderColor: Brand.primary,
  },
  joinButtonJoined: {
    backgroundColor: Brand.white,
  },
  joinText: {
    color: Brand.white,
    fontSize: 17,
    fontWeight: 'bold',
  },
  joinTextJoined: {
    color: Brand.primary,
  },
  pressed: {
    opacity: 0.7,
  },
  body: {
    marginHorizontal: 20,
    fontSize: 16,
    lineHeight: 24,
    color: Brand.text,
  },
});
