'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { DynamicIcon } from '../ui/DynamicIcon';
import { formatCurrency } from '@/lib/utils';
import type { Category, Budget } from '@/types';

interface BudgetFormProps {
  budget?: Budget;
  categories: Category[];
  month: string;
  actualSpending?: number;
  onSubmit: (data: {
    category_id: string | null;
    planned_amount: number;
    is_income: boolean;
    month: string;
  }) => Promise<void>;
  onDelete?: () => Promise<void>;
  onCancel: () => void;
}

export function BudgetForm({
  budget,
  categories,
  month,
  actualSpending,
  onSubmit,
  onDelete,
  onCancel,
}: BudgetFormProps) {
  const [loading, setLoading] = useState(false);
  const [categoryId, setCategoryId] = useState(budget?.category_id || '');
  const [amount, setAmount] = useState(budget?.planned_amount?.toString() || '');
  const [isIncome, setIsIncome] = useState(budget?.is_income || false);

  const selectedCategory = categories.find(c => c.id === categoryId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    setLoading(true);
    try {
      await onSubmit({
        category_id: categoryId || null,
        planned_amount: parseFloat(amount),
        is_income: isIncome,
        month,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || !confirm('Czy na pewno chcesz usunąć ten budżet?')) return;
    setLoading(true);
    try {
      await onDelete();
    } finally {
      setLoading(false);
    }
  };

  const categoryOptions = [
    { value: '', label: 'Budżet ogólny (wszystkie kategorie)' },
    ...categories
      .filter((c) => !c.is_savings)
      .map((c) => ({ value: c.id, label: c.name })),
  ];

  const typeOptions = [
    { value: 'expense', label: 'Wydatek' },
    { value: 'income', label: 'Przychód' },
  ];

  // Calculate percentage if editing
  const percentage = budget && actualSpending !== undefined && budget.planned_amount > 0
    ? Math.round((actualSpending / budget.planned_amount) * 100)
    : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Category header when editing */}
      {budget && (
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl -mt-2">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${selectedCategory?.color || '#6b7280'}20` }}
          >
            <DynamicIcon
              name={selectedCategory?.icon || (isIncome ? 'wallet' : 'circle-dot')}
              className="w-6 h-6"
              style={{ color: selectedCategory?.color || '#6b7280' }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">
              {selectedCategory?.name || 'Budżet ogólny'}
            </h3>
            {actualSpending !== undefined && (
              <p className="text-sm text-gray-500">
                Wydano: <span className="font-medium text-gray-700">{formatCurrency(actualSpending)}</span>
                {percentage !== null && (
                  <span className={percentage > 100 ? 'text-red-600 ml-1' : 'text-gray-500 ml-1'}>
                    ({percentage}%)
                  </span>
                )}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Form fields */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Typ"
            options={typeOptions}
            value={isIncome ? 'income' : 'expense'}
            onChange={(e) => setIsIncome(e.target.value === 'income')}
          />

          <Input
            label="Kwota"
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0,00 zł"
            required
          />
        </div>

        {!budget && (
          <Select
            label="Kategoria"
            options={categoryOptions}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          />
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        {budget && onDelete && (
          <Button
            type="button"
            variant="ghost"
            onClick={handleDelete}
            loading={loading}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Usuń
          </Button>
        )}
        <div className="flex-1" />
        <Button type="button" variant="secondary" onClick={onCancel}>
          Anuluj
        </Button>
        <Button type="submit" loading={loading}>
          {budget ? 'Zapisz' : 'Dodaj'}
        </Button>
      </div>
    </form>
  );
}
