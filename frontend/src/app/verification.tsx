import React from "react";

import {
    View,
    Text,
    Pressable,
    StyleSheet,
} from "react-native";

import { router, useLocalSearchParams } from "expo-router";

export default function VerificationScreen() {
    const { email } = useLocalSearchParams();

    return (
        <View style={styles.container}>
            {/*Back Button*/}
            <Pressable
                style={styles.backButton}
                onPress={() => router.back()}
            >
                <Text style={styles.backArrow}>‹</Text>
            </Pressable>

            {/*Popup*/}
            <View style={styles.popupCard}>
                <Text style={styles.icon}>✉️</Text>
                <Text style={styles.title}>Please check your email</Text>
                <Text style={styles.message}>Verification link has been sent to:</Text>
                <Text style={styles.emailText}>{email}</Text>
                <Text style={styles.instructions}> Open email and click link to confirm your account</Text>

                {/*Back to login*/}
                <Pressable
                    style={styles.loginButton}
                    onPress={() => router.replace("/")}
                >
                    <Text style={styles.loginButtonText}>Back to Login</Text>
                </Pressable>

                {/* Resend */}
                <Pressable>
                    <Text style={styles.resendButton}>
                        Resend Verification
                    </Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: "#F5F7FA",
        paddingHorizontal: 25,
        paddingTop: 70,
    },

    backButton: {
        marginBottom: 40,
    },

    backArrow: {
        fontSize: 40,
        color: "#171717",
    },

    popupCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 28,
        alignItems: "center",

        shadowColor: "#000000",
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
        color: "#171717",
    },

    message: {
        marginTop: 15,
        fontSize: 16,
        color: "#777B8A",
        textAlign: "center",
    },

    emailText: {
        marginTop: 8,
        fontSize: 16,
        fontWeight: "600",
        color: "#0B55B7",
    },

    instructions: {
        marginTop: 20,
        fontSize: 15,
        color: "#777B8A",
        textAlign: "center",
        lineHeight: 22,
    },

    loginButton: {
        backgroundColor: "#0B55B7",
        width: "100%",
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 30,
    },

    loginButtonText: {
        color: "#FFFFFF",
        fontSize: 17,
        fontWeight: "600",
    },

    resendButton: {
        color: "#0B55B7",
        fontSize: 14,
        fontWeight: "600",
        marginTop: 20,
    },
});


