import React, { useState } from "react";
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Pressable,
} from "react-native";
import { router } from "expo-router";

import type { ThemeColors } from "@/constants/theme";
import { useThemedStyles } from "@/state/theme";

export default function ChatScreen() {
    const styles = useThemedStyles(createStyles);
    const [chatType, setChatType] = useState< "group" | "DM">("group");
    const [groupChats, setGroupChats] = useState<any[]>([]);
    const [directMessages, setDirectMessages] = useState<any[]>([]);

    return (
        <View style={styles.container}>
            {/*Header*/}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Chats</Text>
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

                        {directMessages.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyIcon}>👤</Text>
                                <Text style={styles.emptyTitle}>No messages yet</Text>
                                <Text style={styles.emptyText}>Conversations between you and the person you're exchanging with appear here.</Text>
                            </View>
                        ) : (
                            directMessages.map((chat) => (
                                <Pressable
                                    key={chat.id}
                                    style={styles.chatCard}
                                    onPress={() =>
                                        router.push({
                                            pathname: "/dm-chat",
                                            // dm-chat looks people up by user id, no conversation ids on the backend yet.
                                            params: {
                                                userId: String(chat.otherUserId),
                                                name: chat.otherUserName,
                                            },
                                        })
                                    }
                                >
                                    <View style={styles.avatar}>
                                        <Text style={styles.avatarText}>{chat.otherUserName?.charAt(0)?.toUpperCase()}</Text>
                                    </View>

                                    <View style={styles.chatInfo}>
                                        <View style={styles.chatTopRow}>
                                            <Text style={styles.chatName}>
                                                {chat.otherUserName}
                                            </Text>
                                            <Text style={styles.timeText}>{chat.time}</Text>
                                        </View>

                                        <Text
                                            style={styles.lastMessage}
                                            numberOfLines={1}
                                        >{chat.lastMessage}</Text>
                                    </View>
                                </Pressable>
                            ))
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

    headerTitle: {
        color: colors.onHeader,
        fontSize: 34,
        fontWeight: "bold",
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
        color: colors.textAccent,
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





