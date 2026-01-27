'use client';

import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { formatCurrency, cn } from '@/lib/utils';
import type { BudgetProgress } from '@/types';

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
  const totalPercentage = totalPlanned > 0
    ? Math.round((totalActual / totalPlanned) * 100)
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budżet miesiąca</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">
              Wykorzystano {formatCurrency(totalActual)} z {formatCurrency(totalPlanned)}
            </span>
            <span className={cn(
              'font-medium',
              totalPercentage > 100 ? 'text-red-600' : 'text-gray-900'
            )}>
              {totalPercentage}%
            </span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                totalPercentage > 100 ? 'bg-red-500' : 'bg-blue-500'
              )}
              style={{ width: `${Math.min(totalPercentage, 100)}%` }}
            />
          </div>
        </div>

        {budgets.length > 0 && (
          <div className="space-y-3 mt-4">
            {budgets.slice(0, 5).map((budget) => (
              <div key={budget.categoryId}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600">{budget.categoryName}</span>
                  <span className={cn(
                    budget.percentage > 100 ? 'text-red-600' : 'text-gray-500'
                  )}>
                    {formatCurrency(budget.actual)} / {formatCurrency(budget.planned)}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(budget.percentage, 100)}%`,
                      backgroundColor: budget.percentage > 100 ? '#ef4444' : budget.categoryColor,
                    }}
                  />
                </div>
              </div>
            ))}
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
