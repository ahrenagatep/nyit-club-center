import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { NotificationBell } from "@/components/notification-bell";

import {
  CategoryChip,
  ClubRow,
  EmptyState,
  EventCard,
  openClub,
} from "@/components/club-cards";
import type { ThemeColors } from "@/constants/theme";
import {
  CATEGORIES,
  CLUBS,
  CURRENT_USER,
  getMemberCount,
  getMembershipRoleLabel,
  getUpcomingEvents,
  type Category,
} from "@/data/mock-data";

import { useClubs } from "@/lib/clubs";

import { useAppState } from "@/state/app-state";
import { useAuth } from "@/state/auth";
import { useTheme, useThemedStyles } from "@/state/theme";

// How many upcoming events to preview on Home; "View all" opens the Events tab.
const HOME_EVENT_LIMIT = 2;

// Opens the Explore tab, optionally pre-filtered, pre-searched, or with the sort panel open.
function openExplore(
  params: { category?: Category; q?: string; filters?: "1" } = {},
) {
  router.navigate({ pathname: "/explore", params });
}

export default function HomeScreen() {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const [search, setSearch] = useState("");
  const { joinedClubIds } = useAppState();
  const { user } = useAuth();

  // backend has no recommendations yet, so just show the first 3 clubs for now
  const { clubs, loading, error } = useClubs();
  const recommendedClubs = clubs.slice(0, 3);

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
            {user?.first_name || CURRENT_USER.first_name}
          </Text>
        </View>

        <View style={styles.headerIcons}>
          <NotificationBell
            style={styles.iconButton}
            pressedStyle={styles.pressed}
            iconStyle={styles.notificationIcon}
          />

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
            placeholderTextColor={colors.placeholder}
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

        <View style={styles.categoryRow}>
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
        </View>
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
        showsHorizontalScrollIndicator={Platform.OS === "web"}
        contentContainerStyle={styles.clubRow}
      >
        {loading && <Text style={styles.recommendedMessage}>Loading clubs...</Text>}
        {!loading && error && (<Text style={styles.recommendedMessage} accessibilityRole="alert">{error}</Text>)}
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

const createStyles = (colors: ThemeColors) => StyleSheet.create({

  recommendedMessage: {
    fontSize: 17,
    color: colors.textMuted,
    marginLeft: 20,
  },

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
    backgroundColor: colors.background,
  },

  content: {
    paddingBottom: 35,
  },

  header: {
    backgroundColor: colors.header,
    paddingTop: 70,
    paddingHorizontal: 26,
    paddingBottom: 88,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  welcomeText: {
    color: colors.onHeader,
    fontSize: 19,
  },

  name: {
    color: colors.onHeader,
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
    backgroundColor: colors.headerButton,
    justifyContent: "center",
    alignItems: "center",
  },

  profileIcon: {
    fontSize: 27,
  },

  searchCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginTop: -38,
    borderRadius: 24,
    padding: 16,

    shadowColor: colors.shadow,
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
    color: colors.text,
    fontSize: 17,
    letterSpacing: 0,
  },

  filterIcon: {
    fontSize: 21,
  },

  // wraps instead of scrolling sideways, so every category fits any screen width
  categoryRow: {
    marginTop: 18,
    flexDirection: "row",
    flexWrap: "wrap",
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
    color: colors.text,
  },

  sectionLink: {
    color: colors.textAccent,
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
    borderColor: colors.border,
    borderRadius: 18,
    padding: 18,
    backgroundColor: colors.surface,
  },

  clubEmoji: {
    fontSize: 37,
    marginBottom: 16,
  },

  clubName: {
    fontSize: 19,
    fontWeight: "600",
    color: colors.text,
  },

  clubMembers: {
    fontSize: 15,
    color: colors.textMuted,
    marginTop: 8,
  },

  tag: {
    marginTop: 12,
    alignSelf: "flex-start",
    backgroundColor: colors.tagBackground,
    borderRadius: 14,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },

  tagText: {
    color: colors.textAccent,
    fontSize: 14,
  },
});
