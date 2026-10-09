/**
 * Comments on a Skill Exchange post. Anyone can comment; the poster can reply to a
 * comment (one level deep). The API sends the notifications: a comment tells the
 * poster, the poster's reply tells the person replied to.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { KudosBadge, authorName, initials } from '@/components/skill-cards';
import { Brand } from '@/constants/brand';
import { ApiError, COMMENT_MAX_LENGTH, skillCommentsApi, type SkillComment, type SkillPost } from '@/lib/api';
import { formatPostDate, timeAgo } from '@/lib/skill-dates';
import { useAuth } from '@/state/auth';

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'Your session has expired. Sign out and log in again.';
    return error.message;
  }
  return 'Something went wrong. Please try again.';
}

function CommentItem({
  comment,
  post,
  isReply,
  canDelete,
  onReply,
  onDelete,
}: {
  comment: SkillComment;
  post: SkillPost;
  isReply: boolean;
  canDelete: boolean;
  onReply?: () => void;
  onDelete: () => Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const byPoster = comment.author.user_id === post.author.user_id;
  const name = authorName(comment.author);

  return (
    <View style={[styles.comment, isReply && styles.reply]}>
      <View style={styles.commentHeader}>
        <View style={[styles.avatar, byPoster && styles.avatarPoster]} importantForAccessibility="no-hide-descendants">
          <Text style={[styles.avatarText, byPoster && styles.avatarTextPoster]}>{initials(comment.author)}</Text>
        </View>
        <View style={styles.commentWho}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {isReply ? '↳ ' : ''}
              {name}
            </Text>
            <KudosBadge count={comment.author.kudos} />
            {byPoster && (
              <View style={styles.posterBadge}>
                <Text style={styles.posterBadgeText}>Poster</Text>
              </View>
            )}
          </View>
          <Text style={styles.email} numberOfLines={1}>
            {comment.author.nyit_email}
          </Text>
        </View>
        <Text style={styles.time} accessibilityLabel={`Posted ${formatPostDate(comment.created_at)}`}>
          {timeAgo(comment.created_at)}
        </Text>
      </View>

      <Text style={styles.body}>{comment.body}</Text>

      {confirming ? (
        <View style={styles.confirm} accessibilityLiveRegion="polite">
          <Text style={styles.confirmText}>Delete this comment{isReply ? '' : ' and its replies'}?</Text>
          <View style={styles.confirmButtons}>
            <Pressable
              onPress={() => setConfirming(false)}
              disabled={deleting}
              style={({ pressed }) => [styles.smallButton, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Keep comment">
              <Text style={styles.smallButtonText}>Keep</Text>
            </Pressable>
            <Pressable
              onPress={async () => {
                setDeleting(true);
                await onDelete();
                setDeleting(false);
                setConfirming(false);
              }}
              disabled={deleting}
              style={({ pressed }) => [styles.smallButton, styles.smallDanger, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Yes, delete comment">
              <Text style={styles.smallDangerText}>{deleting ? 'Deleting…' : 'Delete'}</Text>
            </Pressable>
          </View>
        </View>
      ) : (onReply || canDelete) && (
        <View style={styles.actions}>
          {onReply && (
            <Pressable
              onPress={onReply}
              style={({ pressed }) => [styles.action, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={`Reply to ${name}`}>
              <Text style={styles.actionText}>↩ Reply</Text>
            </Pressable>
          )}
          {canDelete && (
            <Pressable
              onPress={() => setConfirming(true)}
              style={({ pressed }) => [styles.action, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={`Delete comment by ${name}`}>
              <Text style={styles.deleteText}>Delete</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

export function SkillComments({
  post,
  refreshKey,
  onCountChange,
  onLoaded,
}: {
  post: SkillPost;
  /** Change it to reload (e.g. pull to refresh on the post). */
  refreshKey: number;
  onCountChange: (count: number) => void;
  /** Called once the comments have rendered (the post screen scrolls to them). */
  onLoaded?: () => void;
}) {
  const { session, user } = useAuth();
  const [comments, setComments] = useState<SkillComment[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [replyTo, setReplyTo] = useState<SkillComment | null>(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);
  const onLoadedRef = useRef(onLoaded);
  onLoadedRef.current = onLoaded;

  const load = useCallback(async () => {
    if (!session) return;
    try {
      const result = await skillCommentsApi.list(session.access_token, post.post_id);
      setComments(result.comments);
      setLoadError(null);
      onCountChange(result.comments.length);
    } catch (error) {
      setLoadError(errorMessage(error));
    }
  }, [session, post.post_id, onCountChange]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  useEffect(() => {
    if (comments) onLoadedRef.current?.();
  }, [comments]);

  const send = async () => {
    const body = draft.trim();
    if (!session || sending) return;
    if (!body) {
      setSendError('Write a comment first.');
      return;
    }
    setSending(true);
    setSendError(null);
    try {
      await skillCommentsApi.add(session.access_token, post.post_id, body, replyTo?.comment_id);
      setDraft('');
      setReplyTo(null);
      await load();
    } catch (error) {
      setSendError(errorMessage(error));
    } finally {
      setSending(false);
    }
  };

  const remove = async (comment: SkillComment) => {
    if (!session) return;
    try {
      await skillCommentsApi.remove(session.access_token, comment.comment_id);
      if (replyTo && (replyTo.comment_id === comment.comment_id)) setReplyTo(null);
      await load();
    } catch (error) {
      setSendError(errorMessage(error));
    }
  };

  const startReply = (comment: SkillComment) => {
    setReplyTo(comment);
    setSendError(null);
    inputRef.current?.focus();
  };

  const isAdmin = user?.role === 'admin';
  const topLevel = (comments ?? []).filter((c) => c.parent_comment_id === null);
  const repliesTo = (id: number) => (comments ?? []).filter((c) => c.parent_comment_id === id);

  const hint = replyTo
    ? `${authorName(replyTo.author)} will be notified of your reply.`
    : post.is_owner
      ? "Your own comments don't notify anyone. Use Reply to answer someone."
      : 'The poster will be notified of your comment.';

  return (
    <View>
      <Text style={styles.heading} accessibilityRole="header">
        Comments{comments ? ` (${comments.length})` : ''}
      </Text>

      {comments === null && !loadError ? (
        <ActivityIndicator color={Brand.primary} style={styles.spinner} accessibilityLabel="Loading comments" />
      ) : loadError ? (
        <View style={styles.loadError}>
          <Text style={styles.errorText} accessibilityRole="alert">
            {loadError}
          </Text>
          <Pressable
            onPress={load}
            style={({ pressed }) => [styles.smallButton, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Try loading comments again">
            <Text style={styles.smallButtonText}>Try again</Text>
          </Pressable>
        </View>
      ) : topLevel.length === 0 ? (
        <Text style={styles.empty}>No comments yet. Ask a question or say you can help.</Text>
      ) : (
        topLevel.map((comment) => (
          <View key={comment.comment_id}>
            <CommentItem
              comment={comment}
              post={post}
              isReply={false}
              canDelete={comment.is_mine || isAdmin}
              onReply={post.is_owner && !comment.is_mine ? () => startReply(comment) : undefined}
              onDelete={() => remove(comment)}
            />
            {repliesTo(comment.comment_id).map((reply) => (
              <CommentItem
                key={reply.comment_id}
                comment={reply}
                post={post}
                isReply
                canDelete={reply.is_mine || isAdmin}
                onDelete={() => remove(reply)}
              />
            ))}
          </View>
        ))
      )}

      <View style={styles.composer}>
        {replyTo && (
          <View style={styles.replyBanner}>
            <Text style={styles.replyBannerText} numberOfLines={1}>
              Replying to {authorName(replyTo.author)}
            </Text>
            <Pressable
              onPress={() => setReplyTo(null)}
              style={({ pressed }) => [styles.action, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Cancel reply">
              <Text style={styles.actionText}>Cancel</Text>
            </Pressable>
          </View>
        )}
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={draft}
          onChangeText={(text) => {
            setDraft(text);
            setSendError(null);
          }}
          placeholder={replyTo ? `Reply to ${authorName(replyTo.author)}…` : 'Write a comment…'}
          placeholderTextColor={Brand.textMuted}
          multiline
          textAlignVertical="top"
          maxLength={COMMENT_MAX_LENGTH}
          accessibilityLabel={replyTo ? `Your reply to ${authorName(replyTo.author)}` : 'Write a comment'}
        />
        <View style={styles.composerFooter}>
          <Text style={styles.hint}>{hint}</Text>
          <Text style={styles.counter} importantForAccessibility="no">
            {draft.length}/{COMMENT_MAX_LENGTH}
          </Text>
        </View>
        <Text style={styles.errorText} accessibilityLiveRegion="polite">
          {sendError ?? ''}
        </Text>
        <Pressable
          onPress={send}
          disabled={sending}
          style={({ pressed }) => [styles.send, sending && styles.sendBusy, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityState={{ busy: sending }}
          accessibilityLabel={replyTo ? 'Post reply' : 'Post comment'}>
          <Text style={styles.sendText}>{sending ? 'Posting…' : replyTo ? 'Post reply' : 'Post comment'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.7,
  },
  heading: {
    fontSize: 18,
    fontWeight: '700',
    color: Brand.text,
    marginTop: 28,
    marginBottom: 10,
  },
  spinner: {
    marginVertical: 16,
  },
  empty: {
    fontSize: 14,
    color: Brand.textMuted,
    marginBottom: 8,
  },
  loadError: {
    alignItems: 'center',
    marginBottom: 8,
  },
  comment: {
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  reply: {
    marginLeft: 24,
    backgroundColor: '#F7F9FC',
    borderColor: '#DCE5F2',
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Brand.chip,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarPoster: {
    backgroundColor: Brand.primaryTint,
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: Brand.text,
  },
  avatarTextPoster: {
    color: Brand.primary,
  },
  commentWho: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: Brand.text,
    flexShrink: 1,
  },
  posterBadge: {
    backgroundColor: Brand.primaryTint,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  posterBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Brand.primary,
  },
  email: {
    fontSize: 12,
    color: Brand.textMuted,
    marginTop: 1,
  },
  time: {
    fontSize: 12,
    color: Brand.textMuted,
    marginLeft: 6,
  },
  body: {
    fontSize: 15,
    lineHeight: 21,
    color: '#3F4350',
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 2,
  },
  action: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Brand.primary,
  },
  deleteText: {
    fontSize: 14,
    fontWeight: '600',
    color: Brand.danger,
  },
  confirm: {
    backgroundColor: '#FDECEA',
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
  },
  confirmText: {
    fontSize: 14,
    color: Brand.text,
    marginBottom: 8,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  smallButton: {
    minHeight: 44,
    minWidth: 80,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.white,
  },
  smallButtonText: {
    color: Brand.primary,
    fontWeight: '600',
  },
  smallDanger: {
    backgroundColor: Brand.danger,
    borderColor: Brand.danger,
  },
  smallDangerText: {
    color: Brand.white,
    fontWeight: '700',
  },
  composer: {
    marginTop: 8,
  },
  replyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Brand.primaryTint,
    borderRadius: 10,
    paddingLeft: 12,
    marginBottom: 8,
  },
  replyBannerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Brand.primary,
  },
  input: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: '#D6D8DD',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: Brand.text,
  },
  composerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    gap: 8,
  },
  hint: {
    flex: 1,
    fontSize: 12,
    color: Brand.textMuted,
  },
  counter: {
    fontSize: 12,
    color: Brand.textMuted,
  },
  errorText: {
    color: '#C62828',
    fontSize: 14,
    minHeight: 18,
    marginTop: 4,
    marginBottom: 4,
    textAlign: 'center',
  },
  send: {
    backgroundColor: Brand.primary,
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBusy: {
    opacity: 0.7,
  },
  sendText: {
    color: Brand.white,
    fontSize: 15,
    fontWeight: '700',
  },
});
