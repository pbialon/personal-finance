'use client';

import { useState, useMemo } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { formatCurrency, cn } from '@/lib/utils';
import type { CategorySpending } from '@/types';

interface CategorySpendingCardProps {
  spending: CategorySpending[];
}

export function CategorySpendingCard({ spending }: CategorySpendingCardProps) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const total = useMemo(
    () => spending.reduce((sum, s) => sum + s.amount, 0),
    [spending]
  );

  const chartData = useMemo(
    () =>
      spending.map((s) => ({
        name: s.categoryName,
        y: s.amount,
        color: s.categoryColor,
        id: s.categoryId,
      })),
    [spending]
  );

  const options: Highcharts.Options = {
    chart: {
      type: 'pie',
      backgroundColor: 'transparent',
      height: 280,
      animation: {
        duration: 300,
      },
    },
    title: {
      text: undefined,
    },
    tooltip: {
      backgroundColor: 'white',
      borderWidth: 0,
      borderRadius: 12,
      shadow: {
        color: 'rgba(0,0,0,0.1)',
        offsetX: 0,
        offsetY: 4,
        width: 16,
      },
      style: {
        fontSize: '13px',
      },
      pointFormat:
        '<span style="color:{point.color}">\u25CF</span> <b>{point.name}</b><br/>' +
        '<span style="font-size: 15px; font-weight: 600;">{point.y:,.2f} zł</span><br/>' +
        '<span style="color: #6b7280;">{point.percentage:.1f}% wydatków</span>',
    },
    plotOptions: {
      pie: {
        innerSize: '65%',
        borderWidth: 0,
        cursor: 'pointer',
        dataLabels: {
          enabled: false,
        },
        showInLegend: false,
        states: {
          hover: {
            brightness: 0.05,
            halo: {
              size: 8,
              opacity: 0.25,
            },
          },
          inactive: {
            opacity: 0.4,
          },
        },
        point: {
          events: {
            mouseOver: function () {
              setHoveredCategory(this.options.id as string);
            },
            mouseOut: function () {
              setHoveredCategory(null);
            },
          },
        },
      },
    },
    series: [
      {
        type: 'pie',
        name: 'Wydatki',
        data: chartData,
      },
    ],
    credits: {
      enabled: false,
    },
  };

  if (spending.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Wydatki per kategoria</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500 py-8">Brak danych</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Wydatki per kategoria</CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        {/* Chart with center text */}
        <div className="relative">
          <HighchartsReact highcharts={Highcharts} options={options} />
          {/* Center text */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center -mt-2">
              <p className="text-2xl font-bold text-gray-900 tabular-nums">
                {formatCurrency(total)}
              </p>
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                Suma
              </p>
            </div>
          </div>
        </div>

        {/* Custom legend */}
        <div className="mt-4 space-y-1.5">
          {spending.map((item) => (
            <button
              key={item.categoryId}
              type="button"
              className={cn(
                'w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200',
                hoveredCategory === item.categoryId
                  ? 'bg-gray-100 scale-[1.02]'
                  : 'hover:bg-gray-50'
              )}
              onMouseEnter={() => setHoveredCategory(item.categoryId)}
              onMouseLeave={() => setHoveredCategory(null)}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.categoryColor }}
                />
                <span
                  className={cn(
                    'text-sm font-medium transition-colors',
                    hoveredCategory === item.categoryId
                      ? 'text-gray-900'
                      : 'text-gray-700'
                  )}
                >
                  {item.categoryName}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'text-sm font-semibold tabular-nums transition-colors',
                    hoveredCategory === item.categoryId
                      ? 'text-gray-900'
                      : 'text-gray-600'
                  )}
                >
                  {formatCurrency(item.amount)}
                </span>
                <span
                  className={cn(
                    'text-xs tabular-nums px-2 py-0.5 rounded-full transition-all',
                    hoveredCategory === item.categoryId
                      ? 'bg-gray-200 text-gray-700'
                      : 'bg-gray-100 text-gray-500'
                  )}
                >
                  {item.percentage.toFixed(1)}%
                </span>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
