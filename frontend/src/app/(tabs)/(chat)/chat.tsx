import React, { useCallback, useRef, useState } from "react";
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Pressable,
    ActivityIndicator,
} from "react-native";
import { router, useFocusEffect } from "expo-router";

import { ChatAvatar } from "@/components/chat-avatar";
import { HeaderActions } from "@/components/header-actions";
import type { ThemeColors } from "@/constants/theme";
import { ApiError, directMessagesApi, type DmConversation } from "@/lib/api";
import { formatListTime, fullName, previewText } from "@/lib/chat";
import { useAuth } from "@/state/auth";
import { useTheme, useThemedStyles } from "@/state/theme";

const LIST_POLL_MS = 30000; // refresh the DM list every 30s while the tab is open (no sockets yet)

export default function ChatScreen() {
    const styles = useThemedStyles(createStyles);
    const { colors } = useTheme();
    const { session } = useAuth();
    const [chatType, setChatType] = useState< "group" | "DM">("group");
    const [groupChats, setGroupChats] = useState<any[]>([]);
    const [directMessages, setDirectMessages] = useState<DmConversation[]>([]);
    const [dmLoaded, setDmLoaded] = useState(false);
    const [dmError, setDmError] = useState<string | null>(null);
    const inFlight = useRef(false); // no overlapping requests if one is slow

    const loadConversations = useCallback(async () => {
        if (!session || inFlight.current) return;
        inFlight.current = true;
        try {
            const { conversations } = await directMessagesApi.list(session.access_token);
            setDirectMessages(conversations);
            setDmError(null);
        } catch (e) {
            if (e instanceof ApiError && e.status === 401) setDmError("Your session has expired. Sign out and log in again.");
            else setDmError(e instanceof ApiError ? e.message : "Couldn't load your messages. Please try again.");
        } finally {
            inFlight.current = false;
            setDmLoaded(true);
        }
    }, [session]);

    // load on focus (so coming back from a chat shows the newest msg), then poll; stop when the tab loses focus
    useFocusEffect(
        useCallback(() => {
            loadConversations();
            const timer = setInterval(loadConversations, LIST_POLL_MS);
            return () => clearInterval(timer);
        }, [loadConversations]),
    );

    const openNewMessage = () => router.push("/new-message");

    return (
        <View style={styles.container}>
            {/*Header*/}
            <View style={styles.header}>
                <View style={styles.headerTitleRow}>
                    <Text style={styles.headerTitle} accessibilityRole="header">Chats</Text>
                    {/* right side: "+" new message, then bell + profile (same on every main tab) */}
                    <View style={styles.headerRight}>
                        <Pressable
                            onPress={openNewMessage}
                            style={({ pressed }) => [styles.plusButton, pressed && styles.pressed]}
                            hitSlop={8}
                            accessibilityRole="button"
                            accessibilityLabel="New message or search chats"
                        >
                            <Text style={styles.plusIcon}>+</Text>
                        </Pressable>
                        <HeaderActions />
                    </View>
                </View>
                <Text style={styles.headerSubtitle}>Stay connected with your Clubs and fellow Students!</Text>

                {/*Group/Dm chat */}
                <View style={styles.toggleContainer}>
                    <Pressable
                        style={[
                            styles.toggleButton,
                            chatType === "group" && styles.activeToggleButton,
                        ]}
                        onPress={() => setChatType("group")}
                    >
                        <Text
                            style={[styles.toggleText, chatType === "group" && styles.activeToggleText,

                            ]}
                        > Group Chats
                        </Text>
                    </Pressable>

                    <Pressable
                        style={[
                            styles.toggleButton,
                            chatType === "DM" && styles.activeToggleButton,
                        ]}
                        onPress={() => setChatType("DM")}
                    >
                        <Text
                            style={[
                                styles.toggleText,
                                chatType === "DM" && styles.activeToggleText,
                            ]}
                        > Direct Messages
                        </Text>
                    </Pressable>
                </View>
            </View>

            {/*Chat List*/}
            <ScrollView
                style={styles.chatList}
                contentContainerStyle={styles.chatListContent}
                showsVerticalScrollIndicator={false}
            >
                {/*Group chat*/}
                {chatType === "group" && (
                    <>
                        <Text style={styles.sectionTitle}>Club Chats</Text>

                        {groupChats.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyIcon}>💬</Text>
                                <Text style={styles.emptyTitle}> No chats yet</Text>
                                <Text style={styles.emptyText}>Conversations for clubs will appear here once you join a club</Text>
                            </View>
                        ) : (
                            groupChats.map((chat) => (
                                <Pressable
                                    key={chat.id}
                                    style={styles.chatCard}
                                    onPress={() =>
                                        router.push({
                                            pathname: "/club-chat",
                                            params: {
                                                chatId: chat.id,
                                            },
                                        })
                                    }
                                >
                                    <View style={styles.avatar}>
                                        <Text style={styles.avatarText}>{chat.name?.charAt(0)?.toUpperCase()}</Text>
                                    </View>

                                    <View style={styles.chatInfo}>
                                        <View style={styles.chatTopRow}>
                                            <Text style={styles.chatName}>{chat.name}</Text>
                                            <Text style={styles.timeText}>{chat.time}</Text>
                                        </View>

                                        <Text
                                            style={styles.lastMessage}
                                            numberOfLines={1}
                                        >{chat.lastMessage}
                                        </Text>
                                    </View>
                                </Pressable>
                            ))
                        )}
                    </>
                )}

                {/*DM*/}
                {chatType === "DM" && (
                    <>
                        <Text style={styles.sectionTitle}>DMs</Text>

                        {dmError ? (
                            <Text style={styles.errorText} accessibilityRole="alert">{dmError}</Text>
                        ) : null}

                        {!dmLoaded ? (
                            <ActivityIndicator style={styles.loading} size="large" color={colors.primary} accessibilityLabel="Loading messages" />
                        ) : directMessages.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyIcon}>👤</Text>
                                <Text style={styles.emptyTitle}>No messages yet</Text>
                                <Text style={styles.emptyText}>Conversations between you and the person you're exchanging with appear here.</Text>
                                <Pressable
                                    onPress={openNewMessage}
                                    style={({ pressed }) => [styles.startButton, pressed && styles.pressed]}
                                    accessibilityRole="button"
                                >
                                    <Text style={styles.startButtonText}>Start a conversation</Text>
                                </Pressable>
                            </View>
                        ) : (
                            directMessages.map((chat) => {
                                const name = fullName(chat);
                                const time = formatListTime(chat.last_sent_at);
                                const preview = previewText(chat);
                                return (
                                    <Pressable
                                        key={chat.user_id}
                                        style={({ pressed }) => [styles.chatCard, pressed && styles.pressed]}
                                        onPress={() =>
                                            router.push({
                                                pathname: "/dm-chat",
                                                // dm-chat looks people up by user id, no conversation ids on the backend yet.
                                                params: {
                                                    userId: String(chat.user_id),
                                                    name,
                                                },
                                            })
                                        }
                                        accessibilityRole="button"
                                        accessibilityLabel={`${name}, ${time}: ${preview}`}
                                        accessibilityHint="Opens the conversation"
                                    >
                                        <ChatAvatar name={name} imageUrl={chat.profile_image} />

                                        <View style={styles.chatInfo}>
                                            <View style={styles.chatTopRow}>
                                                <Text style={styles.chatName} numberOfLines={1}>
                                                    {name}
                                                </Text>
                                                <Text style={styles.timeText}>{time}</Text>
                                            </View>

                                            <Text
                                                style={styles.lastMessage}
                                                numberOfLines={1}
                                            >{preview}</Text>
                                        </View>
                                    </Pressable>
                                );
                            })
                        )}
                    </>
                )}
            </ScrollView>
        </View>
    );
}




const createStyles = (colors: ThemeColors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },

    header: {
        backgroundColor: colors.header,
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 25,
    },

    headerTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    // keeps "+" and the bell/profile pair together on the right
    headerRight: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },

    headerTitle: {
        color: colors.onHeader,
        fontSize: 34,
        fontWeight: "bold",
    },

    plusButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.headerButton,
        alignItems: "center",
        justifyContent: "center",
    },

    plusIcon: {
        color: colors.onHeader,
        fontSize: 30,
        lineHeight: 32,
        fontWeight: "600",
        marginTop: -2,
    },

    pressed: {
        opacity: 0.7,
    },

    loading: {
        paddingTop: 60,
    },

    errorText: {
        color: colors.error,
        fontSize: 14,
        textAlign: "center",
        marginBottom: 12,
    },

    startButton: {
        marginTop: 20,
        minHeight: 44,
        paddingHorizontal: 20,
        borderRadius: 12,
        backgroundColor: colors.primary,
        alignItems: "center",
        justifyContent: "center",
    },

    startButtonText: {
        color: colors.onPrimary,
        fontSize: 16,
        fontWeight: "600",
    },

    headerSubtitle: {
        color: colors.onHeaderMutedChat,
        fontSize: 16,
        marginTop: 5,
        marginBottom: 22,
    },

    toggleContainer: {
        flexDirection: "row",
        backgroundColor: colors.headerControlChat,
        borderRadius: 14,
        padding: 5,
    },

    toggleButton: {
        flex: 1,
        paddingVertical: 13,
        alignItems: "center",
        borderRadius: 11,
    },

    activeToggleButton: {
        backgroundColor: colors.surface,
    },

    toggleText: {
        color: colors.onHeader,
        fontSize: 16,
        fontWeight: "bold",
    },

    activeToggleText: {
        color: colors.textAccentOnSurface,
    },

    chatList: {
        flex: 1,
    },

    chatListContent: {
        padding: 20,
    },

    sectionTitle: {
        color: colors.text,
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 18,
    },

    emptyContainer: {
        alignItems: "center",
        justifyContent: "center",
        paddingTop: 80,
        paddingHorizontal: 30,
    },

    emptyIcon: {
        fontSize: 42,
        marginBottom: 15,
    },

    emptyTitle: {
        color: colors.text,
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 8,
    },

    emptyText: {
        fontSize: 15,
        color: colors.textMutedChat,
        textAlign: "center",
        lineHeight: 22,
    },

    chatCard: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderChat,
    },

    avatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: colors.primaryTintChat,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 14,
    },

    avatarText: {
        color: colors.textAccent,
        fontSize: 20,
        fontWeight: "bold",
    },

    chatInfo: {
        flex: 1,
    },

    chatTopRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    chatName: {
        color: colors.text,
        fontSize: 17,
        fontWeight: "bold",
        flex: 1,
    },

    timeText: {
        fontSize: 13,
        color: colors.textMutedChatTime,
        marginLeft: 10,
    },

    lastMessage: {
        fontSize: 14,
        color: colors.textMutedChat,
        marginTop: 5,
    },
});





