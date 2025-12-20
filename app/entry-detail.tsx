import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useState, useEffect } from "react";
import { 
  View, 
  ScrollView, 
  Pressable, 
  StyleSheet, 
  TextInput,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { QuestionCard } from "@/components/question-card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useLanguage } from "@/contexts/language-context";
import { useData } from "@/contexts/data-context";
import { parseLocalDate } from "@/lib/date-utils";
import { MeditationEntry, Answer } from "@/constants/data";

export default function EntryDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { t, language } = useLanguage();
  const { entries, questions, updateEntry, deleteEntry } = useData();

  const [isEditing, setIsEditing] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [notes, setNotes] = useState("");

  const entry = entries.find(e => e.id === id);

  useEffect(() => {
    if (entry) {
      const answerMap: Record<string, string | number> = {};
      entry.answers.forEach(a => {
        answerMap[a.questionId] = a.value;
      });
      setAnswers(answerMap);
      setNotes(entry.notes || "");
    }
  }, [entry]);

  if (!entry) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) + Spacing.sm }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color={colors.tint} />
            <ThemedText style={[styles.backText, { color: colors.tint }]}>{t("back")}</ThemedText>
          </Pressable>
        </View>
        <View style={styles.notFoundContainer}>
          <ThemedText style={{ color: colors.textSecondary }}>
            {language === "pt" ? "Registro não encontrado" : "Entry not found"}
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = parseLocalDate(dateStr);
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    };
    return date.toLocaleDateString(language === "pt" ? "pt-BR" : "en-US", options);
  };

  const handleAnswerChange = (questionId: string, value: string | number) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSave = async () => {
    try {
      const entryAnswers: Answer[] = Object.entries(answers).map(([questionId, value]) => ({
        questionId,
        value,
      }));

      await updateEntry(entry.id, {
        answers: entryAnswers,
        notes: notes.trim() || undefined,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating entry:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      t("entryDetailDelete"),
      t("entryDetailDeleteConfirm"),
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("delete"),
          style: "destructive",
          onPress: async () => {
            await deleteEntry(entry.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.back();
          },
        },
      ]
    );
  };

  const getQuestionById = (questionId: string) => {
    return questions.find(q => q.id === questionId);
  };

  const sortedQuestions = [...questions].sort((a, b) => a.order - b.order);

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
          <ThemedText style={[styles.backText, { color: colors.tint }]}>{t("back")}</ThemedText>
        </Pressable>
        
        <View style={styles.headerActions}>
          {isEditing ? (
            <>
              <Pressable onPress={() => setIsEditing(false)} style={styles.headerButton}>
                <ThemedText style={[styles.headerButtonText, { color: colors.textSecondary }]}>
                  {t("cancel")}
                </ThemedText>
              </Pressable>
              <Pressable onPress={handleSave} style={styles.headerButton}>
                <ThemedText style={[styles.headerButtonText, { color: colors.tint }]}>
                  {t("save")}
                </ThemedText>
              </Pressable>
            </>
          ) : (
            <>
              <Pressable onPress={() => setIsEditing(true)} style={styles.headerButton}>
                <IconSymbol name="pencil" size={20} color={colors.tint} />
              </Pressable>
              <Pressable onPress={handleDelete} style={styles.headerButton}>
                <IconSymbol name="trash.fill" size={20} color={colors.error} />
              </Pressable>
            </>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Date */}
        <View style={styles.dateSection}>
          <ThemedText style={styles.dateText}>{formatDate(entry.date)}</ThemedText>
        </View>

        {/* Questions & Answers */}
        {isEditing ? (
          <View style={styles.questionsSection}>
            {sortedQuestions.map((question) => (
              <QuestionCard
                key={question.id}
                question={question}
                value={answers[question.id] ?? (question.type === "rating" ? 0 : "")}
                onChange={(value) => handleAnswerChange(question.id, value)}
              />
            ))}
          </View>
        ) : (
          <View style={styles.answersSection}>
            {entry.answers.map((answer) => {
              const question = getQuestionById(answer.questionId);
              if (!question) return null;
              
              const questionText = language === "pt" ? question.textPt : question.textEn;
              let displayValue = String(answer.value);
              
              if (question.type === "rating") {
                displayValue = `${answer.value}/5`;
              } else if (question.type === "yesno") {
                displayValue = answer.value === "yes" 
                  ? (language === "pt" ? "Sim" : "Yes")
                  : (language === "pt" ? "Não" : "No");
              }

              return (
                <ThemedView 
                  key={answer.questionId} 
                  style={[styles.answerCard, { backgroundColor: colors.surface }]}
                >
                  <ThemedText style={[styles.questionLabel, { color: colors.textSecondary }]}>
                    {questionText}
                  </ThemedText>
                  <ThemedText style={styles.answerValue}>
                    {displayValue || "-"}
                  </ThemedText>
                </ThemedView>
              );
            })}
          </View>
        )}

        {/* Notes */}
        {isEditing ? (
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
        ) : entry.notes ? (
          <View style={styles.notesSection}>
            <ThemedText style={styles.sectionTitle}>{t("newEntryNotes")}</ThemedText>
            <ThemedView style={[styles.notesCard, { backgroundColor: colors.surface }]}>
              <ThemedText style={styles.notesText}>{entry.notes}</ThemedText>
            </ThemedView>
          </View>
        ) : null}
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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  headerButton: {
    padding: Spacing.sm,
  },
  headerButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  dateSection: {
    marginBottom: Spacing.lg,
  },
  dateText: {
    fontSize: 24,
    fontWeight: "700",
    textTransform: "capitalize",
    lineHeight: 32,
  },
  questionsSection: {
    marginBottom: Spacing.lg,
  },
  answersSection: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  answerCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  questionLabel: {
    fontSize: 14,
    marginBottom: Spacing.xs,
  },
  answerValue: {
    fontSize: 18,
    fontWeight: "500",
    lineHeight: 26,
  },
  notesSection: {
    marginTop: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    fontSize: 16,
    minHeight: 120,
    lineHeight: 24,
  },
  notesCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  notesText: {
    fontSize: 16,
    lineHeight: 24,
  },
});
