import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import React from "react";
import { 
  View, 
  ScrollView, 
  Pressable, 
  StyleSheet, 
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useLanguage } from "@/contexts/language-context";
import { 
  useAppTheme, 
  ThemeColor, 
  THEME_PALETTES, 
  THEME_LABELS,
} from "@/contexts/theme-context";

const THEME_OPTIONS: ThemeColor[] = ["purple", "blue", "green", "orange", "pink", "clear"];

// Import icon images
const ICON_IMAGES: Record<ThemeColor, any> = {
  purple: require("@/assets/images/icons/icon-purple.png"),
  blue: require("@/assets/images/icons/icon-blue.png"),
  green: require("@/assets/images/icons/icon-green.png"),
  orange: require("@/assets/images/icons/icon-orange.png"),
  pink: require("@/assets/images/icons/icon-pink.png"),
  clear: require("@/assets/images/icons/icon-clear.png"),
};

export default function AppearanceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const baseColors = Colors[colorScheme ?? "light"];
  const { language } = useLanguage();
  const { themeColor, setThemeColor, colors } = useAppTheme();

  const handleThemeSelect = async (color: ThemeColor) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await setThemeColor(color);
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: baseColors.background }]}>
      {/* Header */}
      <View 
        style={[
          styles.header, 
          { 
            paddingTop: Math.max(insets.top, 20) + Spacing.sm,
            backgroundColor: baseColors.surface,
            borderBottomColor: baseColors.border,
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
          {language === "pt" ? "Aparência" : "Appearance"}
        </ThemedText>
        <ThemedText style={[styles.subtitle, { color: baseColors.textSecondary }]}>
          {language === "pt" 
            ? "Escolha um tema inspirado no iOS 26 Liquid Glass"
            : "Choose a theme inspired by iOS 26 Liquid Glass"
          }
        </ThemedText>

        {/* Theme Grid */}
        <View style={styles.themeGrid}>
          {THEME_OPTIONS.map((color) => {
            const isSelected = themeColor === color;
            const palette = THEME_PALETTES[color];
            const label = THEME_LABELS[color][language === "pt" ? "pt" : "en"];
            
            return (
              <Pressable
                key={color}
                style={[
                  styles.themeCard,
                  { 
                    backgroundColor: baseColors.surface,
                    borderColor: isSelected ? palette.tint : baseColors.border,
                    borderWidth: isSelected ? 3 : 1,
                  },
                ]}
                onPress={() => handleThemeSelect(color)}
              >
                {/* Icon Preview */}
                <View style={[styles.iconContainer, { backgroundColor: palette.tintLight }]}>
                  <Image
                    source={ICON_IMAGES[color]}
                    style={styles.iconImage}
                    contentFit="cover"
                  />
                </View>
                
                {/* Color Dots */}
                <View style={styles.colorDots}>
                  <View style={[styles.colorDot, { backgroundColor: palette.tint }]} />
                  <View style={[styles.colorDot, { backgroundColor: palette.tintSecondary }]} />
                </View>
                
                {/* Label */}
                <ThemedText style={styles.themeLabel}>{label}</ThemedText>
                
                {/* Selected Indicator */}
                {isSelected && (
                  <View style={[styles.selectedBadge, { backgroundColor: palette.tint }]}>
                    <IconSymbol name="checkmark" size={14} color="#FFFFFF" />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Current Theme Preview */}
        <ThemedView style={[styles.previewCard, { backgroundColor: baseColors.surface }]}>
          <ThemedText style={styles.previewTitle}>
            {language === "pt" ? "Pré-visualização" : "Preview"}
          </ThemedText>
          
          <View style={styles.previewContent}>
            {/* Sample Button */}
            <Pressable style={[styles.sampleButton, { backgroundColor: colors.tint }]}>
              <ThemedText style={styles.sampleButtonText}>
                {language === "pt" ? "Botão Principal" : "Primary Button"}
              </ThemedText>
            </Pressable>
            
            {/* Sample Stats */}
            <View style={styles.sampleStats}>
              <View style={styles.sampleStat}>
                <ThemedText style={[styles.sampleStatValue, { color: colors.tint }]}>7</ThemedText>
                <ThemedText style={[styles.sampleStatLabel, { color: baseColors.textSecondary }]}>
                  {language === "pt" ? "Dias" : "Days"}
                </ThemedText>
              </View>
              <View style={styles.sampleStat}>
                <ThemedText style={[styles.sampleStatValue, { color: colors.tintSecondary }]}>12</ThemedText>
                <ThemedText style={[styles.sampleStatLabel, { color: baseColors.textSecondary }]}>
                  {language === "pt" ? "Mês" : "Month"}
                </ThemedText>
              </View>
            </View>
          </View>
        </ThemedView>

        {/* Info */}
        <ThemedView style={[styles.infoCard, { backgroundColor: colors.tint + "15" }]}>
          <IconSymbol name="info.circle" size={20} color={colors.tint} />
          <ThemedText style={[styles.infoText, { color: baseColors.textSecondary }]}>
            {language === "pt" 
              ? "O tema afeta as cores de destaque do aplicativo. Os ícones mostrados são inspirados no design Liquid Glass do iOS 26."
              : "The theme affects the app's accent colors. The icons shown are inspired by iOS 26 Liquid Glass design."
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
  themeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  themeCard: {
    width: "47%",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    marginBottom: Spacing.sm,
  },
  iconImage: {
    width: "100%",
    height: "100%",
  },
  colorDots: {
    flexDirection: "row",
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  themeLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  selectedBadge: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  previewCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  previewContent: {
    gap: Spacing.md,
  },
  sampleButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  sampleButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  sampleStats: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.xl,
  },
  sampleStat: {
    alignItems: "center",
  },
  sampleStatValue: {
    fontSize: 28,
    fontWeight: "700",
  },
  sampleStatLabel: {
    fontSize: 12,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
