'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Transaction, TransactionFilters } from '@/types';

interface UseTransactionsResult {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  count: number;
  refresh: () => void;
  updateCategory: (transactionId: string, categoryId: string) => Promise<void>;
  updateDescription: (transactionId: string, description: string) => Promise<void>;
  addTransaction: (data: {
    amount: number;
    description: string;
    category_id: string;
    transaction_date: string;
    is_income: boolean;
  }) => Promise<void>;
  deleteTransaction: (transactionId: string) => Promise<void>;
}

// Simple cache for transactions
const transactionsCache = new Map<string, { data: Transaction[]; count: number }>();

function getCacheKey(filters: TransactionFilters): string {
  return JSON.stringify({
    startDate: filters.startDate,
    endDate: filters.endDate,
    categoryId: filters.categoryId,
    isIncome: filters.isIncome,
    isIgnored: filters.isIgnored,
    search: filters.search,
  });
}

export function useTransactions(filters: TransactionFilters = {}): UseTransactionsResult {
  const cacheKey = getCacheKey(filters);
  const cached = transactionsCache.get(cacheKey);

  const [transactions, setTransactions] = useState<Transaction[]>(cached?.data || []);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(cached?.count || 0);

  const fetchTransactions = useCallback(async (forceRefresh = false) => {
    const key = getCacheKey(filters);

    // Return cached data if available and not forcing refresh
    if (!forceRefresh && transactionsCache.has(key)) {
      const cached = transactionsCache.get(key)!;
      setTransactions(cached.data);
      setCount(cached.count);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.categoryId) params.append('categoryId', filters.categoryId);
      if (filters.isIncome !== undefined) params.append('isIncome', String(filters.isIncome));
      if (filters.isIgnored !== undefined) params.append('isIgnored', String(filters.isIgnored));
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`/api/transactions?${params}`);
      if (!response.ok) throw new Error('Failed to fetch transactions');

      const result = await response.json();
      transactionsCache.set(key, { data: result.data, count: result.count || result.data.length });
      setTransactions(result.data);
      setCount(result.count || result.data.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [filters.startDate, filters.endDate, filters.categoryId, filters.isIncome, filters.isIgnored, filters.search]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const refresh = useCallback(() => fetchTransactions(true), [fetchTransactions]);

  const updateCategory = async (transactionId: string, categoryId: string) => {
    const response = await fetch('/api/transactions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: transactionId, category_id: categoryId }),
    });

    if (!response.ok) throw new Error('Failed to update category');

    const updated = await response.json();
    setTransactions((prev) =>
      prev.map((t) => (t.id === transactionId ? updated : t))
    );
  };

  const updateDescription = async (transactionId: string, description: string) => {
    const response = await fetch('/api/transactions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: transactionId, description }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('Update description error:', error);
      throw new Error(error.error || 'Failed to update description');
    }

    const updated = await response.json();
    setTransactions((prev) =>
      prev.map((t) => (t.id === transactionId ? updated : t))
    );
  };

  const addTransaction = async (data: {
    amount: number;
    description: string;
    category_id: string;
    transaction_date: string;
    is_income: boolean;
  }) => {
    const response = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error('Failed to add transaction');

    const newTransaction = await response.json();
    setTransactions((prev) => [newTransaction, ...prev]);
    setCount((prev) => prev + 1);
  };

  const deleteTransaction = async (transactionId: string) => {
    const response = await fetch(`/api/transactions?id=${transactionId}`, {
      method: 'DELETE',
    });

    if (!response.ok) throw new Error('Failed to delete transaction');

    setTransactions((prev) => prev.filter((t) => t.id !== transactionId));
    setCount((prev) => prev - 1);
  };

  return {
    transactions,
    loading,
    error,
    count,
    refresh,
    updateCategory,
    updateDescription,
    addTransaction,
    deleteTransaction,
  };
}

// Clear transactions cache (useful after data changes)
export function clearTransactionsCache() {
  transactionsCache.clear();
}
