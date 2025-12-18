# Meditary - Design Document

## App Overview
Meditary is a meditation diary app for iOS that helps users track their daily meditation practice through customizable questions. The app supports English and Portuguese (Brazil) languages and collects device identification for usage analytics.

---

## Screen List

### 1. Home Screen
The main dashboard showing today's meditation status and quick access to log a new entry.

### 2. New Entry Screen
A form-based screen with customizable questions for logging meditation sessions.

### 3. History Screen
A list/calendar view of past meditation entries with the ability to view details.

### 4. Entry Detail Screen
View and edit a specific meditation entry.

### 5. Settings Screen
Language selection, question customization, and app information.

### 6. Customize Questions Screen
Add, edit, reorder, and delete meditation questions.

---

## Primary Content and Functionality

### Home Screen
- **Header**: App logo, current date, language toggle (EN/PT-BR)
- **Today's Status Card**: Shows if meditation was logged today with a summary
- **Quick Stats**: Streak counter, total entries this month
- **Primary CTA Button**: "Log Today's Meditation" (bottom thumb zone)
- **Recent Entries Preview**: Last 3 entries as compact cards

### New Entry Screen
- **Header**: "New Entry" title with close button
- **Date/Time Picker**: Defaults to now, can be adjusted
- **Questions List**: Scrollable list of questions with various input types:
  - Rating scale (1-5 or emoji-based)
  - Text input for open questions
  - Single/multi-select options
- **Save Button**: Fixed at bottom in thumb zone

### History Screen
- **Month Navigation**: Previous/Next month arrows
- **Calendar View**: Grid showing days with meditation entries highlighted
- **List Toggle**: Switch between calendar and list view
- **Entry Cards**: Date, brief summary, tap to view details

### Entry Detail Screen
- **Header**: Date of entry with edit/delete actions
- **Questions & Answers**: All questions with recorded responses
- **Notes Section**: Any additional notes
- **Edit Button**: Bottom action to modify entry

### Settings Screen
- **Language Section**: Toggle between English and Portuguese
- **Questions Section**: Link to customize questions
- **Data Section**: Export data option
- **About Section**: App version, device ID display

### Customize Questions Screen
- **Questions List**: Draggable list of all questions
- **Add Question Button**: Create new custom question
- **Question Editor**: Edit question text, type, and options
- **Reset to Default**: Restore original questions

---

## Key User Flows

### Flow 1: Log Daily Meditation
1. User opens app → Home screen
2. Taps "Log Today's Meditation" button
3. New Entry screen appears with questions
4. User answers each question (scroll through)
5. Taps "Save" button
6. Success feedback → Returns to Home with updated status

### Flow 2: View Past Entry
1. User taps History tab
2. Calendar view shows marked days
3. User taps a highlighted day
4. Entry Detail screen shows all responses
5. User can tap "Edit" to modify or "Back" to return

### Flow 3: Customize Questions
1. User goes to Settings tab
2. Taps "Customize Questions"
3. Sees list of current questions
4. Can drag to reorder, tap to edit, swipe to delete
5. Taps "+" to add new question
6. Changes auto-save

### Flow 4: Change Language
1. User goes to Settings tab
2. Taps language selector
3. Selects English or Português
4. App immediately updates all text

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
- **Elevated Surface**: `#FFFFFF` with shadow

### Dark Mode
- **Background**: `#0F0F1A` (Deep navy black)
- **Card Surface**: `#1A1A2E` (Dark navy)
- **Primary Text**: `#F8F9FC` (Off-white)
- **Secondary Text**: `#9CA3AF` (Muted gray)

### Semantic Colors
- **Success**: `#10B981` (Green - for saved/completed)
- **Warning**: `#F59E0B` (Amber)
- **Error**: `#EF4444` (Red)

---

## Typography

- **Title**: 32pt, Bold (Screen titles)
- **Subtitle**: 20pt, SemiBold (Section headers)
- **Body**: 16pt, Regular (Main content)
- **Caption**: 14pt, Regular (Secondary info)
- **Small**: 12pt, Regular (Timestamps, hints)

---

## Component Specifications

### Tab Bar
- 4 tabs: Home, New Entry, History, Settings
- Icons: 24pt, filled style
- Active state: Primary accent color
- Inactive state: Gray icon

### Cards
- Border radius: 16pt
- Padding: 16pt
- Shadow: subtle (0, 2, 8, rgba(0,0,0,0.08))

### Buttons
- Primary: Filled with primary accent, 12pt radius, 48pt height
- Secondary: Outlined, 12pt radius, 48pt height
- Touch target: minimum 44pt

### Input Fields
- Border radius: 12pt
- Height: 48pt
- Border: 1pt, light gray
- Focus state: Primary accent border

### Rating Scale
- 5 circles/stars in a row
- Tap to select rating
- Selected: Primary accent fill
- Unselected: Light gray outline

---

## Default Questions (Bilingual)

| # | English | Português |
|---|---------|-----------|
| 1 | How was my concentration? | Minha concentração estava? |
| 2 | Any physical pain? | Alguma dor física? |
| 3 | How were my eyes? | Olhos estavam? |
| 4 | What sensation emerged? | Qual foi sensação que emergiu? |
| 5 | Many thoughts during? | Muitos pensamentos durante? |
| 6 | Did I feel sleepy? | Deu sono? |
| 7 | What did I hear? | O que escutei? |
| 8 | What did I notice in pranayama? | O que percebi no pranayama? |
| 9 | How was the kechari mudra? | Como foi o kechari mudra? |
| 10 | How was the yoni mudra? | Como foi o yoni mudra? |

---

## Device Identification

- Use `expo-application` to get device ID
- Store device ID locally with AsyncStorage
- Send device ID with each entry save (for analytics)
- Display device ID in Settings for user reference

---

## Data Structure

### MeditationEntry
```typescript
interface MeditationEntry {
  id: string;
  date: string; // ISO date
  timestamp: number;
  deviceId: string;
  answers: {
    questionId: string;
    value: string | number;
  }[];
  notes?: string;
}
```

### Question
```typescript
interface Question {
  id: string;
  textEn: string;
  textPt: string;
  type: 'rating' | 'text' | 'select';
  options?: { en: string; pt: string }[];
  isDefault: boolean;
  order: number;
}
```

---

## Spacing System (8pt grid)

- xs: 4pt
- sm: 8pt
- md: 16pt
- lg: 24pt
- xl: 32pt
- xxl: 48pt
