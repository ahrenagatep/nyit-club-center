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
import { DarkModeOverlay } from "@/components/dark-mode-overlay";
import type { ThemeColors } from "@/constants/theme";
import { AppStateProvider } from "@/state/app-state";
import { AuthProvider, useAuth } from "@/state/auth";
import { DarkModeProvider } from "@/state/dark-mode";
import { NotificationsProvider } from "@/state/notifications";
import { AppThemeProvider, useTheme, useThemedStyles } from "@/state/theme";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AppThemeProvider>
      <AuthProvider>
        <NotificationsProvider>
          <AppStateProvider>
            <DarkModeProvider>
              <ThemeProvider
                value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
              >
                <AppFrame />
              </ThemeProvider>
            </DarkModeProvider>
          </AppStateProvider>
        </NotificationsProvider>
      </AuthProvider>
    </AppThemeProvider>
  );
}

/** Every screen draws inside this view, so dark mode covers them all. */
function AppFrame() {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.app} collapsable={false}>
      <AnimatedSplashOverlay />
      <RootStack />
      <DarkModeOverlay />
    </View>
  );
}

/**
 * Signed-out users can only reach Login, Sign Up, Verification, and Forgot
 * Password; signed-in
 * users only reach the app. When the auth status flips, expo-router redirects
 * to the first screen the user is allowed to see.
 *
 * While the saved session is still loading, both groups stay reachable (and a
 * loading view covers them) so nothing redirects yet. That keeps the screen a
 * returning user opened (web URL, deep link, reload) instead of bouncing them
 * through Login to Home.
 */
function RootStack() {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
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
          <Stack.Screen name="forgot-password" />
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
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  app: {
    flex: 1,
    // Opaque base and its own blending group, so DarkModeOverlay inverts the screens
    backgroundColor: colors.background,
    isolation: "isolate",
  },
  loading: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
});
