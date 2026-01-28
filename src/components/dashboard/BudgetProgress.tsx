'use client';

import { useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
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
      <CardHeader>
        <CardTitle>Budżet miesiąca</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">
                Wykorzystano {formatCurrency(totalActual)} z {formatCurrency(totalPlanned)}
              </span>
              {totalAlertLevel === 'critical' && (
                <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1', totalStyles.badge)}>
                  <AlertTriangle className="w-3 h-3" />
                  Przekroczono!
                </span>
              )}
              {totalAlertLevel === 'warning' && (
                <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', totalStyles.badge)}>
                  {totalPercentage}%
                </span>
              )}
            </div>
            <span className={cn(
              'font-medium',
              totalAlertLevel === 'critical' ? 'text-red-600' :
              totalAlertLevel === 'warning' ? 'text-amber-600' : 'text-gray-900'
            )}>
              {totalPercentage}%
            </span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                totalAlertLevel === 'critical' ? 'bg-red-500' :
                totalAlertLevel === 'warning' ? 'bg-amber-500' : 'bg-blue-500',
                totalStyles.pulse && 'animate-pulse'
              )}
              style={{ width: `${Math.min(totalPercentage, 100)}%` }}
            />
          </div>
        </div>

        {budgets.length > 0 && (
          <div className="space-y-3 mt-4">
            {budgets.slice(0, 5).map((budget) => {
              const alertLevel = getAlertLevel(budget.percentage);
              const styles = getAlertStyles(alertLevel);
              const remaining = budget.planned - budget.actual;

              return (
                <div key={budget.categoryId}>
                  <div className="flex justify-between text-xs mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">{budget.categoryName}</span>
                      {alertLevel === 'critical' && (
                        <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full flex items-center gap-0.5', styles.badge)}>
                          <AlertTriangle className="w-2.5 h-2.5" />
                          Przekroczono!
                        </span>
                      )}
                      {alertLevel === 'warning' && (
                        <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full', styles.badge)}>
                          {budget.percentage}%
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {alertLevel === 'normal' && remaining > 0 && (
                        <span className="text-gray-400 text-[10px]">
                          Zostało {formatCurrency(remaining)}
                        </span>
                      )}
                      <span className={cn(
                        alertLevel === 'critical' ? 'text-red-600' :
                        alertLevel === 'warning' ? 'text-amber-600' : 'text-gray-500'
                      )}>
                        {formatCurrency(budget.actual)} / {formatCurrency(budget.planned)}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        styles.pulse && 'animate-pulse'
                      )}
                      style={{
                        width: `${Math.min(budget.percentage, 100)}%`,
                        backgroundColor: alertLevel === 'critical' ? '#ef4444' :
                                        alertLevel === 'warning' ? '#f59e0b' : budget.categoryColor,
                      }}
                    />
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
