import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import { router } from "expo-router";

import {
  CategoryChip,
  ClubRow,
  EmptyState,
  EventCard,
  openClub,
} from "@/components/club-cards";
import {
  CATEGORIES,
  CLUBS,
  CURRENT_USER,
  getMemberCount,
  getMembershipRoleLabel,
  RECOMMENDED_CLUB_IDS,
  getClubById,
  getUpcomingEvents,
  type Category,
  type Club,
} from "@/data/mock-data";
import { useAppState } from "@/state/app-state";

// How many upcoming events to preview on Home; "View all" opens the Events tab.
const HOME_EVENT_LIMIT = 2;

// Opens the Explore tab, optionally pre-filtered, pre-searched, or with the sort panel open.
function openExplore(
  params: { category?: Category; q?: string; filters?: "1" } = {},
) {
  router.navigate({ pathname: "/explore", params });
}

export default function HomeScreen() {
  const [search, setSearch] = useState("");
  const { joinedClubIds } = useAppState();

  const recommendedClubs = RECOMMENDED_CLUB_IDS.map(getClubById).filter(
    (club): club is Club => club !== undefined,
  );
  const upcomingEvents = getUpcomingEvents().slice(0, HOME_EVENT_LIMIT);
  const yourClubs = CLUBS.filter((club) =>
    joinedClubIds.includes(club.club_id),
  );

  // Search runs on Explore so Home stays a preview; the box clears for next time.
  const submitSearch = () => {
    const q = search.trim();
    openExplore(q ? { q } : {});
    setSearch("");
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome Back,</Text>
          <Text style={styles.name} accessibilityRole="header">
            {CURRENT_USER.first_name}
          </Text>
        </View>

        <View style={styles.headerIcons}>
          <Pressable
            onPress={() => router.push("/notifications")}
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.pressed,
            ]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
          >
            <Text style={styles.notificationIcon}>🔔</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push("/profile")}
            style={({ pressed }) => [
              styles.profileCircle,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Your profile"
          >
            <Text style={styles.profileIcon}>👤</Text>
          </Pressable>
        </View>
      </View>

      {/* SEARCH & FILTER */}
      {/* Displays the search bar and club category buttons */}
      <View style={styles.searchCard}>
        <View style={styles.searchBar}>
          <Pressable
            onPress={submitSearch}
            style={({ pressed }) => [
              styles.searchIconButton,
              pressed && styles.pressed,
            ]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Search"
            accessibilityHint="Shows matching clubs and events on the Explore tab"
          >
            <Text style={styles.searchIcon}>🔍</Text>
          </Pressable>

          <TextInput
            style={styles.searchText}
            placeholder="Search clubs, events, people..."
            placeholderTextColor="#696C7A"
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={submitSearch}
            returnKeyType="search"
            autoCorrect={false}
            accessibilityLabel="Search clubs, events, people"
          />

          <Pressable
            onPress={() => openExplore({ filters: "1" })}
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.pressed,
            ]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Filter and sort clubs"
          >
            <Text style={styles.filterIcon}>▽</Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
        >
          <CategoryChip
            label="All"
            accessibilityLabel="All clubs"
            active
            onPress={() => openExplore()}
          />

          {CATEGORIES.map((category) => (
            <CategoryChip
              key={category}
              label={category}
              accessibilityLabel={`${category} clubs`}
              active={false}
              onPress={() => openExplore({ category })}
            />
          ))}
        </ScrollView>
      </View>

      {/* RECOMMENDED FOR YOU */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle} accessibilityRole="header">
          Recommended for You
        </Text>

        <Pressable
          onPress={() => openExplore()}
          style={styles.linkButton}
          hitSlop={8}
          accessibilityRole="link"
          accessibilityLabel="See all clubs"
        >
          <Text style={styles.sectionLink}>See all ›</Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.clubRow}
      >
        {recommendedClubs.map((club) => {
          const members = getMemberCount(
            club,
            joinedClubIds.includes(club.club_id),
          );

          return (
            <Pressable
              key={club.club_id}
              onPress={() => openClub(club.club_id)}
              style={({ pressed }) => [
                styles.clubCard,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${club.name}, ${members} members, ${club.category}`}
              accessibilityHint="Opens the club page"
            >
              <Text style={styles.clubEmoji}>{club.emoji}</Text>

              <Text style={styles.clubName}>{club.name}</Text>

              <Text style={styles.clubMembers}>{members} members</Text>

              <View style={styles.tag}>
                <Text style={styles.tagText}>{club.category}</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* UPCOMING EVENTS */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle} accessibilityRole="header">
          Upcoming Events
        </Text>

        <Pressable
          onPress={() => router.navigate("/events")}
          style={styles.linkButton}
          hitSlop={8}
          accessibilityRole="link"
          accessibilityLabel="View all events"
        >
          <Text style={styles.sectionLink}>View all ›</Text>
        </Pressable>
      </View>

      {upcomingEvents.map((event) => (
        <EventCard key={event.event_id} event={event} />
      ))}

      {/* YOUR CLUBS */}
      {/* Shows clubs that the student has already joined */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle} accessibilityRole="header">
          Your Clubs
        </Text>

        <Pressable
          onPress={() => router.push("/my-clubs")}
          style={styles.linkButton}
          hitSlop={8}
          accessibilityRole="link"
          accessibilityLabel="View all of your clubs"
        >
          <Text style={styles.sectionLink}>View all ›</Text>
        </Pressable>
      </View>

      {yourClubs.length === 0 ? (
        <EmptyState
          emoji="🔍"
          title="You haven't joined any clubs yet"
          message="Tap See all above to browse clubs."
        />
      ) : (
        yourClubs.map((club) => (
          <ClubRow
            key={club.club_id}
            club={club}
            subtitle={getMembershipRoleLabel(club.club_id)}
          />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.7,
  },

  iconButton: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },

  searchIconButton: {
    minHeight: 44,
    justifyContent: "center",
  },

  linkButton: {
    minHeight: 44,
    justifyContent: "center",
  },

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
    minHeight: 44,
    color: "#171717",
    fontSize: 17,
    letterSpacing: 0,
  },

  filterIcon: {
    fontSize: 21,
  },

  categoryRow: {
    marginTop: 18,
    gap: 10,
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
    color: "#696C7A",
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
});
