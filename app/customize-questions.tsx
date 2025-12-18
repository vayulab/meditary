import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { 
  View, 
  ScrollView, 
  Pressable, 
  StyleSheet, 
  TextInput,
  Alert,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useLanguage } from "@/contexts/language-context";
import { useData } from "@/contexts/data-context";
import { Question } from "@/constants/data";

export default function CustomizeQuestionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { t, language } = useLanguage();
  const { questions, addQuestion, updateQuestion, deleteQuestion, resetQuestionsToDefault } = useData();

  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editTextEn, setEditTextEn] = useState("");
  const [editTextPt, setEditTextPt] = useState("");
  const [editType, setEditType] = useState<"rating" | "text" | "yesno">("text");

  const sortedQuestions = [...questions].sort((a, b) => a.order - b.order);

  const handleAddQuestion = () => {
    setEditingQuestion(null);
    setEditTextEn("");
    setEditTextPt("");
    setEditType("text");
    setIsModalVisible(true);
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setEditTextEn(question.textEn);
    setEditTextPt(question.textPt);
    setEditType(question.type);
    setIsModalVisible(true);
  };

  const handleSaveQuestion = async () => {
    if (!editTextEn.trim() || !editTextPt.trim()) {
      Alert.alert(
        language === "pt" ? "Erro" : "Error",
        language === "pt" ? "Preencha ambos os campos" : "Please fill both fields"
      );
      return;
    }

    try {
      if (editingQuestion) {
        await updateQuestion(editingQuestion.id, {
          textEn: editTextEn.trim(),
          textPt: editTextPt.trim(),
          type: editType,
        });
      } else {
        await addQuestion({
          textEn: editTextEn.trim(),
          textPt: editTextPt.trim(),
          type: editType,
          isDefault: false,
        });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsModalVisible(false);
    } catch (error) {
      console.error("Error saving question:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleDeleteQuestion = (question: Question) => {
    Alert.alert(
      t("questionEditorDelete"),
      language === "pt" ? "Tem certeza que deseja excluir esta pergunta?" : "Are you sure you want to delete this question?",
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("delete"),
          style: "destructive",
          onPress: async () => {
            await deleteQuestion(question.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  const handleResetToDefault = () => {
    Alert.alert(
      t("customizeReset"),
      t("customizeResetConfirm"),
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("yes"),
          onPress: async () => {
            await resetQuestionsToDefault();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "rating": return t("questionEditorTypeRating");
      case "yesno": return language === "pt" ? "Sim/Não" : "Yes/No";
      default: return t("questionEditorTypeText");
    }
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
          <ThemedText style={[styles.backText, { color: colors.tint }]}>{t("back")}</ThemedText>
        </Pressable>
        <Pressable onPress={handleResetToDefault} style={styles.resetButton}>
          <IconSymbol name="arrow.clockwise" size={20} color={colors.textSecondary} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText style={styles.title}>{t("customizeTitle")}</ThemedText>
        <ThemedText style={[styles.hint, { color: colors.textSecondary }]}>
          {t("customizeDragHint")}
        </ThemedText>

        {/* Questions List */}
        <View style={styles.questionsList}>
          {sortedQuestions.map((question, index) => (
            <Pressable
              key={question.id}
              onPress={() => handleEditQuestion(question)}
              onLongPress={() => handleDeleteQuestion(question)}
            >
              <ThemedView style={[styles.questionItem, { backgroundColor: colors.surface }]}>
                <View style={styles.questionContent}>
                  <ThemedText style={[styles.questionNumber, { color: colors.textSecondary }]}>
                    {index + 1}
                  </ThemedText>
                  <View style={styles.questionTextContainer}>
                    <ThemedText style={styles.questionText} numberOfLines={2}>
                      {language === "pt" ? question.textPt : question.textEn}
                    </ThemedText>
                    <ThemedText style={[styles.questionType, { color: colors.textSecondary }]}>
                      {getTypeLabel(question.type)}
                    </ThemedText>
                  </View>
                </View>
                <IconSymbol name="chevron.right" size={20} color={colors.textSecondary} />
              </ThemedView>
            </Pressable>
          ))}
        </View>

        {/* Add Question Button */}
        <Pressable
          style={[styles.addButton, { borderColor: colors.tint }]}
          onPress={handleAddQuestion}
        >
          <IconSymbol name="plus" size={24} color={colors.tint} />
          <ThemedText style={[styles.addButtonText, { color: colors.tint }]}>
            {t("customizeAdd")}
          </ThemedText>
        </Pressable>
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <ThemedView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View 
            style={[
              styles.modalHeader, 
              { 
                paddingTop: Math.max(insets.top, 20) + Spacing.sm,
                backgroundColor: colors.surface,
                borderBottomColor: colors.border,
              }
            ]}
          >
            <Pressable onPress={() => setIsModalVisible(false)} style={styles.modalCloseButton}>
              <ThemedText style={[styles.modalCloseText, { color: colors.textSecondary }]}>
                {t("cancel")}
              </ThemedText>
            </Pressable>
            <ThemedText style={styles.modalTitle}>
              {editingQuestion ? t("questionEditorTitle") : t("questionEditorNew")}
            </ThemedText>
            <Pressable onPress={handleSaveQuestion} style={styles.modalSaveButton}>
              <ThemedText style={[styles.modalSaveText, { color: colors.tint }]}>
                {t("save")}
              </ThemedText>
            </Pressable>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* English Text */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>English</ThemedText>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                value={editTextEn}
                onChangeText={setEditTextEn}
                placeholder="Question in English"
                placeholderTextColor={colors.textDisabled}
              />
            </View>

            {/* Portuguese Text */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Português</ThemedText>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                value={editTextPt}
                onChangeText={setEditTextPt}
                placeholder="Pergunta em Português"
                placeholderTextColor={colors.textDisabled}
              />
            </View>

            {/* Type Selection */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>{t("questionEditorType")}</ThemedText>
              <View style={styles.typeOptions}>
                {(["text", "rating", "yesno"] as const).map((type) => (
                  <Pressable
                    key={type}
                    style={[
                      styles.typeOption,
                      {
                        backgroundColor: editType === type ? colors.tint : colors.surface,
                        borderColor: editType === type ? colors.tint : colors.border,
                      },
                    ]}
                    onPress={() => setEditType(type)}
                  >
                    <ThemedText
                      style={[
                        styles.typeOptionText,
                        { color: editType === type ? "#FFFFFF" : colors.text },
                      ]}
                    >
                      {getTypeLabel(type)}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>
          </ScrollView>
        </ThemedView>
      </Modal>
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
  resetButton: {
    padding: Spacing.sm,
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
  hint: {
    fontSize: 14,
    marginBottom: Spacing.lg,
  },
  questionsList: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  questionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  questionContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: Spacing.md,
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: "600",
    width: 24,
  },
  questionTextContainer: {
    flex: 1,
  },
  questionText: {
    fontSize: 16,
    lineHeight: 22,
  },
  questionType: {
    fontSize: 12,
    marginTop: 2,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderStyle: "dashed",
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  modalCloseButton: {
    padding: Spacing.sm,
  },
  modalCloseText: {
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  modalSaveButton: {
    padding: Spacing.sm,
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalContent: {
    padding: Spacing.md,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
  },
  typeOptions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  typeOption: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: "center",
  },
  typeOptionText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
