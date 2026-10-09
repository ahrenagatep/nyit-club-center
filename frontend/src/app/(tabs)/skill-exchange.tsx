import React, { useCallback, useEffect, useRef, useState } from "react";

import {
    ActivityIndicator,
    View,
    Text,
    TextInput,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Modal,
    Switch,
} from "react-native";
import { router, useFocusEffect } from "expo-router";

import { EmptyState } from "@/components/club-cards";
import { SkillPostCard } from "@/components/skill-cards";
import { TagPicker, useSkillTagGroups } from "@/components/tag-picker";
import { Brand } from "@/constants/brand";
import {
    ApiError,
    skillApi,
    type SkillKind,
    type SkillPost,
    type SkillSort,
    type SkillStatus,
} from "@/lib/api";
import { useAuth } from "@/state/auth";

const PAGE_SIZE = 20;
const SEARCH_DELAY_MS = 300;

const SORTS: { value: SkillSort; label: string }[] = [
    { value: "newest", label: "Newest" },
    { value: "oldest", label: "Oldest" },
    { value: "soonest", label: "Soonest date" },
];

const STATUS_FILTERS: Record<SkillKind, { value: SkillStatus | null; label: string }[]> = {
    request: [
        { value: null, label: "All" },
        { value: "open", label: "Open" },
        { value: "closed", label: "Closed" },
    ],
    offer: [
        { value: null, label: "All" },
        { value: "available", label: "Available" },
        { value: "unavailable", label: "Unavailable" },
    ],
};

function errorMessage(error: unknown): string {
    if (error instanceof ApiError) {
        if (error.status === 401) return "Your session has expired. Sign out and log in again.";
        return error.message;
    }
    return "Something went wrong. Please try again.";
}

/** Skill Exchange tab: students request help or offer it (Requests | Offers). */
export default function SkillExchangeScreen() {
    const { session } = useAuth();
    const tagGroups = useSkillTagGroups();

    const [kind, setKind] = useState<SkillKind>("request");
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [tags, setTags] = useState<string[]>([]);
    const [sort, setSort] = useState<SkillSort>("newest");
    const [status, setStatus] = useState<SkillStatus | null>(null);
    const [mine, setMine] = useState(false);
    const [filterVisible, setFilterVisible] = useState(false);

    const [posts, setPosts] = useState<SkillPost[]>([]);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expanded, setExpanded] = useState<Set<number>>(new Set());

    // answers from an older search are ignored once a newer one has started
    const requestId = useRef(0);
    const loadedOnce = useRef(false);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DELAY_MS);
        return () => clearTimeout(timer);
    }, [search]);

    const load = useCallback(
        async (mode: "replace" | "more" | "refresh") => {
            if (!session) return;
            const id = ++requestId.current;
            if (mode === "replace") setLoading(true);
            if (mode === "more") setLoadingMore(true);
            try {
                const offset = mode === "more" ? posts.length : 0;
                const result = await skillApi.list(session.access_token, {
                    kind,
                    q: debouncedSearch || undefined,
                    tags,
                    sort,
                    status: status ?? undefined,
                    mine: mine || undefined,
                    limit: PAGE_SIZE,
                    offset,
                });
                if (id !== requestId.current) return;
                setPosts((current) => (mode === "more" ? [...current, ...result.posts] : result.posts));
                setHasMore(result.has_more);
                setError(null);
                loadedOnce.current = true;
            } catch (e) {
                if (id !== requestId.current) return;
                setError(errorMessage(e));
            } finally {
                if (id === requestId.current) {
                    setLoading(false);
                    setLoadingMore(false);
                    setRefreshing(false);
                }
            }
        },
        [session, kind, debouncedSearch, tags, sort, status, mine, posts.length],
    );

    // new search, filter, or tab → start from the top
    useEffect(() => {
        load("replace");
    }, [session, kind, debouncedSearch, tags, sort, status, mine]);

    // coming back from a post (created, edited, deleted) → refresh quietly
    const loadRef = useRef(load);
    loadRef.current = load;
    useFocusEffect(
        useCallback(() => {
            if (loadedOnce.current) loadRef.current("refresh");
        }, []),
    );

    const changeKind = (next: SkillKind) => {
        if (next === kind) return;
        setKind(next);
        setStatus(null);
        setExpanded(new Set());
    };

    const toggleExpanded = (postId: number) => {
        setExpanded((current) => {
            const next = new Set(current);
            if (next.has(postId)) next.delete(postId);
            else next.add(postId);
            return next;
        });
    };

    const clearFilters = () => {
        setTags([]);
        setSort("newest");
        setStatus(null);
        setMine(false);
    };

    const activeFilters: { key: string; label: string; remove: () => void }[] = [
        ...tags.map((tag) => ({ key: `tag-${tag}`, label: tag, remove: () => setTags(tags.filter((t) => t !== tag)) })),
        ...(status
            ? [{ key: "status", label: STATUS_FILTERS[kind].find((s) => s.value === status)?.label ?? status, remove: () => setStatus(null) }]
            : []),
        ...(mine ? [{ key: "mine", label: "My posts", remove: () => setMine(false) }] : []),
        ...(sort !== "newest"
            ? [{ key: "sort", label: `Sort: ${SORTS.find((s) => s.value === sort)?.label}`, remove: () => setSort("newest") }]
            : []),
    ];
    const filtering = Boolean(debouncedSearch) || activeFilters.length > 0;
    const noun = kind === "request" ? "requests" : "offers";

    return (
        <View style={styles.container}>

            {/* Main Page*/}
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => {
                            setRefreshing(true);
                            load("refresh");
                        }}
                    />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <View style={styles.headerText}>
                            <Text style={styles.headerTitle} accessibilityRole="header">Skill Exchange</Text>
                            <Text style={styles.headerSubtitle}>Share your skills and connect with others</Text>
                        </View>

                        <Pressable
                            style={({ pressed }) => [styles.postButton, pressed && styles.pressed]}
                            onPress={() => router.push({ pathname: "/skill/new", params: { kind } })}
                            accessibilityRole="button"
                            accessibilityLabel={kind === "request" ? "Post a request" : "Post an offer"}
                        >
                            <Text style={styles.postButtonText}>+ Post</Text>
                        </Pressable>
                    </View>

                    {/* Requests | Offers */}
                    <View style={styles.kindToggle}>
                        {(["request", "offer"] as const).map((k) => {
                            const active = kind === k;
                            return (
                                <Pressable
                                    key={k}
                                    style={[styles.kindButton, active && styles.kindButtonActive]}
                                    onPress={() => changeKind(k)}
                                    accessibilityRole="button"
                                    accessibilityState={{ selected: active }}
                                    accessibilityLabel={k === "request" ? "Requests" : "Offers"}
                                >
                                    <Text style={[styles.kindText, active && styles.kindTextActive]}>
                                        {k === "request" ? "REQUESTS" : "OFFERS"}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>
                </View>

                {/*Search & Filter*/}
                <View style={styles.searchSection}>
                    <View style={styles.searchBar}>
                        <Text style={styles.searchIcon} importantForAccessibility="no">🔍</Text>

                        <TextInput
                            style={styles.searchInput}
                            placeholder={`Search ${noun} or students...`}
                            placeholderTextColor={Brand.textMuted}
                            value={search}
                            onChangeText={setSearch}
                            returnKeyType="search"
                            autoCorrect={false}
                            clearButtonMode="while-editing"
                            maxLength={100}
                            accessibilityLabel={`Search ${noun}`}
                        />
                    </View>

                    <Pressable
                        style={({ pressed }) => [styles.filterButton, pressed && styles.pressed]}
                        onPress={() => setFilterVisible(true)}
                        accessibilityRole="button"
                        accessibilityLabel={`Filter ${noun}${activeFilters.length ? `, ${activeFilters.length} active` : ""}`}
                    >
                        <Text style={styles.filterButtonText}>
                            Filter{activeFilters.length ? ` (${activeFilters.length})` : ""}
                        </Text>
                    </Pressable>
                </View>

                {/* Active filters (tap to remove) */}
                {activeFilters.length > 0 && (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.activeFilters}
                    >
                        {activeFilters.map((filter) => (
                            <Pressable
                                key={filter.key}
                                style={({ pressed }) => [styles.activeFilterTag, pressed && styles.pressed]}
                                onPress={filter.remove}
                                accessibilityRole="button"
                                accessibilityLabel={`Remove filter ${filter.label}`}
                            >
                                <Text style={styles.activeFilterText}>{filter.label} ✕</Text>
                            </Pressable>
                        ))}
                        <Pressable
                            style={({ pressed }) => [styles.clearAll, pressed && styles.pressed]}
                            onPress={clearFilters}
                            accessibilityRole="button"
                            accessibilityLabel="Clear all filters"
                        >
                            <Text style={styles.clearAllText}>Clear all</Text>
                        </Pressable>
                    </ScrollView>
                )}

                {/* TITLE */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle} accessibilityRole="header">
                        {kind === "request" ? "Requests" : "Offers"}
                    </Text>
                    {!loading && !error && (
                        <Text style={styles.sectionCount} accessibilityLiveRegion="polite">
                            {posts.length}{hasMore ? "+" : ""} {posts.length === 1 && !hasMore ? noun.slice(0, -1) : noun}
                        </Text>
                    )}
                </View>

                {loading ? (
                    <ActivityIndicator style={styles.spinner} size="large" color={Brand.primary} accessibilityLabel={`Loading ${noun}`} />
                ) : error ? (
                    <View style={styles.errorBox}>
                        <Text style={styles.errorText} accessibilityRole="alert">{error}</Text>
                        <Pressable
                            style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
                            onPress={() => load("replace")}
                            accessibilityRole="button"
                            accessibilityLabel="Try again"
                        >
                            <Text style={styles.retryText}>Try again</Text>
                        </Pressable>
                    </View>
                ) : posts.length === 0 ? (
                    <EmptyState
                        emoji={kind === "request" ? "🙋" : "🧑‍🏫"}
                        title={filtering ? `No ${noun} match` : `No ${noun} yet`}
                        message={
                            filtering
                                ? "Try a different search or fewer filters."
                                : kind === "request"
                                  ? "Need help with something? Tap + Post to ask."
                                  : "Good at something? Tap + Post to offer it."
                        }
                    />
                ) : (
                    <>
                        {posts.map((post) => (
                            <SkillPostCard
                                key={post.post_id}
                                post={post}
                                expanded={expanded.has(post.post_id)}
                                onToggle={() => toggleExpanded(post.post_id)}
                            />
                        ))}
                        {hasMore && (
                            <Pressable
                                style={({ pressed }) => [styles.moreButton, pressed && styles.pressed]}
                                onPress={() => load("more")}
                                disabled={loadingMore}
                                accessibilityRole="button"
                                accessibilityState={{ busy: loadingMore }}
                                accessibilityLabel={`Load more ${noun}`}
                            >
                                <Text style={styles.moreText}>{loadingMore ? "Loading…" : "Load more"}</Text>
                            </Pressable>
                        )}
                    </>
                )}

            </ScrollView>

            {/* Filter Panel*/}
            <Modal
                visible={filterVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setFilterVisible(false)}
            >
                <View style={styles.modalBackground}>

                    <Pressable
                        style={styles.modalOutside}
                        onPress={() => setFilterVisible(false)}
                        accessibilityRole="button"
                        accessibilityLabel="Close filters"
                    />

                    <View style={styles.filterModal} accessibilityViewIsModal>

                        {/*Header for filter*/}
                        <View style={styles.filterHeader}>
                            <Text style={styles.filterTitle} accessibilityRole="header">
                                Filter {noun}
                            </Text>

                            <Pressable
                                style={styles.closeHit}
                                onPress={() => setFilterVisible(false)}
                                accessibilityRole="button"
                                accessibilityLabel="Close filters"
                            >
                                <Text style={styles.closeButton}>✕</Text>
                            </Pressable>
                        </View>

                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            {/* Tags */}
                            <TagPicker
                                groups={tagGroups}
                                selected={tags}
                                onChange={setTags}
                                label="Tags (any of)"
                            />

                            {/* Sort */}
                            <Text style={styles.filterSectionTitle}>Sort by</Text>
                            <View style={styles.optionRow}>
                                {SORTS.map((item) => (
                                    <Pressable
                                        key={item.value}
                                        style={[styles.optionButton, sort === item.value && styles.selectedOption]}
                                        onPress={() => setSort(item.value)}
                                        accessibilityRole="button"
                                        accessibilityState={{ selected: sort === item.value }}
                                        accessibilityLabel={`Sort by ${item.label.toLowerCase()}`}
                                    >
                                        <Text style={[styles.optionText, sort === item.value && styles.selectedOptionText]}>
                                            {item.label}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>

                            {/* Status */}
                            <Text style={styles.filterSectionTitle}>Status</Text>
                            <View style={styles.optionRow}>
                                {STATUS_FILTERS[kind].map((item) => (
                                    <Pressable
                                        key={item.label}
                                        style={[styles.optionButton, status === item.value && styles.selectedOption]}
                                        onPress={() => setStatus(item.value)}
                                        accessibilityRole="button"
                                        accessibilityState={{ selected: status === item.value }}
                                        accessibilityLabel={`Status ${item.label.toLowerCase()}`}
                                    >
                                        <Text style={[styles.optionText, status === item.value && styles.selectedOptionText]}>
                                            {item.label}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>

                            {/* Mine */}
                            <View style={styles.switchRow}>
                                <Text style={styles.filterSectionTitleInline} nativeID="mine-label">
                                    Only my posts
                                </Text>
                                <Switch
                                    value={mine}
                                    onValueChange={setMine}
                                    trackColor={{ true: Brand.primary, false: "#C9CBD1" }}
                                    thumbColor={Brand.white}
                                    accessibilityLabel="Only my posts"
                                    accessibilityLabelledBy="mine-label"
                                />
                            </View>

                            {/*Buttons at bottom*/}
                            <View style={styles.filterBottom}>

                                <Pressable
                                    style={styles.clearButton}
                                    onPress={clearFilters}
                                    accessibilityRole="button"
                                    accessibilityLabel="Clear filters"
                                >
                                    <Text style={styles.clearButtonText}>Clear</Text>
                                </Pressable>

                                <Pressable
                                    style={styles.showButton}
                                    onPress={() => setFilterVisible(false)}
                                    accessibilityRole="button"
                                    accessibilityLabel="Show results"
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

    pressed: {
        opacity: 0.7,
    },

    spinner: {
        marginTop: 40,
    },

    /* Header */

    header: {
        backgroundColor: Brand.primary,
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 24,
    },

    headerTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    headerText: {
        flex: 1,
        paddingRight: 12,
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
        minHeight: 44,
        justifyContent: "center",
        borderRadius: 22,
    },

    postButtonText: {
        color: "#FFFFFF",
        fontWeight: "600",
        fontSize: 15,
    },

    kindToggle: {
        marginTop: 20,
        flexDirection: "row",
        backgroundColor: "#2467BD",
        borderRadius: 10,
        padding: 4,
    },

    kindButton: {
        flex: 1,
        minHeight: 40,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 8,
    },

    kindButtonActive: {
        backgroundColor: "#FFFFFF",
    },

    kindText: {
        color: "#FFFFFF",
        fontWeight: "600",
    },

    kindTextActive: {
        color: Brand.primary,
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
        fontSize: 20,
        marginRight: 8,
    },

    searchInput: {
        flex: 1,
        minHeight: 44,
        fontSize: 15,
        color: "#171717",
    },

    filterButton: {
        backgroundColor: Brand.primary,
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
        alignItems: "center",
    },

    activeFilterTag: {
        backgroundColor: "#EAF3FF",
        paddingHorizontal: 12,
        minHeight: 36,
        justifyContent: "center",
        borderRadius: 18,
    },

    activeFilterText: {
        color: Brand.primary,
        fontSize: 13,
        fontWeight: "600",
    },

    clearAll: {
        minHeight: 36,
        justifyContent: "center",
        paddingHorizontal: 8,
    },

    clearAllText: {
        color: Brand.textMuted,
        fontSize: 13,
        textDecorationLine: "underline",
    },

    /* Cards */

    sectionHeader: {
        marginHorizontal: 18,
        marginTop: 25,
        marginBottom: 12,
        flexDirection: "row",
        alignItems: "baseline",
        justifyContent: "space-between",
    },

    sectionTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#171717",
    },

    sectionCount: {
        fontSize: 13,
        color: Brand.textMuted,
    },

    errorBox: {
        marginHorizontal: 18,
        alignItems: "center",
        paddingVertical: 24,
    },

    errorText: {
        color: "#C62828",
        fontSize: 15,
        textAlign: "center",
        marginBottom: 12,
    },

    retryButton: {
        minHeight: 44,
        paddingHorizontal: 20,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: Brand.primary,
        justifyContent: "center",
    },

    retryText: {
        color: Brand.primary,
        fontWeight: "600",
    },

    moreButton: {
        marginHorizontal: 18,
        minHeight: 48,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: Brand.primary,
        alignItems: "center",
        justifyContent: "center",
    },

    moreText: {
        color: Brand.primary,
        fontWeight: "600",
        fontSize: 15,
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
        maxHeight: "85%",
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

    closeHit: {
        minWidth: 44,
        minHeight: 44,
        alignItems: "center",
        justifyContent: "center",
    },

    closeButton: {
        fontSize: 22,
        color: Brand.textMuted,
    },

    filterSectionTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#171717",

        marginTop: 16,
        marginBottom: 12,
    },

    filterSectionTitleInline: {
        fontSize: 16,
        fontWeight: "600",
        color: "#171717",
    },

    switchRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        minHeight: 48,
        marginTop: 16,
    },

    optionRow: {
        flexDirection: "row",
        flexWrap: "wrap",

        gap: 9,
    },

    optionButton: {
        backgroundColor: "#F1F1F3",

        paddingHorizontal: 14,
        minHeight: 40,
        justifyContent: "center",

        borderRadius: 20,
    },

    selectedOption: {
        backgroundColor: Brand.primary,
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

        marginTop: 28,
    },

    clearButton: {
        flex: 1,

        borderWidth: 1,
        borderColor: Brand.primary,

        minHeight: 48,
        justifyContent: "center",

        borderRadius: 12,

        alignItems: "center",
    },

    clearButtonText: {
        color: Brand.primary,
        fontSize: 15,
        fontWeight: "600",
    },

    showButton: {
        flex: 2,

        backgroundColor: Brand.primary,

        minHeight: 48,
        justifyContent: "center",

        borderRadius: 12,

        alignItems: "center",
    },

    showButtonText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "600",
    },
});
