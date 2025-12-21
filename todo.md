# Meditary - Project TODO

## Core Features
- [x] Custom theme with meditation-focused colors (violet/teal)
- [x] Internationalization system (EN/PT-BR)
- [x] AsyncStorage data persistence
- [x] Device ID collection for analytics

## Screens
- [x] Home screen with today's status and quick stats
- [x] New Entry screen with customizable questions
- [x] History screen with calendar/list view
- [x] Entry Detail screen for viewing/editing entries
- [x] Settings screen with language and customization
- [x] Customize Questions screen

## Components
- [x] Rating scale component (1-5)
- [x] Question card component
- [x] Entry card component
- [x] Calendar component for history
- [x] Language toggle component

## Data & Storage
- [x] MeditationEntry data model
- [x] Question data model with defaults
- [x] Custom hooks for data management
- [x] Device ID retrieval and storage

## Branding
- [x] Generate custom app logo
- [x] Update app.config.ts with branding
- [x] Configure splash screen

## Polish
- [x] Haptic feedback on interactions
- [x] Smooth animations
- [x] Empty states for no entries
- [x] Success feedback on save

## New Features (v1.1)
- [x] Daily reminder notifications with customizable time
- [x] Progress charts screen with weekly/monthly visualizations
- [x] Meditation timer with bell sounds
- [x] Multiple logo/theme options based on iOS 26 Liquid Glass colors
- [x] Theme selector in settings

## iOS 26 Inspired Logo Colors
- [x] Clear/Glass (translucent white/silver)
- [x] Tinted Blue (ocean/sky blue)
- [x] Tinted Purple (lavender/violet)
- [x] Tinted Green (mint/sage)
- [x] Tinted Orange (coral/sunset)
- [x] Tinted Pink (rose/blush)

## Bug Fixes (v1.2)
- [x] Fix app icon to change according to selected theme
- [x] Fix Meditation Timer layout - title and counter are cut off/hidden

## New Features (v1.2)
- [x] Add interval gong option in timer (every 5, 10, 15, 20, or 30 minutes)

## New Features (v1.3)
- [x] Add real bell/gong audio sounds to timer
- [x] Implement detailed statistics (total time meditated, average concentration, trends)
- [x] Unify history to consider both meditation timer data and diary entries
- [x] Create comprehensive use case documentation
- [x] Develop complete test cases
- [x] Validate app functionality across all scenarios

## Bug Fixes (v1.4)
- [x] Fix splash screen - white background with white text (unreadable)
- [x] Fix meditation entry date - stuck on 18/12, should use current date
- [x] Fix total minutes calculation in progress screen
- [x] Fix app version number in settings
- [x] Fix drag-to-reorder functionality in customize questions

## New Features (v1.4)
- [x] Add ambient sounds to timer (rain, forest, ocean, etc.) with selection option
- [x] Remove export data functionality from settings

## Bug Fixes (v1.5)
- [x] Fix date storage - saving previous day instead of current day (timezone issue)
- [x] Fix calendar to show all events when multiple meditations on same day
- [x] Fix splash screen text color - make it dark/visible
- [x] Remove ambient sounds feature completely
- [x] Add real gong sounds with selection options
- [x] Fix reminders time display - font too large
- [x] Fix app version display - still showing 1.0.0 instead of current version
- [x] Fix theme colors not applying to all button components

## Bug Fixes (v1.5.1)
- [x] Fix history entry date display - showing 1 day before (timezone issue with new Date())
- [x] Fix splash screen - text still appears light/unclear

## Bug Fixes & Changes (v1.6)
- [x] Fix gong sounds not playing - download real gong audio files from internet
- [x] Remove theme selector - fix purple theme throughout entire app
- [x] Fix reminder time display - increase vertical space to show full time

## Bug Fixes (v1.6.1)
- [x] Fix gong sounds not playing when clicking on gong type options
- [x] Fix date showing as yesterday when clicking today's date in calendar
- [x] Fix splash screen white background - change to dark color

## Bug Fixes (v1.6.2)
- [x] Fix gong sound volume - too low even at maximum
- [x] Fix date display bug - still showing yesterday instead of today (complete code scan needed)
- [x] Fix splash screen - still showing white background with unreadable white text

## New Features & Fixes (v1.7)
- [x] Download and integrate authentic Tibetan bell/gong sound recordings
- [x] Fix push notifications to follow selected language (PT-BR/EN)
- [x] Validate total meditation minutes calculation implementation

## Bug Fixes (v1.7.1)
- [x] Fix "Save Entry" button being covered by keyboard on mobile

## Bug Fixes & Updates (v1.8)
- [x] Fix "Save Entry" button still being covered by keyboard (advanced solution needed)
- [x] Replace gong sounds with authentic MP3 files provided by user
- [x] Update gong type labels to match new sound files

## Bug Fixes (v1.8.1)
- [x] Fix "Save Entry" button positioning - too high, should be closer to keyboard
- [x] Add keyboard dismiss gesture - swipe down to close keyboard
- [x] Fix "Progresso" title cutoff - P is being cut at top
- [x] Fix "Histórico" title cutoff - H is being cut at top
- [x] Fix calendar to exclude timer sessions from count (show only diary entries)

## Bug Fixes (v1.8.2)
- [x] Fix "Salvar Registro" button - still too high, large gap between button and keyboard (reduced keyboardVerticalOffset to 50)
- [x] Fix "Progresso" title - P still cut off at top (added paddingTop: 8 and lineHeight: 36)
- [x] Fix "Histórico" title - H still cut off at top (added paddingTop: 8 and lineHeight: 36)

## Bug Fixes (v1.8.4)
- [x] Fix "Ajustes" title cutoff - A is being cut at top (added paddingTop: 8 and lineHeight: 36)
