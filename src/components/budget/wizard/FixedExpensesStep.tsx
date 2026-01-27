'use client';

import { Receipt } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { formatCurrency } from '@/lib/utils';
import type { Category, WizardExpenseItem } from '@/types';

interface FixedExpensesStepProps {
  fixedExpenses: WizardExpenseItem[];
  onFixedExpensesChange: (expenses: WizardExpenseItem[]) => void;
  categories: Category[];
  totalIncome: number;
}

// Lista kategorii uznawanych za stałe wydatki (hardcoded na razie)
const FIXED_CATEGORY_NAMES = [
  'Czynsz',
  'Rachunki',
  'Subskrypcje',
  'Ubezpieczenia',
  'Kredyt',
  'Rata',
  'Internet',
  'Telefon',
];

export function FixedExpensesStep({
  fixedExpenses,
  onFixedExpensesChange,
  categories,
  totalIncome,
}: FixedExpensesStepProps) {
  // Filtruj kategorie stałych wydatków
  const fixedCategories = categories.filter(
    (c) =>
      !c.is_savings &&
      FIXED_CATEGORY_NAMES.some((name) =>
        c.name.toLowerCase().includes(name.toLowerCase())
      )
  );

  // Jeśli nie ma żadnych stałych kategorii, pokaż wszystkie nie-oszczędnościowe
  const displayCategories =
    fixedCategories.length > 0
      ? fixedCategories
      : categories.filter((c) => !c.is_savings).slice(0, 5);

  const totalFixed = fixedExpenses.reduce((sum, e) => sum + e.amount, 0);
  const remaining = totalIncome - totalFixed;

  const updateExpense = (categoryId: string, amount: number) => {
    const existing = fixedExpenses.find((e) => e.categoryId === categoryId);
    if (existing) {
      onFixedExpensesChange(
        fixedExpenses.map((e) =>
          e.categoryId === categoryId ? { ...e, amount } : e
        )
      );
    } else {
      onFixedExpensesChange([...fixedExpenses, { categoryId, amount }]);
    }
  };

  const getExpenseAmount = (categoryId: string) => {
    return fixedExpenses.find((e) => e.categoryId === categoryId)?.amount || 0;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Receipt className="mx-auto h-12 w-12 text-orange-600 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900">Wydatki stałe</h3>
        <p className="text-sm text-gray-500 mt-1">
          Wprowadź kwoty dla stałych, powtarzających się wydatków
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {displayCategories.map((category) => (
          <div
            key={category.id}
            className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
          >
            <div
              className="h-10 w-10 rounded-lg flex items-center justify-center text-lg"
              style={{ backgroundColor: `${category.color}20` }}
            >
              {category.icon || '📦'}
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-900">
                {category.name}
              </label>
              <div className="relative mt-1">
                <Input
                  type="number"
                  value={getExpenseAmount(category.id) || ''}
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
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg bg-gray-50 p-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Suma wydatków stałych</span>
          <span className="font-medium text-gray-900">
            {formatCurrency(totalFixed)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Pozostało z przychodów</span>
          <span
            className={`font-medium ${
              remaining >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {formatCurrency(remaining)}
          </span>
        </div>
      </div>
    </div>
  );
}
