'use client';

import { Wallet } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { DynamicIcon } from '@/components/ui/DynamicIcon';
import { cn, formatCurrency } from '@/lib/utils';
import type { Category, WizardExpenseItem } from '@/types';

interface ExpensesStepProps {
  expenses: WizardExpenseItem[];
  onExpensesChange: (expenses: WizardExpenseItem[]) => void;
  categories: Category[];
  totalIncome: number;
  previousMonthSpending: Record<string, number>;
}

export function ExpensesStep({
  expenses,
  onExpensesChange,
  categories,
  totalIncome,
  previousMonthSpending,
}: ExpensesStepProps) {
  // Wszystkie kategorie wydatków (bez oszczędnościowych)
  const expenseCategories = categories.filter((c) => !c.is_savings);

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const remaining = totalIncome - totalExpenses;
  const isOverBudget = remaining < 0;

  const updateExpense = (categoryId: string, amount: number) => {
    const existing = expenses.find((e) => e.categoryId === categoryId);
    if (existing) {
      onExpensesChange(
        expenses.map((e) =>
          e.categoryId === categoryId ? { ...e, amount } : e
        )
      );
    } else {
      onExpensesChange([...expenses, { categoryId, amount }]);
    }
  };

  const getExpenseAmount = (categoryId: string) => {
    return expenses.find((e) => e.categoryId === categoryId)?.amount || 0;
  };

  const getPreviousAmount = (categoryId: string) => {
    return previousMonthSpending[categoryId] || 0;
  };

  const handleUsePreviousMonth = (categoryId: string) => {
    const previousAmount = getPreviousAmount(categoryId);
    if (previousAmount > 0) {
      updateExpense(categoryId, previousAmount);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Wallet className="mx-auto h-12 w-12 text-purple-600 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900">Wydatki</h3>
        <p className="text-sm text-gray-500 mt-1">
          Zaplanuj budżet dla każdej kategorii wydatków
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
              width: `${Math.min(100, totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0)}%`,
            }}
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          {formatCurrency(totalExpenses)} z {formatCurrency(totalIncome)}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 max-h-[350px] overflow-y-auto pr-2">
        {expenseCategories.map((category) => {
          const previousAmount = getPreviousAmount(category.id);
          const currentAmount = getExpenseAmount(category.id);

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
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="relative flex-1">
                    <Input
                      type="number"
                      value={currentAmount || ''}
                      onChange={(e) =>
                        updateExpense(category.id, parseFloat(e.target.value) || 0)
                      }
                      placeholder="0"
                      className="pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                      zł
                    </span>
                  </div>
                  {previousAmount > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUsePreviousMonth(category.id)}
                      className="text-xs whitespace-nowrap px-2 py-1 h-auto text-gray-500 hover:text-gray-700"
                      title="Użyj kwoty z poprzedniego miesiąca"
                    >
                      Poprz: {formatCurrency(previousAmount)}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
