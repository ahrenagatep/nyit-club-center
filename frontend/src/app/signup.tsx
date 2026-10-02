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

import { router } from "expo-router";

import { FormField } from "@/components/form-field";
import { ApiError, authApi } from "@/lib/api";
import {
  validateEmail,
  validateName,
  validatePassword,
  validateUsername,
} from "@/lib/validation";
import { useAuth } from "@/state/auth";

type FieldName =
  | "firstName"
  | "lastName"
  | "username"
  | "email"
  | "password"
  | "confirmPassword";

type FieldErrors = Partial<Record<FieldName, string>>;

export default function SignUpScreen() {
  const { signIn } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {
      firstName: validateName(firstName, "first name") ?? undefined,
      lastName: validateName(lastName, "last name") ?? undefined,
      username: validateUsername(username) ?? undefined,
      email: validateEmail(email) ?? undefined,
      password: validatePassword(password) ?? undefined,
      confirmPassword:
        password !== confirmPassword ? "Passwords don't match." : undefined,
    };
    return Object.fromEntries(
      Object.entries(errors).filter(([, message]) => message),
    ) as FieldErrors;
  };

  // checks the form, creates the account through the API, then sends the
  // user to check their email (or straight in if no confirmation is needed)
  const handleSignUp = async () => {
    const errors = validate();
    setFieldErrors(errors);
    setError("");
    if (Object.keys(errors).length > 0) {
      setError("Please fix the highlighted fields.");
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    setLoading(true);
    try {
      const { user, session } = await authApi.register({
        nyit_email: cleanEmail,
        password,
        username: username.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
      });

      if (session) {
        // Email confirmation is turned off in Supabase: the user is already in.
        await signIn(user, session);
        return;
      }

      router.replace({
        pathname: "/verification",
        params: { email: cleanEmail },
      });
    } catch (err) {
      // show the error on its field when it clearly belongs to one, otherwise above the button
      if (err instanceof ApiError && /username/i.test(err.message)) {
        setFieldErrors({ username: err.message });
      } else if (
        err instanceof ApiError &&
        /already (exists|registered)/i.test(err.message)
      ) {
        setFieldErrors({ email: err.message });
      } else {
        setError(
          err instanceof ApiError
            ? err.message
            : "Something went wrong. Please try again.",
        );
      }
      setLoading(false);
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

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoBox}>
          <Text style={styles.logoEmoji}>🎓</Text>
        </View>

        <Text style={styles.appTitle}>NYIT Campus</Text>
        <Text style={styles.appSubtitle}>Club & Events Hub</Text>
      </View>

      {/* Sign up Border */}
      <View style={styles.signUpArea}>
        <Text style={styles.title} accessibilityRole="header">
          Create Account
        </Text>
        <Text style={styles.subtitle}>Use NYIT email to Sign up</Text>

        {/* Name */}
        <FormField
          label="First Name"
          placeholder="John"
          autoCapitalize="words"
          autoComplete="given-name"
          textContentType="givenName"
          value={firstName}
          onChangeText={setFirstName}
          error={fieldErrors.firstName}
          editable={!loading}
          maxLength={100}
        />

        <FormField
          label="Last Name"
          placeholder="Doe"
          autoCapitalize="words"
          autoComplete="family-name"
          textContentType="familyName"
          value={lastName}
          onChangeText={setLastName}
          error={fieldErrors.lastName}
          editable={!loading}
          maxLength={100}
        />

        {/* Username */}
        <FormField
          label="Username"
          placeholder="johndoe"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="username-new"
          textContentType="username"
          value={username}
          onChangeText={setUsername}
          error={fieldErrors.username}
          editable={!loading}
          maxLength={50}
        />

        {/* Email */}
        <FormField
          label="NYIT Email"
          placeholder="johnDoe@nyit.edu" //change this if needed
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          value={email}
          onChangeText={setEmail}
          error={fieldErrors.email}
          editable={!loading}
        />

        {/* Password */}
        <FormField
          label="Password"
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

        {/*Confirm password */}
        <FormField
          label="Confirm Password"
          placeholder="Re-enter your password"
          secure
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          onSubmitEditing={handleSignUp}
          returnKeyType="go"
          error={fieldErrors.confirmPassword}
          editable={!loading}
        />

        {/* Error Text */}
        {error !== "" && (
          <Text
            style={styles.errorText}
            accessibilityRole="alert"
            accessibilityLiveRegion="assertive"
          >
            {error}
          </Text>
        )}

        {/* Creating account*/}
        <Pressable
          style={[styles.signUpButton, loading && styles.buttonDisabled]}
          onPress={handleSignUp}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Create account"
          accessibilityState={{ disabled: loading, busy: loading }}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.signUpButtonText}>CREATE</Text>
          )}
        </Pressable>

        {/* Back to login */}
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Have an account? Sign in"
        >
          <Text style={styles.backButtonText}> Have an account? Sign In</Text>
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

  signUpArea: {
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
    marginBottom: 30,
  },

  errorText: {
    color: "#C62828",
    fontSize: 14,
    marginBottom: 15,
  },

  signUpButton: {
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

  signUpButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
  },

  backButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    marginTop: 12,
  },

  backButtonText: {
    color: "#0B55B7",
    fontSize: 15,
    fontWeight: "600",
  },
});
