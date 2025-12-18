import React from "react";
import { View, TextInput, StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { RatingScale } from "@/components/rating-scale";
import { YesNoToggle } from "@/components/yes-no-toggle";
import { Question } from "@/constants/data";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useLanguage } from "@/contexts/language-context";

interface QuestionCardProps {
  question: Question;
  value: string | number;
  onChange: (value: string | number) => void;
}

export function QuestionCard({ question, value, onChange }: QuestionCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { language } = useLanguage();

  const questionText = language === "pt" ? question.textPt : question.textEn;

  const renderInput = () => {
    switch (question.type) {
      case "rating":
        return (
          <RatingScale
            value={typeof value === "number" ? value : 0}
            onChange={(v) => onChange(v)}
          />
        );
      case "yesno":
        return (
          <YesNoToggle
            value={typeof value === "string" ? value : ""}
            onChange={(v) => onChange(v)}
          />
        );
      case "text":
      default:
        return (
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            value={typeof value === "string" ? value : ""}
            onChangeText={(v) => onChange(v)}
            placeholder="..."
            placeholderTextColor={colors.textDisabled}
            multiline
            numberOfLines={2}
          />
        );
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.surface }]}>
      <ThemedText style={styles.questionText}>{questionText}</ThemedText>
      <View style={styles.inputContainer}>{renderInput()}</View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  questionText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.md,
    lineHeight: 24,
  },
  inputContainer: {
    marginTop: Spacing.xs,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: "top",
  },
});
