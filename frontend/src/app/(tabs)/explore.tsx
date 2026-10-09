import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { NotificationBell } from "@/components/notification-bell";

import { EmptyState, EventCard, openClub } from "@/components/club-cards";
import {
  CATEGORIES,
  CLUBS,
  TRENDING_CLUB_IDS,
  getClubById,
  getMemberCount,
  getUpcomingEvents,
  isCategory,
  searchClubs,
  type Club,
} from "@/data/mock-data";
import { useAppState } from "@/state/app-state";

type SortOption = "name" | "members" | "rating";

const SORT_LABELS: Record<SortOption, string> = {
  name: "Name (A–Z)",
  members: "Most members",
  rating: "Top rated",
};

/**
 * Explore tab: browse, search, and filter clubs (FR-2).
 *
 * Home drives it through route params:
 *   category=<Category>  pre-selects a category chip
 *   q=<text>             fills in the search box (Home's search bar)
 *   filters=1            opens the sort panel (Home's ▽ button)
 * `q` and `filters` are one-shot and cleared after they're applied.
 */
export default function ExploreScreen() {
  const params = useLocalSearchParams<{
    category?: string;
    q?: string;
    filters?: string;
  }>();
  const category = isCategory(params.category) ? params.category : null;

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("name");
  const [showFilters, setShowFilters] = useState(false);
  const { isJoined, toggleJoin, joinedClubIds } = useAppState();

  const scrollRef = useRef<ScrollView>(null);
  const discoverY = useRef(0);

  useEffect(() => {
    if (params.q !== undefined) {
      setSearch(params.q);
      router.setParams({ q: undefined });
    }
  }, [params.q]);

  useEffect(() => {
    if (params.filters === "1") {
      setShowFilters(true);
      router.setParams({ filters: undefined });
    }
  }, [params.filters]);

  const query = search.trim();
  // "Your Clubs" and "Trending" only show while browsing, not while filtering.
  const browsing = query === "" && category === null;

  const yourClubs = CLUBS.filter((club) =>
    joinedClubIds.includes(club.club_id),
  );
  const trendingClubs = TRENDING_CLUB_IDS.map(getClubById).filter(
    (club): club is Club => club !== undefined,
  );

  const discoverClubs = useMemo(() => {
    const results = [...searchClubs(query, category)];
    if (sort === "members") {
      return results.sort((a, b) => b.member_count - a.member_count);
    }
    if (sort === "rating") {
      return results.sort((a, b) => b.rating - a.rating);
    }
    return results.sort((a, b) => a.name.localeCompare(b.name));
  }, [query, category, sort]);

  // Upcoming events whose title or host club matches the search text.
  const matchingEvents = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return [];
    return getUpcomingEvents().filter((event) => {
      const club = getClubById(event.club_id);
      const inCategory = category === null || club?.category === category;
      const matches =
        event.title.toLowerCase().includes(q) ||
        (club?.name.toLowerCase().includes(q) ?? false);
      return inCategory && matches;
    });
  }, [query, category]);

  const selectCategory = (next: string | null) => {
    router.setParams({ category: next ?? undefined });
  };

  // Trending → "See all": rank every club by rating and jump to the list.
  const showAllTrending = () => {
    setSort("rating");
    scrollRef.current?.scrollTo({ y: discoverY.current, animated: true });
  };

  const categoryChips: { label: string; value: string | null }[] = [
    { label: "All", value: null },
    ...CATEGORIES.map((item) => ({ label: item, value: item })),
  ];

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle} accessibilityRole="header">
          Explore Clubs
        </Text>

        <NotificationBell
          style={styles.iconButton}
          pressedStyle={styles.pressed}
          iconStyle={styles.notificationIcon}
        />
      </View>

      {/* Search */}
      <View style={styles.searchCard}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon} importantForAccessibility="no">
            🔍
          </Text>

          <TextInput
            style={styles.searchInput}
            placeholder="Search clubs and events..."
            placeholderTextColor="#696C7A"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            autoCorrect={false}
            clearButtonMode="while-editing"
            accessibilityLabel="Search clubs and events"
          />

          <Pressable
            onPress={() => setShowFilters((open) => !open)}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityState={{ expanded: showFilters }}
            accessibilityLabel="Sort clubs"
          >
            <Text style={styles.filterIcon}>▽</Text>
          </Pressable>
        </View>

        {/* Sort options (▽) */}
        {showFilters && (
          <View style={styles.sortPanel}>
            <Text style={styles.sortLabel}>Sort by</Text>
            <View style={styles.sortRow}>
              {(Object.keys(SORT_LABELS) as SortOption[]).map((option) => (
                <Pressable
                  key={option}
                  onPress={() => setSort(option)}
                  style={({ pressed }) => [
                    styles.categoryButton,
                    sort === option && styles.activeCategoryButton,
                    pressed && styles.pressed,
                  ]}
                  hitSlop={4}
                  accessibilityRole="button"
                  accessibilityState={{ selected: sort === option }}
                  accessibilityLabel={`Sort by ${SORT_LABELS[option]}`}
                >
                  <Text
                    style={
                      sort === option
                        ? styles.activeCategoryText
                        : styles.categoryText
                    }
                  >
                    {SORT_LABELS[option]}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* category Buttons */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
        >
          {categoryChips.map(({ label, value }) => {
            const active = category === value;
            return (
              <Pressable
                key={label}
                onPress={() => selectCategory(value)}
                style={({ pressed }) => [
                  styles.categoryButton,
                  active && styles.activeCategoryButton,
                  pressed && styles.pressed,
                ]}
                hitSlop={4}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`${label} clubs`}
              >
                <Text
                  style={active ? styles.activeCategoryText : styles.categoryText}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {browsing && (
        <>
          {/* Your Clubs */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle} accessibilityRole="header">
              Your Clubs
            </Text>

            <Pressable
              onPress={() => router.push("/my-clubs")}
              style={styles.linkButton}
              hitSlop={8}
              accessibilityRole="link"
              accessibilityLabel="See all of your clubs"
            >
              <Text style={styles.sectionLink}>See all ›</Text>
            </Pressable>
          </View>

          {yourClubs.length === 0 ? (
            <Text style={styles.emptyRowText}>
              Clubs you join will show up here.
            </Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalCards}
            >
              {yourClubs.map((club) => {
                const members = getMemberCount(club, true);
                return (
                  <Pressable
                    key={club.club_id}
                    onPress={() => openClub(club.club_id)}
                    style={({ pressed }) => [
                      styles.smallClubCard,
                      pressed && styles.pressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`${club.name}, ${members} members, ${club.category}`}
                    accessibilityHint="Opens the club page"
                  >
                    <Text style={styles.clubEmoji}>{club.emoji}</Text>
                    <Text style={styles.smallClubName}>{club.name}</Text>
                    <Text style={styles.clubMembers}>{members} members</Text>

                    <View style={styles.tag}>
                      <Text style={styles.tagText}>{club.category}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          {/* Trending */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle} accessibilityRole="header">
              Trending
            </Text>

            <Pressable
              onPress={showAllTrending}
              style={styles.linkButton}
              hitSlop={8}
              accessibilityRole="link"
              accessibilityLabel="See all clubs, top rated first"
            >
              <Text style={styles.sectionLink}>See all ›</Text>
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalCards}
          >
            {trendingClubs.map((club) => {
              const members = getMemberCount(club, isJoined(club.club_id));
              return (
                <Pressable
                  key={club.club_id}
                  onPress={() => openClub(club.club_id)}
                  style={({ pressed }) => [
                    styles.trendingCard,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`${club.name}, rated ${club.rating}, ${members} members`}
                  accessibilityHint="Opens the club page"
                >
                  <Text style={styles.clubEmoji}>{club.emoji}</Text>
                  <Text style={styles.trendingName}>{club.name}</Text>
                  <Text style={styles.clubDescription} numberOfLines={3}>
                    {club.description}
                  </Text>
                  <Text style={styles.trendingInfo}>
                    ⭐ {club.rating.toFixed(1)}  •  {members} members
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </>
      )}

      {/* All Clubs */}
      <View
        style={styles.sectionHeader}
        onLayout={(e) => {
          discoverY.current = e.nativeEvent.layout.y;
        }}
      >
        <Text style={styles.sectionTitle} accessibilityRole="header">
          Discover Clubs
        </Text>

        {!browsing && (
          <Text style={styles.resultCount} accessibilityLiveRegion="polite">
            {discoverClubs.length}{" "}
            {discoverClubs.length === 1 ? "club" : "clubs"}
            {category ? ` in ${category}` : ""}
          </Text>
        )}
      </View>

      {discoverClubs.length === 0 ? (
        <EmptyState
          emoji="🔍"
          title="No clubs found"
          message="Try a different search or pick another category."
        />
      ) : (
        discoverClubs.map((club) => {
          const joined = isJoined(club.club_id);
          const members = getMemberCount(club, joined);

          return (
            <View key={club.club_id} style={styles.largeClubCard}>
              <View
                style={styles.clubTopRow}
                accessible
                accessibilityLabel={`${club.name}. ${club.description} ${members} members, rated ${club.rating}, ${club.category}`}
              >
                <View style={styles.largeEmojiBox}>
                  <Text style={styles.largeEmoji}>{club.emoji}</Text>
                </View>

                <View style={styles.clubInformation}>
                  <Text style={styles.largeClubName}>{club.name}</Text>
                  <Text style={styles.clubDescription}>{club.description}</Text>

                  <View style={styles.clubStats}>
                    <Text style={styles.statText}>👥 {members} members</Text>
                    <Text style={styles.statText}>
                      ⭐ {club.rating.toFixed(1)}
                    </Text>
                  </View>

                  <View style={styles.tag}>
                    <Text style={styles.tagText}>{club.category}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.actionRow}>
                <Pressable
                  style={({ pressed }) => [
                    styles.joinButton,
                    joined && styles.leaveButton,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => toggleJoin(club.club_id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: joined }}
                  accessibilityLabel={
                    joined ? `Leave ${club.name}` : `Join ${club.name}`
                  }
                >
                  <Text
                    style={[
                      styles.joinButtonText,
                      joined && styles.leaveButtonText,
                    ]}
                  >
                    {joined ? "Leave" : "Join"}
                  </Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.viewButton,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => openClub(club.club_id)}
                  accessibilityRole="button"
                  accessibilityLabel={`View ${club.name}`}
                >
                  <Text style={styles.viewButtonText}>View</Text>
                </Pressable>
              </View>
            </View>
          );
        })
      )}

      {/* Events matching the search */}
      {matchingEvents.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle} accessibilityRole="header">
              Events
            </Text>
          </View>

          {matchingEvents.map((event) => (
            <EventCard key={event.event_id} event={event} />
          ))}
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

  pressed: {
    opacity: 0.7,
  },

  iconButton: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },

  linkButton: {
    minHeight: 44,
    justifyContent: "center",
  },

  header: {
    backgroundColor: "#0B55B7",
    paddingTop: 70,
    paddingBottom: 75,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "bold",
  },

  notificationIcon: {
    fontSize: 27,
  },

  searchCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginTop: -35,
    borderRadius: 23,
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
    fontSize: 21,
    marginRight: 10,
  },

  searchInput: {
    flex: 1,
    minHeight: 44,
    fontSize: 17,
    color: "#171717",
  },

  filterIcon: {
    fontSize: 21,
  },

  sortPanel: {
    marginTop: 14,
  },

  sortLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#171717",
    marginBottom: 10,
  },

  sortRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  categoryRow: {
    marginTop: 17,
    gap: 10,
  },

  categoryButton: {
    backgroundColor: "#F1F1F3",
    paddingVertical: 10,
    paddingHorizontal: 19,
    borderRadius: 15,
  },

  activeCategoryButton: {
    backgroundColor: "#0B55B7",
  },

  categoryText: {
    color: "#171717",
    fontWeight: "600",
    fontSize: 15,
  },

  activeCategoryText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 15,
  },

  sectionHeader: {
    marginHorizontal: 20,
    marginTop: 30,
    marginBottom: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  sectionTitle: {
    fontSize: 23,
    fontWeight: "bold",
    color: "#171717",
  },

  sectionLink: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0B55B7",
  },

  resultCount: {
    fontSize: 15,
    color: "#696C7A",
  },

  emptyRowText: {
    marginHorizontal: 20,
    fontSize: 15,
    color: "#696C7A",
  },

  horizontalCards: {
    paddingHorizontal: 20,
    gap: 14,
  },

  smallClubCard: {
    width: 180,
    minHeight: 205,
    padding: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E2E5",
    borderRadius: 18,
  },

  clubEmoji: {
    fontSize: 37,
    marginBottom: 15,
  },

  smallClubName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#171717",
  },

  clubMembers: {
    color: "#696C7A",
    fontSize: 14,
    marginTop: 8,
  },

  tag: {
    alignSelf: "flex-start",
    marginTop: 10,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 13,
    backgroundColor: "#DDEEFF",
  },

  tagText: {
    color: "#0B55B7",
    fontSize: 13,
    fontWeight: "500",
  },

  trendingCard: {
    width: 240,
    minHeight: 220,
    padding: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E2E5",
    borderRadius: 18,
  },

  trendingName: {
    fontSize: 19,
    fontWeight: "600",
    color: "#171717",
    marginBottom: 7,
  },

  clubDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: "#696C7A",
  },

  trendingInfo: {
    marginTop: 15,
    fontSize: 14,
    color: "#696C7A",
  },

  largeClubCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E2E2E5",
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
  },

  clubTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  largeEmojiBox: {
    width: 65,
    height: 65,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  largeEmoji: {
    fontSize: 33,
  },

  clubInformation: {
    flex: 1,
  },

  largeClubName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#171717",
    marginBottom: 5,
  },

  clubStats: {
    flexDirection: "row",
    gap: 15,
    marginTop: 11,
  },

  statText: {
    fontSize: 13,
    color: "#696C7A",
  },

  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },

  joinButton: {
    flex: 1,
    backgroundColor: "#0B55B7",
    minHeight: 44,
    justifyContent: "center",
    borderRadius: 11,
    alignItems: "center",
  },

  joinButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },

  leaveButton: {
    backgroundColor: "#F1F1F3",
    borderWidth: 1,
    borderColor: "#D5D7DC",
  },

  leaveButtonText: {
    color: "#171717",
  },

  viewButton: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    minHeight: 44,
    justifyContent: "center",
    borderRadius: 11,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#0B55B7",
  },

  viewButtonText: {
    color: "#0B55B7",
    fontWeight: "600",
    fontSize: 16,
  },
});
