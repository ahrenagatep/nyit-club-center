import React, { useCallback, useEffect, useRef, useState } from "react";

import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Pressable,
    TextInput,
    Modal,
    KeyboardAvoidingView,
    Platform,
} from "react-native";

import { router, type Href, useFocusEffect } from "expo-router";

import { openClub, openEvent } from "@/components/club-cards";
import {
    formatEventDate,
    getClubById,
    getMemberCount,
    getUpcomingEvents,
    type Club,
} from "@/data/mock-data";
import { ApiError, PROFILE_LIMITS, SCHOOL_YEARS, skillApi, usersApi, type SchoolYear, type SkillSummary } from "@/lib/api";
import type { ThemePreference } from "@/lib/theme-storage";
import { KIND_LABEL, STATUS_LABEL, openSkillPost } from "@/components/skill-cards";
import type { ThemeColors } from "@/constants/theme";
import { useAppState } from "@/state/app-state";
import { useAuth } from "@/state/auth";
import { useDarkMode } from "@/state/dark-mode";
import { useTheme, useThemedStyles } from "@/state/theme";

/** How many clubs/events each section shows before "View All". */
const PREVIEW_COUNT = 2;

/** Choices in Settings → Theme; saved between launches (state/dark-mode.tsx). */
const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
    { value: "system", label: "Use device setting" },
];

// Previous screen, or Home when there is none (deep link or web refresh), like ScreenHeader.
function goBack() {
    if (router.canGoBack()) {
        router.back();
    } else {
        router.replace("/home");
    }
}

/**
 * Profile (Home → 👤, More → View Profile). Shows the signed-in user, their
 * clubs and RSVPs, and Sign out. Major, school year, and bio are edited in the
 * pop-up and saved to the account (PATCH /users/me).
 */
export default function ProfileScreen() {
    const styles = useThemedStyles(createStyles);
    const { colors } = useTheme();
    const { user, session, signOut, updateUser } = useAuth();
    const { joinedClubIds, rsvpEventIds } = useAppState();
    const { preference, setPreference } = useDarkMode();

    // user is briefly null while signing out, before the redirect to Login.
    const fullName =
        [user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.username || "Student";
    const email = user?.nyit_email ?? "";
    const role = user?.role ?? "student";
    const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);

    // Most recently joined first
    const recentClubs = [...joinedClubIds]
        .reverse()
        .map(getClubById)
        .filter((club): club is Club => club !== undefined)
        .slice(0, PREVIEW_COUNT);
    // Soonest RSVP'd events that haven't ended
    const upcomingEvents = getUpcomingEvents()
        .filter((event) => rsvpEventIds.includes(event.event_id))
        .slice(0, PREVIEW_COUNT);

    const major = user?.major ?? "";
    const schoolYear = user?.school_year ?? "";
    const bio = user?.bio ?? "";

    // Picks up edits made on another device (and fills in sessions saved before
    // these fields existed). Keeps the saved copy if the request fails.
    useEffect(() => {
        if (!session) return;
        let cancelled = false;
        usersApi
            .me(session.access_token)
            .then(({ user: fresh }) => {
                if (!cancelled) updateUser(fresh);
            })
            .catch(() => {});
        return () => {
            cancelled = true;
        };
    }, [session, updateUser]);

    // Skill Exchange numbers (post count, Kudos, recent posts), refreshed whenever Profile opens
    const [skillSummary, setSkillSummary] = useState<SkillSummary | null>(null);
    useFocusEffect(
        useCallback(() => {
            if (!session) return;
            skillApi
                .summary(session.access_token)
                .then(setSkillSummary)
                .catch(() => {});
        }, [session]),
    );

    // Controls whether the edit profile form is open
    const [editVisible, setEditVisible] = useState(false);
    // Controls whether the settings sheet is open
    const [settingsVisible, setSettingsVisible] = useState(false);
    //Temp values while user is editing
    const [editMajor, setEditMajor] = useState(major);
    const [editYear, setEditYear] = useState<SchoolYear | "">(schoolYear);
    const [editBio, setEditBio] = useState(bio);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState("");
    //this opens the edit popup
    const openEditProfile = () => {
        setEditMajor(major);
        setEditYear(schoolYear);
        setEditBio(bio);
        setSaveError("");
        setEditVisible(true);
    };
    //saves edited options to the account, then shows them on the profile page
    const saveProfile = async () => {
        if (!session || saving) return;
        setSaving(true);
        setSaveError("");
        try {
            const { user: saved } = await usersApi.updateMe(session.access_token, {
                major: editMajor.trim() || null,
                school_year: editYear || null,
                bio: editBio.trim() || null,
            });
            await updateUser(saved);
            setEditVisible(false);
        } catch (error) {
            setSaveError(
                error instanceof ApiError && error.status === 401
                    ? "Your session has expired. Sign out and log in again to save changes."
                    : error instanceof Error
                      ? error.message
                      : "Couldn't save your profile. Please try again.",
            );
        } finally {
            setSaving(false);
        }
    }

    // Leaving the screen while the settings sheet is still sliding away leaves it
    // stuck open on web, so iOS and web navigate once onDismiss fires. Android
    // never calls onDismiss and closes the sheet on its own, so it goes right away.
    const pendingHref = useRef<Href | null>(null);
    const openFromSettings = (href: Href) => {
        setSettingsVisible(false);
        if (Platform.OS === "android") {
            router.push(href);
        } else {
            pendingHref.current = href;
        }
    };
    const onSettingsDismissed = () => {
        const href = pendingHref.current;
        pendingHref.current = null;
        if (href) router.push(href);
    };

    const stats: { icon: string; count: number; label: string; href: Href }[] = [
        { icon: "👥", count: joinedClubIds.length, label: "Clubs Joined", href: "/my-clubs" },
        { icon: "📅", count: rsvpEventIds.length, label: "Events Going", href: "/events" },
        { icon: "🧠", count: skillSummary?.post_count ?? 0, label: "Skill Posts", href: "/skill-exchange" },
    ];

    return (
        <>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/*Header - user can go back to previous page*/}
                <View style={styles.header}>
                    <Pressable
                        onPress={goBack}
                        style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel="Go back"
                    >
                        <Text style={styles.backArrow}>‹</Text>
                    </Pressable>

                    <Text style={styles.headerTitle} accessibilityRole="header">Profile</Text>

                    <Pressable
                        onPress={() => setSettingsVisible(true)}
                        style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel="Settings"
                    >
                        <Text style={styles.settingsIcon}>⚙️</Text>
                    </Pressable>
                </View>

                {/* Profile */}
                <View style={styles.profileCard}>
                    <View style={styles.profileTop}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarIcon} importantForAccessibility="no">👤</Text>
                        </View>

                        <View style={styles.profileInfo}>
                            <Text style={styles.name}>{fullName}</Text>
                            {major ? <Text style={styles.major}>{major}</Text> : null}
                            {schoolYear ? <Text style={styles.year}>{schoolYear}</Text> : null}
                            <View style={styles.roleTag}>
                                <Text style={styles.roleText}>{roleLabel}</Text>
                            </View>
                        </View>
                        {/* Opens and let users edit their bio and informations */}
                        <Pressable
                            onPress={openEditProfile}
                            style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
                            hitSlop={8}
                            accessibilityRole="button"
                            accessibilityLabel="Edit profile"
                        >
                            <Text style={styles.editIcon}>✎</Text>
                        </Pressable>
                    </View>

                    {bio ? (
                        <Text style={styles.bio}>{bio}</Text>
                    ) : (
                        <Text style={[styles.bio, styles.placeholder]}>
                            No bio yet. Use ✎ to add your major, school year, and a short bio.
                        </Text>
                    )}

                    <View style={styles.infoRow} accessible accessibilityLabel={`Email: ${email}`}>
                        <Text style={styles.infoIcon}>✉️</Text>
                        <Text style={styles.infoText}>{email}</Text>
                    </View>

                    <View
                        style={styles.infoRow}
                        accessible
                        accessibilityLabel={`${skillSummary?.kudos ?? 0} Kudos: Skill Exchange requests and offers fulfilled`}
                    >
                        <Text style={styles.infoIcon}>⭐</Text>
                        <Text style={styles.infoText}>
                            {skillSummary?.kudos ?? 0} Kudos (requests and offers fulfilled)
                        </Text>
                    </View>

                    <View
                        style={styles.infoRow}
                        accessible
                        accessibilityLabel="School: New York Institute of Technology"
                    >
                        <Text style={styles.infoIcon}>🎓</Text>
                        <Text style={styles.infoText}>New York Institute of Technology</Text>
                    </View>
                </View>

                {/*Involved*/}
                <Text style={styles.sectionTitle} accessibilityRole="header">My Involvement</Text>
                {/* Stats Row - clubs joined, events going, skill posts; each opens its list */}
                <View style={styles.statsRow}>
                    {stats.map((stat) => (
                        <Pressable
                            key={stat.label}
                            onPress={() => router.navigate(stat.href)}
                            style={({ pressed }) => [styles.statCard, pressed && styles.pressed]}
                            accessibilityRole="button"
                            accessibilityLabel={`${stat.count} ${stat.label}`}
                        >
                            <Text style={styles.statIcon}>{stat.icon}</Text>
                            <Text style={styles.statNumber}>{stat.count}</Text>
                            <Text style={styles.statLabel}>{stat.label}</Text>
                        </Pressable>
                    ))}
                </View>

                {/* Recent Clubs */}
                <SectionHeader
                    title="Recent Clubs"
                    viewAllLabel="View all your clubs"
                    onViewAll={() => router.navigate("/my-clubs")}
                />

                {recentClubs.length > 0 ? (
                    recentClubs.map((club) => {
                        const members = `${getMemberCount(club, true)} members`;
                        return (
                            <ActivityRow
                                key={club.club_id}
                                icon={club.emoji}
                                title={club.name}
                                subtitle={members}
                                hint="Opens the club page"
                                onPress={() => openClub(club.club_id)}
                            />
                        );
                    })
                ) : (
                    <ActivityRow
                        icon="🔍"
                        title="Find clubs to join"
                        subtitle="You haven't joined any clubs yet"
                        onPress={() => router.navigate("/explore")}
                    />
                )}

                {/*Upcoming Events*/}
                <SectionHeader
                    title="Upcoming Events"
                    viewAllLabel="View all events"
                    onViewAll={() => router.navigate("/events")}
                />

                {upcomingEvents.length > 0 ? (
                    upcomingEvents.map((event) => {
                        const club = getClubById(event.club_id);
                        const when = formatEventDate(event.event_date);
                        return (
                            <ActivityRow
                                key={event.event_id}
                                icon={club?.emoji ?? "📅"}
                                title={event.title}
                                subtitle={club ? `${club.name} · ${when}` : when}
                                hint="Opens the event page"
                                onPress={() => openEvent(event.event_id)}
                            />
                        );
                    })
                ) : (
                    <ActivityRow
                        icon="📅"
                        title="Browse events"
                        subtitle="You haven't RSVP'd to any upcoming events"
                        onPress={() => router.navigate("/events")}
                    />
                )}

                {/*Recent skill exchange*/}
                <SectionHeader
                    title="Skill Exchange"
                    viewAllLabel="View all skill posts"
                    onViewAll={() => router.navigate("/skill-exchange")}
                />

                {skillSummary?.recent.length ? (
                    skillSummary.recent.map((post) => (
                        <ActivityRow
                            key={post.post_id}
                            icon={post.kind === "offer" ? "🧑‍🏫" : "🙋"}
                            title={post.title}
                            subtitle={`${KIND_LABEL[post.kind]} · ${STATUS_LABEL[post.status]}`}
                            hint="Opens the post"
                            onPress={() => openSkillPost(post.post_id, "profile")}
                        />
                    ))
                ) : (
                    <ActivityRow
                        icon="🧠"
                        title="Share a skill"
                        subtitle="You haven't posted on Skill Exchange yet"
                        onPress={() => router.navigate("/skill-exchange")}
                    />
                )}

                <Pressable
                    onPress={signOut}
                    style={({ pressed }) => [styles.signOut, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel="Sign out"
                >
                    <Text style={styles.signOutText}>Sign out</Text>
                </Pressable>
            </ScrollView>

            <Modal
                visible={editVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setEditVisible(false)}
            >

                {/* Moves the form when the keyboard opens */}
                <KeyboardAvoidingView
                    style={styles.modalBackground}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                >

                    <View style={styles.editModal} accessibilityViewIsModal>

                        {/* Makes the popup scrollable while keyboard is open */}
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                            keyboardDismissMode="interactive"
                            contentContainerStyle={styles.editModalContent}
                        >

                            {/* Edit Profile Header */}
                            <View style={styles.editHeader}>

                                <Text style={styles.editTitle} accessibilityRole="header">Edit Profile</Text>

                                {/* Closes popup without saving */}
                                <Pressable
                                    onPress={() =>
                                        setEditVisible(false)
                                    }
                                    style={styles.closeButtonArea}
                                    hitSlop={8}
                                    accessibilityRole="button"
                                    accessibilityLabel="Close without saving"
                                >
                                    <Text style={styles.closeButton}>✕</Text>
                                </Pressable>
                            </View>

                            {/* Major */}
                            <Text style={styles.formLabel}>Major</Text>

                            {/* User types their major */}
                            <TextInput
                                style={styles.majorInput}
                                placeholder="Enter your major"
                                placeholderTextColor={colors.placeholder}
                                value={editMajor}
                                onChangeText={setEditMajor}
                                accessibilityLabel="Major"
                                maxLength={PROFILE_LIMITS.major}
                            />


                            {/* School Year */}
                            <Text style={styles.formLabel}>School Year</Text>

                            <View style={styles.optionRow}>
                                {/*map() creates one selectable button for each school year*/}
                                {SCHOOL_YEARS.map((item) => (

                                    <Pressable
                                        key={item}

                                        style={[
                                            styles.optionButton,
                                            editYear === item &&
                                            styles.selectedOption,
                                        ]}

                                        // tapping the selected year again clears it
                                        onPress={() => setEditYear(editYear === item ? "" : item)}
                                        accessibilityRole="button"
                                        accessibilityLabel={`School year: ${item}`}
                                        accessibilityState={{ selected: editYear === item }}
                                    >

                                        <Text
                                            style={[
                                                styles.optionText,
                                                editYear === item &&
                                                styles.selectedOptionText,
                                            ]}
                                        >
                                            {item}
                                        </Text>

                                    </Pressable>
                                ))}

                            </View>


                            {/* Bio */}
                            <Text style={styles.formLabel}>
                                Bio
                            </Text>

                            <TextInput
                                style={styles.bioInput}

                                // Allows multiple lines of text
                                multiline={true}
                                placeholder="Tell us about yourself..."
                                placeholderTextColor={colors.placeholder}
                                value={editBio}
                                onChangeText={setEditBio}
                                maxLength={PROFILE_LIMITS.bio}
                                accessibilityLabel="Bio"
                            />

                            {saveError ? (
                                <Text
                                    style={styles.saveError}
                                    accessibilityRole="alert"
                                    accessibilityLiveRegion="polite"
                                >
                                    {saveError}
                                </Text>
                            ) : null}


                            {/* Save Button */}
                            <Pressable
                                style={({ pressed }) => [
                                    styles.saveButton,
                                    (pressed || saving) && styles.pressed,
                                ]}
                                onPress={saveProfile}
                                disabled={saving}
                                accessibilityRole="button"
                                accessibilityState={{ disabled: saving, busy: saving }}
                            >

                                <Text style={styles.saveButtonText}>
                                    {saving ? "Saving…" : "Save Changes"}
                                </Text>
                            </Pressable>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Settings sheet (⚙️) - same look as the edit popup */}
            <Modal
                visible={settingsVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setSettingsVisible(false)}
                onDismiss={onSettingsDismissed}
            >
                <View style={styles.modalBackground}>
                    <View style={styles.editModal} accessibilityViewIsModal>
                        <View style={styles.editHeader}>
                            <Text style={styles.editTitle} accessibilityRole="header">Settings</Text>

                            <Pressable
                                onPress={() => setSettingsVisible(false)}
                                style={styles.closeButtonArea}
                                hitSlop={8}
                                accessibilityRole="button"
                                accessibilityLabel="Close settings"
                            >
                                <Text style={styles.closeButton}>✕</Text>
                            </Pressable>
                        </View>

                        <Pressable
                            onPress={() => openFromSettings("/notifications")}
                            style={({ pressed }) => [styles.settingsRow, pressed && styles.pressed]}
                            accessibilityRole="button"
                            accessibilityLabel="Notifications"
                        >
                            <Text style={styles.settingsRowIcon}>🔔</Text>
                            <Text style={styles.settingsRowLabel}>Notifications</Text>
                            <Text style={styles.arrow}>›</Text>
                        </Pressable>

                        {/* Theme: light, dark, or follow the device; applies right away and is saved */}
                        <View style={styles.themeSetting}>
                            <View style={styles.themeHeading}>
                                <Text style={styles.settingsRowIcon}>🎨</Text>
                                <Text style={styles.settingsRowLabel}>Theme</Text>
                            </View>

                            <View style={styles.optionRow} accessibilityRole="radiogroup" accessibilityLabel="Theme">
                                {THEME_OPTIONS.map((option) => {
                                    const selected = preference === option.value;
                                    return (
                                        <Pressable
                                            key={option.value}
                                            style={[styles.optionButton, selected && styles.selectedOption]}
                                            onPress={() => setPreference(option.value)}
                                            accessibilityRole="radio"
                                            accessibilityLabel={option.label}
                                            aria-checked={selected}
                                        >
                                            <Text style={[styles.optionText, selected && styles.selectedOptionText]}>
                                                {option.label}
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </View>

                        {/* Not built yet (FR-8) */}
                        <View
                            style={[styles.settingsRow, styles.settingsRowDisabled]}
                            accessible
                            accessibilityState={{ disabled: true }}
                            accessibilityLabel="Favorites, coming soon"
                        >
                            <Text style={styles.settingsRowIcon}>⭐</Text>
                            <Text style={styles.settingsRowLabel}>Favorites</Text>
                            <Text style={styles.comingSoon}>Coming soon</Text>
                        </View>
                    </View>
                </View>
            </Modal>
        </>

    );
}

/** Section title with a "View All" link on the right. */
function SectionHeader({
    title,
    viewAllLabel,
    onViewAll,
}: {
    title: string;
    viewAllLabel: string;
    onViewAll: () => void;
}) {
    const styles = useThemedStyles(createStyles);
    return (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitleNoMargin} accessibilityRole="header">{title}</Text>

            <Pressable
                onPress={onViewAll}
                style={({ pressed }) => [styles.viewAllButton, pressed && styles.pressed]}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={viewAllLabel}
            >
                <Text style={styles.viewAll}>View All</Text>
            </Pressable>
        </View>
    );
}

/** One tappable card in the Recent Clubs / Upcoming Events / Skill Exchange lists. */
function ActivityRow({
    icon,
    title,
    subtitle,
    hint,
    onPress,
}: {
    icon: string;
    title: string;
    subtitle: string;
    hint?: string;
    onPress: () => void;
}) {
    const styles = useThemedStyles(createStyles);
    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [styles.activityCard, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={`${title}, ${subtitle}`}
            accessibilityHint={hint}
        >
            <View style={styles.activityIconBox}>
                <Text style={styles.activityIcon}>{icon}</Text>
            </View>

            <View style={styles.activityInfo}>
                <Text style={styles.activityTitle}>{title}</Text>
                <Text style={styles.activitySubtitle}>{subtitle}</Text>
            </View>

            <Text style={styles.arrow}>›</Text>
        </Pressable>
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

    pressed: {
        opacity: 0.7,
    },

    // Dark background behind the popup
    modalBackground: {
        flex: 1,
        backgroundColor: colors.backdrop,
        justifyContent: "flex-end",
    },
    // Popup card that slides up from the bottom
    editModal: {
        backgroundColor: colors.surface,

        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        paddingHorizontal: 22,
        paddingTop: 20,
        paddingBottom: 40,
    },

    editModalContent: {
        paddingBottom: 20,
    },
    // Places the title and close button on the same row
    editHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },

    editTitle: {
        fontSize: 23,
        fontWeight: "bold",
        color: colors.text,
    },
    // 44x44 touch target around the ✕
    closeButtonArea: {
        minWidth: 44,
        minHeight: 44,
        alignItems: "center",
        justifyContent: "center",
    },
    closeButton: {
        fontSize: 22,
        color: colors.textMuted,
    },
    // Label for Major, School Year, and Bio
    formLabel: {
        fontSize: 16,
        fontWeight: "600",
        color: colors.text,
        marginTop: 22,
        marginBottom: 10,
    },
    // Textbox where the user types their major
    majorInput: {
        borderWidth: 1,
        borderColor: colors.borderStrongProfile,
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 14,
        color: colors.text,
    },
    // Holds the school year selection buttons
    optionRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 9,
    },
    // Default school year button
    optionButton: {
        backgroundColor: colors.surfaceMuted,
        paddingHorizontal: 14,
        paddingVertical: 9,
        minHeight: 44,
        justifyContent: "center",
        borderRadius: 16,
    },
    // Blue style for the selected school year
    selectedOption: {
        backgroundColor: colors.primary,
    },

    optionText: {
        color: colors.text,
        fontSize: 13,
    },
    // Makes the selected school year text white
    selectedOptionText: {
        color: colors.onPrimary,
        fontWeight: "600",
    },
    // Multiline textbox for the user's bio
    bioInput: {
        minHeight: 110,
        borderWidth: 1,
        borderColor: colors.borderStrongProfile,
        borderRadius: 14,
        padding: 14,
        fontSize: 14,
        color: colors.text,
        textAlignVertical: "top",
    },
    // Button that saves the edited profile information
    saveButton: {
        backgroundColor: colors.primary,
        marginTop: 28,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: "center",
    },

    saveButtonText: {
        color: colors.onPrimary,
        fontSize: 15,
        fontWeight: "600",
    },

    saveError: {
        color: colors.errorProfile,
        fontSize: 14,
        marginTop: 16,
    },

    /* Settings sheet */

    settingsRow: {
        minHeight: 56,
        marginTop: 10,
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: colors.borderProfile,
        borderRadius: 15,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.surface,
    },

    settingsRowDisabled: {
        backgroundColor: colors.surfaceMuted,
    },

    settingsRowIcon: {
        fontSize: 20,
        width: 34,
    },

    settingsRowLabel: {
        flex: 1,
        fontSize: 15,
        fontWeight: "600",
        color: colors.text,
    },

    comingSoon: {
        fontSize: 13,
        color: colors.textMuted,
    },

    // Theme box: same frame as a settings row, with the choices underneath
    themeSetting: {
        marginTop: 10,
        padding: 15,
        gap: 12,
        borderWidth: 1,
        borderColor: colors.borderProfile,
        borderRadius: 15,
        backgroundColor: colors.surface,
    },

    themeHeading: {
        flexDirection: "row",
        alignItems: "center",
    },


    /* HEADER */

    header: {
        backgroundColor: colors.header,
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 75,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    // 44x44 touch target for the back and settings buttons
    headerButton: {
        minWidth: 44,
        minHeight: 44,
        alignItems: "center",
        justifyContent: "center",
    },

    backArrow: {
        color: colors.onHeader,
        fontSize: 38,
    },

    headerTitle: {
        color: colors.onHeader,
        fontSize: 27,
        fontWeight: "bold",
    },

    settingsIcon: {
        fontSize: 25,
    },

    /*Profile */

    profileCard: {
        backgroundColor: colors.surface,
        marginHorizontal: 18,
        marginTop: -55,
        borderRadius: 18,
        padding: 18,
        shadowColor: colors.shadow,
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
        backgroundColor: colors.primaryTintProfile,
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
        color: colors.text,
    },

    major: {
        fontSize: 15,
        color: colors.textMutedProfile,
        marginTop: 4,
    },

    year: {
        fontSize: 14,
        color: colors.textMuted,
        marginTop: 3,
    },

    roleTag: {
        alignSelf: "flex-start",
        marginTop: 8,
        backgroundColor: colors.tagBackground,
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },

    roleText: {
        color: colors.textAccent,
        fontSize: 13,
        fontWeight: "600",
    },

    editButton: {
        minWidth: 44,
        minHeight: 44,
        alignItems: "center",
        justifyContent: "center",
    },

    editIcon: {
        color: colors.textAccent,
        fontSize: 27,
    },

    bio: {
        fontSize: 14,
        color: colors.textMutedProfile,
        lineHeight: 20,
        marginTop: 20,
        marginBottom: 12,
    },

    placeholder: {
        fontStyle: "italic",
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
        flexShrink: 1,
        fontSize: 13,
        color: colors.textMutedProfile,
    },

    /* Section */

    sectionTitle: {
        marginHorizontal: 18,
        marginTop: 28,
        marginBottom: 12,
        fontSize: 21,
        fontWeight: "bold",
        color: colors.text,
    },

    sectionTitleNoMargin: {
        fontSize: 21,
        fontWeight: "bold",
        color: colors.text,
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
        borderColor: colors.borderProfile,
        borderRadius: 16,
        paddingVertical: 17,
        paddingHorizontal: 5,
        alignItems: "center",
        backgroundColor: colors.surface,
    },

    statIcon: {
        fontSize: 22,
    },

    statNumber: {
        fontSize: 21,
        fontWeight: "bold",
        color: colors.text,
        marginTop: 6,
    },

    statLabel: {
        fontSize: 11,
        color: colors.textMuted,
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

    viewAllButton: {
        minHeight: 44,
        justifyContent: "center",
    },

    viewAll: {
        color: colors.textAccent,
        fontSize: 14,
        fontWeight: "600",
    },

    activityCard: {
        marginHorizontal: 18,
        marginBottom: 11,
        padding: 15,
        borderWidth: 1,
        borderColor: colors.borderProfile,
        borderRadius: 15,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.surface,
    },

    activityIconBox: {
        width: 52,
        height: 52,
        borderRadius: 14,
        backgroundColor: colors.primaryTintProfile,
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
        color: colors.text,
    },

    activitySubtitle: {
        fontSize: 12,
        color: colors.textMuted,
        marginTop: 4,
    },

    arrow: {
        fontSize: 27,
        color: colors.textMuted,
    },

    /* Sign out */

    signOut: {
        marginHorizontal: 18,
        marginTop: 28,
        minHeight: 52,
        borderRadius: 15,
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
