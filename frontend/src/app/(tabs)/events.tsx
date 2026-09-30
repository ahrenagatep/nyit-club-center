import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    Pressable,
    ScrollView,
    StyleSheet,
} from "react-native";

export default function EventsScreen() {
    const [viewMode, setViewMode] = useState("list"); //remove if needed
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");

    const [clubMixerRSVP, setClubMixerRSVP] = useState(false);
    const [stemRSVP, setStemRSVP] = useState(false);
    const [openMicRSVP, setOpenMicRSVP] = useState(false);


    const categories = [
        "All",
        "Academic",
        "Sports",
        "Arts",
        "Tech",
        "Social",
        "Workshop",
    ];

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <Text style={styles.headerTitle}>Events</Text>
                    <Text style={styles.bellIcon}>🔔</Text>
                </View>

                {/* List & Calender */}
                <View style={styles.viewToggle}>
                    <Pressable
                        style={[
                            styles.inactiveToggle,
                            viewMode === "list" && styles.activeToggle,
                        ]}
                        onPress={() => setViewMode("list")}
                    >
                        <Text
                            style={[
                                styles.inactiveToggleText,
                                viewMode === "list" && styles.activeToggleText,
                            ]}
                        >
                            LISTS
                        </Text>
                    </Pressable>

                    <Pressable
                        style={[
                            styles.inactiveToggle,
                            viewMode === "calendar" && styles.activeToggle,
                        ]}
                        onPress={() => setViewMode("calendar")}
                    >
                        <Text
                            style={[
                                styles.inactiveToggleText,
                                viewMode === "calendar" && styles.activeToggleText,
                            ]}
                        >
                            CALENDAR
                        </Text>
                    </Pressable>
                </View>
            </View>

            {/* Search & Filter card */}
            <View style={styles.searchCard}>
                <View style={styles.searchBar}>
                    <Text style={styles.searchIcon}>🔍</Text>

                    <TextInput
                        style={styles.searchInput}
                        placeholder="search events..."
                        placeholderTextColor="#777B8A"
                        value={search}
                        onChangeText={setSearch}
                    />

                    <Pressable>
                        <Text style={styles.filterIcon}>▽</Text>
                    </Pressable>
                </View>

                {/* Categories */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoryRow}
                >
                    {categories.map((category) => (
                        <Pressable
                            key={category}
                            style={[
                                styles.categoryButton,
                                selectedCategory === category &&
                                styles.activeCategoryButton,
                            ]}
                            onPress={() => setSelectedCategory(category)}
                        >
                            <Text
                                style={[
                                    styles.categoryText,
                                    selectedCategory === category &&
                                    styles.activeCategoryText,
                                ]}
                            >
                                {category}
                            </Text>
                        </Pressable>
                    ))}
                </ScrollView>
            </View>

            {/* Event Title */}

            <Text style={styles.sectionTitle}>UPcoming Events</Text>
            {viewMode === "list" ? (
                <>
                    {/* Club Mixer card*/}
                    <View style={styles.eventCard}>
                        <View style={styles.eventTop}>
                            <View style={styles.eventInfo}>
                                <Text style={styles.eventTitle}>Club Mixer Night</Text>
                                <Text style={styles.clubName}>Student Council</Text>
                            </View>

                            <View style={styles.dateBadge}>
                                <Text style={styles.dateMonth}>Oct</Text>
                                <Text style={styles.dateDay}>6</Text>
                            </View>
                        </View>

                        <Text style={styles.detailText}>🕔 6:00 PM - 9:00 PM</Text>
                        <Text style={styles.detailText}>📍 SAC</Text>

                        <View style={styles.eventBottom}>
                            <Pressable
                                style={[styles.rsvpButton, clubMixerRSVP && styles.rsvpActiveButton]}

                                onPress={() =>
                                    setClubMixerRSVP(!clubMixerRSVP)
                                }
                            >
                                <Text style={styles.rsvpText}>{clubMixerRSVP ? "RSVP'd" : "RSVP"}</Text>
                            </Pressable>

                            <View style={styles.eventCategory}>
                                <Text style={styles.eventCategoryText}>Social</Text>
                            </View>
                        </View>
                    </View>

                    {/* Stem Symposium card */}
                    <View style={styles.eventCard}>
                        <View style={styles.eventTop}>
                            <View style={styles.eventInfo}>
                                <Text style={styles.eventTitle}>STEM Symposium</Text>
                                <Text style={styles.clubName}>Engineering Society</Text>
                            </View>

                            <View style={styles.dateBadge}>
                                <Text style={styles.dateMonth}>Oct</Text>
                                <Text style={styles.dateDay}>21</Text>
                            </View>
                        </View>

                        <Text style={styles.detailText}>🕙 10:00 AM - 12:00 PM</Text>
                        <Text style={styles.detailText}>📍 Anna Rubin, Rm 301</Text>

                        <View style={styles.eventBottom}>
                            <Pressable
                                style={[
                                    styles.rsvpButton,
                                    stemRSVP && styles.rsvpActiveButton,
                                ]}
                                onPress={() => setStemRSVP(!stemRSVP)}
                            >
                                <Text style={styles.rsvpText}>{stemRSVP ? "RSVP'd" : "RSVP"}</Text>
                            </Pressable>

                            <View style={styles.eventCategory}>
                                <Text style={styles.eventCategoryText}>Academic</Text>
                            </View>
                        </View>
                    </View>

                    {/* Open Mic Night card */}
                    <View style={styles.eventCard}>
                        <View style={styles.eventTop}>
                            <View style={styles.eventInfo}>
                                <Text style={styles.eventTitle}>Open Mic Night</Text>
                                <Text style={styles.clubName}> Theatre Club</Text>
                            </View>

                            <View style={styles.dateBadge}>
                                <Text style={styles.dateMonth}>Nov</Text>
                                <Text style={styles.dateDay}>5</Text>
                            </View>
                        </View>

                        <Text style={styles.detailText}>🕖 7:00 PM - 10:00</Text>
                        <Text style={styles.detailText}>📍 Auditorium</Text>

                        <View style={styles.eventBottom}>
                            <Pressable
                                style={[
                                    styles.rsvpButton,
                                    openMicRSVP && styles.rsvpActiveButton,
                                ]}
                                onPress={() => setOpenMicRSVP(!openMicRSVP)}
                            >
                                <Text style={styles.rsvpText}>{openMicRSVP ? "RSVP'd" : "RSVP"}</Text>
                            </Pressable>

                            <View style={styles.eventCategory}>
                                <Text style={styles.eventCategoryText}>Arts</Text>
                            </View>
                        </View>
                    </View>

                </>
            ) : (
                <>
                    {/* CALENDAR VIEW */}

                    <View style={styles.calendarCard}>
                        <View style={styles.calendarHeader}>
                            <Pressable>
                                <Text style={styles.calendarArrow}>‹</Text>
                            </Pressable>

                            <Text style={styles.calendarMonth}>October 2026</Text>

                            <Pressable>
                                <Text style={styles.calendarArrow}>›</Text>
                            </Pressable>
                        </View>

                        <View style={styles.weekRow}>
                            <Text style={styles.weekDay}>Sun</Text>
                            <Text style={styles.weekDay}>Mon</Text>
                            <Text style={styles.weekDay}>Tue</Text>
                            <Text style={styles.weekDay}>Wed</Text>
                            <Text style={styles.weekDay}>Thu</Text>
                            <Text style={styles.weekDay}>Fri</Text>
                            <Text style={styles.weekDay}>Sat</Text>
                        </View>

                        <View style={styles.weekRow}>
                            <Text style={styles.emptyDay}></Text>
                            <Text style={styles.emptyDay}></Text>
                            <Text style={styles.emptyDay}></Text>
                            <Text style={styles.calendarDay}>1</Text>
                            <Text style={styles.calendarDay}>2</Text>
                            <Text style={styles.calendarDay}>3</Text>
                            <Text style={styles.calendarDay}>4</Text>
                        </View>

                        <View style={styles.weekRow}>
                            <Text style={styles.calendarDay}>5</Text>

                            <View style={styles.eventDay}>
                                <Text style={styles.eventDayText}>6</Text>
                            </View>

                            <Text style={styles.calendarDay}>7</Text>
                            <Text style={styles.calendarDay}>8</Text>
                            <Text style={styles.calendarDay}>9</Text>
                            <Text style={styles.calendarDay}>10</Text>

                            <View style={styles.eventDay}>
                                <Text style={styles.eventDayText}>11</Text>
                            </View>
                        </View>

                        <View style={styles.weekRow}>
                            <Text style={styles.calendarDay}>12</Text>
                            <Text style={styles.calendarDay}>13</Text>
                            <Text style={styles.calendarDay}>14</Text>
                            <Text style={styles.calendarDay}>15</Text>
                            <Text style={styles.calendarDay}>16</Text>
                            <Text style={styles.calendarDay}>17</Text>

                            <View style={styles.eventDay}>
                                <Text style={styles.eventDayText}>18</Text>
                            </View>
                        </View>

                        <View style={styles.weekRow}>
                            <Text style={styles.calendarDay}>19</Text>
                            <Text style={styles.calendarDay}>20</Text>
                            <Text style={styles.calendarDay}>21</Text>
                            <Text style={styles.calendarDay}>22</Text>
                            <Text style={styles.calendarDay}>23</Text>
                            <Text style={styles.calendarDay}>24</Text>
                            <Text style={styles.calendarDay}>25</Text>
                        </View>

                        <View style={styles.weekRow}>
                            <Text style={styles.calendarDay}>26</Text>
                            <Text style={styles.calendarDay}>27</Text>
                            <Text style={styles.calendarDay}>28</Text>
                            <Text style={styles.calendarDay}>29</Text>
                            <Text style={styles.calendarDay}>30</Text>
                            <Text style={styles.calendarDay}>31</Text>
                            <Text style={styles.emptyDay}></Text>
                        </View>
                    </View>
                </>
            )}
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
        paddingHorizontal: 20,
        paddingBottom: 35,
    },

    headerTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    headerTitle: {
        color: "#FFFFFF",
        fontSize: 26,
        fontWeight: "bold",
    },

    bellIcon: {
        color: "#FFFFFF",
        fontSize: 24,
    },

    viewToggle: {
        marginTop: 25,
        flexDirection: "row",
        backgroundColor: "#2467BD",
        borderRadius: 10,
        padding: 4,
    },

    activeToggle: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: "center",
    },

    inactiveToggle: {
        flex: 1,
        paddingVertical: 10,
        alignItems: "center",
    },

    activeToggleText: {
        color: "#0B55B7",
        fontWeight: "600",
    },

    inactiveToggleText: {
        color: "#FFFFFF",
        fontWeight: "600",
    },

    searchCard: {
        backgroundColor: "#FFFFFF",
        marginHorizontal: 20,
        marginTop: -10,
        padding: 14,
        borderRadius: 15,

        shadowColor: "#000000",
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: {
            width: 0,
            height: 3,
        },

        elevation: 4,
    },

    searchBar: {
        flexDirection: "row",
        alignItems: "center",
    },

    searchIcon: {
        fontSize: 20,
        marginRight: 10,
    },

    searchInput: {
        flex: 1,
        fontSize: 16,
        color: "#171717",
        letterSpacing: 0,
    },

    filterIcon: {
        fontSize: 20,
        color: "#777B8A",
    },

    categoryRow: {
        marginTop: 15,
        gap: 8,
    },

    categoryButton: {
        backgroundColor: "#F1F1F3",
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 15,
    },

    activeCategoryButton: {
        backgroundColor: "#0B55B7",
    },

    categoryText: {
        color: "#171717",
        fontSize: 13,
        fontWeight: "500",
    },

    activeCategoryText: {
        color: "#FFFFFF",
    },

    sectionTitle: {
        marginHorizontal: 20,
        marginTop: 25,
        marginBottom: 12,
        fontSize: 20,
        fontWeight: "bold",
        color: "#171717",
    },

    eventCard: {
        marginHorizontal: 20,
        marginBottom: 14,
        padding: 16,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: "#E2E2E5",
        backgroundColor: "#FFFFFF",
    },

    eventTop: {
        flexDirection: "row",
        justifyContent: "space-between",
    },

    eventInfo: {
        flex: 1,
        paddingRight: 10,
    },

    eventTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#171717",
    },

    clubName: {
        fontSize: 14,
        color: "#777B8A",
        marginTop: 4,
        marginBottom: 14,
    },

    dateBadge: {
        backgroundColor: "#E9EEF9",
        width: 48,
        height: 55,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },

    dateMonth: {
        color: "#0B55B7",
        fontSize: 12,
    },

    dateDay: {
        color: "#0B55B7",
        fontSize: 16,
        fontWeight: "600",
    },

    detailText: {
        fontSize: 14,
        color: "#777B8A",
        marginTop: 5,
    },

    eventBottom: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginTop: 15,
    },

    rsvpButton: {
        flex: 1,
        backgroundColor: "#0B55B7",
        paddingVertical: 11,
        borderRadius: 9,
        alignItems: "center",
    },

    rsvpActiveButton: {
        backgroundColor: "#6C8FC4",
    },

    rsvpText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "600",
    },

    eventCategory: {
        borderWidth: 1,
        borderColor: "#E2E2E5",
        borderRadius: 9,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },

    eventCategoryText: {
        color: "#777B8A",
        fontSize: 13,
    },

    calendarCard: {
        marginHorizontal: 20,
        marginTop: 25,
        padding: 18,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E2E2E5",
        borderRadius: 16,
    },

    calendarHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 22,
    },

    calendarMonth: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#171717",
    },

    calendarArrow: {
        fontSize: 30,
        color: "#0B55B7",
    },

    weekRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 14,
    },

    weekDay: {
        width: 38,
        textAlign: "center",
        fontSize: 12,
        fontWeight: "600",
        color: "#777B8A",
    },

    calendarDay: {
        width: 38,
        height: 38,
        textAlign: "center",
        lineHeight: 38,
        color: "#171717",
        fontSize: 14,
    },

    emptyDay: {
        width: 38,
        height: 38,
    },

    eventDay: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: "#0B55B7",
        alignItems: "center",
        justifyContent: "center",
    },

    eventDayText: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "600",
    },

    calendarEventCard: {
        marginHorizontal: 20,
        marginBottom: 12,
        padding: 15,
        borderWidth: 1,
        borderColor: "#E2E2E5",
        borderRadius: 12,
        flexDirection: "row",
        alignItems: "center",
    },

    calendarDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: "#0B55B7",
        marginRight: 12,
    },

    calendarEventTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#171717",
    },

    calendarEventInfo: {
        fontSize: 13,
        color: "#777B8A",
        marginTop: 3,
    },
});
