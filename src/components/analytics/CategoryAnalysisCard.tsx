'use client';

import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { TrendChart } from '@/components/charts/TrendChart';
import { useCategoryAnalysis, useCategorySpending } from '@/hooks/useAnalytics';
import { useCategories } from '@/hooks/useCategories';
import { Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import type { TimePeriodRange } from '@/types';

interface CategoryChipProps {
  id: string;
  name: string;
  color: string;
  percentage?: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const CategoryChip = memo(function CategoryChip({
  id,
  name,
  color,
  percentage,
  isSelected,
  onSelect,
}: CategoryChipProps) {
  return (
    <button
      onClick={() => onSelect(id)}
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all',
        isSelected
          ? 'ring-2 ring-offset-1'
          : 'hover:ring-1 hover:ring-gray-300'
      )}
      style={{
        backgroundColor: isSelected ? color + '20' : '#f3f4f6',
        color: isSelected ? color : '#4b5563',
        // @ts-expect-error CSS custom property for ring color
        '--tw-ring-color': isSelected ? color : undefined,
      }}
    >
      <span
        className="w-2.5 h-2.5 rounded-full shrink-0"
        style={{ backgroundColor: color }}
      />
      <span>{name}</span>
      {percentage !== undefined && percentage > 0 && (
        <span className={cn(
          'text-xs',
          isSelected ? 'opacity-70' : 'text-gray-400'
        )}>
          {percentage}%
        </span>
      )}
    </button>
  );
});

interface CategoryAnalysisCardProps {
  range: TimePeriodRange;
}

export function CategoryAnalysisCard({ range }: CategoryAnalysisCardProps) {
  const { categories } = useCategories();
  const { spending } = useCategorySpending(range.startDate.substring(0, 7));
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [showAllMerchants, setShowAllMerchants] = useState(false);
  const { data, loading, error } = useCategoryAnalysis(
    range.startDate,
    range.endDate,
    selectedCategoryId || undefined
  );

  // Auto-select top spending category on first load
  useEffect(() => {
    if (!selectedCategoryId && spending.length > 0) {
      const topCategory = spending[0];
      if (topCategory?.categoryId && topCategory.categoryId !== 'uncategorized') {
        setSelectedCategoryId(topCategory.categoryId);
      } else if (spending[1]?.categoryId) {
        setSelectedCategoryId(spending[1].categoryId);
      }
    }
  }, [spending, selectedCategoryId]);

  // Reset expanded state when category changes
  useEffect(() => {
    setShowAllMerchants(false);
  }, [selectedCategoryId]);

  // Sort categories by spending amount - memoized
  const sortedCategories = useMemo(() =>
    [...categories]
      .filter(c => !c.is_savings)
      .sort((a, b) => {
        const spendingA = spending.find(s => s.categoryId === a.id)?.amount || 0;
        const spendingB = spending.find(s => s.categoryId === b.id)?.amount || 0;
        return spendingB - spendingA;
      }),
    [categories, spending]
  );

  const handleCategorySelect = useCallback((categoryId: string) => {
    setSelectedCategoryId(categoryId);
  }, []);

  // Memoize category chips data
  const categoryChipsData = useMemo(() =>
    sortedCategories.map(cat => ({
      ...cat,
      spending: spending.find(s => s.categoryId === cat.id),
    })),
    [sortedCategories, spending]
  );

  // Memoize trend data - must be before early returns to maintain hook order
  const { trendCategories, trendSeries } = useMemo(() => {
    if (!data) return { trendCategories: [], trendSeries: [] };

    const series = [
      {
        name: 'Bieżący okres',
        data: data.monthlyTrend.map((m) => m.amount),
        color: data.categoryColor,
      },
    ];

    if (data.monthlyTrend.some((m) => m.prevYearAmount !== undefined)) {
      series.push({
        name: 'Poprzedni rok',
        data: data.monthlyTrend.map((m) => m.prevYearAmount || 0),
        color: '#9ca3af',
      });
    }

    return {
      trendCategories: data.monthlyTrend.map((m) => m.month),
      trendSeries: series,
    };
  }, [data]);

  const renderCategoryChips = () => (
    <div className="flex flex-wrap gap-2">
      {categoryChipsData.map((cat) => (
        <CategoryChip
          key={cat.id}
          id={cat.id}
          name={cat.name}
          color={cat.color}
          percentage={cat.spending?.percentage}
          isSelected={selectedCategoryId === cat.id}
          onSelect={handleCategorySelect}
        />
      ))}
    </div>
  );

  if (!selectedCategoryId || (loading && !data)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analiza kategorii</CardTitle>
        </CardHeader>
        <CardContent>
          {renderCategoryChips()}
          {!selectedCategoryId ? (
            <p className="text-sm text-gray-500 text-center py-8">
              Wybierz kategorię, aby zobaczyć szczegółową analizę
            </p>
          ) : (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (error && !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analiza kategorii</CardTitle>
        </CardHeader>
        <CardContent>
          {renderCategoryChips()}
          <p className="text-sm text-gray-500 mt-6">Nie udało się załadować danych</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Analiza kategorii
          {loading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
        </CardTitle>
      </CardHeader>
      <CardContent className={cn('transition-opacity duration-200', loading && 'opacity-60')}>
        {renderCategoryChips()}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 mb-6">
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
              categories={trendCategories}
              series={trendSeries}
            />
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-4">Rozbicie na kontrahentów</h4>
            {data.topMerchants.length > 0 ? (
              <div className="space-y-2">
                {(showAllMerchants ? data.topMerchants : data.topMerchants.slice(0, 5)).map((merchant) => {
                  const percentage = data.totalAmount > 0 ? (merchant.amount / data.totalAmount) * 100 : 0;
                  const maxAmount = data.topMerchants[0]?.amount || 1;
                  const barWidth = (merchant.amount / maxAmount) * 100;

                  return (
                    <div key={merchant.name} className="group">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-700 truncate max-w-[60%]">{merchant.name}</span>
                        <span className="text-sm text-gray-500 tabular-nums">
                          {formatCurrency(merchant.amount)} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="h-5 bg-gray-100 rounded relative cursor-pointer">
                        <div
                          className="h-full rounded transition-all duration-200 group-hover:brightness-110 group-hover:saturate-150"
                          style={{
                            width: `${barWidth}%`,
                            backgroundColor: data.categoryColor,
                            opacity: 0.7,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}

                {data.topMerchants.length > 5 && (
                  <button
                    onClick={() => setShowAllMerchants(!showAllMerchants)}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mt-3 mx-auto"
                  >
                    {showAllMerchants ? (
                      <>
                        <ChevronUp className="h-4 w-4" />
                        Zwiń
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4" />
                        Pokaż więcej ({data.topMerchants.length - 5})
                      </>
                    )}
                  </button>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">Brak danych</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
