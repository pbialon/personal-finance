'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Loader2 } from 'lucide-react';
import { StatCards } from '@/components/dashboard/StatCards';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { BudgetProgressCard } from '@/components/dashboard/BudgetProgress';
import { CategorySpendingCard } from '@/components/dashboard/CategorySpending';
import { MonthlyTrendCard } from '@/components/dashboard/MonthlyTrendCard';
import { MonthPicker } from '@/components/ui/MonthPicker';
import { useMonthlyStats, useCategorySpending, useMonthlyTrends, useBudgetProgress } from '@/hooks/useAnalytics';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { formatMonthYear, getFirstDayOfMonth, addMonths } from '@/lib/utils';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
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

  const isCurrentMonth =
    currentMonth.getMonth() === new Date().getMonth() &&
    currentMonth.getFullYear() === new Date().getFullYear();

  const totalPlanned = progress.reduce((sum, b) => sum + b.planned, 0);
  const totalActual = progress.reduce((sum, b) => sum + b.actual, 0);

  const isLoading = statsLoading || spendingLoading || trendsLoading || progressLoading;
  const hasData = stats || spending.length > 0 || trends.length > 0 || progress.length > 0;

  return (
    <div className="space-y-6">
      {/* Month Navigation */}
      <div className="flex items-center justify-center">
        <div className="relative inline-flex items-center gap-1 bg-gray-100 rounded-full p-1">
          <button
            onClick={goToPreviousMonth}
            className="p-2 rounded-full hover:bg-white hover:shadow-sm transition-all text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            onClick={() => setIsMonthPickerOpen(true)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-full hover:bg-white hover:shadow-sm transition-all min-w-[180px] justify-center',
              isMonthPickerOpen && 'bg-white shadow-sm ring-2 ring-blue-500'
            )}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 text-gray-500 animate-spin" />
            ) : (
              <Calendar className="h-4 w-4 text-gray-500" />
            )}
            <span className="font-semibold text-gray-900 capitalize">
              {formatMonthYear(currentMonth)}
            </span>
          </button>

          <button
            onClick={goToNextMonth}
            disabled={isCurrentMonth}
            className="p-2 rounded-full hover:bg-white hover:shadow-sm transition-all text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:shadow-none"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <MonthPicker
            value={currentMonth}
            onChange={setCurrentMonth}
            isOpen={isMonthPickerOpen}
            onClose={() => setIsMonthPickerOpen(false)}
            maxDate={new Date()}
          />

          {!isCurrentMonth && (
            <button
              onClick={goToCurrentMonth}
              className="absolute left-full ml-3 text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline whitespace-nowrap"
            >
              Bieżący miesiąc
            </button>
          )}
        </div>
      </div>

      {/* Show spinner only on initial load with no data */}
      {isLoading && !hasData ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className={cn(
          'transition-opacity duration-200',
          isLoading && 'opacity-60'
        )}>
          {stats && <StatCards stats={stats} />}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <CategorySpendingCard spending={spending} />
            <MonthlyTrendCard trends={trends} />
          </div>

          <div className="mt-6">
            <BudgetProgressCard
              budgets={progress}
              totalPlanned={totalPlanned}
              totalActual={totalActual}
            />
          </div>

          <div className="mt-6">
            <RecentTransactions
              transactions={transactions.slice(0, 5)}
              categories={categories}
            />
          </div>
        </div>
      )}
    </div>
  );
}
