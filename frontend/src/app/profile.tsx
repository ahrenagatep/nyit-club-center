import React, { useState } from "react";

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

import { router } from "expo-router";

export default function ProfileScreen() {

    const [major, setMajor] = useState("Computer Science");
    const [schoolYear, setSchoolYear] = useState("Senior");
    const [bio, setBio] = useState("I am interested in tech, love campus activities, and learn new skills");
    // Controls wheter the edit profile form is open
    const [editVisible, setEditVisible] = useState(false);
    //Temp values while user is editing
    const [editMajor, setEditMajor] = useState(major);
    const [editYear, setEditYear] = useState(schoolYear);
    const [editBio, setEditBio] = useState(bio);
    //school year options to be selected
    const schoolYears = ["Freshmen", "Sophomore", "Junior", "Senior"];
    //this opnes the edit popup
    const openEditProfile = () => {
        setEditMajor(major);
        setEditYear(schoolYear);
        setEditBio(bio);
        setEditVisible(true);
    };
    //saves edited options into the profile page
    const saveProfile = () => {
        setMajor(editMajor);
        setSchoolYear(editYear);
        setBio(editBio);
        setEditVisible(false);
    }

    return (
        <>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/*Header - user can go back to previous page*/}
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
                            <Text style={styles.major}>{major}</Text>
                            <Text style={styles.year}>{schoolYear}</Text>
                        </View>
                        {/* Opens and let users edit their bio and informations */}
                        <Pressable onPress={openEditProfile}>
                            <Text style={styles.editIcon}>✎</Text>
                        </Pressable>
                    </View>

                    <Text style={styles.bio}>{bio}</Text>

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
                {/* Stats Row - # of clubs joined */}
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Text style={styles.statIcon}>👥</Text>
                        <Text style={styles.statNumber}>4</Text>
                        <Text style={styles.statLabel}>Clubs Joined</Text>
                    </View>
                    {/* Stats Row - # of events attended */}
                    <View style={styles.statCard}>
                        <Text style={styles.statIcon}>📅</Text>
                        <Text style={styles.statNumber}>9</Text>
                        <Text style={styles.statLabel}>Events Attended</Text>
                    </View>
                    {/* Stats Row - # of skills*/}
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

                    <View style={styles.editModal}>

                        {/* Makes the popup scrollable while keyboard is open */}
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                            keyboardDismissMode="interactive"
                            contentContainerStyle={styles.editModalContent}
                        >

                            {/* Edit Profile Header */}
                            <View style={styles.editHeader}>

                                <Text style={styles.editTitle}>Edit Profile</Text>

                                {/* Closes popup without saving */}
                                <Pressable
                                    onPress={() =>
                                        setEditVisible(false)
                                    }
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
                                value={editMajor}
                                onChangeText={setEditMajor}
                            />


                            {/* School Year */}
                            <Text style={styles.formLabel}>School Year</Text>

                            <View style={styles.optionRow}>
                                {/*map() creates one selectable button for each school year*/}
                                {schoolYears.map((item) => (

                                    <Pressable
                                        key={item}

                                        style={[
                                            styles.optionButton,
                                            editYear === item &&
                                            styles.selectedOption,
                                        ]}

                                        onPress={() => setEditYear(item)}
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
                                value={editBio}
                                onChangeText={setEditBio}
                                maxLength={200}
                            />


                            {/* Save Button */}
                            <Pressable
                                style={styles.saveButton}
                                onPress={saveProfile}
                            >

                                <Text style={styles.saveButtonText}>
                                    Save Changes
                                </Text>
                            </Pressable>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </>

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

    // Dark background behind the popup
    modalBackground: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.35)",
        justifyContent: "flex-end",
    },
    // White popup that slides up from the bottom
    editModal: {
        backgroundColor: "#FFFFFF",

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
        color: "#171717",
    },
    closeButton: {
        fontSize: 22,
        color: "#777B8A",
    },
    // Label for Major, School Year, and Bio
    formLabel: {
        fontSize: 16,
        fontWeight: "600",
        color: "#171717",
        marginTop: 22,
        marginBottom: 10,
    },
    // Textbox where the user types their major
    majorInput: {
        borderWidth: 1,
        borderColor: "#D9DBE1",

        borderRadius: 14,

        paddingHorizontal: 14,
        paddingVertical: 12,

        fontSize: 14,
        color: "#171717",
    },
    // Holds the school year selection buttons
    optionRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 9,
    },
    // Default school year button
    optionButton: {
        backgroundColor: "#F1F1F3",

        paddingHorizontal: 14,
        paddingVertical: 9,

        borderRadius: 16,
    },
    // Blue style for the selected school year
    selectedOption: {
        backgroundColor: "#0B55B7",
    },

    optionText: {
        color: "#171717",
        fontSize: 13,
    },
    // Makes the selected school year text white
    selectedOptionText: {
        color: "#FFFFFF",
        fontWeight: "600",
    },
    // Multiline textbox for the user's bio
    bioInput: {
        minHeight: 110,

        borderWidth: 1,
        borderColor: "#D9DBE1",

        borderRadius: 14,

        padding: 14,

        fontSize: 14,
        color: "#171717",

        textAlignVertical: "top",
    },
    // Button that saves the edited profile information
    saveButton: {
        backgroundColor: "#0B55B7",

        marginTop: 28,

        paddingVertical: 14,

        borderRadius: 12,

        alignItems: "center",
    },

    saveButtonText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "600",
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