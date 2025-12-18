import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Application from "expo-application";
import * as Crypto from "expo-crypto";
import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { Platform } from "react-native";

import { 
  MeditationEntry, 
  Question, 
  DEFAULT_QUESTIONS, 
  STORAGE_KEYS 
} from "@/constants/data";

interface DataContextType {
  entries: MeditationEntry[];
  questions: Question[];
  deviceId: string;
  isLoading: boolean;
  addEntry: (entry: Omit<MeditationEntry, "id" | "deviceId">) => Promise<MeditationEntry>;
  updateEntry: (id: string, updates: Partial<MeditationEntry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  getEntryByDate: (date: string) => MeditationEntry | undefined;
  getEntriesForMonth: (year: number, month: number) => MeditationEntry[];
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
    
    const sortedEntries = [...entries].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let streak = 0;
    let currentDate = today;
    
    for (const entry of sortedEntries) {
      const entryDate = new Date(entry.date);
      entryDate.setHours(0, 0, 0, 0);
      
      const diffDays = Math.floor((currentDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0 || diffDays === 1) {
        streak++;
        currentDate = entryDate;
      } else if (diffDays > 1) {
        break;
      }
    }
    
    return streak;
  }, [entries]);

  const getMonthCount = useCallback((year: number, month: number): number => {
    return getEntriesForMonth(year, month).length;
  }, [getEntriesForMonth]);

  return (
    <DataContext.Provider value={{
      entries,
      questions,
      deviceId,
      isLoading,
      addEntry,
      updateEntry,
      deleteEntry,
      getEntryByDate,
      getEntriesForMonth,
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
