import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";

export default function ExploreScreen() {
  const [search, setSearch] = useState("");
  const [joinedRobotics, setJoinedRobotics] = useState(false);
  const [joinedPhotography, setJoinedPhotography] = useState(false);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore Clubs</Text>

        <Pressable>
          <Text style={styles.notificationIcon}>🔔</Text>
        </Pressable>
      </View> 

      {/* Search */}
      <View style={styles.searchCard}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>

          <TextInput
          style={styles.searchInput}
          placeholder="search..."
          placeholderTextColor="#7A7E8C"
          value={search}
          onChangeText={setSearch}
          />

          <Pressable>
            <Text style={styles.filterIcon}>▽</Text>
          </Pressable>  
        </View>

        {/* category Buttons */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
         >
          <Pressable
          style={[
            styles.categoryButton,
            styles.activeCategoryButton,
          ]}
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

      {/* Your Clubs */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}> Your Clubs</Text>

        <Pressable>
          <Text style={styles.sectionLink}>See all ,</Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalCards}
      >
        <View style={styles.smallClubCard}>
          <Text style={styles.clubEmoji}>💻</Text>
          <Text style={styles.smallClubName}>Computer Science Club</Text>
          <Text style={styles.clubMembers}>145 members</Text>

          <View style={styles.tag}>
            <Text style={styles.tagText}>Academic</Text>
          </View>
        </View>

        <View style={styles.smallClubCard}>
          <Text style={styles.clubEmoji}>🎮</Text>
          <Text style={styles.smallClubName}>Gaming Club</Text>
          <Text style={styles.clubMembers}>102 members</Text>

          <View style={styles.tag}>
            <Text style={styles.tagText}>Social</Text>
          </View>
        </View>

        <View style={styles.smallClubCard}>
          <Text style={styles.clubEmoji}>🎨</Text>
          <Text style={styles.smallClubName}>Arts Club</Text>
          <Text style={styles.clubMembers}>84 members</Text>

          <View style={styles.tag}>
            <Text style={styles.tagText}>Arts</Text>
          </View>
        </View>
      </ScrollView>

      {/* Trending */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Trending</Text>

        <Pressable>
          <Text style={styles.sectionLink}>See all ,</Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalCards}
      >
        <View style={styles.trendingCard}>
          <Text style={styles.clubEmoji}>🤖</Text>
          <Text style={styles.trendingName}>Robotics Club</Text>
          <Text style={styles.clubDescription}>Design robots and learn automation</Text>
          <Text style={styles.trendingInfo}>⭐️ 4.8  •  15 members</Text>
        </View>

        <View style={styles.trendingCard}>
          <Text style={styles.clubEmoji}>📷</Text>
          <Text style={styles.trendingName}>Photography Club</Text>
          <Text style={styles.clubDescription}>Learn photography and capture campus life.</Text>
          <Text style={styles.trendingInfo}>⭐ 4.2  •  25 members</Text>
        </View>
      </ScrollView>

      {/* All Clubs */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Discover Clubs</Text>
      </View>

      {/* Robitics */}
      <View style={styles.largeClubCard}>
        <View style={styles.clubTopRow}>
          <View style={styles.largeEmojiBox}>
            <Text style={styles.largeEmoji}>🤖</Text>
          </View>

          <View style={styles.clubInformation}>
            <Text style={styles.largeClubName}>Robotics Club</Text>
            <Text style={styles.clubDescription}>Build robots, learn programming, and compete in engineering challenges.</Text>

            <View style={styles.clubStats}>
              <Text style={styles.statText}>👥 124 members</Text>
              <Text style={styles.statText}> ⭐ 4.9</Text>
            </View>

            <View style={styles.tag}>
              <Text style={styles.tagText}>Tech</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionRow}>
          <Pressable 
          style={[
            styles.joinButton,
            joinedRobotics && styles.leaveButton,
          ]}
          onPress={() =>
            setJoinedRobotics(!joinedRobotics) 
          }
        >
          <Text
            style={[
              styles.joinButtonText,
              joinedRobotics && styles.leaveButtonText,
            ]}
          >
            {joinedRobotics ? "Leave" : "Join"}
            </Text>  
          </Pressable>

          <Pressable style={styles.viewButton}>
            <Text style={styles.viewButtonText}>View</Text>
          </Pressable>  
        </View>
      </View>

      {/* Photography */}
      <View style={styles.largeClubCard}>
        <View style={styles.clubTopRow}>
          <View style={styles.largeEmojiBox}>
            <Text style={styles.largeEmoji}>📷</Text>
          </View>

          <View style={styles.clubInformation}>
            <Text style={styles.largeClubName}>Photography Club</Text>
            <Text style={styles.clubDescription}>Learn photography, edit photos, and explore creative visual storytelling.</Text>

            <View style={styles.clubStats}>
              <Text style={styles.statText}>👥 30 members</Text>
              <Text style={styles.statText}>⭐ 3.8</Text>
            </View>

            <View style={styles.tag}>
              <Text style={styles.tagText}>Arts</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionRow}>
          <Pressable
            style={[
              styles.joinButton,
              joinedPhotography && styles.leaveButton,
            ]}
            onPress={() =>
              setJoinedPhotography(!joinedPhotography)
            }
          >
            <Text
              style={[
                styles.joinButtonText,
                joinedPhotography && styles.leaveButtonText,
              ]}
            >
              {joinedPhotography ? "Leave" : "Join"}
            </Text>
          </Pressable>

          <Pressable style={styles.viewButton}>
            <Text style={styles.viewButtonText}>View</Text>
          </Pressable>
        </View>
      </View>

      {/* Debate */}
      <View style={styles.largeClubCard}>
        <View style={styles.clubTopRow}>
          <View style={styles.largeEmojiBox}>
            <Text style={styles.largeEmoji}>🎤</Text>
          </View>

          <View style={styles.clubInformation}>
            <Text style={styles.largeClubName}>Debate Team</Text>
            <Text style={styles.clubDescription}>Practice public speaking, debate topics, and participate in competitions</Text>

            <View style={styles.clubStats}>
              <Text style={styles.statText}>👥 56 members</Text>
              <Text style={styles.statText}>⭐ 3.4</Text>
            </View>

            <View style={styles.tag}>
              <Text style={styles.tagText}>Academic</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionRow}>
          <Pressable style={styles.joinButton}>
            <Text style={styles.joinButtonText}>Join</Text>
          </Pressable>

          <Pressable style={styles.viewButton}>
            <Text style={styles.viewButtonText}>View</Text>
          </Pressable>
        </View>
      </View>

      {/* Basketball */}
      <View style={styles.largeClubCard}>
        <View style={styles.clubTopRow}>
          <View style={styles.largeEmojiBox}>
            <Text style={styles.largeEmoji}>🏀</Text>
          </View>
          
          <View style={styles.clubInformation}>
            <Text style={styles.largeClubName}>Basketball Club</Text>
            <Text style={styles.clubDescription}> Meet players and have fun in intramural sports</Text>

            <View style={styles.clubStats}>
              <Text style={styles.statText}>👥 25 members</Text>
              <Text style={styles. statText}>⭐️ 4.5</Text>
            </View>

            <View style={styles.tag}>
              <Text style={styles.tagText}>Sports</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionRow}>
          <Pressable style={styles.joinButton}>
            <Text style={styles.joinButtonText}>Join</Text>
          </Pressable>

          <Pressable style={styles.viewButton}>
            <Text style={styles.viewButtonText}>View</Text>
          </Pressable>
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
    paddingBottom: 40,
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
    fontSize: 17,
    color: "#171717",
  },

  filterIcon: {
    fontSize: 21,
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
    color: "#777B8A",
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
    color: "#777B8A",
  },

  trendingInfo: {
    marginTop: 15,
    fontSize: 14,
    color: "#777B8A",
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
    color: "#777B8A",
  },

  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },

  joinButton: {
    flex: 1,
    backgroundColor: "#0B55B7",
    paddingVertical: 12,
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
    paddingVertical: 12,
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
