import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import { router } from "expo-router";


export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    router.replace("/(tabs)/home");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
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
          Use your NYIT email
        </Text>

        {/* EMAIL */}
        <Text style={styles.label}>NYIT Email</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.inputIcon}>✉️</Text>

          <TextInput
            style={styles.input}
            placeholder="Enter your NYIT email"
            placeholderTextColor="#8A8D99"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        {/* PASSWORD */}
        <Text style={styles.label}>Password</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.inputIcon}>🔒</Text>

          <TextInput
            style={styles.input}
            placeholder="Enter password"
            placeholderTextColor="#8A8D99"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />

          <Pressable onPress={() => setShowPassword(!showPassword)}>
            <Text>
              {showPassword ? "🙈" : "👁️"}
            </Text>
          </Pressable>
        </View>

        {/* FORGOT PASSWORD */}
        <Pressable>
          <Text style={styles.forgotPassword}>
            Forgot password?
          </Text>
        </Pressable>

        {/* SIGN IN BUTTON */}
        <Pressable
          style={styles.signInButton}
          onPress={handleLogin}
        >
          <Text style={styles.signInButtonText}>
            Sign in
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
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
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
  },

  signInTitle: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#171717",
  },

  signInSubtitle: {
    fontSize: 14,
    color: "#757885",
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
  },

  eyeIcon: {
    fontSize: 18,
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

});