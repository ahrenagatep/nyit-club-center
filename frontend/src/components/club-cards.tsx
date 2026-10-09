/**
 * Reusable club and event cards shared by Home, Explore, My Clubs, and the
 * Club/Event detail screens. Each card is a single pressable that opens the detail
 * screen; RSVP is a separate sibling button so it doesn't trigger navigation.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Brand } from '@/constants/brand';
import {
  formatEventDate,
  formatEventTimeRange,
  getClubById,
  getMemberCount,
  type Club,
  type ClubEvent,
} from '@/data/mock-data';
import { useAppState } from '@/state/app-state';

export function openClub(clubId: number) {
  router.push({ pathname: '/club/[id]', params: { id: String(clubId) } });
}

export function openEvent(eventId: number) {
  router.push({ pathname: '/event/[id]', params: { id: String(eventId) } });
}

/** Full-width club row: emoji, name, subtitle, chevron. */
export function ClubRow({ club, subtitle }: { club: Club; subtitle?: string }) {
  const { isJoined } = useAppState();
  const line =
    subtitle ?? `${getMemberCount(club, isJoined(club.club_id))} members · ${club.category}`;

  return (
    <Pressable
      onPress={() => openClub(club.club_id)}
      style={({ pressed }) => [styles.clubRow, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${club.name}, ${line}`}
      accessibilityHint="Opens the club page">
      <Text style={styles.rowEmoji} importantForAccessibility="no">
        {club.emoji}
      </Text>
      <View style={styles.rowText}>
        <Text style={styles.clubName}>{club.name}</Text>
        <Text style={styles.muted}>{line}</Text>
      </View>
      <Text style={styles.chevron} importantForAccessibility="no">
        ›
      </Text>
    </Pressable>
  );
}

/** Event card with date badge, details, and an RSVP toggle. */
export function EventCard({ event, showClub = true }: { event: ClubEvent; showClub?: boolean }) {
  const { hasRsvp, toggleRsvp } = useAppState();
  const club = getClubById(event.club_id);
  const going = hasRsvp(event.event_id);
  const date = formatEventDate(event.event_date);
  const time = formatEventTimeRange(event);

  // The card body and the RSVP button are siblings (not nested) so each is its
  // own touch target and the web build doesn't render a <button> inside a <button>.
  return (
    <View style={styles.eventCard}>
      <Pressable
        onPress={() => openEvent(event.event_id)}
        style={({ pressed }) => pressed && styles.pressed}
        accessibilityRole="button"
        accessibilityLabel={`${event.title}${club && showClub ? `, hosted by ${club.name}` : ''}, ${date} at ${time}, ${event.location}`}
        accessibilityHint="Opens the event details">
        <View style={styles.eventTopRow}>
          <View style={styles.eventTextArea}>
            <Text style={styles.eventTitle}>{event.title}</Text>
            {showClub && club ? <Text style={styles.eventClub}>{club.name}</Text> : null}
          </View>

          <View style={styles.dateBadge}>
            <Text style={styles.dateText}>{date}</Text>
          </View>
        </View>

        <View style={styles.eventDetails}>
          <Text style={styles.detailText}>🕔 {time}</Text>
          <Text style={styles.detailText}>📍 {event.location}</Text>
          <Text style={styles.detailText}>👥 {event.attendee_count + (going ? 1 : 0)}</Text>
        </View>
      </Pressable>

      <RsvpButton going={going} onPress={() => toggleRsvp(event.event_id)} title={event.title} />
    </View>
  );
}

export function RsvpButton({
  going,
  onPress,
  title,
}: {
  going: boolean;
  onPress: () => void;
  title: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.rsvpButton,
        going && styles.rsvpButtonGoing,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: going }}
      accessibilityLabel={going ? `Cancel RSVP for ${title}` : `RSVP to ${title}`}>
      <Text style={[styles.rsvpText, going && styles.rsvpTextGoing]}>
        {going ? '✓ Going' : 'RSVP'}
      </Text>
    </Pressable>
  );
}

/** Pill-shaped toggle chip (categories on Home/Explore, sort options, event filters). */
export function CategoryChip({
  label,
  active,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  /** Screen-reader label; defaults to the visible label. */
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={accessibilityLabel ?? label}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function EmptyState({
  emoji,
  title,
  message,
}: {
  emoji: string;
  title: string;
  message: string;
}) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyEmoji} importantForAccessibility="no">
        {emoji}
      </Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
    </View>
  );
}

export const cardStyles = StyleSheet.create({
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Brand.text,
    marginHorizontal: 20,
    marginTop: 26,
    marginBottom: 14,
  },
});

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.7,
  },
  clubRow: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Brand.white,
  },
  rowEmoji: {
    fontSize: 34,
  },
  rowText: {
    marginLeft: 14,
    flex: 1,
  },
  clubName: {
    fontSize: 18,
    fontWeight: '600',
    color: Brand.text,
  },
  muted: {
    fontSize: 15,
    color: Brand.textMuted,
    marginTop: 6,
  },
  chevron: {
    fontSize: 28,
    color: Brand.textMuted,
    marginLeft: 8,
  },
  eventCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 18,
    padding: 20,
    backgroundColor: Brand.white,
  },
  eventTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  eventTextArea: {
    flex: 1,
    paddingRight: 12,
  },
  eventTitle: {
    color: Brand.text,
    fontSize: 19,
    fontWeight: '600',
  },
  eventClub: {
    color: Brand.textMuted,
    fontSize: 15,
    marginTop: 6,
  },
  dateBadge: {
    backgroundColor: Brand.primaryTint,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 18,
  },
  dateText: {
    color: Brand.primary,
    fontSize: 15,
    fontWeight: '500',
  },
  eventDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 20,
  },
  detailText: {
    color: Brand.textMuted,
    fontSize: 14,
  },
  rsvpButton: {
    backgroundColor: Brand.primary,
    minHeight: 48,
    justifyContent: 'center',
    borderRadius: 13,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 2,
    borderColor: Brand.primary,
  },
  rsvpButtonGoing: {
    backgroundColor: Brand.white,
  },
  rsvpText: {
    color: Brand.white,
    fontSize: 17,
    fontWeight: 'bold',
  },
  rsvpTextGoing: {
    color: Brand.primary,
  },
  chip: {
    backgroundColor: Brand.chip,
    paddingHorizontal: 20,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 16,
  },
  chipActive: {
    backgroundColor: Brand.primary,
  },
  chipText: {
    color: Brand.chipText,
    fontSize: 16,
    fontWeight: '600',
  },
  chipTextActive: {
    color: Brand.white,
  },
  empty: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Brand.text,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 15,
    color: Brand.textMuted,
    textAlign: 'center',
    marginTop: 6,
  },
});
