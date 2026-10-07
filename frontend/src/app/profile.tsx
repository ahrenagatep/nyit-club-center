import React from "react";

import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Pressable,
} from "react-native";

import { router } from "expo-router";

export default function ProfileScreen() {
    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            {/*Header*/}
            <View style={styles.header}>
                <Pressable onPress={() => router.back()}>
                    <Text style={styles.backArrow}>‹</Text>
                </Pressable>

                <Text style={styles.headerTitle}>Profile</Text>

                <Pressable>
                    <Text style={styles.settingsIcon}>⚙️</Text>
                </Pressable>
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
                        <Text style={styles.year}>Senior</Text>
                    </View>

                    <Pressable>
                        <Text style={styles.editIcon}>✎</Text>
                    </Pressable>
                </View>

                <Text style={styles.bio}>I am interested in tech, love campus activities, and learning new skills</Text>

                <View style={styles.infoRow}>
                    <Text style={styles.infoIcon}>ℹ️</Text>
                    <Text style={styles.infoText}>raiyanyousha@gmail.com</Text>
                </View>

                <View style={styles.infoRow}>
                    <Text style={styles.infoIcon}>🎓</Text>
                    <Text style={styles.infoText}>New York Institute of Technology</Text>
                </View>
            </View>

            {/*Involved*/}
            <Text style={styles.sectionTitle}>My Involvement</Text>

            <View style={styles.statsRow}>
                <View style={styles.statCard}>
                    <Text style={styles.statIcon}>👥</Text>
                    <Text style={styles.statNumber}>4</Text>
                    <Text style={styles.statLabel}>Clubs Joined</Text>
                </View>

                <View style={styles.statCard}>
                    <Text style={styles.statIcon}>📅</Text>
                    <Text style={styles.statNumber}>9</Text>
                    <Text style={styles.statLabel}>Events Attended</Text>
                </View>

                <View style={styles.statCard}>
                    <Text style={styles.statIcon}>🧠</Text>
                    <Text style={styles.statNumber}>5</Text>
                    <Text style={styles.statLabel}>Skill Posts</Text>
                </View>
            </View>

            {/* Recent Clubs */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitleNoMargin}>Recent Clubs</Text>

                <Pressable>
                    <Text style={styles.viewAll}>View All</Text>
                </Pressable>
            </View>

            <View style={styles.activityCard}>
                <View style={styles.activityIconBox}>
                    <Text style={styles.activityIcon}>💻</Text>
                </View>

                <View style={styles.activityInfo}>
                    <Text style={styles.activityTitle}>Computer Science Club</Text>
                    <Text style={styles.activitySubtitle}>10 members</Text>
                </View>

                <Text style={styles.arrow}>›</Text>
            </View>

            <View style={styles.activityCard}>
                <View style={styles.activityIconBox}>
                    <Text style={styles.activityIcon}>♟️</Text>
                </View>

                <View style={styles.activityInfo}>
                    <Text style={styles.activityTitle}>Chess Club</Text>
                    <Text style={styles.activitySubtitle}>25 members</Text>
                </View>

                <Text style={styles.arrow}>›</Text>
            </View>

            {/*Recent Events*/}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitleNoMargin}>Recent Events</Text>

                <Pressable>
                    <Text style={styles.viewAll}>View All</Text>
                </Pressable>
            </View>

            <View style={styles.activityCard}>
                <View style={styles.activityIconBox}>
                    <Text style={styles.activityIcon}>🤖</Text>
                </View>

                <View style={styles.activityInfo}>
                    <Text style={styles.activityTitle}>Tech Talk: AI Revolution</Text>
                    <Text style={styles.activitySubtitle}>Computer Science Club</Text>
                </View>

                <Text style={styles.arrow}>›</Text>
            </View>

            <View style={styles.activityCard}>
                <View style={styles.activityIconBox}>
                    <Text style={styles.activityIcon}>🎵</Text>
                </View>

                <View style={styles.activityInfo}>
                    <Text style={styles.activityTitle}>Spring Concert</Text>
                    <Text style={styles.activitySubtitle}>Music Club</Text>
                </View>

                <Text style={styles.arrow}>›</Text>
            </View>

            {/*Recent skill exchange*/}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitleNoMargin}>Skill Exchange</Text>

                <Pressable>
                    <Text style={styles.viewAll}>View All</Text>
                </Pressable>
            </View>

            <View style={styles.activityCard}>
                <View style={styles.activityIconBox}>
                    <Text style={styles.activityIcon}>💻</Text>
                </View>

                <View style={styles.activityInfo}>
                    <Text style={styles.activityTitle}>Offering Java Help</Text>
                    <Text style={styles.activitySubtitle}>Online</Text>
                </View>

                <Text style={styles.arrow}>›</Text>
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

    /* HEADER */

    header: {
        backgroundColor: "#0B55B7",
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 75,

        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    backArrow: {
        color: "#FFFFFF",
        fontSize: 38,
    },

    headerTitle: {
        color: "#FFFFFF",
        fontSize: 27,
        fontWeight: "bold",
    },

    settingsIcon: {
        fontSize: 25,
    },

    /*Profile */

    profileCard: {
        backgroundColor: "#FFFFFF",

        marginHorizontal: 18,
        marginTop: -55,

        borderRadius: 18,
        padding: 18,

        shadowColor: "#000000",
        shadowOpacity: 0.09,
        shadowRadius: 8,

        shadowOffset: {
            width: 0,
            height: 4,
        },

        elevation: 4,
    },

    profileTop: {
        flexDirection: "row",
        alignItems: "center",
    },

    avatar: {
        width: 88,
        height: 88,

        borderRadius: 44,

        backgroundColor: "#EAF3FF",

        alignItems: "center",
        justifyContent: "center",

        marginRight: 15,
    },

    avatarIcon: {
        fontSize: 40,
    },

    profileInfo: {
        flex: 1,
    },

    name: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#171717",
    },

    major: {
        fontSize: 15,
        color: "#666A78",
        marginTop: 4,
    },

    year: {
        fontSize: 14,
        color: "#777B8A",
        marginTop: 3,
    },

    editIcon: {
        color: "#0B55B7",
        fontSize: 27,
    },

    bio: {
        fontSize: 14,
        color: "#666A78",

        lineHeight: 20,

        marginTop: 20,
        marginBottom: 12,
    },

    infoRow: {
        flexDirection: "row",
        alignItems: "center",

        marginTop: 10,
    },

    infoIcon: {
        fontSize: 17,
        marginRight: 10,
    },

    infoText: {
        fontSize: 13,
        color: "#666A78",
    },

    /* Section */

    sectionTitle: {
        marginHorizontal: 18,
        marginTop: 28,
        marginBottom: 12,

        fontSize: 21,
        fontWeight: "bold",

        color: "#171717",
    },

    sectionTitleNoMargin: {
        fontSize: 21,
        fontWeight: "bold",

        color: "#171717",
    },

    /* Stats */

    statsRow: {
        flexDirection: "row",

        marginHorizontal: 18,

        gap: 10,
    },

    statCard: {
        flex: 1,

        borderWidth: 1,
        borderColor: "#E0E2E6",

        borderRadius: 16,

        paddingVertical: 17,
        paddingHorizontal: 5,

        alignItems: "center",

        backgroundColor: "#FFFFFF",
    },

    statIcon: {
        fontSize: 22,
    },

    statNumber: {
        fontSize: 21,
        fontWeight: "bold",

        color: "#171717",

        marginTop: 6,
    },

    statLabel: {
        fontSize: 11,
        color: "#777B8A",

        textAlign: "center",

        marginTop: 4,
    },

    /* Recent Sections */

    sectionHeader: {
        marginHorizontal: 18,

        marginTop: 28,
        marginBottom: 12,

        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    viewAll: {
        color: "#0B55B7",

        fontSize: 14,
        fontWeight: "600",
    },

    activityCard: {
        marginHorizontal: 18,
        marginBottom: 11,

        padding: 15,

        borderWidth: 1,
        borderColor: "#E0E2E6",

        borderRadius: 15,

        flexDirection: "row",
        alignItems: "center",

        backgroundColor: "#FFFFFF",
    },

    activityIconBox: {
        width: 52,
        height: 52,

        borderRadius: 14,

        backgroundColor: "#EAF3FF",

        alignItems: "center",
        justifyContent: "center",

        marginRight: 13,
    },

    activityIcon: {
        fontSize: 24,
    },

    activityInfo: {
        flex: 1,
    },

    activityTitle: {
        fontSize: 15,
        fontWeight: "600",

        color: "#171717",
    },

    activitySubtitle: {
        fontSize: 12,
        color: "#777B8A",

        marginTop: 4,
    },

    arrow: {
        fontSize: 27,
        color: "#777B8A",
    },

});
