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

import { router, useLocalSearchParams } from "expo-router";

export default function VerificationScreen() {
    const { email } = useLocalSearchParams();

    const [code, setCode] = useState("");
    const [error, setError] = useState("");

    const handleVerify = () => {
        if (code.length != 6) {
            setError("Enter a 6 digit verification code.")
            return;
        }
        setError("")

        router.replace("/")
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            {/* Back button */}
            <Pressable
                style={styles.backButton}
                onPress={() => router.back()}
            >
                <Text style={styles.backArrow}>‹</Text>
            </Pressable>

            {/* Title */}
            <Text style={styles.title}>Check your email</Text>
            <Text style={styles.subtitle}> We have sent a 6-digit code to</Text>
            <Text style={styles.emailText}>{email}</Text>

            {/* code input */}
            <TextInput
                style={styles.codeInput}
                placeholder="Enter 6-digit code"
                placeholderTextColor="#999999"
                keyboardType="number-pad"
                maxLength={6}
                value={code}
                onChangeText={setCode}
            />

            {/* Error */}
            {error !== "" && (
                <Text style={styles.errorText}>{error}</Text>
            )}

            {/* Verify Button */}
            <Pressable
                style={styles.verifyButton}
                onPress={handleVerify}
            >
                <Text style={styles.verifyButtonText}>Verify Email</Text>
            </Pressable>

            {/* Resend */}
            <View style={styles.resendRow}>
                <Text style={styles.resendText}>Didn't recieve code?</Text>

                <Pressable>
                    <Text style={styles.resendButton}>Resend Code</Text>
                </Pressable>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 28,
        paddingTop: 70,
    },

    backButton: {
        marginBottom: 35,
    },

    backArrow: {
        fontSize: 40,
        color: "#171717",
    },

    title: {
        fontSize: 30,
        fontWeight: "bold",
        color: "#171717",
    },

    subtitle: {
        marginTop: 12,
        fontSize: 16,
        color: "#777B8A",
    },

    emailText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#0B55B7",
        marginTop: 5,
        marginBottom: 35,
    },

    codeInput: {
        borderWidth: 1,
        borderColor: "#D5D8DD",
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 16,
        fontSize: 20,
        letterSpacing: 8,
        textAlign: "center",
        color: "#171717",
    },

    errorText: {
        color: "#D32F2F",
        fontSize: 14,
        marginTop: 10,
    },

    verifyButton: {
        backgroundColor: "#0B55B7",
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 25,
    },

    verifyButtonText: {
        color: "#FFFFFF",
        fontSize: 17,
        fontWeight: "600",
    },

    resendRow: {
        flexDirection: "row",
        justifyContent: "center",
        marginTop: 22,
        gap: 5,
    },

    resendText: {
        color: "#777B8A",
        fontSize: 14,
    },

    resendButton: {
        color: "#0B55B7",
        fontSize: 14,
        fontWeight: "600",
    },
});
