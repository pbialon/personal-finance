'use client';

import { useMemo } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { formatCurrency } from '@/lib/utils';
import type { CategorySpending } from '@/types';

interface CategorySpendingCardProps {
  spending: CategorySpending[];
}

export function CategorySpendingCard({ spending }: CategorySpendingCardProps) {
  const chartData = useMemo(
    () =>
      spending.map((s) => ({
        name: s.categoryName,
        y: s.amount,
        color: s.categoryColor,
      })),
    [spending]
  );

  const options: Highcharts.Options = {
    chart: {
      type: 'pie',
      backgroundColor: 'transparent',
      height: 300,
    },
    title: {
      text: undefined,
    },
    tooltip: {
      pointFormat: '<b>{point.name}</b><br/>{point.y:.2f} PLN ({point.percentage:.1f}%)',
    },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: 'pointer',
        dataLabels: {
          enabled: true,
          format: '<b>{point.name}</b>: {point.percentage:.1f}%',
          style: {
            fontSize: '11px',
            fontWeight: '500',
            textOutline: 'none',
          },
        },
        showInLegend: false,
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
    <Card>
      <CardHeader>
        <CardTitle>Wydatki per kategoria</CardTitle>
      </CardHeader>
      <CardContent>
        <HighchartsReact highcharts={Highcharts} options={options} />

        {/* Compact legend */}
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
          {spending.map((item) => (
            <div
              key={item.categoryId}
              className="flex items-center justify-between py-1"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.categoryColor }}
                />
                <span className="text-sm text-gray-700 truncate">
                  {item.categoryName}
                </span>
              </div>
              <span className="text-sm font-medium text-gray-900 tabular-nums ml-2">
                {formatCurrency(item.amount)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
