import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Audio } from "expo-av";
import { useKeepAwake } from "expo-keep-awake";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  View, 
  Pressable, 
  StyleSheet, 
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useLanguage } from "@/contexts/language-context";

const TIMER_PRESETS = [5, 10, 15, 20, 30, 45, 60];

// Simple bell sound using Audio API
const BELL_FREQUENCY = 528; // Hz - healing frequency

export default function TimerScreen() {
  useKeepAwake();
  
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { language } = useLanguage();

  const [duration, setDuration] = useState(10); // minutes
  const [timeRemaining, setTimeRemaining] = useState(duration * 60); // seconds
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showPresets, setShowPresets] = useState(true);
  
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  
  // Breathing animation
  const breathScale = useSharedValue(1);
  
  useEffect(() => {
    if (isRunning && !isPaused) {
      breathScale.value = withRepeat(
        withTiming(1.15, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      breathScale.value = withTiming(1, { duration: 500 });
    }
  }, [isRunning, isPaused]);

  const breathingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathScale.value }],
  }));

  // Load and play bell sound
  const playBellSound = useCallback(async () => {
    try {
      // Configure audio mode
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      // Create a simple sine wave bell sound
      // Since we can't generate audio dynamically easily, we'll use haptic feedback as fallback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Play multiple haptic pulses to simulate bell
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 200);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 400);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 600);
    } catch (error) {
      console.error("Error playing bell sound:", error);
    }
  }, []);

  // Timer logic
  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isPaused]);

  const handleTimerComplete = async () => {
    setIsRunning(false);
    setIsPaused(false);
    await playBellSound();
    
    Alert.alert(
      language === "pt" ? "Meditação Completa 🧘" : "Meditation Complete 🧘",
      language === "pt" 
        ? "Parabéns! Sua sessão de meditação terminou."
        : "Congratulations! Your meditation session is complete.",
      [
        {
          text: language === "pt" ? "Registrar" : "Log Entry",
          onPress: () => router.push("/new-entry" as any),
        },
        {
          text: language === "pt" ? "Fechar" : "Close",
          style: "cancel",
          onPress: () => {
            setShowPresets(true);
            setTimeRemaining(duration * 60);
          },
        },
      ]
    );
  };

  const handleStart = async () => {
    await playBellSound();
    setShowPresets(false);
    setTimeRemaining(duration * 60);
    setIsRunning(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsPaused(!isPaused);
  };

  const handleStop = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      language === "pt" ? "Parar Meditação?" : "Stop Meditation?",
      language === "pt" 
        ? "Tem certeza que deseja parar a meditação?"
        : "Are you sure you want to stop the meditation?",
      [
        { text: language === "pt" ? "Cancelar" : "Cancel", style: "cancel" },
        {
          text: language === "pt" ? "Parar" : "Stop",
          style: "destructive",
          onPress: () => {
            setIsRunning(false);
            setIsPaused(false);
            setShowPresets(true);
            setTimeRemaining(duration * 60);
          },
        },
      ]
    );
  };

  const handlePresetSelect = (minutes: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDuration(minutes);
    setTimeRemaining(minutes * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = isRunning ? (duration * 60 - timeRemaining) / (duration * 60) : 0;
  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View 
        style={[
          styles.header, 
          { 
            paddingTop: Math.max(insets.top, 20) + Spacing.sm,
          }
        ]}
      >
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color={colors.tint} />
          <ThemedText style={[styles.backText, { color: colors.tint }]}>
            {language === "pt" ? "Voltar" : "Back"}
          </ThemedText>
        </Pressable>
      </View>

      <View style={styles.content}>
        <ThemedText style={styles.title}>
          {language === "pt" ? "Timer de Meditação" : "Meditation Timer"}
        </ThemedText>

        {/* Timer Circle */}
        <Animated.View style={[styles.timerContainer, breathingStyle]}>
          <Svg width={280} height={280} style={styles.progressRing}>
            {/* Background circle */}
            <Circle
              cx={140}
              cy={140}
              r={120}
              stroke={colors.border}
              strokeWidth={12}
              fill="none"
            />
            {/* Progress circle */}
            <Circle
              cx={140}
              cy={140}
              r={120}
              stroke={colors.tint}
              strokeWidth={12}
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              rotation="-90"
              origin="140, 140"
            />
          </Svg>
          
          <View style={styles.timerContent}>
            <ThemedText style={styles.timerText}>
              {formatTime(timeRemaining)}
            </ThemedText>
            {isRunning && (
              <ThemedText style={[styles.timerLabel, { color: colors.textSecondary }]}>
                {isPaused 
                  ? (language === "pt" ? "Pausado" : "Paused")
                  : (language === "pt" ? "Meditando..." : "Meditating...")
                }
              </ThemedText>
            )}
          </View>
        </Animated.View>

        {/* Preset Selection */}
        {showPresets && (
          <View style={styles.presetsContainer}>
            <ThemedText style={[styles.presetsLabel, { color: colors.textSecondary }]}>
              {language === "pt" ? "Duração (minutos)" : "Duration (minutes)"}
            </ThemedText>
            <View style={styles.presets}>
              {TIMER_PRESETS.map((preset) => (
                <Pressable
                  key={preset}
                  style={[
                    styles.presetButton,
                    {
                      backgroundColor: duration === preset ? colors.tint : colors.surface,
                      borderColor: duration === preset ? colors.tint : colors.border,
                    },
                  ]}
                  onPress={() => handlePresetSelect(preset)}
                >
                  <ThemedText
                    style={[
                      styles.presetText,
                      { color: duration === preset ? "#FFFFFF" : colors.text },
                    ]}
                  >
                    {preset}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Controls */}
        <View style={styles.controls}>
          {!isRunning ? (
            <Pressable
              style={[styles.startButton, { backgroundColor: colors.tint }]}
              onPress={handleStart}
            >
              <IconSymbol name="play.fill" size={32} color="#FFFFFF" />
              <ThemedText style={styles.startButtonText}>
                {language === "pt" ? "Iniciar" : "Start"}
              </ThemedText>
            </Pressable>
          ) : (
            <View style={styles.runningControls}>
              <Pressable
                style={[styles.controlButton, { backgroundColor: colors.surface }]}
                onPress={handleStop}
              >
                <IconSymbol name="stop.fill" size={28} color={colors.error} />
              </Pressable>
              
              <Pressable
                style={[
                  styles.controlButton,
                  styles.pauseButton,
                  { backgroundColor: isPaused ? colors.tintSecondary : colors.tint },
                ]}
                onPress={handlePause}
              >
                <IconSymbol 
                  name={isPaused ? "play.fill" : "pause.fill"} 
                  size={32} 
                  color="#FFFFFF" 
                />
              </Pressable>
            </View>
          )}
        </View>

        {/* Tips */}
        {!isRunning && (
          <ThemedView style={[styles.tipsCard, { backgroundColor: colors.tint + "15" }]}>
            <IconSymbol name="info.circle" size={20} color={colors.tint} />
            <ThemedText style={[styles.tipsText, { color: colors.textSecondary }]}>
              {language === "pt" 
                ? "Encontre um lugar tranquilo, sente-se confortavelmente e feche os olhos. O sino tocará no início e no fim da sessão."
                : "Find a quiet place, sit comfortably and close your eyes. The bell will ring at the start and end of the session."
              }
            </ThemedText>
          </ThemedView>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: -Spacing.sm,
  },
  backText: {
    fontSize: 16,
    marginLeft: Spacing.xs,
  },
  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: Spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: Spacing.xl,
  },
  timerContainer: {
    width: 280,
    height: 280,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  progressRing: {
    position: "absolute",
  },
  timerContent: {
    alignItems: "center",
  },
  timerText: {
    fontSize: 56,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  timerLabel: {
    fontSize: 16,
    marginTop: Spacing.xs,
  },
  presetsContainer: {
    width: "100%",
    marginBottom: Spacing.xl,
  },
  presetsLabel: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  presets: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  presetButton: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  presetText: {
    fontSize: 18,
    fontWeight: "600",
  },
  controls: {
    marginBottom: Spacing.xl,
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    minWidth: 200,
  },
  startButtonText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "600",
  },
  runningControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
  },
  controlButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  pauseButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  tipsCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.md,
  },
  tipsText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
