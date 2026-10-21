import React, { useState } from "react";
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Pressable,
} from "react-native";
import { router } from "expo-router";

export default function ChatScreen() {
    const [chatType, setChatType] = useState< "group" | "DM">("group");
    const [groupChats, setGroupChats] = useState<any[]>([]);
    const [directMessages, setDirectMessages] = useState<any[]>([]);

    return (
        <View style={styles.container}>
            {/*Header*/}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Chats</Text>
                <Text style={styles.headerSubtitle}>Stay connect with your Clubs and fellow Students!</Text>

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
                                <Text style={styles.emptyText}>Conversations between you and the person you're exchnaging with appaers here.</Text>
                            </View>
                        ) : (
                            directMessages.map((chat) => (
                                <Pressable
                                    key={chat.id}
                                    style={styles.chatCard}
                                    onPress={() =>
                                        router.push({
                                            pathname: "/dm-chat",
                                            params: {
                                                conversationId: chat.id,
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




const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },

    header: {
        backgroundColor: "#0B55B7",
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 25,
    },

    headerTitle: {
        color: "#FFFFFF",
        fontSize: 34,
        fontWeight: "bold",
    },

    headerSubtitle: {
        color: "#D9E6FF",
        fontSize: 16,
        marginTop: 5,
        marginBottom: 22,
    },

    toggleContainer: {
        flexDirection: "row",
        backgroundColor: "#2C6DC5",
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
        backgroundColor: "#FFFFFF",
    },

    toggleText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "bold",
    },

    activeToggleText: {
        color: "#0B55B7",
    },

    chatList: {
        flex: 1,
    },

    chatListContent: {
        padding: 20,
    },

    sectionTitle: {
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
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 8,
    },

    emptyText: {
        fontSize: 15,
        color: "#6B7280",
        textAlign: "center",
        lineHeight: 22,
    },

    chatCard: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
    },

    avatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: "#E6EEF9",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 14,
    },

    avatarText: {
        color: "#0B55B7",
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
        fontSize: 17,
        fontWeight: "bold",
        flex: 1,
    },

    timeText: {
        fontSize: 13,
        color: "#8A8A8A",
        marginLeft: 10,
    },

    lastMessage: {
        fontSize: 14,
        color: "#6B7280",
        marginTop: 5,
    },
});





