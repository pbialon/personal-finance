'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { StatCards } from '@/components/dashboard/StatCards';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { BudgetProgressCard } from '@/components/dashboard/BudgetProgress';
import { PieChart } from '@/components/charts/PieChart';
import { ColumnChart } from '@/components/charts/ColumnChart';
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

  const pieData = spending.map((s) => ({
    name: s.categoryName,
    y: s.amount,
    color: s.categoryColor,
  }));

  const columnCategories = trends.map((t) => t.month);
  const columnSeries = [
    {
      name: 'Przychody',
      data: trends.map((t) => t.income),
      color: '#22c55e',
    },
    {
      name: 'Wydatki',
      data: trends.map((t) => t.expenses),
      color: '#ef4444',
    },
    {
      name: 'Oszczędności netto',
      data: trends.map((t) => t.netSavings),
      color: '#3b82f6',
    },
  ];

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
            <Card>
              <CardHeader>
                <CardTitle>Wydatki per kategoria</CardTitle>
              </CardHeader>
              <CardContent>
                {pieData.length > 0 ? (
                  <PieChart data={pieData} />
                ) : (
                  <p className="text-center text-gray-500 py-8">Brak danych</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Trend miesięczny</CardTitle>
              </CardHeader>
              <CardContent>
                {columnCategories.length > 0 ? (
                  <ColumnChart categories={columnCategories} series={columnSeries} />
                ) : (
                  <p className="text-center text-gray-500 py-8">Brak danych</p>
                )}
              </CardContent>
            </Card>
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
