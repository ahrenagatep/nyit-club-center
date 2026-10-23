import React, { useState } from "react";

import {
    View,
    Text,
    Pressable,
    StyleSheet,
} from "react-native";

import { router, useLocalSearchParams } from "expo-router";

import type { ThemeColors } from "@/constants/theme";
import { ApiError, authApi } from "@/lib/api";
import { useThemedStyles } from "@/state/theme";

type ResendStatus = "idle" | "sending" | "sent";

// Shown after Sign Up. Supabase emails a confirmation link; once the user taps
// it they can log in. "Resend" asks the backend to send the email again.
export default function VerificationScreen() {
    const styles = useThemedStyles(createStyles);
    const { email } = useLocalSearchParams<{ email?: string }>();
    const address = typeof email === "string" ? email : "";

    const [resendStatus, setResendStatus] = useState<ResendStatus>("idle");
    const [resendError, setResendError] = useState<string | null>(null);

    const goToLogin = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace("/");
        }
    };

    const handleResend = async () => {
        if (!address) {
            setResendError("Go back and sign up again to get a new email.");
            return;
        }
        setResendStatus("sending");
        setResendError(null);
        try {
            await authApi.resendVerification(address);
            setResendStatus("sent");
        } catch (err) {
            setResendStatus("idle");
            setResendError(
                err instanceof ApiError ? err.message : "Couldn't resend the email.",
            );
        }
    };

    return (
        <View style={styles.container}>
            {/*Back Button*/}
            <Pressable
                style={styles.backButton}
                onPress={goToLogin}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Back to login"
            >
                <Text style={styles.backArrow}>‹</Text>
            </Pressable>

            {/*Popup*/}
            <View style={styles.popupCard}>
                <Text style={styles.icon} importantForAccessibility="no">✉️</Text>
                <Text style={styles.title} accessibilityRole="header">
                    Please check your email
                </Text>
                <Text style={styles.message}>Verification link has been sent to:</Text>
                <Text style={styles.emailText}>{address}</Text>
                <Text style={styles.instructions}>
                    Open the email and tap the link to confirm your account, then log in.
                </Text>

                {/*Back to login*/}
                <Pressable
                    style={styles.loginButton}
                    onPress={goToLogin}
                    accessibilityRole="button"
                >
                    <Text style={styles.loginButtonText}>Back to Login</Text>
                </Pressable>

                {/* Resend */}
                {resendStatus === "sent" ? (
                    <Text style={styles.resendNote} accessibilityLiveRegion="polite">
                        ✓ New verification email sent.
                    </Text>
                ) : (
                    <Pressable
                        onPress={handleResend}
                        disabled={resendStatus === "sending"}
                        style={styles.resendPressable}
                        accessibilityRole="button"
                        accessibilityLabel="Resend verification email"
                        accessibilityState={{ busy: resendStatus === "sending" }}
                    >
                        <Text style={styles.resendButton}>
                            {resendStatus === "sending" ? "Sending…" : "Resend Verification"}
                        </Text>
                    </Pressable>
                )}

                {resendError && (
                    <Text style={styles.resendError} accessibilityLiveRegion="polite">
                        {resendError}
                    </Text>
                )}
            </View>
        </View>
    );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: colors.backgroundMuted,
        paddingHorizontal: 25,
        paddingTop: 70,
    },

    backButton: {
        marginBottom: 40,
        minWidth: 44,
        minHeight: 44,
        alignSelf: "flex-start",
        justifyContent: "center",
    },

    backArrow: {
        fontSize: 40,
        color: colors.text,
    },

    popupCard: {
        backgroundColor: colors.surface,
        borderRadius: 20,
        padding: 28,
        alignItems: "center",

        shadowColor: colors.shadow,
        shadowOpacity: 0.08,
        shadowRadius: 10,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        elevation: 4,
    },

    icon: {
        fontSize: 50,
        marginBottom: 20,
    },

    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: colors.text,
    },

    message: {
        marginTop: 15,
        fontSize: 16,
        color: colors.textMuted,
        textAlign: "center",
    },

    emailText: {
        marginTop: 8,
        fontSize: 16,
        fontWeight: "600",
        color: colors.textAccent,
    },

    instructions: {
        marginTop: 20,
        fontSize: 15,
        color: colors.textMuted,
        textAlign: "center",
        lineHeight: 22,
    },

    loginButton: {
        backgroundColor: colors.primary,
        width: "100%",
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 30,
    },

    loginButtonText: {
        color: colors.onPrimary,
        fontSize: 17,
        fontWeight: "600",
    },

    resendPressable: {
        minHeight: 44,
        justifyContent: "center",
        marginTop: 10,
    },

    resendButton: {
        color: colors.textAccent,
        fontSize: 14,
        fontWeight: "600",
    },

    resendNote: {
        color: colors.text,
        fontSize: 14,
        marginTop: 20,
    },

    resendError: {
        color: colors.error,
        fontSize: 14,
        marginTop: 8,
        textAlign: "center",
    },
});


