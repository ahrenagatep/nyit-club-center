import { Stack } from "expo-router";

// one stack per tab. the "(home,explore,…)" folder name is an expo-router "shared routes" group:
// every screen in here (club, event, profile, notifications, skill exchange posts, chats…) gets
// copied into EACH tab's stack. so opening a club from Events stacks it on the Events tab ->
// the tab bar stays visible and Back just pops back down the same tab (no more back loops).
//
// which screen sits at the bottom of each tab's stack. keyed by group name (no parentheses).
// spelled out on purpose: w/o it the Skill Exchange tab opened on a random shared screen
// (we saw /dm-chat) b/c its first screen lives one folder deeper (skill-exchange/index.tsx).
// it's also what a cold deep link sits on top of, so Back from /club/3 lands on a real tab root.
export const unstable_settings = {
    home: { initialRouteName: "home" },
    explore: { initialRouteName: "explore" },
    "skill-exchange": { initialRouteName: "skill-exchange/index" },
    events: { initialRouteName: "events" },
    chat: { initialRouteName: "chat" },
    more: { initialRouteName: "more" },
};

export default function TabStackLayout() {
    // headers off b/c every screen draws its own blue ScreenHeader
    return <Stack screenOptions={{ headerShown: false }} />;
}
