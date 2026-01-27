'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { HorizontalBarChart } from '@/components/charts/HorizontalBarChart';
import { CalendarHeatmap } from '@/components/charts/CalendarHeatmap';
import { HeatmapChart } from '@/components/charts/HeatmapChart';
import { useSpendingPatterns } from '@/hooks/useAnalytics';
import { Loader2, Wallet, TrendingUp, CalendarDays } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import type { TimePeriodRange } from '@/types';

interface SpendingPatternsCardProps {
  range: TimePeriodRange;
}

function ChangeIndicator({ change }: { change?: number }) {
  if (change === undefined) return null;
  const isPositive = change < 0; // For spending, decrease is positive
  const isNeutral = Math.abs(change) < 0.5;

  if (isNeutral) return null;

  return (
    <span className={cn(
      'inline-flex items-center gap-0.5 text-xs font-medium ml-2',
      isPositive ? 'text-green-600' : 'text-red-600'
    )}>
      {change > 0 ? '+' : ''}{change.toFixed(1)}%
    </span>
  );
}

export function SpendingPatternsCard({ range }: SpendingPatternsCardProps) {
  const { data, loading, error } = useSpendingPatterns(
    range.startDate,
    range.endDate,
    range.compareStartDate,
    range.compareEndDate
  );

  // Parse month/year from range for CalendarHeatmap
  const startDate = new Date(range.startDate + 'T00:00:00');
  const month = startDate.getMonth();
  const year = startDate.getFullYear();

  if (error && !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Wzorce wydatków</CardTitle>
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
          <CardTitle>Wzorce wydatków</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Wzorce wydatków
          {loading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
        </CardTitle>
      </CardHeader>
      <CardContent className={cn('transition-opacity duration-200', loading && 'opacity-60')}>
        {/* Stats summary */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="relative rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 p-4 border border-slate-200/60">
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300/80">
              <Wallet className="h-10 w-10" />
            </div>
            <div className="relative">
              <div className="text-xs font-medium text-slate-500 mb-1">Suma wydatków</div>
              <div className="flex items-baseline">
                <span className="text-2xl font-bold text-slate-900">{formatCurrency(data.totalAmount)}</span>
                <ChangeIndicator change={data.totalAmountChange} />
              </div>
            </div>
          </div>
          <div className="relative rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 p-4 border border-blue-200/60">
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300/80">
              <TrendingUp className="h-10 w-10" />
            </div>
            <div className="relative">
              <div className="text-xs font-medium text-blue-600 mb-1">Średnia dzienna</div>
              <div className="flex items-baseline">
                <span className="text-2xl font-bold text-blue-900">{formatCurrency(data.averageDaily)}</span>
                <ChangeIndicator change={data.averageDailyChange} />
              </div>
            </div>
          </div>
          <div className="relative rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 p-4 border border-emerald-200/60">
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-300/80">
              <CalendarDays className="h-10 w-10" />
            </div>
            <div className="relative">
              <div className="text-xs font-medium text-emerald-600 mb-1">Dni z wydatkami</div>
              <div className="text-2xl font-bold text-emerald-900">{data.daysWithSpending}</div>
            </div>
          </div>
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Wydatki wg dnia tygodnia */}
          <div className="bg-gray-50/50 rounded-xl p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium text-gray-700">Wydatki wg dnia tygodnia</h4>
              {data.previousByDayOfWeek && (
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-2 rounded bg-blue-500"></span>
                    Teraz
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-2 rounded bg-gray-400"></span>
                    Poprzednio
                  </span>
                </div>
              )}
            </div>
            <HorizontalBarChart
              data={data.byDayOfWeek.map((d) => ({
                name: d.day,
                value: d.amount,
                count: d.count,
              }))}
              compareData={data.previousByDayOfWeek?.map((d) => ({
                name: d.day,
                value: d.amount,
                count: d.count,
              }))}
            />
          </div>

          {/* Kalendarz wydatków */}
          <div className="bg-gray-50/50 rounded-xl p-5 flex flex-col items-center">
            <h4 className="text-sm font-medium text-gray-700 mb-4 self-start">Kalendarz wydatków</h4>
            <CalendarHeatmap
              data={data.byDayOfMonth}
              month={month}
              year={year}
            />
          </div>

          {/* Heatmapa kategorii */}
          <div className="bg-gray-50/50 rounded-xl p-5 md:col-span-2 xl:col-span-1 flex flex-col items-center">
            <h4 className="text-sm font-medium text-gray-700 mb-4 self-start">Heatmapa kategorii</h4>
            <HeatmapChart data={data.categoryHeatmap} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
