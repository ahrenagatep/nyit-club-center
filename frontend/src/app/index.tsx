import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";

import { router, useLocalSearchParams } from "expo-router";

import { ApiError, authApi } from "@/lib/api";
import { validateEmail } from "@/lib/validation";
import { useAuth } from "@/state/auth";

type ResendStatus = "idle" | "sending" | "sent";

/** Turns a failed login into a message the user can act on. */
function loginErrorMessage(err: unknown): string {
  if (!(err instanceof ApiError)) return "Something went wrong. Please try again.";
  if (err.status === 401 && /invalid login credentials/i.test(err.message)) {
    return "Incorrect email or password.";
  }
  return err.message;
}

// tells react native what the page shows and does
export default function LoginScreen() {
  const { signIn } = useAuth();
  // set by Forgot Password after a successful reset
  const params = useLocalSearchParams<{ email?: string; reset?: string }>();
  const justReset = params.reset === "1";

  //stores the users email, password and its visibility
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Login stays mounted under Forgot Password, so apply a new email param when it arrives
  const [appliedEmailParam, setAppliedEmailParam] = useState<string>();
  if (typeof params.email === "string" && params.email !== appliedEmailParam) {
    setAppliedEmailParam(params.email);
    setEmail(params.email);
    setPassword("");
  }

  // set when Supabase rejects the login because the email isn't confirmed yet
  const [unconfirmed, setUnconfirmed] = useState(false);
  const [resendStatus, setResendStatus] = useState<ResendStatus>("idle");
  const [resendError, setResendError] = useState<string | null>(null);

  // checks the form, logs in through the API, and saves the session.
  // The root layout's route guard then moves the user to Home.
  const handleLogin = async () => {
    const nextEmailError = validateEmail(email);
    const nextPasswordError = password ? null : "Enter your password.";
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    setFormError(null);
    setUnconfirmed(false);
    setResendStatus("idle");
    setResendError(null);
    if (nextEmailError || nextPasswordError) return;

    setLoading(true);
    try {
      const { user, session } = await authApi.login(
        email.trim().toLowerCase(),
        password,
      );
      if (!session) throw new ApiError(401, "Login failed. Please try again.");
      await signIn(user, session);
    } catch (err) {
      if (err instanceof ApiError && /email not confirmed/i.test(err.message)) {
        setUnconfirmed(true);
      } else {
        setFormError(loginErrorMessage(err));
      }
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendStatus("sending");
    setResendError(null);
    try {
      await authApi.resendVerification(email.trim().toLowerCase());
      setResendStatus("sent");
    } catch (err) {
      setResendStatus("idle");
      setResendError(
        err instanceof ApiError ? err.message : "Couldn't resend the email.",
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets={true}
        showsVerticalScrollIndicator={false}
      > 

      {/* BLUE HEADER */}
      <View style={styles.header}>
        <View style={styles.logoBox}>
          <Text style={styles.logoEmoji}>🎓</Text>
        </View>

        <Text style={styles.appTitle}>NYIT Campus</Text>
        <Text style={styles.appSubtitle}>Club & Events Hub</Text>
      </View>

      {/* WHITE LOGIN AREA */}
      <View style={styles.loginArea}>
        <Text style={styles.signInTitle}>Sign in</Text>

        <Text style={styles.signInSubtitle}>
          Enter your email
        </Text>

        {/* PASSWORD RESET CONFIRMATION */}
        {justReset && (
          <View
            style={styles.successBox}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
          >
            <Text style={styles.noticeTitle}>✓ Password updated</Text>
            <Text style={styles.noticeText}>
              Log in with your new password.
            </Text>
          </View>
        )}

        {/* EMAIL */}
        <Text style={styles.label}>Email</Text>

        <View
          style={[styles.inputContainer, emailError && styles.inputInvalid]}
        >
          <Text style={styles.inputIcon} importantForAccessibility="no">
            ✉️
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor="#6B6E7A"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
            editable={!loading}
            accessibilityLabel="Email"
          />
        </View>
        {emailError && (
          <Text style={styles.fieldError} accessibilityLiveRegion="polite">
            {emailError}
          </Text>
        )}

        {/* PASSWORD */}
        <Text style={styles.label}>Password</Text>

        <View
          style={[styles.inputContainer, passwordError && styles.inputInvalid]}
        >
          <Text style={styles.inputIcon} importantForAccessibility="no">
            🔒
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter password"
            placeholderTextColor="#6B6E7A"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoComplete="current-password"
            textContentType="password"
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={handleLogin}
            returnKeyType="go"
            editable={!loading}
            accessibilityLabel="Password"
          />

          <Pressable
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeButton}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? "Hide password" : "Show password"}
          >
            <Text style={styles.eyeIcon}>
              {showPassword ? "🙈" : "👁️"}
            </Text>
          </Pressable>
        </View>
        {passwordError && (
          <Text style={styles.fieldError} accessibilityLiveRegion="polite">
            {passwordError}
          </Text>
        )}

        {/* FORGOT PASSWORD */}
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/forgot-password",
              params: { email: email.trim() },
            })
          }
          disabled={loading}
          style={styles.forgotPasswordButton}
          accessibilityRole="button"
          accessibilityLabel="Forgot password?"
        >
          <Text style={styles.forgotPassword}>
            Forgot password?
          </Text>
        </Pressable>

        {/* LOGIN ERRORS */}
        {formError && (
          <Text
            style={styles.formError}
            accessibilityRole="alert"
            accessibilityLiveRegion="assertive"
          >
            {formError}
          </Text>
        )}

        {unconfirmed && (
          <View
            style={styles.noticeBox}
            accessibilityRole="alert"
            accessibilityLiveRegion="assertive"
          >
            <Text style={styles.noticeTitle}>Verify your email first</Text>
            <Text style={styles.noticeText}>
              Open the email we sent to {email.trim()} and tap the link, then
              log in.
            </Text>

            {resendStatus === "sent" ? (
              <Text style={styles.noticeText} accessibilityLiveRegion="polite">
                ✓ New verification email sent.
              </Text>
            ) : (
              <Pressable
                onPress={handleResend}
                disabled={resendStatus === "sending"}
                style={styles.noticeButton}
                accessibilityRole="button"
                accessibilityLabel="Resend verification email"
                accessibilityState={{ busy: resendStatus === "sending" }}
              >
                <Text style={styles.noticeButtonText}>
                  {resendStatus === "sending"
                    ? "Sending…"
                    : "Resend verification email"}
                </Text>
              </Pressable>
            )}

            {resendError && (
              <Text style={styles.fieldError} accessibilityLiveRegion="polite">
                {resendError}
              </Text>
            )}
          </View>
        )}

        {/* SIGN IN BUTTON */}
        <Pressable
          style={[styles.signInButton, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Login"
          accessibilityState={{ disabled: loading, busy: loading }}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.signInButtonText}>Login</Text>
          )}
        </Pressable>
        {/* SIGN UP BUTTON */}
        <Pressable
          style={styles.signUpButton}
          onPress={() => router.push("/signup")}
          disabled={loading}
          accessibilityRole="button"
        >
          <Text style={styles.signUpButtonText}>Don't have an account? Sign Up</Text>
        </Pressable>
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
// below is the appearance of the components and styling of the app, controls the layout
// while first section makes the compoents and controls it
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
// remove if needed 
  scrollView: {
    flex: 1,
  },
  
  scrollContent: {
    flexGrow: 1,
  },

  header: {
    backgroundColor: "#0B55B7",
    height: 300,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 35,
    
    borderBottomLeftRadius: 45,
    borderBottomRightRadius: 45,
  },
  
  logoBox: {
    width: 65,
    height: 64,
    borderRadius: 14,
    backgroundColor:"rgba(255,255,255,0.22)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },

  logoEmoji: {
    fontSize: 32,
  },

  appTitle: {
    color: "#FFFFFF",
    fontSize: 27,
    fontWeight: "bold",
  },

  appSubtitle: {
    color: "#E6EEFB",
    fontSize: 14,
    marginTop: 4,
  },

  loginArea: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 40,
  },

  signInTitle: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#171717",
  },

  signInSubtitle: {
    fontSize: 14,
    color: "#696C7A",
    marginTop: 6,
    marginBottom: 28,
  },
  
  label: {
    fontSize: 14,
    color: "#222222",
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 10,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F6",
    borderWidth: 1,
    borderColor: "#E0E1E5",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 55,
  },

  inputIcon: {
    fontSize: 17,
    marginRight: 10,
    color: "#7A7E8C",
  },

  input: {
    flex: 1,
    fontSize: 15,
    color: "#111111",
    letterSpacing: 0, //delete this if not needed
  },

  eyeIcon: {
    fontSize: 18,
  },

  eyeButton: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },

  inputInvalid: {
    borderColor: "#C62828",
  },

  fieldError: {
    color: "#C62828",
    fontSize: 13,
    marginTop: 6,
  },

  formError: {
    color: "#C62828",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 16,
  },

  forgotPasswordButton: {
    alignSelf: "flex-end",
    minHeight: 44,
    justifyContent: "center",
  },

  successBox: {
    marginTop: -12,
    marginBottom: 16,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#E6F4EA",
  },

  noticeBox: {
    marginTop: 16,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#E7EFFB",
  },

  noticeTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#171717",
  },

  noticeText: {
    fontSize: 14,
    color: "#171717",
    marginTop: 6,
    lineHeight: 20,
  },

  noticeButton: {
    minHeight: 44,
    justifyContent: "center",
    alignSelf: "flex-start",
  },

  noticeButtonText: {
    color: "#0B55B7",
    fontSize: 14,
    fontWeight: "600",
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  forgotPassword: {
    textAlign: "right",
    color: "#0B55B7",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 12,
  },

  signInButton: {
    backgroundColor: "#0B55B7",
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 26,

    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 3,
    },

    elevation: 4,
  },

  signInButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "bold",
  },
  
  signUpButton: {
    marginTop: 18,
    alignItems: "center",
  },
  
  signUpButtonText: {
    color: "#0B55B7",
    fontSize: 15,
    fontWeight: "600",
  },
});