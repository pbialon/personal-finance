'use client';

import { cn } from '@/lib/utils';

interface HorizontalBarChartProps {
  data: {
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

export function HorizontalBarChart({ data, color = '#3b82f6' }: HorizontalBarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value));
  const maxIndex = data.findIndex((d) => d.value === maxValue);

  return (
    <div className="space-y-2.5">
      {data.map((item, idx) => {
        const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
        const isMax = idx === maxIndex && item.value > 0;

        return (
          <div
            key={item.name}
            className={cn(
              'flex items-center gap-3 p-2 rounded-lg transition-all duration-200 cursor-default group',
              'hover:bg-gray-50/80 hover:shadow-sm'
            )}
          >
            {/* Day name */}
            <span className={cn(
              'w-28 text-sm shrink-0 transition-colors duration-200',
              isMax ? 'font-medium text-gray-900' : 'text-gray-600',
              'group-hover:text-gray-900'
            )}>
              {item.name}
            </span>

            {/* Bar */}
            <div className="flex-1 h-7 bg-gray-100 rounded-md overflow-hidden relative group-hover:bg-gray-200/50 transition-colors duration-200">
              <div
                className="h-full rounded-md transition-all duration-300 ease-out group-hover:shadow-md"
                style={{
                  width: `${Math.max(percentage, 3)}%`,
                  background: isMax
                    ? `linear-gradient(90deg, ${color}, ${color}cc)`
                    : `linear-gradient(90deg, ${color}80, ${color}50)`,
                }}
              />
              {/* Value inside bar */}
              {percentage > 25 && (
                <span className="absolute inset-y-0 left-3 flex items-center text-xs font-medium text-white">
                  {formatCompact(item.value)} zł
                </span>
              )}
            </div>

            {/* Value outside bar (when bar is small) */}
            {percentage <= 25 && (
              <span className={cn(
                'text-sm tabular-nums shrink-0',
                isMax ? 'font-semibold text-gray-900' : 'font-medium text-gray-600'
              )}>
                {formatCompact(item.value)} zł
              </span>
            )}

            {/* Transaction count */}
            {item.count !== undefined && (
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
