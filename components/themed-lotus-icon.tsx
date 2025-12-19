import React from "react";
import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import { useAppTheme, ThemeColor } from "@/contexts/theme-context";

// Import all icon images
const ICON_IMAGES: Record<ThemeColor, any> = {
  purple: require("@/assets/images/icons/icon-purple.png"),
  blue: require("@/assets/images/icons/icon-blue.png"),
  green: require("@/assets/images/icons/icon-green.png"),
  orange: require("@/assets/images/icons/icon-orange.png"),
  pink: require("@/assets/images/icons/icon-pink.png"),
  clear: require("@/assets/images/icons/icon-clear.png"),
};

interface ThemedLotusIconProps {
  size?: number;
  style?: any;
}

export function ThemedLotusIcon({ size = 48, style }: ThemedLotusIconProps) {
  const { themeColor } = useAppTheme();

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Image
        source={ICON_IMAGES[themeColor]}
        style={styles.image}
        contentFit="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
});
