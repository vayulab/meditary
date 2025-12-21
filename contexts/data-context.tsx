import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Application from "expo-application";
import * as Crypto from "expo-crypto";
import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { Platform } from "react-native";

import { 
  MeditationEntry, 
  MeditationSession,
  Question, 
  DEFAULT_QUESTIONS, 
  STORAGE_KEYS 
} from "@/constants/data";
import { getLocalDateString } from "@/lib/date-utils";

interface DataContextType {
  entries: MeditationEntry[];
  sessions: MeditationSession[];
  questions: Question[];
  deviceId: string;
  isLoading: boolean;
  addEntry: (entry: Omit<MeditationEntry, "id" | "deviceId">) => Promise<MeditationEntry>;
  updateEntry: (id: string, updates: Partial<MeditationEntry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  getEntryByDate: (date: string) => MeditationEntry | undefined;
  getEntriesForMonth: (year: number, month: number) => MeditationEntry[];
  addSession: (session: Omit<MeditationSession, "id" | "deviceId">) => Promise<void>;
  getSessionsForMonth: (year: number, month: number) => MeditationSession[];
  getTotalMinutesMeditated: () => number;
  getAverageConcentration: () => number;
  getWeeklyStats: () => { date: string; minutes: number; count: number }[];
  addQuestion: (question: Omit<Question, "id" | "order">) => Promise<void>;
  updateQuestion: (id: string, updates: Partial<Question>) => Promise<void>;
  deleteQuestion: (id: string) => Promise<void>;
  reorderQuestions: (questions: Question[]) => Promise<void>;
  resetQuestionsToDefault: () => Promise<void>;
  getStreak: () => number;
  getMonthCount: (year: number, month: number) => number;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<MeditationEntry[]>([]);
  const [sessions, setSessions] = useState<MeditationSession[]>([]);
  const [questions, setQuestions] = useState<Question[]>(DEFAULT_QUESTIONS);
  const [deviceId, setDeviceId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    try {
      // Get or generate device ID
      let storedDeviceId = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_ID);
      
      if (!storedDeviceId) {
        // Try to get native device ID first
        if (Platform.OS === "ios") {
          storedDeviceId = await Application.getIosIdForVendorAsync() || "";
        } else if (Platform.OS === "android") {
          storedDeviceId = Application.getAndroidId() || "";
        }
        
        // If no native ID, generate a UUID
        if (!storedDeviceId) {
          storedDeviceId = Crypto.randomUUID();
        }
        
        await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_ID, storedDeviceId as string);
      }
      setDeviceId(storedDeviceId || "");

      // Load entries
      const storedEntries = await AsyncStorage.getItem(STORAGE_KEYS.ENTRIES);
      if (storedEntries) {
        setEntries(JSON.parse(storedEntries));
      }

      // Load sessions
      const storedSessions = await AsyncStorage.getItem(STORAGE_KEYS.SESSIONS);
      if (storedSessions) {
        setSessions(JSON.parse(storedSessions));
      }

      // Load questions
      const storedQuestions = await AsyncStorage.getItem(STORAGE_KEYS.QUESTIONS);
      if (storedQuestions) {
        setQuestions(JSON.parse(storedQuestions));
      } else {
        // Initialize with default questions
        await AsyncStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(DEFAULT_QUESTIONS));
      }
    } catch (error) {
      console.error("Error initializing data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveEntries = async (newEntries: MeditationEntry[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(newEntries));
    setEntries(newEntries);
  };

  const saveQuestions = async (newQuestions: Question[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(newQuestions));
    setQuestions(newQuestions);
  };

  const addEntry = useCallback(async (entry: Omit<MeditationEntry, "id" | "deviceId">): Promise<MeditationEntry> => {
    const newEntry: MeditationEntry = {
      ...entry,
      id: Crypto.randomUUID(),
      deviceId,
    };
    const newEntries = [...entries, newEntry].sort((a, b) => b.timestamp - a.timestamp);
    await saveEntries(newEntries);
    return newEntry;
  }, [entries, deviceId]);

  const updateEntry = useCallback(async (id: string, updates: Partial<MeditationEntry>) => {
    const newEntries = entries.map(entry => 
      entry.id === id ? { ...entry, ...updates } : entry
    );
    await saveEntries(newEntries);
  }, [entries]);

  const deleteEntry = useCallback(async (id: string) => {
    const newEntries = entries.filter(entry => entry.id !== id);
    await saveEntries(newEntries);
  }, [entries]);

  const getEntryByDate = useCallback((date: string): MeditationEntry | undefined => {
    return entries.find(entry => entry.date === date);
  }, [entries]);

  const getEntriesForMonth = useCallback((year: number, month: number): MeditationEntry[] => {
    return entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate.getFullYear() === year && entryDate.getMonth() === month;
    });
  }, [entries]);

  const addQuestion = useCallback(async (question: Omit<Question, "id" | "order">) => {
    const newQuestion: Question = {
      ...question,
      id: Crypto.randomUUID(),
      order: questions.length,
    };
    const newQuestions = [...questions, newQuestion];
    await saveQuestions(newQuestions);
  }, [questions]);

  const updateQuestion = useCallback(async (id: string, updates: Partial<Question>) => {
    const newQuestions = questions.map(q => 
      q.id === id ? { ...q, ...updates } : q
    );
    await saveQuestions(newQuestions);
  }, [questions]);

  const deleteQuestion = useCallback(async (id: string) => {
    const newQuestions = questions
      .filter(q => q.id !== id)
      .map((q, index) => ({ ...q, order: index }));
    await saveQuestions(newQuestions);
  }, [questions]);

  const reorderQuestions = useCallback(async (reorderedQuestions: Question[]) => {
    const newQuestions = reorderedQuestions.map((q, index) => ({ ...q, order: index }));
    await saveQuestions(newQuestions);
  }, []);

  const resetQuestionsToDefault = useCallback(async () => {
    await saveQuestions(DEFAULT_QUESTIONS);
  }, []);

  const getStreak = useCallback((): number => {
    if (entries.length === 0) return 0;
    
    // Get unique dates and sort them in descending order
    const uniqueDates = [...new Set(entries.map(e => e.date))].sort().reverse();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = getLocalDateString(today);
    
    let streak = 0;
    let checkDate = new Date(today);
    
    // Check if there's a meditation today or yesterday to start counting
    const hasToday = uniqueDates.includes(todayStr);
    if (!hasToday) {
      // If no meditation today, check yesterday
      checkDate.setDate(checkDate.getDate() - 1);
      const yesterdayStr = getLocalDateString(checkDate);
      if (!uniqueDates.includes(yesterdayStr)) {
        return 0; // No streak if no meditation today or yesterday
      }
    }
    
    // Count consecutive days
    for (let i = 0; i < uniqueDates.length; i++) {
      const expectedStr = getLocalDateString(checkDate);
      
      if (uniqueDates[i] === expectedStr) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break; // Gap found, stop counting
      }
    }
    
    return streak;
  }, [entries]);

  const getMonthCount = useCallback((year: number, month: number): number => {
    return getEntriesForMonth(year, month).length;
  }, [getEntriesForMonth]);

  // Session management
  const addSession = useCallback(async (session: Omit<MeditationSession, "id" | "deviceId">) => {
    const newSession: MeditationSession = {
      ...session,
      id: Crypto.randomUUID(),
      deviceId,
    };
    
    const updatedSessions = [...sessions, newSession].sort((a, b) => b.timestamp - a.timestamp);
    setSessions(updatedSessions);
    await AsyncStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(updatedSessions));
  }, [sessions, deviceId]);

  const getSessionsForMonth = useCallback((year: number, month: number): MeditationSession[] => {
    return sessions.filter(session => {
      const d = new Date(session.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }, [sessions]);

  // Statistics
  const getTotalMinutesMeditated = useCallback((): number => {
    const entriesMinutes = entries.reduce((sum, entry) => sum + (entry.durationMinutes || 0), 0);
    const sessionsMinutes = sessions.reduce((sum, session) => sum + session.durationMinutes, 0);
    return entriesMinutes + sessionsMinutes;
  }, [entries, sessions]);

  const getAverageConcentration = useCallback((): number => {
    const concentrationAnswers = entries
      .map(entry => entry.answers.find(a => a.questionId === "concentration"))
      .filter(answer => answer && typeof answer.value === "number")
      .map(answer => answer!.value as number);
    
    if (concentrationAnswers.length === 0) return 0;
    return concentrationAnswers.reduce((sum, val) => sum + val, 0) / concentrationAnswers.length;
  }, [entries]);

  const getWeeklyStats = useCallback((): { date: string; minutes: number; count: number }[] => {
    const today = new Date();
    const stats: { date: string; minutes: number; count: number }[] = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      
      const dayEntries = entries.filter(e => e.date === dateStr);
      const daySessions = sessions.filter(s => s.date === dateStr);
      
      const minutes = dayEntries.reduce((sum, e) => sum + (e.durationMinutes || 0), 0) +
                     daySessions.reduce((sum, s) => sum + s.durationMinutes, 0);
      const count = dayEntries.length + daySessions.length;
      
      stats.push({ date: dateStr, minutes, count });
    }
    
    return stats;
  }, [entries, sessions]);

  return (
    <DataContext.Provider value={{
      entries,
      sessions,
      questions,
      deviceId,
      isLoading,
      addEntry,
      updateEntry,
      deleteEntry,
      getEntryByDate,
      getEntriesForMonth,
      addSession,
      getSessionsForMonth,
      getTotalMinutesMeditated,
      getAverageConcentration,
      getWeeklyStats,
      addQuestion,
      updateQuestion,
      deleteQuestion,
      reorderQuestions,
      resetQuestionsToDefault,
      getStreak,
      getMonthCount,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}
