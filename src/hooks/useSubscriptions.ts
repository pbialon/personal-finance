'use client';

import { useState, useEffect, useCallback } from 'react';
import type { DetectedSubscription } from '@/lib/subscription-detector';

interface SubscriptionsData {
  subscriptions: DetectedSubscription[];
  totalMonthly: number;
  upcomingPayments: { date: string; merchantName: string; amount: number }[];
}

let cachedData: SubscriptionsData | null = null;

export function useSubscriptions() {
  const [data, setData] = useState<SubscriptionsData | null>(cachedData);
  const [loading, setLoading] = useState(!cachedData);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptions = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && cachedData) {
      setData(cachedData);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/subscriptions');
      if (!response.ok) throw new Error('Failed to fetch subscriptions');

      const result: SubscriptionsData = await response.json();
      cachedData = result;
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const refresh = useCallback(() => fetchSubscriptions(true), [fetchSubscriptions]);

  return {
    subscriptions: data?.subscriptions || [],
    totalMonthly: data?.totalMonthly || 0,
    upcomingPayments: data?.upcomingPayments || [],
    loading,
    error,
    refresh,
  };
}

export function clearSubscriptionsCache() {
  cachedData = null;
}
