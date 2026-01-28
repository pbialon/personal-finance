'use client';

import { TrendingUp, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { DynamicIcon } from '../ui/DynamicIcon';
import { formatCurrency, cn } from '@/lib/utils';
import { useForecast } from '@/hooks/useAnalytics';

interface ForecastCardProps {
  month?: string;
}

export function ForecastCard({ month }: ForecastCardProps) {
  const { forecast, loading } = useForecast(month);

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
  const isNearBudget = budgetDiff !== null && budgetDiff > -100 && budgetDiff <= 0;

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
        {/* Summary */}
        <div className="space-y-3 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Prognozowane wydatki:</span>
            <span className="text-lg font-bold text-gray-900">
              {formatCurrency(forecast.totalProjected)}
            </span>
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
                    <span className="text-sm font-medium text-gray-900 tabular-nums">
                      ~{formatCurrency(cat.projectedTotal)}
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
