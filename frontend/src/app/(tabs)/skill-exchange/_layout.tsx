import { Stack } from "expo-router";

// Skill Exchange keeps its own stack inside the tab, so a post, the post form, and the
// "I can help" / agreement screens open with the tab bar still showing. Opening one
// from outside the tab (a notification, Profile) still has the list underneath.
export const unstable_settings = {
    initialRouteName: "index",
};

export default function SkillExchangeLayout() {
    return <Stack screenOptions={{ headerShown: false }} />;
}
