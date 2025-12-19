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
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";

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
  const { questions, addQuestion, updateQuestion, deleteQuestion, reorderQuestions, resetQuestionsToDefault } = useData();

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
      language === "pt" ? "Tem certeza que deseja restaurar as perguntas padrão?" : "Are you sure you want to reset to default questions?",
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("reset"),
          style: "destructive",
          onPress: async () => {
            await resetQuestionsToDefault();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  const handleDragEnd = async ({ data }: { data: Question[] }) => {
    const reordered = data.map((q, index) => ({ ...q, order: index }));
    await reorderQuestions(reordered);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const getTypeLabel = (type: "rating" | "text" | "yesno") => {
    switch (type) {
      case "rating":
        return language === "pt" ? "Avaliação (1-5)" : "Rating (1-5)";
      case "text":
        return language === "pt" ? "Texto" : "Text";
      case "yesno":
        return language === "pt" ? "Sim/Não" : "Yes/No";
    }
  };

  const renderItem = ({ item, drag, isActive }: RenderItemParams<Question>) => {
    const index = sortedQuestions.findIndex(q => q.id === item.id);
    
    return (
      <ScaleDecorator>
        <Pressable
          onLongPress={drag}
          disabled={isActive}
          style={{ opacity: isActive ? 0.8 : 1 }}
        >
          <ThemedView style={[styles.questionItem, { backgroundColor: colors.surface }]}>
            <View style={styles.dragHandle}>
              <IconSymbol name="line.3.horizontal" size={20} color={colors.textSecondary} />
            </View>
            <Pressable 
              onPress={() => handleEditQuestion(item)}
              style={styles.questionContent}
            >
              <ThemedText style={[styles.questionNumber, { color: colors.textSecondary }]}>
                {index + 1}
              </ThemedText>
              <View style={styles.questionTextContainer}>
                <ThemedText style={styles.questionText} numberOfLines={2}>
                  {language === "pt" ? item.textPt : item.textEn}
                </ThemedText>
                <ThemedText style={[styles.questionType, { color: colors.textSecondary }]}>
                  {getTypeLabel(item.type)}
                </ThemedText>
              </View>
            </Pressable>
            <Pressable onPress={() => handleDeleteQuestion(item)} style={styles.deleteButton}>
              <IconSymbol name="trash.fill" size={20} color="#FF3B30" />
            </Pressable>
          </ThemedView>
        </Pressable>
      </ScaleDecorator>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View 
          style={[
            styles.header, 
            { 
              paddingTop: Math.max(insets.top, 20) + Spacing.md,
              backgroundColor: colors.surface,
              borderBottomColor: colors.border,
            }
          ]}
        >
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color={colors.text} />
          </Pressable>
          <ThemedText style={styles.headerTitle}>{t("customizeTitle")}</ThemedText>
          <Pressable onPress={handleResetToDefault} style={styles.resetButton}>
            <ThemedText style={[styles.resetText, { color: colors.tint }]}>
              {t("reset")}
            </ThemedText>
          </Pressable>
        </View>

        <View style={styles.content}>
          <ThemedText style={[styles.hint, { color: colors.textSecondary }]}>
            {language === "pt" 
              ? "Pressione e segure para arrastar e reordenar" 
              : "Press and hold to drag and reorder"}
          </ThemedText>

          {/* Draggable Questions List */}
          <DraggableFlatList
            data={sortedQuestions}
            onDragEnd={handleDragEnd}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
          />

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
        </View>

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
                  placeholderTextColor={colors.textSecondary}
                  multiline
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
                  placeholderTextColor={colors.textSecondary}
                  multiline
                />
              </View>

              {/* Question Type */}
              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>
                  {language === "pt" ? "Tipo de Resposta" : "Answer Type"}
                </ThemedText>
                <View style={styles.typeButtons}>
                  {(["rating", "text", "yesno"] as const).map((type) => (
                    <Pressable
                      key={type}
                      style={[
                        styles.typeButton,
                        {
                          backgroundColor: editType === type ? colors.tint : colors.surface,
                          borderColor: colors.border,
                        },
                      ]}
                      onPress={() => setEditType(type)}
                    >
                      <ThemedText
                        style={[
                          styles.typeButtonText,
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
    </GestureHandlerRootView>
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
    padding: Spacing.xs,
    width: 80,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  resetButton: {
    padding: Spacing.xs,
    width: 80,
    alignItems: "flex-end",
  },
  resetText: {
    fontSize: 16,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  hint: {
    fontSize: 14,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  listContent: {
    paddingBottom: Spacing.xl,
  },
  questionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  dragHandle: {
    padding: Spacing.xs,
  },
  questionContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: "600",
    width: 30,
  },
  questionTextContainer: {
    flex: 1,
  },
  questionText: {
    fontSize: 16,
    marginBottom: 4,
  },
  questionType: {
    fontSize: 12,
  },
  deleteButton: {
    padding: Spacing.xs,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderStyle: "dashed",
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
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
    padding: Spacing.xs,
    width: 80,
  },
  modalCloseText: {
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  modalSaveButton: {
    padding: Spacing.xs,
    width: 80,
    alignItems: "flex-end",
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalContent: {
    flex: 1,
    padding: Spacing.md,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: "top",
  },
  typeButtons: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  typeButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: "center",
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
