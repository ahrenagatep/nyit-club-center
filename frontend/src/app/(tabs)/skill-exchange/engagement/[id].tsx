/**
 * One response to a post (/skill-exchange/engagement/7), opened from a notification or the post.
 * Poster + pending: accept or decline (optional message; a decline without one is silent).
 * Responder + pending: withdraw. Accepted: both see each other's contact details and
 * either can cancel (optional message; the other person is told); the poster marks it
 * complete (requests: optionally with Kudos for the helper; offers: asks for Kudos).
 * Completed: whoever was helped can give Kudos once.
 */
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';

import { FormField } from '@/components/form-field';
import { ScreenHeader } from '@/components/screen-header';
import { ENGAGEMENT_STATUS, KudosBadge, authorName, backToOrigin, initials } from '@/components/skill-cards';
import { Brand } from '@/constants/brand';
import { ApiError, ENGAGEMENT_MESSAGE_MAX, engagementsApi, type SkillAuthor, type SkillEngagement } from '@/lib/api';
import { formatPostDate, formatSlot, timeAgo } from '@/lib/skill-dates';
import { useAuth } from '@/state/auth';

type Action = 'accept' | 'decline' | 'cancel' | 'complete' | 'kudos';


function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'Your session has expired. Sign out and log in again.';
    return error.message;
  }
  return 'Something went wrong. Please try again.';
}

function PersonCard({ person, role, showContact }: { person: SkillAuthor; role: string; showContact: boolean }) {
  return (
    <View style={styles.person}>
      <View style={styles.avatar} importantForAccessibility="no-hide-descendants">
        <Text style={styles.avatarText}>{initials(person)}</Text>
      </View>
      <View style={styles.personText}>
        <Text style={styles.personRole}>{role}</Text>
        <View style={styles.nameRow}>
          <Text style={styles.personName}>{authorName(person)}</Text>
          <KudosBadge count={person.kudos} />
        </View>
        {showContact && (
          <Text style={styles.contact} selectable accessibilityLabel={`Email ${person.nyit_email}`}>
            ✉️ {person.nyit_email}
          </Text>
        )}
      </View>
    </View>
  );
}

export default function EngagementScreen() {
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();
  const engagementId = /^\d+$/.test(id ?? '') ? Number(id) : null;
  const { session } = useAuth();

  const [engagement, setEngagement] = useState<SkillEngagement | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [note, setNote] = useState('');
  const [confirming, setConfirming] = useState<Action | null>(null);
  const [busy, setBusy] = useState(false);
  const [awardKudos, setAwardKudos] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session || !engagementId) {
      if (!engagementId) setLoadError('Not found.');
      return;
    }
    try {
      const { engagement: loaded } = await engagementsApi.get(session.access_token, engagementId);
      setEngagement(loaded);
      setLoadError(null);
    } catch (e) {
      setLoadError(e instanceof ApiError && e.status === 404 ? 'This was removed (the post may have been deleted).' : errorMessage(e));
    } finally {
      setRefreshing(false);
    }
  }, [session, engagementId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const act = async (action: Action) => {
    if (!session || !engagement || busy) return;
    setBusy(true);
    setError(null);
    try {
      const token = session.access_token;
      const id = engagement.engagement_id;
      const { engagement: saved } =
        action === 'complete'
          ? await engagementsApi.complete(token, id, engagement.post.kind === 'request' ? awardKudos : undefined)
          : action === 'kudos'
            ? await engagementsApi.kudos(token, id)
            : await { accept: engagementsApi.accept, decline: engagementsApi.decline, cancel: engagementsApi.cancel }[action](token, id, note.trim() || null);
      setEngagement(saved);
      setNote('');
      setConfirming(null);
    } catch (e) {
      setError(errorMessage(e));
      setConfirming(null);
      load();
    } finally {
      setBusy(false);
    }
  };

  if (!engagement) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Skill Exchange" onBack={backToOrigin(from)} />
        <View style={styles.center}>
          {loadError ? (
            <Text style={styles.errorText} accessibilityRole="alert">
              {loadError}
            </Text>
          ) : (
            <ActivityIndicator size="large" color={Brand.primary} accessibilityLabel="Loading" />
          )}
        </View>
      </View>
    );
  }

  const e = engagement;
  const isRequest = e.post.kind === 'request';
  const poster = e.post.author;
  const responder = e.user;
  const other = e.is_poster ? responder : poster;
  const otherName = authorName(other);
  const status = ENGAGEMENT_STATUS[e.status];
  const accepted = e.status === 'accepted';
  const pending = e.status === 'pending';
  const completed = e.status === 'completed';
  // Kudos goes to whoever helped: on a request the responder, on an offer the poster
  const iGiveKudos = isRequest ? e.is_poster : e.is_requester;
  const kudosReceiver = isRequest ? responder : poster;
  const heading = e.is_poster
    ? isRequest
      ? `${authorName(responder)} can help`
      : `${authorName(responder)} would like your offer`
    : isRequest
      ? 'Your offer to help'
      : 'Your request for this offer';

  // what the confirm panel says for each action
  const confirmText: Record<Action, string> = {
    accept: `Accept ${authorName(responder)} for ${formatSlot(e)}? You'll both get each other's contact details${
      isRequest ? ', and the request will close to other helpers' : ''
    }.`,
    decline: note.trim()
      ? `Decline? ${authorName(responder)} will get your message.`
      : `Decline? ${authorName(responder)} won't be told unless you write a message.`,
    cancel: pending
      ? "Withdraw your response? The poster won't be notified."
      : `Cancel this agreement? ${otherName} will be notified${note.trim() ? ' with your message' : ''}.`,
    complete: isRequest
      ? `Mark this request complete? It leaves the Requests list${awardKudos ? `, and ${authorName(responder)} gets Kudos ⭐` : ''}.`
      : `Mark this complete? ${authorName(responder)} will be asked to give you Kudos.`,
    kudos: `Give ${authorName(kudosReceiver)} Kudos ⭐? It counts toward the requests and offers they've fulfilled.`,
  };
  const yesLabel: Record<Action, string> = {
    accept: 'Yes, accept',
    decline: 'Yes, decline',
    cancel: pending ? 'Yes, withdraw' : 'Yes, cancel',
    complete: 'Yes, mark complete',
    kudos: 'Yes, give Kudos',
  };
  const positive = confirming === 'accept' || confirming === 'complete' || confirming === 'kudos';

  const noteField = (label: string) => (
    <>
      <FormField
        label={label}
        value={note}
        onChangeText={setNote}
        multiline
        textAlignVertical="top"
        style={styles.multiline}
        maxLength={ENGAGEMENT_MESSAGE_MAX}
      />
      <Text style={styles.counter} importantForAccessibility="no">
        {note.length}/{ENGAGEMENT_MESSAGE_MAX}
      </Text>
    </>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
        />
      }>
      <ScreenHeader title={heading} subtitle={isRequest ? 'Request' : 'Offer'} onBack={backToOrigin(from)} />

      <View style={styles.body}>
        <View style={[styles.status, { backgroundColor: status.bg }]}>
          <Text style={[styles.statusText, { color: status.fg }]}>{status.label}</Text>
        </View>

        <Pressable
          onPress={() => router.push({ pathname: '/skill-exchange/[id]', params: { id: String(e.post_id) } })}
          style={({ pressed }) => [styles.postLink, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`Open post ${e.post.title}`}>
          <Text style={styles.postTitle}>{e.post.title}</Text>
          <Text style={styles.chevron} importantForAccessibility="no">
            ›
          </Text>
        </Pressable>

        <View style={styles.details}>
          <Text style={styles.detail}>🗓 {formatSlot(e)}</Text>
          <Text style={styles.detail}>📍 {e.location || 'No place set yet'}</Text>
          <Text style={styles.meta}>
            Sent {timeAgo(e.created_at)} ({formatPostDate(e.created_at)})
          </Text>
        </View>

        {accepted || completed ? (
          <View style={styles.contactBox}>
            <Text style={styles.sectionTitle} accessibilityRole="header">
              Contact
            </Text>
            <PersonCard person={other} role={e.is_poster ? (isRequest ? 'Helper' : 'Requested by') : 'Poster'} showContact />
            {accepted && (
              <Text style={styles.meta}>
                Use email to sort out the details. When it's done, {e.is_poster ? 'mark it complete below' : `${authorName(poster)} marks it complete`}.
              </Text>
            )}
          </View>
        ) : (
          <PersonCard person={e.is_poster ? responder : poster} role={e.is_poster ? 'From' : 'Poster'} showContact={false} />
        )}

        {e.message ? (
          <View style={styles.quote}>
            <Text style={styles.quoteLabel}>{e.is_requester ? 'Your message' : `${authorName(responder)} wrote`}</Text>
            <Text style={styles.quoteText}>{e.message}</Text>
          </View>
        ) : null}
        {e.response_message ? (
          <View style={styles.quote}>
            <Text style={styles.quoteLabel}>{e.is_poster ? 'Your reply' : `${authorName(poster)} wrote`}</Text>
            <Text style={styles.quoteText}>{e.response_message}</Text>
          </View>
        ) : null}
        {e.status === 'cancelled' && (
          <Text style={styles.notice}>
            {e.cancelled_by === responder.user_id
              ? `${e.is_requester ? 'You' : authorName(responder)} cancelled this.`
              : `${e.is_poster ? 'You' : authorName(poster)} cancelled this.`}
            {e.cancel_message ? ` Message: "${e.cancel_message}"` : ''}
          </Text>
        )}
        {e.status === 'declined' && !e.is_poster && !e.response_message && (
          <Text style={styles.notice}>This response is closed.</Text>
        )}

        {/* actions */}
        {e.is_poster && pending && (
          <View style={styles.actions}>
            {noteField('Message to them (optional)')}
            {confirming === 'accept' || confirming === 'decline' ? null : (
              <View style={styles.buttonRow}>
                <Pressable
                  onPress={() => setConfirming('decline')}
                  style={({ pressed }) => [styles.secondary, styles.flex, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Decline">
                  <Text style={styles.secondaryText}>Decline</Text>
                </Pressable>
                <Pressable
                  onPress={() => setConfirming('accept')}
                  style={({ pressed }) => [styles.primary, styles.flex, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Accept">
                  <Text style={styles.primaryText}>Accept</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}

        {e.is_requester && pending && confirming !== 'cancel' && (
          <View style={styles.actions}>
            <Text style={styles.notice}>Waiting for {authorName(poster)} to accept or decline.</Text>
            <Pressable
              onPress={() => setConfirming('cancel')}
              style={({ pressed }) => [styles.dangerLink, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Withdraw my response">
              <Text style={styles.dangerLinkText}>Withdraw my response</Text>
            </Pressable>
          </View>
        )}

        {accepted && e.is_poster && confirming !== 'complete' && (
          <View style={styles.completeBox}>
            <Text style={styles.sectionTitle} accessibilityRole="header">
              Done?
            </Text>
            {isRequest && (
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel} nativeID="kudos-label">
                  Give {authorName(responder)} Kudos ⭐
                </Text>
                <Switch
                  value={awardKudos}
                  onValueChange={setAwardKudos}
                  trackColor={{ true: Brand.primary, false: '#C9CBD1' }}
                  thumbColor={Brand.white}
                  accessibilityLabel={`Give ${authorName(responder)} Kudos`}
                  accessibilityLabelledBy="kudos-label"
                />
              </View>
            )}
            <Pressable
              onPress={() => setConfirming('complete')}
              style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={isRequest ? 'Mark complete' : 'Mark complete and ask for Kudos'}>
              <Text style={styles.primaryText}>{isRequest ? '✓ Mark complete' : '✓ Mark complete & ask for Kudos'}</Text>
            </Pressable>
          </View>
        )}

        {completed && (
          <View style={styles.kudosBox}>
            {e.kudos_given ? (
              <Text style={styles.kudosText}>
                ⭐{' '}
                {iGiveKudos
                  ? `You gave ${authorName(kudosReceiver)} Kudos.`
                  : e.is_poster || e.is_requester
                    ? `${otherName} gave you Kudos.`
                    : 'Kudos given.'}
              </Text>
            ) : iGiveKudos ? (
              confirming !== 'kudos' && (
                <>
                  <Text style={styles.kudosText}>
                    {isRequest ? 'Marked complete.' : `${authorName(poster)} marked this complete and asks for Kudos.`} Did {authorName(kudosReceiver)} help?
                  </Text>
                  <Pressable
                    onPress={() => setConfirming('kudos')}
                    style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel={`Give ${authorName(kudosReceiver)} Kudos`}>
                    <Text style={styles.primaryText}>⭐ Give {authorName(kudosReceiver)} Kudos</Text>
                  </Pressable>
                </>
              )
            ) : (
              <Text style={styles.kudosText}>
                {isRequest ? `${authorName(poster)} marked this complete. Thanks for helping!` : `Marked complete. Waiting for ${authorName(responder)} to give Kudos.`}
              </Text>
            )}
          </View>
        )}

        {accepted && (
          <View style={styles.actions}>
            {noteField(`Message to ${otherName} if you cancel (optional)`)}
            {confirming !== 'cancel' && (
              <Pressable
                onPress={() => setConfirming('cancel')}
                style={({ pressed }) => [styles.dangerLink, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Cancel this agreement">
                <Text style={styles.dangerLinkText}>Cancel this agreement</Text>
              </Pressable>
            )}
          </View>
        )}

        {confirming && (
          <View style={[styles.confirm, positive ? styles.confirmGood : styles.confirmBad]} accessibilityLiveRegion="polite">
            <Text style={styles.confirmText}>{confirmText[confirming]}</Text>
            <View style={styles.buttonRow}>
              <Pressable
                onPress={() => setConfirming(null)}
                disabled={busy}
                style={({ pressed }) => [styles.secondary, styles.flex, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Not now">
                <Text style={styles.secondaryText}>Not now</Text>
              </Pressable>
              <Pressable
                onPress={() => act(confirming)}
                disabled={busy}
                style={({ pressed }) => [positive ? styles.primary : styles.danger, styles.flex, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityState={{ busy }}
                accessibilityLabel={yesLabel[confirming]}>
                <Text style={styles.primaryText}>{busy ? 'Saving…' : yesLabel[confirming]}</Text>
              </Pressable>
            </View>
          </View>
        )}

        <Text style={styles.errorText} accessibilityLiveRegion="polite">
          {error ?? ''}
        </Text>
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
  status: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  postLink: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    marginTop: 10,
  },
  postTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: Brand.text,
  },
  chevron: {
    fontSize: 28,
    color: Brand.textMuted,
    marginLeft: 8,
  },
  details: {
    marginTop: 8,
    marginBottom: 16,
    gap: 4,
  },
  detail: {
    fontSize: 16,
    color: Brand.text,
  },
  meta: {
    fontSize: 13,
    color: Brand.textMuted,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Brand.text,
    marginBottom: 8,
  },
  contactBox: {
    borderWidth: 1,
    borderColor: '#BFE6CF',
    backgroundColor: '#F2FBF6',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  person: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
    fontWeight: '700',
    fontSize: 16,
  },
  personText: {
    flex: 1,
  },
  personRole: {
    fontSize: 12,
    color: Brand.textMuted,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  personName: {
    fontSize: 16,
    fontWeight: '600',
    color: Brand.text,
  },
  contact: {
    fontSize: 15,
    color: Brand.primary,
    marginTop: 4,
  },
  quote: {
    borderLeftWidth: 3,
    borderLeftColor: Brand.primary,
    paddingLeft: 12,
    marginBottom: 12,
  },
  quoteLabel: {
    fontSize: 12,
    color: Brand.textMuted,
    marginBottom: 2,
  },
  quoteText: {
    fontSize: 15,
    lineHeight: 21,
    color: '#3F4350',
  },
  notice: {
    fontSize: 15,
    color: Brand.text,
    marginBottom: 10,
  },
  actions: {
    marginTop: 12,
  },
  completeBox: {
    borderWidth: 1,
    borderColor: '#C9DAF3',
    backgroundColor: '#F3F7FD',
    borderRadius: 16,
    padding: 14,
    marginTop: 4,
    marginBottom: 6,
    gap: 8,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  switchLabel: {
    flex: 1,
    fontSize: 15,
    color: Brand.text,
    paddingRight: 12,
  },
  kudosBox: {
    backgroundColor: '#FFF8E1',
    borderRadius: 16,
    padding: 14,
    marginTop: 4,
    gap: 10,
  },
  kudosText: {
    fontSize: 15,
    lineHeight: 21,
    color: Brand.text,
  },
  multiline: {
    flex: 1,
    minHeight: 70,
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
  buttonRow: {
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
  danger: {
    backgroundColor: Brand.danger,
    minHeight: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  dangerLink: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerLinkText: {
    color: Brand.danger,
    fontSize: 15,
    fontWeight: '600',
  },
  confirm: {
    borderRadius: 14,
    padding: 14,
    marginTop: 8,
  },
  confirmGood: {
    backgroundColor: Brand.primaryTint,
  },
  confirmBad: {
    backgroundColor: '#FDECEA',
  },
  confirmText: {
    fontSize: 15,
    lineHeight: 21,
    color: Brand.text,
    marginBottom: 12,
  },
  errorText: {
    color: '#C62828',
    fontSize: 14,
    minHeight: 18,
    marginTop: 8,
    textAlign: 'center',
  },
});
