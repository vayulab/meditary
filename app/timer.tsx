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
  ScrollView,
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
import { useAppTheme } from "@/contexts/theme-context";
import { useData } from "@/contexts/data-context";
import { getLocalDateString } from "@/lib/date-utils";

const TIMER_PRESETS = [5, 10, 15, 20, 30, 45, 60];
const INTERVAL_PRESETS = [0, 5, 10, 15, 20, 30]; // 0 = off
const GONG_SOUNDS = [
  { id: "gong-1", labelEn: "Notification Bell", labelPt: "Sino de Notificação" },
  { id: "gong-2", labelEn: "Tibetan Bowl (E♭)", labelPt: "Tigela Tibetana (Mi♭)" },
  { id: "gong-3", labelEn: "Zen Bowl (Long Stroke)", labelPt: "Tigela Zen (Golpe Longo)" },
];

export default function TimerScreen() {
  useKeepAwake();
  
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { colors: themeColors } = useAppTheme();
  const { language } = useLanguage();
  const { addSession } = useData();

  const [duration, setDuration] = useState(10); // minutes
  const [intervalGong, setIntervalGong] = useState(0); // minutes, 0 = off
  const [gongSound, setGongSound] = useState("gong-1");
  const [timeRemaining, setTimeRemaining] = useState(duration * 60); // seconds
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showPresets, setShowPresets] = useState(true);
  
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastGongTimeRef = useRef<number>(0);
  const startSoundRef = useRef<Audio.Sound | null>(null);
  const intervalSoundRef = useRef<Audio.Sound | null>(null);
  const endSoundRef = useRef<Audio.Sound | null>(null);

  
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

  // Load audio sounds
  useEffect(() => {
    const loadSounds = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
        });

        // Load start bell sound
        const startBellFile = require("@/assets/sounds/bell-start.mp3");
        
        // Load gong sounds based on selected type
        const gongSoundFile = gongSound === "gong-1" 
          ? require("@/assets/sounds/gong-1.mp3")
          : gongSound === "gong-2"
          ? require("@/assets/sounds/gong-2.mp3")
          : require("@/assets/sounds/gong-3.mp3");
        
        // Load end bell sound
        const endBellFile = require("@/assets/sounds/bell-end.mp3");
        
        const { sound: startSound } = await Audio.Sound.createAsync(startBellFile);
        await startSound.setVolumeAsync(1.0); // Maximum volume
        startSoundRef.current = startSound;

        const { sound: intervalSound } = await Audio.Sound.createAsync(gongSoundFile);
        await intervalSound.setVolumeAsync(1.0); // Maximum volume
        intervalSoundRef.current = intervalSound;

        const { sound: endSound } = await Audio.Sound.createAsync(endBellFile);
        await endSound.setVolumeAsync(1.0); // Maximum volume
        endSoundRef.current = endSound;
      } catch (error) {
        console.error("Error loading sounds:", error);
      }
    };

    loadSounds();

    return () => {
      startSoundRef.current?.unloadAsync();
      intervalSoundRef.current?.unloadAsync();
      endSoundRef.current?.unloadAsync();

    };
  }, [gongSound]);

  // Play bell sound (start/end)
  const playBellSound = useCallback(async (type: "start" | "end" | "interval" = "start") => {
    try {
      const sound = type === "start" 
        ? startSoundRef.current 
        : type === "end" 
        ? endSoundRef.current 
        : intervalSoundRef.current;

      if (sound) {
        await sound.replayAsync();
      }
      
      // Add haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Error playing bell sound:", error);
      // Fallback to haptic only
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, []);

  // Timer logic with interval gong
  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          
          // Check for interval gong
          if (intervalGong > 0) {
            const elapsed = duration * 60 - prev + 1;
            const intervalSeconds = intervalGong * 60;
            
            if (elapsed > 0 && elapsed % intervalSeconds === 0 && elapsed !== lastGongTimeRef.current) {
              lastGongTimeRef.current = elapsed;
              playBellSound("interval");
            }
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
  }, [isRunning, isPaused, intervalGong, duration]);

  const handleTimerComplete = async () => {
    setIsRunning(false);
    setIsPaused(false);
    lastGongTimeRef.current = 0;
    

    
    await playBellSound("end");
    
    // Save meditation session
    const todayStr = getLocalDateString();
    await addSession({
      date: todayStr,
      timestamp: Date.now(),
      durationMinutes: duration,
      hasEntry: false,
    });
    
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
    await playBellSound("start");
    

    
    setShowPresets(false);
    setTimeRemaining(duration * 60);
    lastGongTimeRef.current = 0;
    setIsRunning(true);
    setIsPaused(false);
  };

  const handlePause = async () => {
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
          onPress: async () => {
            setIsRunning(false);
            setIsPaused(false);
            setShowPresets(true);
            setTimeRemaining(duration * 60);
            lastGongTimeRef.current = 0;
            

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

  const handleIntervalSelect = (minutes: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIntervalGong(minutes);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getIntervalLabel = (minutes: number) => {
    if (minutes === 0) return language === "pt" ? "Desligado" : "Off";
    return `${minutes} min`;
  };

  const progress = isRunning ? (duration * 60 - timeRemaining) / (duration * 60) : 0;
  const circumference = 2 * Math.PI * 100;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View 
        style={[
          styles.header, 
          { 
            paddingTop: Math.max(insets.top, 20) + Spacing.sm,
            borderBottomColor: colors.border,
          }
        ]}
      >
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color={themeColors.tint} />
          <ThemedText style={[styles.backText, { color: themeColors.tint }]}>
            {language === "pt" ? "Voltar" : "Back"}
          </ThemedText>
        </Pressable>
        <ThemedText style={styles.headerTitle}>
          {language === "pt" ? "Timer de Meditação" : "Meditation Timer"}
        </ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Timer Circle */}
        <Animated.View style={[styles.timerContainer, breathingStyle]}>
          <Svg width={240} height={240} style={styles.progressRing}>
            {/* Background circle */}
            <Circle
              cx={120}
              cy={120}
              r={100}
              stroke={colors.border}
              strokeWidth={10}
              fill="none"
            />
            {/* Progress circle */}
            <Circle
              cx={120}
              cy={120}
              r={100}
              stroke={themeColors.tint}
              strokeWidth={10}
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              rotation="-90"
              origin="120, 120"
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
          <>
            {/* Duration Presets */}
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
                        backgroundColor: duration === preset ? themeColors.tint : colors.surface,
                        borderColor: duration === preset ? themeColors.tint : colors.border,
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

            {/* Interval Gong Presets */}
            <View style={styles.presetsContainer}>
              <View style={styles.intervalHeader}>
                <IconSymbol name="bell.fill" size={18} color={themeColors.tintSecondary} />
                <ThemedText style={[styles.presetsLabel, { color: colors.textSecondary, marginBottom: 0 }]}>
                  {language === "pt" ? "Gongo a cada" : "Gong every"}
                </ThemedText>
              </View>
              <View style={styles.presets}>
                {INTERVAL_PRESETS.map((preset) => (
                  <Pressable
                    key={`interval-${preset}`}
                    style={[
                      styles.intervalButton,
                      {
                        backgroundColor: intervalGong === preset ? themeColors.tintSecondary : colors.surface,
                        borderColor: intervalGong === preset ? themeColors.tintSecondary : colors.border,
                      },
                    ]}
                    onPress={() => handleIntervalSelect(preset)}
                  >
                    <ThemedText
                      style={[
                        styles.intervalText,
                        { color: intervalGong === preset ? "#FFFFFF" : colors.text },
                      ]}
                    >
                      {getIntervalLabel(preset)}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Gong Sound Selector */}
            <View style={styles.presetsContainer}>
              <View style={styles.intervalHeader}>
                <IconSymbol name="speaker.wave.2.fill" size={20} color={themeColors.tint} />
                <ThemedText style={styles.intervalText}>
                  {language === "pt" ? "Tipo de Gongo" : "Gong Type"}
                </ThemedText>
              </View>
              <View style={styles.presets}>
                {GONG_SOUNDS.map((sound) => (
                  <Pressable
                    key={sound.id}
                    style={[
                      styles.intervalButton,
                      {
                        backgroundColor: gongSound === sound.id ? themeColors.tintSecondary : colors.surface,
                        borderColor: gongSound === sound.id ? themeColors.tintSecondary : colors.border,
                      },
                    ]}
                    onPress={async () => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setGongSound(sound.id);
                      // Test play the selected gong
                      try {
                        const testFile = sound.id === "gong-1" 
                          ? require("@/assets/sounds/gong-1.mp3")
                          : sound.id === "gong-2"
                          ? require("@/assets/sounds/gong-2.mp3")
                          : require("@/assets/sounds/gong-3.mp3");
                        const { sound: testSound } = await Audio.Sound.createAsync(testFile);
                        await testSound.setVolumeAsync(1.0); // Maximum volume
                        await testSound.playAsync();
                        setTimeout(() => testSound.unloadAsync(), 3000);
                      } catch (error) {
                        console.error("Error playing test gong:", error);
                      }
                    }}
                  >
                    <ThemedText
                      style={[
                        styles.intervalText,
                        { color: gongSound === sound.id ? "#FFFFFF" : colors.text },
                      ]}
                    >
                      {language === "pt" ? sound.labelPt : sound.labelEn}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>
          </>
        )}

        {/* Controls */}
        <View style={styles.controls}>
          {!isRunning ? (
            <Pressable
              style={[styles.startButton, { backgroundColor: themeColors.tint }]}
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
                  { backgroundColor: isPaused ? themeColors.tintSecondary : themeColors.tint },
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
          <ThemedView style={[styles.tipsCard, { backgroundColor: themeColors.tint + "15" }]}>
            <IconSymbol name="info.circle" size={20} color={themeColors.tint} />
            <ThemedText style={[styles.tipsText, { color: colors.textSecondary }]}>
              {language === "pt" 
                ? "Encontre um lugar tranquilo, sente-se confortavelmente e feche os olhos. O sino tocará no início e no fim da sessão."
                : "Find a quiet place, sit comfortably and close your eyes. The bell will ring at the start and end of the session."
              }
            </ThemedText>
          </ThemedView>
        )}

        {/* Interval Gong Info */}
        {!isRunning && intervalGong > 0 && (
          <ThemedView style={[styles.intervalInfo, { backgroundColor: themeColors.tintSecondary + "15" }]}>
            <IconSymbol name="bell.fill" size={18} color={themeColors.tintSecondary} />
            <ThemedText style={[styles.intervalInfoText, { color: colors.textSecondary }]}>
              {language === "pt" 
                ? `O gongo tocará a cada ${intervalGong} minutos durante a meditação.`
                : `The gong will sound every ${intervalGong} minutes during meditation.`
              }
            </ThemedText>
          </ThemedView>
        )}
      </ScrollView>
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
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: -Spacing.sm,
    minWidth: 80,
  },
  backText: {
    fontSize: 16,
    marginLeft: Spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  headerSpacer: {
    minWidth: 80,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  timerContainer: {
    width: 240,
    height: 240,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  progressRing: {
    position: "absolute",
  },
  timerContent: {
    alignItems: "center",
  },
  timerText: {
    fontSize: 48,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    lineHeight: 56,
  },
  timerLabel: {
    fontSize: 16,
    marginTop: Spacing.xs,
    lineHeight: 24,
  },
  presetsContainer: {
    width: "100%",
    marginBottom: Spacing.lg,
  },
  presetsLabel: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  intervalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  presets: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  presetButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  presetText: {
    fontSize: 16,
    fontWeight: "600",
  },
  intervalButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  intervalText: {
    fontSize: 14,
    fontWeight: "500",
  },
  controls: {
    marginBottom: Spacing.lg,
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    minWidth: 180,
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
    width: "100%",
  },
  tipsText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  intervalInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    width: "100%",
    marginTop: Spacing.sm,
  },
  intervalInfoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
