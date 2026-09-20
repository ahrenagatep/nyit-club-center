import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";

export default function HomeScreen() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome Back,</Text>
          <Text style={styles.name}>Student</Text>
        </View>

        <View style={styles.headerIcons}>
          <Pressable>
            <Text style={styles.notificationIcon}>🔔</Text>
          </Pressable>

          <Pressable style={styles.profileCircle}>
            <Text style={styles.profileIcon}>👤</Text>
          </Pressable>
        </View>
      </View>

      {/* SEARCH & FILTER */}
      <View style={styles.searchCard}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>

          <Text style={styles.searchText}>
            Search clubs, events, people...
          </Text>

          <Pressable>
            <Text style={styles.filterIcon}>⚙️</Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
        >
          <Pressable
            style={[styles.categoryButton, styles.activeCategoryButton]}
          >
            <Text style={styles.activeCategoryText}>All</Text>
          </Pressable>

          <Pressable style={styles.categoryButton}>
            <Text style={styles.categoryText}>Academic</Text>
          </Pressable>

          <Pressable style={styles.categoryButton}>
            <Text style={styles.categoryText}>Sports</Text>
          </Pressable>

          <Pressable style={styles.categoryButton}>
            <Text style={styles.categoryText}>Arts</Text>
          </Pressable>

          <Pressable style={styles.categoryButton}>
            <Text style={styles.categoryText}>Tech</Text>
          </Pressable>
        </ScrollView>
      </View>

      {/* RECOMMENDED FOR YOU */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recommended for You</Text>

        <Pressable>
          <Text style={styles.sectionLink}>See all ,</Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.clubRow}
      >
        <Pressable style={styles.clubCard}>
          <Text style={styles.clubEmoji}>🤖</Text>

          <Text style={styles.clubName}>Robotics Club</Text>

          <Text style={styles.clubMembers}>124 members</Text>

          <View style={styles.tag}>
            <Text style={styles.tagText}>Tech</Text>
          </View>
        </Pressable>

        <Pressable style={styles.clubCard}>
          <Text style={styles.clubEmoji}>📷</Text>

          <Text style={styles.clubName}>Photography Club</Text>

          <Text style={styles.clubMembers}>89 members</Text>

          <View style={styles.tag}>
            <Text style={styles.tagText}>Arts</Text>
          </View>
        </Pressable>

        <Pressable style={styles.clubCard}>
          <Text style={styles.clubEmoji}>🎮</Text>

          <Text style={styles.clubName}>Gaming Club</Text>

          <Text style={styles.clubMembers}>102 members</Text>

          <View style={styles.tag}>
            <Text style={styles.tagText}>Social</Text>
          </View>
        </Pressable>
      </ScrollView>

      {/* UPCOMING EVENTS */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Upcoming Events</Text>

        <Pressable>
          <Text style={styles.sectionLink}>View all ,</Text>
        </Pressable>
      </View>

      <View style={styles.eventCard}>
        <View style={styles.eventTopRow}>
          <View style={styles.eventTextArea}>
            <Text style={styles.eventTitle}>Tech Talk: Rise of AI</Text>

            <Text style={styles.eventClub}>Computer Science Club</Text>
          </View>

          <View style={styles.dateBadge}>
            <Text style={styles.dateText}>Apr 28</Text>
          </View>
        </View>

        <View style={styles.eventDetails}>
          <Text style={styles.detailText}>🕔 5:00 PM</Text>
          <Text style={styles.detailText}>📍 Room 301</Text>
          <Text style={styles.detailText}>👥 35</Text>
        </View>

        <Pressable style={styles.rsvpButton}>
          <Text style={styles.rsvpText}>RSVP</Text>
        </Pressable>
      </View>

      <View style={styles.eventCard}>
        <View style={styles.eventTopRow}>
          <View style={styles.eventTextArea}>
            <Text style={styles.eventTitle}>Fall Concert</Text>

            <Text style={styles.eventClub}>Music Club</Text>
          </View>

          <View style={styles.dateBadge}>
            <Text style={styles.dateText}>Oct 10</Text>
          </View>
        </View>

        <View style={styles.eventDetails}>
          <Text style={styles.detailText}>🕖 7:00 PM</Text>
          <Text style={styles.detailText}>📍 SAC Gym</Text>
          <Text style={styles.detailText}>👥 100</Text>
        </View>

        <Pressable style={styles.rsvpButton}>
          <Text style={styles.rsvpText}>RSVP</Text>
        </Pressable>
      </View>

      {/* YOUR CLUBS */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Your Clubs</Text>

        <Pressable>
          <Text style={styles.sectionLink}>View all ›</Text>
        </Pressable>
      </View>

      <View style={styles.yourClubCard}>
        <Text style={styles.clubEmoji}>💻</Text>

        <View style={styles.yourClubText}>
          <Text style={styles.clubName}>Computer Science Club</Text>

          <Text style={styles.clubMembers}>Member</Text>
        </View>
      </View>

      <View style={styles.yourClubCard}>
        <Text style={styles.clubEmoji}>🎨</Text>

        <View style={styles.yourClubText}>
          <Text style={styles.clubName}>Arts Club</Text>

          <Text style={styles.clubMembers}>Member</Text>
        </View>
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
    paddingBottom: 35,
  },

  header: {
    backgroundColor: "#0B55B7",
    paddingTop: 70,
    paddingHorizontal: 26,
    paddingBottom: 88,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  welcomeText: {
    color: "#FFFFFF",
    fontSize: 19,
  },

  name: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "bold",
    marginTop: 4,
  },

  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
  },

  notificationIcon: {
    fontSize: 27,
  },

  profileCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "rgba(255,255,255,0.20)",
    justifyContent: "center",
    alignItems: "center",
  },

  profileIcon: {
    fontSize: 27,
  },

  searchCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginTop: -38,
    borderRadius: 24,
    padding: 16,

    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },

    elevation: 5,
  },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
  },

  searchIcon: {
    fontSize: 22,
    marginRight: 10,
  },

  searchText: {
    flex: 1,
    color: "#747887",
    fontSize: 17,
  },

  filterIcon: {
    fontSize: 21,
  },

  categoryRow: {
    marginTop: 18,
    gap: 10,
  },

  categoryButton: {
    backgroundColor: "#F1F1F3",
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 16,
  },

  activeCategoryButton: {
    backgroundColor: "#0B55B7",
  },

  categoryText: {
    color: "#1C1C1E",
    fontSize: 16,
    fontWeight: "600",
  },

  activeCategoryText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  sectionHeader: {
    marginTop: 30,
    marginBottom: 15,
    marginHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#171717",
  },

  sectionLink: {
    color: "#0B55B7",
    fontSize: 17,
    fontWeight: "600",
  },

  clubRow: {
    paddingHorizontal: 20,
    gap: 14,
  },

  clubCard: {
    width: 190,
    minHeight: 230,
    borderWidth: 1,
    borderColor: "#E2E2E5",
    borderRadius: 18,
    padding: 18,
    backgroundColor: "#FFFFFF",
  },

  clubEmoji: {
    fontSize: 37,
    marginBottom: 16,
  },

  clubName: {
    fontSize: 19,
    fontWeight: "600",
    color: "#171717",
  },

  clubMembers: {
    fontSize: 15,
    color: "#747887",
    marginTop: 8,
  },

  tag: {
    marginTop: 12,
    alignSelf: "flex-start",
    backgroundColor: "#DDEEFF",
    borderRadius: 14,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },

  tagText: {
    color: "#0B55B7",
    fontSize: 14,
  },

  eventCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E2E5",
    borderRadius: 18,
    padding: 20,
    backgroundColor: "#FFFFFF",
  },

  eventTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  eventTextArea: {
    flex: 1,
    paddingRight: 12,
  },

  eventTitle: {
    color: "#171717",
    fontSize: 19,
    fontWeight: "600",
  },

  eventClub: {
    color: "#747887",
    fontSize: 15,
    marginTop: 6,
  },

  dateBadge: {
    backgroundColor: "#E7EFFB",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 18,
  },

  dateText: {
    color: "#0B55B7",
    fontSize: 15,
    fontWeight: "500",
  },

  eventDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginTop: 20,
  },

  detailText: {
    color: "#747887",
    fontSize: 14,
  },

  rsvpButton: {
    backgroundColor: "#0B55B7",
    paddingVertical: 14,
    borderRadius: 13,
    alignItems: "center",
    marginTop: 20,
  },

  rsvpText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "bold",
  },

  yourClubCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E2E5",
    borderRadius: 18,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },

  yourClubText: {
    marginLeft: 14,
    flex: 1,
  },
});