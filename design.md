# Meditary - Design Document

## App Overview
Meditary is a meditation diary app for iOS that helps users track their daily meditation practice through customizable questions. The app supports English and Portuguese (Brazil) languages and collects device identification for usage analytics.

---

## Screen List

### 1. Home Screen
The main dashboard showing today's meditation status and quick access to log a new entry or start the timer.

### 2. New Entry Screen
A form-based screen with customizable questions for logging meditation sessions. Accessed via button on Home or after completing a Timer session.

### 3. Progress Screen
Statistics and charts showing meditation frequency and focus trends over time (week/month/year).

### 4. History Screen
A calendar/list view of past meditation entries with the ability to view details.

### 5. Entry Detail Screen
View and edit a specific meditation entry.

### 6. Settings Screen
Language selection, question customization, reminders, and app information.

### 7. Customize Questions Screen
Add, edit, reorder, and delete meditation questions.

### 8. Timer Screen
Meditation countdown timer with sound presets, interval gong, and session tracking.

### 9. Reminders Screen
Configure daily push notification reminders for meditation practice.

---

## Primary Content and Functionality

### Home Screen
- **Header**: App lotus icon (top right), current date with greeting (morning/afternoon/evening)
- **Today's Status Card**: Shows if meditation was logged today; streak counter and total entries this month in a two-column stat row
- **Primary CTA Buttons**: "Log Today's Meditation" button (fills remaining width) + Timer shortcut button side by side
- **Recent Entries Preview**: Last 3 entries as compact cards; empty state if none

### New Entry Screen
- **Header**: "New Entry" title with close (X) button; no date/time picker (defaults to today, non-editable)
- **Date Display**: Read-only date row with calendar icon
- **Questions List**: Scrollable list of questions rendered via `QuestionCard` component with three input types:
  - Rating scale (1–5 circles)
  - Text input (open text)
  - Yes/No toggle
- **Notes Section**: Multiline text input at the bottom
- **Save Button**: Fixed at bottom (KeyboardAvoidingView), shows "Saving…" while in progress

### Progress Screen
- **Title**: "Progress" / "Progresso"
- **Time Range Selector**: Segmented control — Week / Month / Year
- **Stats Cards (2 rows of 2)**:
  - Row 1: Day streak, Total meditations in period
  - Row 2: Total time (minutes or h + min), Average focus score
- **Meditation Frequency Bar Chart**: SVG bar chart, data aggregated by day/week/month depending on range
- **Focus Avg Trend Line Chart**: SVG line chart tracking average concentration rating over the same period
- **Empty State**: Shown when no data exists for the selected period

### History Screen
- **Header**: "History" / "Histórico" title + calendar/list toggle (icon buttons)
- **Month Navigation**: Previous/Next month arrows with month-year label
- **Calendar View**: 7-column grid; days with entries highlighted in primary accent color; today shows accent border
- **List Toggle**: Switch between calendar and list view
- **Entry Cards**: Tapping a highlighted day navigates to entry detail; multiple entries on same day shows an alert with selection

### Entry Detail Screen
- **Header**: Date of entry with edit/delete actions
- **Questions & Answers**: All questions with recorded responses
- **Notes Section**: Any additional notes
- **Edit Button**: Bottom action to modify entry

### Settings Screen
- **Language Section**: Toggle between English (🇺🇸) and Português (🇧🇷) with checkmark indicator
- **Reminders Section**: Link to Daily Reminders screen
- **Questions Section**: Link to Customize Questions screen
- **About Section**: App version and device ID (truncated to 12 chars + "…")
- **No "Export data" option** (not implemented)

### Customize Questions Screen
- **Header**: Title + "Reset" button (top right) + back button (top left)
- **Hint text**: "Press and hold to drag and reorder"
- **Questions List**: Draggable list (react-native-draggable-flatlist); long-press to drag, tap to edit, trash icon to delete
- **Add Question Button**: Dashed-border button at list bottom
- **Question Editor**: Modal (pageSheet) with fields for English text, Portuguese text, and answer type selector (Rating / Text / Yes/No)
- **Reset to Default**: Alert confirmation before restoring original questions

### Timer Screen
- **Header**: Back button + "Meditation Timer" title
- **Timer Circle**: SVG progress ring (240×240) with animated breathing pulse (scale 1→1.15) while running; countdown display (MM:SS) inside
- **Duration Presets**: 10, 20, 30, 40, 50, 60 min chips + custom duration input (1–120 min, persisted to AsyncStorage)
- **Interval Gong Presets**: Off, 5, 10, 15, 20, 30 min
- **Gong Sound Selector**: Notification Bell / Tibetan Bowl (E♭) / Zen Bowl (Long Stroke); tapping plays preview
- **Controls (not running)**: Single "Start" button; plays start bell on tap
- **Controls (running)**: Stop button (red) + Pause/Resume button
- **Stop behavior**: If ≥10 min elapsed, offers "Just Save" / "Save & Log" / "Don't Save"; if <10 min, confirms stop only
- **Completion**: Plays end bell, saves session, alert offers "Log Entry" or "Close"
- **Tips card**: Instructional text shown when timer is not running
- **Screen stays awake**: `expo-keep-awake` active during use

---

## Key User Flows

### Flow 1: Log Daily Meditation
1. User opens app → Home screen
2. Taps "Log Today's Meditation" button
3. New Entry screen appears with questions
4. User answers each question (scroll through), adds optional notes
5. Taps "Save" button
6. Success alert → Returns to Home with updated status

### Flow 2: Meditate with Timer then Log
1. User taps Timer icon button on Home
2. Timer screen: selects duration, optional interval gong, gong sound
3. Taps "Start" → bell rings, countdown begins with breathing animation
4. On completion: bell rings, session saved, alert appears
5. User taps "Log Entry" → New Entry screen pre-filled with today's date
6. Saves entry; session marked as `hasEntry: true`

### Flow 3: View Past Entry
1. User taps History tab
2. Calendar view shows marked days
3. User taps a highlighted day
4. Entry Detail screen shows all responses (or alert if multiple entries that day)
5. User can tap "Edit" to modify or "Back" to return

### Flow 4: View Progress
1. User taps Progress tab
2. Sees stats cards and charts for current week by default
3. Switches between Week / Month / Year with segmented control
4. Charts update to reflect the selected period

### Flow 5: Customize Questions
1. User goes to Settings tab
2. Taps "Customize Questions"
3. Sees list of current questions with drag handles
4. Long-press to drag and reorder; tap to edit; tap trash to delete
5. Taps "+" dashed button to add new question (bilingual text + type)
6. Changes auto-save; "Reset" button restores defaults

### Flow 6: Change Language
1. User goes to Settings tab
2. Taps language selector (EN or PT-BR)
3. App immediately updates all text

---

## Color Choices

### Primary Palette
- **Primary Accent**: `#6B4EFF` (Deep violet - represents spirituality and meditation)
- **Secondary Accent**: `#00C9A7` (Teal - represents calm and balance)

### Text Colors
- **Primary Text**: `#1A1A2E` (Dark navy - high contrast)
- **Secondary Text**: `#6B7280` (Gray - for subtitles and hints)
- **Disabled Text**: `#9CA3AF` (Light gray)

### Surface Colors
- **Background**: `#F8F9FC` (Off-white with slight blue tint)
- **Card Surface**: `#FFFFFF` (Pure white)
- **Border**: `#E5E7EB`

### Dark Mode
- **Background**: `#0F0F1A` (Deep navy black)
- **Card Surface**: `#1A1A2E` (Dark navy)
- **Primary Text**: `#F8F9FC` (Off-white)
- **Secondary Text**: `#9CA3AF` (Muted gray)
- **Border**: `#2D2D44`
- **Primary Accent (dark)**: `#8B7AFF` (lighter violet for contrast)
- **Secondary Accent (dark)**: `#00E5BE`

### Semantic Colors
- **Success**: `#10B981` (Green - for saved/completed)
- **Warning**: `#F59E0B` (Amber)
- **Error**: `#EF4444` (Red)

---

## Typography

- **Title**: 28–32pt, Bold (Screen titles)
- **Subtitle**: 20pt, SemiBold (Section headers)
- **Body**: 16pt, Regular (Main content)
- **Caption**: 14pt, Regular (Secondary info)
- **Small**: 12pt, Regular (Timestamps, hints)

---

## Component Specifications

### Tab Bar
- 4 tabs: Home, Progress, History, Settings
- Icons: 28pt, filled style
- Active state: Primary accent color
- Inactive state: `#9CA3AF` (light gray)

### Cards
- Border radius: 16pt (`BorderRadius.lg`)
- Padding: 16pt (`Spacing.md`)
- Shadow: subtle (0, 2, 8, rgba(0,0,0,0.08))

### Buttons
- Primary: Filled with primary accent, 12pt radius (`BorderRadius.md`), `Spacing.md` vertical padding
- Touch target: minimum 44pt

### Input Fields
- Border radius: 12pt (`BorderRadius.md`) or 16pt (`BorderRadius.lg`) for notes
- Border: 1pt, `#E5E7EB`
- Focus state: Primary accent border

### Rating Scale
- 5 circles in a row
- Tap to select rating
- Selected: Primary accent fill
- Unselected: Light gray outline

### Yes/No Toggle
- Two-option toggle (Yes / No)
- Selected: Primary accent background
- Unselected: Surface background

---

## Default Questions (Bilingual)

| # | English | Português | Type |
|---|---------|-----------|------|
| 1 | How was my concentration? | Minha concentração estava? | rating |
| 2 | Any physical pain? | Alguma dor física? | text |
| 3 | How were my eyes? | Olhos estavam? | text |
| 4 | What sensation emerged? | Qual foi sensação que emergiu? | text |
| 5 | Many thoughts during? | Muitos pensamentos durante? | yesno |
| 6 | Did I feel sleepy? | Deu sono? | yesno |
| 7 | What did I hear? | O que escutei? | text |
| 8 | What did I notice in pranayama? | O que percebi no pranayama? | text |
| 9 | How was the kechari mudra? | Como foi o kechari mudra? | text |
| 10 | How was the yoni mudra? | Como foi o yoni mudra? | text |

---

## Device Identification

- Use `expo-application` to get device ID
- Store device ID locally with AsyncStorage (`@meditary/deviceId`)
- Send device ID with each entry save (for analytics)
- Display truncated device ID in Settings (first 12 chars + "…")

---

## Data Structures

### MeditationEntry
```typescript
interface MeditationEntry {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  timestamp: number;
  deviceId: string;
  answers: Answer[];
  notes?: string;
  durationMinutes?: number; // Duration from timer, if applicable
}
```

### Answer
```typescript
interface Answer {
  questionId: string;
  value: string | number;
}
```

### Question
```typescript
interface Question {
  id: string;
  textEn: string;
  textPt: string;
  type: 'rating' | 'text' | 'yesno';
  isDefault: boolean;
  order: number;
}
```

### MeditationSession
```typescript
interface MeditationSession {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  timestamp: number;
  deviceId: string;
  durationMinutes: number;
  hasEntry: boolean; // Whether user also logged a diary entry
}
```

### AppSettings
```typescript
interface AppSettings {
  language: 'en' | 'pt';
  deviceId: string;
}
```

---

## Storage Keys (AsyncStorage)

```
@meditary/entries
@meditary/questions
@meditary/settings
@meditary/deviceId
@meditary/sessions
@meditary/gongSound
@meditary/customDuration
```

---

## Spacing System (8pt grid)

- xs: 4pt
- sm: 8pt
- md: 16pt
- lg: 24pt
- xl: 32pt
- xxl: 48pt

---

## Border Radius

- sm: 8pt
- md: 12pt
- lg: 16pt
- xl: 24pt
