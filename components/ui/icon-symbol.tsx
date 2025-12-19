// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Meditary icon mappings - SF Symbols to Material Icons
 */
const MAPPING = {
  // Tab bar icons
  "house.fill": "home",
  "plus.circle.fill": "add-circle",
  "calendar": "calendar-today",
  "gearshape.fill": "settings",
  "chart.bar.fill": "bar-chart",
  "chart.bar": "bar-chart",
  
  // Notifications
  "bell.fill": "notifications",
  "chevron.up": "keyboard-arrow-up",
  "chevron.down": "keyboard-arrow-down",
  "brain": "psychology",
  "checkmark.circle.fill": "check-circle",
  "timer": "timer",
  "play.fill": "play-arrow",
  "pause.fill": "pause",
  "stop.fill": "stop",
  
  // Navigation & actions
  "chevron.left": "chevron-left",
  "chevron.right": "chevron-right",
  "xmark": "close",
  "checkmark": "check",
  "trash.fill": "delete",
  "pencil": "edit",
  "plus": "add",
  
  // Content icons
  "sun.max.fill": "wb-sunny",
  "moon.fill": "nightlight",
  "flame.fill": "local-fire-department",
  "star.fill": "star",
  "star": "star-outline",
  "heart.fill": "favorite",
  "list.bullet": "format-list-bulleted",
  "square.grid.2x2": "grid-view",
  "info.circle": "info",
  "questionmark.circle": "help",
  "arrow.clockwise": "refresh",
  "square.and.arrow.up": "share",
  "doc.text": "description",
  "person.fill": "person",
  
  // Meditation specific
  "brain.head.profile": "psychology",
  "eye.fill": "visibility",
  "ear.fill": "hearing",
  "hand.raised.fill": "pan-tool",
  "lungs.fill": "air",
  "zzz": "bedtime",
  "speaker.wave.2.fill": "volume-up",
  "line.3.horizontal": "drag-handle",
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
