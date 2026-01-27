'use client';

import { PieChart } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { DynamicIcon } from '@/components/ui/DynamicIcon';
import { cn, formatCurrency } from '@/lib/utils';
import type { Category, WizardExpenseItem } from '@/types';

interface CategoryBudgetsStepProps {
  categoryBudgets: WizardExpenseItem[];
  onCategoryBudgetsChange: (budgets: WizardExpenseItem[]) => void;
  categories: Category[];
  fixedExpenseCategories: string[];
  totalIncome: number;
  totalFixedExpenses: number;
  historicalSpending: Record<string, number>;
}

export function CategoryBudgetsStep({
  categoryBudgets,
  onCategoryBudgetsChange,
  categories,
  fixedExpenseCategories,
  totalIncome,
  totalFixedExpenses,
  historicalSpending,
}: CategoryBudgetsStepProps) {
  // Kategorie do budżetowania = wszystkie poza stałymi i oszczędnościowymi
  const budgetCategories = categories.filter(
    (c) => !c.is_savings && !fixedExpenseCategories.includes(c.id)
  );

  const totalBudgeted = categoryBudgets.reduce((sum, b) => sum + b.amount, 0);
  const available = totalIncome - totalFixedExpenses;
  const remaining = available - totalBudgeted;
  const isOverBudget = remaining < 0;

  const updateBudget = (categoryId: string, amount: number) => {
    const existing = categoryBudgets.find((b) => b.categoryId === categoryId);
    if (existing) {
      onCategoryBudgetsChange(
        categoryBudgets.map((b) =>
          b.categoryId === categoryId ? { ...b, amount } : b
        )
      );
    } else {
      onCategoryBudgetsChange([...categoryBudgets, { categoryId, amount }]);
    }
  };

  const getBudgetAmount = (categoryId: string) => {
    return categoryBudgets.find((b) => b.categoryId === categoryId)?.amount || 0;
  };

  const getHistoricalAmount = (categoryId: string) => {
    return historicalSpending[categoryId] || 0;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <PieChart className="mx-auto h-12 w-12 text-purple-600 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900">Budżety kategorii</h3>
        <p className="text-sm text-gray-500 mt-1">
          Rozdziel pozostałe środki na kategorie wydatków
        </p>
      </div>

      <div
        className={cn('rounded-lg p-4', {
          'bg-green-50': !isOverBudget,
          'bg-red-50': isOverBudget,
        })}
      >
        <div className="flex items-center justify-between">
          <span
            className={cn('text-sm font-medium', {
              'text-green-800': !isOverBudget,
              'text-red-800': isOverBudget,
            })}
          >
            {isOverBudget ? 'Przekroczono budżet o' : 'Pozostało do rozdysponowania'}
          </span>
          <span
            className={cn('text-lg font-bold', {
              'text-green-700': !isOverBudget,
              'text-red-700': isOverBudget,
            })}
          >
            {formatCurrency(Math.abs(remaining))}
          </span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-white/50 overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all', {
              'bg-green-500': !isOverBudget,
              'bg-red-500': isOverBudget,
            })}
            style={{
              width: `${Math.min(100, (totalBudgeted / available) * 100)}%`,
            }}
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          {formatCurrency(totalBudgeted)} z {formatCurrency(available)} (po stałych wydatkach)
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2">
        {budgetCategories.map((category) => {
          const historical = getHistoricalAmount(category.id);
          const budgeted = getBudgetAmount(category.id);
          const historicalPercent =
            historical > 0 && budgeted > 0
              ? Math.min(100, (historical / budgeted) * 100)
              : 0;

          return (
            <div
              key={category.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <div
                className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${category.color}20` }}
              >
                <DynamicIcon
                  name={category.icon}
                  className="w-5 h-5"
                  style={{ color: category.color }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-900 truncate">
                    {category.name}
                  </label>
                  {historical > 0 && (
                    <span className="text-xs text-gray-400 ml-2">
                      avg: {formatCurrency(historical)}
                    </span>
                  )}
                </div>
                <div className="relative mt-1">
                  <Input
                    type="number"
                    value={budgeted || ''}
                    onChange={(e) =>
                      updateBudget(category.id, parseFloat(e.target.value) || 0)
                    }
                    placeholder="0"
                    className="pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                    zł
                  </span>
                </div>
                {historical > 0 && budgeted > 0 && (
                  <div className="mt-1 h-1 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gray-400"
                      style={{ width: `${historicalPercent}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
