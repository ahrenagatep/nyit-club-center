/**
 * Pieces shared by the Skill Exchange list and post screens: the post card,
 * kind/status badges, tag chips, Kudos, and the poster row.
 */
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import type { ThemeColorName, ThemeColors } from '@/constants/theme';
import type { EngagementStatus, SkillAuthor, SkillKind, SkillPost, SkillStatus } from '@/lib/api';
import { formatPostDate, formatSlot, timeAgo } from '@/lib/skill-dates';
import { useTheme, useThemedStyles } from '@/state/theme';

/** Screens outside the Skill Exchange tab that open its screens; Back returns to them. */
export type SkillOrigin = 'notifications' | 'profile';

export function openSkillPost(postId: number, from?: SkillOrigin) {
  router.push({ pathname: '/skill-exchange/[id]', params: { id: String(postId), ...(from && { from }) } });
}

export function openSkillEngagement(engagementId: number, from?: SkillOrigin) {
  router.push({ pathname: '/skill-exchange/engagement/[id]', params: { id: String(engagementId), ...(from && { from }) } });
}

/**
 * Back for a Skill Exchange screen opened from outside the tab: the screen lives in the
 * tab's own stack, so the previous screen there is the list, not where the user came from.
 */
export function backToOrigin(from: string | undefined): (() => void) | undefined {
  if (from === 'notifications') return () => router.navigate('/notifications');
  if (from === 'profile') return () => router.navigate('/profile');
  return undefined;
}

export const KIND_LABEL: Record<SkillKind, string> = { request: 'Requesting', offer: 'Offering' };

export const STATUS_LABEL: Record<SkillStatus, string> = {
  open: 'Open',
  closed: 'Closed',
  complete: 'Complete',
  available: 'Available',
  unavailable: 'Unavailable',
};

/** A badge's background and text, as theme color names. */
type BadgeColors = { bg: ThemeColorName; fg: ThemeColorName };

// text/background pairs all pass WCAG AA (4.5:1) at 12px
const STATUS_COLORS: Record<SkillStatus, BadgeColors> = {
  open: { bg: 'successBackground', fg: 'success' },
  available: { bg: 'successBackground', fg: 'success' },
  closed: { bg: 'warningBackground', fg: 'warning' },
  complete: { bg: 'surfaceMuted', fg: 'neutral' },
  unavailable: { bg: 'surfaceMuted', fg: 'neutral' },
};

// a response's state; same AA-checked colour pairs as the post badges
export const ENGAGEMENT_STATUS: Record<EngagementStatus, { label: string } & BadgeColors> = {
  pending: { label: 'WAITING FOR A REPLY', bg: 'warningBackground', fg: 'warning' },
  accepted: { label: 'AGREED', bg: 'successBackground', fg: 'success' },
  declined: { label: 'DECLINED', bg: 'surfaceMuted', fg: 'neutral' },
  cancelled: { label: 'CANCELLED', bg: 'surfaceMuted', fg: 'neutral' },
  completed: { label: 'COMPLETED', bg: 'primaryTintBadge', fg: 'textAccent' },
};

export function KindBadge({ kind }: { kind: SkillKind }) {
  const styles = useThemedStyles(createStyles);
  const offer = kind === 'offer';
  return (
    <View style={[styles.badge, offer ? styles.offerBadge : styles.requestBadge]}>
      <Text style={[styles.badgeText, offer ? styles.offerText : styles.requestText]}>{KIND_LABEL[kind]}</Text>
    </View>
  );
}

export function StatusBadge({ status }: { status: SkillStatus }) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const badge = STATUS_COLORS[status];
  return (
    <View style={[styles.badge, { backgroundColor: colors[badge.bg] }]}>
      <Text style={[styles.badgeText, { color: colors[badge.fg] }]}>{STATUS_LABEL[status].toUpperCase()}</Text>
    </View>
  );
}

export function TagChips({ tags }: { tags: string[] }) {
  const styles = useThemedStyles(createStyles);
  if (!tags.length) return null;
  return (
    <View style={styles.tagRow}>
      {tags.map((tag) => (
        <View key={tag} style={styles.tag}>
          <Text style={styles.tagText}>{tag}</Text>
        </View>
      ))}
    </View>
  );
}

export function kudosLabel(count: number): string {
  return `${count} Kudos`;
}

export function KudosBadge({ count }: { count: number }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.kudos} accessibilityLabel={`${kudosLabel(count)}: requests and offers fulfilled`}>
      <Text style={styles.kudosText}>⭐ {count}</Text>
    </View>
  );
}

export function authorName(author: SkillAuthor): string {
  return `${author.first_name} ${author.last_name}`.trim() || author.username;
}

export function initials(author: SkillAuthor): string {
  return `${author.first_name?.[0] ?? ''}${author.last_name?.[0] ?? ''}`.toUpperCase() || author.username[0]?.toUpperCase() || '?';
}

/** Avatar, name + Kudos, NYIT email, and when it was posted. */
export function AuthorRow({ author, postedAt }: { author: SkillAuthor; postedAt: string }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.authorRow}>
      <View style={styles.avatar} importantForAccessibility="no-hide-descendants">
        <Text style={styles.avatarText}>{initials(author)}</Text>
      </View>
      <View style={styles.authorText}>
        <View style={styles.nameRow}>
          <Text style={styles.authorName} numberOfLines={1}>
            {authorName(author)}
          </Text>
          <KudosBadge count={author.kudos} />
        </View>
        <Text style={styles.authorEmail} numberOfLines={1}>
          {author.nyit_email}
        </Text>
      </View>
      <Text style={styles.timeText} accessibilityLabel={`Posted ${formatPostDate(postedAt)}`}>
        {timeAgo(postedAt)}
      </Text>
    </View>
  );
}

/**
 * A post in the Requests/Offers list. Collapsed it shows the poster, badges, title,
 * tags, location, the next dates, and the start of the description (fading out when
 * there's more); "Show details" shows the full description and additional information.
 * The title (or "Open") opens the full post.
 */
export function SkillPostCard({
  post,
  expanded,
  onToggle,
}: {
  post: SkillPost;
  expanded: boolean;
  onToggle: () => void;
}) {
  const styles = useThemedStyles(createStyles);
  // the description is drawn in full and clipped; its real height says whether it was cut off
  const [descriptionHeight, setDescriptionHeight] = useState(0);
  const clipped = descriptionHeight > PREVIEW_HEIGHT + 1;
  const hasMore = clipped || Boolean(post.extras);

  const slots = post.upcoming_slots ?? [];
  const moreDates = (post.upcoming_slot_count ?? slots.length) - Math.min(slots.length, CARD_DATES);
  const place = `${post.location || 'No location set'}${post.location && post.location_flexible ? ' (flexible)' : ''}`;
  const dateText = slots.length
    ? `${slots.slice(0, CARD_DATES).map(formatSlot).join('; ')}${moreDates > 0 ? `; and ${moreDates} more` : ''}`
    : 'No upcoming dates';

  const summary = `${KIND_LABEL[post.kind]}: ${post.title}. ${STATUS_LABEL[post.status]}. Posted by ${authorName(post.author)}, ${post.author.kudos} Kudos, ${formatPostDate(post.created_at)}.${post.tags.length ? ` Tags: ${post.tags.join(', ')}.` : ''} Location: ${place}. Dates: ${dateText}.`;

  return (
    <View style={styles.card}>
      <AuthorRow author={post.author} postedAt={post.created_at} />

      <Pressable
        onPress={() => openSkillPost(post.post_id)}
        style={({ pressed }) => pressed && styles.pressed}
        accessibilityRole="button"
        accessibilityLabel={summary}
        accessibilityHint="Opens the full post">
        <View style={styles.badgeRow}>
          <KindBadge kind={post.kind} />
          <StatusBadge status={post.status} />
          {post.is_owner && <Text style={styles.yours}>Your post</Text>}
        </View>
        <Text style={styles.title}>{post.title}</Text>
        <TagChips tags={post.tags} />

        <View style={styles.facts} importantForAccessibility="no-hide-descendants">
          <Text style={styles.fact}>📍 {place}</Text>
          {slots.length ? (
            slots.slice(0, CARD_DATES).map((slot) => (
              <Text key={`${slot.starts_at}-${slot.ends_at}`} style={styles.fact}>
                🗓 {formatSlot(slot)}
              </Text>
            ))
          ) : (
            <Text style={styles.fact}>🗓 No upcoming dates</Text>
          )}
          {moreDates > 0 && slots.length > 0 && (
            <Text style={styles.factMore}>+ {moreDates} more {moreDates === 1 ? 'date' : 'dates'}</Text>
          )}
        </View>

        <View style={[styles.preview, !expanded && styles.previewCollapsed]}>
          <Text style={styles.description} onLayout={(e) => setDescriptionHeight(e.nativeEvent.layout.height)}>
            {post.description}
          </Text>
          {!expanded && clipped && (
            <View style={styles.fade} pointerEvents="none" importantForAccessibility="no-hide-descendants">
              {FADE_STEPS.map((opacity) => (
                <View key={opacity} style={[styles.fadeStep, { opacity }]} />
              ))}
            </View>
          )}
        </View>
      </Pressable>

      {expanded && post.extras ? (
        <View style={styles.details}>
          <Text style={styles.detailLabel}>Additional information</Text>
          <Text style={styles.description}>{post.extras}</Text>
        </View>
      ) : null}

      <View style={styles.cardBottom}>
        {hasMore ? (
          <Pressable
            onPress={onToggle}
            style={({ pressed }) => [styles.textButton, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityState={{ expanded }}
            accessibilityLabel={`${expanded ? 'Hide' : 'Show'} details for ${post.title}`}>
            <Text style={styles.textButtonText}>{expanded ? 'Hide details ▴' : 'Show details ▾'}</Text>
          </Pressable>
        ) : (
          <View style={styles.textButton} />
        )}

        <Text style={styles.meta} accessibilityLabel={`${post.comment_count} comments`}>
          💬 {post.comment_count}
        </Text>

        <Pressable
          onPress={() => openSkillPost(post.post_id)}
          style={({ pressed }) => [styles.openButton, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`Open post ${post.title}`}>
          <Text style={styles.openButtonText}>Open</Text>
        </Pressable>
      </View>
    </View>
  );
}

// collapsed cards show about 3 lines of the description, then fade to the card's white
const PREVIEW_HEIGHT = 60;
const CARD_DATES = 2;
const FADE_STEPS = [0.2, 0.45, 0.7, 0.92];

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  pressed: {
    opacity: 0.7,
  },
  card: {
    marginHorizontal: 18,
    marginBottom: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: colors.textAccent,
    fontSize: 16,
    fontWeight: '700',
  },
  authorText: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flexShrink: 1,
  },
  authorEmail: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  timeText: {
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: 8,
  },
  kudos: {
    backgroundColor: colors.kudosBackground,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  kudosText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.kudos,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  badge: {
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  offerBadge: {
    backgroundColor: colors.successBackground,
  },
  offerText: {
    color: colors.success,
  },
  requestBadge: {
    backgroundColor: colors.primaryTintBadge,
  },
  requestText: {
    color: colors.textAccent,
  },
  yours: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginTop: 10,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  tag: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 12,
    color: colors.textChip,
  },
  details: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginTop: 10,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  facts: {
    marginTop: 10,
    gap: 3,
  },
  fact: {
    fontSize: 13,
    color: colors.text,
  },
  factMore: {
    fontSize: 13,
    color: colors.textMuted,
  },
  preview: {
    marginTop: 10,
    overflow: 'hidden',
  },
  previewCollapsed: {
    maxHeight: PREVIEW_HEIGHT,
  },
  fade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  fadeStep: {
    height: 6,
    backgroundColor: colors.surface,
  },
  meta: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 8,
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  textButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingRight: 8,
  },
  textButtonText: {
    color: colors.textAccent,
    fontSize: 14,
    fontWeight: '600',
  },
  openButton: {
    backgroundColor: colors.primary,
    minHeight: 44,
    minWidth: 80,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  openButtonText: {
    color: colors.onPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
});
