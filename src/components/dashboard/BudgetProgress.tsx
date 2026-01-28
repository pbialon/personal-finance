'use client';

import { useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { DynamicIcon } from '../ui/DynamicIcon';
import { formatCurrency, cn } from '@/lib/utils';
import { useToast } from '@/contexts/ToastContext';
import type { BudgetProgress } from '@/types';

type AlertLevel = 'normal' | 'warning' | 'critical';

function getAlertLevel(percentage: number): AlertLevel {
  if (percentage >= 100) return 'critical';
  if (percentage >= 80) return 'warning';
  return 'normal';
}

function getAlertStyles(level: AlertLevel) {
  switch (level) {
    case 'critical':
      return {
        badge: 'bg-red-100 text-red-700',
        text: 'text-red-600',
        bar: 'bg-red-500',
        pulse: true,
      };
    case 'warning':
      return {
        badge: 'bg-amber-100 text-amber-700',
        text: 'text-amber-600',
        bar: 'bg-amber-500',
        pulse: false,
      };
    default:
      return {
        badge: '',
        text: 'text-gray-500',
        bar: '',
        pulse: false,
      };
  }
}

interface BudgetProgressProps {
  budgets: BudgetProgress[];
  totalPlanned: number;
  totalActual: number;
}

export function BudgetProgressCard({
  budgets,
  totalPlanned,
  totalActual,
}: BudgetProgressProps) {
  const { showToast } = useToast();
  const alertsShownRef = useRef(false);

  const totalPercentage = totalPlanned > 0
    ? Math.round((totalActual / totalPlanned) * 100)
    : 0;

  const totalAlertLevel = getAlertLevel(totalPercentage);
  const totalStyles = getAlertStyles(totalAlertLevel);

  // Show toast notifications for budget alerts
  useEffect(() => {
    if (alertsShownRef.current || budgets.length === 0) return;
    alertsShownRef.current = true;

    budgets.forEach((budget) => {
      if (budget.percentage >= 100) {
        showToast({
          type: 'error',
          message: `Przekroczono budżet: ${budget.categoryName}`,
          duration: 6000,
        });
      } else if (budget.percentage >= 80) {
        showToast({
          type: 'warning',
          message: `${budget.categoryName}: ${budget.percentage}% budżetu wykorzystane`,
          duration: 5000,
        });
      }
    });
  }, [budgets, showToast]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Budżet miesiąca</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Total budget summary */}
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl mb-6">
          {/* Circular progress */}
          <div className="relative w-16 h-16 flex-shrink-0">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-gray-200"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={cn(
                  totalAlertLevel === 'critical' ? 'text-red-500' :
                  totalAlertLevel === 'warning' ? 'text-amber-500' : 'text-blue-500'
                )}
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
                strokeDasharray={`${Math.min(totalPercentage, 100)}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={cn(
                'text-sm font-bold',
                totalAlertLevel === 'critical' ? 'text-red-600' :
                totalAlertLevel === 'warning' ? 'text-amber-600' : 'text-gray-900'
              )}>
                {totalPercentage}%
              </span>
            </div>
          </div>

          {/* Summary text */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-gray-900">Wykorzystano</span>
              {totalAlertLevel === 'critical' && (
                <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1', totalStyles.badge)}>
                  <AlertTriangle className="w-3 h-3" />
                  Przekroczono!
                </span>
              )}
            </div>
            <p className="text-lg font-bold text-gray-900">
              {formatCurrency(totalActual)}
              <span className="text-sm font-normal text-gray-500 ml-1">
                z {formatCurrency(totalPlanned)}
              </span>
            </p>
            {totalPlanned > totalActual && (
              <p className="text-xs text-gray-500 mt-0.5">
                Zostało {formatCurrency(totalPlanned - totalActual)}
              </p>
            )}
          </div>
        </div>

        {/* Category budgets */}
        {budgets.length > 0 && (
          <div className="space-y-4">
            {budgets.slice(0, 5).map((budget) => {
              const alertLevel = getAlertLevel(budget.percentage);
              const styles = getAlertStyles(alertLevel);
              const remaining = budget.planned - budget.actual;
              const barColor = alertLevel === 'critical' ? '#ef4444' :
                              alertLevel === 'warning' ? '#f59e0b' : budget.categoryColor;

              return (
                <div key={budget.categoryId} className="group">
                  <div className="flex items-center gap-3 mb-2">
                    {/* Category icon */}
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${budget.categoryColor}20` }}
                    >
                      <DynamicIcon
                        name={budget.categoryIcon || 'circle-dot'}
                        className="w-4 h-4"
                        style={{ color: budget.categoryColor }}
                      />
                    </div>

                    {/* Category name and progress */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">
                            {budget.categoryName}
                          </span>
                          {alertLevel === 'critical' && (
                            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                          )}
                        </div>
                        <span className={cn(
                          'text-sm tabular-nums',
                          alertLevel === 'critical' ? 'text-red-600 font-semibold' :
                          alertLevel === 'warning' ? 'text-amber-600 font-medium' : 'text-gray-600'
                        )}>
                          {formatCurrency(budget.actual)}
                          <span className="text-gray-400"> / {formatCurrency(budget.planned)}</span>
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-500',
                            styles.pulse && 'animate-pulse'
                          )}
                          style={{
                            width: `${Math.min(budget.percentage, 100)}%`,
                            backgroundColor: barColor,
                          }}
                        />
                      </div>

                      {/* Remaining text */}
                      {alertLevel === 'normal' && remaining > 0 && (
                        <p className="text-xs text-gray-400 mt-1">
                          Zostało {formatCurrency(remaining)}
                        </p>
                      )}
                      {alertLevel !== 'normal' && (
                        <p className={cn(
                          'text-xs mt-1',
                          alertLevel === 'critical' ? 'text-red-500' : 'text-amber-500'
                        )}>
                          {alertLevel === 'critical'
                            ? `Przekroczono o ${formatCurrency(Math.abs(remaining))}`
                            : `${budget.percentage}% wykorzystane`}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {budgets.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">
            Nie ustawiono budżetu na ten miesiąc
          </p>
        )}
      </CardContent>
    </Card>
  );
}
