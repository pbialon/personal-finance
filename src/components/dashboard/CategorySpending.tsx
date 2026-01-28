'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { PieChart } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { formatCurrency, cn } from '@/lib/utils';
import type { CategorySpending } from '@/types';

interface CategorySpendingCardProps {
  spending: CategorySpending[];
}

export function CategorySpendingCard({ spending }: CategorySpendingCardProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const chartRef = useRef<HighchartsReact.RefObject>(null);

  const handleLegendClick = useCallback((index: number) => {
    const chart = chartRef.current?.chart;
    if (chart && chart.series[0]) {
      const point = chart.series[0].points[index];
      if (point) {
        point.select(undefined, true);
      }
    }
  }, []);

  const handleLegendHover = useCallback((index: number | null) => {
    setHoveredIndex(index);
    const chart = chartRef.current?.chart;
    if (chart && chart.series[0]) {
      const points = chart.series[0].points;
      if (index !== null && points[index]) {
        points[index].setState('hover');
        chart.tooltip.refresh(points[index]);
      } else {
        points.forEach((point) => point.setState(''));
        chart.tooltip.hide();
      }
    }
  }, []);

  const chartData = useMemo(
    () =>
      spending.map((s, index) => ({
        name: s.categoryName,
        y: s.amount,
        color: s.categoryColor,
        index,
      })),
    [spending]
  );

  const options: Highcharts.Options = {
    chart: {
      type: 'pie',
      backgroundColor: 'transparent',
      height: 280,
    },
    title: {
      text: undefined,
    },
    tooltip: {
      backgroundColor: 'white',
      borderWidth: 0,
      borderRadius: 8,
      shadow: true,
      style: {
        fontSize: '13px',
      },
      pointFormat: '<b>{point.name}</b><br/>{point.y:,.2f} zł ({point.percentage:.1f}%)',
    },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: 'pointer',
        dataLabels: {
          enabled: false,
        },
        showInLegend: false,
        states: {
          hover: {
            brightness: 0.1,
            halo: {
              size: 5,
            },
          },
          inactive: {
            opacity: 0.5,
          },
        },
        point: {
          events: {
            mouseOver: function () {
              setHoveredIndex((this.options as { index: number }).index);
            },
            mouseOut: function () {
              setHoveredIndex(null);
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
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="p-1.5 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg">
              <PieChart className="w-4 h-4 text-white" />
            </div>
            Wydatki per kategoria
          </CardTitle>
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
        <CardTitle className="flex items-center gap-2 text-base">
            <div className="p-1.5 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg">
              <PieChart className="w-4 h-4 text-white" />
            </div>
            Wydatki per kategoria
          </CardTitle>
      </CardHeader>
      <CardContent>
        <HighchartsReact highcharts={Highcharts} options={options} ref={chartRef} />

        {/* Compact legend */}
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-0.5">
          {spending.map((item, index) => (
            <div
              key={item.categoryId}
              className={cn(
                'flex items-center justify-between py-1.5 px-2 rounded-lg transition-all duration-150 cursor-pointer',
                hoveredIndex === index
                  ? 'bg-gray-100'
                  : hoveredIndex !== null
                  ? 'opacity-50'
                  : 'hover:bg-gray-50'
              )}
              onMouseEnter={() => handleLegendHover(index)}
              onMouseLeave={() => handleLegendHover(null)}
              onClick={() => handleLegendClick(index)}
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
