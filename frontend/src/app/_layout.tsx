import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
  Stack,
} from "expo-router";

import * as SplashScreen from "expo-splash-screen";
import {
  ActivityIndicator,
  StyleSheet,
  View,
  useColorScheme,
} from "react-native";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { AppStateProvider } from "@/state/app-state";
import { AuthProvider, useAuth } from "@/state/auth";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <AppStateProvider>
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <AnimatedSplashOverlay />
          <RootStack />
        </ThemeProvider>
      </AppStateProvider>
    </AuthProvider>
  );
}

/**
 * Signed-out users can only reach Login, Sign Up, and Verification; signed-in
 * users only reach the app. When the auth status flips, expo-router redirects
 * to the first screen the user is allowed to see.
 *
 * While the saved session is still loading, both groups stay reachable (and a
 * loading view covers them) so nothing redirects yet. That keeps the screen a
 * returning user opened (web URL, deep link, reload) instead of bouncing them
 * through Login to Home.
 */
function RootStack() {
  const { status } = useAuth();

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Protected guard={status !== "signedIn"}>
          <Stack.Screen name="index" />
          <Stack.Screen name="signup" />
          <Stack.Screen name="verification" />
        </Stack.Protected>

        <Stack.Protected guard={status !== "signedOut"}>
          <Stack.Screen name="(tabs)" />
          {/* Screens opened from the tabs (each draws its own ScreenHeader) */}
          <Stack.Screen name="club/[id]" />
          <Stack.Screen name="event/[id]" />
          <Stack.Screen name="my-clubs" />
          <Stack.Screen name="notifications" />
          <Stack.Screen name="profile" />
        </Stack.Protected>
      </Stack>

      {status === "loading" && (
        <View
          style={styles.loading}
          accessibilityLabel="Loading"
          accessibilityLiveRegion="polite"
        >
          <ActivityIndicator size="large" color="#0B55B7" />
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
});
