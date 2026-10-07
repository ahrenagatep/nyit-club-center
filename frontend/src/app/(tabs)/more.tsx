import React from "react";

import {
    View,
    Text,
    Pressable,
    ScrollView,
    StyleSheet,
} from "react-native";

import { router } from "expo-router";

export default function MoreScreen() {
    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            {/*Header*/}
            <View style={styles.header}>
                <Text style={styles.headerSubtitle}>Manage Account</Text>
            </View>

            {/* Profile */}
            <View style={styles.profileCard}>
                <View style={styles.profileTop}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarIcon}>👤</Text>
                    </View>

                    <View style={styles.profileInfo}>
                        <Text style={styles.name}>Yousha Raiyan</Text>
                        <Text style={styles.major}>Computer Science</Text>
                    </View>
                </View>

                <Pressable
                    style={styles.viewProfileButton}
                    onPress={() => router.push("/profile")}
                >
                    <View>
                        <Text style={styles.viewProfileTitle}> View Profile</Text>
                        <Text style={styles.viewProfileSubtitle}>see your profile info</Text>
                    </View>

                    <Text style={styles.arrow}>›</Text>
                </Pressable>
            </View>

            {/* Space for furture addons */}
            <View style={styles.futureCard}>
                <Text style={styles.futureTitle}>More coming soon</Text>
                <Text style={styles.futureText}> Features coming soon</Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },

    content: {
        paddingBottom: 40,
    },

    header: {
        backgroundColor: "#0B55B7",
        paddingTop: 65,
        paddingHorizontal: 22,
        paddingBottom: 40,
    },

    headerSubtitle: {
        color: "#E6EEFB",
        fontSize: 14,
        marginTop: 6,
    },

    profileCard: {
        backgroundColor: "#FFFFFF",
        marginHorizontal: 18,
        marginTop: -20,
        borderRadius: 18,
        padding: 18,

        shadowColor: "#000000",
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: {
            width: 0,
            height: 3,
        },

        elevation: 4,
    },

    profileTop: {
        flexDirection: "row",
        alignItems: "center",
    },

    avatar: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: "#F1F1F3",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 15,
    },

    avatarIcon: {
        fontSize: 34,
    },

    profileInfo: {
        flex: 1,
    },

    name: {
        fontSize: 21,
        fontWeight: "bold",
        color: "#171717",
    },

    major: {
        fontSize: 14,
        color: "#777B8A",
        marginTop: 4,
    },

    viewProfileButton: {
        marginTop: 20,
        paddingTop: 17,
        borderTopWidth: 1,
        borderTopColor: "#E4E5E8",

        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    viewProfileTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#171717",
    },

    viewProfileSubtitle: {
        fontSize: 12,
        color: "#777B8A",
        marginTop: 4,
    },

    arrow: {
        fontSize: 30,
        color: "#777B8A",
    },

    futureCard: {
        marginHorizontal: 18,
        marginTop: 20,
        padding: 18,
        backgroundColor: "#F7F8FA",
        borderRadius: 16,
    },

    futureTitle: {
        fontSize: 15,
        fontWeight: "600",
        color: "#171717",
    },

    futureText: {
        fontSize: 13,
        color: "#777B8A",
        marginTop: 5,
        lineHeight: 18,
    },

});