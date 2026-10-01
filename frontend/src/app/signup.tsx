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
} from "react-native";

import { router } from "expo-router";

export default function SignUpScreen() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSignUp = () => {

    const cleanEmail = email.trim().toLowerCase();

    if (password.length === 0) {
      setError("Enter a password.")
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords don't match.")
      return;
    }

    setError("");

    router.push({
      pathname: "/verification",
      params: { email: cleanEmail },
    });
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
        <Text style={styles.title}> Create Account</Text>
        <Text style={styles.subtitle}>Use NYIT email to Sign up</Text>

        {/* Email */}
        <Text style={styles.label}>NYIT Email</Text>

        <TextInput
          style={styles.input}
          placeholder="johnDoe@nyit.edu" //change this if needed
          placeholderTextColor="#8A8A8A"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        {/* Password */}
        <Text style={styles.label}>Password</Text>

        <TextInput
          style={styles.input}
          placeholder="enter a password"
          placeholderTextColor="#8A8A8A"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {/*Confirm password */}
        <Text style={styles.label}>Confirm Password</Text>

        <TextInput
          style={styles.input}
          placeholder="Re-enter your password"
          placeholderTextColor="#8A8A8A"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        {/* Error Text */}
        {error !== "" && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        {/* Creating account*/}
        <Pressable
          style={styles.signUpButton}
          onPress={handleSignUp}
        >
          <Text style={styles.signUpButtonText}>CREATE</Text>
        </Pressable>

        {/* Back to login */}
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
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
    color: "#777B8A",
    marginTop: 7,
    marginBottom: 30,
  },

  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#222222",
    marginBottom: 8,
  },

  input: {
    borderWidth: 1,
    borderColor: "#D6D8DD",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 20,
    color: "#171717",
    letterSpacing: 0,
  },

  errorText: {
    color: "#D32F2F",
    fontSize: 14,
    marginBottom: 15,
  },

  signUpButton: {
    backgroundColor: "#0B55B7",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 5,
  },

  signUpButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
  },

  backButton: {
    alignItems: "center",
    marginTop: 22,
  },

  backButtonText: {
    color: "#0B55B7",
    fontSize: 15,
    fontWeight: "600",
  },
});