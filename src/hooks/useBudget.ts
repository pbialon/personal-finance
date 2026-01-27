'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Budget } from '@/types';

interface UseBudgetResult {
  budgets: Budget[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  addBudget: (data: {
    category_id: string | null;
    planned_amount: number;
    is_income: boolean;
    month: string;
  }) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
}

export function useBudget(month?: string): UseBudgetResult {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (month) params.append('month', month);

      const response = await fetch(`/api/budget?${params}`);
      if (!response.ok) throw new Error('Failed to fetch budgets');

      const data = await response.json();
      setBudgets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const addBudget = async (data: {
    category_id: string | null;
    planned_amount: number;
    is_income: boolean;
    month: string;
  }) => {
    const response = await fetch('/api/budget', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error('Failed to add budget');

    await fetchBudgets();
  };

  const deleteBudget = async (id: string) => {
    const response = await fetch(`/api/budget?id=${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) throw new Error('Failed to delete budget');

    setBudgets((prev) => prev.filter((b) => b.id !== id));
  };

  return {
    budgets,
    loading,
    error,
    refresh: fetchBudgets,
    addBudget,
    deleteBudget,
  };
}
