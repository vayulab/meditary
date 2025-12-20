import React, { useState, useMemo } from "react";
import { 
  View, 
  ScrollView, 
  Pressable, 
  StyleSheet, 
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Rect, Text as SvgText, Line, Circle } from "react-native-svg";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useLanguage } from "@/contexts/language-context";
import { useData } from "@/contexts/data-context";
import { getLocalDateString, parseLocalDate } from "@/lib/date-utils";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CHART_WIDTH = SCREEN_WIDTH - Spacing.md * 2 - Spacing.md * 2;
const CHART_HEIGHT = 200;

type TimeRange = "week" | "month" | "year";

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { language } = useLanguage();
  const { 
    entries, 
    sessions,
    questions, 
    getTotalMinutesMeditated, 
    getAverageConcentration, 
    getWeeklyStats 
  } = useData();

  const [timeRange, setTimeRange] = useState<TimeRange>("week");

  // Calculate date ranges
  const dateRanges = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 6);
    
    const monthStart = new Date(today);
    monthStart.setDate(today.getDate() - 29);
    
    const yearStart = new Date(today);
    yearStart.setMonth(today.getMonth() - 11);
    yearStart.setDate(1);

    return { today, weekStart, monthStart, yearStart };
  }, []);

  // Get entries for selected time range
  const filteredEntries = useMemo(() => {
    const { today, weekStart, monthStart, yearStart } = dateRanges;
    let startDate: Date;
    
    switch (timeRange) {
      case "week":
        startDate = weekStart;
        break;
      case "month":
        startDate = monthStart;
        break;
      case "year":
        startDate = yearStart;
        break;
    }

    return entries.filter(entry => {
      const entryDate = parseLocalDate(entry.date);
      return entryDate >= startDate && entryDate <= today;
    });
  }, [entries, timeRange, dateRanges]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalEntries = filteredEntries.length;
    const totalMinutes = getTotalMinutesMeditated();
    const avgConcentration = getAverageConcentration();

    // Calculate streak
    let currentStreak = 0;
    const sortedDates = [...new Set(entries.map(e => e.date))].sort().reverse();
    const today = getLocalDateString();
    
    for (let i = 0; i < sortedDates.length; i++) {
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - i);
      const expectedStr = getLocalDateString(expectedDate);
      
      if (sortedDates.includes(expectedStr)) {
        currentStreak++;
      } else if (i > 0) {
        break;
      }
    }

    return { totalEntries, totalMinutes, avgConcentration, currentStreak };
  }, [filteredEntries, entries, getTotalMinutesMeditated, getAverageConcentration]);

  // Generate chart data
  const chartData = useMemo(() => {
    const { today, weekStart, monthStart, yearStart } = dateRanges;
    const data: { label: string; value: number; date: string }[] = [];

    if (timeRange === "week") {
      // Daily data for week
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = getLocalDateString(date);
        const dayEntries = filteredEntries.filter(e => e.date === dateStr);
        
        const dayNames = language === "pt" 
          ? ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
          : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        
        data.push({
          label: dayNames[date.getDay()],
          value: dayEntries.length,
          date: dateStr,
        });
      }
    } else if (timeRange === "month") {
      // Weekly data for month (4 weeks)
      for (let week = 3; week >= 0; week--) {
        const weekEnd = new Date(today);
        weekEnd.setDate(today.getDate() - week * 7);
        const weekStart = new Date(weekEnd);
        weekStart.setDate(weekEnd.getDate() - 6);
        
        const weekEntries = filteredEntries.filter(e => {
          const entryDate = parseLocalDate(e.date);
          return entryDate >= weekStart && entryDate <= weekEnd;
        });
        
        data.push({
          label: language === "pt" ? `Sem ${4 - week}` : `Wk ${4 - week}`,
          value: weekEntries.length,
          date: getLocalDateString(weekStart),
        });
      }
    } else {
      // Monthly data for year
      for (let i = 11; i >= 0; i--) {
        const monthDate = new Date(today);
        monthDate.setMonth(today.getMonth() - i);
        const month = monthDate.getMonth();
        const year = monthDate.getFullYear();
        
        const monthEntries = filteredEntries.filter(e => {
          const entryDate = parseLocalDate(e.date);
          return entryDate.getMonth() === month && entryDate.getFullYear() === year;
        });
        
        const monthNames = language === "pt"
          ? ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
          : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        
        data.push({
          label: monthNames[month],
          value: monthEntries.length,
          date: `${year}-${(month + 1).toString().padStart(2, "0")}`,
        });
      }
    }

    return data;
  }, [filteredEntries, timeRange, dateRanges, language]);

  // Calculate concentration trend
  const concentrationTrend = useMemo(() => {
    const data: { label: string; value: number }[] = [];
    const { today } = dateRanges;

    if (timeRange === "week") {
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = getLocalDateString(date);
        const dayEntries = filteredEntries.filter(e => e.date === dateStr);
        
        let avgConc = 0;
        const concAnswers = dayEntries
          .map(e => e.answers.find(a => a.questionId === "concentration"))
          .filter(a => a && typeof a.value === "number")
          .map(a => a!.value as number);
        
        if (concAnswers.length > 0) {
          avgConc = concAnswers.reduce((a, b) => a + b, 0) / concAnswers.length;
        }
        
        const dayNames = language === "pt" 
          ? ["D", "S", "T", "Q", "Q", "S", "S"]
          : ["S", "M", "T", "W", "T", "F", "S"];
        
        data.push({
          label: dayNames[date.getDay()],
          value: avgConc,
        });
      }
    }

    return data;
  }, [filteredEntries, timeRange, dateRanges, language]);

  const maxValue = Math.max(...chartData.map(d => d.value), 1);
  const barWidth = (CHART_WIDTH - 40) / chartData.length - 8;

  const renderBarChart = () => {
    return (
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
        {/* Y-axis lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
          <Line
            key={i}
            x1={30}
            y1={20 + (CHART_HEIGHT - 50) * (1 - ratio)}
            x2={CHART_WIDTH}
            y2={20 + (CHART_HEIGHT - 50) * (1 - ratio)}
            stroke={colors.border}
            strokeWidth={1}
            strokeDasharray="4,4"
          />
        ))}
        
        {/* Bars */}
        {chartData.map((item, index) => {
          const barHeight = (item.value / maxValue) * (CHART_HEIGHT - 50);
          const x = 40 + index * (barWidth + 8);
          const y = CHART_HEIGHT - 30 - barHeight;
          
          return (
            <React.Fragment key={index}>
              <Rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={4}
                fill={colors.tint}
                opacity={0.8}
              />
              <SvgText
                x={x + barWidth / 2}
                y={CHART_HEIGHT - 10}
                fontSize={10}
                fill={colors.textSecondary}
                textAnchor="middle"
              >
                {item.label}
              </SvgText>
              {item.value > 0 && (
                <SvgText
                  x={x + barWidth / 2}
                  y={y - 5}
                  fontSize={10}
                  fill={colors.text}
                  textAnchor="middle"
                  fontWeight="600"
                >
                  {item.value}
                </SvgText>
              )}
            </React.Fragment>
          );
        })}
      </Svg>
    );
  };

  const renderLineChart = () => {
    if (concentrationTrend.length === 0) return null;
    
    const maxConc = 5;
    const points = concentrationTrend.map((item, index) => {
      const x = 40 + index * ((CHART_WIDTH - 60) / (concentrationTrend.length - 1));
      const y = 20 + (CHART_HEIGHT - 50) * (1 - item.value / maxConc);
      return { x, y, value: item.value, label: item.label };
    });

    return (
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
        {/* Y-axis lines */}
        {[1, 2, 3, 4, 5].map((val, i) => (
          <React.Fragment key={i}>
            <Line
              x1={30}
              y1={20 + (CHART_HEIGHT - 50) * (1 - val / 5)}
              x2={CHART_WIDTH}
              y2={20 + (CHART_HEIGHT - 50) * (1 - val / 5)}
              stroke={colors.border}
              strokeWidth={1}
              strokeDasharray="4,4"
            />
            <SvgText
              x={20}
              y={24 + (CHART_HEIGHT - 50) * (1 - val / 5)}
              fontSize={10}
              fill={colors.textSecondary}
              textAnchor="middle"
            >
              {val}
            </SvgText>
          </React.Fragment>
        ))}
        
        {/* Line connecting points */}
        {points.map((point, index) => {
          if (index === 0 || point.value === 0) return null;
          const prevPoint = points[index - 1];
          if (prevPoint.value === 0) return null;
          
          return (
            <Line
              key={index}
              x1={prevPoint.x}
              y1={prevPoint.y}
              x2={point.x}
              y2={point.y}
              stroke={colors.tintSecondary}
              strokeWidth={2}
            />
          );
        })}
        
        {/* Points */}
        {points.map((point, index) => (
          <React.Fragment key={index}>
            {point.value > 0 && (
              <Circle
                cx={point.x}
                cy={point.y}
                r={6}
                fill={colors.tintSecondary}
              />
            )}
            <SvgText
              x={point.x}
              y={CHART_HEIGHT - 10}
              fontSize={10}
              fill={colors.textSecondary}
              textAnchor="middle"
            >
              {point.label}
            </SvgText>
          </React.Fragment>
        ))}
      </Svg>
    );
  };

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
        <ThemedText style={styles.title}>
          {language === "pt" ? "Progresso" : "Progress"}
        </ThemedText>

        {/* Time Range Selector */}
        <View style={[styles.segmentedControl, { backgroundColor: colors.surface }]}>
          {(["week", "month", "year"] as TimeRange[]).map((range) => (
            <Pressable
              key={range}
              style={[
                styles.segment,
                timeRange === range && { backgroundColor: colors.tint },
              ]}
              onPress={() => setTimeRange(range)}
            >
              <ThemedText
                style={[
                  styles.segmentText,
                  { color: timeRange === range ? "#FFFFFF" : colors.text },
                ]}
              >
                {range === "week" 
                  ? (language === "pt" ? "Semana" : "Week")
                  : range === "month"
                  ? (language === "pt" ? "Mês" : "Month")
                  : (language === "pt" ? "Ano" : "Year")
                }
              </ThemedText>
            </Pressable>
          ))}
        </View>

        {/* Stats Cards Row 1 */}
        <View style={styles.statsRow}>
          <ThemedView style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <IconSymbol name="flame.fill" size={24} color={colors.tint} />
            <ThemedText style={styles.statValue}>{stats.currentStreak}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
              {language === "pt" ? "Dias seguidos" : "Day streak"}
            </ThemedText>
          </ThemedView>
          
          <ThemedView style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <IconSymbol name="checkmark.circle.fill" size={24} color={colors.tintSecondary} />
            <ThemedText style={styles.statValue}>{stats.totalEntries}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
              {language === "pt" ? "Meditações" : "Meditations"}
            </ThemedText>
          </ThemedView>
        </View>

        {/* Stats Cards Row 2 */}
        <View style={styles.statsRow}>
          <ThemedView style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <IconSymbol name="timer" size={24} color="#34C759" />
            <ThemedText style={styles.statValue}>
              {stats.totalMinutes}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
              {language === "pt" ? "Minutos totais" : "Total minutes"}
            </ThemedText>
          </ThemedView>
          
          <ThemedView style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <IconSymbol name="brain" size={24} color="#FF9500" />
            <ThemedText style={styles.statValue}>
              {stats.avgConcentration.toFixed(1)}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
              {language === "pt" ? "Concentração" : "Focus avg"}
            </ThemedText>
          </ThemedView>
        </View>

        {/* Meditation Frequency Chart */}
        <ThemedView style={[styles.chartCard, { backgroundColor: colors.surface }]}>
          <ThemedText style={styles.chartTitle}>
            {language === "pt" ? "Frequência de Meditação" : "Meditation Frequency"}
          </ThemedText>
          {renderBarChart()}
        </ThemedView>

        {/* Concentration Trend Chart (only for week view) */}
        {timeRange === "week" && (
          <ThemedView style={[styles.chartCard, { backgroundColor: colors.surface }]}>
            <ThemedText style={styles.chartTitle}>
              {language === "pt" ? "Tendência de Concentração" : "Concentration Trend"}
            </ThemedText>
            {renderLineChart()}
          </ThemedView>
        )}

        {/* Empty State */}
        {filteredEntries.length === 0 && (
          <ThemedView style={[styles.emptyState, { backgroundColor: colors.surface }]}>
            <IconSymbol name="chart.bar" size={48} color={colors.textDisabled} />
            <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
              {language === "pt" 
                ? "Nenhum dado para este período. Comece a meditar para ver seu progresso!"
                : "No data for this period. Start meditating to see your progress!"
              }
            </ThemedText>
          </ThemedView>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: Spacing.lg,
  },
  segmentedControl: {
    flexDirection: "row",
    borderRadius: BorderRadius.md,
    padding: 4,
    marginBottom: Spacing.lg,
  },
  segment: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
  },
  segmentText: {
    fontSize: 14,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: Spacing.sm,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
    textAlign: "center",
  },
  chartCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
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
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
