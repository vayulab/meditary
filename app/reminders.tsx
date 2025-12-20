import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import React, { useState, useEffect } from "react";
import { 
  View, 
  ScrollView, 
  Pressable, 
  StyleSheet, 
  Switch,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useLanguage } from "@/contexts/language-context";

const REMINDER_STORAGE_KEY = "@meditary_reminder";

interface ReminderSettings {
  enabled: boolean;
  hour: number;
  minute: number;
}

const DEFAULT_REMINDER: ReminderSettings = {
  enabled: false,
  hour: 7,
  minute: 0,
};

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function RemindersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { language } = useLanguage();

  const [reminder, setReminder] = useState<ReminderSettings>(DEFAULT_REMINDER);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    loadReminderSettings();
    checkPermissions();
  }, []);

  const loadReminderSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(REMINDER_STORAGE_KEY);
      if (stored) {
        setReminder(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Error loading reminder settings:", error);
    }
  };

  const saveReminderSettings = async (settings: ReminderSettings) => {
    try {
      await AsyncStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(settings));
      setReminder(settings);
      
      if (settings.enabled) {
        await scheduleNotification(settings);
      } else {
        await cancelNotifications();
      }
    } catch (error) {
      console.error("Error saving reminder settings:", error);
    }
  };

  const checkPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setHasPermission(status === "granted");
  };

  const requestPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    setHasPermission(status === "granted");
    return status === "granted";
  };

  const scheduleNotification = async (settings: ReminderSettings) => {
    await cancelNotifications();

    const title = language === "pt" ? "Hora de Meditar 🧘" : "Time to Meditate 🧘";
    const body = language === "pt" 
      ? "Não esqueça de registrar sua meditação de hoje!"
      : "Don't forget to log your meditation today!";

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: settings.hour,
        minute: settings.minute,
      },
    });
  };

  const cancelNotifications = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
  };

  const handleToggleReminder = async (enabled: boolean) => {
    if (enabled && !hasPermission) {
      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert(
          language === "pt" ? "Permissão Necessária" : "Permission Required",
          language === "pt" 
            ? "Ative as notificações nas configurações do dispositivo para usar lembretes."
            : "Enable notifications in device settings to use reminders."
        );
        return;
      }
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await saveReminderSettings({ ...reminder, enabled });
  };

  const handleTimeChange = async (type: "hour" | "minute", delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    let newValue: number;
    if (type === "hour") {
      newValue = (reminder.hour + delta + 24) % 24;
      await saveReminderSettings({ ...reminder, hour: newValue });
    } else {
      newValue = (reminder.minute + delta + 60) % 60;
      await saveReminderSettings({ ...reminder, minute: newValue });
    }
  };

  const formatTime = (hour: number, minute: number) => {
    const h = hour.toString().padStart(2, "0");
    const m = minute.toString().padStart(2, "0");
    return `${h}:${m}`;
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View 
        style={[
          styles.header, 
          { 
            paddingTop: Math.max(insets.top, 20) + Spacing.sm,
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          }
        ]}
      >
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color={colors.tint} />
          <ThemedText style={[styles.backText, { color: colors.tint }]}>
            {language === "pt" ? "Voltar" : "Back"}
          </ThemedText>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText style={styles.title}>
          {language === "pt" ? "Lembretes Diários" : "Daily Reminders"}
        </ThemedText>
        <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
          {language === "pt" 
            ? "Receba uma notificação diária para lembrar de meditar"
            : "Get a daily notification to remind you to meditate"
          }
        </ThemedText>

        {/* Enable Toggle */}
        <ThemedView style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.cardRow}>
            <View style={styles.cardContent}>
              <IconSymbol name="bell.fill" size={24} color={colors.tint} />
              <ThemedText style={styles.cardTitle}>
                {language === "pt" ? "Ativar Lembrete" : "Enable Reminder"}
              </ThemedText>
            </View>
            <Switch
              value={reminder.enabled}
              onValueChange={handleToggleReminder}
              trackColor={{ false: colors.border, true: colors.tint }}
              thumbColor="#FFFFFF"
            />
          </View>
        </ThemedView>

        {/* Time Picker */}
        {reminder.enabled && (
          <ThemedView style={[styles.card, { backgroundColor: colors.surface }]}>
            <ThemedText style={styles.timeLabel}>
              {language === "pt" ? "Horário do Lembrete" : "Reminder Time"}
            </ThemedText>
            
            <View style={styles.timePicker}>
              {/* Hour */}
              <View style={styles.timeColumn}>
                <Pressable 
                  style={[styles.timeButton, { backgroundColor: colors.background }]}
                  onPress={() => handleTimeChange("hour", 1)}
                >
                  <IconSymbol name="chevron.up" size={24} color={colors.tint} />
                </Pressable>
                <ThemedText style={styles.timeValue}>
                  {reminder.hour.toString().padStart(2, "0")}
                </ThemedText>
                <Pressable 
                  style={[styles.timeButton, { backgroundColor: colors.background }]}
                  onPress={() => handleTimeChange("hour", -1)}
                >
                  <IconSymbol name="chevron.down" size={24} color={colors.tint} />
                </Pressable>
              </View>

              <ThemedText style={styles.timeSeparator}>:</ThemedText>

              {/* Minute */}
              <View style={styles.timeColumn}>
                <Pressable 
                  style={[styles.timeButton, { backgroundColor: colors.background }]}
                  onPress={() => handleTimeChange("minute", 5)}
                >
                  <IconSymbol name="chevron.up" size={24} color={colors.tint} />
                </Pressable>
                <ThemedText style={styles.timeValue}>
                  {reminder.minute.toString().padStart(2, "0")}
                </ThemedText>
                <Pressable 
                  style={[styles.timeButton, { backgroundColor: colors.background }]}
                  onPress={() => handleTimeChange("minute", -5)}
                >
                  <IconSymbol name="chevron.down" size={24} color={colors.tint} />
                </Pressable>
              </View>
            </View>

            <ThemedText style={[styles.timeHint, { color: colors.textSecondary }]}>
              {language === "pt" 
                ? `Você receberá uma notificação às ${formatTime(reminder.hour, reminder.minute)} todos os dias`
                : `You'll receive a notification at ${formatTime(reminder.hour, reminder.minute)} every day`
              }
            </ThemedText>
          </ThemedView>
        )}

        {/* Info Card */}
        <ThemedView style={[styles.infoCard, { backgroundColor: colors.tint + "15" }]}>
          <IconSymbol name="info.circle" size={20} color={colors.tint} />
          <ThemedText style={[styles.infoText, { color: colors.textSecondary }]}>
            {language === "pt" 
              ? "Os lembretes ajudam a manter uma prática consistente de meditação. Escolha um horário que funcione melhor para sua rotina."
              : "Reminders help maintain a consistent meditation practice. Choose a time that works best for your routine."
            }
          </ThemedText>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: -Spacing.sm,
  },
  backText: {
    fontSize: 16,
    marginLeft: Spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: Spacing.lg,
    lineHeight: 24,
  },
  card: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  timeLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  timePicker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  timeColumn: {
    alignItems: "center",
    gap: Spacing.sm,
  },
  timeButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  timeValue: {
    fontSize: 32,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  timeSeparator: {
    fontSize: 32,
    fontWeight: "700",
  },
  timeHint: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
