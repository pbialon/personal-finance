import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getFinancialMonthStartDay } from '@/lib/settings';
import { addFinancialMonths, getFinancialMonthBoundaries } from '@/lib/utils';
import {
  detectSubscriptions,
  calculateMonthlyTotal,
  getUpcomingPayments,
  type DetectedSubscription,
} from '@/lib/subscription-detector';

export async function GET() {
  const supabase = await createClient();
  const financialStartDay = await getFinancialMonthStartDay();
  const isFinancialMonth = financialStartDay !== 1;
  const now = new Date();

  // Get transactions from last 12 financial months for pattern detection
  const currentFinancialMonth = getFinancialMonthBoundaries(now, financialStartDay);
  const twelveMonthsAgoDate = addFinancialMonths(now, -12, financialStartDay);
  const twelveMonthsAgoBoundaries = getFinancialMonthBoundaries(twelveMonthsAgoDate, financialStartDay);
  const startDate = twelveMonthsAgoBoundaries.start;

  const { data: transactions, error } = await supabase
    .from('transactions')
    .select(`
      id,
      amount,
      transaction_date,
      counterparty_name,
      display_name,
      raw_description,
      is_income,
      is_ignored,
      category_id,
      merchant_id,
      category:categories(id, name, color),
      merchant:merchants(id, name, display_name)
    `)
    .gte('transaction_date', startDate)
    .eq('is_income', false)
    .eq('is_ignored', false)
    .order('transaction_date', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Transform transactions to match expected format
  const formattedTransactions = (transactions || []).map((t) => ({
    ...t,
    category: (Array.isArray(t.category) ? t.category[0] : t.category) as { id: string; name: string; color: string } | null,
    merchant: (Array.isArray(t.merchant) ? t.merchant[0] : t.merchant) as { id: string; name: string; display_name: string } | null,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subscriptions = detectSubscriptions(formattedTransactions as any);
  const totalMonthly = calculateMonthlyTotal(subscriptions);
  const upcomingPayments = getUpcomingPayments(subscriptions, 30);

  return NextResponse.json({
    subscriptions,
    totalMonthly: Math.round(totalMonthly * 100) / 100,
    upcomingPayments,
    meta: {
      isFinancialMonth,
      financialStartDay,
      periodStart: startDate,
      periodEnd: currentFinancialMonth.end,
    },
  });
}
