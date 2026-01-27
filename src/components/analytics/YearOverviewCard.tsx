'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ColumnChart } from '@/components/charts/ColumnChart';
import { useYearOverview } from '@/hooks/useAnalytics';
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { TimePeriodRange } from '@/types';

interface YearOverviewCardProps {
  range: TimePeriodRange;
}

function StatCard({ label, value, change }: { label: string; value: number; change?: number }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <p className="text-xs text-gray-500 uppercase">{label}</p>
      <p className="text-lg font-semibold">{formatCurrency(value)}</p>
      {change !== undefined && (
        <div className={cn('flex items-center gap-1 text-xs', change >= 0 ? 'text-green-600' : 'text-red-600')}>
          {change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          <span>{Math.abs(change).toFixed(1)}% vs poprzedni rok</span>
        </div>
      )}
    </div>
  );
}

export function YearOverviewCard({ range }: YearOverviewCardProps) {
  const { data, loading, error } = useYearOverview(range.startDate, range.endDate);

  if (error && !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Podsumowanie roczne</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Nie udało się załadować danych</p>
        </CardContent>
      </Card>
    );
  }

  if (loading && !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Podsumowanie roczne</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const chartSeries = [
    {
      name: 'Przychody',
      data: data.monthlyData.map((m) => m.income),
      color: '#22c55e',
    },
    {
      name: 'Wydatki',
      data: data.monthlyData.map((m) => m.expenses),
      color: '#ef4444',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Podsumowanie roczne
          {loading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
        </CardTitle>
      </CardHeader>
      <CardContent className={cn('transition-opacity duration-200', loading && 'opacity-60')}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Przychody"
            value={data.totalIncome}
            change={data.yearComparison?.incomeChange}
          />
          <StatCard
            label="Wydatki"
            value={data.totalExpenses}
            change={data.yearComparison?.expensesChange}
          />
          <StatCard
            label="Oszczędności"
            value={data.totalSavings}
            change={data.yearComparison?.savingsChange}
          />
          <StatCard label="Zmiana netto" value={data.netChange} />
        </div>

        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-4">Przychody vs wydatki miesięcznie</h4>
          <ColumnChart
            categories={data.monthlyData.map((m) => m.month)}
            series={chartSeries}
          />
        </div>

        {data.categoryYoY.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-4">Kategorie rok do roku</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 font-medium text-gray-500">Kategoria</th>
                    <th className="text-right py-2 font-medium text-gray-500">Bieżący rok</th>
                    <th className="text-right py-2 font-medium text-gray-500">Poprzedni rok</th>
                    <th className="text-right py-2 font-medium text-gray-500">Zmiana</th>
                  </tr>
                </thead>
                <tbody>
                  {data.categoryYoY.map((cat) => (
                    <tr key={cat.categoryName} className="border-b border-gray-100">
                      <td className="py-2">
                        <span
                          className="inline-flex items-center gap-2"
                        >
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: cat.categoryColor }}
                          />
                          {cat.categoryName}
                        </span>
                      </td>
                      <td className="text-right py-2">{formatCurrency(cat.currentYear)}</td>
                      <td className="text-right py-2 text-gray-500">{formatCurrency(cat.prevYear)}</td>
                      <td className={cn('text-right py-2', cat.change >= 0 ? 'text-red-600' : 'text-green-600')}>
                        {cat.change >= 0 ? '+' : ''}{cat.change.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
