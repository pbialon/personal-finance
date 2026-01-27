'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { GaugeChart } from '@/components/charts/GaugeChart';
import { useFinancialHealth } from '@/hooks/useAnalytics';
import { Loader2, TrendingUp, TrendingDown, Minus, GitCompare } from 'lucide-react';
import type { TimePeriodRange } from '@/types';
import { cn } from '@/lib/utils';

interface FinancialHealthCardProps {
  range: TimePeriodRange;
  compare?: boolean;
  onCompareToggle?: () => void;
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

function ChangeIndicator({ change, inverse = false }: { change?: number; inverse?: boolean }) {
  if (change === undefined) return null;
  const isPositive = inverse ? change < 0 : change > 0;
  const isNeutral = Math.abs(change) < 0.1;

  if (isNeutral) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-gray-400">
        <Minus className="h-3 w-3" />
      </span>
    );
  }

  return (
    <span className={cn(
      'inline-flex items-center gap-0.5 text-xs font-medium',
      isPositive ? 'text-green-600' : 'text-red-600'
    )}>
      {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {change > 0 ? '+' : ''}{change.toFixed(1)}
    </span>
  );
}

function ComponentRow({
  label,
  value,
  score,
  target,
  unit = '%',
  inverse = false,
  change,
}: {
  label: string;
  value: number;
  score: number;
  target?: number;
  unit?: string;
  inverse?: boolean;
  change?: number;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">
          {value.toFixed(1)}{unit}
        </span>
        <ChangeIndicator change={change} inverse={inverse} />
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

export function FinancialHealthCard({ range, compare = false, onCompareToggle }: FinancialHealthCardProps) {
  const { data, loading, error } = useFinancialHealth(
    range.startDate,
    range.endDate,
    range.compareStartDate,
    range.compareEndDate
  );

  const renderHeader = () => (
    <CardHeader>
      <div className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          Kondycja finansowa
          {loading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
        </CardTitle>
        {onCompareToggle && (
          <button
            onClick={onCompareToggle}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all',
              compare
                ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            <GitCompare className="h-4 w-4" />
            <span className="hidden sm:inline">Porównaj</span>
          </button>
        )}
      </div>
    </CardHeader>
  );

  if (error && !data) {
    return (
      <Card>
        {renderHeader()}
        <CardContent>
          <p className="text-sm text-gray-500">Nie udało się załadować danych</p>
        </CardContent>
      </Card>
    );
  }

  if (loading && !data) {
    return (
      <Card>
        {renderHeader()}
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
      {renderHeader()}
      <CardContent className={cn('transition-opacity duration-200', loading && 'opacity-60')}>
        <div className="flex flex-col items-center mb-6">
          <GaugeChart value={data.score} max={100} color={scoreColor} />
          <div className="mt-2 text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl font-bold" style={{ color: scoreColor }}>
                {data.score}
              </span>
              <span className="text-gray-400">/100</span>
              {data.scoreChange !== undefined && (
                <span className={cn(
                  'inline-flex items-center gap-0.5 text-sm font-medium px-2 py-0.5 rounded-full',
                  data.scoreChange > 0 ? 'bg-green-100 text-green-700' : data.scoreChange < 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                )}>
                  {data.scoreChange > 0 ? <TrendingUp className="h-3 w-3" /> : data.scoreChange < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                  {data.scoreChange > 0 ? '+' : ''}{data.scoreChange}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-1">{scoreLabel}</p>
          </div>
        </div>

        <div className="space-y-1">
          <ComponentRow
            label="Stopa oszczędności"
            value={data.components.savingsRate.value}
            score={data.components.savingsRate.score}
            target={data.components.savingsRate.target}
            change={data.components.savingsRate.change}
          />
          <ComponentRow
            label="Wskaźnik wydatków"
            value={data.components.expenseRatio.value}
            score={data.components.expenseRatio.score}
            target={data.components.expenseRatio.target}
            inverse
            change={data.components.expenseRatio.change}
          />
          <ComponentRow
            label="Realizacja budżetu"
            value={data.components.budgetAdherence.value}
            score={data.components.budgetAdherence.score}
            target={data.components.budgetAdherence.target}
            change={data.components.budgetAdherence.change}
          />
          <ComponentRow
            label="Stabilność przychodów"
            value={data.components.incomeStability.value}
            score={data.components.incomeStability.score}
            unit=" CV"
            change={data.components.incomeStability.change}
          />
        </div>
      </CardContent>
    </Card>
  );
}
