import React, { useMemo, useState } from "react";
import {
    View,
    Text,
    TextInput,
    Pressable,
    ScrollView,
    StyleSheet,
} from "react-native";
import { DarkModeToggle } from "@/components/dark-mode-toggle";
import { NotificationBell } from "@/components/notification-bell";

import { EmptyState, openEvent } from "@/components/club-cards";
import type { ThemeColors } from "@/constants/theme";
import {
    EVENT_CATEGORIES,
    campusDateKey,
    formatEventDateLong,
    formatEventMonthDay,
    formatEventTimeRange,
    getClubById,
    getUpcomingEvents,
    type ClubEvent,
    type EventCategory,
} from "@/data/mock-data";
import {
    WEEK_DAYS,
    dayKey,
    monthWeeks,
    pad,
    shiftMonth,
    type CalendarMonth,
} from "@/lib/calendar";
import { useAppState } from "@/state/app-state";
import { useTheme, useThemedStyles } from "@/state/theme";

type ViewMode = "list" | "calendar";

/** The month that contains today, in campus time. */
function currentMonth(): CalendarMonth {
    const [year, month] = campusDateKey(new Date().toISOString()).split("-");
    return { year: Number(year), month: Number(month) - 1 };
}

/** Events tab: upcoming events as a list or a month calendar (FR-9). */
export default function EventsScreen() {
    const styles = useThemedStyles(createStyles);
    const { colors } = useTheme();
    const [viewMode, setViewMode] = useState<ViewMode>("list");
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<EventCategory | "All">("All");
    const [showFilters, setShowFilters] = useState(false);
    const [goingOnly, setGoingOnly] = useState(false);
    const [month, setMonth] = useState<CalendarMonth>(currentMonth);
    const [selectedDay, setSelectedDay] = useState<string | null>(null);
    const { hasRsvp, toggleRsvp } = useAppState();

    const categories: (EventCategory | "All")[] = ["All", ...EVENT_CATEGORIES];

    const events = useMemo(() => {
        const q = search.trim().toLowerCase();
        return getUpcomingEvents().filter((event) => {
            const club = getClubById(event.club_id);
            const matchesQuery =
                q === "" ||
                event.title.toLowerCase().includes(q) ||
                event.location.toLowerCase().includes(q) ||
                (club?.name.toLowerCase().includes(q) ?? false);
            const matchesCategory =
                selectedCategory === "All" || event.category === selectedCategory;
            const matchesGoing = !goingOnly || hasRsvp(event.event_id);
            return matchesQuery && matchesCategory && matchesGoing;
        });
    }, [search, selectedCategory, goingOnly, hasRsvp]);

    const eventsByDay = useMemo(() => {
        const map = new Map<string, ClubEvent[]>();
        for (const event of events) {
            const key = campusDateKey(event.event_date);
            map.set(key, [...(map.get(key) ?? []), event]);
        }
        return map;
    }, [events]);

    const monthPrefix = `${month.year}-${pad(month.month + 1)}-`;
    const monthName = new Date(month.year, month.month, 1).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
    });
    const calendarEvents = selectedDay
        ? eventsByDay.get(selectedDay) ?? []
        : events.filter((event) => campusDateKey(event.event_date).startsWith(monthPrefix));

    const changeMonth = (delta: number) => {
        setMonth((current) => shiftMonth(current, delta));
        setSelectedDay(null);
    };

    const emptyState = (
        <EmptyState
            emoji="📅"
            title={goingOnly ? "You haven't RSVP'd yet" : "No events found"}
            message={
                goingOnly
                    ? "Tap RSVP on an event to see it here."
                    : "Try a different search or category."
            }
        />
    );

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
        >
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <Text style={styles.headerTitle} accessibilityRole="header">
                        Events
                    </Text>
                    <DarkModeToggle style={styles.themeToggle} />
                    <NotificationBell
                        style={styles.iconButton}
                        pressedStyle={styles.pressed}
                        iconStyle={styles.bellIcon}
                    />
                </View>

                {/* List & Calender */}
                <View style={styles.viewToggle}>
                    {(["list", "calendar"] as const).map((mode) => {
                        const active = viewMode === mode;
                        return (
                            <Pressable
                                key={mode}
                                style={[styles.inactiveToggle, active && styles.activeToggle]}
                                onPress={() => setViewMode(mode)}
                                accessibilityRole="button"
                                accessibilityState={{ selected: active }}
                                accessibilityLabel={mode === "list" ? "List view" : "Calendar view"}
                            >
                                <Text
                                    style={[
                                        styles.inactiveToggleText,
                                        active && styles.activeToggleText,
                                    ]}
                                >
                                    {mode === "list" ? "LISTS" : "CALENDAR"}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>
            </View>

            {/* Search & Filter card */}
            <View style={styles.searchCard}>
                <View style={styles.searchBar}>
                    <Text style={styles.searchIcon} importantForAccessibility="no">
                        🔍
                    </Text>

                    <TextInput
                        style={styles.searchInput}
                        placeholder="search events..."
                        placeholderTextColor={colors.placeholder}
                        value={search}
                        onChangeText={setSearch}
                        returnKeyType="search"
                        autoCorrect={false}
                        clearButtonMode="while-editing"
                        accessibilityLabel="Search events"
                    />

                    <Pressable
                        onPress={() => setShowFilters((open) => !open)}
                        style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityState={{ expanded: showFilters }}
                        accessibilityLabel="Filter events"
                    >
                        <Text style={styles.filterIcon}>▽</Text>
                    </Pressable>
                </View>

                {/* Going filter (▽) */}
                {showFilters && (
                    <View style={styles.filterRow}>
                        {[
                            { label: "All events", value: false },
                            { label: "Going", value: true },
                        ].map(({ label, value }) => {
                            const active = goingOnly === value;
                            return (
                                <Pressable
                                    key={label}
                                    style={[
                                        styles.categoryButton,
                                        active && styles.activeCategoryButton,
                                    ]}
                                    onPress={() => setGoingOnly(value)}
                                    hitSlop={6}
                                    accessibilityRole="button"
                                    accessibilityState={{ selected: active }}
                                    accessibilityLabel={`Show ${label.toLowerCase()}`}
                                >
                                    <Text
                                        style={[
                                            styles.categoryText,
                                            active && styles.activeCategoryText,
                                        ]}
                                    >
                                        {label}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>
                )}

                {/* Categories */}
                <View style={styles.categoryRow}>
                    {categories.map((category) => (
                        <Pressable
                            key={category}
                            style={[
                                styles.categoryButton,
                                selectedCategory === category &&
                                styles.activeCategoryButton,
                            ]}
                            onPress={() => setSelectedCategory(category)}
                            hitSlop={6}
                            accessibilityRole="button"
                            accessibilityState={{ selected: selectedCategory === category }}
                            accessibilityLabel={`${category} events`}
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
                </View>
            </View>

            {viewMode === "list" ? (
                <>
                    {/* Event Title */}
                    <Text style={styles.sectionTitle} accessibilityRole="header">
                        Upcoming Events
                    </Text>

                    {events.length === 0
                        ? emptyState
                        : events.map((event) => {
                              const club = getClubById(event.club_id);
                              const going = hasRsvp(event.event_id);
                              const { month: badgeMonth, day: badgeDay } = formatEventMonthDay(
                                  event.event_date,
                              );
                              const time = formatEventTimeRange(event);

                              // Card body and RSVP are siblings so each is its own touch target.
                              return (
                                  <View key={event.event_id} style={styles.eventCard}>
                                      <Pressable
                                          onPress={() => openEvent(event.event_id)}
                                          style={({ pressed }) => pressed && styles.pressed}
                                          accessibilityRole="button"
                                          accessibilityLabel={`${event.title}${club ? `, hosted by ${club.name}` : ""}, ${badgeMonth} ${badgeDay}, ${time}, ${event.location}`}
                                          accessibilityHint="Opens the event details"
                                      >
                                          <View style={styles.eventTop}>
                                              <View style={styles.eventInfo}>
                                                  <Text style={styles.eventTitle}>{event.title}</Text>
                                                  {club ? (
                                                      <Text style={styles.clubName}>{club.name}</Text>
                                                  ) : null}
                                              </View>

                                              <View style={styles.dateBadge}>
                                                  <Text style={styles.dateMonth}>{badgeMonth}</Text>
                                                  <Text style={styles.dateDay}>{badgeDay}</Text>
                                              </View>
                                          </View>

                                          <Text style={styles.detailText}>🕔 {time}</Text>
                                          <Text style={styles.detailText}>📍 {event.location}</Text>
                                      </Pressable>

                                      <View style={styles.eventBottom}>
                                          <Pressable
                                              style={({ pressed }) => [
                                                  styles.rsvpButton,
                                                  going && styles.rsvpActiveButton,
                                                  pressed && styles.pressed,
                                              ]}
                                              onPress={() => toggleRsvp(event.event_id)}
                                              accessibilityRole="button"
                                              accessibilityState={{ selected: going }}
                                              accessibilityLabel={
                                                  going
                                                      ? `Cancel RSVP for ${event.title}`
                                                      : `RSVP to ${event.title}`
                                              }
                                          >
                                              <Text
                                                  style={[
                                                      styles.rsvpText,
                                                      going && styles.rsvpActiveText,
                                                  ]}
                                              >
                                                  {going ? "✓ RSVP'd" : "RSVP"}
                                              </Text>
                                          </Pressable>

                                          <View style={styles.eventCategory}>
                                              <Text style={styles.eventCategoryText}>
                                                  {event.category}
                                              </Text>
                                          </View>
                                      </View>
                                  </View>
                              );
                          })}
                </>
            ) : (
                <>
                    {/* CALENDAR VIEW */}

                    <View style={styles.calendarCard}>
                        <View style={styles.calendarHeader}>
                            <Pressable
                                onPress={() => changeMonth(-1)}
                                style={({ pressed }) => [
                                    styles.iconButton,
                                    pressed && styles.pressed,
                                ]}
                                accessibilityRole="button"
                                accessibilityLabel="Previous month"
                            >
                                <Text style={styles.calendarArrow}>‹</Text>
                            </Pressable>

                            <Text
                                style={styles.calendarMonth}
                                accessibilityRole="header"
                                accessibilityLiveRegion="polite"
                            >
                                {monthName}
                            </Text>

                            <Pressable
                                onPress={() => changeMonth(1)}
                                style={({ pressed }) => [
                                    styles.iconButton,
                                    pressed && styles.pressed,
                                ]}
                                accessibilityRole="button"
                                accessibilityLabel="Next month"
                            >
                                <Text style={styles.calendarArrow}>›</Text>
                            </Pressable>
                        </View>

                        <View style={styles.weekRow}>
                            {WEEK_DAYS.map((weekDay) => (
                                <Text key={weekDay} style={styles.weekDay}>
                                    {weekDay}
                                </Text>
                            ))}
                        </View>

                        {monthWeeks(month).map((week, weekIndex) => (
                            <View key={weekIndex} style={styles.weekRow}>
                                {week.map((day, dayIndex) => {
                                    if (day === null) {
                                        return <View key={`empty-${dayIndex}`} style={styles.emptyDay} />;
                                    }

                                    const key = dayKey(month.year, month.month, day);
                                    const dayEvents = eventsByDay.get(key);

                                    if (!dayEvents) {
                                        return (
                                            <Text key={key} style={styles.calendarDay}>
                                                {day}
                                            </Text>
                                        );
                                    }

                                    const selected = selectedDay === key;
                                    return (
                                        <Pressable
                                            key={key}
                                            onPress={() => setSelectedDay(selected ? null : key)}
                                            style={({ pressed }) => [
                                                styles.eventDay,
                                                selected && styles.selectedEventDay,
                                                pressed && styles.pressed,
                                            ]}
                                            hitSlop={3}
                                            accessibilityRole="button"
                                            accessibilityState={{ selected }}
                                            accessibilityLabel={`${formatEventDateLong(dayEvents[0].event_date)}, ${dayEvents.length} ${dayEvents.length === 1 ? "event" : "events"}`}
                                        >
                                            <Text style={styles.eventDayText}>{day}</Text>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        ))}
                    </View>

                    <Text style={styles.sectionTitle} accessibilityRole="header">
                        {selectedDay
                            ? `Events on ${new Date(month.year, month.month, Number(selectedDay.slice(-2))).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                            : `Events in ${monthName}`}
                    </Text>

                    {calendarEvents.length === 0
                        ? emptyState
                        : calendarEvents.map((event) => {
                              const club = getClubById(event.club_id);
                              const { month: badgeMonth, day: badgeDay } = formatEventMonthDay(
                                  event.event_date,
                              );
                              const time = formatEventTimeRange(event);

                              return (
                                  <Pressable
                                      key={event.event_id}
                                      onPress={() => openEvent(event.event_id)}
                                      style={({ pressed }) => [
                                          styles.calendarEventCard,
                                          pressed && styles.pressed,
                                      ]}
                                      accessibilityRole="button"
                                      accessibilityLabel={`${event.title}, ${badgeMonth} ${badgeDay}, ${time}, ${event.location}`}
                                      accessibilityHint="Opens the event details"
                                  >
                                      <View style={styles.calendarDot} />
                                      <View style={styles.eventInfo}>
                                          <Text style={styles.calendarEventTitle}>{event.title}</Text>
                                          <Text style={styles.calendarEventInfo}>
                                              {badgeMonth} {badgeDay} · {time} · {event.location}
                                          </Text>
                                          {club ? (
                                              <Text style={styles.calendarEventInfo}>{club.name}</Text>
                                          ) : null}
                                      </View>
                                  </Pressable>
                              );
                          })}
                </>
            )}
        </ScrollView>

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

    iconButton: {
        minWidth: 44,
        minHeight: 44,
        justifyContent: "center",
        alignItems: "center",
    },

    header: {
        backgroundColor: colors.header,
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
        color: colors.onHeader,
        fontSize: 26,
        fontWeight: "bold",
    },

    themeToggle: {
        marginLeft: "auto",
        marginRight: 8,
    },

    bellIcon: {
        color: colors.onHeader,
        fontSize: 24,
    },

    viewToggle: {
        marginTop: 25,
        flexDirection: "row",
        backgroundColor: colors.headerControl,
        borderRadius: 10,
        padding: 4,
    },

    activeToggle: {
        flex: 1,
        backgroundColor: colors.surface,
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
        color: colors.textAccent,
        fontWeight: "600",
    },

    inactiveToggleText: {
        color: colors.onHeader,
        fontWeight: "600",
    },

    searchCard: {
        backgroundColor: colors.surface,
        marginHorizontal: 20,
        marginTop: -10,
        padding: 14,
        borderRadius: 15,

        shadowColor: colors.shadow,
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
        minHeight: 44,
        fontSize: 16,
        color: colors.text,
        letterSpacing: 0,
    },

    filterIcon: {
        fontSize: 20,
        color: colors.textMuted,
    },

    filterRow: {
        flexDirection: "row",
        gap: 8,
        marginTop: 12,
    },

    // wraps instead of scrolling sideways, so every category fits any screen width
    categoryRow: {
        marginTop: 15,
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },

    categoryButton: {
        backgroundColor: colors.surfaceMuted,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 15,
    },

    activeCategoryButton: {
        backgroundColor: colors.primary,
    },

    categoryText: {
        color: colors.text,
        fontSize: 13,
        fontWeight: "500",
    },

    activeCategoryText: {
        color: colors.onPrimary,
    },

    sectionTitle: {
        marginHorizontal: 20,
        marginTop: 25,
        marginBottom: 12,
        fontSize: 20,
        fontWeight: "bold",
        color: colors.text,
    },

    eventCard: {
        marginHorizontal: 20,
        marginBottom: 14,
        padding: 16,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
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
        color: colors.text,
    },

    clubName: {
        fontSize: 14,
        color: colors.textMuted,
        marginTop: 4,
        marginBottom: 14,
    },

    dateBadge: {
        backgroundColor: colors.primaryTintDate,
        width: 48,
        height: 55,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },

    dateMonth: {
        color: colors.textAccent,
        fontSize: 12,
    },

    dateDay: {
        color: colors.textAccent,
        fontSize: 16,
        fontWeight: "600",
    },

    detailText: {
        fontSize: 14,
        color: colors.textMuted,
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
        backgroundColor: colors.primary,
        minHeight: 44,
        justifyContent: "center",
        borderRadius: 9,
        alignItems: "center",
        borderWidth: 2,
        borderColor: colors.primary,
    },

    // Outlined once RSVP'd: keeps text contrast above 4.5:1 (WCAG AA).
    rsvpActiveButton: {
        backgroundColor: colors.surface,
    },

    rsvpText: {
        color: colors.onPrimary,
        fontSize: 15,
        fontWeight: "600",
    },

    rsvpActiveText: {
        color: colors.textAccent,
    },

    eventCategory: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 9,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },

    eventCategoryText: {
        color: colors.textMuted,
        fontSize: 13,
    },

    calendarCard: {
        marginHorizontal: 20,
        marginTop: 25,
        padding: 18,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
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
        color: colors.text,
    },

    calendarArrow: {
        fontSize: 30,
        color: colors.textAccent,
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
        color: colors.textMuted,
    },

    calendarDay: {
        width: 38,
        height: 38,
        textAlign: "center",
        lineHeight: 38,
        color: colors.text,
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
        backgroundColor: colors.primary,
        alignItems: "center",
        justifyContent: "center",
    },

    selectedEventDay: {
        borderWidth: 3,
        borderColor: colors.primaryBorderStrong,
    },

    eventDayText: {
        color: colors.onPrimary,
        fontSize: 14,
        fontWeight: "600",
    },

    calendarEventCard: {
        marginHorizontal: 20,
        marginBottom: 12,
        padding: 15,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        flexDirection: "row",
        alignItems: "center",
    },

    calendarDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.primary,
        marginRight: 12,
    },

    calendarEventTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: colors.text,
    },

    calendarEventInfo: {
        fontSize: 13,
        color: colors.textMuted,
        marginTop: 3,
    },
});
