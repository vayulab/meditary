/**
 * Meditary Data Types and Default Questions
 */

export interface Question {
  id: string;
  textEn: string;
  textPt: string;
  type: "rating" | "text" | "yesno";
  isDefault: boolean;
  order: number;
}

export interface Answer {
  questionId: string;
  value: string | number;
}

export interface MeditationEntry {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  timestamp: number;
  deviceId: string;
  answers: Answer[];
  notes?: string;
}

export interface AppSettings {
  language: "en" | "pt";
  deviceId: string;
}

// Default questions based on user requirements
export const DEFAULT_QUESTIONS: Question[] = [
  {
    id: "concentration",
    textEn: "How was my concentration?",
    textPt: "Minha concentração estava?",
    type: "rating",
    isDefault: true,
    order: 0,
  },
  {
    id: "physicalPain",
    textEn: "Any physical pain?",
    textPt: "Alguma dor física?",
    type: "text",
    isDefault: true,
    order: 1,
  },
  {
    id: "eyes",
    textEn: "How were my eyes?",
    textPt: "Olhos estavam?",
    type: "text",
    isDefault: true,
    order: 2,
  },
  {
    id: "sensation",
    textEn: "What sensation emerged?",
    textPt: "Qual foi sensação que emergiu?",
    type: "text",
    isDefault: true,
    order: 3,
  },
  {
    id: "thoughts",
    textEn: "Many thoughts during?",
    textPt: "Muitos pensamentos durante?",
    type: "yesno",
    isDefault: true,
    order: 4,
  },
  {
    id: "sleepy",
    textEn: "Did I feel sleepy?",
    textPt: "Deu sono?",
    type: "yesno",
    isDefault: true,
    order: 5,
  },
  {
    id: "heard",
    textEn: "What did I hear?",
    textPt: "O que escutei?",
    type: "text",
    isDefault: true,
    order: 6,
  },
  {
    id: "pranayama",
    textEn: "What did I notice in pranayama?",
    textPt: "O que percebi no pranayama?",
    type: "text",
    isDefault: true,
    order: 7,
  },
  {
    id: "kechariMudra",
    textEn: "How was the kechari mudra?",
    textPt: "Como foi o kechari mudra?",
    type: "text",
    isDefault: true,
    order: 8,
  },
  {
    id: "yoniMudra",
    textEn: "How was the yoni mudra?",
    textPt: "Como foi o yoni mudra?",
    type: "text",
    isDefault: true,
    order: 9,
  },
];

// Storage keys
export const STORAGE_KEYS = {
  ENTRIES: "@meditary/entries",
  QUESTIONS: "@meditary/questions",
  SETTINGS: "@meditary/settings",
  DEVICE_ID: "@meditary/deviceId",
};
