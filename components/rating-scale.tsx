import * as Haptics from "expo-haptics";
import React from "react";
import { View, Pressable, StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useLanguage } from "@/contexts/language-context";

interface RatingScaleProps {
  value: number;
  onChange: (value: number) => void;
  maxRating?: number;
}

export function RatingScale({ value, onChange, maxRating = 5 }: RatingScaleProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { t } = useLanguage();

  const labels = [
    t("ratingPoor"),
    t("ratingFair"),
    t("ratingGood"),
    t("ratingVeryGood"),
    t("ratingExcellent"),
  ];

  const handlePress = (rating: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(rating);
  };

  return (
    <View style={styles.container}>
      <View style={styles.ratingRow}>
        {Array.from({ length: maxRating }, (_, i) => i + 1).map((rating) => (
          <Pressable
            key={rating}
            onPress={() => handlePress(rating)}
            style={[
              styles.ratingButton,
              {
                backgroundColor: value >= rating ? colors.tint : colors.surface,
                borderColor: value >= rating ? colors.tint : colors.border,
              },
            ]}
          >
            <ThemedText
              style={[
                styles.ratingNumber,
                { color: value >= rating ? "#FFFFFF" : colors.text },
              ]}
            >
              {rating}
            </ThemedText>
          </Pressable>
        ))}
      </View>
      {value > 0 && (
        <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
          {labels[value - 1]}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: Spacing.sm,
  },
  ratingRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  ratingButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  ratingNumber: {
    fontSize: 18,
    fontWeight: "600",
  },
  label: {
    fontSize: 14,
    marginTop: Spacing.xs,
  },
});
