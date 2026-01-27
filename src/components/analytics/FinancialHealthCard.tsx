'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { GaugeChart } from '@/components/charts/GaugeChart';
import { useFinancialHealth } from '@/hooks/useAnalytics';
import { Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { TimePeriodRange } from '@/types';
import { cn } from '@/lib/utils';

interface FinancialHealthCardProps {
  range: TimePeriodRange;
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#eab308';
  return '#ef4444';
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Doskonała';
  if (score >= 60) return 'Dobra';
  if (score >= 40) return 'Przeciętna';
  return 'Wymaga poprawy';
}

function ComponentRow({
  label,
  value,
  score,
  target,
  unit = '%',
  inverse = false,
}: {
  label: string;
  value: number;
  score: number;
  target?: number;
  unit?: string;
  inverse?: boolean;
}) {
  const isGood = inverse ? value <= (target || 70) : value >= (target || 20);

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">
          {value.toFixed(1)}{unit}
        </span>
        {target && (
          <span className="text-xs text-gray-400">
            (cel: {inverse ? '<' : '>'}{target}{unit})
          </span>
        )}
        <div
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white',
            score >= 20 ? 'bg-green-500' : score >= 10 ? 'bg-yellow-500' : 'bg-red-500'
          )}
        >
          {score}
        </div>
      </div>
    </div>
  );
}

export function FinancialHealthCard({ range }: FinancialHealthCardProps) {
  const { data, loading, error } = useFinancialHealth(range.startDate, range.endDate);

  if (error && !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Kondycja finansowa</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Nie udało się załadować danych</p>
        </CardContent>
      </Card>
    );
  }

  if (loading && !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Kondycja finansowa</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const scoreColor = getScoreColor(data.score);
  const scoreLabel = getScoreLabel(data.score);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Kondycja finansowa
          {loading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
        </CardTitle>
      </CardHeader>
      <CardContent className={cn('transition-opacity duration-200', loading && 'opacity-60')}>
        <div className="flex flex-col items-center mb-6">
          <GaugeChart value={data.score} max={100} color={scoreColor} />
          <div className="mt-2 text-center">
            <span className="text-2xl font-bold" style={{ color: scoreColor }}>
              {data.score}
            </span>
            <span className="text-gray-400">/100</span>
            <p className="text-sm text-gray-600 mt-1">{scoreLabel}</p>
          </div>
        </div>

        <div className="space-y-1">
          <ComponentRow
            label="Stopa oszczędności"
            value={data.components.savingsRate.value}
            score={data.components.savingsRate.score}
            target={data.components.savingsRate.target}
          />
          <ComponentRow
            label="Wskaźnik wydatków"
            value={data.components.expenseRatio.value}
            score={data.components.expenseRatio.score}
            target={data.components.expenseRatio.target}
            inverse
          />
          <ComponentRow
            label="Realizacja budżetu"
            value={data.components.budgetAdherence.value}
            score={data.components.budgetAdherence.score}
            target={data.components.budgetAdherence.target}
          />
          <ComponentRow
            label="Stabilność przychodów"
            value={data.components.incomeStability.value}
            score={data.components.incomeStability.score}
            unit=" CV"
          />
        </div>
      </CardContent>
    </Card>
  );
}
