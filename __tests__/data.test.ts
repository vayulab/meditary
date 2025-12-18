import { describe, it, expect } from "vitest";
import { DEFAULT_QUESTIONS, STORAGE_KEYS } from "../constants/data";
import { translations, getTranslation } from "../constants/i18n";

describe("Default Questions", () => {
  it("should have 10 default questions", () => {
    expect(DEFAULT_QUESTIONS.length).toBe(10);
  });

  it("should have all required fields for each question", () => {
    DEFAULT_QUESTIONS.forEach((question) => {
      expect(question).toHaveProperty("id");
      expect(question).toHaveProperty("textEn");
      expect(question).toHaveProperty("textPt");
      expect(question).toHaveProperty("type");
      expect(question).toHaveProperty("isDefault");
      expect(question).toHaveProperty("order");
    });
  });

  it("should have valid question types", () => {
    const validTypes = ["rating", "text", "yesno"];
    DEFAULT_QUESTIONS.forEach((question) => {
      expect(validTypes).toContain(question.type);
    });
  });

  it("should have unique IDs", () => {
    const ids = DEFAULT_QUESTIONS.map((q) => q.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("should have sequential order values starting from 0", () => {
    DEFAULT_QUESTIONS.forEach((question, index) => {
      expect(question.order).toBe(index);
    });
  });

  it("should include the specific meditation questions from requirements", () => {
    const requiredQuestions = [
      "concentration",
      "physicalPain",
      "eyes",
      "sensation",
      "thoughts",
      "sleepy",
      "heard",
      "pranayama",
      "kechariMudra",
      "yoniMudra",
    ];
    
    const questionIds = DEFAULT_QUESTIONS.map((q) => q.id);
    requiredQuestions.forEach((id) => {
      expect(questionIds).toContain(id);
    });
  });
});

describe("Storage Keys", () => {
  it("should have all required storage keys", () => {
    expect(STORAGE_KEYS).toHaveProperty("ENTRIES");
    expect(STORAGE_KEYS).toHaveProperty("QUESTIONS");
    expect(STORAGE_KEYS).toHaveProperty("SETTINGS");
    expect(STORAGE_KEYS).toHaveProperty("DEVICE_ID");
  });

  it("should have unique storage key values", () => {
    const values = Object.values(STORAGE_KEYS);
    const uniqueValues = new Set(values);
    expect(uniqueValues.size).toBe(values.length);
  });
});

describe("Translations", () => {
  it("should have English and Portuguese translations", () => {
    expect(translations).toHaveProperty("en");
    expect(translations).toHaveProperty("pt");
  });

  it("should have matching keys in both languages", () => {
    const enKeys = Object.keys(translations.en);
    const ptKeys = Object.keys(translations.pt);
    
    enKeys.forEach((key) => {
      expect(ptKeys).toContain(key);
    });
  });

  it("should return correct translation for English", () => {
    expect(getTranslation("en", "appName")).toBe("Meditary");
    expect(getTranslation("en", "tabHome")).toBe("Home");
    expect(getTranslation("en", "tabSettings")).toBe("Settings");
  });

  it("should return correct translation for Portuguese", () => {
    expect(getTranslation("pt", "appName")).toBe("Meditary");
    expect(getTranslation("pt", "tabHome")).toBe("Início");
    expect(getTranslation("pt", "tabSettings")).toBe("Ajustes");
  });

  it("should return key when translation not found", () => {
    expect(getTranslation("en", "nonexistent.key")).toBe("nonexistent.key");
  });

  it("should support nested key access", () => {
    expect(getTranslation("en", "questions.concentration")).toBe("How was my concentration?");
    expect(getTranslation("pt", "questions.concentration")).toBe("Minha concentração estava?");
  });
});


