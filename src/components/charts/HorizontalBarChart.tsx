'use client';

import { cn } from '@/lib/utils';

interface HorizontalBarChartProps {
  data: {
    name: string;
    value: number;
    count?: number;
  }[];
  compareData?: {
    name: string;
    value: number;
    count?: number;
  }[];
  color?: string;
}

function formatCompact(amount: number): string {
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1).replace('.0', '')}k`;
  }
  return Math.round(amount).toString();
}

export function HorizontalBarChart({ data, compareData, color = '#3b82f6' }: HorizontalBarChartProps) {
  const allValues = compareData
    ? [...data.map((d) => d.value), ...compareData.map((d) => d.value)]
    : data.map((d) => d.value);
  const maxValue = Math.max(...allValues);
  const maxIndex = data.findIndex((d) => d.value === maxValue);
  const compareMap = compareData ? new Map(compareData.map(d => [d.name, d])) : null;

  return (
    <div className="space-y-2.5">
      {data.map((item, idx) => {
        const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
        const isMax = idx === maxIndex && item.value > 0;

        const compareItem = compareMap?.get(item.name);
        const comparePercentage = compareItem && maxValue > 0 ? (compareItem.value / maxValue) * 100 : 0;

        return (
          <div
            key={item.name}
            className="flex items-center gap-3 p-2 rounded-lg cursor-default"
          >
            {/* Day name */}
            <span className={cn(
              'w-28 text-sm shrink-0',
              isMax ? 'font-medium text-gray-900' : 'text-gray-600'
            )}>
              {item.name}
            </span>

            {/* Bars container */}
            <div className="flex-1 flex flex-col gap-0.5">
              {/* Current period bar */}
              <div className="h-3.5 bg-gray-100 rounded-md relative group cursor-pointer">
                <div
                  className="h-full rounded-md transition-all duration-200 ease-out group-hover:brightness-110 group-hover:saturate-150"
                  style={{
                    width: `${Math.max(percentage, 3)}%`,
                    background: isMax
                      ? `linear-gradient(90deg, ${color}, ${color}cc)`
                      : `linear-gradient(90deg, ${color}80, ${color}50)`,
                  }}
                />
              </div>
              {/* Comparison period bar */}
              {compareItem && (
                <div className="h-2 bg-gray-50 rounded-md relative">
                  <div
                    className="h-full rounded-md"
                    style={{
                      width: `${Math.max(comparePercentage, 2)}%`,
                      background: 'linear-gradient(90deg, #9ca3af80, #9ca3af50)',
                    }}
                  />
                </div>
              )}
            </div>

            {/* Values */}
            <div className="flex flex-col items-end shrink-0">
              <span className={cn(
                'text-sm tabular-nums',
                isMax ? 'font-semibold text-gray-900' : 'font-medium text-gray-600'
              )}>
                {formatCompact(item.value)} zł
              </span>
              {compareItem && (
                <span className="text-xs tabular-nums text-gray-400">
                  {formatCompact(compareItem.value)} zł
                </span>
              )}
            </div>

            {/* Transaction count */}
            {item.count !== undefined && !compareData && (
              <span className="text-xs text-gray-400 w-12 text-right shrink-0">
                {item.count} tr.
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
