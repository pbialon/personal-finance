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

export function SpendingPatternsCard({ range }: SpendingPatternsCardProps) {
  const { data, loading, error } = useSpendingPatterns(range.startDate, range.endDate);

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
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 p-4 border border-slate-200/60">
            <div className="absolute -right-2 -top-2 text-slate-200">
              <Wallet className="h-16 w-16" />
            </div>
            <div className="relative">
              <div className="text-xs font-medium text-slate-500 mb-1">Suma wydatków</div>
              <div className="text-2xl font-bold text-slate-900">{formatCurrency(data.totalAmount)}</div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 p-4 border border-blue-200/60">
            <div className="absolute -right-2 -top-2 text-blue-200">
              <TrendingUp className="h-16 w-16" />
            </div>
            <div className="relative">
              <div className="text-xs font-medium text-blue-600 mb-1">Średnia dzienna</div>
              <div className="text-2xl font-bold text-blue-900">{formatCurrency(data.averageDaily)}</div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 p-4 border border-emerald-200/60">
            <div className="absolute -right-2 -top-2 text-emerald-200">
              <CalendarDays className="h-16 w-16" />
            </div>
            <div className="relative">
              <div className="text-xs font-medium text-emerald-600 mb-1">Dni z wydatkami</div>
              <div className="text-2xl font-bold text-emerald-900">{data.daysWithSpending}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">
          <div className="flex flex-col">
            <h4 className="text-sm font-medium text-gray-700 mb-4">Wydatki wg dnia tygodnia</h4>
            <div className="flex-1 flex flex-col justify-center">
              <HorizontalBarChart
                data={data.byDayOfWeek.map((d) => ({
                  name: d.day,
                  value: d.amount,
                  count: d.count,
                }))}
              />
            </div>
          </div>
          <div className="lg:border-l lg:border-gray-100 lg:pl-12 flex flex-col">
            <h4 className="text-sm font-medium text-gray-700 mb-4">Kalendarz wydatków</h4>
            <div className="flex-1">
              <CalendarHeatmap
                data={data.byDayOfMonth}
                month={month}
                year={year}
              />
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-700 mb-4">Heatmapa kategorii wg dni tygodnia</h4>
          <HeatmapChart data={data.categoryHeatmap} />
        </div>
      </CardContent>
    </Card>
  );
}
