import { useRouter } from "expo-router";
import React from "react";
import { View, ScrollView, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { EntryCard } from "@/components/entry-card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ThemedLotusIcon } from "@/components/themed-lotus-icon";
import { useAppTheme } from "@/contexts/theme-context";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useLanguage } from "@/contexts/language-context";
import { useData } from "@/contexts/data-context";
import { getLocalDateString, parseLocalDate } from "@/lib/date-utils";

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { t, language } = useLanguage();
  const { entries, isLoading, getStreak, getEntryByDate } = useData();
  const { colors: themeColors } = useAppTheme();

  const today = new Date();
  const todayStr = getLocalDateString(today);
  const todayEntry = getEntryByDate(todayStr);
  const streak = getStreak();
  
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const monthEntries = entries.filter(e => {
    const d = parseLocalDate(e.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const getGreeting = () => {
    const hour = today.getHours();
    if (hour < 12) return t("homeGreeting");
    if (hour < 18) return t("homeGreetingAfternoon");
    return t("homeGreetingEvening");
  };

  const formatDate = () => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      day: "numeric",
      month: "long",
    };
    return today.toLocaleDateString(language === "pt" ? "pt-BR" : "en-US", options);
  };

  const recentEntries = entries.slice(0, 3);

  if (isLoading) {
    return (
      <ThemedView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Math.max(insets.top, 20) + Spacing.md },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerText}>
              <ThemedText style={[styles.greeting, { color: colors.textSecondary }]}>
                {getGreeting()}
              </ThemedText>
              <ThemedText style={styles.date}>{formatDate()}</ThemedText>
            </View>
            <ThemedLotusIcon size={56} />
          </View>
        </View>

        {/* Today's Status Card */}
        <ThemedView style={[styles.statusCard, { backgroundColor: colors.surface }]}>
          <View style={styles.statusHeader}>
            <IconSymbol 
              name={todayEntry ? "checkmark" : "sun.max.fill"} 
              size={32} 
              color={todayEntry ? colors.success : colors.tint} 
            />
            <ThemedText style={styles.statusTitle}>
              {todayEntry ? t("homeEntryLogged") : t("homeNoEntry")}
            </ThemedText>
          </View>
          
          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <ThemedText style={[styles.statValue, { color: colors.tint }]}>
                {streak}
              </ThemedText>
              <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
                {t("homeStreak")}
              </ThemedText>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <ThemedText style={[styles.statValue, { color: colors.tintSecondary }]}>
                {monthEntries.length}
              </ThemedText>
              <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
                {t("homeThisMonth")}
              </ThemedText>
            </View>
          </View>
        </ThemedView>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Pressable
            style={[styles.logButton, { backgroundColor: colors.tint, flex: 1 }]}
            onPress={() => router.push("/new-entry" as any)}
          >
            <IconSymbol name="plus" size={24} color="#FFFFFF" />
            <ThemedText style={styles.logButtonText}>
              {t("homeLogMeditation")}
            </ThemedText>
          </Pressable>
          
          <Pressable
            style={[styles.timerButton, { backgroundColor: colors.tintSecondary }]}
            onPress={() => router.push("/timer" as any)}
          >
            <IconSymbol name="timer" size={24} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Recent Entries */}
        <View style={styles.recentSection}>
          <ThemedText style={styles.sectionTitle}>{t("homeRecentEntries")}</ThemedText>
          
          {recentEntries.length > 0 ? (
            recentEntries.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                onPress={() => router.push({ pathname: "/entry-detail" as any, params: { id: entry.id } })}
              />
            ))
          ) : (
            <ThemedView style={[styles.emptyState, { backgroundColor: colors.surface }]}>
              <IconSymbol name="list.bullet" size={48} color={colors.textDisabled} />
              <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
                {t("homeNoRecentEntries")}
              </ThemedText>
            </ThemedView>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerText: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    marginBottom: Spacing.xs,
  },
  date: {
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 36,
  },
  statusCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 32,
    fontWeight: "700",
    lineHeight: 40,
  },
  statLabel: {
    fontSize: 14,
    marginTop: Spacing.xs,
  },
  statDivider: {
    width: 1,
    height: 48,
    marginHorizontal: Spacing.md,
  },
  actionButtons: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  logButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  timerButton: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  logButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  recentSection: {
    marginTop: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  emptyState: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
});
