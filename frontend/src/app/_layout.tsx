import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
  Stack,
} from "expo-router";

import * as SplashScreen from "expo-splash-screen";
import { useColorScheme } from "react-native";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { AppStateProvider } from "@/state/app-state";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AppStateProvider>
      <ThemeProvider
        value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
      >
        <AnimatedSplashOverlay />

        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="signup" />
          <Stack.Screen name="verification" />
          <Stack.Screen name="(tabs)" />
          {/* Screens opened from the tabs (each draws its own ScreenHeader) */}
          <Stack.Screen name="club/[id]" />
          <Stack.Screen name="event/[id]" />
          <Stack.Screen name="my-clubs" />
          <Stack.Screen name="notifications" />
          <Stack.Screen name="profile" />
        </Stack>
      </ThemeProvider>
    </AppStateProvider>
  );
}

