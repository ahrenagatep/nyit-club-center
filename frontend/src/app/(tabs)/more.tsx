import React from "react";

import {
    View,
    Text,
    Pressable,
    ScrollView,
    StyleSheet,
} from "react-native";

import { router } from "expo-router";

import { DarkModeToggle } from "@/components/dark-mode-toggle";
import type { ThemeColors } from "@/constants/theme";
import { useAuth } from "@/state/auth";
import { useThemedStyles } from "@/state/theme";

export default function MoreScreen() {
    const styles = useThemedStyles(createStyles);
    const { user, signOut } = useAuth();
    // user is briefly null while signing out, before the redirect to Login.
    const fullName =
        [user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.username || "Student";

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            {/*Header*/}
            <View style={styles.header}>
                <Text style={styles.headerSubtitle} accessibilityRole="header">Manage Account</Text>
                <DarkModeToggle />
            </View>

            {/* Profile */}
            <View style={styles.profileCard}>
                <View style={styles.profileTop}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarIcon} importantForAccessibility="no">👤</Text>
                    </View>

                    <View style={styles.profileInfo}>
                        <Text style={styles.name}>{fullName}</Text>
                        <Text style={styles.major}>{user?.nyit_email ?? ""}</Text>
                    </View>
                </View>

                <Pressable
                    style={({ pressed }) => [styles.viewProfileButton, pressed && styles.pressed]}
                    onPress={() => router.push("/profile")}
                    accessibilityRole="button"
                    accessibilityLabel="View Profile"
                    accessibilityHint="See your profile info"
                >
                    <View>
                        <Text style={styles.viewProfileTitle}>View Profile</Text>
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

            <Pressable
                onPress={signOut}
                style={({ pressed }) => [styles.signOut, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Sign out"
            >
                <Text style={styles.signOutText}>Sign out</Text>
            </Pressable>
        </ScrollView>
    );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: colors.background,
    },

    content: {
        paddingBottom: 40,
    },

    header: {
        backgroundColor: colors.header,
        paddingTop: 65,
        paddingHorizontal: 22,
        paddingBottom: 40,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    headerSubtitle: {
        color: colors.onHeaderMuted,
        fontSize: 14,
        marginTop: 6,
    },

    profileCard: {
        backgroundColor: colors.surface,
        marginHorizontal: 18,
        marginTop: -20,
        borderRadius: 18,
        padding: 18,

        shadowColor: colors.shadow,
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
        backgroundColor: colors.surfaceMuted,
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
        color: colors.text,
    },

    major: {
        fontSize: 14,
        color: colors.textMuted,
        marginTop: 4,
    },

    viewProfileButton: {
        marginTop: 20,
        paddingTop: 17,
        borderTopWidth: 1,
        borderTopColor: colors.borderMore,

        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    viewProfileTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: colors.text,
    },

    viewProfileSubtitle: {
        fontSize: 12,
        color: colors.textMuted,
        marginTop: 4,
    },

    arrow: {
        fontSize: 30,
        color: colors.textMuted,
    },

    futureCard: {
        marginHorizontal: 18,
        marginTop: 20,
        padding: 18,
        backgroundColor: colors.surfaceMutedMore,
        borderRadius: 16,
    },

    futureTitle: {
        fontSize: 15,
        fontWeight: "600",
        color: colors.text,
    },

    futureText: {
        fontSize: 13,
        color: colors.textMuted,
        marginTop: 5,
        lineHeight: 18,
    },

    pressed: {
        opacity: 0.7,
    },

    signOut: {
        marginHorizontal: 18,
        marginTop: 20,
        minHeight: 52,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: colors.danger,
        justifyContent: "center",
        alignItems: "center",
    },

    signOutText: {
        color: colors.danger,
        fontSize: 16,
        fontWeight: "bold",
    },

});