import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const THEME_STORAGE_KEY = "@meditary_theme";

export type ThemeColor = "purple" | "blue" | "green" | "orange" | "pink" | "clear";

interface ThemeColors {
  tint: string;
  tintSecondary: string;
  tintLight: string;
  success: string;
  error: string;
}

export const THEME_PALETTES: Record<ThemeColor, ThemeColors> = {
  purple: {
    tint: "#7C3AED",
    tintSecondary: "#14B8A6",
    tintLight: "#EDE9FE",
    success: "#10B981",
    error: "#EF4444",
  },
  blue: {
    tint: "#0EA5E9",
    tintSecondary: "#06B6D4",
    tintLight: "#E0F2FE",
    success: "#10B981",
    error: "#EF4444",
  },
  green: {
    tint: "#10B981",
    tintSecondary: "#14B8A6",
    tintLight: "#D1FAE5",
    success: "#10B981",
    error: "#EF4444",
  },
  orange: {
    tint: "#F97316",
    tintSecondary: "#FB923C",
    tintLight: "#FFEDD5",
    success: "#10B981",
    error: "#EF4444",
  },
  pink: {
    tint: "#EC4899",
    tintSecondary: "#F472B6",
    tintLight: "#FCE7F3",
    success: "#10B981",
    error: "#EF4444",
  },
  clear: {
    tint: "#6B7280",
    tintSecondary: "#9CA3AF",
    tintLight: "#F3F4F6",
    success: "#10B981",
    error: "#EF4444",
  },
};

export const THEME_ICONS: Record<ThemeColor, string> = {
  purple: "icon-purple.png",
  blue: "icon-blue.png",
  green: "icon-green.png",
  orange: "icon-orange.png",
  pink: "icon-pink.png",
  clear: "icon-clear.png",
};

export const THEME_LABELS: Record<ThemeColor, { en: string; pt: string }> = {
  purple: { en: "Purple", pt: "Roxo" },
  blue: { en: "Blue", pt: "Azul" },
  green: { en: "Green", pt: "Verde" },
  orange: { en: "Orange", pt: "Laranja" },
  pink: { en: "Pink", pt: "Rosa" },
  clear: { en: "Clear", pt: "Transparente" },
};

interface ThemeContextType {
  themeColor: ThemeColor;
  setThemeColor: (color: ThemeColor) => Promise<void>;
  colors: ThemeColors;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Fixed to purple theme only
  const themeColor: ThemeColor = "purple";
  const isLoading = false;

  // No-op function for compatibility
  const setThemeColor = async (color: ThemeColor) => {
    // Theme is fixed to purple, do nothing
  };

  const colors = THEME_PALETTES[themeColor];

  return (
    <ThemeContext.Provider value={{ themeColor, setThemeColor, colors, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useAppTheme must be used within a ThemeProvider");
  }
  return context;
}
