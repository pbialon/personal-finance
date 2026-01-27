'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatCards } from '@/components/dashboard/StatCards';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { BudgetProgressCard } from '@/components/dashboard/BudgetProgress';
import { CategorySpendingCard } from '@/components/dashboard/CategorySpending';
import { MonthlyTrendCard } from '@/components/dashboard/MonthlyTrendCard';
import { useMonthlyStats, useCategorySpending, useMonthlyTrends, useBudgetProgress } from '@/hooks/useAnalytics';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { formatMonthYear, getFirstDayOfMonth, addMonths } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export default function Dashboard() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const monthStr = getFirstDayOfMonth(currentMonth);

  const { stats, loading: statsLoading } = useMonthlyStats(monthStr);
  const { spending, loading: spendingLoading } = useCategorySpending(monthStr);
  const { trends, loading: trendsLoading } = useMonthlyTrends(monthStr);
  const { progress, loading: progressLoading } = useBudgetProgress(monthStr);
  const { transactions } = useTransactions({
    startDate: getFirstDayOfMonth(currentMonth),
    endDate: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).toISOString().split('T')[0],
  });
  const { categories } = useCategories();

  const goToPreviousMonth = () => setCurrentMonth((m) => addMonths(m, -1));
  const goToNextMonth = () => setCurrentMonth((m) => addMonths(m, 1));
  const goToCurrentMonth = () => setCurrentMonth(new Date());

  const totalPlanned = progress.reduce((sum, b) => sum + b.planned, 0);
  const totalActual = progress.reduce((sum, b) => sum + b.actual, 0);

  const isLoading = statsLoading || spendingLoading || trendsLoading || progressLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {formatMonthYear(currentMonth)}
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button variant="secondary" size="sm" onClick={goToCurrentMonth}>
            Dzisiaj
          </Button>
          <Button variant="ghost" size="sm" onClick={goToNextMonth}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          {stats && <StatCards stats={stats} />}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CategorySpendingCard spending={spending} />
            <MonthlyTrendCard trends={trends} />
          </div>

          <BudgetProgressCard
            budgets={progress}
            totalPlanned={totalPlanned}
            totalActual={totalActual}
          />

          <RecentTransactions
            transactions={transactions.slice(0, 5)}
            categories={categories}
          />
        </>
      )}
    </div>
  );
}
