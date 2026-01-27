'use client';

import { useState, useCallback } from 'react';
import { TimePeriodSelector } from '@/components/analytics/TimePeriodSelector';
import { FinancialHealthCard } from '@/components/analytics/FinancialHealthCard';
import { SpendingPatternsCard } from '@/components/analytics/SpendingPatternsCard';
import { CategoryAnalysisCard } from '@/components/analytics/CategoryAnalysisCard';
import { TopSpendersCard } from '@/components/analytics/TopSpendersCard';
import { YearOverviewCard } from '@/components/analytics/YearOverviewCard';
import { GoalsCard } from '@/components/analytics/GoalsCard';
import type { TimePeriodRange } from '@/types';

export default function AnalyticsPage() {
  const now = new Date();
  const [range, setRange] = useState<TimePeriodRange>({
    startDate: `${now.getFullYear()}-01-01`,
    endDate: `${now.getFullYear()}-12-31`,
    compareStartDate: `${now.getFullYear() - 1}-01-01`,
    compareEndDate: `${now.getFullYear() - 1}-12-31`,
  });

  const handlePeriodChange = useCallback((newRange: TimePeriodRange) => {
    setRange(newRange);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Analityka</h1>
        <TimePeriodSelector onPeriodChange={handlePeriodChange} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <FinancialHealthCard range={range} />
        <YearOverviewCard range={range} />
      </div>

      <GoalsCard />

      <SpendingPatternsCard range={range} />

      <CategoryAnalysisCard range={range} />

      <TopSpendersCard range={range} />
    </div>
  );
}
