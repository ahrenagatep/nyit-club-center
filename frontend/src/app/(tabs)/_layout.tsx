import { Text } from "react-native";
import { Tabs } from "expo-router";

import { useTheme } from "@/state/theme";

/** Emoji tab icon, matching the app's other icons. Dimmed when its tab isn't selected; the label names the tab. */
function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <Text
      style={{ fontSize: 18, lineHeight: 22, opacity: focused ? 1 : 0.55 }}
      importantForAccessibility="no"
      accessibilityElementsHidden
    >
      {emoji}
    </Text>
  );
}

export default function TabLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primaryOnSurface,
        tabBarInactiveTintColor: colors.textTabInactive,
        tabBarStyle: {
          backgroundColor: colors.surface,
        },
        // android: slide the tab bar away while the keyboard is open so it doesn't sit on top of
        // the message box in chats (every screen now lives inside a tab, so the bar is always there)
        tabBarHideOnKeyboard: true,
      }}
    >  {/*This makes names for tabs appear on the bottom of the app*/}
      {/* each name is a route group: "(home)" = the Home tab's own stack (see the shared
          (home,explore,…)/_layout.tsx), so screens opened from a tab keep the tab bar */}
      <Tabs.Screen
        name="(home)"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="(explore)"
        options={{
          title: "Explore",
          tabBarIcon: ({ focused }) => <TabIcon emoji="🧭" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="(skill-exchange)"
        options={{
          title: "Skill Exchange",
          tabBarIcon: ({ focused }) => <TabIcon emoji="🧠" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="(events)"
        options={{
          title: "Events",
          tabBarIcon: ({ focused }) => <TabIcon emoji="📅" focused={focused} />,
        }}
      />

      <Tabs.Screen
        name="(chat)"
        options={{
          title: "Chats",  //recent added tab
          tabBarIcon: ({ focused }) => <TabIcon emoji="💬" focused={focused} />,
        }}
      />


      {/* Account hub; opens Profile (the design's Profile tab) */}
      <Tabs.Screen
        name="(more)"
        options={{
          title: "More",
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
