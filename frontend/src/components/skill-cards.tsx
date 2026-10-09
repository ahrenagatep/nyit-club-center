/**
 * Pieces shared by the Skill Exchange list and post screens: the post card,
 * kind/status badges, tag chips, Kudos, and the poster row.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Brand } from '@/constants/brand';
import type { EngagementStatus, SkillAuthor, SkillKind, SkillPost, SkillStatus } from '@/lib/api';
import { formatPostDate, timeAgo } from '@/lib/skill-dates';

export function openSkillPost(postId: number) {
  router.push({ pathname: '/skill/[id]', params: { id: String(postId) } });
}

export const KIND_LABEL: Record<SkillKind, string> = { request: 'Requesting', offer: 'Offering' };

export const STATUS_LABEL: Record<SkillStatus, string> = {
  open: 'Open',
  closed: 'Closed',
  complete: 'Complete',
  available: 'Available',
  unavailable: 'Unavailable',
};

// text/background pairs all pass WCAG AA (4.5:1) at 12px
const STATUS_COLORS: Record<SkillStatus, { bg: string; fg: string }> = {
  open: { bg: '#DDF8E8', fg: '#11633A' },
  available: { bg: '#DDF8E8', fg: '#11633A' },
  closed: { bg: '#FFF1D6', fg: '#7A4A00' },
  complete: { bg: '#F1F1F3', fg: '#4A4D57' },
  unavailable: { bg: '#F1F1F3', fg: '#4A4D57' },
};

// a response's state; same AA-checked colour pairs as the post badges
export const ENGAGEMENT_STATUS: Record<EngagementStatus, { label: string; bg: string; fg: string }> = {
  pending: { label: 'WAITING FOR A REPLY', bg: '#FFF1D6', fg: '#7A4A00' },
  accepted: { label: 'AGREED', bg: '#DDF8E8', fg: '#11633A' },
  declined: { label: 'DECLINED', bg: '#F1F1F3', fg: '#4A4D57' },
  cancelled: { label: 'CANCELLED', bg: '#F1F1F3', fg: '#4A4D57' },
  completed: { label: 'COMPLETED', bg: '#E5EFFF', fg: '#0B55B7' },
};

export function KindBadge({ kind }: { kind: SkillKind }) {
  const offer = kind === 'offer';
  return (
    <View style={[styles.badge, offer ? styles.offerBadge : styles.requestBadge]}>
      <Text style={[styles.badgeText, offer ? styles.offerText : styles.requestText]}>{KIND_LABEL[kind]}</Text>
    </View>
  );
}

export function StatusBadge({ status }: { status: SkillStatus }) {
  const colors = STATUS_COLORS[status];
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.badgeText, { color: colors.fg }]}>{STATUS_LABEL[status].toUpperCase()}</Text>
    </View>
  );
}

export function TagChips({ tags }: { tags: string[] }) {
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
 * A post in the Requests/Offers list. "Show details" expands the description and
 * extras in place; the title (or "Open post") opens the full post.
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
  const summary = `${KIND_LABEL[post.kind]}: ${post.title}. ${STATUS_LABEL[post.status]}. Posted by ${authorName(post.author)}, ${post.author.kudos} Kudos, ${formatPostDate(post.created_at)}.${post.tags.length ? ` Tags: ${post.tags.join(', ')}.` : ''}`;

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
      </Pressable>

      {expanded && (
        <View style={styles.details}>
          <Text style={styles.description}>{post.description}</Text>
          {post.extras ? (
            <>
              <Text style={styles.detailLabel}>In exchange</Text>
              <Text style={styles.description}>{post.extras}</Text>
            </>
          ) : null}
          <Text style={styles.meta}>
            📍 {post.location || 'No location set'}
            {post.location && post.location_flexible ? ' (flexible)' : ''}
          </Text>
        </View>
      )}

      <View style={styles.cardBottom}>
        <Pressable
          onPress={onToggle}
          style={({ pressed }) => [styles.textButton, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          accessibilityLabel={`${expanded ? 'Hide' : 'Show'} details for ${post.title}`}>
          <Text style={styles.textButtonText}>{expanded ? 'Hide details ▴' : 'Show details ▾'}</Text>
        </Pressable>

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

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.7,
  },
  card: {
    marginHorizontal: 18,
    marginBottom: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 16,
    backgroundColor: Brand.white,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Brand.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: Brand.primary,
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
    color: Brand.text,
    flexShrink: 1,
  },
  authorEmail: {
    fontSize: 13,
    color: Brand.textMuted,
    marginTop: 2,
  },
  timeText: {
    fontSize: 12,
    color: Brand.textMuted,
    marginLeft: 8,
  },
  kudos: {
    backgroundColor: '#FFF6D9',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  kudosText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B4E00',
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
    backgroundColor: '#DDF8E8',
  },
  offerText: {
    color: '#11633A',
  },
  requestBadge: {
    backgroundColor: '#E5EFFF',
  },
  requestText: {
    color: Brand.primary,
  },
  yours: {
    fontSize: 12,
    color: Brand.textMuted,
    fontStyle: 'italic',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: Brand.text,
    marginTop: 10,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  tag: {
    backgroundColor: Brand.chip,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 12,
    color: Brand.chipText,
  },
  details: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Brand.border,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Brand.text,
    marginTop: 10,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: '#3F4350',
    marginTop: 4,
  },
  meta: {
    fontSize: 13,
    color: Brand.textMuted,
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
    color: Brand.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  openButton: {
    backgroundColor: Brand.primary,
    minHeight: 44,
    minWidth: 80,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  openButtonText: {
    color: Brand.white,
    fontSize: 14,
    fontWeight: '600',
  },
});
