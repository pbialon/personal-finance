'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { HorizontalBarChart } from '@/components/charts/HorizontalBarChart';
import { CalendarHeatmap } from '@/components/charts/CalendarHeatmap';
import { HeatmapChart } from '@/components/charts/HeatmapChart';
import { useSpendingPatterns } from '@/hooks/useAnalytics';
import { Loader2, TrendingDown, Calendar, Hash } from 'lucide-react';
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
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <TrendingDown className="h-4 w-4" />
              <span className="text-xs font-medium">Suma wydatków</span>
            </div>
            <div className="text-xl font-bold text-blue-900">
              {formatCurrency(data.totalAmount)}
            </div>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-4">
            <div className="flex items-center gap-2 text-emerald-600 mb-1">
              <Calendar className="h-4 w-4" />
              <span className="text-xs font-medium">Średnia dzienna</span>
            </div>
            <div className="text-xl font-bold text-emerald-900">
              {formatCurrency(data.averageDaily)}
            </div>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4">
            <div className="flex items-center gap-2 text-amber-600 mb-1">
              <Hash className="h-4 w-4" />
              <span className="text-xs font-medium">Dni z wydatkami</span>
            </div>
            <div className="text-xl font-bold text-amber-900">
              {data.daysWithSpending}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-4">Wydatki wg dnia tygodnia</h4>
            <HorizontalBarChart
              data={data.byDayOfWeek.map((d) => ({
                name: d.day,
                value: d.amount,
                count: d.count,
              }))}
            />
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-4">Kalendarz wydatków</h4>
            <CalendarHeatmap
              data={data.byDayOfMonth}
              month={month}
              year={year}
            />
          </div>
        </div>
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-4">Heatmapa kategorii wg dni tygodnia</h4>
          <HeatmapChart data={data.categoryHeatmap} />
        </div>
      </CardContent>
    </Card>
  );
}
