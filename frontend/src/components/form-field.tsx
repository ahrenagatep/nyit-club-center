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

import type { ThemeColors } from "@/constants/theme";
import { useTheme, useThemedStyles } from "@/state/theme";

export function FormField({
  label,
  error,
  secure,
  ...inputProps
}: TextInputProps & { label: string; error?: string; secure?: boolean }) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);

  return (
    <>
      <Text style={styles.label}>{label}</Text>

      <View style={[styles.inputRow, error && styles.inputInvalid]}>
        <TextInput
          style={styles.inputText}
          placeholderTextColor={colors.placeholderForm}
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

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textLabel,
    marginBottom: 8,
  },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 12,
    paddingHorizontal: 15,
  },

  inputText: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    letterSpacing: 0,
  },

  inputInvalid: {
    borderColor: colors.error,
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
    color: colors.error,
    fontSize: 13,
    minHeight: 20,
    marginTop: 4,
    marginBottom: 4,
  },
});
