'use client';

import { TrendingUp, AlertTriangle, CheckCircle, Loader2, Target } from 'lucide-react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { DynamicIcon } from '../ui/DynamicIcon';
import { formatCurrency, cn } from '@/lib/utils';
import { useForecast, useDailySpending } from '@/hooks/useAnalytics';

interface ForecastCardProps {
  month?: string;
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
      height: 140,
      spacing: [10, 0, 10, 0],
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
      lineColor: 'transparent',
      tickLength: 0,
      plotLines: [{
        value: currentDay - 1,
        color: '#e5e7eb',
        width: 1,
        dashStyle: 'Dash',
        zIndex: 1,
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
        color: '#fca5a5',
        width: 2,
        dashStyle: 'ShortDash',
        zIndex: 2,
      }] : [],
    },
    tooltip: {
      backgroundColor: 'rgba(255, 255, 255, 0.96)',
      borderColor: '#e5e7eb',
      borderRadius: 12,
      shadow: {
        color: 'rgba(0,0,0,0.08)',
        offsetX: 0,
        offsetY: 4,
        width: 12,
      },
      useHTML: true,
      formatter: function () {
        const isProjected = this.series.name === 'Prognoza';
        return `
          <div style="padding: 8px 12px;">
            <div style="font-size: 11px; color: #6b7280; margin-bottom: 4px;">Dzień ${this.x}</div>
            <div style="font-size: 14px; font-weight: 600; color: ${isProjected ? '#8b5cf6' : '#3b82f6'};">
              ${formatCurrency(this.y || 0)}
            </div>
            ${isProjected ? '<div style="font-size: 10px; color: #a78bfa; margin-top: 2px;">prognoza</div>' : ''}
          </div>
        `;
      },
    },
    plotOptions: {
      areaspline: {
        fillOpacity: 0.15,
        marker: {
          enabled: false,
          states: {
            hover: {
              enabled: true,
              radius: 5,
              lineWidth: 2,
              lineColor: '#ffffff',
            },
          },
        },
        lineWidth: 3,
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
            [0, Highcharts.color('#3b82f6').setOpacity(0.25).get('rgba') as string],
            [1, Highcharts.color('#3b82f6').setOpacity(0.02).get('rgba') as string],
          ],
        },
      },
      {
        type: 'areaspline',
        name: 'Prognoza',
        data: projectedData,
        color: '#8b5cf6',
        dashStyle: 'ShortDot',
        lineWidth: 2,
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, Highcharts.color('#8b5cf6').setOpacity(0.15).get('rgba') as string],
            [1, Highcharts.color('#8b5cf6').setOpacity(0.02).get('rgba') as string],
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

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}

function CircularProgress({ percentage, size = 48, strokeWidth = 4 }: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const cappedPercentage = Math.min(percentage, 100);
  const offset = circumference - (cappedPercentage / 100) * circumference;

  const isOverBudget = percentage > 100;
  const color = isOverBudget ? '#ef4444' : percentage > 80 ? '#f59e0b' : '#10b981';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f3f4f6"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-semibold" style={{ color }}>
          {Math.round(percentage)}%
        </span>
      </div>
    </div>
  );
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
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            Prognoza wydatków
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!forecast) {
    return (
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            Prognoza wydatków
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 text-center py-8">
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
  const budgetPercentage = forecast.totalBudget > 0
    ? (forecast.totalProjected / forecast.totalBudget) * 100
    : 0;

  // Determine overall confidence based on categories
  const confidences = forecast.categories.map(c => c.confidence);
  const overallConfidence = confidences.includes('low') ? 'low' :
    confidences.includes('medium') ? 'medium' : 'high';

  // Calculate days in month and current day for chart
  const now = month ? new Date(month + 'T00:00:00') : new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentDay = now.getDate();

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            Prognoza wydatków
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="px-2.5 py-1 bg-gray-100 rounded-full">
              <span className="text-xs font-medium text-gray-600">
                {forecast.percentMonthComplete}% miesiąca
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Main forecast display */}
        <div className="flex items-start justify-between pb-5 mb-5 border-b border-gray-100">
          <div className="space-y-1">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
              Prognoza
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">
                {formatCurrency(forecast.totalProjected)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              <span className="text-xs text-gray-500">
                {formatCurrency(forecast.totalProjectedMin)} - {formatCurrency(forecast.totalProjectedMax)}
              </span>
              <span className="text-xs text-gray-400">
                ({getConfidenceLabel(overallConfidence)})
              </span>
            </div>
          </div>

          {forecast.totalBudget > 0 && (
            <div className="flex items-center gap-3">
              <CircularProgress percentage={budgetPercentage} />
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                  Budżet
                </p>
                <p className="text-lg font-semibold text-gray-700">
                  {formatCurrency(forecast.totalBudget)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Budget status badge */}
        {forecast.totalBudget > 0 && (
          <div className={cn(
            'flex items-center justify-between p-3 rounded-xl mb-4',
            isOverBudget
              ? 'bg-gradient-to-r from-red-50 to-orange-50 border border-red-100'
              : 'bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100'
          )}>
            <div className="flex items-center gap-2">
              {isOverBudget ? (
                <div className="p-1.5 bg-red-100 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                </div>
              ) : (
                <div className="p-1.5 bg-emerald-100 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                </div>
              )}
              <span className={cn(
                'text-sm font-medium',
                isOverBudget ? 'text-red-700' : 'text-emerald-700'
              )}>
                {isOverBudget ? 'Przekroczenie budżetu' : 'W ramach budżetu'}
              </span>
            </div>
            <span className={cn(
              'text-sm font-bold',
              isOverBudget ? 'text-red-600' : 'text-emerald-600'
            )}>
              {budgetDiff! > 0 ? '+' : ''}{formatCurrency(budgetDiff!)}
            </span>
          </div>
        )}

        {/* Sparkline Chart */}
        {dailySpending && dailySpending.length > 0 && !dailyLoading && (
          <div className="mb-4 bg-gradient-to-b from-gray-50/50 to-transparent rounded-xl p-2 -mx-2">
            <SparklineChart
              dailySpending={dailySpending}
              budget={forecast.totalBudget}
              daysInMonth={daysInMonth}
              currentDay={currentDay}
            />
            <div className="flex items-center justify-center gap-4 mt-1 text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 bg-blue-500 rounded" />
                <span>Wydane</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 bg-violet-500 rounded opacity-60" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #8b5cf6 0, #8b5cf6 2px, transparent 2px, transparent 4px)' }} />
                <span>Prognoza</span>
              </div>
              {forecast.totalBudget > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-0.5 bg-red-300 rounded" />
                  <span>Budżet</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Alerts - compact chips */}
        {forecast.alerts.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-1.5 mb-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-medium text-amber-600">
                {forecast.alerts.length} {forecast.alerts.length === 1 ? 'alert' : 'alerty'}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {forecast.alerts.slice(0, 3).map((alert, index) => {
                // Extract category name and amount from alert
                const match = alert.match(/^(.+?) może przekroczyć budżet o ~(\d+)/);
                const categoryName = match ? match[1] : alert.split(' ')[0];
                const amount = match ? match[2] : '';

                return (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700"
                  >
                    <span className="font-medium">{categoryName}</span>
                    {amount && <span className="text-amber-500">+{amount} zł</span>}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Top category forecasts */}
        {forecast.categories.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Top kategorie
            </p>
            <div className="space-y-1">
              {forecast.categories.slice(0, 4).map((cat) => {
                const budgetStatus = cat.vsBudget !== null
                  ? cat.vsBudget > 100 ? 'over' : cat.vsBudget > 90 ? 'near' : 'ok'
                  : null;

                return (
                  <div
                    key={cat.categoryId}
                    className="flex items-center justify-between py-2 px-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {cat.categoryIcon ? (
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"
                          style={{
                            background: `linear-gradient(135deg, ${cat.categoryColor}20, ${cat.categoryColor}10)`,
                            border: `1px solid ${cat.categoryColor}30`
                          }}
                        >
                          <DynamicIcon
                            name={cat.categoryIcon}
                            className="w-4 h-4"
                            style={{ color: cat.categoryColor }}
                          />
                        </div>
                      ) : (
                        <div
                          className="w-8 h-8 rounded-lg flex-shrink-0 shadow-sm"
                          style={{
                            background: `linear-gradient(135deg, ${cat.categoryColor}40, ${cat.categoryColor}20)`,
                          }}
                        />
                      )}
                      <span className="text-sm font-medium text-gray-700 truncate">
                        {cat.categoryName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-right">
                        <span className="text-sm font-semibold text-gray-900 tabular-nums">
                          {formatCurrency(cat.projectedTotal)}
                        </span>
                        <p className="text-xs text-gray-400 tabular-nums">
                          {formatCurrency(cat.projectedMin)} - {formatCurrency(cat.projectedMax)}
                        </p>
                      </div>
                      {budgetStatus === 'over' && (
                        <div className="p-1 bg-red-100 rounded-md">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                        </div>
                      )}
                      {budgetStatus === 'ok' && cat.vsBudget !== null && (
                        <div className="p-1 bg-emerald-100 rounded-md">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center">
            {forecast.daysRemaining === 0
              ? 'Ostatni dzień miesiąca'
              : forecast.daysRemaining === 1
                ? '1 dzień do końca miesiąca'
                : `${forecast.daysRemaining} dni do końca miesiąca`
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
