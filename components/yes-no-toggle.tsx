import * as Haptics from "expo-haptics";
import React from "react";
import { View, Pressable, StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useLanguage } from "@/contexts/language-context";

interface YesNoToggleProps {
  value: string;
  onChange: (value: string) => void;
}

export function YesNoToggle({ value, onChange }: YesNoToggleProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { t } = useLanguage();

  const handlePress = (selected: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(selected);
  };

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => handlePress("yes")}
        style={[
          styles.button,
          {
            backgroundColor: value === "yes" ? colors.tint : colors.surface,
            borderColor: value === "yes" ? colors.tint : colors.border,
          },
        ]}
      >
        <ThemedText
          style={[
            styles.buttonText,
            { color: value === "yes" ? "#FFFFFF" : colors.text },
          ]}
        >
          {t("yes")}
        </ThemedText>
      </Pressable>
      <Pressable
        onPress={() => handlePress("no")}
        style={[
          styles.button,
          {
            backgroundColor: value === "no" ? colors.tint : colors.surface,
            borderColor: value === "no" ? colors.tint : colors.border,
          },
        ]}
      >
        <ThemedText
          style={[
            styles.buttonText,
            { color: value === "no" ? "#FFFFFF" : colors.text },
          ]}
        >
          {t("no")}
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
