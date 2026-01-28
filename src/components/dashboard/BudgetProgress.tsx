'use client';

import { useEffect, useRef } from 'react';
import { Wallet, AlertTriangle, CheckCircle, TrendingDown } from 'lucide-react';
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

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}

function CircularProgress({ percentage, size = 56, strokeWidth = 5 }: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const cappedPercentage = Math.min(percentage, 100);
  const offset = circumference - (cappedPercentage / 100) * circumference;

  const isOverBudget = percentage >= 100;
  const isWarning = percentage >= 80 && percentage < 100;
  const color = isOverBudget ? '#ef4444' : isWarning ? '#f59e0b' : '#3b82f6';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f3f4f6"
          strokeWidth={strokeWidth}
        />
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
        <span className="text-sm font-bold" style={{ color }}>
          {Math.round(percentage)}%
        </span>
      </div>
    </div>
  );
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
  const remaining = totalPlanned - totalActual;
  const isOverBudget = remaining < 0;

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
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="p-1.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            Budżet miesiąca
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Total budget summary */}
        <div className="flex items-start justify-between pb-5 mb-5 border-b border-gray-100">
          <div className="space-y-1">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
              Wykorzystano
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">
                {formatCurrency(totalActual)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="h-1.5 w-1.5 rounded-full bg-gray-400" />
              <span className="text-xs text-gray-500">
                z {formatCurrency(totalPlanned)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <CircularProgress percentage={totalPercentage} />
          </div>
        </div>

        {/* Budget status badge */}
        <div className={cn(
          'flex items-center justify-between p-3 rounded-xl mb-4',
          totalAlertLevel === 'critical'
            ? 'bg-gradient-to-r from-red-50 to-orange-50 border border-red-100'
            : totalAlertLevel === 'warning'
              ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-100'
              : 'bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100'
        )}>
          <div className="flex items-center gap-2">
            {totalAlertLevel === 'critical' ? (
              <div className="p-1.5 bg-red-100 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-red-600" />
              </div>
            ) : totalAlertLevel === 'warning' ? (
              <div className="p-1.5 bg-amber-100 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
            ) : (
              <div className="p-1.5 bg-emerald-100 rounded-lg">
                <TrendingDown className="w-4 h-4 text-emerald-600" />
              </div>
            )}
            <span className={cn(
              'text-sm font-medium',
              totalAlertLevel === 'critical' ? 'text-red-700' :
              totalAlertLevel === 'warning' ? 'text-amber-700' : 'text-emerald-700'
            )}>
              {totalAlertLevel === 'critical' ? 'Przekroczono budżet' :
               totalAlertLevel === 'warning' ? 'Zbliżasz się do limitu' : 'Zostało do wydania'}
            </span>
          </div>
          <span className={cn(
            'text-sm font-bold',
            totalAlertLevel === 'critical' ? 'text-red-600' :
            totalAlertLevel === 'warning' ? 'text-amber-600' : 'text-emerald-600'
          )}>
            {isOverBudget ? '+' : ''}{formatCurrency(Math.abs(remaining))}
          </span>
        </div>

        {/* Category budgets */}
        {budgets.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Kategorie
            </p>
            <div className="space-y-1">
              {budgets.slice(0, 5).map((budget) => {
                const alertLevel = getAlertLevel(budget.percentage);
                const categoryRemaining = budget.planned - budget.actual;
                const barColor = alertLevel === 'critical' ? '#ef4444' :
                                alertLevel === 'warning' ? '#f59e0b' : budget.categoryColor;

                return (
                  <div
                    key={budget.categoryId}
                    className="py-2 px-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      {/* Category icon */}
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"
                        style={{
                          background: `linear-gradient(135deg, ${budget.categoryColor}20, ${budget.categoryColor}10)`,
                          border: `1px solid ${budget.categoryColor}30`
                        }}
                      >
                        <DynamicIcon
                          name={budget.categoryIcon || 'circle-dot'}
                          className="w-4 h-4"
                          style={{ color: budget.categoryColor }}
                        />
                      </div>

                      {/* Category details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">
                              {budget.categoryName}
                            </span>
                            {alertLevel === 'critical' && (
                              <div className="p-0.5 bg-red-100 rounded">
                                <AlertTriangle className="w-3 h-3 text-red-500" />
                              </div>
                            )}
                            {alertLevel === 'normal' && budget.percentage <= 50 && (
                              <div className="p-0.5 bg-emerald-100 rounded">
                                <CheckCircle className="w-3 h-3 text-emerald-500" />
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-semibold text-gray-900 tabular-nums">
                              {formatCurrency(budget.actual)}
                            </span>
                            <span className="text-xs text-gray-400 ml-1">
                              / {formatCurrency(budget.planned)}
                            </span>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(budget.percentage, 100)}%`,
                              backgroundColor: barColor,
                            }}
                          />
                        </div>

                        {/* Status text */}
                        <div className="flex justify-between items-center mt-1">
                          <span className={cn(
                            'text-xs',
                            alertLevel === 'critical' ? 'text-red-500' :
                            alertLevel === 'warning' ? 'text-amber-500' : 'text-gray-400'
                          )}>
                            {alertLevel === 'critical'
                              ? `Przekroczono o ${formatCurrency(Math.abs(categoryRemaining))}`
                              : alertLevel === 'warning'
                                ? `${budget.percentage}% wykorzystane`
                                : categoryRemaining > 0
                                  ? `Zostało ${formatCurrency(categoryRemaining)}`
                                  : ''}
                          </span>
                          <span className={cn(
                            'text-xs font-medium tabular-nums',
                            alertLevel === 'critical' ? 'text-red-500' :
                            alertLevel === 'warning' ? 'text-amber-500' : 'text-gray-400'
                          )}>
                            {budget.percentage}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {budgets.length === 0 && (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">
              Nie ustawiono budżetu na ten miesiąc
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
