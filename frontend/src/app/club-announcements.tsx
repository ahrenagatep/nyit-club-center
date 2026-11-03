import React, { useState } from "react";
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Pressable,
} from "react-native";

import { router, useLocalSearchParams } from "expo-router";
import { Brand } from "@/constants/brand";
import { ScreenHeader } from "@/components/screen-header";

export default function ClubAnnouncementsScreen() {
    //it gets club ID that was sent from the club page
    const { clubId } = useLocalSearchParams<{ clubId: string }>();

    const [announcements, setAnnouncements] = useState<any[]>([]);

    return (
        <View style={styles.container}>

            <ScreenHeader
                title="Annoucements"
                subtitle="Updates and Information"
            />

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >

                {announcements.length === 0 ? (

                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>📢</Text>
                        <Text style={styles.emptyTitle}>No annoucements yet</Text>
                        <Text style={styles.emptyText}>Check back later</Text>
                    </View>
                ) : (

                    //creates a card for an announcemnt
                    announcements.map((announcement) => (

                        <View key={announcement.id}
                            style={styles.announcementCard}
                        >
                            <Text style={styles.announcementTitle}>{announcement.title}</Text>
                            <Text style={styles.announcementMessage}>{announcement.message}</Text>
                            <Text style={styles.announcementDate}>{announcement.created_at}</Text>

                        </View>
                    ))

                )}

            </ScrollView>

        </View>
    );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: Brand.white,
    },

    content: {
        padding: 20,
    },

    emptyContainer: {
        alignItems: "center",
        justifyContent: "center",
        paddingTop: 100,
        paddingHorizontal: 25,
    },

    emptyIcon: {
        fontSize: 22,
        marginBottom: 16,
    },

    emptyTitle: {
        fontSize: 22,
        fontWeight: "bold",
        color: Brand.text,
        marginBottom: 8,
    },

    emptyText: {
        fontSize: 16,
        color: "#6B7280",
        textAlign: "center",
        lineHeight: 23,
    },

    announcementCard: {
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 14,
        padding: 16,
        marginBottom: 14,
    },

    announcementTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: Brand.text,
        marginBottom: 6,
    },

    announcementMessage: {
        fontSize: 15,
        lineHeight: 22,
        color: Brand.text,
    },

    announcementDate: {
        fontSize: 13,
        color: "#6B7280",
        marginTop: 10,
    },

});