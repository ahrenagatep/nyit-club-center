/**
 * One Skill Exchange post (/skill/5): everything about it, its dates, the
 * "I can help" / "Request this offer" button (or the viewer's response), the
 * poster's responses list and tools (edit, available/unavailable, delete), and comments.
 * /skill/5?focus=comments (from a comment notification) scrolls to the comments.
 */
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';

import { EmptyState } from '@/components/club-cards';
import { ScreenHeader } from '@/components/screen-header';
import {
  AuthorRow,
  ENGAGEMENT_STATUS,
  KIND_LABEL,
  KindBadge,
  KudosBadge,
  StatusBadge,
  TagChips,
  authorName,
} from '@/components/skill-cards';
import { SkillComments } from '@/components/skill-comments';
import { Brand } from '@/constants/brand';
import { ApiError, engagementsApi, skillApi, type SkillEngagement, type SkillPost } from '@/lib/api';
import { formatPostDate, formatSlot, upcomingSlots } from '@/lib/skill-dates';
import { useAuth } from '@/state/auth';

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'Your session has expired. Sign out and log in again.';
    return error.message;
  }
  return 'Something went wrong. Please try again.';
}

function openEngagement(engagementId: number) {
  router.push({ pathname: '/skill/engagement/[id]', params: { id: String(engagementId) } });
}

function leave() {
  if (router.canGoBack()) router.back();
  else router.replace('/skill-exchange');
}

export default function SkillPostScreen() {
  const { id, focus } = useLocalSearchParams<{ id: string; focus?: string }>();
  const postId = /^\d+$/.test(id ?? '') ? Number(id) : null;
  const { session, user } = useAuth();

  const [post, setPost] = useState<SkillPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [busy, setBusy] = useState<'status' | 'delete' | null>(null);
  const [commentsKey, setCommentsKey] = useState(0);
  const [responses, setResponses] = useState<SkillEngagement[] | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const bodyY = useRef(0);
  const commentsY = useRef(0);
  const scrolledToComments = useRef(false);

  const setCommentCount = useCallback((count: number) => {
    setPost((current) => (current && current.comment_count !== count ? { ...current, comment_count: count } : current));
  }, []);

  const scrollToComments = useCallback(() => {
    if (focus !== 'comments' || scrolledToComments.current) return;
    scrolledToComments.current = true;
    // wait a frame so the comments' height is laid out
    setTimeout(() => scrollRef.current?.scrollTo({ y: Math.max(0, bodyY.current + commentsY.current - 12), animated: true }), 50);
  }, [focus]);

  const load = useCallback(async () => {
    if (!session || !postId) {
      setNotFound(!postId);
      setLoading(false);
      return;
    }
    try {
      const { post: loaded } = await skillApi.get(session.access_token, postId);
      setPost(loaded);
      if (loaded.is_owner) {
        engagementsApi
          .forPost(session.access_token, postId)
          .then(({ engagements }) => setResponses(engagements))
          .catch(() => setResponses([]));
      }
      setNotFound(false);
      setLoadError(null);
    } catch (error) {
      if (error instanceof ApiError && (error.status === 404 || error.status === 400)) setNotFound(true);
      else setLoadError(errorMessage(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session, postId]);

  // reload whenever the screen comes back into view (e.g. after editing)
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const setAvailability = async (available: boolean) => {
    if (!session || !post || busy) return;
    setBusy('status');
    setActionError(null);
    try {
      const { post: saved } = await skillApi.update(session.access_token, post.post_id, {
        status: available ? 'available' : 'unavailable',
      });
      setPost(saved);
    } catch (error) {
      setActionError(errorMessage(error));
    } finally {
      setBusy(null);
    }
  };

  const deletePost = async () => {
    if (!session || !post || busy) return;
    setBusy('delete');
    setActionError(null);
    try {
      await skillApi.remove(session.access_token, post.post_id);
      leave();
    } catch (error) {
      setActionError(errorMessage(error));
      setBusy(null);
    }
  };

  if (loading || notFound || (!post && loadError)) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Skill Exchange" />
        {loading ? (
          <ActivityIndicator style={styles.spinner} size="large" color={Brand.primary} accessibilityLabel="Loading post" />
        ) : notFound ? (
          <EmptyState emoji="🗑️" title="Post not found" message="It may have been deleted by the poster." />
        ) : (
          <View style={styles.center}>
            <Text style={styles.errorText} accessibilityRole="alert">
              {loadError}
            </Text>
            <Pressable
              onPress={() => {
                setLoading(true);
                load();
              }}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Try again">
              <Text style={styles.secondaryButtonText}>Try again</Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  }

  if (!post) return null;

  const upcoming = upcomingSlots(post.slots);
  const pastCount = (post.slots?.length ?? 0) - upcoming.length;
  const canDelete = post.is_owner || user?.role === 'admin';
  const edited = new Date(post.updated_at).getTime() - new Date(post.created_at).getTime() > 60 * 1000;
  const poster = authorName(post.author);
  const mine = post.my_engagement ?? null;
  const canRespond = (post.kind === 'request' ? post.status === 'open' : post.status === 'available') && upcoming.length > 0;
  const activeResponses = (responses ?? []).filter((r) => r.status !== 'declined' && r.status !== 'cancelled');
  const closedResponses = (responses ?? []).length - activeResponses.length;

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            setCommentsKey((k) => k + 1);
            load();
          }}
        />
      }>
      <ScreenHeader title={post.kind === 'offer' ? 'Offer' : 'Request'} subtitle="Skill Exchange" />

      <View style={styles.body} onLayout={(e) => (bodyY.current = e.nativeEvent.layout.y)}>
        <View style={styles.badgeRow}>
          <KindBadge kind={post.kind} />
          <StatusBadge status={post.status} />
        </View>
        <Text style={styles.title} accessibilityRole="header">
          {post.title}
        </Text>

        <View style={styles.section}>
          <AuthorRow author={post.author} postedAt={post.created_at} />
          <Text style={styles.meta}>
            Posted {formatPostDate(post.created_at)}
            {edited ? ` · Edited ${formatPostDate(post.updated_at)}` : ''}
          </Text>
        </View>

        <TagChips tags={post.tags} />

        <Text style={styles.sectionTitle} accessibilityRole="header">
          Description
        </Text>
        <Text style={styles.text}>{post.description}</Text>

        {post.extras ? (
          <>
            <Text style={styles.sectionTitle} accessibilityRole="header">
              In exchange
            </Text>
            <Text style={styles.text}>{post.extras}</Text>
          </>
        ) : null}

        <Text style={styles.sectionTitle} accessibilityRole="header">
          Location
        </Text>
        <Text style={styles.text}>
          📍 {post.location || 'No location set'}
          {post.location_flexible || !post.location ? ' · Flexible: you can suggest a place' : ' · Not flexible'}
        </Text>

        <Text style={styles.sectionTitle} accessibilityRole="header">
          {post.kind === 'offer' ? 'Available' : 'When'}
        </Text>
        {upcoming.length ? (
          upcoming.map((slot) => (
            <Text key={`${slot.starts_at}-${slot.ends_at}`} style={styles.slot}>
              🗓 {formatSlot(slot)}
            </Text>
          ))
        ) : (
          <Text style={styles.meta}>All of this post's dates have passed.</Text>
        )}
        {pastCount > 0 && upcoming.length > 0 ? (
          <Text style={styles.meta}>
            {pastCount} past {pastCount === 1 ? 'date' : 'dates'} hidden
          </Text>
        ) : null}

        {post.kind === 'offer' && post.busy?.length ? (
          <>
            <Text style={styles.busyTitle}>Already booked</Text>
            {post.busy.map((booked) => (
              <Text key={`${booked.starts_at}-${booked.ends_at}`} style={styles.busy}>
                ⛔ {formatSlot(booked)}
              </Text>
            ))}
          </>
        ) : null}

        {!post.is_owner && (
          <View style={styles.actionBox}>
            {mine ? (
              <>
                <Text style={styles.actionTitle} accessibilityRole="header">
                  {mine.status === 'pending' ? `Waiting for ${poster} to reply` : `You're all set with ${poster}`}
                </Text>
                <Text style={styles.text}>
                  🗓 {formatSlot(mine)}
                  {mine.location ? ` · 📍 ${mine.location}` : ''}
                </Text>
                {mine.status === 'accepted' && (
                  <Text style={styles.contact} selectable accessibilityLabel={`Contact ${poster} at ${post.author.nyit_email}`}>
                    ✉️ {post.author.nyit_email}
                  </Text>
                )}
                <Pressable
                  onPress={() => openEngagement(mine.engagement_id)}
                  style={({ pressed }) => [styles.secondaryButton, styles.actionButton, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel={mine.status === 'pending' ? 'View or withdraw my response' : 'View agreement'}>
                  <Text style={styles.secondaryButtonText}>{mine.status === 'pending' ? 'View or withdraw' : 'View agreement'}</Text>
                </Pressable>
              </>
            ) : canRespond ? (
              <>
                <Pressable
                  onPress={() => router.push({ pathname: '/skill/interest', params: { id: String(post.post_id) } })}
                  style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel={post.kind === 'request' ? 'I can help' : 'Request this offer'}>
                  <Text style={styles.primaryButtonText}>{post.kind === 'request' ? '🙋 I can help' : '📩 Request this offer'}</Text>
                </Pressable>
                <Text style={styles.meta}>You'll pick a time inside {poster}'s dates. {poster} then accepts or declines.</Text>
              </>
            ) : (
              <Text style={styles.text}>
                {post.status === 'complete'
                  ? 'This request is complete.'
                  : post.status === 'closed'
                    ? 'This request is closed: someone is already helping.'
                    : post.status === 'unavailable'
                      ? "This offer isn't available right now."
                      : "All of this post's dates have passed."}
              </Text>
            )}
          </View>
        )}

        {post.is_owner && (
          <View style={styles.responses}>
            <Text style={styles.sectionTitle} accessibilityRole="header">
              Responses{responses ? ` (${activeResponses.length})` : ''}
            </Text>
            {responses === null ? (
              <ActivityIndicator color={Brand.primary} accessibilityLabel="Loading responses" />
            ) : activeResponses.length === 0 ? (
              <Text style={styles.meta}>No one has responded yet. You'll get a notification when someone does.</Text>
            ) : (
              activeResponses.map((r) => {
                const status = ENGAGEMENT_STATUS[r.status];
                const name = authorName(r.user);
                return (
                  <Pressable
                    key={r.engagement_id}
                    onPress={() => openEngagement(r.engagement_id)}
                    style={({ pressed }) => [styles.responseCard, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel={`${name}, ${r.user.kudos} Kudos, ${status.label.toLowerCase()}, ${formatSlot(r)}${r.message ? `. Message: ${r.message}` : ''}`}
                    accessibilityHint={r.status === 'pending' ? 'Opens it to accept or decline' : 'Opens the agreement'}>
                    <View style={styles.responseTop}>
                      <Text style={styles.responseName}>{name}</Text>
                      <KudosBadge count={r.user.kudos} />
                      <View style={[styles.responseStatus, { backgroundColor: status.bg }]}>
                        <Text style={[styles.responseStatusText, { color: status.fg }]}>{status.label}</Text>
                      </View>
                    </View>
                    <Text style={styles.slot}>🗓 {formatSlot(r)}</Text>
                    {r.location ? <Text style={styles.meta}>📍 {r.location}</Text> : null}
                    {r.message ? (
                      <Text style={styles.responseMessage} numberOfLines={2}>
                        "{r.message}"
                      </Text>
                    ) : null}
                    <Text style={styles.responseLink}>
                      {r.status === 'pending' ? 'Accept or decline ›' : r.status === 'accepted' ? 'View, mark complete ›' : 'View ›'}
                    </Text>
                  </Pressable>
                );
              })
            )}
            {closedResponses > 0 && (
              <Text style={styles.meta}>
                {closedResponses} earlier {closedResponses === 1 ? 'response' : 'responses'} (declined or cancelled)
              </Text>
            )}
          </View>
        )}

        {(post.is_owner || canDelete) && (
          <View style={styles.ownerBox}>
            <Text style={styles.ownerTitle} accessibilityRole="header">
              {post.is_owner ? 'Your post' : 'Admin'}
            </Text>

            {post.is_owner && post.kind === 'offer' && (
              <View style={styles.switchRow}>
                <View style={styles.switchText}>
                  <Text style={styles.switchLabel} nativeID="available-label">
                    Available
                  </Text>
                  <Text style={styles.meta}>Turn off to stop new requests for this offer.</Text>
                </View>
                <Switch
                  value={post.status === 'available'}
                  onValueChange={setAvailability}
                  disabled={busy !== null}
                  trackColor={{ true: Brand.primary, false: '#C9CBD1' }}
                  thumbColor={Brand.white}
                  accessibilityLabel="Available"
                  accessibilityLabelledBy="available-label"
                />
              </View>
            )}

            {post.is_owner && (
              <Pressable
                onPress={() => router.push({ pathname: '/skill/new', params: { id: String(post.post_id) } })}
                style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Edit post">
                <Text style={styles.secondaryButtonText}>✎ Edit description, tags, extras</Text>
              </Pressable>
            )}

            {canDelete &&
              (confirmingDelete ? (
                <View style={styles.confirm} accessibilityLiveRegion="polite">
                  <Text style={styles.confirmText}>Delete this {KIND_LABEL[post.kind].toLowerCase()} post? This can't be undone.</Text>
                  <View style={styles.confirmButtons}>
                    <Pressable
                      onPress={() => setConfirmingDelete(false)}
                      disabled={busy === 'delete'}
                      style={({ pressed }) => [styles.secondaryButton, styles.confirmButton, pressed && styles.pressed]}
                      accessibilityRole="button"
                      accessibilityLabel="Keep post">
                      <Text style={styles.secondaryButtonText}>Keep</Text>
                    </Pressable>
                    <Pressable
                      onPress={deletePost}
                      disabled={busy === 'delete'}
                      style={({ pressed }) => [styles.dangerButton, styles.confirmButton, pressed && styles.pressed]}
                      accessibilityRole="button"
                      accessibilityState={{ busy: busy === 'delete' }}
                      accessibilityLabel="Yes, delete post">
                      <Text style={styles.dangerButtonText}>{busy === 'delete' ? 'Deleting…' : 'Delete'}</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Pressable
                  onPress={() => setConfirmingDelete(true)}
                  style={({ pressed }) => [styles.deleteLink, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Delete post">
                  <Text style={styles.deleteLinkText}>Delete post</Text>
                </Pressable>
              ))}

            <Text style={styles.errorText} accessibilityLiveRegion="polite">
              {actionError ?? ''}
            </Text>
          </View>
        )}

        <View onLayout={(e) => (commentsY.current = e.nativeEvent.layout.y)}>
          <SkillComments
            post={post}
            refreshKey={commentsKey}
            onCountChange={setCommentCount}
            onLoaded={scrollToComments}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.white,
  },
  content: {
    paddingBottom: 40,
  },
  spinner: {
    marginTop: 60,
  },
  center: {
    padding: 24,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Brand.text,
    marginTop: 12,
  },
  section: {
    marginTop: 16,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Brand.text,
    marginTop: 22,
    marginBottom: 6,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
    color: '#3F4350',
  },
  meta: {
    fontSize: 13,
    color: Brand.textMuted,
    marginTop: 6,
  },
  slot: {
    fontSize: 15,
    color: Brand.text,
    marginTop: 4,
  },
  busyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Brand.text,
    marginTop: 10,
  },
  busy: {
    fontSize: 14,
    color: Brand.textMuted,
    marginTop: 3,
  },
  actionBox: {
    marginTop: 24,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#F3F7FD',
    borderWidth: 1,
    borderColor: '#C9DAF3',
    gap: 8,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Brand.text,
  },
  actionButton: {
    marginTop: 4,
  },
  contact: {
    fontSize: 15,
    color: Brand.primary,
  },
  primaryButton: {
    backgroundColor: Brand.primary,
    minHeight: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: Brand.white,
    fontSize: 16,
    fontWeight: '700',
  },
  responses: {
    marginTop: 8,
  },
  responseCard: {
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    gap: 2,
  },
  responseTop: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 2,
  },
  responseName: {
    fontSize: 15,
    fontWeight: '600',
    color: Brand.text,
  },
  responseStatus: {
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  responseStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  responseMessage: {
    fontSize: 14,
    color: '#3F4350',
    fontStyle: 'italic',
    marginTop: 4,
  },
  responseLink: {
    fontSize: 14,
    fontWeight: '600',
    color: Brand.primary,
    marginTop: 6,
  },
  ownerBox: {
    marginTop: 28,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Brand.border,
    gap: 10,
  },
  ownerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Brand.text,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchText: {
    flex: 1,
    paddingRight: 12,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Brand.text,
  },
  secondaryButton: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    color: Brand.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  deleteLink: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteLinkText: {
    color: Brand.danger,
    fontSize: 15,
    fontWeight: '600',
  },
  confirm: {
    backgroundColor: '#FDECEA',
    borderRadius: 12,
    padding: 14,
  },
  confirmText: {
    fontSize: 15,
    color: Brand.text,
    marginBottom: 12,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  confirmButton: {
    flex: 1,
  },
  dangerButton: {
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: Brand.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerButtonText: {
    color: Brand.white,
    fontSize: 15,
    fontWeight: '700',
  },
  errorText: {
    color: '#C62828',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
});
