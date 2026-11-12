import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { EmptyState, createCardStyles } from '@/components/club-cards';
import { ScreenHeader } from '@/components/screen-header';
import type { ThemeColors } from '@/constants/theme';
import { useAppState } from '@/state/app-state';
import { useClub } from '@/lib/clubs';
import { useThemedStyles } from '@/state/theme';

/** Club detail: about, join/leave, and the club's upcoming events. */
export default function ClubScreen() {
  const styles = useThemedStyles(createStyles);
  const cardStyles = useThemedStyles(createCardStyles);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { club, loading, error } = useClub(Number(id));
  const { isJoined, toggleJoin } = useAppState();

  if (loading) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Loading…" />
      </View>
    );
  }

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
  // const events = getEventsForClub(club.club_id);
  const memberCount = club.member_count;

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
      {(  // add back events.length === 0 ? when we get events endpoint working
        <EmptyState
          emoji="📅"
          title="No upcoming events"
          message="Check back later for new events from this club."
        />
      )}
      {/*This makes it so only joined members have access to annoucements, non members would only see About & Upcoming Events */}
      {joined && (
        <>
          <Text style={cardStyles.sectionTitle} accessibilityRole="header">Annoucements</Text>

          <Pressable
            style={({ pressed }) => [
              styles.announcementButton,
              pressed && styles.pressed,
            ]}
            onPress={() =>
              router.push({
                pathname: "/club-announcements",
                params: {
                  clubId: club.club_id,
                },
              })
            }
          >
            <View>
              <Text style={styles.announcementButtonTitle}>Club Announcements</Text>
              <Text style={styles.announcementButtonText}> View updated and info the club</Text>
            </View>

            <Text style={styles.arrow}>›</Text>
          </Pressable>
        </>
      )}

    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    backgroundColor: colors.tagBackground,
    borderRadius: 14,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  tagText: {
    color: colors.textAccentOnSurface,
    fontSize: 14,
  },
  joinButton: {
    marginHorizontal: 20,
    marginTop: 22,
    minHeight: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  joinButtonJoined: {
    backgroundColor: colors.surface,
  },
  joinText: {
    color: colors.onPrimary,
    fontSize: 17,
    fontWeight: 'bold',
  },
  joinTextJoined: {
    color: colors.textAccentOnSurface,
  },
  pressed: {
    opacity: 0.7,
  },
  body: {
    marginHorizontal: 20,
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
  },

  announcementButton: {
    marginHorizontal: 20,
    marginTop: 10,
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderAnnouncements,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  announcementButtonTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: colors.text,
  },

  announcementButtonText: {
    fontSize: 14,
    color: colors.textMutedAnnouncements,
    marginTop: 5,
    maxWidth: 280,
  },

  arrow: {
    fontSize: 30,
    color: colors.textAccent,
  },
});
