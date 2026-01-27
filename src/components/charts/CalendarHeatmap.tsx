'use client';

import { formatCurrency, cn } from '@/lib/utils';
import { useMemo } from 'react';

interface CalendarHeatmapProps {
  data: { day: number; amount: number }[];
  month: number; // 0-11
  year: number;
  color?: string;
}

const DAYS_SHORT = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Niedz'];

export function CalendarHeatmap({ data, month, year, color = '#3b82f6' }: CalendarHeatmapProps) {
  const { weeks, maxAmount } = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();

    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek < 0) startDayOfWeek = 6;

    const weeksArr: ({ day: number; amount: number; isCurrentMonth: boolean } | null)[][] = [];
    let currentWeek: ({ day: number; amount: number; isCurrentMonth: boolean } | null)[] = [];

    for (let i = 0; i < startDayOfWeek; i++) {
      currentWeek.push(null);
    }

    const amountMap = new Map(data.map(d => [d.day, d.amount]));
    let max = 0;

    for (let day = 1; day <= totalDays; day++) {
      const amount = amountMap.get(day) || 0;
      if (amount > max) max = amount;

      currentWeek.push({ day, amount, isCurrentMonth: true });

      if (currentWeek.length === 7) {
        weeksArr.push(currentWeek);
        currentWeek = [];
      }
    }

    while (currentWeek.length > 0 && currentWeek.length < 7) {
      currentWeek.push(null);
    }
    if (currentWeek.length > 0) {
      weeksArr.push(currentWeek);
    }

    return { weeks: weeksArr, maxAmount: max };
  }, [data, month, year]);

  const getIntensity = (amount: number): number => {
    if (maxAmount === 0 || amount === 0) return 0;
    return Math.max(0.2, Math.min(1, amount / maxAmount));
  };

  const getColorStyle = (amount: number, dayOfWeek: number) => {
    const isWeekend = dayOfWeek >= 5;

    if (amount === 0) {
      return {
        backgroundColor: isWeekend ? '#f3f4f6' : '#f9fafb',
        color: '#9ca3af',
      };
    }

    const intensity = getIntensity(amount);
    return {
      backgroundColor: color,
      opacity: intensity,
      color: intensity > 0.5 ? 'white' : '#374151',
    };
  };

  return (
    <div className="space-y-4">
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {/* Day headers */}
        {DAYS_SHORT.map((day, idx) => (
          <div
            key={day}
            className={cn(
              'h-8 flex items-center justify-center text-xs font-medium',
              idx >= 5 ? 'text-gray-400' : 'text-gray-500'
            )}
          >
            {day}
          </div>
        ))}

        {/* Calendar cells */}
        {weeks.flatMap((week, weekIdx) =>
          week.map((cell, dayIdx) => {
            if (!cell) {
              return (
                <div key={`${weekIdx}-${dayIdx}`} className="aspect-square rounded-lg bg-transparent" />
              );
            }

            const colorStyle = getColorStyle(cell.amount, dayIdx);
            const intensity = getIntensity(cell.amount);

            return (
              <div
                key={`${weekIdx}-${dayIdx}`}
                className={cn(
                  'aspect-square rounded-lg flex flex-col items-center justify-center',
                  'transition-all duration-200 hover:scale-105 hover:shadow-md cursor-default',
                  'relative group'
                )}
                style={colorStyle}
              >
                <span className={cn(
                  'text-sm font-semibold',
                  cell.amount > 0 && intensity > 0.5 ? 'text-white' : 'text-gray-600'
                )}>
                  {cell.day}
                </span>
                {cell.amount > 0 && (
                  <span className={cn(
                    'text-[10px]',
                    intensity > 0.5 ? 'text-white/80' : 'text-gray-500'
                  )}>
                    {formatCompact(cell.amount)}
                  </span>
                )}

                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                  {cell.day}.{String(month + 1).padStart(2, '0')} — {formatCurrency(cell.amount)}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
        <span>Mniej</span>
        <div
          className="w-28 h-3 rounded-full"
          style={{
            background: `linear-gradient(to right, #f3f4f6, ${color})`,
          }}
        />
        <span>Więcej</span>
      </div>
    </div>
  );
}

function formatCompact(amount: number): string {
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1).replace('.0', '')}k`;
  }
  return Math.round(amount).toString();
}
