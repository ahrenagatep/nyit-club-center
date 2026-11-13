// New Message (Chats tab's + button): filter my previous chats, or look up other students by name/username.
// tapping either opens /dm-chat?userId=&name= (replace, so Back from the chat returns to the Chats tab).

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import { ChatAvatar } from '@/components/chat-avatar';
import { ScreenHeader } from '@/components/screen-header';
import type { ThemeColors } from '@/constants/theme';
import {
  ApiError,
  USER_SEARCH_LENGTH,
  directMessagesApi,
  usersApi,
  type DmConversation,
  type UserSearchResult,
} from '@/lib/api';
import { formatListTime, fullName, matchesPerson, previewText } from '@/lib/chat';
import { useAuth } from '@/state/auth';
import { useTheme, useThemedStyles } from '@/state/theme';

const SEARCH_DELAY_MS = 300; // wait for a pause in typing before asking the server

function errorMessage(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.status === 401) return 'Your session has expired. Sign out and log in again.';
    return e.message;
  }
  return 'Something went wrong. Please try again.';
}

function openChat(userId: number, name: string) {
  router.replace({ pathname: '/dm-chat', params: { userId: String(userId), name } });
}

export default function NewMessageScreen() {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const { session } = useAuth();

  const [query, setQuery] = useState('');
  const [conversations, setConversations] = useState<DmConversation[]>([]);
  const [listError, setListError] = useState<string | null>(null);
  const [people, setPeople] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const trimmed = query.trim();
  const canSearch = trimmed.length >= USER_SEARCH_LENGTH.min;

  useFocusEffect(
    useCallback(() => {
      if (!session) return;
      let active = true;
      directMessagesApi
        .list(session.access_token)
        .then(({ conversations: list }) => {
          if (!active) return;
          setConversations(list);
          setListError(null);
        })
        .catch((e) => {
          if (active) setListError(errorMessage(e));
        });
      return () => {
        active = false;
      };
    }, [session]),
  );

  // debounced people search: each keystroke cancels the pending timer, and a stale response is ignored
  useEffect(() => {
    if (!session || !canSearch) {
      setPeople([]);
      setSearching(false);
      setSearchError(null);
      return;
    }
    let active = true;
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const { users } = await usersApi.search(session.access_token, trimmed);
        if (active) {
          setPeople(users);
          setSearchError(null);
        }
      } catch (e) {
        if (active) setSearchError(errorMessage(e));
      } finally {
        if (active) setSearching(false);
      }
    }, SEARCH_DELAY_MS);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [session, trimmed, canSearch]);

  const previous = useMemo(() => conversations.filter((c) => matchesPerson(c, trimmed)), [conversations, trimmed]);
  // someone already in "Previous chats" isn't listed again under "People"
  const newPeople = useMemo(() => {
    const listed = new Set(previous.map((c) => c.user_id));
    return people.filter((p) => !listed.has(p.user_id));
  }, [people, previous]);

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="New Message"
        subtitle="Search your chats or find a student"
        onBack={() => router.dismissTo('/chat')} // always the Chats tab, even after a deep link/web refresh
      />

      <View style={styles.searchCard}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon} importantForAccessibility="no">
            🔍
          </Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Name or username"
            placeholderTextColor={colors.placeholderOnSurface}
            value={query}
            onChangeText={setQuery}
            maxLength={USER_SEARCH_LENGTH.max}
            autoFocus
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            clearButtonMode="while-editing"
            accessibilityLabel="Search by name or username"
          />
        </View>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {/* Previous chats */}
        {listError ? (
          <Text style={styles.errorText} accessibilityRole="alert">
            {listError}
          </Text>
        ) : null}
        {previous.length > 0 ? (
          <>
            <Text style={styles.sectionTitle} accessibilityRole="header">
              Previous chats
            </Text>
            {previous.map((c) => {
              const name = fullName(c);
              const time = formatListTime(c.last_sent_at);
              const preview = previewText(c);
              return (
                <Pressable
                  key={`chat-${c.user_id}`}
                  style={({ pressed }) => [styles.row, pressed && styles.pressed]}
                  onPress={() => openChat(c.user_id, name)}
                  accessibilityRole="button"
                  accessibilityLabel={`${name}, ${time}: ${preview}`}
                  accessibilityHint="Opens the conversation">
                  <ChatAvatar name={name} imageUrl={c.profile_image} size={44} />
                  <View style={styles.rowText}>
                    <View style={styles.rowTop}>
                      <Text style={styles.name} numberOfLines={1}>
                        {name}
                      </Text>
                      <Text style={styles.time}>{time}</Text>
                    </View>
                    <Text style={styles.detail} numberOfLines={1}>
                      {preview}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </>
        ) : null}

        {/* People (server search) */}
        <Text style={styles.sectionTitle} accessibilityRole="header">
          People
        </Text>
        {!canSearch ? (
          <Text style={styles.hint}>
            Type at least {USER_SEARCH_LENGTH.min} characters to find other students.
          </Text>
        ) : searching ? (
          <ActivityIndicator style={styles.spinner} color={colors.primary} accessibilityLabel="Searching" />
        ) : searchError ? (
          <Text style={styles.errorText} accessibilityRole="alert">
            {searchError}
          </Text>
        ) : newPeople.length === 0 ? (
          <Text style={styles.hint} accessibilityLiveRegion="polite">
            {people.length > 0 ? 'Everyone found is already in your chats above.' : `No students match "${trimmed}".`}
          </Text>
        ) : (
          newPeople.map((p) => {
            const name = fullName(p);
            const detail = [`@${p.username}`, p.major, p.school_year].filter(Boolean).join(' · ');
            return (
              <Pressable
                key={`user-${p.user_id}`}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}
                onPress={() => openChat(p.user_id, name)}
                accessibilityRole="button"
                accessibilityLabel={`${name}, ${detail}`}
                accessibilityHint="Starts a conversation">
                <ChatAvatar name={name} imageUrl={p.profile_image} size={44} />
                <View style={styles.rowText}>
                  <Text style={styles.name} numberOfLines={1}>
                    {name}
                  </Text>
                  <Text style={styles.detail} numberOfLines={1}>
                    {detail}
                  </Text>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    flex: {
      flex: 1,
    },
    searchCard: {
      backgroundColor: colors.surface,
      marginHorizontal: 20,
      marginTop: -22,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 6,
      shadowColor: colors.shadow,
      shadowOpacity: 0.08,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 5,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    searchIcon: {
      fontSize: 19,
      marginRight: 10,
    },
    searchInput: {
      flex: 1,
      minHeight: 44,
      fontSize: 17,
      color: colors.textOnSurface,
    },
    content: {
      padding: 20,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: 'bold',
      marginTop: 8,
      marginBottom: 8,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 44,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderChat,
    },
    rowText: {
      flex: 1,
    },
    rowTop: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    name: {
      color: colors.text,
      fontSize: 16,
      fontWeight: 'bold',
      flex: 1,
    },
    time: {
      color: colors.textMutedChatTime,
      fontSize: 13,
      marginLeft: 10,
    },
    detail: {
      color: colors.textMutedChat,
      fontSize: 14,
      marginTop: 3,
    },
    hint: {
      color: colors.textMutedChat,
      fontSize: 15,
      lineHeight: 21,
      marginBottom: 12,
    },
    spinner: {
      paddingVertical: 16,
    },
    errorText: {
      color: colors.error,
      fontSize: 14,
      marginBottom: 12,
    },
    pressed: {
      opacity: 0.7,
    },
  });
