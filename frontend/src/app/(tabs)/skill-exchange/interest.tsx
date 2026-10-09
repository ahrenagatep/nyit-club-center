/**
 * "I can help" (requests) / "Request this offer" (offers): /skill-exchange/interest?id=5
 * Pick a time inside the poster's dates (offers: not a booked time), optionally a
 * different place (only if the post's location is flexible or empty) and a message,
 * then confirm. The poster gets a notification and accepts or declines.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { FormField } from '@/components/form-field';
import { MonthCalendar } from '@/components/month-calendar';
import { ScreenHeader } from '@/components/screen-header';
import { authorName } from '@/components/skill-cards';
import { Stepper } from '@/components/slot-picker';
import { Brand } from '@/constants/brand';
import { ApiError, ENGAGEMENT_MESSAGE_MAX, SKILL_LIMITS, engagementsApi, skillApi, type SkillPost } from '@/lib/api';
import { campusTimeToIso, formatDayKey, formatMinutes, freeWindows, lastSelectableKey, slotDays, todayKey, type DayWindow } from '@/lib/skill-dates';
import { useAuth } from '@/state/auth';

const STEP = 30;
const DEFAULT_LENGTH = 60;

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'Your session has expired. Sign out and log in again.';
    return error.message;
  }
  return 'Something went wrong. Please try again.';
}

function openPost(postId: number) {
  router.replace({ pathname: '/skill-exchange/[id]', params: { id: String(postId) } });
}

export default function InterestScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const postId = /^\d+$/.test(id ?? '') ? Number(id) : null;
  const { session } = useAuth();

  const [post, setPost] = useState<SkillPost | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [day, setDay] = useState<string | null>(null);
  const [windowIndex, setWindowIndex] = useState(0);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [location, setLocation] = useState('');
  const [message, setMessage] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session || !postId) {
      if (!postId) setLoadError('Post not found.');
      return;
    }
    skillApi
      .get(session.access_token, postId)
      .then(({ post: loaded }) => {
        setPost(loaded);
        setLocation(loaded.location ?? '');
      })
      .catch((e) => setLoadError(e instanceof ApiError && e.status === 404 ? 'This post was deleted.' : errorMessage(e)));
  }, [session, postId]);

  // free time per day, worked out once per day the calendar asks about
  const cache = useRef(new Map<string, DayWindow[]>());
  const windowsFor = useCallback(
    (key: string) => {
      if (!post) return [];
      if (!cache.current.has(key)) cache.current.set(key, freeWindows(key, post.slots, post.busy));
      return cache.current.get(key) ?? [];
    },
    [post],
  );
  const candidateDays = useMemo(() => new Set(slotDays(post?.slots)), [post]);
  const firstDay = useMemo(() => [...candidateDays].sort().find((key) => windowsFor(key).length > 0) ?? null, [candidateDays, windowsFor]);

  const windows = day ? windowsFor(day) : [];
  const current = windows[windowIndex] ?? null;

  const pickWindow = (w: DayWindow) => {
    setStart(w.start);
    setEnd(Math.min(w.start + DEFAULT_LENGTH, w.end));
  };
  const pickDay = (key: string) => {
    setDay(key);
    setWindowIndex(0);
    setConfirming(false);
    setError(null);
    const first = windowsFor(key)[0];
    if (first) pickWindow(first);
  };

  if (!post || loadError) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Respond to a post" />
        <View style={styles.center}>
          {loadError ? (
            <Text style={styles.errorText} accessibilityRole="alert">
              {loadError}
            </Text>
          ) : (
            <ActivityIndicator size="large" color={Brand.primary} accessibilityLabel="Loading post" />
          )}
        </View>
      </View>
    );
  }

  const poster = authorName(post.author);
  const isRequest = post.kind === 'request';
  const unavailable = post.is_owner
    ? "You can't respond to your own post."
    : post.my_engagement
      ? post.my_engagement.status === 'pending'
        ? "You've already responded to this post. Withdraw it from the post to pick another time."
        : "You're already set up for this post."
      : isRequest && post.status !== 'open'
        ? 'This request is closed.'
        : !isRequest && post.status !== 'available'
          ? "This offer isn't available right now."
          : !firstDay
            ? 'All of the times on this post have passed or are booked.'
            : null;
  const locationLocked = Boolean(post.location) && !post.location_flexible;

  const send = async () => {
    if (!session || !day || !current || sending) return;
    setSending(true);
    setError(null);
    try {
      await engagementsApi.interest(session.access_token, post.post_id, {
        starts_at: campusTimeToIso(day, start),
        ends_at: campusTimeToIso(day, end),
        location: locationLocked ? null : location.trim() || null,
        message: message.trim() || null,
      });
      openPost(post.post_id);
    } catch (e) {
      setError(errorMessage(e));
      setConfirming(false);
      // someone may have booked that time meanwhile: show fresh free times
      if (e instanceof ApiError && e.status === 409) {
        cache.current.clear();
        skillApi.get(session.access_token, post.post_id).then(({ post: fresh }) => setPost(fresh)).catch(() => {});
      }
    } finally {
      setSending(false);
    }
  };

  const review = () => {
    if (!day || !current) {
      setError('Pick a day and time first.');
      return;
    }
    setError(null);
    setConfirming(true);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <ScreenHeader title={isRequest ? 'I can help' : 'Request this offer'} subtitle={post.title} />

        <View style={styles.body}>
          <View style={styles.summary}>
            <Text style={styles.summaryText}>
              {isRequest ? `${poster} needs help with:` : `${poster} is offering:`}
            </Text>
            <Text style={styles.summaryTitle}>{post.title}</Text>
            <Text style={styles.summaryText}>📍 {post.location || 'No location set'}</Text>
          </View>

          {unavailable ? (
            <>
              <Text style={styles.notice} accessibilityRole="alert">
                {unavailable}
              </Text>
              <Pressable
                onPress={() => openPost(post.post_id)}
                style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Back to the post">
                <Text style={styles.secondaryText}>Back to the post</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.label}>{isRequest ? 'When can you help?' : 'When would you like it?'}</Text>
              <Text style={styles.hint}>Days with free time inside {poster}'s dates can be picked.</Text>
              <MonthCalendar
                firstKey={todayKey()}
                lastKey={lastSelectableKey()}
                initialKey={firstDay ?? todayKey()}
                isSelectable={(key) => candidateDays.has(key) && windowsFor(key).length > 0}
                selected={new Set(day ? [day] : [])}
                onPress={pickDay}
              />

              {day && (
                <View style={styles.times}>
                  <Text style={styles.dayTitle} accessibilityRole="header">
                    {formatDayKey(day)}
                  </Text>
                  {windows.length > 1 && (
                    <View style={styles.chipRow}>
                      {windows.map((w, i) => {
                        const active = i === windowIndex;
                        const text = `${formatMinutes(w.start)} – ${w.end === 1440 ? 'Midnight' : formatMinutes(w.end)}`;
                        return (
                          <Pressable
                            key={`${w.start}-${w.end}`}
                            onPress={() => {
                              setWindowIndex(i);
                              pickWindow(w);
                            }}
                            style={[styles.chip, active && styles.chipActive]}
                            accessibilityRole="button"
                            accessibilityState={{ selected: active }}
                            accessibilityLabel={`Free ${text}`}>
                            <Text style={[styles.chipText, active && styles.chipTextActive]}>{text}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                  {current && (
                    <>
                      <Text style={styles.hint}>
                        Free {formatMinutes(current.start)} – {current.end === 1440 ? 'midnight' : formatMinutes(current.end)}
                      </Text>
                      <Stepper
                        label="Start time"
                        value={formatMinutes(start)}
                        canDecrease={start - STEP >= current.start}
                        canIncrease={start + STEP < end}
                        onDecrease={() => setStart(start - STEP)}
                        onIncrease={() => setStart(start + STEP)}
                      />
                      <Stepper
                        label="End time"
                        value={end === 1440 ? 'Midnight' : formatMinutes(end)}
                        canDecrease={end - STEP > start}
                        canIncrease={end + STEP <= current.end}
                        onDecrease={() => setEnd(end - STEP)}
                        onIncrease={() => setEnd(end + STEP)}
                      />
                    </>
                  )}
                </View>
              )}

              {locationLocked ? (
                <Text style={styles.fixedPlace}>📍 Meets at {post.location} (set by {poster})</Text>
              ) : (
                <FormField
                  label="Where (optional)"
                  value={location}
                  onChangeText={setLocation}
                  placeholder={post.location ? post.location : 'Suggest a place, e.g. Library or Zoom'}
                  maxLength={SKILL_LIMITS.location}
                />
              )}

              <FormField
                label="Message to the poster (optional)"
                value={message}
                onChangeText={setMessage}
                placeholder={isRequest ? 'e.g. I took this class last year and got an A' : 'e.g. I need help with chapter 3'}
                multiline
                textAlignVertical="top"
                style={styles.multiline}
                maxLength={ENGAGEMENT_MESSAGE_MAX}
              />
              <Text style={styles.counter} importantForAccessibility="no">
                {message.length}/{ENGAGEMENT_MESSAGE_MAX}
              </Text>

              <Text style={styles.errorText} accessibilityLiveRegion="polite">
                {error ?? ''}
              </Text>

              {confirming && day ? (
                <View style={styles.confirm} accessibilityLiveRegion="polite">
                  <Text style={styles.confirmText}>
                    This will notify {poster} that you {isRequest ? 'can help with their request' : 'would like their offer'}:{' '}
                    {formatDayKey(day)}, {formatMinutes(start)} – {end === 1440 ? 'midnight' : formatMinutes(end)}
                    {message.trim() ? ', with your message' : ''}. Send it?
                  </Text>
                  <View style={styles.confirmButtons}>
                    <Pressable
                      onPress={() => setConfirming(false)}
                      disabled={sending}
                      style={({ pressed }) => [styles.secondary, styles.flex, pressed && styles.pressed]}
                      accessibilityRole="button"
                      accessibilityLabel="Not now">
                      <Text style={styles.secondaryText}>Not now</Text>
                    </Pressable>
                    <Pressable
                      onPress={send}
                      disabled={sending}
                      style={({ pressed }) => [styles.primary, styles.flex, pressed && styles.pressed]}
                      accessibilityRole="button"
                      accessibilityState={{ busy: sending }}
                      accessibilityLabel="Yes, send it">
                      <Text style={styles.primaryText}>{sending ? 'Sending…' : 'Yes, send'}</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Pressable
                  onPress={review}
                  style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel={isRequest ? 'Offer to help' : 'Send request'}>
                  <Text style={styles.primaryText}>{isRequest ? 'Offer to help' : 'Send request'}</Text>
                </Pressable>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  center: {
    padding: 24,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  flex: {
    flex: 1,
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  summary: {
    backgroundColor: Brand.chip,
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
    gap: 4,
  },
  summaryText: {
    fontSize: 14,
    color: Brand.textMuted,
  },
  summaryTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Brand.text,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222222',
    marginBottom: 4,
  },
  hint: {
    fontSize: 13,
    color: Brand.textMuted,
    marginBottom: 8,
  },
  times: {
    marginTop: 14,
    marginBottom: 6,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Brand.text,
    marginBottom: 6,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    backgroundColor: Brand.chip,
    borderRadius: 16,
    paddingHorizontal: 12,
    minHeight: 40,
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: Brand.primary,
  },
  chipText: {
    fontSize: 13,
    color: Brand.chipText,
  },
  chipTextActive: {
    color: Brand.white,
    fontWeight: '600',
  },
  fixedPlace: {
    fontSize: 15,
    color: Brand.text,
    marginVertical: 14,
  },
  multiline: {
    flex: 1,
    minHeight: 80,
    paddingVertical: 14,
    fontSize: 16,
    color: Brand.text,
  },
  counter: {
    alignSelf: 'flex-end',
    fontSize: 12,
    color: Brand.textMuted,
    marginTop: -22,
    marginBottom: 6,
  },
  notice: {
    fontSize: 15,
    color: Brand.text,
    marginBottom: 14,
  },
  errorText: {
    color: '#C62828',
    fontSize: 14,
    minHeight: 18,
    marginBottom: 8,
    textAlign: 'center',
  },
  confirm: {
    backgroundColor: Brand.primaryTint,
    borderRadius: 14,
    padding: 14,
  },
  confirmText: {
    fontSize: 15,
    lineHeight: 21,
    color: Brand.text,
    marginBottom: 12,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  primary: {
    backgroundColor: Brand.primary,
    minHeight: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryText: {
    color: Brand.white,
    fontSize: 16,
    fontWeight: '700',
  },
  secondary: {
    minHeight: 50,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: Brand.white,
  },
  secondaryText: {
    color: Brand.primary,
    fontSize: 15,
    fontWeight: '600',
  },
});
