import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { 
  View, 
  ScrollView, 
  Pressable, 
  StyleSheet, 
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { QuestionCard } from "@/components/question-card";
import { getLocalDateString } from "@/lib/date-utils";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useLanguage } from "@/contexts/language-context";
import { useData } from "@/contexts/data-context";
import { Answer } from "@/constants/data";

export default function NewEntryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { t, language } = useLanguage();
  const { questions, addEntry } = useData();

  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const today = new Date();
  const todayStr = getLocalDateString(today);

  const formatDate = () => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    };
    return today.toLocaleDateString(language === "pt" ? "pt-BR" : "en-US", options);
  };

  const handleAnswerChange = (questionId: string, value: string | number) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const entryAnswers: Answer[] = Object.entries(answers).map(([questionId, value]) => ({
        questionId,
        value,
      }));

      await addEntry({
        date: todayStr,
        timestamp: Date.now(),
        answers: entryAnswers,
        notes: notes.trim() || undefined,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      Alert.alert(
        language === "pt" ? "Sucesso" : "Success",
        t("newEntrySaved"),
        [{ text: t("ok"), onPress: () => router.back() }]
      );
    } catch (error) {
      console.error("Error saving entry:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        language === "pt" ? "Erro" : "Error",
        language === "pt" ? "Erro ao salvar registro" : "Error saving entry"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const sortedQuestions = [...questions].sort((a, b) => a.order - b.order);

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
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
          <Pressable onPress={() => router.back()} style={styles.closeButton}>
            <IconSymbol name="xmark" size={24} color={colors.text} />
          </Pressable>
          <ThemedText style={styles.headerTitle}>{t("newEntryTitle")}</ThemedText>
          <View style={styles.headerSpacer} />
        </View>

        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
          {/* Date Display */}
          <View style={styles.dateSection}>
            <IconSymbol name="calendar" size={20} color={colors.tint} />
            <ThemedText style={[styles.dateText, { color: colors.textSecondary }]}>
              {formatDate()}
            </ThemedText>
          </View>

          {/* Questions */}
          <View style={styles.questionsSection}>
            <ThemedText style={styles.sectionTitle}>{t("newEntryQuestions")}</ThemedText>
            {sortedQuestions.map((question) => (
              <QuestionCard
                key={question.id}
                question={question}
                value={answers[question.id] ?? (question.type === "rating" ? 0 : "")}
                onChange={(value) => handleAnswerChange(question.id, value)}
              />
            ))}
          </View>

          {/* Notes */}
          <View style={styles.notesSection}>
            <ThemedText style={styles.sectionTitle}>{t("newEntryNotes")}</ThemedText>
            <TextInput
              style={[
                styles.notesInput,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              value={notes}
              onChangeText={setNotes}
              placeholder={t("newEntryNotesPlaceholder")}
              placeholderTextColor={colors.textDisabled}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
          </ScrollView>
        </TouchableWithoutFeedback>

        {/* Save Button */}
        <View 
          style={[
            styles.footer, 
            { 
              paddingBottom: Math.max(insets.bottom, 20),
              backgroundColor: colors.background,
            }
          ]}
        >
          <Pressable
            style={[
              styles.saveButton,
              { backgroundColor: colors.tint },
              isSaving && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={isSaving}
          >
            <ThemedText style={styles.saveButtonText}>
              {isSaving 
                ? (language === "pt" ? "Salvando..." : "Saving...") 
                : t("newEntrySave")
              }
            </ThemedText>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
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
  closeButton: {
    padding: Spacing.sm,
    marginLeft: -Spacing.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 30, // Small padding to keep button close to keyboard
  },
  dateSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  dateText: {
    fontSize: 16,
    textTransform: "capitalize",
  },
  questionsSection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  notesSection: {
    marginBottom: Spacing.lg,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    fontSize: 16,
    minHeight: 120,
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  saveButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
});
