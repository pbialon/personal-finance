'use client';

import { TrendingUp, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { DynamicIcon } from '../ui/DynamicIcon';
import { formatCurrency, cn } from '@/lib/utils';
import { useForecast, useDailySpending } from '@/hooks/useAnalytics';

interface ForecastCardProps {
  month?: string;
}

interface ForecastRangeBarProps {
  min: number;
  max: number;
  avg: number;
  budget?: number;
  showLabels?: boolean;
}

function ForecastRangeBar({ min, max, avg, budget, showLabels = true }: ForecastRangeBarProps) {
  // Determine scale based on values
  const maxValue = Math.max(max, budget || 0) * 1.1;

  if (maxValue === 0) return null;

  const minPercent = (min / maxValue) * 100;
  const maxPercent = (max / maxValue) * 100;
  const avgPercent = (avg / maxValue) * 100;
  const budgetPercent = budget ? (budget / maxValue) * 100 : null;

  return (
    <div className="space-y-1">
      <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
        {/* Range bar (min to max) */}
        <div
          className="absolute h-full bg-blue-200 rounded-full"
          style={{ left: `${minPercent}%`, width: `${Math.max(maxPercent - minPercent, 2)}%` }}
        />
        {/* Average marker */}
        <div
          className="absolute w-2 h-2 bg-blue-600 rounded-full top-0"
          style={{ left: `${avgPercent}%`, transform: 'translateX(-50%)' }}
        />
        {/* Budget marker */}
        {budgetPercent !== null && (
          <div
            className="absolute w-0.5 h-3 bg-gray-500 -top-0.5"
            style={{ left: `${budgetPercent}%` }}
          />
        )}
      </div>
      {showLabels && (
        <div className="flex justify-between text-xs text-gray-500">
          <span>{formatCurrency(min)}</span>
          <span className="text-gray-700 font-medium">{formatCurrency(avg)}</span>
          <span>{formatCurrency(max)}</span>
        </div>
      )}
    </div>
  );
}

interface SparklineChartProps {
  dailySpending: Array<{ day: number; spent: number; projected: number }>;
  budget: number;
  daysInMonth: number;
  currentDay: number;
}

function SparklineChart({ dailySpending, budget, daysInMonth, currentDay }: SparklineChartProps) {
  // Build cumulative data
  const actualData: (number | null)[] = [];
  const projectedData: (number | null)[] = [];

  let cumulative = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const dayData = dailySpending.find(d => d.day === day);

    if (day <= currentDay) {
      cumulative += dayData?.spent || 0;
      actualData.push(cumulative);
      projectedData.push(null);
    } else {
      actualData.push(null);
      // For projection, continue from last actual cumulative
      cumulative += dayData?.projected || 0;
      projectedData.push(cumulative);
    }
  }

  // Connect actual to projected line
  if (currentDay < daysInMonth && actualData[currentDay - 1] !== null) {
    projectedData[currentDay - 1] = actualData[currentDay - 1];
  }

  const options: Highcharts.Options = {
    chart: {
      type: 'areaspline',
      backgroundColor: 'transparent',
      height: 120,
      spacing: [5, 0, 5, 0],
      style: {
        fontFamily: 'inherit',
      },
    },
    title: {
      text: undefined,
    },
    xAxis: {
      categories: Array.from({ length: daysInMonth }, (_, i) => String(i + 1)),
      labels: {
        enabled: true,
        step: 5,
        style: {
          fontSize: '10px',
          color: '#9ca3af',
        },
      },
      lineColor: '#e5e7eb',
      tickLength: 0,
      plotLines: [{
        value: currentDay - 1,
        color: '#d1d5db',
        width: 1,
        dashStyle: 'Dot',
      }],
    },
    yAxis: {
      title: {
        text: undefined,
      },
      labels: {
        enabled: false,
      },
      gridLineWidth: 0,
      min: 0,
      plotLines: budget > 0 ? [{
        value: budget,
        color: '#ef4444',
        width: 1,
        dashStyle: 'Dash',
        label: {
          text: 'Budżet',
          align: 'right',
          style: {
            fontSize: '9px',
            color: '#ef4444',
          },
        },
      }] : [],
    },
    tooltip: {
      backgroundColor: 'white',
      borderColor: '#e5e7eb',
      borderRadius: 6,
      shadow: true,
      useHTML: true,
      formatter: function () {
        const isProjected = this.series.name === 'Prognoza';
        return `
          <div style="padding: 2px 6px;">
            <div style="font-size: 10px; color: #6b7280;">Dzień ${this.x}</div>
            <div style="font-size: 12px; font-weight: 600; color: ${this.series.color};">
              ${formatCurrency(this.y || 0)}
              ${isProjected ? ' (prognoza)' : ''}
            </div>
          </div>
        `;
      },
    },
    plotOptions: {
      areaspline: {
        fillOpacity: 0.1,
        marker: {
          enabled: false,
          states: {
            hover: {
              enabled: true,
              radius: 3,
            },
          },
        },
        lineWidth: 2,
      },
    },
    legend: {
      enabled: false,
    },
    series: [
      {
        type: 'areaspline',
        name: 'Wydane',
        data: actualData,
        color: '#3b82f6',
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, Highcharts.color('#3b82f6').setOpacity(0.2).get('rgba') as string],
            [1, Highcharts.color('#3b82f6').setOpacity(0.02).get('rgba') as string],
          ],
        },
      },
      {
        type: 'areaspline',
        name: 'Prognoza',
        data: projectedData,
        color: '#93c5fd',
        dashStyle: 'Dot',
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, Highcharts.color('#93c5fd').setOpacity(0.15).get('rgba') as string],
            [1, Highcharts.color('#93c5fd').setOpacity(0.02).get('rgba') as string],
          ],
        },
      },
    ],
    credits: {
      enabled: false,
    },
  };

  return <HighchartsReact highcharts={Highcharts} options={options} />;
}

function getConfidenceLabel(confidence: 'high' | 'medium' | 'low'): string {
  switch (confidence) {
    case 'high':
      return '±10%';
    case 'medium':
      return '±15%';
    case 'low':
      return '±20%';
  }
}

export function ForecastCard({ month }: ForecastCardProps) {
  const { forecast, loading } = useForecast(month);
  const { dailySpending, loading: dailyLoading } = useDailySpending(month);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Prognoza wydatków
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!forecast) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Prognoza wydatków
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 text-center py-4">
            Brak danych do prognozowania
          </p>
        </CardContent>
      </Card>
    );
  }

  const budgetDiff = forecast.totalBudget > 0
    ? forecast.totalProjected - forecast.totalBudget
    : null;

  const isOverBudget = budgetDiff !== null && budgetDiff > 0;

  // Determine overall confidence based on categories (use most common or worst case)
  const confidences = forecast.categories.map(c => c.confidence);
  const overallConfidence = confidences.includes('low') ? 'low' :
    confidences.includes('medium') ? 'medium' : 'high';

  // Calculate days in month and current day for chart
  const now = month ? new Date(month + 'T00:00:00') : new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentDay = now.getDate();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Prognoza wydatków
          </CardTitle>
          <span className="text-xs text-gray-500">
            {forecast.percentMonthComplete}% miesiąca
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary with range - always show range format */}
        <div className="space-y-3 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Prognozowane wydatki:</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900">
                {formatCurrency(forecast.totalProjectedMin)} - {formatCurrency(forecast.totalProjectedMax)}
              </span>
              <span className="text-xs text-gray-400">
                ({getConfidenceLabel(overallConfidence)})
              </span>
            </div>
          </div>

          {/* Range visualization */}
          <div className="py-1">
            <ForecastRangeBar
              min={forecast.totalProjectedMin}
              max={forecast.totalProjectedMax}
              avg={forecast.totalProjected}
              budget={forecast.totalBudget > 0 ? forecast.totalBudget : undefined}
              showLabels={false}
            />
            <div className="flex items-center justify-center mt-1.5">
              <span className="text-xs text-gray-500">
                śr. <span className="font-medium text-gray-700">{formatCurrency(forecast.totalProjected)}</span>
              </span>
            </div>
          </div>

          {forecast.totalBudget > 0 && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Budżet:</span>
                <span className="text-sm font-medium text-gray-700">
                  {formatCurrency(forecast.totalBudget)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Różnica:</span>
                <span className={cn(
                  'text-sm font-bold flex items-center gap-1',
                  isOverBudget ? 'text-red-600' : 'text-green-600'
                )}>
                  {isOverBudget ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  {budgetDiff! > 0 ? '+' : ''}{formatCurrency(budgetDiff!)}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Sparkline Chart */}
        {dailySpending && dailySpending.length > 0 && !dailyLoading && (
          <div className="mb-4 -mx-2">
            <SparklineChart
              dailySpending={dailySpending}
              budget={forecast.totalBudget}
              daysInMonth={daysInMonth}
              currentDay={currentDay}
            />
          </div>
        )}

        {/* Alerts */}
        {forecast.alerts.length > 0 && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                {forecast.alerts.slice(0, 3).map((alert, index) => (
                  <p key={index} className="text-xs text-amber-800">
                    {alert}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Top category forecasts */}
        {forecast.categories.length > 0 && (
          <div className="space-y-2 pt-3 border-t">
            <p className="text-xs font-medium text-gray-500 uppercase">
              Top prognozy
            </p>
            {forecast.categories.slice(0, 4).map((cat) => {
              const budgetStatus = cat.vsBudget !== null
                ? cat.vsBudget > 100 ? 'over' : cat.vsBudget > 90 ? 'near' : 'ok'
                : null;

              return (
                <div key={cat.categoryId} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2 min-w-0">
                    {cat.categoryIcon ? (
                      <div
                        className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: cat.categoryColor + '20' }}
                      >
                        <DynamicIcon
                          name={cat.categoryIcon}
                          className="w-3.5 h-3.5"
                          style={{ color: cat.categoryColor }}
                        />
                      </div>
                    ) : (
                      <div
                        className="w-6 h-6 rounded-md flex-shrink-0"
                        style={{ backgroundColor: cat.categoryColor + '20' }}
                      />
                    )}
                    <span className="text-sm text-gray-700 truncate">
                      {cat.categoryName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-gray-600 tabular-nums">
                      {formatCurrency(cat.projectedMin)} - {formatCurrency(cat.projectedMax)}
                    </span>
                    {budgetStatus === 'over' && (
                      <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                    )}
                    {budgetStatus === 'ok' && cat.vsBudget !== null && (
                      <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Days remaining */}
        <p className="text-xs text-gray-400 text-center mt-3 pt-3 border-t">
          {forecast.daysRemaining} dni do końca miesiąca
        </p>
      </CardContent>
    </Card>
  );
}
