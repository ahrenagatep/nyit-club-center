// DM screen: 1-on-1 chat w/ another student.
// open it like /dm-chat?userId=5&name=Jane%20Doe (for now the "Message" button on a Skill Exchange agreement does this).
// first pass: no sockets yet, we just ask the server for the convo every few secs (polling).
//
// how it all connects:
//   this screen -> directMessagesApi (lib/api.ts) -> apiRequest() does the actual fetch
//   -> Express: routes/directMessages.js -> controllers/directMessagesController.js -> direct_messages table
// being in app/ is what makes it a screen. expo-router turns app/dm-chat.tsx into the /dm-chat route.

import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';

import { ScreenHeader } from '@/components/screen-header';
import type { ThemeColors } from '@/constants/theme';
import { ApiError, DM_MAX_LENGTH, directMessagesApi, type DirectMessage } from '@/lib/api';
import { useAuth } from '@/state/auth';
import { useTheme, useThemedStyles } from '@/state/theme';

const POLL_MS = 5000; // how often we check for new msgs while the chat's open.
// (helpers live outside the component so they get made once, not every redraw.)

// turn whatever the api threw into something a person can actually read.
// error type is "unknown." JS you can throw literally anything, have to check it first.
function errorMessage(error: unknown): string {
  // ApiError = what apiRequest() throws. has .status (0 = never even reached the server) + .message.
  if (error instanceof ApiError) {
    if (error.status === 401) return 'Your session has expired. Sign out and log in again.'; // token expired, no refresh yet.
    return error.message; // the server's own msg, e.g. "content must be 2000 characters or less".
  }
  return 'Something went wrong. Please try again.';
}

// "3:42 PM" if it was today, otherwise "Oct 12, 3:42 PM".
// sent_at comes from Postgres as an ISO string ("2026-10-30T14:12:03.512Z"), new Date() turns it back into a date.
function formatTime(iso: string): string {
  const sent = new Date(iso);
  // no timeZone option = uses whatever the phone's set to, like Discord.
  // (Skill Exchange forces campus time on purpose, chat doesn't need that.)
  const time = sent.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  // toDateString() = just the day ("Fri Oct 30 2026"), so matching strings = same day.
  if (sent.toDateString() === new Date().toDateString()) return time;
  return `${sent.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${time}`;
}

// merging instead of replacing, safe since nothing can get deleted yet.
// the race: 1. poll starts  2. I hit Send, it finishes first, my msg is in the list
//   3. slow poll lands w/ the OLD list -> if I replaced, my msg would blink out. merge only adds, so it can't.
function mergeMessages(current: DirectMessage[], incoming: DirectMessage[]): DirectMessage[] {
  // Set = quick "seen this?" lookup. .has() beats searching the whole array every time.
  const seen = new Set(current.map((m) => m.message_id));
  const fresh = incoming.filter((m) => !seen.has(m.message_id));
  // React only redraws if state is a different object (===).
  // same array back when nothing's new = a quiet poll costs zero redraws.
  if (fresh.length === 0) return current;
  // [...a, ...b] = brand new array. React needs a new one to notice the change, never push() into state.
  // ids come from an identity column so they only go up -> sort by id = send order.
  return [...current, ...fresh].sort((a, b) => a.message_id - b.message_id);
}

export default function DmChatScreen() {
  // React reruns this whole function every time something changes (a redraw),
  // so anything that has to survive between redraws goes in a hook (useState, useRef, ...).
  const styles = useThemedStyles(createStyles); // styles built from the current light/dark colors.
  const { colors } = useTheme(); // raw colors for the few props that want a color, not a style.
  const { session, user } = useAuth(); // session.access_token = the login token protected routes need.

  // route params always show up as strings (or missing), so check before making it a number.
  const { userId, name } = useLocalSearchParams<{ userId?: string; name?: string }>();
  // /^\d+$/ = "only digits, start to end." "7" passes, "abc" / "7x" / "" don't.
  // userId ?? '' swaps in '' when it's missing so .test() never gets undefined.
  const otherId = /^\d+$/.test(userId ?? '') ? Number(userId) : null;
  const otherName = name?.trim() || 'Direct Message'; // ?. skips trim() if name's missing, || covers empty.
  const myId = Number(user?.user_id); // pg hands BIGINT back as a string sometimes, Number() evens it out.
  // msg ids come back as real numbers (the SQL casts ::int), my user_id doesn't.
  // "5" === 5 is false in JS -> w/o Number() none of my msgs would count as mine.
  const isMe = otherId !== null && otherId === myId;

  // useState = value React remembers between redraws. calling the setter redraws the screen.
  const [messages, setMessages] = useState<DirectMessage[]>([]); // the convo, oldest first.
  const [loading, setLoading] = useState(true); // true until the first load finishes (spinner).
  const [loadError, setLoadError] = useState<string | null>(null);
  const [draft, setDraft] = useState(''); // whatever's typed in the box right now.
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  // useRef = also remembered between redraws, but changing it does NOT redraw.
  // good for stuff the screen doesn't show, + grabbing a component to call its methods.
  const listRef = useRef<FlatList<DirectMessage>>(null); // filled in by ref={listRef} on the FlatList below.
  const inFlight = useRef(false); // stops a slow request stacking up w/ the next poll.
  // has to be a ref, not state. state waits for the next redraw, refs update instantly,
  // so 2 polls back to back can't both think nothing's running.

  // load = grab the whole convo from the server, add anything new.
  // useCallback keeps it the SAME fn until session/otherId/isMe change.
  // matters b/c useFocusEffect restarts the timer whenever load changes -> w/o this it'd reset every redraw.
  const load = useCallback(async () => {
    // guard clause: bail early if we can't (no login, bad link) or shouldn't (already loading).
    if (!session || otherId === null || isMe || inFlight.current) return;
    inFlight.current = true;
    try {
      // await pauses just this fn until the server answers, the app keeps running.
      // { messages: latest } = pull .messages out of the response, call it latest.
      const { messages: latest } = await directMessagesApi.conversation(session.access_token, otherId);
      // setter w/ a fn = "update whatever the newest value is."
      // safer than setMessages(mergeMessages(messages, latest)) b/c `messages` in here could be stale
      // by the time the request comes back (this fn remembers the value from when it was made).
      setMessages((current) => mergeMessages(current, latest));
      setLoadError(null);
    } catch (e) {
      setLoadError(errorMessage(e)); // old msgs stay on screen, just add the error line.
    } finally {
      // finally runs whether it worked or blew up, so the lock always gets released.
      inFlight.current = false;
      setLoading(false);
    }
  }, [session, otherId, isMe]); // deps: only make a new load when one of these changes.

  // useFocusEffect runs when the screen comes into view, the fn it returns runs when we leave.
  // -> polling only happens while you're actually looking at the chat.
  // (plain useEffect would keep polling w/ another screen on top, since this one stays mounted.)
  useFocusEffect(
    // expo-router wants this wrapped in useCallback, otherwise it reruns every redraw.
    useCallback(() => {
      load(); // load once right away so we don't wait 5s for the first msgs.
      const timer = setInterval(load, POLL_MS); // then every 5s. setInterval hands back an id.
      return () => clearInterval(timer); // cleanup: stop the timer when the screen loses focus.
    }, [load]),
  );

  const send = async () => {
    const text = draft.trim(); // trim = cut spaces/new lines off both ends, so "   " -> "" and can't send.
    if (!session || otherId === null || !text || sending) return; // `sending` check = no double sends from double taps.
    setSending(true);
    setSendError(null);
    try {
      // server sends back the saved row, w/ the real message_id + sent_at from the db.
      const sent = await directMessagesApi.send(session.access_token, otherId, text);
      setMessages((current) => mergeMessages(current, [sent])); // show it now instead of waiting for the next poll.
      // (through mergeMessages so when the next poll brings it back, it doesn't double up.)
      setDraft(''); // box shows `draft`, so emptying draft empties the box.
    } catch (e) {
      setSendError(errorMessage(e)); // text stays in the box so they can fix it + try again.
    } finally {
      setSending(false);
    }
  };

  // web only: Enter sends, Shift+Enter = new line. (on phones return just adds a line.)
  const onKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    // RN's type doesn't know about shiftKey, but the browser's key event has it on web.
    // the "as ... & { shiftKey?: boolean }" = telling TypeScript "trust me, it might be there."
    const event = e.nativeEvent as TextInputKeyPressEventData & { shiftKey?: boolean };
    if (Platform.OS === 'web' && event.key === 'Enter' && !event.shiftKey) {
      e.preventDefault(); // stops the browser from also typing the new line into the box.
      send();
    }
  };

  // worked out fresh every redraw from draft/sending, so they don't need their own state.
  const canSend = draft.trim().length > 0 && !sending;
  const charsLeft = DM_MAX_LENGTH - draft.length;

  // bad link (no userId, or it's you): nothing to load, just say so.
  // React rule I keep forgetting: hooks have to run in the same order every redraw.
  // so this early return goes AFTER all the useState/useRef/useCallback/useFocusEffect calls.
  if (otherId === null || isMe) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Direct Message" />
        <View style={styles.center}>
          {/* role "alert" = screen readers announce it as soon as it shows up. */}
          <Text style={styles.errorText} accessibilityRole="alert">
            {isMe ? "You can't message yourself." : "Couldn't open this chat."}
          </Text>
        </View>
      </View>
    );
  }

  // how to draw ONE msg. FlatList calls this for each one it's about to show, hands it { item }.
  const renderMessage = ({ item }: { item: DirectMessage }) => {
    const mine = item.sender_id === myId; // both numbers thanks to the Number() up top.
    const sender = mine ? 'You' : otherName;
    const initial = (mine ? user?.first_name : otherName)?.charAt(0).toUpperCase() || '?';
    const time = formatTime(item.sent_at);
    return (
      // accessible = screen readers read the whole row as one thing,
      // instead of avatar letter / name / time / text as 4 separate stops.
      <View style={styles.message} accessible accessibilityLabel={`${sender}, ${time}: ${item.content}`}>
        {/* style arrays: later ones win, `false` gets ignored. -> "avatar, + avatarMine if it's mine." */}
        <View style={[styles.avatar, mine && styles.avatarMine]}>
          <Text style={[styles.avatarText, mine && styles.avatarTextMine]}>{initial}</Text>
        </View>
        <View style={styles.messageBody}>
          <View style={styles.messageTop}>
            <Text style={styles.sender} numberOfLines={1}>
              {sender}
            </Text>
            <Text style={styles.time}>{time}</Text>
          </View>
          {/* selectable = long press (or drag on web) to copy the text. */}
          <Text style={styles.content} selectable>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title={otherName} subtitle="Direct Message" />

      {/* pushes the msg box up above the keyboard on iOS. Android already resizes the window itself. */}
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* cond ? A : B in JSX = show A or B. that's how you swap what's on screen based on state. */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} accessibilityLabel="Loading messages" />
          </View>
        ) : (
          // FlatList only draws rows near the screen, so a long chat doesn't slow everything down.
          // (a ScrollView w/ messages.map() would draw every single msg at once.)
          <FlatList
            ref={listRef}
            data={messages}
            // keys let React tell rows apart when the list changes. message_id is unique + never changes.
            keyExtractor={(m) => String(m.message_id)}
            renderItem={renderMessage}
            contentContainerStyle={messages.length === 0 ? styles.emptyList : styles.listContent}
            // new stuff showed up (or first load) -> jump to the bottom so the newest msg is visible.
            // fires when the list's total height changes, which only happens when msgs get added.
            // a quiet poll returns the same array -> no redraw -> this doesn't fire.
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                No messages yet. Say hi to {otherName.split(' ')[0]} 👋
              </Text>
            }
          />
        )}

        {/* cond ? <X /> : null = only show X sometimes. null draws nothing. */}
        {loadError ? (
          <Text style={styles.errorText} accessibilityRole="alert">
            {loadError}
          </Text>
        ) : null}

        {/* the bar at the bottom: errors, the counter, then the box + Send. */}
        <View style={styles.composer}>
          {sendError ? (
            <Text style={styles.errorText} accessibilityRole="alert">
              Not sent: {sendError}
            </Text>
          ) : null}
          {charsLeft <= 200 ? <Text style={styles.counter}>{charsLeft} characters left</Text> : null}

          <View style={styles.inputRow}>
            {/* "controlled input": box always shows draft, every keystroke goes back into draft.
                state = single source of truth, that's why setDraft('') after sending clears the box. */}
            <TextInput
              style={styles.input}
              value={draft}
              onChangeText={setDraft}
              onKeyPress={onKeyPress}
              placeholder={`Message ${otherName}`}
              placeholderTextColor={colors.placeholder}
              multiline
              maxLength={DM_MAX_LENGTH} // box won't let you type past 2000 (server still checks too).
              accessibilityLabel={`Message ${otherName}`}
            />
            <Pressable
              onPress={send}
              disabled={!canSend}
              // style can be a fn: Pressable tells it whether it's being held down right now.
              style={({ pressed }) => [styles.sendButton, !canSend && styles.sendDisabled, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Send"
              accessibilityState={{ disabled: !canSend, busy: sending }}>
              {sending ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <Text style={styles.sendText}>Send</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// styles = a fn of the colors (not one fixed object) so dark mode works.
// useThemedStyles(createStyles) up top reruns this whenever the theme flips.
// numbers = density-independent pixels. everything's flexbox (default direction is a column, top to bottom).
const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1, // flex: 1 = "take all the space that's left" -> screen fills the whole window.
      backgroundColor: colors.background,
    },
    flex: {
      flex: 1,
    },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    listContent: {
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    emptyList: {
      flexGrow: 1, // empty list stretches to full height so the "say hi" text can sit in the middle.
      justifyContent: 'center',
      padding: 24,
    },
    emptyText: {
      color: colors.textMutedChat,
      fontSize: 15,
      textAlign: 'center',
    },
    message: {
      flexDirection: 'row', // avatar + text side by side instead of stacked.
      paddingVertical: 8,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primaryTintChat,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    avatarMine: {
      backgroundColor: colors.primary,
    },
    avatarText: {
      color: colors.textAccent,
      fontSize: 16,
      fontWeight: 'bold',
    },
    avatarTextMine: {
      color: colors.onPrimary,
    },
    messageBody: {
      flex: 1,
    },
    messageTop: {
      flexDirection: 'row',
      alignItems: 'baseline',
    },
    sender: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '700',
      flexShrink: 1,
    },
    time: {
      color: colors.textMutedChatTime,
      fontSize: 12,
      marginLeft: 8,
    },
    content: {
      color: colors.textSecondary,
      fontSize: 15,
      lineHeight: 21,
      marginTop: 2,
    },
    composer: {
      borderTopWidth: 1,
      borderTopColor: colors.borderChat,
      backgroundColor: colors.surface,
      paddingHorizontal: 12,
      paddingTop: 8,
      paddingBottom: 12,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'flex-end', // box grows taller -> Send stays pinned at the bottom next to it.
      gap: 8,
    },
    input: {
      flex: 1, // box takes all the width Send doesn't need.
      minHeight: 44, // 44 = smallest comfy touch target (a11y guideline), same on Send.
      maxHeight: 120, // grows a few lines, then scrolls inside.
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      backgroundColor: colors.inputBackground,
      color: colors.text,
      fontSize: 15,
      paddingHorizontal: 12,
      paddingTop: 11,
      paddingBottom: 11,
    },
    sendButton: {
      minWidth: 64,
      minHeight: 44,
      borderRadius: 12,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 14,
    },
    sendDisabled: {
      opacity: 0.45, // faded = can't tap it. (the disabled prop is what actually blocks the tap.)
    },
    sendText: {
      color: colors.onPrimary,
      fontSize: 15,
      fontWeight: '700',
    },
    counter: {
      color: colors.textMuted,
      fontSize: 12,
      textAlign: 'right',
      marginBottom: 4,
    },
    errorText: {
      color: colors.error,
      fontSize: 14,
      paddingHorizontal: 16,
      paddingVertical: 6,
      textAlign: 'center',
    },
    pressed: {
      opacity: 0.7,
    },
  });
