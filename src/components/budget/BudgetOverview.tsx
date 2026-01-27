'use client';

import { Card, CardContent } from '../ui/Card';
import { DynamicIcon } from '../ui/DynamicIcon';
import { formatCurrency, cn } from '@/lib/utils';
import type { Budget, Category } from '@/types';

interface BudgetOverviewProps {
  budgets: Budget[];
  categories: Category[];
  actualSpending: Record<string, number>;
  onEdit: (budget: Budget) => void;
}

export function BudgetOverview({
  budgets,
  categories,
  actualSpending,
  onEdit,
}: BudgetOverviewProps) {
  const getCategoryById = (id: string | null) =>
    categories.find((c) => c.id === id);

  if (budgets.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-500">Nie ustawiono żadnych budżetów</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {budgets.map((budget) => {
        const category = getCategoryById(budget.category_id);
        const actual = actualSpending[budget.category_id || 'total'] || 0;
        const percentage = budget.planned_amount > 0
          ? Math.round((actual / budget.planned_amount) * 100)
          : 0;

        return (
          <Card
            key={budget.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onEdit(budget)}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${category?.color || '#6b7280'}20` }}
                >
                  <DynamicIcon
                    name={category?.icon || (budget.is_income ? 'wallet' : 'circle-dot')}
                    className="w-5 h-5"
                    style={{ color: category?.color || '#6b7280' }}
                  />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    {category?.name || 'Budżet ogólny'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {budget.is_income ? 'Przychód' : 'Wydatek'}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {formatCurrency(actual)} / {formatCurrency(budget.planned_amount)}
                  </span>
                  <span className={cn(
                    'font-medium',
                    percentage > 100 ? 'text-red-600' : 'text-gray-900'
                  )}>
                    {percentage}%
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      percentage > 100 ? 'bg-red-500' : ''
                    )}
                    style={{
                      width: `${Math.min(percentage, 100)}%`,
                      backgroundColor: percentage > 100 ? undefined : category?.color || '#3b82f6',
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
