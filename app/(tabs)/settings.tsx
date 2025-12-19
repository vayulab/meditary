import { useRouter } from "expo-router";
import React from "react";
import { View, ScrollView, Pressable, StyleSheet, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useLanguage } from "@/contexts/language-context";
import { useData } from "@/contexts/data-context";

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { t, language, setLanguage } = useLanguage();
  const { deviceId, entries, questions } = useData();

  const handleLanguageChange = async (lang: "en" | "pt") => {
    await setLanguage(lang);
  };

  const handleReminders = () => {
    router.push("/reminders" as any);
  };

  const handleAppearance = () => {
    router.push("/appearance" as any);
  };

  const handleExportData = async () => {
    try {
      const exportData = {
        exportDate: new Date().toISOString(),
        deviceId,
        entries,
        questions,
      };

      await Clipboard.setStringAsync(JSON.stringify(exportData, null, 2));
      Alert.alert(
        language === "pt" ? "Exportado" : "Exported",
        language === "pt" ? "Dados copiados para a área de transferência!" : "Data copied to clipboard!"
      );
    } catch (error) {
      console.error("Export error:", error);
      Alert.alert("Error", language === "pt" ? "Erro ao exportar dados" : "Error exporting data");
    }
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
        <ThemedText style={styles.title}>{t("settingsTitle")}</ThemedText>

        {/* Language Section */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {t("settingsLanguage")}
          </ThemedText>
          <ThemedView style={[styles.card, { backgroundColor: colors.surface }]}>
            <Pressable
              style={[
                styles.languageOption,
                language === "en" && { backgroundColor: colors.tint + "15" },
              ]}
              onPress={() => handleLanguageChange("en")}
            >
              <ThemedText style={styles.languageText}>🇺🇸 {t("settingsLanguageEn")}</ThemedText>
              {language === "en" && (
                <IconSymbol name="checkmark" size={20} color={colors.tint} />
              )}
            </Pressable>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Pressable
              style={[
                styles.languageOption,
                language === "pt" && { backgroundColor: colors.tint + "15" },
              ]}
              onPress={() => handleLanguageChange("pt")}
            >
              <ThemedText style={styles.languageText}>🇧🇷 {t("settingsLanguagePt")}</ThemedText>
              {language === "pt" && (
                <IconSymbol name="checkmark" size={20} color={colors.tint} />
              )}
            </Pressable>
          </ThemedView>
        </View>

        {/* Appearance Section */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {language === "pt" ? "Aparência" : "Appearance"}
          </ThemedText>
          <Pressable onPress={handleAppearance}>
            <ThemedView style={[styles.card, { backgroundColor: colors.surface }]}>
              <View style={styles.menuItem}>
                <View style={styles.menuItemContent}>
                  <IconSymbol name="sun.max.fill" size={24} color={colors.tint} />
                  <View style={styles.menuItemText}>
                    <ThemedText style={styles.menuItemTitle}>
                      {language === "pt" ? "Tema e Ícone" : "Theme & Icon"}
                    </ThemedText>
                    <ThemedText style={[styles.menuItemDesc, { color: colors.textSecondary }]}>
                      {language === "pt" ? "Cores inspiradas no iOS 26" : "iOS 26 inspired colors"}
                    </ThemedText>
                  </View>
                </View>
                <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
              </View>
            </ThemedView>
          </Pressable>
        </View>

        {/* Reminders Section */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {language === "pt" ? "Lembretes" : "Reminders"}
          </ThemedText>
          <Pressable onPress={handleReminders}>
            <ThemedView style={[styles.card, { backgroundColor: colors.surface }]}>
              <View style={styles.menuItem}>
                <View style={styles.menuItemContent}>
                  <IconSymbol name="bell.fill" size={24} color={colors.tint} />
                  <View style={styles.menuItemText}>
                    <ThemedText style={styles.menuItemTitle}>
                      {language === "pt" ? "Lembretes Diários" : "Daily Reminders"}
                    </ThemedText>
                    <ThemedText style={[styles.menuItemDesc, { color: colors.textSecondary }]}>
                      {language === "pt" ? "Configure notificações para meditar" : "Set up meditation notifications"}
                    </ThemedText>
                  </View>
                </View>
                <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
              </View>
            </ThemedView>
          </Pressable>
        </View>

        {/* Questions Section */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {t("settingsQuestions")}
          </ThemedText>
          <Pressable onPress={() => router.push("/customize-questions" as any)}>
            <ThemedView style={[styles.card, { backgroundColor: colors.surface }]}>
              <View style={styles.menuItem}>
                <View style={styles.menuItemContent}>
                  <IconSymbol name="pencil" size={24} color={colors.tint} />
                  <View style={styles.menuItemText}>
                    <ThemedText style={styles.menuItemTitle}>
                      {t("settingsQuestions")}
                    </ThemedText>
                    <ThemedText style={[styles.menuItemDesc, { color: colors.textSecondary }]}>
                      {t("settingsQuestionsDesc")}
                    </ThemedText>
                  </View>
                </View>
                <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
              </View>
            </ThemedView>
          </Pressable>
        </View>

        {/* Data Section */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {t("settingsExport")}
          </ThemedText>
          <Pressable onPress={handleExportData}>
            <ThemedView style={[styles.card, { backgroundColor: colors.surface }]}>
              <View style={styles.menuItem}>
                <View style={styles.menuItemContent}>
                  <IconSymbol name="square.and.arrow.up" size={24} color={colors.tint} />
                  <View style={styles.menuItemText}>
                    <ThemedText style={styles.menuItemTitle}>
                      {t("settingsExport")}
                    </ThemedText>
                    <ThemedText style={[styles.menuItemDesc, { color: colors.textSecondary }]}>
                      {t("settingsExportDesc")}
                    </ThemedText>
                  </View>
                </View>
                <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
              </View>
            </ThemedView>
          </Pressable>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {t("settingsAbout")}
          </ThemedText>
          <ThemedView style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.infoRow}>
              <ThemedText style={[styles.infoLabel, { color: colors.textSecondary }]}>
                {t("settingsVersion")}
              </ThemedText>
              <ThemedText style={styles.infoValue}>1.0.0</ThemedText>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.infoRow}>
              <View style={styles.deviceIdContainer}>
                <ThemedText style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  {t("settingsDeviceId")}
                </ThemedText>
                <ThemedText style={[styles.deviceIdHint, { color: colors.textDisabled }]}>
                  {t("settingsDeviceIdDesc")}
                </ThemedText>
              </View>
              <ThemedText style={[styles.deviceIdValue, { color: colors.textSecondary }]} numberOfLines={1}>
                {deviceId.substring(0, 12)}...
              </ThemedText>
            </View>
          </ThemedView>
        </View>
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
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  card: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  languageOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
  },
  languageText: {
    fontSize: 16,
  },
  divider: {
    height: 1,
    marginHorizontal: Spacing.md,
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
  },
  menuItemContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  menuItemDesc: {
    fontSize: 14,
    marginTop: 2,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
  },
  infoLabel: {
    fontSize: 16,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "500",
  },
  deviceIdContainer: {
    flex: 1,
  },
  deviceIdHint: {
    fontSize: 12,
    marginTop: 2,
  },
  deviceIdValue: {
    fontSize: 14,
    fontFamily: "monospace",
  },
});
