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
