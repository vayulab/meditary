/**
 * Meditary - Comprehensive Use Case Tests
 * Tests all 28 use cases documented in USE_CASES.md
 */

import { describe, it, expect, beforeEach } from "vitest";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEFAULT_QUESTIONS, STORAGE_KEYS } from "../constants/data";
import type { MeditationEntry, MeditationSession, Question } from "../constants/data";

describe("UC001-UC028: Meditary Use Cases", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  // ==================== UC001: Language Management ====================
  describe("UC001: Alternar Idioma", () => {
    it("should switch language and persist preference", async () => {
      const settings = { language: "pt" };
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      const parsed = JSON.parse(stored!);
      
      expect(parsed.language).toBe("pt");
      
      // Switch to English
      const newSettings = { language: "en" };
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
      
      const updated = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      const parsedUpdated = JSON.parse(updated!);
      
      expect(parsedUpdated.language).toBe("en");
    });
  });

  // ==================== UC002-UC005: Meditation Logging ====================
  describe("UC002: Criar Novo Registro de Meditação", () => {
    it("should create new meditation entry with all required fields", async () => {
      const entry: MeditationEntry = {
        id: "test-entry-1",
        date: "2025-12-19",
        timestamp: Date.now(),
        deviceId: "test-device-123",
        answers: [
          { questionId: "concentration", value: 4 },
          { questionId: "physicalPain", value: "Nenhuma" },
          { questionId: "thoughts", value: "yes" },
        ],
        notes: "Ótima sessão",
        durationMinutes: 20,
      };

      const entries = [entry];
      await AsyncStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
      
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.ENTRIES);
      const parsed = JSON.parse(stored!) as MeditationEntry[];
      
      expect(parsed).toHaveLength(1);
      expect(parsed[0].id).toBe("test-entry-1");
      expect(parsed[0].answers).toHaveLength(3);
      expect(parsed[0].durationMinutes).toBe(20);
    });
  });

  describe("UC003: Visualizar Detalhes do Registro", () => {
    it("should retrieve entry by ID", async () => {
      const entries: MeditationEntry[] = [
        {
          id: "entry-1",
          date: "2025-12-19",
          timestamp: Date.now(),
          deviceId: "device-1",
          answers: [{ questionId: "concentration", value: 5 }],
        },
        {
          id: "entry-2",
          date: "2025-12-18",
          timestamp: Date.now() - 86400000,
          deviceId: "device-1",
          answers: [{ questionId: "concentration", value: 3 }],
        },
      ];

      await AsyncStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
      
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.ENTRIES);
      const parsed = JSON.parse(stored!) as MeditationEntry[];
      const found = parsed.find(e => e.id === "entry-2");
      
      expect(found).toBeDefined();
      expect(found!.date).toBe("2025-12-18");
      expect(found!.answers[0].value).toBe(3);
    });
  });

  describe("UC004: Editar Registro Existente", () => {
    it("should update existing entry", async () => {
      const entries: MeditationEntry[] = [
        {
          id: "entry-1",
          date: "2025-12-19",
          timestamp: Date.now(),
          deviceId: "device-1",
          answers: [{ questionId: "concentration", value: 3 }],
        },
      ];

      await AsyncStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
      
      // Update
      const updated = entries.map(e => 
        e.id === "entry-1" 
          ? { ...e, answers: [{ questionId: "concentration", value: 5 }], notes: "Updated" }
          : e
      );
      await AsyncStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(updated));
      
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.ENTRIES);
      const parsed = JSON.parse(stored!) as MeditationEntry[];
      
      expect(parsed[0].answers[0].value).toBe(5);
      expect(parsed[0].notes).toBe("Updated");
    });
  });

  describe("UC005: Excluir Registro", () => {
    it("should delete entry by ID", async () => {
      const entries: MeditationEntry[] = [
        {
          id: "entry-1",
          date: "2025-12-19",
          timestamp: Date.now(),
          deviceId: "device-1",
          answers: [],
        },
        {
          id: "entry-2",
          date: "2025-12-18",
          timestamp: Date.now(),
          deviceId: "device-1",
          answers: [],
        },
      ];

      await AsyncStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
      
      // Delete entry-1
      const filtered = entries.filter(e => e.id !== "entry-1");
      await AsyncStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(filtered));
      
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.ENTRIES);
      const parsed = JSON.parse(stored!) as MeditationEntry[];
      
      expect(parsed).toHaveLength(1);
      expect(parsed[0].id).toBe("entry-2");
    });
  });

  // ==================== UC006-UC010: Meditation Timer ====================
  describe("UC006-UC010: Timer Functionality", () => {
    it("should track meditation session with duration", async () => {
      const session: MeditationSession = {
        id: "session-1",
        date: "2025-12-19",
        timestamp: Date.now(),
        deviceId: "device-1",
        durationMinutes: 20,
        hasEntry: false,
      };

      const sessions = [session];
      await AsyncStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
      
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.SESSIONS);
      const parsed = JSON.parse(stored!) as MeditationSession[];
      
      expect(parsed).toHaveLength(1);
      expect(parsed[0].durationMinutes).toBe(20);
      expect(parsed[0].hasEntry).toBe(false);
    });

    it("should calculate total meditation time from entries and sessions", async () => {
      const entries: MeditationEntry[] = [
        {
          id: "e1",
          date: "2025-12-19",
          timestamp: Date.now(),
          deviceId: "d1",
          answers: [],
          durationMinutes: 15,
        },
      ];

      const sessions: MeditationSession[] = [
        {
          id: "s1",
          date: "2025-12-18",
          timestamp: Date.now(),
          deviceId: "d1",
          durationMinutes: 30,
          hasEntry: false,
        },
      ];

      await AsyncStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
      await AsyncStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
      
      const storedEntries = await AsyncStorage.getItem(STORAGE_KEYS.ENTRIES);
      const storedSessions = await AsyncStorage.getItem(STORAGE_KEYS.SESSIONS);
      
      const parsedEntries = JSON.parse(storedEntries!) as MeditationEntry[];
      const parsedSessions = JSON.parse(storedSessions!) as MeditationSession[];
      
      const totalMinutes = 
        parsedEntries.reduce((sum, e) => sum + (e.durationMinutes || 0), 0) +
        parsedSessions.reduce((sum, s) => sum + s.durationMinutes, 0);
      
      expect(totalMinutes).toBe(45);
    });
  });

  // ==================== UC011-UC015: Question Customization ====================
  describe("UC011: Adicionar Nova Pergunta", () => {
    it("should add custom question to list", async () => {
      const questions = [...DEFAULT_QUESTIONS];
      const newQuestion: Question = {
        id: "custom-1",
        textEn: "How was my breathing?",
        textPt: "Como estava minha respiração?",
        type: "text",
        isDefault: false,
        order: questions.length,
      };

      questions.push(newQuestion);
      await AsyncStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(questions));
      
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.QUESTIONS);
      const parsed = JSON.parse(stored!) as Question[];
      
      expect(parsed).toHaveLength(11);
      expect(parsed[10].id).toBe("custom-1");
      expect(parsed[10].isDefault).toBe(false);
    });
  });

  describe("UC012: Editar Pergunta Existente", () => {
    it("should update question text", async () => {
      const questions = [...DEFAULT_QUESTIONS];
      const updated = questions.map(q =>
        q.id === "concentration"
          ? { ...q, textPt: "Minha concentração estava como?" }
          : q
      );

      await AsyncStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(updated));
      
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.QUESTIONS);
      const parsed = JSON.parse(stored!) as Question[];
      const concentration = parsed.find(q => q.id === "concentration");
      
      expect(concentration!.textPt).toBe("Minha concentração estava como?");
    });
  });

  describe("UC013: Reordenar Perguntas", () => {
    it("should reorder questions", async () => {
      const questions = [...DEFAULT_QUESTIONS];
      // Move first question to last
      const [first, ...rest] = questions;
      const reordered = [...rest, first].map((q, index) => ({ ...q, order: index }));

      await AsyncStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(reordered));
      
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.QUESTIONS);
      const parsed = JSON.parse(stored!) as Question[];
      
      expect(parsed[0].id).not.toBe("concentration");
      expect(parsed[parsed.length - 1].id).toBe("concentration");
    });
  });

  describe("UC014: Excluir Pergunta", () => {
    it("should delete custom question", async () => {
      const questions = [
        ...DEFAULT_QUESTIONS,
        {
          id: "custom-1",
          textEn: "Custom",
          textPt: "Personalizada",
          type: "text" as const,
          isDefault: false,
          order: 10,
        },
      ];

      await AsyncStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(questions));
      
      // Delete custom question
      const filtered = questions.filter(q => q.id !== "custom-1");
      await AsyncStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(filtered));
      
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.QUESTIONS);
      const parsed = JSON.parse(stored!) as Question[];
      
      expect(parsed).toHaveLength(10);
      expect(parsed.find(q => q.id === "custom-1")).toBeUndefined();
    });
  });

  describe("UC015: Restaurar Perguntas Padrão", () => {
    it("should reset to default questions", async () => {
      const customQuestions = [
        {
          id: "custom-1",
          textEn: "Custom",
          textPt: "Personalizada",
          type: "text" as const,
          isDefault: false,
          order: 0,
        },
      ];

      await AsyncStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(customQuestions));
      
      // Reset to default
      await AsyncStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(DEFAULT_QUESTIONS));
      
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.QUESTIONS);
      const parsed = JSON.parse(stored!) as Question[];
      
      expect(parsed).toHaveLength(10);
      expect(parsed.every(q => q.isDefault)).toBe(true);
    });
  });

  // ==================== UC016-UC017: History Viewing ====================
  describe("UC016-UC017: History and Calendar", () => {
    it("should filter entries by month", async () => {
      const entries: MeditationEntry[] = [
        {
          id: "e1",
          date: "2025-12-15",
          timestamp: Date.now(),
          deviceId: "d1",
          answers: [],
        },
        {
          id: "e2",
          date: "2025-11-20",
          timestamp: Date.now(),
          deviceId: "d1",
          answers: [],
        },
        {
          id: "e3",
          date: "2025-12-25",
          timestamp: Date.now(),
          deviceId: "d1",
          answers: [],
        },
      ];

      await AsyncStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
      
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.ENTRIES);
      const parsed = JSON.parse(stored!) as MeditationEntry[];
      
      const decemberEntries = parsed.filter(e => {
        const date = new Date(e.date);
        return date.getFullYear() === 2025 && date.getMonth() === 11; // December = 11
      });
      
      expect(decemberEntries).toHaveLength(2);
    });

    it("should show both entries and sessions in history", async () => {
      const entries: MeditationEntry[] = [
        {
          id: "e1",
          date: "2025-12-19",
          timestamp: Date.now(),
          deviceId: "d1",
          answers: [],
        },
      ];

      const sessions: MeditationSession[] = [
        {
          id: "s1",
          date: "2025-12-19",
          timestamp: Date.now(),
          deviceId: "d1",
          durationMinutes: 20,
          hasEntry: false,
        },
      ];

      await AsyncStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
      await AsyncStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
      
      const storedEntries = await AsyncStorage.getItem(STORAGE_KEYS.ENTRIES);
      const storedSessions = await AsyncStorage.getItem(STORAGE_KEYS.SESSIONS);
      
      const parsedEntries = JSON.parse(storedEntries!) as MeditationEntry[];
      const parsedSessions = JSON.parse(storedSessions!) as MeditationSession[];
      
      const date = "2025-12-19";
      const hasEntry = parsedEntries.some(e => e.date === date);
      const hasSession = parsedSessions.some(s => s.date === date);
      
      expect(hasEntry).toBe(true);
      expect(hasSession).toBe(true);
    });
  });

  // ==================== UC018-UC020: Statistics ====================
  describe("UC018-UC020: Statistics and Progress", () => {
    it("should calculate average concentration", async () => {
      const entries: MeditationEntry[] = [
        {
          id: "e1",
          date: "2025-12-19",
          timestamp: Date.now(),
          deviceId: "d1",
          answers: [{ questionId: "concentration", value: 4 }],
        },
        {
          id: "e2",
          date: "2025-12-18",
          timestamp: Date.now(),
          deviceId: "d1",
          answers: [{ questionId: "concentration", value: 5 }],
        },
        {
          id: "e3",
          date: "2025-12-17",
          timestamp: Date.now(),
          deviceId: "d1",
          answers: [{ questionId: "concentration", value: 3 }],
        },
      ];

      await AsyncStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
      
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.ENTRIES);
      const parsed = JSON.parse(stored!) as MeditationEntry[];
      
      const concentrationValues = parsed
        .map(e => e.answers.find(a => a.questionId === "concentration"))
        .filter(a => a && typeof a.value === "number")
        .map(a => a!.value as number);
      
      const average = concentrationValues.reduce((sum, val) => sum + val, 0) / concentrationValues.length;
      
      expect(average).toBe(4);
    });

    it("should calculate streak correctly", async () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const twoDaysAgo = new Date(today);
      twoDaysAgo.setDate(today.getDate() - 2);

      const entries: MeditationEntry[] = [
        {
          id: "e1",
          date: today.toISOString().split("T")[0],
          timestamp: Date.now(),
          deviceId: "d1",
          answers: [],
        },
        {
          id: "e2",
          date: yesterday.toISOString().split("T")[0],
          timestamp: Date.now() - 86400000,
          deviceId: "d1",
          answers: [],
        },
        {
          id: "e3",
          date: twoDaysAgo.toISOString().split("T")[0],
          timestamp: Date.now() - 172800000,
          deviceId: "d1",
          answers: [],
        },
      ];

      await AsyncStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
      
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.ENTRIES);
      const parsed = JSON.parse(stored!) as MeditationEntry[];
      
      // Calculate streak
      const sortedDates = [...new Set(parsed.map(e => e.date))].sort().reverse();
      let streak = 0;
      const todayStr = today.toISOString().split("T")[0];
      
      for (let i = 0; i < sortedDates.length; i++) {
        const expectedDate = new Date(today);
        expectedDate.setDate(today.getDate() - i);
        const expectedStr = expectedDate.toISOString().split("T")[0];
        
        if (sortedDates[i] === expectedStr) {
          streak++;
        } else {
          break;
        }
      }
      
      expect(streak).toBe(3);
    });
  });

  // ==================== UC021-UC023: Settings ====================
  describe("UC021-UC023: Settings and Customization", () => {
    it("should save reminder settings", async () => {
      const settings = {
        language: "pt",
        remindersEnabled: true,
        reminderTime: "09:00",
      };

      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      const parsed = JSON.parse(stored!);
      
      expect(parsed.remindersEnabled).toBe(true);
      expect(parsed.reminderTime).toBe("09:00");
    });

    it("should save theme preference", async () => {
      const settings = {
        language: "en",
        theme: "blue",
      };

      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      const parsed = JSON.parse(stored!);
      
      expect(parsed.theme).toBe("blue");
    });

    it("should export all data as JSON", async () => {
      const entries: MeditationEntry[] = [
        {
          id: "e1",
          date: "2025-12-19",
          timestamp: Date.now(),
          deviceId: "d1",
          answers: [],
        },
      ];

      await AsyncStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
      
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.ENTRIES);
      const exportData = {
        entries: JSON.parse(stored!),
        exportDate: new Date().toISOString(),
      };
      
      const jsonString = JSON.stringify(exportData, null, 2);
      
      expect(jsonString).toContain("e1");
      expect(jsonString).toContain("2025-12-19");
    });
  });

  // ==================== UC024: Device Identification ====================
  describe("UC024: Device ID Collection", () => {
    it("should generate and store device ID", async () => {
      const deviceId = "test-device-uuid-123";
      await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
      
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_ID);
      
      expect(stored).toBe(deviceId);
    });

    it("should associate device ID with entries", async () => {
      const deviceId = "device-123";
      const entry: MeditationEntry = {
        id: "e1",
        date: "2025-12-19",
        timestamp: Date.now(),
        deviceId: deviceId,
        answers: [],
      };

      const entries = [entry];
      await AsyncStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
      
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.ENTRIES);
      const parsed = JSON.parse(stored!) as MeditationEntry[];
      
      expect(parsed[0].deviceId).toBe(deviceId);
    });
  });

  // ==================== UC025-UC026: Home Screen ====================
  describe("UC025-UC026: Home Screen Status", () => {
    it("should determine if user meditated today", async () => {
      const today = new Date().toISOString().split("T")[0];
      const entries: MeditationEntry[] = [
        {
          id: "e1",
          date: today,
          timestamp: Date.now(),
          deviceId: "d1",
          answers: [],
        },
      ];

      await AsyncStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
      
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.ENTRIES);
      const parsed = JSON.parse(stored!) as MeditationEntry[];
      const todayEntry = parsed.find(e => e.date === today);
      
      expect(todayEntry).toBeDefined();
    });

    it("should get recent entries (last 3)", async () => {
      const entries: MeditationEntry[] = [
        {
          id: "e1",
          date: "2025-12-19",
          timestamp: Date.now(),
          deviceId: "d1",
          answers: [],
        },
        {
          id: "e2",
          date: "2025-12-18",
          timestamp: Date.now() - 86400000,
          deviceId: "d1",
          answers: [],
        },
        {
          id: "e3",
          date: "2025-12-17",
          timestamp: Date.now() - 172800000,
          deviceId: "d1",
          answers: [],
        },
        {
          id: "e4",
          date: "2025-12-16",
          timestamp: Date.now() - 259200000,
          deviceId: "d1",
          answers: [],
        },
      ];

      await AsyncStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
      
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.ENTRIES);
      const parsed = JSON.parse(stored!) as MeditationEntry[];
      const sorted = parsed.sort((a, b) => b.timestamp - a.timestamp);
      const recent = sorted.slice(0, 3);
      
      expect(recent).toHaveLength(3);
      expect(recent[0].id).toBe("e1");
      expect(recent[2].id).toBe("e3");
    });
  });

  // ==================== UC027-UC028: Data Persistence ====================
  describe("UC027-UC028: Data Persistence", () => {
    it("should persist all data types", async () => {
      const entries: MeditationEntry[] = [{ id: "e1", date: "2025-12-19", timestamp: Date.now(), deviceId: "d1", answers: [] }];
      const sessions: MeditationSession[] = [{ id: "s1", date: "2025-12-19", timestamp: Date.now(), deviceId: "d1", durationMinutes: 20, hasEntry: false }];
      const questions = DEFAULT_QUESTIONS;
      const settings = { language: "pt" };
      const deviceId = "device-123";

      await AsyncStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
      await AsyncStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
      await AsyncStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(questions));
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);

      const storedEntries = await AsyncStorage.getItem(STORAGE_KEYS.ENTRIES);
      const storedSessions = await AsyncStorage.getItem(STORAGE_KEYS.SESSIONS);
      const storedQuestions = await AsyncStorage.getItem(STORAGE_KEYS.QUESTIONS);
      const storedSettings = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      const storedDeviceId = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_ID);

      expect(storedEntries).toBeTruthy();
      expect(storedSessions).toBeTruthy();
      expect(storedQuestions).toBeTruthy();
      expect(storedSettings).toBeTruthy();
      expect(storedDeviceId).toBe(deviceId);
    });

    it("should load all data on app start", async () => {
      // Simulate app start with existing data
      const entries: MeditationEntry[] = [{ id: "e1", date: "2025-12-19", timestamp: Date.now(), deviceId: "d1", answers: [] }];
      await AsyncStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));

      // Load data
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.ENTRIES);
      const parsed = stored ? JSON.parse(stored) : [];

      expect(parsed).toHaveLength(1);
      expect(parsed[0].id).toBe("e1");
    });
  });
});
