import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";

import { router, useLocalSearchParams } from "expo-router";

import { FormField } from "@/components/form-field";
import { ApiError, authApi } from "@/lib/api";
import {
  validateEmail,
  validatePassword,
  validateResetCode,
} from "@/lib/validation";

type Step = "request" | "reset";
type FieldErrors = Partial<
  Record<"email" | "code" | "password" | "confirmPassword", string>
>;

function errorMessage(err: unknown): string {
  return err instanceof ApiError
    ? err.message
    : "Something went wrong. Please try again.";
}

// Opened from Login's "Forgot password?".
// Step 1 emails a reset code; step 2 takes the code and a new password.
// On success the user goes back to Login with their email filled in.
export default function ForgotPasswordScreen() {
  const params = useLocalSearchParams<{ email?: string }>();

  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState(
    typeof params.email === "string" ? params.email : "",
  );
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  const cleanEmail = email.trim().toLowerCase();

  const goToLogin = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  // Step 1 (and "Resend code"): ask the backend to email a code.
  const sendCode = async () => {
    const emailError = validateEmail(email);
    setFieldErrors(emailError ? { email: emailError } : {});
    setError("");
    setNotice("");
    if (emailError) return;

    setLoading(true);
    try {
      await authApi.forgotPassword(cleanEmail);
      setStep("reset");
      setNotice(
        `If an account exists for ${cleanEmail}, we sent it a reset code.`,
      );
    } catch (err) {
      if (err instanceof ApiError && err.code === "TIMEOUT") {
        // the email may still have been sent, so let the user enter a code if one arrives
        setStep("reset");
        setNotice(
          "The server took too long to respond, but a code may still arrive. If it does, enter it below; otherwise tap Resend code.",
        );
      } else {
        setError(errorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 2: check the code and set the new password.
  const resetPassword = async () => {
    const errors: FieldErrors = {
      code: validateResetCode(code) ?? undefined,
      password: validatePassword(password) ?? undefined,
      confirmPassword:
        password !== confirmPassword ? "Passwords don't match." : undefined,
    };
    const hasErrors = Object.values(errors).some(Boolean);
    setFieldErrors(errors);
    setError(hasErrors ? "Please fix the highlighted fields." : "");
    if (hasErrors) return;

    setLoading(true);
    try {
      await authApi.resetPassword(cleanEmail, code.trim(), password);
      const href = {
        pathname: "/" as const,
        params: { email: cleanEmail, reset: "1" },
      };
      if (router.canDismiss()) {
        router.dismissTo(href);
      } else {
        router.replace(href);
      }
    } catch (err) {
      // show the error on its field when it clearly belongs to one, otherwise above the button
      const message = errorMessage(err);
      if (/code/i.test(message)) {
        setFieldErrors({ code: message });
      } else if (/password/i.test(message)) {
        setFieldErrors({ password: message });
      } else {
        setError(message);
      }
      setLoading(false);
    }
  };

  const changeEmail = () => {
    setStep("request");
    setCode("");
    setPassword("");
    setConfirmPassword("");
    setFieldErrors({});
    setError("");
    setNotice("");
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
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Text style={styles.logoEmoji}>🔑</Text>
          </View>

          <Text style={styles.appTitle}>NYIT Campus</Text>
          <Text style={styles.appSubtitle}>Club & Events Hub</Text>
        </View>

        <View style={styles.formArea}>
          <Text style={styles.title} accessibilityRole="header">
            Reset Password
          </Text>
          <Text style={styles.subtitle}>
            {step === "request"
              ? "Enter your account email and we'll send you a reset code."
              : "Enter the code from the email and choose a new password."}
          </Text>

          {notice !== "" && (
            <View style={styles.noticeBox} accessibilityLiveRegion="polite">
              <Text style={styles.noticeText}>{notice}</Text>
            </View>
          )}

          {step === "request" ? (
            <FormField
              label="Email"
              placeholder="johnDoe@nyit.edu"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              value={email}
              onChangeText={setEmail}
              onSubmitEditing={sendCode}
              returnKeyType="send"
              error={fieldErrors.email}
              editable={!loading}
            />
          ) : (
            <>
              <FormField
                label="Reset Code"
                placeholder="6-digit code"
                keyboardType="number-pad"
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
                maxLength={10}
                value={code}
                onChangeText={setCode}
                error={fieldErrors.code}
                editable={!loading}
              />

              <FormField
                label="New Password"
                placeholder="At least 6 characters"
                secure
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="newPassword"
                value={password}
                onChangeText={setPassword}
                error={fieldErrors.password}
                editable={!loading}
              />

              <FormField
                label="Confirm New Password"
                placeholder="Re-enter your new password"
                secure
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="newPassword"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                onSubmitEditing={resetPassword}
                returnKeyType="go"
                error={fieldErrors.confirmPassword}
                editable={!loading}
              />
            </>
          )}

          {error !== "" && (
            <Text
              style={styles.errorText}
              accessibilityRole="alert"
              accessibilityLiveRegion="assertive"
            >
              {error}
            </Text>
          )}

          <Pressable
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={step === "request" ? sendCode : resetPassword}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel={
              step === "request" ? "Send reset code" : "Reset password"
            }
            accessibilityState={{ disabled: loading, busy: loading }}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {step === "request" ? "SEND CODE" : "RESET PASSWORD"}
              </Text>
            )}
          </Pressable>

          {step === "reset" && (
            <View style={styles.linkRow}>
              <Pressable
                style={styles.linkButton}
                onPress={sendCode}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Resend code"
              >
                <Text style={styles.linkText}>Resend code</Text>
              </Pressable>

              <Pressable
                style={styles.linkButton}
                onPress={changeEmail}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Use a different email"
              >
                <Text style={styles.linkText}>Use a different email</Text>
              </Pressable>
            </View>
          )}

          <Pressable
            style={styles.backButton}
            onPress={goToLogin}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Back to login"
          >
            <Text style={styles.linkText}>Back to Login</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },

  header: {
    backgroundColor: "#0B55B7",
    paddingTop: 80,
    paddingBottom: 45,
    alignItems: "center",
  },

  logoBox: {
    width: 65,
    height: 65,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  logoEmoji: {
    fontSize: 34,
  },

  appTitle: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "bold",
  },

  appSubtitle: {
    color: "#DCE8FF",
    fontSize: 15,
    marginTop: 4,
  },

  formArea: {
    paddingHorizontal: 28,
    paddingTop: 35,
    paddingBottom: 40,
  },

  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#171717",
  },

  subtitle: {
    fontSize: 16,
    color: "#696C7A",
    marginTop: 7,
    marginBottom: 24,
    lineHeight: 22,
  },

  noticeBox: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#E7EFFB",
    marginBottom: 20,
  },

  noticeText: {
    fontSize: 14,
    color: "#171717",
    lineHeight: 20,
  },

  errorText: {
    color: "#C62828",
    fontSize: 14,
    marginBottom: 15,
  },

  primaryButton: {
    backgroundColor: "#0B55B7",
    minHeight: 52,
    justifyContent: "center",
    borderRadius: 12,
    alignItems: "center",
    marginTop: 5,
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
  },

  linkRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    marginTop: 8,
  },

  linkButton: {
    minHeight: 44,
    justifyContent: "center",
  },

  backButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    marginTop: 12,
  },

  linkText: {
    color: "#0B55B7",
    fontSize: 15,
    fontWeight: "600",
  },
});
