'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  MonthlyStats,
  CategorySpending,
  MonthlyTrend,
  BudgetProgress,
  FinancialHealthScore,
  SpendingPatterns,
  CategoryAnalysis,
  TopSpenders,
  YearOverview,
} from '@/types';

// Simple in-memory cache for analytics data
const cache = {
  stats: new Map<string, MonthlyStats>(),
  spending: new Map<string, CategorySpending[]>(),
  trends: new Map<string, MonthlyTrend[]>(),
  progress: new Map<string, BudgetProgress[]>(),
};

export function useMonthlyStats(month?: string) {
  const cacheKey = month || 'current';
  const [stats, setStats] = useState<MonthlyStats | null>(() => cache.stats.get(cacheKey) || null);
  const [loading, setLoading] = useState(!cache.stats.has(cacheKey));
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async (forceRefresh = false) => {
    const key = month || 'current';

    // Return cached data if available and not forcing refresh
    if (!forceRefresh && cache.stats.has(key)) {
      setStats(cache.stats.get(key)!);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({ type: 'stats' });
      if (month) params.append('month', month);

      const response = await fetch(`/api/analytics?${params}`);
      if (!response.ok) throw new Error('Failed to fetch stats');

      const data = await response.json();
      cache.stats.set(key, data);
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

  const refresh = useCallback(() => fetchStats(true), [fetchStats]);

  return { stats, loading, error, refresh };
}

export function useCategorySpending(month?: string) {
  const cacheKey = month || 'current';
  const [spending, setSpending] = useState<CategorySpending[]>(() => cache.spending.get(cacheKey) || []);
  const [loading, setLoading] = useState(!cache.spending.has(cacheKey));
  const [error, setError] = useState<string | null>(null);

  const fetchSpending = useCallback(async (forceRefresh = false) => {
    const key = month || 'current';

    if (!forceRefresh && cache.spending.has(key)) {
      setSpending(cache.spending.get(key)!);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({ type: 'category-spending' });
      if (month) params.append('month', month);

      const response = await fetch(`/api/analytics?${params}`);
      if (!response.ok) throw new Error('Failed to fetch spending');

      const data = await response.json();
      cache.spending.set(key, data);
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

  const refresh = useCallback(() => fetchSpending(true), [fetchSpending]);

  return { spending, loading, error, refresh };
}

export function useMonthlyTrends(month?: string) {
  const cacheKey = month || 'current';
  const [trends, setTrends] = useState<MonthlyTrend[]>(() => cache.trends.get(cacheKey) || []);
  const [loading, setLoading] = useState(!cache.trends.has(cacheKey));
  const [error, setError] = useState<string | null>(null);

  const fetchTrends = useCallback(async (forceRefresh = false) => {
    const key = month || 'current';

    if (!forceRefresh && cache.trends.has(key)) {
      setTrends(cache.trends.get(key)!);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({ type: 'trends' });
      if (month) params.append('month', month);

      const response = await fetch(`/api/analytics?${params}`);
      if (!response.ok) throw new Error('Failed to fetch trends');

      const data = await response.json();
      cache.trends.set(key, data);
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

  const refresh = useCallback(() => fetchTrends(true), [fetchTrends]);

  return { trends, loading, error, refresh };
}

export function useBudgetProgress(month?: string) {
  const cacheKey = month || 'current';
  const [progress, setProgress] = useState<BudgetProgress[]>(() => cache.progress.get(cacheKey) || []);
  const [loading, setLoading] = useState(!cache.progress.has(cacheKey));
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = useCallback(async (forceRefresh = false) => {
    const key = month || 'current';

    if (!forceRefresh && cache.progress.has(key)) {
      setProgress(cache.progress.get(key)!);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({ type: 'budget-progress' });
      if (month) params.append('month', month);

      const response = await fetch(`/api/analytics?${params}`);
      if (!response.ok) throw new Error('Failed to fetch progress');

      const data = await response.json();
      cache.progress.set(key, data);
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

  const refresh = useCallback(() => fetchProgress(true), [fetchProgress]);

  return { progress, loading, error, refresh };
}

// Clear all analytics cache (useful after data changes)
export function clearAnalyticsCache() {
  cache.stats.clear();
  cache.spending.clear();
  cache.trends.clear();
  cache.progress.clear();
}

// New analytics hooks (without caching for now as they're less frequently used)
export function useFinancialHealth(startDate: string, endDate: string) {
  const [data, setData] = useState<FinancialHealthScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: 'financial-health',
        startDate,
        endDate,
      });

      const response = await fetch(`/api/analytics?${params}`);
      if (!response.ok) throw new Error('Failed to fetch financial health');

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}

export function useSpendingPatterns(startDate: string, endDate: string) {
  const [data, setData] = useState<SpendingPatterns | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: 'spending-patterns',
        startDate,
        endDate,
      });

      const response = await fetch(`/api/analytics?${params}`);
      if (!response.ok) throw new Error('Failed to fetch spending patterns');

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}

export function useCategoryAnalysis(startDate: string, endDate: string, categoryId?: string) {
  const [data, setData] = useState<CategoryAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!categoryId) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: 'category-analysis',
        startDate,
        endDate,
        categoryId,
      });

      const response = await fetch(`/api/analytics?${params}`);
      if (!response.ok) throw new Error('Failed to fetch category analysis');

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, categoryId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}

export function useTopSpenders(startDate: string, endDate: string) {
  const [data, setData] = useState<TopSpenders | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: 'top-spenders',
        startDate,
        endDate,
      });

      const response = await fetch(`/api/analytics?${params}`);
      if (!response.ok) throw new Error('Failed to fetch top spenders');

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}

export function useYearOverview(startDate: string, endDate: string) {
  const [data, setData] = useState<YearOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: 'year-overview',
        startDate,
        endDate,
      });

      const response = await fetch(`/api/analytics?${params}`);
      if (!response.ok) throw new Error('Failed to fetch year overview');

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}
