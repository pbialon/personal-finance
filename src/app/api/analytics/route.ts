import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getFirstDayOfMonth, getLastDayOfMonth, addMonths, calculatePercentageChange, getFinancialMonthBoundaries, addFinancialMonths, getFinancialMonthDays, getFinancialDayOfMonth } from '@/lib/utils';
import { getFinancialMonthStartDay } from '@/lib/settings';
import { forecastMonthlySpending } from '@/lib/spending-forecast';
import type {
  MonthlyStats,
  CategorySpending,
  MonthlyTrend,
  BudgetProgress,
  FinancialHealthScore,
  SpendingPatterns,
  CategoryAnalysis,
  TopSpenders,
  YearOverview,
} from '@/types';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const monthParam = searchParams.get('month');

  // Get the financial month start day setting
  const financialStartDay = await getFinancialMonthStartDay();

  // Parse as local time (not UTC) by adding T00:00:00
  const month = monthParam ? new Date(monthParam + 'T00:00:00') : new Date();

  // Use financial month boundaries
  const { start: startDate, end: endDate, label: monthLabel } = getFinancialMonthBoundaries(month, financialStartDay);

  // Previous financial month
  const prevMonth = addFinancialMonths(month, -1, financialStartDay);
  const { start: prevStartDate, end: prevEndDate } = getFinancialMonthBoundaries(prevMonth, financialStartDay);

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
      let savingsIn = 0;   // wpłaty NA oszczędności (odkładam)
      let savingsOut = 0;  // wypłaty Z oszczędności (odbieram)

      (transactions || []).forEach((t) => {
        if (savingsIds.has(t.category_id)) {
          if (t.is_income) {
            savingsOut += t.amount;  // zwrot z oszczędności
          } else {
            savingsIn += t.amount;   // wpłata na oszczędności
          }
        } else if (t.is_income) {
          income += t.amount;
        } else {
          expenses += t.amount;
        }
      });

      return {
        income,
        expenses,
        savingsIn,
        savingsOut,
        netSavings: savingsIn - savingsOut,
      };
    };

    const current = calcStats(currentData.data);
    const prev = calcStats(prevData.data);

    const stats: MonthlyStats = {
      income: current.income,
      expenses: current.expenses,
      savingsIn: current.savingsIn,
      savingsOut: current.savingsOut,
      netSavings: current.netSavings,
      incomeChange: calculatePercentageChange(current.income, prev.income),
      expensesChange: calculatePercentageChange(current.expenses, prev.expenses),
      savingsInChange: calculatePercentageChange(current.savingsIn, prev.savingsIn),
      savingsOutChange: calculatePercentageChange(current.savingsOut, prev.savingsOut),
      netSavingsChange: calculatePercentageChange(current.netSavings, prev.netSavings),
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
      const m = addFinancialMonths(month, -i, financialStartDay);
      const { start, end } = getFinancialMonthBoundaries(m, financialStartDay);
      // Format label as short month + year using end date (which is in the "main" month for financial periods)
      const labelDate = new Date(end + 'T00:00:00');
      months.push({
        date: m,
        start,
        end,
        label: labelDate.toLocaleDateString('pl-PL', { month: 'short', year: '2-digit' }),
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
        let savingsIn = 0;
        let savingsOut = 0;

        (data || []).forEach((t) => {
          if (savingsIds.has(t.category_id)) {
            if (t.is_income) {
              savingsOut += t.amount;
            } else {
              savingsIn += t.amount;
            }
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
          savingsIn,
          savingsOut,
          netSavings: savingsIn - savingsOut,
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
      const cat = b.category as { id: string; name: string; color: string; icon: string | null } | null;
      const actual = spending[b.category_id || 'total'] || 0;
      return {
        categoryId: b.category_id || 'total',
        categoryName: cat?.name || 'Ogółem',
        categoryColor: cat?.color || '#3b82f6',
        categoryIcon: cat?.icon || null,
        planned: b.planned_amount,
        actual,
        percentage: b.planned_amount > 0 ? Math.round((actual / b.planned_amount) * 100) : 0,
      };
    });

    return NextResponse.json(progress);
  }

  // New analytics endpoints
  const startDateParam = searchParams.get('startDate');
  const endDateParam = searchParams.get('endDate');

  if (type === 'financial-health' && startDateParam && endDateParam) {
    const [transactionsRes, budgetsRes, savingsCategories] = await Promise.all([
      supabase
        .from('transactions')
        .select('amount, is_income, category_id, transaction_date')
        .gte('transaction_date', startDateParam)
        .lte('transaction_date', endDateParam)
        .eq('is_ignored', false),
      supabase
        .from('budgets')
        .select('planned_amount, category_id')
        .gte('month', startDateParam)
        .lte('month', endDateParam)
        .eq('is_income', false),
      supabase
        .from('categories')
        .select('id')
        .eq('is_savings', true),
    ]);

    const savingsIds = new Set(savingsCategories.data?.map(c => c.id) || []);
    const transactions = transactionsRes.data || [];

    let totalIncome = 0;
    let totalExpenses = 0;
    let totalSavings = 0;
    const monthlyIncomes: Record<string, number> = {};

    transactions.forEach((t) => {
      const monthKey = t.transaction_date.substring(0, 7);
      if (savingsIds.has(t.category_id)) {
        if (!t.is_income) totalSavings += t.amount;
      } else if (t.is_income) {
        totalIncome += t.amount;
        monthlyIncomes[monthKey] = (monthlyIncomes[monthKey] || 0) + t.amount;
      } else {
        totalExpenses += t.amount;
      }
    });

    // Calculate income stability (coefficient of variation)
    const incomeValues = Object.values(monthlyIncomes);
    let incomeStabilityCV = 0;
    if (incomeValues.length > 1) {
      const avgIncome = incomeValues.reduce((a, b) => a + b, 0) / incomeValues.length;
      const variance = incomeValues.reduce((sum, v) => sum + Math.pow(v - avgIncome, 2), 0) / incomeValues.length;
      const stdDev = Math.sqrt(variance);
      incomeStabilityCV = avgIncome > 0 ? (stdDev / avgIncome) * 100 : 0;
    }

    // Calculate budget adherence
    const totalBudgeted = (budgetsRes.data || []).reduce((sum, b) => sum + b.planned_amount, 0);
    const budgetAdherence = totalBudgeted > 0 ? (totalExpenses / totalBudgeted) * 100 : 100;

    // Calculate scores
    const savingsRate = totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0;
    const expenseRatio = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 100;

    const savingsRateScore = Math.min(25, Math.round((savingsRate / 20) * 25));
    const expenseRatioScore = expenseRatio <= 70 ? 25 : Math.max(0, Math.round((1 - (expenseRatio - 70) / 30) * 25));
    const budgetAdherenceScore = budgetAdherence >= 90 && budgetAdherence <= 110 ? 25 : Math.max(0, 25 - Math.abs(budgetAdherence - 100) * 0.5);
    const incomeStabilityScore = Math.max(0, 25 - incomeStabilityCV * 0.5);

    const totalScore = Math.round(savingsRateScore + expenseRatioScore + budgetAdherenceScore + incomeStabilityScore);

    const result: FinancialHealthScore = {
      score: totalScore,
      components: {
        savingsRate: { value: savingsRate, score: savingsRateScore, target: 20 },
        expenseRatio: { value: expenseRatio, score: expenseRatioScore, target: 70 },
        budgetAdherence: { value: budgetAdherence, score: budgetAdherenceScore, target: 100 },
        incomeStability: { value: incomeStabilityCV, score: incomeStabilityScore },
      },
    };

    return NextResponse.json(result);
  }

  if (type === 'spending-patterns' && startDateParam && endDateParam) {
    const [transactionsRes, categoriesRes, savingsCategories] = await Promise.all([
      supabase
        .from('transactions')
        .select('amount, category_id, transaction_date')
        .gte('transaction_date', startDateParam)
        .lte('transaction_date', endDateParam)
        .eq('is_income', false)
        .eq('is_ignored', false),
      supabase
        .from('categories')
        .select('id, name, color, icon')
        .eq('is_savings', false),
      supabase
        .from('categories')
        .select('id')
        .eq('is_savings', true),
    ]);

    const savingsIds = new Set(savingsCategories.data?.map(c => c.id) || []);
    const transactions = (transactionsRes.data || []).filter(t => !savingsIds.has(t.category_id));
    const categoriesMap = new Map((categoriesRes.data || []).map(c => [c.id, c as { id: string; name: string; color: string; icon: string | null }]));

    const DAYS_PL = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];
    const byDayOfWeek: { day: string; amount: number; count: number }[] = DAYS_PL.map((day) => ({
      day,
      amount: 0,
      count: 0,
    }));

    const byDayOfMonth: { day: number; amount: number }[] = Array.from({ length: 31 }, (_, i) => ({
      day: i + 1,
      amount: 0,
    }));

    const categoryHeatmapData: Map<string, { name: string; color: string; icon: string | null; days: number[] }> = new Map();

    let totalAmount = 0;
    const daysWithSpendingSet = new Set<string>();

    transactions.forEach((t) => {
      const date = new Date(t.transaction_date + 'T00:00:00');
      const dayOfWeek = date.getDay();
      const dayOfMonth = date.getDate();

      byDayOfWeek[dayOfWeek].amount += t.amount;
      byDayOfWeek[dayOfWeek].count += 1;
      byDayOfMonth[dayOfMonth - 1].amount += t.amount;

      totalAmount += t.amount;
      daysWithSpendingSet.add(t.transaction_date);

      if (t.category_id) {
        const cat = categoriesMap.get(t.category_id);
        if (cat) {
          if (!categoryHeatmapData.has(t.category_id)) {
            categoryHeatmapData.set(t.category_id, { name: cat.name, color: cat.color, icon: cat.icon, days: [0, 0, 0, 0, 0, 0, 0] });
          }
          categoryHeatmapData.get(t.category_id)!.days[dayOfWeek] += t.amount;
        }
      }
    });

    const daysWithSpending = daysWithSpendingSet.size;
    const averageDaily = daysWithSpending > 0 ? totalAmount / daysWithSpending : 0;

    // Reorder days to start from Monday
    const reorderedDays = [...byDayOfWeek.slice(1), byDayOfWeek[0]];

    const categoryHeatmap = Array.from(categoryHeatmapData.values())
      .map((data) => ({
        category: data.name,
        color: data.color,
        icon: data.icon,
        days: [...data.days.slice(1), data.days[0]], // Monday first
      }))
      .sort((a, b) => b.days.reduce((s, v) => s + v, 0) - a.days.reduce((s, v) => s + v, 0))
      .slice(0, 8);

    const result: SpendingPatterns = {
      byDayOfWeek: reorderedDays,
      byDayOfMonth,
      categoryHeatmap,
      totalAmount,
      averageDaily,
      daysWithSpending,
    };

    return NextResponse.json(result);
  }

  if (type === 'category-analysis' && startDateParam && endDateParam) {
    const categoryId = searchParams.get('categoryId');
    if (!categoryId) {
      return NextResponse.json({ error: 'categoryId is required' }, { status: 400 });
    }

    const [categoryRes, transactionsRes, allTransactionsRes] = await Promise.all([
      supabase
        .from('categories')
        .select('id, name, color')
        .eq('id', categoryId)
        .single(),
      supabase
        .from('transactions')
        .select('amount, transaction_date, counterparty_name, merchant:merchants(name, display_name)')
        .eq('category_id', categoryId)
        .gte('transaction_date', startDateParam)
        .lte('transaction_date', endDateParam)
        .eq('is_income', false)
        .eq('is_ignored', false),
      supabase
        .from('transactions')
        .select('amount')
        .gte('transaction_date', startDateParam)
        .lte('transaction_date', endDateParam)
        .eq('is_income', false)
        .eq('is_ignored', false),
    ]);

    if (!categoryRes.data) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const category = categoryRes.data;
    const transactions = transactionsRes.data || [];
    const allTransactions = allTransactionsRes.data || [];

    const totalAll = allTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);

    // Monthly trend
    const monthlyData: Record<string, number> = {};
    const merchantData: Record<string, { amount: number; count: number }> = {};

    transactions.forEach((t) => {
      const monthKey = t.transaction_date.substring(0, 7);
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + t.amount;

      const merchantObj = t.merchant as unknown as { name: string; display_name: string } | null;
      const merchantName = merchantObj?.display_name || merchantObj?.name || t.counterparty_name || 'Nieznany';
      if (!merchantData[merchantName]) {
        merchantData[merchantName] = { amount: 0, count: 0 };
      }
      merchantData[merchantName].amount += t.amount;
      merchantData[merchantName].count += 1;
    });

    const monthlyTrend = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, amount]) => ({
        month: new Date(month + '-01').toLocaleDateString('pl-PL', { month: 'short', year: '2-digit' }),
        amount,
      }));

    const monthAmounts = Object.values(monthlyData);
    const averageAmount = monthAmounts.length > 0 ? totalAmount / monthAmounts.length : 0;
    const maxMonth = monthlyTrend.reduce((max, m) => m.amount > max.amount ? m : max, { month: '-', amount: 0 });
    const minMonth = monthlyTrend.reduce((min, m) => m.amount < min.amount ? m : min, monthlyTrend[0] || { month: '-', amount: 0 });

    const topMerchants = Object.entries(merchantData)
      .map(([name, data]) => ({ name, amount: data.amount, count: data.count }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    const result: CategoryAnalysis = {
      categoryId: category.id,
      categoryName: category.name,
      categoryColor: category.color,
      totalAmount,
      averageAmount,
      maxMonth,
      minMonth,
      percentOfTotal: totalAll > 0 ? (totalAmount / totalAll) * 100 : 0,
      monthlyTrend,
      topMerchants,
    };

    return NextResponse.json(result);
  }

  if (type === 'top-spenders' && startDateParam && endDateParam) {
    const [transactionsRes, savingsCategories] = await Promise.all([
      supabase
        .from('transactions')
        .select('id, amount, transaction_date, counterparty_name, display_name, description, category_id, merchant:merchants(name, display_name), category:categories(name, color)')
        .gte('transaction_date', startDateParam)
        .lte('transaction_date', endDateParam)
        .eq('is_income', false)
        .eq('is_ignored', false)
        .order('amount', { ascending: false }),
      supabase
        .from('categories')
        .select('id')
        .eq('is_savings', true),
    ]);

    const savingsIds = new Set(savingsCategories.data?.map(c => c.id) || []);
    const transactions = (transactionsRes.data || []).filter(t => !savingsIds.has(t.category_id));

    // Top merchants
    const merchantData: Record<string, { amount: number; count: number; categoryName?: string; categoryColor?: string }> = {};

    transactions.forEach((t) => {
      const merchantObj = t.merchant as unknown as { name: string; display_name: string } | null;
      const merchantName = merchantObj?.display_name || merchantObj?.name || t.counterparty_name || 'Nieznany';
      const cat = t.category as unknown as { name: string; color: string } | null;

      if (!merchantData[merchantName]) {
        merchantData[merchantName] = { amount: 0, count: 0, categoryName: cat?.name, categoryColor: cat?.color };
      }
      merchantData[merchantName].amount += t.amount;
      merchantData[merchantName].count += 1;
    });

    const topMerchants = Object.entries(merchantData)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    // Top transactions
    const topTransactions = transactions.slice(0, 10).map((t) => {
      const cat = t.category as unknown as { name: string; color: string } | null;
      return {
        id: t.id,
        description: t.display_name || t.description || t.counterparty_name || 'Brak opisu',
        amount: t.amount,
        date: t.transaction_date,
        categoryName: cat?.name,
        categoryColor: cat?.color,
      };
    });

    // Recurring vs one-time (simplified: >2 transactions from same merchant = recurring)
    let recurring = 0;
    let oneTime = 0;

    Object.values(merchantData).forEach((data) => {
      if (data.count > 2) {
        recurring += data.amount;
      } else {
        oneTime += data.amount;
      }
    });

    const result: TopSpenders = {
      topMerchants,
      topTransactions,
      recurringVsOneTime: { recurring, oneTime },
    };

    return NextResponse.json(result);
  }

  if (type === 'year-overview' && startDateParam && endDateParam) {
    const startYear = parseInt(startDateParam.substring(0, 4));
    const prevYearStart = `${startYear - 1}-01-01`;
    const prevYearEnd = `${startYear - 1}-12-31`;

    const [currentRes, prevRes, savingsCategories, categoriesRes] = await Promise.all([
      supabase
        .from('transactions')
        .select('amount, is_income, category_id, transaction_date')
        .gte('transaction_date', startDateParam)
        .lte('transaction_date', endDateParam)
        .eq('is_ignored', false),
      supabase
        .from('transactions')
        .select('amount, is_income, category_id, transaction_date')
        .gte('transaction_date', prevYearStart)
        .lte('transaction_date', prevYearEnd)
        .eq('is_ignored', false),
      supabase
        .from('categories')
        .select('id')
        .eq('is_savings', true),
      supabase
        .from('categories')
        .select('id, name, color, icon')
        .eq('is_savings', false),
    ]);

    const savingsIds = new Set(savingsCategories.data?.map(c => c.id) || []);
    const categoriesMap = new Map((categoriesRes.data || []).map(c => [c.id, c as { id: string; name: string; color: string; icon: string | null }]));

    const processTransactions = (transactions: typeof currentRes.data) => {
      let totalIncome = 0;
      let totalExpenses = 0;
      let totalSavings = 0;
      const monthlyData: Record<string, { income: number; expenses: number; savings: number }> = {};
      const categoryTotals: Record<string, number> = {};

      (transactions || []).forEach((t) => {
        const monthKey = t.transaction_date.substring(0, 7);
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { income: 0, expenses: 0, savings: 0 };
        }

        if (savingsIds.has(t.category_id)) {
          if (!t.is_income) {
            totalSavings += t.amount;
            monthlyData[monthKey].savings += t.amount;
          }
        } else if (t.is_income) {
          totalIncome += t.amount;
          monthlyData[monthKey].income += t.amount;
        } else {
          totalExpenses += t.amount;
          monthlyData[monthKey].expenses += t.amount;
          if (t.category_id) {
            categoryTotals[t.category_id] = (categoryTotals[t.category_id] || 0) + t.amount;
          }
        }
      });

      return { totalIncome, totalExpenses, totalSavings, monthlyData, categoryTotals };
    };

    const current = processTransactions(currentRes.data);
    const prev = processTransactions(prevRes.data);

    const monthlyDataArray = Object.entries(current.monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleDateString('pl-PL', { month: 'short' }),
        income: data.income,
        expenses: data.expenses,
        savings: data.savings,
        savingsRate: data.income > 0 ? (data.savings / data.income) * 100 : 0,
      }));

    const yearComparison = prev.totalIncome > 0 || prev.totalExpenses > 0 ? {
      prevYearIncome: prev.totalIncome,
      prevYearExpenses: prev.totalExpenses,
      prevYearSavings: prev.totalSavings,
      incomeChange: calculatePercentageChange(current.totalIncome, prev.totalIncome),
      expensesChange: calculatePercentageChange(current.totalExpenses, prev.totalExpenses),
      savingsChange: calculatePercentageChange(current.totalSavings, prev.totalSavings),
    } : undefined;

    const categoryYoY = Array.from(categoriesMap.values())
      .map((cat) => {
        const currentAmount = current.categoryTotals[cat.id] || 0;
        const prevAmount = prev.categoryTotals[cat.id] || 0;
        return {
          categoryName: cat.name,
          categoryColor: cat.color,
          categoryIcon: cat.icon,
          currentYear: currentAmount,
          prevYear: prevAmount,
          change: calculatePercentageChange(currentAmount, prevAmount),
        };
      })
      .filter((c) => c.currentYear > 0 || c.prevYear > 0)
      .sort((a, b) => b.currentYear - a.currentYear)
      .slice(0, 10);

    const result: YearOverview = {
      totalIncome: current.totalIncome,
      totalExpenses: current.totalExpenses,
      totalSavings: current.totalSavings,
      netChange: current.totalIncome - current.totalExpenses - current.totalSavings,
      monthlyData: monthlyDataArray,
      yearComparison,
      categoryYoY,
    };

    return NextResponse.json(result);
  }

  if (type === 'daily-spending') {
    // Get current month daily spending data for sparkline chart
    const historicalStartDate = getFinancialMonthBoundaries(addFinancialMonths(month, -6, financialStartDay), financialStartDay).start;

    const [transactionsRes, historicalRes, savingsCategories] = await Promise.all([
      // Current month transactions with dates
      supabase
        .from('transactions')
        .select('amount, transaction_date, category_id')
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate)
        .eq('is_income', false)
        .eq('is_ignored', false),
      // Historical data for projection (last 6 months)
      supabase
        .from('transactions')
        .select('amount, transaction_date, category_id')
        .gte('transaction_date', historicalStartDate)
        .lt('transaction_date', startDate)
        .eq('is_income', false)
        .eq('is_ignored', false),
      // Savings categories to exclude
      supabase
        .from('categories')
        .select('id')
        .eq('is_savings', true),
    ]);

    const savingsIds = new Set(savingsCategories.data?.map(c => c.id) || []);
    const transactions = (transactionsRes.data || []).filter(t => !savingsIds.has(t.category_id));
    const historicalTransactions = (historicalRes.data || []).filter(t => !savingsIds.has(t.category_id));

    const daysInMonth = getFinancialMonthDays(month, financialStartDay);
    const currentDay = getFinancialDayOfMonth(new Date(), financialStartDay);

    // Calculate actual spending per day (relative to financial month start)
    const dailySpent: Record<number, number> = {};
    const financialMonthStartDate = new Date(startDate + 'T00:00:00');
    transactions.forEach(t => {
      const txDate = new Date(t.transaction_date + 'T00:00:00');
      const dayDiff = Math.floor((txDate.getTime() - financialMonthStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      dailySpent[dayDiff] = (dailySpent[dayDiff] || 0) + t.amount;
    });

    // Calculate average daily spending from historical data for projection
    // Group by financial month periods
    const historicalByMonth: Record<string, Record<number, number>> = {};
    historicalTransactions.forEach(t => {
      const txDate = new Date(t.transaction_date + 'T00:00:00');
      // Find which financial month this transaction belongs to
      const { start: fmStart, label } = getFinancialMonthBoundaries(txDate, financialStartDay);
      const fmStartDate = new Date(fmStart + 'T00:00:00');
      const dayInFM = Math.floor((txDate.getTime() - fmStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      if (!historicalByMonth[label]) {
        historicalByMonth[label] = {};
      }
      historicalByMonth[label][dayInFM] = (historicalByMonth[label][dayInFM] || 0) + t.amount;
    });

    // Calculate average daily pattern from historical months
    const avgDailyPattern: Record<number, number> = {};
    const monthCount = Object.keys(historicalByMonth).length;

    if (monthCount > 0) {
      for (let day = 1; day <= 31; day++) {
        let total = 0;
        let count = 0;
        Object.values(historicalByMonth).forEach(monthData => {
          if (monthData[day] !== undefined) {
            total += monthData[day];
            count++;
          }
        });
        avgDailyPattern[day] = count > 0 ? total / count : 0;
      }
    } else {
      // Fallback: use current month's average daily spending
      const totalSpent = Object.values(dailySpent).reduce((sum, v) => sum + v, 0);
      const avgDaily = currentDay > 0 ? totalSpent / currentDay : 0;
      for (let day = 1; day <= 31; day++) {
        avgDailyPattern[day] = avgDaily;
      }
    }

    // Build daily spending data
    const dailySpendingData = [];
    for (let day = 1; day <= daysInMonth; day++) {
      dailySpendingData.push({
        day,
        spent: dailySpent[day] || 0,
        projected: avgDailyPattern[day] || 0,
      });
    }

    return NextResponse.json(dailySpendingData);
  }

  if (type === 'forecast') {
    // Get current month data
    const historicalStartForForecast = getFinancialMonthBoundaries(addFinancialMonths(month, -6, financialStartDay), financialStartDay).start;

    // For budgets, we still use calendar month as per the plan
    const budgetMonth = getFirstDayOfMonth(month);

    const [transactionsRes, budgetsRes, categoriesRes, prevMonthRes, historicalRes, savingsCategories, incomeRes] = await Promise.all([
      // Current month transactions
      supabase
        .from('transactions')
        .select('amount, category_id')
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate)
        .eq('is_income', false)
        .eq('is_ignored', false),
      // Current month budgets (still using calendar month)
      supabase
        .from('budgets')
        .select('category_id, planned_amount')
        .eq('month', budgetMonth)
        .eq('is_income', false),
      // All categories
      supabase
        .from('categories')
        .select('id, name, color, icon, is_savings'),
      // Previous month transactions
      supabase
        .from('transactions')
        .select('amount, category_id')
        .gte('transaction_date', prevStartDate)
        .lte('transaction_date', prevEndDate)
        .eq('is_income', false)
        .eq('is_ignored', false),
      // Last 6 months for historical ratio calculation (excluding current month)
      supabase
        .from('transactions')
        .select('amount, category_id, transaction_date')
        .gte('transaction_date', historicalStartForForecast)
        .lt('transaction_date', startDate)
        .eq('is_income', false)
        .eq('is_ignored', false),
      // Savings categories
      supabase
        .from('categories')
        .select('id')
        .eq('is_savings', true),
      // Current month income
      supabase
        .from('transactions')
        .select('amount')
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate)
        .eq('is_income', true)
        .eq('is_ignored', false),
    ]);

    const savingsIds = new Set(savingsCategories.data?.map(c => c.id) || []);
    const categoriesMap = new Map((categoriesRes.data || [])
      .filter(c => !c.is_savings)
      .map(c => [c.id, { name: c.name, color: c.color, icon: c.icon as string | null }]));

    // Calculate current spending per category
    const currentSpending: Record<string, number> = {};
    (transactionsRes.data || []).forEach(t => {
      if (savingsIds.has(t.category_id)) return;
      const catId = t.category_id || 'uncategorized';
      currentSpending[catId] = (currentSpending[catId] || 0) + t.amount;
    });

    // Budgets per category
    const budgets: Record<string, number> = {};
    (budgetsRes.data || []).forEach(b => {
      budgets[b.category_id || 'uncategorized'] = b.planned_amount;
    });

    // Previous month spending per category
    const prevMonthSpending: Record<string, number> = {};
    (prevMonthRes.data || []).forEach(t => {
      if (savingsIds.has(t.category_id)) return;
      const catId = t.category_id || 'uncategorized';
      prevMonthSpending[catId] = (prevMonthSpending[catId] || 0) + t.amount;
    });

    // Historical average per category (last 3 months)
    const historicalTotals: Record<string, number> = {};
    (historicalRes.data || []).forEach(t => {
      if (savingsIds.has(t.category_id)) return;
      const catId = t.category_id || 'uncategorized';
      historicalTotals[catId] = (historicalTotals[catId] || 0) + t.amount;
    });
    const historicalAvg: Record<string, number> = {};
    Object.keys(historicalTotals).forEach(catId => {
      historicalAvg[catId] = historicalTotals[catId] / 3;
    });

    // Build category data
    const allCategoryIds = new Set([
      ...Object.keys(currentSpending),
      ...Object.keys(budgets),
      ...categoriesMap.keys(),
    ]);

    const categoryData = Array.from(allCategoryIds)
      .filter(catId => catId !== 'uncategorized' || currentSpending[catId] > 0)
      .map(catId => {
        const cat = categoriesMap.get(catId);
        return {
          categoryId: catId,
          categoryName: cat?.name || 'Bez kategorii',
          categoryColor: cat?.color || '#6b7280',
          categoryIcon: cat?.icon || null,
          currentSpent: currentSpending[catId] || 0,
          budget: budgets[catId] || null,
          lastMonthSpent: prevMonthSpending[catId] || null,
          historicalAvg: historicalAvg[catId] || null,
        };
      })
      .filter(c => c.currentSpent > 0 || c.budget !== null);

    // Calculate total income and budget
    const totalIncome = (incomeRes.data || []).reduce((sum, t) => sum + t.amount, 0);
    const totalBudget = Object.values(budgets).reduce((sum, b) => sum + b, 0);

    // Filter historical transactions to exclude savings
    const historicalTransactions = (historicalRes.data || [])
      .filter(t => !savingsIds.has(t.category_id))
      .map(t => ({
        amount: t.amount,
        category_id: t.category_id,
        transaction_date: t.transaction_date,
      }));

    const forecast = forecastMonthlySpending({
      categories: categoryData,
      totalIncome,
      totalBudget,
      currentDate: new Date(),
      historicalTransactions,
      financialStartDay,
    });

    return NextResponse.json(forecast);
  }

  return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
}
