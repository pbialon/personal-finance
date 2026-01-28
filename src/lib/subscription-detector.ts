import type { Transaction } from '@/types';

export type SubscriptionFrequency = 'weekly' | 'monthly' | 'quarterly' | 'annual';

export interface DetectedSubscription {
  merchantId: string | null;
  merchantName: string;
  frequency: SubscriptionFrequency;
  amount: number;
  confidence: number;
  lastPayment: string;
  nextPayment: string;
  transactionCount: number;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
}

// Known subscription services for higher confidence
const KNOWN_SUBSCRIPTIONS = new Set([
  'netflix',
  'spotify',
  'youtube',
  'hbo',
  'disney',
  'amazon prime',
  'apple',
  'google',
  'microsoft',
  'adobe',
  'dropbox',
  'notion',
  'figma',
  'github',
  'linkedin',
  'tidal',
  'audible',
  'medium',
  'patreon',
  'chatgpt',
  'openai',
  'anthropic',
]);

interface TransactionGroup {
  merchantId: string | null;
  merchantName: string;
  transactions: Transaction[];
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
}

function getIntervalDays(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return Math.abs(Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
}

function detectFrequency(avgInterval: number): SubscriptionFrequency | null {
  if (avgInterval >= 6 && avgInterval <= 8) return 'weekly';
  if (avgInterval >= 28 && avgInterval <= 35) return 'monthly';
  if (avgInterval >= 85 && avgInterval <= 100) return 'quarterly';
  if (avgInterval >= 350 && avgInterval <= 380) return 'annual';
  return null;
}

function calculateCoefficientOfVariation(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  if (mean === 0) return 0;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  return stdDev / mean;
}

function isAmountConsistent(amounts: number[]): boolean {
  if (amounts.length < 2) return true;
  const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  return amounts.every((a) => Math.abs(a - avgAmount) / avgAmount <= 0.05);
}

function isKnownSubscription(merchantName: string): boolean {
  const normalized = merchantName.toLowerCase();
  return Array.from(KNOWN_SUBSCRIPTIONS).some((name) => normalized.includes(name));
}

function predictNextPayment(lastPayment: string, frequency: SubscriptionFrequency): string {
  const date = new Date(lastPayment);

  switch (frequency) {
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'quarterly':
      date.setMonth(date.getMonth() + 3);
      break;
    case 'annual':
      date.setFullYear(date.getFullYear() + 1);
      break;
  }

  return date.toISOString().split('T')[0];
}

function getDaysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function detectSubscriptions(transactions: Transaction[]): DetectedSubscription[] {
  // Group transactions by merchant
  const groups = new Map<string, TransactionGroup>();

  transactions.forEach((t) => {
    // Only consider expenses
    if (t.is_income || t.is_ignored) return;

    const key = t.merchant_id || t.counterparty_name || t.raw_description || 'unknown';
    const merchantName =
      t.merchant?.display_name ||
      t.merchant?.name ||
      t.counterparty_name ||
      t.display_name ||
      t.raw_description ||
      'Nieznany';

    if (!groups.has(key)) {
      groups.set(key, {
        merchantId: t.merchant_id,
        merchantName,
        transactions: [],
        categoryId: t.category_id,
        categoryName: t.category?.name || null,
        categoryColor: t.category?.color || null,
      });
    }

    groups.get(key)!.transactions.push(t);
  });

  const detected: DetectedSubscription[] = [];

  groups.forEach((group) => {
    // Need at least 3 transactions to detect a pattern
    if (group.transactions.length < 3) return;

    // Sort by date
    const sorted = [...group.transactions].sort(
      (a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
    );

    // Calculate intervals
    const intervals: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      intervals.push(getIntervalDays(sorted[i - 1].transaction_date, sorted[i].transaction_date));
    }

    if (intervals.length === 0) return;

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const frequency = detectFrequency(avgInterval);

    if (!frequency) return;

    // Calculate confidence score
    let confidence = 0;

    // Amount consistency: +0.3
    const amounts = sorted.map((t) => t.amount);
    if (isAmountConsistent(amounts)) {
      confidence += 0.3;
    }

    // Interval regularity: +0.3
    const intervalCV = calculateCoefficientOfVariation(intervals);
    if (intervalCV < 0.15) {
      confidence += 0.3;
    } else if (intervalCV < 0.25) {
      confidence += 0.15;
    }

    // Known subscription: +0.2
    if (isKnownSubscription(group.merchantName)) {
      confidence += 0.2;
    }

    // Category is "Subskrypcje": +0.2
    if (group.categoryName?.toLowerCase().includes('subskrypcj')) {
      confidence += 0.2;
    }

    // Transaction count bonus: up to +0.1
    confidence += Math.min(0.1, group.transactions.length * 0.02);

    // Filter by minimum confidence
    if (confidence < 0.5) return;

    const lastPayment = sorted[sorted.length - 1].transaction_date;
    const nextPayment = predictNextPayment(lastPayment, frequency);
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;

    detected.push({
      merchantId: group.merchantId,
      merchantName: group.merchantName,
      frequency,
      amount: Math.round(avgAmount * 100) / 100,
      confidence: Math.round(confidence * 100) / 100,
      lastPayment,
      nextPayment,
      transactionCount: group.transactions.length,
      categoryId: group.categoryId,
      categoryName: group.categoryName,
      categoryColor: group.categoryColor,
    });
  });

  // Sort by next payment date
  return detected.sort((a, b) => getDaysUntil(a.nextPayment) - getDaysUntil(b.nextPayment));
}

export function calculateMonthlyTotal(subscriptions: DetectedSubscription[]): number {
  return subscriptions.reduce((total, sub) => {
    switch (sub.frequency) {
      case 'weekly':
        return total + sub.amount * 4.33;
      case 'monthly':
        return total + sub.amount;
      case 'quarterly':
        return total + sub.amount / 3;
      case 'annual':
        return total + sub.amount / 12;
      default:
        return total;
    }
  }, 0);
}

export function getUpcomingPayments(
  subscriptions: DetectedSubscription[],
  daysAhead: number = 30
): { date: string; merchantName: string; amount: number }[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return subscriptions
    .filter((sub) => {
      const daysUntil = getDaysUntil(sub.nextPayment);
      return daysUntil >= 0 && daysUntil <= daysAhead;
    })
    .map((sub) => ({
      date: sub.nextPayment,
      merchantName: sub.merchantName,
      amount: sub.amount,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function getDaysUntilPayment(dateStr: string): number {
  return getDaysUntil(dateStr);
}
