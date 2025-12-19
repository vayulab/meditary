import { describe, it, expect } from "vitest";
import { translations, getTranslation } from "../constants/i18n";
import { DEFAULT_QUESTIONS, MeditationEntry, Question } from "../constants/data";
import { 
  THEME_PALETTES, 
  THEME_LABELS, 
  THEME_ICONS,
  ThemeColor 
} from "../contexts/theme-context";

describe("Internationalization - New Features", () => {
  it("should have tabProgress translation in both languages", () => {
    expect(translations.en.tabProgress).toBe("Progress");
    expect(translations.pt.tabProgress).toBe("Progresso");
  });

  it("should have all tab translations", () => {
    const tabs = ["tabHome", "tabNewEntry", "tabHistory", "tabProgress", "tabSettings"];
    tabs.forEach(tab => {
      expect(translations.en[tab as keyof typeof translations.en]).toBeDefined();
      expect(translations.pt[tab as keyof typeof translations.pt]).toBeDefined();
    });
  });

  it("should translate keys correctly using getTranslation", () => {
    expect(getTranslation("en", "tabProgress")).toBe("Progress");
    expect(getTranslation("pt", "tabProgress")).toBe("Progresso");
    expect(getTranslation("en", "homeTitle")).toBe("Today");
    expect(getTranslation("pt", "homeTitle")).toBe("Hoje");
  });
});

describe("Theme System", () => {
  const themeColors: ThemeColor[] = ["purple", "blue", "green", "orange", "pink", "clear"];

  it("should have all theme palettes defined", () => {
    themeColors.forEach(color => {
      expect(THEME_PALETTES[color]).toBeDefined();
      expect(THEME_PALETTES[color].tint).toBeDefined();
      expect(THEME_PALETTES[color].tintSecondary).toBeDefined();
      expect(THEME_PALETTES[color].tintLight).toBeDefined();
      expect(THEME_PALETTES[color].success).toBeDefined();
      expect(THEME_PALETTES[color].error).toBeDefined();
    });
  });

  it("should have all theme labels in both languages", () => {
    themeColors.forEach(color => {
      expect(THEME_LABELS[color]).toBeDefined();
      expect(THEME_LABELS[color].en).toBeDefined();
      expect(THEME_LABELS[color].pt).toBeDefined();
      expect(typeof THEME_LABELS[color].en).toBe("string");
      expect(typeof THEME_LABELS[color].pt).toBe("string");
    });
  });

  it("should have all theme icons defined", () => {
    themeColors.forEach(color => {
      expect(THEME_ICONS[color]).toBeDefined();
      expect(THEME_ICONS[color]).toContain(".png");
    });
  });

  it("should have valid hex colors in palettes", () => {
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
    themeColors.forEach(color => {
      expect(THEME_PALETTES[color].tint).toMatch(hexColorRegex);
      expect(THEME_PALETTES[color].tintSecondary).toMatch(hexColorRegex);
      expect(THEME_PALETTES[color].success).toMatch(hexColorRegex);
      expect(THEME_PALETTES[color].error).toMatch(hexColorRegex);
    });
  });

  it("should have purple as the default theme with correct colors", () => {
    expect(THEME_PALETTES.purple.tint).toBe("#7C3AED");
    expect(THEME_PALETTES.purple.tintSecondary).toBe("#14B8A6");
  });
});

describe("Default Questions", () => {
  it("should have all 10 default meditation questions", () => {
    expect(DEFAULT_QUESTIONS.length).toBe(10);
  });

  it("should have required fields for each question", () => {
    DEFAULT_QUESTIONS.forEach(question => {
      expect(question.id).toBeDefined();
      expect(question.textEn).toBeDefined();
      expect(question.textPt).toBeDefined();
      expect(question.type).toBeDefined();
      expect(question.order).toBeDefined();
      expect(["rating", "text", "yesno"]).toContain(question.type);
    });
  });

  it("should have unique IDs for all questions", () => {
    const ids = DEFAULT_QUESTIONS.map(q => q.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("should have questions in correct order", () => {
    const orders = DEFAULT_QUESTIONS.map(q => q.order);
    const sortedOrders = [...orders].sort((a, b) => a - b);
    expect(orders).toEqual(sortedOrders);
  });

  it("should include specific meditation questions", () => {
    const questionIds = DEFAULT_QUESTIONS.map(q => q.id);
    expect(questionIds).toContain("concentration");
    expect(questionIds).toContain("physicalPain");
    expect(questionIds).toContain("eyes");
    expect(questionIds).toContain("pranayama");
    expect(questionIds).toContain("kechariMudra");
    expect(questionIds).toContain("yoniMudra");
  });
});

describe("Meditation Entry Structure", () => {
  it("should create valid entry structure", () => {
    const mockEntry: MeditationEntry = {
      id: "test-123",
      date: "2024-12-19",
      timestamp: Date.now(),
      deviceId: "device-abc",
      answers: [
        { questionId: "concentration", value: 4 },
        { questionId: "physicalPain", value: "No pain" },
      ],
      notes: "Great session",
    };

    expect(mockEntry.id).toBe("test-123");
    expect(mockEntry.date).toBe("2024-12-19");
    expect(mockEntry.deviceId).toBe("device-abc");
    expect(mockEntry.answers.length).toBe(2);
    expect(mockEntry.answers[0].questionId).toBe("concentration");
    expect(mockEntry.answers[0].value).toBe(4);
  });

  it("should support different answer types", () => {
    const answers = [
      { questionId: "concentration", value: 5 },
      { questionId: "physicalPain", value: "Some back pain" },
      { questionId: "sleepy", value: true },
    ];

    expect(typeof answers[0].value).toBe("number");
    expect(typeof answers[1].value).toBe("string");
    expect(typeof answers[2].value).toBe("boolean");
  });
});

describe("Timer Presets", () => {
  const TIMER_PRESETS = [5, 10, 15, 20, 30, 45, 60];

  it("should have valid timer presets", () => {
    expect(TIMER_PRESETS.length).toBeGreaterThan(0);
    TIMER_PRESETS.forEach(preset => {
      expect(preset).toBeGreaterThan(0);
      expect(Number.isInteger(preset)).toBe(true);
    });
  });

  it("should have presets in ascending order", () => {
    const sorted = [...TIMER_PRESETS].sort((a, b) => a - b);
    expect(TIMER_PRESETS).toEqual(sorted);
  });

  it("should include common meditation durations", () => {
    expect(TIMER_PRESETS).toContain(10);
    expect(TIMER_PRESETS).toContain(20);
    expect(TIMER_PRESETS).toContain(30);
  });
});

describe("Date and Time Utilities", () => {
  it("should format time correctly", () => {
    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    expect(formatTime(0)).toBe("00:00");
    expect(formatTime(60)).toBe("01:00");
    expect(formatTime(90)).toBe("01:30");
    expect(formatTime(600)).toBe("10:00");
    expect(formatTime(3600)).toBe("60:00");
  });

  it("should calculate streak correctly", () => {
    const calculateStreak = (dates: string[]): number => {
      if (dates.length === 0) return 0;
      
      const sortedDates = [...dates].sort().reverse();
      const today = new Date().toISOString().split("T")[0];
      let streak = 0;
      
      for (let i = 0; i < sortedDates.length; i++) {
        const expectedDate = new Date();
        expectedDate.setDate(expectedDate.getDate() - i);
        const expectedStr = expectedDate.toISOString().split("T")[0];
        
        if (sortedDates.includes(expectedStr)) {
          streak++;
        } else if (i > 0) {
          break;
        }
      }
      
      return streak;
    };

    // Test with no dates
    expect(calculateStreak([])).toBe(0);
    
    // Test with today only
    const today = new Date().toISOString().split("T")[0];
    expect(calculateStreak([today])).toBe(1);
  });
});
