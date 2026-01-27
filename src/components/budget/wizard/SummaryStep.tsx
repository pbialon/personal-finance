'use client';

import { CheckCircle, TrendingUp, TrendingDown, PiggyBank, AlertTriangle } from 'lucide-react';
import { DynamicIcon } from '@/components/ui/DynamicIcon';
import { cn, formatCurrency } from '@/lib/utils';
import type { Category, WizardIncomeItem, WizardExpenseItem } from '@/types';

interface SummaryStepProps {
  incomes: WizardIncomeItem[];
  expenses: WizardExpenseItem[];
  categories: Category[];
}

export function SummaryStep({
  incomes,
  expenses,
  categories,
}: SummaryStepProps) {
  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const savings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;

  const getCategory = (id: string) => {
    return categories.find((c) => c.id === id);
  };

  // Przygotuj dane do wykresu (prosty bar chart)
  const barData = [
    { label: 'Przychody', value: totalIncome, color: '#22C55E' },
    { label: 'Wydatki', value: totalExpenses, color: '#8B5CF6' },
    { label: 'Oszczędności', value: Math.max(0, savings), color: '#3B82F6' },
  ];

  const maxValue = Math.max(...barData.map((d) => d.value));

  return (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle className="mx-auto h-12 w-12 text-blue-600 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900">Podsumowanie planu</h3>
        <p className="text-sm text-gray-500 mt-1">
          Sprawdź swój plan budżetowy przed zapisaniem
        </p>
      </div>

      {/* Mini bar chart */}
      <div className="space-y-2">
        {barData.map((bar) => (
          <div key={bar.label} className="flex items-center gap-3">
            <span className="text-sm text-gray-600 w-24">{bar.label}</span>
            <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
              <div
                className="h-full rounded transition-all"
                style={{
                  width: `${maxValue > 0 ? (bar.value / maxValue) * 100 : 0}%`,
                  backgroundColor: bar.color,
                }}
              />
            </div>
            <span className="text-sm font-medium text-gray-900 w-28 text-right">
              {formatCurrency(bar.value)}
            </span>
          </div>
        ))}
      </div>

      {/* Bilans */}
      <div
        className={cn('rounded-lg p-4', {
          'bg-green-50': savings >= 0,
          'bg-red-50': savings < 0,
        })}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {savings >= 0 ? (
              <PiggyBank className="h-5 w-5 text-green-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-600" />
            )}
            <span
              className={cn('font-medium', {
                'text-green-800': savings >= 0,
                'text-red-800': savings < 0,
              })}
            >
              {savings >= 0 ? 'Planowane oszczędności' : 'Planowany niedobór'}
            </span>
          </div>
          <span
            className={cn('text-xl font-bold', {
              'text-green-700': savings >= 0,
              'text-red-700': savings < 0,
            })}
          >
            {formatCurrency(Math.abs(savings))}
          </span>
        </div>
        {savingsRate > 0 && (
          <p className="mt-1 text-sm text-green-600">
            Stopa oszczędności: {savingsRate.toFixed(1)}%
          </p>
        )}
      </div>

      {/* Szczegóły */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-gray-900">Przychody</span>
          </div>
          <div className="space-y-1">
            {incomes.filter(i => i.amount > 0).map((income) => (
              <div key={income.id} className="flex justify-between text-sm">
                <span className="text-gray-600">{income.name}</span>
                <span className="font-medium">{formatCurrency(income.amount)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-gray-900">Wydatki</span>
          </div>
          <div className="text-sm text-gray-600">
            {expenses.filter(e => e.amount > 0).length} kategorii
          </div>
          <div className="text-lg font-semibold text-gray-900 mt-1">
            {formatCurrency(totalExpenses)}
          </div>
        </div>
      </div>

      {/* Wydatki - szczegóły */}
      {expenses.filter(e => e.amount > 0).length > 0 && (
        <div className="rounded-lg border border-gray-200 p-4">
          <span className="text-sm font-medium text-gray-900 mb-3 block">
            Planowane wydatki
          </span>
          <div className="grid grid-cols-2 gap-2 max-h-[150px] overflow-y-auto">
            {expenses.filter(e => e.amount > 0).map((expense) => {
              const cat = getCategory(expense.categoryId);
              return (
                <div
                  key={expense.categoryId}
                  className="flex items-center justify-between text-sm p-2 rounded"
                  style={{ backgroundColor: `${cat?.color || '#9CA3AF'}10` }}
                >
                  <div className="flex items-center gap-1">
                    <DynamicIcon
                      name={cat?.icon || null}
                      className="w-4 h-4"
                      style={{ color: cat?.color }}
                    />
                    <span className="text-gray-700 truncate">
                      {cat?.name || 'Nieznana'}
                    </span>
                  </div>
                  <span className="font-medium">{formatCurrency(expense.amount)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
