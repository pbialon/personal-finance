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
  MonthlyForecast,
} from '@/types';

// Simple in-memory cache for analytics data
const cache = {
  stats: new Map<string, MonthlyStats>(),
  spending: new Map<string, CategorySpending[]>(),
  trends: new Map<string, MonthlyTrend[]>(),
  progress: new Map<string, BudgetProgress[]>(),
  forecast: new Map<string, MonthlyForecast>(),
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

export function useForecast(month?: string) {
  const cacheKey = month || 'current';
  const [forecast, setForecast] = useState<MonthlyForecast | null>(() => cache.forecast.get(cacheKey) || null);
  const [loading, setLoading] = useState(!cache.forecast.has(cacheKey));
  const [error, setError] = useState<string | null>(null);

  const fetchForecast = useCallback(async (forceRefresh = false) => {
    const key = month || 'current';

    if (!forceRefresh && cache.forecast.has(key)) {
      setForecast(cache.forecast.get(key)!);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({ type: 'forecast' });
      if (month) params.append('month', month);

      const response = await fetch(`/api/analytics?${params}`);
      if (!response.ok) throw new Error('Failed to fetch forecast');

      const data = await response.json();
      cache.forecast.set(key, data);
      setForecast(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    fetchForecast();
  }, [fetchForecast]);

  const refresh = useCallback(() => fetchForecast(true), [fetchForecast]);

  return { forecast, loading, error, refresh };
}

// Extended cache for date-range analytics
const rangeCache = {
  financialHealth: new Map<string, FinancialHealthScore>(),
  spendingPatterns: new Map<string, SpendingPatterns>(),
  categoryAnalysis: new Map<string, CategoryAnalysis>(),
  topSpenders: new Map<string, TopSpenders>(),
  yearOverview: new Map<string, YearOverview>(),
};

// Clear all analytics cache (useful after data changes)
export function clearAnalyticsCache() {
  cache.stats.clear();
  cache.spending.clear();
  cache.trends.clear();
  cache.progress.clear();
  cache.forecast.clear();
  rangeCache.financialHealth.clear();
  rangeCache.spendingPatterns.clear();
  rangeCache.categoryAnalysis.clear();
  rangeCache.topSpenders.clear();
  rangeCache.yearOverview.clear();
}

function getRangeKey(startDate: string, endDate: string, extra?: string): string {
  return `${startDate}_${endDate}${extra ? `_${extra}` : ''}`;
}

export function useFinancialHealth(startDate: string, endDate: string, compareStartDate?: string, compareEndDate?: string) {
  const cacheKey = getRangeKey(startDate, endDate, compareStartDate ? `cmp_${compareStartDate}_${compareEndDate}` : undefined);
  const cached = rangeCache.financialHealth.get(cacheKey);

  const [data, setData] = useState<FinancialHealthScore | null>(cached || null);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (forceRefresh = false) => {
    const key = getRangeKey(startDate, endDate, compareStartDate ? `cmp_${compareStartDate}_${compareEndDate}` : undefined);

    if (!forceRefresh && rangeCache.financialHealth.has(key)) {
      setData(rangeCache.financialHealth.get(key)!);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: 'financial-health',
        startDate,
        endDate,
      });

      const response = await fetch(`/api/analytics?${params}`);
      if (!response.ok) throw new Error('Failed to fetch financial health');

      const result: FinancialHealthScore = await response.json();

      // Fetch comparison data if dates provided
      if (compareStartDate && compareEndDate) {
        const compareParams = new URLSearchParams({
          type: 'financial-health',
          startDate: compareStartDate,
          endDate: compareEndDate,
        });
        const compareResponse = await fetch(`/api/analytics?${compareParams}`);
        if (compareResponse.ok) {
          const prevResult: FinancialHealthScore = await compareResponse.json();
          result.previousScore = prevResult.score;
          result.scoreChange = result.score - prevResult.score;
          result.components.savingsRate.change = result.components.savingsRate.value - prevResult.components.savingsRate.value;
          result.components.expenseRatio.change = result.components.expenseRatio.value - prevResult.components.expenseRatio.value;
          result.components.budgetAdherence.change = result.components.budgetAdherence.value - prevResult.components.budgetAdherence.value;
          result.components.incomeStability.change = result.components.incomeStability.value - prevResult.components.incomeStability.value;
        }
      }

      rangeCache.financialHealth.set(key, result);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, compareStartDate, compareEndDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(() => fetchData(true), [fetchData]);

  return { data, loading, error, refresh };
}

export function useSpendingPatterns(startDate: string, endDate: string, compareStartDate?: string, compareEndDate?: string) {
  const cacheKey = getRangeKey(startDate, endDate, compareStartDate ? `cmp_${compareStartDate}_${compareEndDate}` : undefined);
  const cached = rangeCache.spendingPatterns.get(cacheKey);

  const [data, setData] = useState<SpendingPatterns | null>(cached || null);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (forceRefresh = false) => {
    const key = getRangeKey(startDate, endDate, compareStartDate ? `cmp_${compareStartDate}_${compareEndDate}` : undefined);

    if (!forceRefresh && rangeCache.spendingPatterns.has(key)) {
      setData(rangeCache.spendingPatterns.get(key)!);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: 'spending-patterns',
        startDate,
        endDate,
      });

      const response = await fetch(`/api/analytics?${params}`);
      if (!response.ok) throw new Error('Failed to fetch spending patterns');

      const result: SpendingPatterns = await response.json();

      // Fetch comparison data if dates provided
      if (compareStartDate && compareEndDate) {
        const compareParams = new URLSearchParams({
          type: 'spending-patterns',
          startDate: compareStartDate,
          endDate: compareEndDate,
        });
        const compareResponse = await fetch(`/api/analytics?${compareParams}`);
        if (compareResponse.ok) {
          const prevResult: SpendingPatterns = await compareResponse.json();
          result.previousByDayOfWeek = prevResult.byDayOfWeek;
          result.previousTotalAmount = prevResult.totalAmount;
          result.previousAverageDaily = prevResult.averageDaily;
          result.totalAmountChange = prevResult.totalAmount > 0
            ? ((result.totalAmount - prevResult.totalAmount) / prevResult.totalAmount) * 100
            : 0;
          result.averageDailyChange = prevResult.averageDaily > 0
            ? ((result.averageDaily - prevResult.averageDaily) / prevResult.averageDaily) * 100
            : 0;
        }
      }

      rangeCache.spendingPatterns.set(key, result);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, compareStartDate, compareEndDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(() => fetchData(true), [fetchData]);

  return { data, loading, error, refresh };
}

export function useCategoryAnalysis(startDate: string, endDate: string, categoryId?: string, compareStartDate?: string, compareEndDate?: string) {
  const cacheKey = getRangeKey(startDate, endDate, categoryId ? `${categoryId}${compareStartDate ? `_cmp_${compareStartDate}_${compareEndDate}` : ''}` : undefined);
  const cached = categoryId ? rangeCache.categoryAnalysis.get(cacheKey) : null;

  const [data, setData] = useState<CategoryAnalysis | null>(cached || null);
  const [loading, setLoading] = useState(categoryId ? !cached : false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!categoryId) {
      setData(null);
      setLoading(false);
      return;
    }

    const key = getRangeKey(startDate, endDate, categoryId ? `${categoryId}${compareStartDate ? `_cmp_${compareStartDate}_${compareEndDate}` : ''}` : undefined);

    if (!forceRefresh && rangeCache.categoryAnalysis.has(key)) {
      setData(rangeCache.categoryAnalysis.get(key)!);
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

      const result: CategoryAnalysis = await response.json();

      // Fetch comparison data if dates provided
      if (compareStartDate && compareEndDate) {
        const compareParams = new URLSearchParams({
          type: 'category-analysis',
          startDate: compareStartDate,
          endDate: compareEndDate,
          categoryId,
        });
        const compareResponse = await fetch(`/api/analytics?${compareParams}`);
        if (compareResponse.ok) {
          const prevResult: CategoryAnalysis = await compareResponse.json();
          result.previousTotalAmount = prevResult.totalAmount;
          result.previousAverageAmount = prevResult.averageAmount;
          result.totalAmountChange = prevResult.totalAmount > 0
            ? ((result.totalAmount - prevResult.totalAmount) / prevResult.totalAmount) * 100
            : 0;
          result.averageAmountChange = prevResult.averageAmount > 0
            ? ((result.averageAmount - prevResult.averageAmount) / prevResult.averageAmount) * 100
            : 0;
          // Merge prev year amounts into monthlyTrend
          const prevMonthMap = new Map(prevResult.monthlyTrend.map(m => [m.month, m.amount]));
          result.monthlyTrend = result.monthlyTrend.map(m => ({
            ...m,
            prevYearAmount: prevMonthMap.get(m.month),
          }));
        }
      }

      rangeCache.categoryAnalysis.set(key, result);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, categoryId, compareStartDate, compareEndDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(() => fetchData(true), [fetchData]);

  return { data, loading, error, refresh };
}

export function useTopSpenders(startDate: string, endDate: string, compareStartDate?: string, compareEndDate?: string) {
  const cacheKey = getRangeKey(startDate, endDate, compareStartDate ? `cmp_${compareStartDate}_${compareEndDate}` : undefined);
  const cached = rangeCache.topSpenders.get(cacheKey);

  const [data, setData] = useState<TopSpenders | null>(cached || null);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (forceRefresh = false) => {
    const key = getRangeKey(startDate, endDate, compareStartDate ? `cmp_${compareStartDate}_${compareEndDate}` : undefined);

    if (!forceRefresh && rangeCache.topSpenders.has(key)) {
      setData(rangeCache.topSpenders.get(key)!);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: 'top-spenders',
        startDate,
        endDate,
      });

      const response = await fetch(`/api/analytics?${params}`);
      if (!response.ok) throw new Error('Failed to fetch top spenders');

      const result: TopSpenders = await response.json();

      // Fetch comparison data if dates provided
      if (compareStartDate && compareEndDate) {
        const compareParams = new URLSearchParams({
          type: 'top-spenders',
          startDate: compareStartDate,
          endDate: compareEndDate,
        });
        const compareResponse = await fetch(`/api/analytics?${compareParams}`);
        if (compareResponse.ok) {
          const prevResult: TopSpenders = await compareResponse.json();

          // Create a map of previous merchant rankings
          const prevRankMap = new Map(prevResult.topMerchants.map((m, idx) => [m.name, idx + 1]));

          // Add rank change info to current merchants
          result.topMerchants = result.topMerchants.map((merchant, idx) => {
            const currentRank = idx + 1;
            const prevRank = prevRankMap.get(merchant.name);
            return {
              ...merchant,
              previousRank: prevRank,
              rankChange: prevRank ? prevRank - currentRank : 'NEW' as const,
            };
          });

          // Add recurring vs one-time comparison
          result.previousRecurringVsOneTime = prevResult.recurringVsOneTime;
          result.recurringChange = prevResult.recurringVsOneTime.recurring > 0
            ? ((result.recurringVsOneTime.recurring - prevResult.recurringVsOneTime.recurring) / prevResult.recurringVsOneTime.recurring) * 100
            : 0;
          result.oneTimeChange = prevResult.recurringVsOneTime.oneTime > 0
            ? ((result.recurringVsOneTime.oneTime - prevResult.recurringVsOneTime.oneTime) / prevResult.recurringVsOneTime.oneTime) * 100
            : 0;
        }
      }

      rangeCache.topSpenders.set(key, result);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, compareStartDate, compareEndDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(() => fetchData(true), [fetchData]);

  return { data, loading, error, refresh };
}

export function useYearOverview(startDate: string, endDate: string) {
  const cacheKey = getRangeKey(startDate, endDate);
  const cached = rangeCache.yearOverview.get(cacheKey);

  const [data, setData] = useState<YearOverview | null>(cached || null);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (forceRefresh = false) => {
    const key = getRangeKey(startDate, endDate);

    if (!forceRefresh && rangeCache.yearOverview.has(key)) {
      setData(rangeCache.yearOverview.get(key)!);
      setLoading(false);
      return;
    }

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
      rangeCache.yearOverview.set(key, result);
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

  const refresh = useCallback(() => fetchData(true), [fetchData]);

  return { data, loading, error, refresh };
}
