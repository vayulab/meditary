import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { LanguageProvider } from "@/contexts/language-context";
import { DataProvider } from "@/contexts/data-context";
import { ThemeProvider as AppThemeProvider } from "@/contexts/theme-context";
import { Colors } from "@/constants/theme";



// Custom Meditary themes
const MeditaryLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.light.tint,
    background: Colors.light.background,
    card: Colors.light.surface,
    text: Colors.light.text,
    border: Colors.light.border,
  },
};

const MeditaryDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.dark.tint,
    background: Colors.dark.background,
    card: Colors.dark.surface,
    text: Colors.dark.text,
    border: Colors.dark.border,
  },
};

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const providerInitialMetrics = useMemo(
    () => initialWindowMetrics,
    [],
  );

  return (
    <SafeAreaProvider initialMetrics={providerInitialMetrics}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <LanguageProvider>
          <DataProvider>
            <AppThemeProvider>
              <ThemeProvider value={colorScheme === "dark" ? MeditaryDarkTheme : MeditaryLightTheme}>
                <Stack>
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen 
                    name="new-entry" 
                    options={{ 
                      presentation: "modal",
                      headerShown: false,
                    }} 
                  />
                  <Stack.Screen 
                    name="entry-detail" 
                    options={{ 
                      presentation: "card",
                      headerShown: false,
                    }} 
                  />
                  <Stack.Screen 
                    name="customize-questions" 
                    options={{ 
                      presentation: "card",
                      headerShown: false,
                    }} 
                  />
                  <Stack.Screen 
                    name="reminders" 
                    options={{ 
                      presentation: "card",
                      headerShown: false,
                    }} 
                  />
                  <Stack.Screen 
                    name="timer" 
                    options={{ 
                      presentation: "card",
                      headerShown: false,
                    }} 
                  />
                  <Stack.Screen 
                    name="appearance" 
                    options={{ 
                      presentation: "card",
                      headerShown: false,
                    }} 
                  />

                </Stack>
                <StatusBar style="auto" />
              </ThemeProvider>
            </AppThemeProvider>
          </DataProvider>
        </LanguageProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
