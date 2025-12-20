/**
 * Date utility functions for consistent local date handling
 * Avoids timezone issues with ISO strings
 */

/**
 * Get current date in YYYY-MM-DD format using local timezone
 * @returns Date string in YYYY-MM-DD format
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format date for display (DD/MM/YYYY)
 * @param dateStr Date string in YYYY-MM-DD format
 * @returns Formatted date string
 */
export function formatDateDisplay(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

/**
 * Parse date string to Date object at midnight local time
 * @param dateStr Date string in YYYY-MM-DD format
 * @returns Date object
 */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Check if two date strings are the same day
 * @param date1 First date string
 * @param date2 Second date string
 * @returns True if same day
 */
export function isSameDay(date1: string, date2: string): boolean {
  return date1 === date2;
}

/**
 * Get date string for yesterday
 * @returns Date string in YYYY-MM-DD format
 */
export function getYesterdayString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return getLocalDateString(yesterday);
}

/**
 * Get date string for tomorrow
 * @returns Date string in YYYY-MM-DD format
 */
export function getTomorrowString(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return getLocalDateString(tomorrow);
}
