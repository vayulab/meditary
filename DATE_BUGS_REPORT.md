# Date Bugs Report - Meditary

## Problem
Dates are showing as "yesterday" instead of "today" due to timezone conversion issues with `new Date()`.

## Root Cause
When using `new Date(dateString)` where dateString is in format "YYYY-MM-DD", JavaScript interprets it as UTC midnight, which causes timezone offset issues.

Example: "2024-12-20" at GMT-3 becomes December 19, 21:00 local time.

## Bugs Found

### 1. **app/entry-detail.tsx** - Line 69
```typescript
const date = new Date(dateStr); // BUG: interprets as UTC
```
**Fix:** Use `parseLocalDate(dateStr)` instead

### 2. **components/entry-card.tsx** - Line 28-29
```typescript
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr); // BUG: interprets as UTC
```
**Fix:** Use `parseLocalDate(dateStr)` instead

## Already Fixed
- ✅ app/(tabs)/index.tsx - Uses `getLocalDateString()`
- ✅ app/(tabs)/progress.tsx - Uses `parseLocalDate()`  
- ✅ app/(tabs)/history.tsx - Uses `parseLocalDate()` for entry date (line 104)
- ✅ app/new-entry.tsx - Uses `getLocalDateString()`
- ✅ app/timer.tsx - Uses `getLocalDateString()`

## Solution
Replace all `new Date(entry.date)` or `new Date(session.date)` with `parseLocalDate()` helper function from `/lib/date-utils.ts`.
