import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { ClubRow, EmptyState, RsvpButton, cardStyles } from '@/components/club-cards';
import { ScreenHeader } from '@/components/screen-header';
import { Brand } from '@/constants/brand';
import {
  formatEventDateLong,
  formatEventTimeRange,
  getClubById,
  getEventById,
} from '@/data/mock-data';
import { useAppState } from '@/state/app-state';

/** Event detail: when/where, RSVP, and a link to the host club. */
export default function EventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const event = getEventById(Number(id));
  const { hasRsvp, toggleRsvp } = useAppState();

  if (!event) {
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

  const club = getClubById(event.club_id);
  const going = hasRsvp(event.event_id);

  const details = [
    { icon: '📅', label: 'Date', value: formatEventDateLong(event.event_date) },
    { icon: '🕔', label: 'Time', value: formatEventTimeRange(event) },
    { icon: '📍', label: 'Location', value: event.location },
    { icon: '👥', label: 'Going', value: `${event.attendee_count + (going ? 1 : 0)} students` },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <ScreenHeader title={event.title} subtitle={club?.name} />

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
        <RsvpButton going={going} onPress={() => toggleRsvp(event.event_id)} title={event.title} />
      </View>

      <Text style={cardStyles.sectionTitle} accessibilityRole="header">
        About this event
      </Text>
      <Text style={styles.body}>{event.description}</Text>

      {club && (
        <>
          <Text style={cardStyles.sectionTitle} accessibilityRole="header">
            Hosted by
          </Text>
          <ClubRow club={club} />
        </>
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
  detailCard: {
    marginHorizontal: 20,
    marginTop: 22,
    borderWidth: 1,
    borderColor: Brand.border,
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
    color: Brand.textMuted,
  },
  detailValue: {
    fontSize: 16,
    color: Brand.text,
    fontWeight: '500',
    marginTop: 2,
  },
  rsvpWrap: {
    marginHorizontal: 20,
  },
  body: {
    marginHorizontal: 20,
    fontSize: 16,
    lineHeight: 24,
    color: Brand.text,
  },
});
