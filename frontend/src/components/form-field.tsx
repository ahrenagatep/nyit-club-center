/**
 * Labelled text input with an inline error and an optional show/hide toggle.
 * Used by Sign Up and Forgot Password.
 */
import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";

export function FormField({
  label,
  error,
  secure,
  ...inputProps
}: TextInputProps & { label: string; error?: string; secure?: boolean }) {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <Text style={styles.label}>{label}</Text>

      <View style={[styles.inputRow, error && styles.inputInvalid]}>
        <TextInput
          style={styles.inputText}
          placeholderTextColor="#6B6E7A"
          secureTextEntry={secure && !visible}
          accessibilityLabel={label}
          {...inputProps}
        />

        {secure && (
          <Pressable
            onPress={() => setVisible(!visible)}
            style={styles.eyeButton}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={
              visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`
            }
          >
            <Text style={styles.eyeIcon}>{visible ? "🙈" : "👁️"}</Text>
          </Pressable>
        )}
      </View>

      <Text style={styles.fieldError} accessibilityLiveRegion="polite">
        {error ?? ""}
      </Text>
    </>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#222222",
    marginBottom: 8,
  },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D6D8DD",
    borderRadius: 12,
    paddingHorizontal: 15,
  },

  inputText: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: "#171717",
    letterSpacing: 0,
  },

  inputInvalid: {
    borderColor: "#C62828",
  },

  eyeButton: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },

  eyeIcon: {
    fontSize: 18,
  },

  // reserves space under each field so errors don't shift the layout
  fieldError: {
    color: "#C62828",
    fontSize: 13,
    minHeight: 20,
    marginTop: 4,
    marginBottom: 4,
  },
});
