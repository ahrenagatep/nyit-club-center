import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { ClubRow, EmptyState, RsvpButton, createCardStyles } from '@/components/club-cards';
import { ScreenHeader } from '@/components/screen-header';
import type { ThemeColors } from '@/constants/theme';
import { useClub } from '@/lib/clubs';
import { formatEventDateLong, formatEventTimeRange, isPast, useEvent } from '@/lib/events';
import { useAppState } from '@/state/app-state';
import { useThemedStyles } from '@/state/theme';

/** Event detail: when/where, RSVP, and a link to the host club. */
export default function EventScreen() {
  const styles = useThemedStyles(createStyles);
  const cardStyles = useThemedStyles(createCardStyles);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { event, loading, error, notFound } = useEvent(Number(id));
  const { hasRsvp, toggleRsvp, rsvpPending, attendeeCount } = useAppState();

  // "&& !event": when the screen refocuses, keep showing the loaded event while it refreshes
  if (loading && !event) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Loading…" />
      </View>
    );
  }

  if (error && !event) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Event" />
        <EmptyState emoji="⚠️" title="Couldn't load this event" message={error} />
      </View>
    );
  }

  if (notFound || !event) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Event not found" />
        <EmptyState
          emoji="🤔"
          title="We couldn't find that event"
          message="It may have been cancelled. Go back and try another one."
        />
      </View>
    );
  }

  const going = hasRsvp(event.event_id);
  const ended = isPast(event); // the API refuses RSVPs once an event ends (409), so hide the button

  const details = [
    { icon: '📅', label: 'Date', value: formatEventDateLong(event.event_date) },
    { icon: '🕔', label: 'Time', value: formatEventTimeRange(event) },
    { icon: '📍', label: 'Location', value: event.location },
    { icon: '👥', label: 'Going', value: `${attendeeCount(event)} students` }, // includes this user's latest RSVP
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <ScreenHeader title={event.title} subtitle={event.club_name} />

      <View style={styles.detailCard}>
        {details.map((item) => (
          <View
            key={item.label}
            style={styles.detailRow}
            accessible
            accessibilityLabel={`${item.label}: ${item.value}`}>
            <Text style={styles.detailIcon} importantForAccessibility="no">
              {item.icon}
            </Text>
            <View>
              <Text style={styles.detailLabel}>{item.label}</Text>
              <Text style={styles.detailValue}>{item.value}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.rsvpWrap}>
        {ended ? (
          <View style={styles.endedNote} accessible accessibilityLabel="This event has ended">
            <Text style={styles.endedText}>This event has ended</Text>
          </View>
        ) : (
          <RsvpButton
            going={going}
            pending={rsvpPending(event.event_id)}
            onPress={() => toggleRsvp(event.event_id)}
            title={event.title}
          />
        )}
      </View>

      <Text style={cardStyles.sectionTitle} accessibilityRole="header">
        About this event
      </Text>
      <Text style={styles.body}>{event.description || 'No description yet.'}</Text>

      <HostClub clubId={event.club_id} />
    </ScrollView>
  );
}

// the host club's row, loaded from GET /clubs/:id once the event is known
function HostClub({ clubId }: { clubId: number }) {
  const cardStyles = useThemedStyles(createCardStyles);
  const { club } = useClub(clubId);
  if (!club) return null;
  return (
    <>
      <Text style={cardStyles.sectionTitle} accessibilityRole="header">
        Hosted by
      </Text>
      <ClubRow club={club} />
    </>
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
  detailCard: {
    marginHorizontal: 20,
    marginTop: 22,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  detailIcon: {
    fontSize: 22,
    width: 36,
  },
  detailLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },
  detailValue: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
    marginTop: 2,
  },
  rsvpWrap: {
    marginHorizontal: 20,
  },
  endedNote: {
    marginTop: 20,
    minHeight: 48,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  endedText: {
    color: colors.textMutedOnSurface,
    fontSize: 17,
    fontWeight: '600',
  },
  body: {
    marginHorizontal: 20,
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
  },
});
