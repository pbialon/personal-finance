'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { formatCurrency, cn } from '@/lib/utils';

interface TrendData {
  month: string;
  income: number;
  expenses: number;
  netSavings: number;
}

interface MonthlyTrendCardProps {
  trends: TrendData[];
}

const SERIES_CONFIG = [
  { key: 'income', name: 'Przychody', color: '#22c55e' },
  { key: 'expenses', name: 'Wydatki', color: '#ef4444' },
  { key: 'netSavings', name: 'Oszczędności netto', color: '#3b82f6' },
] as const;

export function MonthlyTrendCard({ trends }: MonthlyTrendCardProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const chartRef = useRef<HighchartsReact.RefObject>(null);

  const handleLegendHover = useCallback((index: number | null) => {
    setHoveredIndex(index);
    const chart = chartRef.current?.chart;
    if (chart) {
      chart.series.forEach((series, i) => {
        if (index !== null) {
          if (i === index) {
            series.setState('hover');
          } else {
            series.setState('inactive');
          }
        } else {
          series.setState('normal');
        }
      });
    }
  }, []);

  const totals = useMemo(() => {
    return {
      income: trends.reduce((sum, t) => sum + t.income, 0),
      expenses: trends.reduce((sum, t) => sum + t.expenses, 0),
      netSavings: trends.reduce((sum, t) => sum + t.netSavings, 0),
    };
  }, [trends]);

  const options: Highcharts.Options = {
    chart: {
      type: 'column',
      backgroundColor: 'transparent',
      height: 280,
    },
    title: {
      text: undefined,
    },
    xAxis: {
      categories: trends.map((t) => t.month),
      crosshair: true,
      labels: {
        style: {
          fontSize: '12px',
          color: '#6b7280',
        },
      },
      lineColor: '#e5e7eb',
    },
    yAxis: {
      min: 0,
      title: {
        text: undefined,
      },
      labels: {
        formatter: function () {
          const value = this.value as number;
          if (value >= 1000) {
            return `${(value / 1000).toFixed(0)}k zł`;
          }
          return `${value} zł`;
        },
        style: {
          fontSize: '11px',
          color: '#9ca3af',
        },
      },
      gridLineColor: '#f3f4f6',
    },
    tooltip: {
      backgroundColor: 'white',
      borderWidth: 0,
      borderRadius: 8,
      shadow: true,
      style: {
        fontSize: '13px',
      },
      formatter: function () {
        return `<b>${this.series.name}</b><br/>${this.x}: ${formatCurrency(this.y || 0)}`;
      },
    },
    plotOptions: {
      column: {
        pointPadding: 0.15,
        groupPadding: 0.2,
        borderWidth: 0,
        borderRadius: 4,
        states: {
          hover: {
            brightness: 0.1,
          },
          inactive: {
            opacity: 0.3,
          },
        },
      },
    },
    legend: {
      enabled: false,
    },
    series: SERIES_CONFIG.map((config) => ({
      type: 'column' as const,
      name: config.name,
      data: trends.map((t) => t[config.key]),
      color: config.color,
    })),
    credits: {
      enabled: false,
    },
  };

  if (trends.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trend miesięczny</CardTitle>
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
        <CardTitle>Trend miesięczny</CardTitle>
      </CardHeader>
      <CardContent>
        <HighchartsReact highcharts={Highcharts} options={options} ref={chartRef} />

        {/* Custom legend */}
        <div className="mt-2 flex flex-wrap justify-center gap-x-6 gap-y-2">
          {SERIES_CONFIG.map((config, index) => (
            <div
              key={config.key}
              className={cn(
                'flex items-center gap-2 py-1.5 px-3 rounded-lg transition-all duration-150 cursor-pointer',
                hoveredIndex === index
                  ? 'bg-gray-100'
                  : hoveredIndex !== null
                  ? 'opacity-50'
                  : 'hover:bg-gray-50'
              )}
              onMouseEnter={() => handleLegendHover(index)}
              onMouseLeave={() => handleLegendHover(null)}
            >
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: config.color }}
              />
              <span className="text-sm text-gray-700">{config.name}</span>
              <span className="text-sm font-medium text-gray-900 tabular-nums">
                {formatCurrency(totals[config.key])}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
