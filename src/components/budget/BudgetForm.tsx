'use client';

import { useState } from 'react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import type { Category, Budget } from '@/types';

interface BudgetFormProps {
  budget?: Budget;
  categories: Category[];
  month: string;
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
  onSubmit,
  onDelete,
  onCancel,
}: BudgetFormProps) {
  const [loading, setLoading] = useState(false);
  const [categoryId, setCategoryId] = useState(budget?.category_id || '');
  const [amount, setAmount] = useState(budget?.planned_amount?.toString() || '');
  const [isIncome, setIsIncome] = useState(budget?.is_income || false);

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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Select
        label="Typ budżetu"
        options={typeOptions}
        value={isIncome ? 'income' : 'expense'}
        onChange={(e) => setIsIncome(e.target.value === 'income')}
      />

      <Select
        label="Kategoria"
        options={categoryOptions}
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
      />

      <Input
        label="Planowana kwota"
        type="number"
        step="0.01"
        min="0"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="0.00"
        required
      />

      <div className="flex gap-2 pt-2">
        {budget && onDelete && (
          <Button
            type="button"
            variant="danger"
            onClick={handleDelete}
            loading={loading}
          >
            Usuń
          </Button>
        )}
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          Anuluj
        </Button>
        <Button type="submit" loading={loading} className="flex-1">
          {budget ? 'Zapisz zmiany' : 'Dodaj budżet'}
        </Button>
      </div>
    </form>
  );
}
