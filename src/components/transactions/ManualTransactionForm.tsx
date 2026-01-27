'use client';

import { useState } from 'react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import type { Category } from '@/types';

interface ManualTransactionFormProps {
  categories: Category[];
  onSubmit: (data: {
    amount: number;
    description: string;
    category_id: string;
    transaction_date: string;
    is_income: boolean;
  }) => Promise<void>;
  onCancel: () => void;
}

export function ManualTransactionForm({
  categories,
  onSubmit,
  onCancel,
}: ManualTransactionFormProps) {
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isIncome, setIsIncome] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description || !categoryId) return;

    setLoading(true);
    try {
      await onSubmit({
        amount: parseFloat(amount),
        description,
        category_id: categoryId,
        transaction_date: date,
        is_income: isIncome,
      });
    } finally {
      setLoading(false);
    }
  };

  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  const typeOptions = [
    { value: 'expense', label: 'Wydatek' },
    { value: 'income', label: 'Przychód' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
        placeholder="0.00"
        required
      />

      <Input
        label="Opis"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="np. Zakupy w sklepie"
        required
      />

      <Select
        label="Kategoria"
        options={[{ value: '', label: 'Wybierz kategorię' }, ...categoryOptions]}
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        required
      />

      <Input
        label="Data"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        required
      />

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          Anuluj
        </Button>
        <Button type="submit" loading={loading} className="flex-1">
          Dodaj transakcję
        </Button>
      </div>
    </form>
  );
}
