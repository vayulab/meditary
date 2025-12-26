# Meditary 🧘

> A meditation tracking app built by a meditator, for meditators.

**Meditary was developed by a meditation practitioner who felt the need for an app like this. No login screens, no in-app purchases, no tracking — just the features that matter to support a good meditation practice.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React Native](https://img.shields.io/badge/React%20Native-0.79-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK%2054-000020.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)

---

## 🎯 Philosophy

Meditary was built with a clear vision:

1. **Privacy First**: No accounts, no servers, no tracking. Your meditation practice is personal.
2. **Simplicity**: Only features that enhance your practice, nothing more.
3. **Offline Always**: Works perfectly without internet. Your data never leaves your device.
4. **No Monetization**: No ads, no subscriptions, no in-app purchases.
5. **Open Source**: Transparent, auditable, and community-driven.

---

## ✨ Features

### 📝 Meditation Journal
- **Customizable Questions**: Tailor your reflection prompts (concentration, physical pain, emotional state, etc.)
- **Daily Entries**: Log your meditation sessions with personalized insights
- **Entry History**: Review past meditations with detailed notes and responses

### ⏱️ Meditation Timer
- **Flexible Durations**: 10, 15, 20, 30, 45, 60, 70, 80, or 90 minutes
- **Interval Gongs**: Optional chimes at 5, 10, 15, 20, or 30-minute intervals
- **Authentic Sounds**: Real meditation bell recordings (notification bell, Tibetan bowl, Zen bowl)
- **Smart Save**: Automatically prompts to save sessions over 10 minutes, even if stopped early

### 📊 Progress Tracking
- **Streak Counter**: Track consecutive days of practice
- **Weekly/Monthly/Yearly Stats**: Visualize meditation frequency and trends
- **Concentration Trends**: Monitor focus levels over time
- **Time Conversion**: Automatically displays hours when total minutes exceed 60

### 📅 Calendar View
- **Visual Overview**: See meditation days at a glance
- **Monthly Counts**: Track how many sessions per month
- **Day Details**: Tap any day to view all entries

### 🎨 Thoughtful Design
- **Offline-First**: All data stored locally with AsyncStorage
- **No Account Required**: Your data stays on your device

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20+ and **pnpm**
- **Expo CLI** (installed automatically)
- **For iOS Development** (macOS only):
  - Xcode 15+
  - iOS Simulator
- **For Android Development**:
  - Android Studio
  - Android Emulator
- **For Mobile Testing**: Expo Go app on your phone

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/diegom4riano/meditary.git
   cd meditary
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Start the development server**
   ```bash
   pnpm start

   pnpm exec expo start
   ```

4. **Run on your device**
   - **iOS**: Press `i` or scan the QR code with the Camera app
   - **Android**: Press `a` or scan the QR code with Expo Go
   - **Web**: Press `w`

---

## 🧪 Testing

Run the test suite:

```bash
pnpm test
```

All 34 unit tests cover:
- Data persistence and retrieval
- Streak calculation logic
- Question customization
- Timer functionality
- Calendar aggregation

---

## 📱 Tech Stack

### Mobile App
- **Framework**: React Native 0.79 with Expo SDK 54
- **Language**: TypeScript 5.9
- **Navigation**: Expo Router 6 (file-based routing)
- **Storage**: AsyncStorage (local, offline-first)
- **UI Components**: Custom themed components with dark mode support
- **Animations**: react-native-reanimated 4.0
- **Gestures**: react-native-gesture-handler
- **Audio**: expo-av for meditation gongs
- **Testing**: Vitest

---

## 🗂️ Project Structure

```
meditary/
├── app/                      # Expo Router screens
│   ├── (tabs)/              # Tab navigation screens
│   │   ├── index.tsx        # Home screen
│   │   ├── progress.tsx     # Statistics and charts
│   │   ├── history.tsx      # Calendar and entry list
│   │   └── settings.tsx     # App settings
│   ├── timer.tsx            # Meditation timer
│   ├── new-entry.tsx        # Create journal entry
│   └── customize-questions.tsx
├── components/              # Reusable UI components
├── contexts/                # React Context providers
│   ├── data-context.tsx     # Meditation data management
│   ├── language-context.tsx # i18n support (EN/PT)
│   └── theme-context.tsx    # Dark/light mode
├── constants/               # App configuration
│   ├── data.ts              # Data models and defaults
│   └── theme.ts             # Colors and spacing
├── hooks/                   # Custom React hooks
├── lib/                     # Utility functions
├── assets/                  # Images, icons, sounds
└── __tests__/               # Unit tests
```

---

## 🌍 Localization

Meditary supports:
- 🇺🇸 **English**
- 🇧🇷 **Portuguese (Brazil)**

Language is automatically detected from device settings.

---

## 🤝 Contributing

Contributions are welcome! This project was built to serve the meditation community.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Meditation Community**: For inspiring this project
- **Expo Team**: For the excellent React Native framework

---

## 📧 Contact

**Diego Mariano** - [@diegom4riano](https://github.com/diegom4riano) - diegocampos.br@gmail.com

**Project Link**: [https://github.com/diegom4riano/meditary](https://github.com/diegom4riano/meditary)

---

<div align="center">

**Built with ❤️ for the meditation community**

*May your practice be consistent and intense, and may your mind and spirit find the peace of the Self.* 🧘‍♂️


</div>