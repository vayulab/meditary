/**
 * Meditary Theme - Meditation-focused color palette
 * Primary: Deep violet (#6B4EFF) - spirituality and meditation
 * Secondary: Teal (#00C9A7) - calm and balance
 */

import { Platform } from "react-native";

export const Colors = {
  light: {
    text: "#1A1A2E",
    textSecondary: "#6B7280",
    textDisabled: "#9CA3AF",
    background: "#F8F9FC",
    surface: "#FFFFFF",
    tint: "#6B4EFF",
    tintSecondary: "#00C9A7",
    icon: "#6B7280",
    tabIconDefault: "#9CA3AF",
    tabIconSelected: "#6B4EFF",
    border: "#E5E7EB",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    cardShadow: "rgba(0, 0, 0, 0.08)",
  },
  dark: {
    text: "#F8F9FC",
    textSecondary: "#9CA3AF",
    textDisabled: "#6B7280",
    background: "#0F0F1A",
    surface: "#1A1A2E",
    tint: "#8B7AFF",
    tintSecondary: "#00E5BE",
    icon: "#9CA3AF",
    tabIconDefault: "#6B7280",
    tabIconSelected: "#8B7AFF",
    border: "#2D2D44",
    success: "#34D399",
    warning: "#FBBF24",
    error: "#F87171",
    cardShadow: "rgba(0, 0, 0, 0.3)",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
