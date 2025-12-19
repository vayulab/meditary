import { useRouter } from "expo-router";
import React, { useState } from "react";
import { View, ScrollView, Pressable, StyleSheet, FlatList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { EntryCard } from "@/components/entry-card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useLanguage } from "@/contexts/language-context";
import { useData } from "@/contexts/data-context";

const WEEKDAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAYS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function HistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { t, language } = useLanguage();
  const { entries, sessions, getEntriesForMonth, getSessionsForMonth } = useData();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthEntries = getEntriesForMonth(year, month);
  const monthSessions = getSessionsForMonth(year, month);

  const weekdays = language === "pt" ? WEEKDAYS_PT : WEEKDAYS_EN;

  const formatMonthYear = () => {
    const options: Intl.DateTimeFormatOptions = { month: "long", year: "numeric" };
    return currentDate.toLocaleDateString(language === "pt" ? "pt-BR" : "en-US", options);
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getDaysInMonth = () => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = [];

    // Add empty slots for days before the first day of month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const hasEntryOnDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const hasEntry = monthEntries.some(e => e.date === dateStr);
    const hasSession = monthSessions.some(s => s.date === dateStr);
    return hasEntry || hasSession;
  };

  const getEntryForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return monthEntries.find(e => e.date === dateStr);
  };

  const getSessionForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return monthSessions.find(s => s.date === dateStr);
  };

  const handleDayPress = (day: number) => {
    const entry = getEntryForDay(day);
    if (entry) {
      router.push({ pathname: "/entry-detail" as any, params: { id: entry.id } });
    }
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  const days = getDaysInMonth();

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) + Spacing.md }]}>
        <ThemedText style={styles.title}>{t("historyTitle")}</ThemedText>
        
        {/* View Toggle */}
        <View style={[styles.viewToggle, { backgroundColor: colors.surface }]}>
          <Pressable
            style={[
              styles.toggleButton,
              viewMode === "calendar" && { backgroundColor: colors.tint },
            ]}
            onPress={() => setViewMode("calendar")}
          >
            <IconSymbol 
              name="square.grid.2x2" 
              size={20} 
              color={viewMode === "calendar" ? "#FFFFFF" : colors.textSecondary} 
            />
          </Pressable>
          <Pressable
            style={[
              styles.toggleButton,
              viewMode === "list" && { backgroundColor: colors.tint },
            ]}
            onPress={() => setViewMode("list")}
          >
            <IconSymbol 
              name="list.bullet" 
              size={20} 
              color={viewMode === "list" ? "#FFFFFF" : colors.textSecondary} 
            />
          </Pressable>
        </View>
      </View>

      {viewMode === "calendar" ? (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Month Navigation */}
          <View style={styles.monthNav}>
            <Pressable onPress={goToPreviousMonth} style={styles.navButton}>
              <IconSymbol name="chevron.left" size={24} color={colors.tint} />
            </Pressable>
            <ThemedText style={styles.monthTitle}>{formatMonthYear()}</ThemedText>
            <Pressable onPress={goToNextMonth} style={styles.navButton}>
              <IconSymbol name="chevron.right" size={24} color={colors.tint} />
            </Pressable>
          </View>

          {/* Weekday Headers */}
          <View style={styles.weekdayRow}>
            {weekdays.map((day) => (
              <ThemedText 
                key={day} 
                style={[styles.weekdayText, { color: colors.textSecondary }]}
              >
                {day}
              </ThemedText>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {days.map((day, index) => (
              <Pressable
                key={index}
                style={styles.dayCell}
                onPress={() => day && handleDayPress(day)}
                disabled={!day || !hasEntryOnDay(day)}
              >
                {day && (
                  <View
                    style={[
                      styles.dayContent,
                      isToday(day) && { borderColor: colors.tint, borderWidth: 2 },
                      hasEntryOnDay(day) && { backgroundColor: colors.tint },
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.dayText,
                        hasEntryOnDay(day) && { color: "#FFFFFF" },
                        !hasEntryOnDay(day) && { color: colors.text },
                      ]}
                    >
                      {day}
                    </ThemedText>
                  </View>
                )}
              </Pressable>
            ))}
          </View>

          {/* Month Summary */}
          <ThemedView style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
            <ThemedText style={[styles.summaryText, { color: colors.textSecondary }]}>
              {monthEntries.length} {language === "pt" ? "registros neste mês" : "entries this month"}
            </ThemedText>
          </ThemedView>
        </ScrollView>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <EntryCard
              entry={item}
              onPress={() => router.push({ pathname: "/entry-detail" as any, params: { id: item.id } })}
            />
          )}
          ListEmptyComponent={
            <ThemedView style={[styles.emptyState, { backgroundColor: colors.surface }]}>
              <IconSymbol name="calendar" size={48} color={colors.textDisabled} />
              <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
                {t("historyNoEntries")}
              </ThemedText>
            </ThemedView>
          }
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
  },
  viewToggle: {
    flexDirection: "row",
    borderRadius: BorderRadius.sm,
    padding: 4,
  },
  toggleButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm - 2,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  monthNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  navButton: {
    padding: Spacing.sm,
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  weekdayRow: {
    flexDirection: "row",
    marginBottom: Spacing.sm,
  },
  weekdayText: {
    flex: 1,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.28%",
    aspectRatio: 1,
    padding: 4,
  },
  dayContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: BorderRadius.md,
  },
  dayText: {
    fontSize: 16,
    fontWeight: "500",
  },
  summaryCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xxl,
    alignItems: "center",
  },
  summaryText: {
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  emptyState: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
  },
});
