'use client';

import { useState, useEffect, useCallback } from 'react';
import type { MonthlyStats, CategorySpending, MonthlyTrend, BudgetProgress } from '@/types';

export function useMonthlyStats(month?: string) {
  const [stats, setStats] = useState<MonthlyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ type: 'stats' });
      if (month) params.append('month', month);

      const response = await fetch(`/api/analytics?${params}`);
      if (!response.ok) throw new Error('Failed to fetch stats');

      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refresh: fetchStats };
}

export function useCategorySpending(month?: string) {
  const [spending, setSpending] = useState<CategorySpending[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSpending = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ type: 'category-spending' });
      if (month) params.append('month', month);

      const response = await fetch(`/api/analytics?${params}`);
      if (!response.ok) throw new Error('Failed to fetch spending');

      const data = await response.json();
      setSpending(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    fetchSpending();
  }, [fetchSpending]);

  return { spending, loading, error, refresh: fetchSpending };
}

export function useMonthlyTrends(month?: string) {
  const [trends, setTrends] = useState<MonthlyTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrends = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ type: 'trends' });
      if (month) params.append('month', month);

      const response = await fetch(`/api/analytics?${params}`);
      if (!response.ok) throw new Error('Failed to fetch trends');

      const data = await response.json();
      setTrends(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  return { trends, loading, error, refresh: fetchTrends };
}

export function useBudgetProgress(month?: string) {
  const [progress, setProgress] = useState<BudgetProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ type: 'budget-progress' });
      if (month) params.append('month', month);

      const response = await fetch(`/api/analytics?${params}`);
      if (!response.ok) throw new Error('Failed to fetch progress');

      const data = await response.json();
      setProgress(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  return { progress, loading, error, refresh: fetchProgress };
}
