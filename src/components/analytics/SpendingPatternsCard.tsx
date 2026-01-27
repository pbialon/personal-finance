'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { HorizontalBarChart } from '@/components/charts/HorizontalBarChart';
import { AreaChart } from '@/components/charts/AreaChart';
import { HeatmapChart } from '@/components/charts/HeatmapChart';
import { useSpendingPatterns } from '@/hooks/useAnalytics';
import { Loader2 } from 'lucide-react';
import type { TimePeriodRange } from '@/types';

interface SpendingPatternsCardProps {
  range: TimePeriodRange;
}

export function SpendingPatternsCard({ range }: SpendingPatternsCardProps) {
  const { data, loading, error } = useSpendingPatterns(range.startDate, range.endDate);

  if (loading) {
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

  if (error || !data) {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wzorce wydatków</CardTitle>
      </CardHeader>
      <CardContent>
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
            <h4 className="text-sm font-medium text-gray-700 mb-4">Wydatki wg dnia miesiąca</h4>
            <AreaChart
              data={data.byDayOfMonth.map((d) => ({
                label: String(d.day),
                value: d.amount,
              }))}
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
