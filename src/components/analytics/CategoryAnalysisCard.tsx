'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { TrendChart } from '@/components/charts/TrendChart';
import { TreemapChart } from '@/components/charts/TreemapChart';
import { useCategoryAnalysis } from '@/hooks/useAnalytics';
import { useCategories } from '@/hooks/useCategories';
import { Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { TimePeriodRange } from '@/types';

interface CategoryAnalysisCardProps {
  range: TimePeriodRange;
}

export function CategoryAnalysisCard({ range }: CategoryAnalysisCardProps) {
  const { categories } = useCategories();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const { data, loading, error } = useCategoryAnalysis(
    range.startDate,
    range.endDate,
    selectedCategoryId || undefined
  );

  const categoryOptions = [
    { value: '', label: 'Wybierz kategorię...' },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ];

  if (!selectedCategoryId) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Analiza kategorii</CardTitle>
          <div className="w-64">
            <Select
              options={categoryOptions}
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 text-center py-8">
            Wybierz kategorię, aby zobaczyć szczegółową analizę
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Analiza kategorii</CardTitle>
          <div className="w-64">
            <Select
              options={categoryOptions}
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
            />
          </div>
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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Analiza kategorii</CardTitle>
          <div className="w-64">
            <Select
              options={categoryOptions}
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Nie udało się załadować danych</p>
        </CardContent>
      </Card>
    );
  }

  const trendSeries = [
    {
      name: 'Bieżący okres',
      data: data.monthlyTrend.map((m) => m.amount),
      color: data.categoryColor,
    },
  ];

  if (data.monthlyTrend.some((m) => m.prevYearAmount !== undefined)) {
    trendSeries.push({
      name: 'Poprzedni rok',
      data: data.monthlyTrend.map((m) => m.prevYearAmount || 0),
      color: '#9ca3af',
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Analiza kategorii</CardTitle>
        <div className="w-64">
          <Select
            options={categoryOptions}
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase">Suma</p>
            <p className="text-lg font-semibold">{formatCurrency(data.totalAmount)}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase">Średnia/msc</p>
            <p className="text-lg font-semibold">{formatCurrency(data.averageAmount)}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase">Max miesiąc</p>
            <p className="text-lg font-semibold">{formatCurrency(data.maxMonth.amount)}</p>
            <p className="text-xs text-gray-400">{data.maxMonth.month}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase">% całości</p>
            <p className="text-lg font-semibold">{data.percentOfTotal.toFixed(1)}%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-4">Trend miesięczny</h4>
            <TrendChart
              categories={data.monthlyTrend.map((m) => m.month)}
              series={trendSeries}
            />
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-4">Rozbicie na kontrahentów</h4>
            {data.topMerchants.length > 0 ? (
              <TreemapChart
                data={data.topMerchants.map((m) => ({
                  name: m.name,
                  value: m.amount,
                  color: data.categoryColor,
                }))}
              />
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">Brak danych</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
