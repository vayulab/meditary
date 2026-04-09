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
  const { entries, sessions } = useData();

  const [timeRange, setTimeRange] = useState<TimeRange>("week");

  // Calculate date ranges
  const dateRanges = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Fixed Mon–Sun of current week
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - daysToMonday);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    // Current calendar month
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Current calendar year
    const yearStart = new Date(today.getFullYear(), 0, 1);
    const yearEnd = new Date(today.getFullYear(), 11, 31);

    return { today, weekStart, weekEnd, monthStart, monthEnd, yearStart, yearEnd };
  }, []);

  const periodRange = useMemo(() => {
    const { weekStart, weekEnd, monthStart, monthEnd, yearStart, yearEnd } = dateRanges;
    switch (timeRange) {
      case "week":   return { start: weekStart,  end: weekEnd };
      case "month":  return { start: monthStart, end: monthEnd };
      case "year":   return { start: yearStart,  end: yearEnd };
    }
  }, [timeRange, dateRanges]);

  // Get entries for selected time range
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const d = parseLocalDate(entry.date);
      return d >= periodRange.start && d <= periodRange.end;
    });
  }, [entries, periodRange]);

  // Sessions without journal entry (to avoid double-counting)
  const filteredSessions = useMemo(() => {
    return sessions.filter(session => {
      if (session.hasEntry) return false;
      const d = parseLocalDate(session.date);
      return d >= periodRange.start && d <= periodRange.end;
    });
  }, [sessions, periodRange]);

  // Calculate statistics scoped to selected period
  const stats = useMemo(() => {
    const totalEntries = filteredEntries.length + filteredSessions.length;

    const totalMinutes =
      filteredEntries.reduce((sum, e) => {
        const mins = e.answers.find(a => a.questionId === "duration");
        return sum + (mins && typeof mins.value === "number" ? mins.value : 0);
      }, 0) +
      filteredSessions.reduce((sum, s) => sum + s.durationMinutes, 0);

    const concAnswers = filteredEntries
      .flatMap(e => e.answers.filter(a => a.questionId === "concentration"))
      .filter(a => typeof a.value === "number")
      .map(a => a.value as number);
    const avgConcentration = concAnswers.length > 0
      ? concAnswers.reduce((a, b) => a + b, 0) / concAnswers.length
      : 0;

    // Streak (always based on all entries, not period)
    let currentStreak = 0;
    const sortedDates = [...new Set(entries.map(e => e.date))].sort().reverse();
    for (let i = 0; i < sortedDates.length; i++) {
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - i);
      if (sortedDates.includes(getLocalDateString(expectedDate))) {
        currentStreak++;
      } else if (i > 0) {
        break;
      }
    }

    return { totalEntries, totalMinutes, avgConcentration, currentStreak };
  }, [filteredEntries, filteredSessions, entries]);

  // Generate chart data
  const chartData = useMemo(() => {
    const { weekStart, monthStart, monthEnd } = dateRanges;
    const data: { label: string; value: number; date: string }[] = [];

    if (timeRange === "week") {
      // Fixed Mon–Sun
      const dayNames = language === "pt"
        ? ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
        : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        const dateStr = getLocalDateString(date);
        const count =
          filteredEntries.filter(e => e.date === dateStr).length +
          filteredSessions.filter(s => s.date === dateStr).length;
        data.push({ label: dayNames[date.getDay()], value: count, date: dateStr });
      }
    } else if (timeRange === "month") {
      // Fixed Wk1–Wk4 based on calendar month
      for (let wk = 0; wk < 4; wk++) {
        const wkStart = new Date(monthStart);
        wkStart.setDate(1 + wk * 7);
        const wkEnd = new Date(wkStart);
        wkEnd.setDate(wkStart.getDate() + 6);
        const clampedEnd = wkEnd > monthEnd ? monthEnd : wkEnd;

        const count =
          filteredEntries.filter(e => {
            const d = parseLocalDate(e.date);
            return d >= wkStart && d <= clampedEnd;
          }).length +
          filteredSessions.filter(s => {
            const d = parseLocalDate(s.date);
            return d >= wkStart && d <= clampedEnd;
          }).length;

        data.push({
          label: language === "pt" ? `Sem ${wk + 1}` : `Wk ${wk + 1}`,
          value: count,
          date: getLocalDateString(wkStart),
        });
      }
    } else {
      // All 12 months of current year
      const year = monthStart.getFullYear();
      const monthNames = language === "pt"
        ? ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
        : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

      for (let m = 0; m < 12; m++) {
        const mStart = new Date(year, m, 1);
        const mEnd = new Date(year, m + 1, 0);
        const count =
          filteredEntries.filter(e => {
            const d = parseLocalDate(e.date);
            return d >= mStart && d <= mEnd;
          }).length +
          filteredSessions.filter(s => {
            const d = parseLocalDate(s.date);
            return d >= mStart && d <= mEnd;
          }).length;

        data.push({
          label: monthNames[m],
          value: count,
          date: `${year}-${(m + 1).toString().padStart(2, "0")}`,
        });
      }
    }

    return data;
  }, [filteredEntries, filteredSessions, timeRange, dateRanges, language]);

  // Calculate concentration trend for all time ranges
  const concentrationTrend = useMemo(() => {
    const { weekStart, monthStart, monthEnd } = dateRanges;

    const avgConc = (ents: typeof filteredEntries) => {
      const vals = ents
        .flatMap(e => e.answers.filter(a => a.questionId === "concentration"))
        .filter(a => typeof a.value === "number")
        .map(a => a.value as number);
      return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    };

    if (timeRange === "week") {
      const dayNames = language === "pt"
        ? ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
        : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      return Array.from({ length: 7 }, (_, i) => {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        const dateStr = getLocalDateString(date);
        return { label: dayNames[date.getDay()], value: avgConc(filteredEntries.filter(e => e.date === dateStr)) };
      });
    }

    if (timeRange === "month") {
      return Array.from({ length: 4 }, (_, wk) => {
        const wkStart = new Date(monthStart);
        wkStart.setDate(1 + wk * 7);
        const wkEnd = new Date(wkStart);
        wkEnd.setDate(wkStart.getDate() + 6);
        const clampedEnd = wkEnd > monthEnd ? monthEnd : wkEnd;
        const ents = filteredEntries.filter(e => {
          const d = parseLocalDate(e.date);
          return d >= wkStart && d <= clampedEnd;
        });
        return { label: language === "pt" ? `Sem ${wk + 1}` : `Wk ${wk + 1}`, value: avgConc(ents) };
      });
    }

    // year — monthly
    const year = monthStart.getFullYear();
    const monthNames = language === "pt"
      ? ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
      : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return Array.from({ length: 12 }, (_, m) => {
      const mStart = new Date(year, m, 1);
      const mEnd = new Date(year, m + 1, 0);
      const ents = filteredEntries.filter(e => {
        const d = parseLocalDate(e.date);
        return d >= mStart && d <= mEnd;
      });
      return { label: monthNames[m], value: avgConc(ents) };
    });
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
    const step = concentrationTrend.length > 1 ? (CHART_WIDTH - 60) / (concentrationTrend.length - 1) : 0;
    const points = concentrationTrend.map((item, index) => {
      const x = 40 + index * step;
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
      <View style={{ paddingTop: Math.max(insets.top + 10, 30), paddingHorizontal: Spacing.md }}>
        <ThemedText style={styles.title}>
          {language === "pt" ? "Progresso" : "Progress"}
        </ThemedText>
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

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
              {stats.totalMinutes >= 60 
                ? `${Math.floor(stats.totalMinutes / 60)}h ${stats.totalMinutes % 60}min`
                : stats.totalMinutes
              }
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
              {stats.totalMinutes >= 60
                ? (language === "pt" ? "Tempo total" : "Total time")
                : (language === "pt" ? "Minutos totais" : "Total minutes")
              }
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

        {/* Concentration Trend Chart */}
        <ThemedView style={[styles.chartCard, { backgroundColor: colors.surface }]}>
          <ThemedText style={styles.chartTitle}>
            {language === "pt" ? "Tendência de Concentração" : "Focus Avg Trend"}
          </ThemedText>
          {renderLineChart()}
        </ThemedView>

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
    paddingTop: 8,
    lineHeight: 36,
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
