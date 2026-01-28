import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = 'PLN'): string {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatShortDate(date: string | Date): string {
  return new Intl.DateTimeFormat('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatMonthYear(date: string | Date): string {
  return new Intl.DateTimeFormat('pl-PL', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}

export function getFirstDayOfMonth(date: Date = new Date()): string {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

export function getLastDayOfMonth(date: Date = new Date()): string {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export function generateExternalId(
  bankTransactionId: string,
  accountId: string,
  bookingDate: string
): string {
  const data = `${bankTransactionId}-${accountId}-${bookingDate}`;
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `${accountId}-${Math.abs(hash).toString(16)}`;
}

export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / Math.abs(previous)) * 100);
}

export function formatRelativeDate(date: string | Date): string {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Reset time for comparison
  const dateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

  if (dateOnly.getTime() === todayOnly.getTime()) {
    return 'Dzisiaj';
  }
  if (dateOnly.getTime() === yesterdayOnly.getTime()) {
    return 'Wczoraj';
  }

  // Check if same week
  const weekStart = new Date(todayOnly);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
  if (dateOnly >= weekStart && dateOnly < todayOnly) {
    return new Intl.DateTimeFormat('pl-PL', { weekday: 'long' }).format(d);
  }

  // Otherwise show full date
  return new Intl.DateTimeFormat('pl-PL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(d);
}

export interface GroupedTransactions<T> {
  date: string;
  label: string;
  transactions: T[];
}

/**
 * Calculates the start and end dates for a financial month.
 * A financial month starts on startDay and ends on startDay-1 of the next calendar month.
 *
 * Example for startDay = 29:
 * - "January 2026" = 29 Dec 2025 - 28 Jan 2026
 * - "February 2026" = 29 Jan 2026 - 28 Feb 2026
 *
 * @param date - A date within the financial month (determines which financial month we're in)
 * @param startDay - The day of month when financial month starts (1-31, default 1)
 * @returns Object with start and end dates as YYYY-MM-DD strings
 */
export function getFinancialMonthBoundaries(
  date: Date = new Date(),
  startDay: number = 1
): { start: string; end: string; label: string } {
  // If startDay is 1, use standard calendar month
  if (startDay === 1) {
    return {
      start: getFirstDayOfMonth(date),
      end: getLastDayOfMonth(date),
      label: formatMonthYear(date),
    };
  }

  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  // Determine which financial month we're in
  // If current day >= startDay, we're in this calendar month's financial period
  // If current day < startDay, we're still in previous calendar month's financial period
  let financialYear: number;
  let financialMonth: number;

  if (day >= startDay) {
    financialYear = year;
    financialMonth = month;
  } else {
    // We're still in previous month's financial period
    const prevDate = new Date(year, month - 1, 1);
    financialYear = prevDate.getFullYear();
    financialMonth = prevDate.getMonth();
  }

  // Calculate start date: startDay of financialMonth (or last day if month has fewer days)
  const startDate = getValidStartDate(financialYear, financialMonth, startDay);

  // Calculate end date: startDay - 1 of next month (or last day if month has fewer days)
  const nextMonth = new Date(financialYear, financialMonth + 1, 1);
  const endDate = getValidEndDate(nextMonth.getFullYear(), nextMonth.getMonth(), startDay);

  // The label shows the "financial month" name - the month that contains most days
  // For startDay >= 15, we use the next calendar month as the label
  const labelDate = new Date(financialYear, financialMonth + 1, 1);

  return {
    start: startDate,
    end: endDate,
    label: formatMonthYear(labelDate),
  };
}

/**
 * Gets a valid start date for a financial month.
 * If the month doesn't have enough days, returns the last day of that month.
 */
function getValidStartDate(year: number, month: number, startDay: number): string {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const day = Math.min(startDay, daysInMonth);
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Gets a valid end date for a financial month (startDay - 1).
 * If the month doesn't have enough days, returns the last day of previous month.
 */
function getValidEndDate(year: number, month: number, startDay: number): string {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const endDay = startDay - 1;

  if (endDay < 1) {
    // End is last day of previous month
    const prevMonth = new Date(year, month, 0);
    return `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}-${String(prevMonth.getDate()).padStart(2, '0')}`;
  }

  const day = Math.min(endDay, daysInMonth);
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Adds financial months to a date, respecting the financial month start day.
 *
 * @param date - The starting date
 * @param months - Number of months to add (can be negative)
 * @param startDay - The financial month start day (1-31, default 1)
 * @returns A new Date representing the same position in the target financial month
 */
export function addFinancialMonths(
  date: Date,
  months: number,
  startDay: number = 1
): Date {
  if (startDay === 1) {
    return addMonths(date, months);
  }

  // Get current financial month boundaries to understand position
  const { start } = getFinancialMonthBoundaries(date, startDay);
  const startDate = new Date(start + 'T00:00:00');

  // Add months to the start date
  const newStart = addMonths(startDate, months);

  // Return the new start date (which represents the financial month)
  return newStart;
}

/**
 * Gets the number of days in a financial month.
 *
 * @param date - A date within the financial month
 * @param startDay - The financial month start day (1-31, default 1)
 * @returns Number of days in the financial month
 */
export function getFinancialMonthDays(
  date: Date,
  startDay: number = 1
): number {
  if (startDay === 1) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }

  const { start, end } = getFinancialMonthBoundaries(date, startDay);
  const startDate = new Date(start + 'T00:00:00');
  const endDate = new Date(end + 'T00:00:00');

  // Calculate difference in days (inclusive)
  const diffTime = endDate.getTime() - startDate.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Gets the current day number within a financial month.
 *
 * @param date - The date to check
 * @param startDay - The financial month start day (1-31, default 1)
 * @returns Day number within the financial month (1-based)
 */
export function getFinancialDayOfMonth(
  date: Date,
  startDay: number = 1
): number {
  if (startDay === 1) {
    return date.getDate();
  }

  const { start } = getFinancialMonthBoundaries(date, startDay);
  const startDate = new Date(start + 'T00:00:00');
  const currentDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  // Calculate difference in days (add 1 for 1-based indexing)
  const diffTime = currentDate.getTime() - startDate.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Formats a financial month's date range for display.
 *
 * @param date - A date within the financial month
 * @param startDay - The financial month start day (1-31, default 1)
 * @returns Formatted string like "29.12.2025 - 28.01.2026"
 */
export function formatFinancialMonthRange(
  date: Date,
  startDay: number = 1
): string {
  const { start, end } = getFinancialMonthBoundaries(date, startDay);
  return `${formatShortDate(start)} - ${formatShortDate(end)}`;
}

export function groupByDate<T extends { transaction_date: string }>(
  transactions: T[]
): GroupedTransactions<T>[] {
  const groups: Map<string, T[]> = new Map();

  for (const transaction of transactions) {
    const date = transaction.transaction_date.split('T')[0];
    if (!groups.has(date)) {
      groups.set(date, []);
    }
    groups.get(date)!.push(transaction);
  }

  // Sort by date descending
  const sortedDates = Array.from(groups.keys()).sort((a, b) => b.localeCompare(a));

  return sortedDates.map((date) => ({
    date,
    label: formatRelativeDate(date),
    transactions: groups.get(date)!,
  }));
}
