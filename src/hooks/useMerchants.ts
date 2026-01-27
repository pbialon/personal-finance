'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Merchant } from '@/types';

interface UseMerchantsResult {
  merchants: Merchant[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  updateMerchant: (id: string, data: {
    display_name?: string;
    icon_url?: string | null;
    category_id?: string | null;
    website?: string | null;
  }) => Promise<void>;
  deleteMerchant: (id: string) => Promise<void>;
}

export function useMerchants(): UseMerchantsResult {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMerchants = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/merchants');
      if (!response.ok) throw new Error('Failed to fetch merchants');

      const data = await response.json();
      setMerchants(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMerchants();
  }, [fetchMerchants]);

  const updateMerchant = async (id: string, data: {
    display_name?: string;
    icon_url?: string | null;
    category_id?: string | null;
    website?: string | null;
  }) => {
    const response = await fetch('/api/merchants', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...data }),
    });

    if (!response.ok) throw new Error('Failed to update merchant');

    const updated = await response.json();
    setMerchants((prev) =>
      prev.map((m) => (m.id === id ? updated : m)).sort((a, b) => a.display_name.localeCompare(b.display_name))
    );
  };

  const deleteMerchant = async (id: string) => {
    const response = await fetch(`/api/merchants?id=${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) throw new Error('Failed to delete merchant');

    setMerchants((prev) => prev.filter((m) => m.id !== id));
  };

  return {
    merchants,
    loading,
    error,
    refresh: fetchMerchants,
    updateMerchant,
    deleteMerchant,
  };
}
