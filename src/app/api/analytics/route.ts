import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getFirstDayOfMonth, getLastDayOfMonth, addMonths, calculatePercentageChange } from '@/lib/utils';
import type { MonthlyStats, CategorySpending, MonthlyTrend, BudgetProgress } from '@/types';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const monthParam = searchParams.get('month');

  const month = monthParam ? new Date(monthParam) : new Date();
  const startDate = getFirstDayOfMonth(month);
  const endDate = getLastDayOfMonth(month);

  const prevMonth = addMonths(month, -1);
  const prevStartDate = getFirstDayOfMonth(prevMonth);
  const prevEndDate = getLastDayOfMonth(prevMonth);

  if (type === 'stats') {
    const [currentData, prevData, savingsCategories] = await Promise.all([
      supabase
        .from('transactions')
        .select('amount, is_income, category_id')
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate)
        .eq('is_ignored', false),
      supabase
        .from('transactions')
        .select('amount, is_income, category_id')
        .gte('transaction_date', prevStartDate)
        .lte('transaction_date', prevEndDate)
        .eq('is_ignored', false),
      supabase
        .from('categories')
        .select('id')
        .eq('is_savings', true),
    ]);

    const savingsIds = new Set(savingsCategories.data?.map(c => c.id) || []);

    const calcStats = (transactions: typeof currentData.data) => {
      let income = 0;
      let expenses = 0;
      let savings = 0;

      (transactions || []).forEach((t) => {
        if (savingsIds.has(t.category_id)) {
          savings += t.amount;
        } else if (t.is_income) {
          income += t.amount;
        } else {
          expenses += t.amount;
        }
      });

      return { income, expenses, savings };
    };

    const current = calcStats(currentData.data);
    const prev = calcStats(prevData.data);

    const stats: MonthlyStats = {
      income: current.income,
      expenses: current.expenses,
      savings: current.savings,
      incomeChange: calculatePercentageChange(current.income, prev.income),
      expensesChange: calculatePercentageChange(current.expenses, prev.expenses),
      savingsChange: calculatePercentageChange(current.savings, prev.savings),
    };

    return NextResponse.json(stats);
  }

  if (type === 'category-spending') {
    const { data: transactions } = await supabase
      .from('transactions')
      .select('amount, category_id, categories(id, name, color)')
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate)
      .eq('is_income', false)
      .eq('is_ignored', false);

    const { data: savingsCategories } = await supabase
      .from('categories')
      .select('id')
      .eq('is_savings', true);

    const savingsIds = new Set(savingsCategories?.map(c => c.id) || []);

    const categoryTotals: Record<string, { amount: number; name: string; color: string }> = {};
    let total = 0;

    (transactions || []).forEach((t) => {
      if (savingsIds.has(t.category_id)) return;

      const cat = t.categories as unknown as { id: string; name: string; color: string } | null;
      const catId = t.category_id || 'uncategorized';
      const catName = cat?.name || 'Bez kategorii';
      const catColor = cat?.color || '#6b7280';

      if (!categoryTotals[catId]) {
        categoryTotals[catId] = { amount: 0, name: catName, color: catColor };
      }
      categoryTotals[catId].amount += t.amount;
      total += t.amount;
    });

    const spending: CategorySpending[] = Object.entries(categoryTotals)
      .map(([categoryId, data]) => ({
        categoryId,
        categoryName: data.name,
        categoryColor: data.color,
        amount: data.amount,
        percentage: total > 0 ? Math.round((data.amount / total) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    return NextResponse.json(spending);
  }

  if (type === 'trends') {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const m = addMonths(month, -i);
      months.push({
        date: m,
        start: getFirstDayOfMonth(m),
        end: getLastDayOfMonth(m),
        label: m.toLocaleDateString('pl-PL', { month: 'short' }),
      });
    }

    const { data: savingsCategories } = await supabase
      .from('categories')
      .select('id')
      .eq('is_savings', true);

    const savingsIds = new Set(savingsCategories?.map(c => c.id) || []);

    const trends: MonthlyTrend[] = await Promise.all(
      months.map(async (m) => {
        const { data } = await supabase
          .from('transactions')
          .select('amount, is_income, category_id')
          .gte('transaction_date', m.start)
          .lte('transaction_date', m.end)
          .eq('is_ignored', false);

        let income = 0;
        let expenses = 0;
        let savings = 0;

        (data || []).forEach((t) => {
          if (savingsIds.has(t.category_id)) {
            savings += t.amount;
          } else if (t.is_income) {
            income += t.amount;
          } else {
            expenses += t.amount;
          }
        });

        return {
          month: m.label,
          income,
          expenses,
          savings,
        };
      })
    );

    return NextResponse.json(trends);
  }

  if (type === 'budget-progress') {
    const [budgetsRes, transactionsRes] = await Promise.all([
      supabase
        .from('budgets')
        .select('*, category:categories(*)')
        .eq('month', startDate)
        .eq('is_income', false),
      supabase
        .from('transactions')
        .select('amount, category_id')
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate)
        .eq('is_income', false)
        .eq('is_ignored', false),
    ]);

    const spending: Record<string, number> = {};
    (transactionsRes.data || []).forEach((t) => {
      const catId = t.category_id || 'total';
      spending[catId] = (spending[catId] || 0) + t.amount;
    });

    const progress: BudgetProgress[] = (budgetsRes.data || []).map((b) => {
      const cat = b.category as { id: string; name: string; color: string } | null;
      const actual = spending[b.category_id || 'total'] || 0;
      return {
        categoryId: b.category_id || 'total',
        categoryName: cat?.name || 'Ogółem',
        categoryColor: cat?.color || '#3b82f6',
        planned: b.planned_amount,
        actual,
        percentage: b.planned_amount > 0 ? Math.round((actual / b.planned_amount) * 100) : 0,
      };
    });

    return NextResponse.json(progress);
  }

  return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
}
