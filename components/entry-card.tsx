import React from "react";
import { Pressable, StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { MeditationEntry } from "@/constants/data";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useLanguage } from "@/contexts/language-context";

interface EntryCardProps {
  entry: MeditationEntry;
  onPress: () => void;
}

export function EntryCard({ entry, onPress }: EntryCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { language } = useLanguage();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = {
      weekday: "short",
      day: "numeric",
      month: "short",
    };
    return date.toLocaleDateString(language === "pt" ? "pt-BR" : "en-US", options);
  };

  const getAnswerCount = () => {
    return entry.answers.filter(a => a.value !== "" && a.value !== 0).length;
  };

  return (
    <Pressable onPress={onPress}>
      <ThemedView style={[styles.container, { backgroundColor: colors.surface }]}>
        <ThemedView style={styles.header}>
          <ThemedText style={styles.date}>{formatDate(entry.date)}</ThemedText>
          <ThemedView style={[styles.badge, { backgroundColor: colors.tint + "20" }]}>
            <ThemedText style={[styles.badgeText, { color: colors.tint }]}>
              {getAnswerCount()} {language === "pt" ? "respostas" : "answers"}
            </ThemedText>
          </ThemedView>
        </ThemedView>
        {entry.notes && (
          <ThemedText 
            style={[styles.notes, { color: colors.textSecondary }]} 
            numberOfLines={2}
          >
            {entry.notes}
          </ThemedText>
        )}
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  date: {
    fontSize: 16,
    fontWeight: "600",
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  notes: {
    fontSize: 14,
    marginTop: Spacing.sm,
    lineHeight: 20,
  },
});
