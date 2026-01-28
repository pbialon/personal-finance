'use client';

import { useState, useEffect, useCallback } from 'react';

interface AppSettings {
  financial_month_start_day: number;
  ignored_ibans: string[];
}

// Cache for settings
let settingsCache: AppSettings | null = null;

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(settingsCache);
  const [loading, setLoading] = useState(!settingsCache);

  const fetchSettings = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && settingsCache) {
      setSettings(settingsCache);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/settings');
      if (!response.ok) throw new Error('Failed to fetch settings');

      const data = await response.json();
      const parsed: AppSettings = {
        financial_month_start_day: typeof data.financial_month_start_day === 'number'
          ? data.financial_month_start_day
          : parseInt(data.financial_month_start_day, 10) || 1,
        ignored_ibans: Array.isArray(data.ignored_ibans) ? data.ignored_ibans : [],
      };

      settingsCache = parsed;
      setSettings(parsed);
    } catch (err) {
      console.error('Failed to fetch settings:', err);
      // Use defaults on error
      setSettings({ financial_month_start_day: 1, ignored_ibans: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const refresh = useCallback(() => {
    settingsCache = null;
    return fetchSettings(true);
  }, [fetchSettings]);

  return { settings, loading, refresh };
}

export function useFinancialMonthStartDay() {
  const { settings, loading } = useSettings();
  return {
    financialStartDay: settings?.financial_month_start_day ?? 1,
    loading,
  };
}

// Clear cache when settings are updated (call after saving settings)
export function clearSettingsCache() {
  settingsCache = null;
}
