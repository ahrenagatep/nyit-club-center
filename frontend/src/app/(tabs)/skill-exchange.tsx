import React, { useState } from "react";

import {
    View,
    Text,
    TextInput,
    Pressable,
    ScrollView,
    StyleSheet,
    Modal,
} from "react-native";

export default function SkillExchangeScreen() {
    const [search, setSearch] = useState("");
    const [filterVisble, setFilterVisible] = useState(false);
    const [category, setCategory] = useState("All");
    const [skill, setSkill] = useState("All");
    const [location, setLocation] = useState("All");
    const [exchangeType, setExchangeType] = useState("All");

    const categories = ["All", "Coding", "Design", "Math", "Science",];
    const skills = ["All", "Java", "Calculus", "Physics", "Chemistry",];
    const locations = ["All", "Online", "In Person",];
    const exchangeTypes = ["All", "Teach", "Learn",];

    const clearFilters = () => {
        setCategory("All");
        setSkill("All");
        setLocation("All");
        setExchangeType("All");
    };

    return (
        <View style={styles.container}>

            {/* Main Page*/}
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerTitle}>Skill Exchange</Text>
                        <Text style={styles.headerSubtitle}>Share your skills and connect with others</Text>
                    </View>

                    {/* Creating post - visuals */}
                    <Pressable style={styles.postButton}>
                        <Text style={styles.postButtonText}> +Post</Text>
                    </Pressable>
                </View>

                {/*Search & Filter*/}
                <View style={styles.searchSection}>
                    <View style={styles.searchBar}>
                        <Text style={styles.searchIcon}>🔍</Text>

                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search skills or students..."
                            placeholderTextColor="777B8A"
                            value={search}
                            onChangeText={setSearch}
                        />
                    </View>

                    <Pressable
                        style={styles.filterButton}
                        onPress={() => setFilterVisible(true)}
                    >
                        <Text style={styles.filterButtonText}>Filter</Text>
                    </Pressable>
                </View>

                {/* Activate filter */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.activeFilters}
                >
                    {category !== "All" && (
                        <View style={styles.activeFilterTag}>
                            <Text style={styles.activeFilterText}>{category}</Text>
                        </View>
                    )}

                    {skill !== "All" && (
                        <View style={styles.activeFilterTag}>
                            <Text style={styles.activeFilterText}>{skill}</Text>
                        </View>
                    )}

                    {location !== "All" && (
                        <View style={styles.activeFilterTag}>
                            <Text style={styles.activeFilterText}>{location}</Text>
                        </View>
                    )}

                    {exchangeType !== "All" && (
                        <View style={styles.activeFilterTag}>
                            <Text style={styles.activeFilterText}>{exchangeType}</Text>
                        </View>
                    )}
                </ScrollView>

                {/* TITLE */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Available Exchanges</Text>
                </View>

                {/* Card 1 */}
                <View style={styles.exchangeCard}>
                    <View style={styles.cardTop}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>👱🏼‍♂️</Text>
                        </View>

                        <View style={styles.studentInfo}>
                            <Text style={styles.studentName}>Ahren</Text>
                            <Text style={styles.studentMajor}>Computer Science</Text>
                        </View>
                        <Text style={styles.timeText}>3hr ago</Text>
                    </View>

                    <View style={styles.exchangeRow}>
                        <View style={styles.offeringBadge}>
                            <Text style={styles.offeringText}>Offering</Text>
                        </View>

                        <Text style={styles.skillTitle}>Java</Text>
                    </View>

                    <Text style={styles.description}>I am able to assist with java basic and functions and help with homework</Text>

                    <View style={styles.cardBottom}>
                        <Text style={styles.locationText}>📍 Online</Text>

                        <Pressable style={styles.connectButton}>
                            <Text style={styles.connectButtonText}>Connect</Text>
                        </Pressable>
                    </View>

                </View>

                {/* card 2 */}
                <View style={styles.exchangeCard}>
                    <View style={styles.cardTop}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>👱🏼‍♂️</Text>
                        </View>

                        <View style={styles.studentInfo}>
                            <Text style={styles.studentName}>Yousha</Text>
                            <Text style={styles.studentMajor}>Biology</Text>
                        </View>

                        <Text style={styles.timeText}>4hr ago</Text>
                    </View>

                    <View style={styles.exchangeRow}>
                        <View style={styles.offeringBadge}>
                            <Text style={styles.offeringText}>Offering</Text>
                        </View>

                        <Text style={styles.skillTitle}>Chem & Bio</Text>
                    </View>

                    <Text style={styles.description}> I can help with chemistry 1 & 2 and also bilogy 1 classes</Text>

                    <View style={styles.cardBottom}>
                        <Text style={styles.locationText}>📍 In Person</Text>

                        <Pressable style={styles.connectButton}>
                            <Text style={styles.connectButtonText}>Connect</Text>
                        </Pressable>
                    </View>
                </View>

                {/* card 3 */}
                <View style={styles.exchangeCard}>
                    <View style={styles.cardTop}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>👱🏼‍♂️</Text>
                        </View>

                        <View style={styles.studentInfo}>
                            <Text style={styles.studentName}>Anson</Text>
                            <Text style={styles.studentMajor}>Mechanical Engineering</Text>
                        </View>

                        <Text style={styles.timeText}>2d ago</Text>
                    </View>

                    <View style={styles.exchangeRow}>
                        <View style={styles.lookingBadge}>
                            <Text style={styles.lookingText}>Looking for</Text>
                        </View>
                        <Text style={styles.skillTitle}>Calculus</Text>
                    </View>

                    <Text style={styles.description}>I am looking for someone to help me in Calculus 1</Text>

                    <View style={styles.cardBottom}>
                        <Text style={styles.locationText}>📍 Both Online & In Person</Text>

                        <Pressable style={styles.connectButton}>
                            <Text style={styles.connectButtonText}>Connect</Text>
                        </Pressable>
                    </View>

                </View>

            </ScrollView>

            {/* Filter Panel*/}
            <Modal
                visible={filterVisble}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setFilterVisible(false)}
            >
                <View style={styles.modalBackground}>

                    <Pressable
                        style={styles.modalOutside}
                        onPress={() => setFilterVisible(false)}
                    />

                    <View style={styles.filterModal}>

                        {/*Header for filter*/}
                        <View style={styles.filterHeader}>
                            <Text style={styles.filterTitle}>Filter</Text>

                            <Pressable
                                onPress={() => setFilterVisible(false)}
                            >
                                <Text style={styles.closeButton}>ⅹ</Text>
                            </Pressable>
                        </View>

                        <ScrollView
                            showsVerticalScrollIndicator={false}
                        >
                            {/* Category */}
                            <Text style={styles.filterSectionTitle}>Category</Text>

                            <View style={styles.optionRow}>
                                {categories.map((item) => (
                                    <Pressable
                                        key={item}
                                        style={[
                                            styles.optionButton,
                                            category === item &&
                                            styles.selectedOption,
                                        ]}
                                        onPress={() => setCategory(item)}
                                    >
                                        <Text
                                            style={[
                                                styles.optionText,
                                                    category === item &&
                                                styles.selectedOptionText,
                                            ]}
                                        >
                                            {item}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>

                            {/* Skill*/}
                            <Text style={styles.filterSectionTitle}>Skill</Text>

                            <View style={styles.optionRow}>
                                {skills.map((item) => (
                                    <Pressable
                                        key={item}
                                        style={[
                                            styles.optionButton,
                                            skill === item &&
                                            styles.selectedOption,
                                        ]}
                                        onPress={() => setSkill(item)}
                                    >
                                        <Text
                                            style={[
                                                styles.optionText,
                                                skill === item &&
                                                styles.selectedOptionText,
                                            ]}
                                        >
                                            {item}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>

                            {/* Location */}
                            <Text style={styles.filterSectionTitle}>Location</Text>

                            <View style={styles.optionRow}>
                                {locations.map((item) => (
                                    <Pressable
                                        key={item}
                                        style={[
                                            styles.optionButton,
                                            location === item &&
                                            styles.selectedOption,
                                        ]}
                                        onPress={() => setLocation(item)}
                                    >
                                        <Text
                                            style={[
                                                styles.optionText,
                                                location === item &&
                                                styles.selectedOptionText,
                                            ]}
                                        >
                                            {item}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>

                            {/* Learn/Teach */}
                            <Text style={styles.filterSectionTitle}>I want to</Text>

                            <View style={styles.optionRow}>
                                {exchangeTypes.map((item) => (
                                    <Pressable
                                        key={item}
                                        style={[
                                            styles.optionButton,
                                            exchangeType === item &&
                                            styles.selectedOption,
                                        ]}
                                        onPress={() => setExchangeType(item)}
                                    >
                                        <Text
                                            style={[
                                                styles.optionText,
                                                exchangeType === item &&
                                                styles.selectedOptionText,
                                            ]}
                                        >
                                            {item}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>

                            {/*Bottons at bottom*/}
                            <View style={styles.filterBottom}>

                                <Pressable
                                    style={styles.clearButton}
                                    onPress={clearFilters}
                                >
                                    <Text style={styles.clearButtonText}>Clear</Text>
                                </Pressable>

                                <Pressable
                                    style={styles.showButton}
                                    onPress={() => setFilterVisible(false)}
                                >
                                    <Text style={styles.showButtonText}>Show Results</Text>
                                </Pressable>
                            </View>

                        </ScrollView>

                    </View>

                </View>
            </Modal>

        </View>
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

    /* Header */

    header: {
        backgroundColor: "#0B55B7",
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 35,

        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    headerTitle: {
        color: "#FFFFFF",
        fontSize: 27,
        fontWeight: "bold",
    },

    headerSubtitle: {
        color: "#E6EEFB",
        fontSize: 13,
        marginTop: 5,
        maxWidth: 250,
    },

    postButton: {
        borderWidth: 1,
        borderColor: "#FFFFFF",
        paddingHorizontal: 15,
        paddingVertical: 9,
        borderRadius: 20,
    },

    postButtonText: {
        color: "#FFFFFF",
        fontWeight: "600",
    },

    /* Search */

    searchSection: {
        flexDirection: "row",
        alignItems: "center",
        marginHorizontal: 18,
        marginTop: 20,
        gap: 10,
    },

    searchBar: {
        flex: 1,
        height: 50,
        backgroundColor: "#F4F4F6",
        borderRadius: 14,
        paddingHorizontal: 14,

        flexDirection: "row",
        alignItems: "center",
    },

    searchIcon: {
        fontSize: 22,
        marginRight: 8,
    },

    searchInput: {
        flex: 1,
        fontSize: 14,
        color: "#171717",
    },

    filterButton: {
        backgroundColor: "#0B55B7",
        paddingHorizontal: 15,
        height: 50,
        borderRadius: 14,

        justifyContent: "center",
    },

    filterButtonText: {
        color: "#FFFFFF",
        fontWeight: "600",
    },

    /* Active Filter */

    activeFilters: {
        paddingHorizontal: 18,
        marginTop: 12,
        gap: 8,
    },

    activeFilterTag: {
        backgroundColor: "#EAF3FF",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
    },

    activeFilterText: {
        color: "#0B55B7",
        fontSize: 12,
        fontWeight: "600",
    },

    /* Cards */

    sectionHeader: {
        marginHorizontal: 18,
        marginTop: 25,
        marginBottom: 12,
    },

    sectionTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#171717",
    },

    exchangeCard: {
        marginHorizontal: 18,
        marginBottom: 14,

        padding: 16,

        borderWidth: 1,
        borderColor: "#E1E3E7",
        borderRadius: 16,

        backgroundColor: "#FFFFFF",
    },

    cardTop: {
        flexDirection: "row",
        alignItems: "center",
    },

    avatar: {
        width: 50,
        height: 50,

        borderRadius: 25,

        backgroundColor: "#F1F1F3",

        alignItems: "center",
        justifyContent: "center",

        marginRight: 12,
    },

    avatarText: {
        fontSize: 26,
    },

    studentInfo: {
        flex: 1,
    },

    studentName: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#171717",
    },

    studentMajor: {
        fontSize: 12,
        color: "#777B8A",
        marginTop: 3,
    },

    timeText: {
        color: "#9296A3",
        fontSize: 11,
    },

    exchangeRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 15,
        gap: 9,
    },

    offeringBadge: {
        backgroundColor: "#DDF8E8",
        borderRadius: 12,
        paddingHorizontal: 9,
        paddingVertical: 5,
    },

    offeringText: {
        color: "#18864B",
        fontSize: 12,
        fontWeight: "600",
    },

    lookingBadge: {
        backgroundColor: "#E5EFFF",
        borderRadius: 12,
        paddingHorizontal: 9,
        paddingVertical: 5,
    },

    lookingText: {
        color: "#0B55B7",
        fontSize: 12,
        fontWeight: "600",
    },

    skillTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#171717",
    },

    description: {
        color: "#555B69",
        fontSize: 13,
        lineHeight: 19,
        marginTop: 10,
    },

    cardBottom: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",

        marginTop: 15,
    },

    locationText: {
        fontSize: 12,
        color: "#777B8A",
    },

    connectButton: {
        backgroundColor: "#0B55B7",

        paddingHorizontal: 18,
        paddingVertical: 9,

        borderRadius: 10,
    },

    connectButtonText: {
        color: "#FFFFFF",
        fontSize: 13,
        fontWeight: "600",
    },

    /* Filter Modal */

    modalBackground: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.35)",
        justifyContent: "flex-end",
    },

    modalOutside: {
        flex: 1,
    },

    filterModal: {
        backgroundColor: "#FFFFFF",
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        paddingHorizontal: 22,
        paddingTop: 18,
        paddingBottom: 35,
        maxHeight: "82%",
    },

    filterHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",

        marginBottom: 10,
    },

    filterTitle: {
        fontSize: 23,
        fontWeight: "bold",
        color: "#171717",
    },

    closeButton: {
        fontSize: 22,
        color: "#777B8A",
    },

    filterSectionTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#171717",

        marginTop: 22,
        marginBottom: 12,
    },

    optionRow: {
        flexDirection: "row",
        flexWrap: "wrap",

        gap: 9,
    },

    optionButton: {
        backgroundColor: "#F1F1F3",

        paddingHorizontal: 14,
        paddingVertical: 9,

        borderRadius: 16,
    },

    selectedOption: {
        backgroundColor: "#0B55B7",
    },

    optionText: {
        color: "#171717",
        fontSize: 13,
    },

    selectedOptionText: {
        color: "#FFFFFF",
        fontWeight: "600",
    },

    /* Buttons in filter */

    filterBottom: {
        flexDirection: "row",
        gap: 10,

        marginTop: 35,
    },

    clearButton: {
        flex: 1,

        borderWidth: 1,
        borderColor: "#0B55B7",

        paddingVertical: 14,

        borderRadius: 12,

        alignItems: "center",
    },

    clearButtonText: {
        color: "#0B55B7",
        fontSize: 15,
        fontWeight: "600",
    },

    showButton: {
        flex: 2,

        backgroundColor: "#0B55B7",

        paddingVertical: 14,

        borderRadius: 12,

        alignItems: "center",
    },

    showButtonText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "600",
    },
});


