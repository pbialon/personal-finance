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

  // Convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 59, g: 130, b: 246 };
  };

  const getColorStyle = (amount: number, dayOfWeek: number) => {
    const isWeekend = dayOfWeek >= 5;

    if (amount === 0) {
      return {
        backgroundColor: isWeekend ? '#e5e7eb' : '#f3f4f6',
      };
    }

    const intensity = getIntensity(amount);
    const rgb = hexToRgb(color);
    // Blend with white based on intensity (lower intensity = more white)
    const blend = (c: number) => Math.round(255 - (255 - c) * intensity);

    return {
      backgroundColor: `rgb(${blend(rgb.r)}, ${blend(rgb.g)}, ${blend(rgb.b)})`,
    };
  };

  return (
    <div className="space-y-3">
      {/* Day headers */}
      <div className="flex gap-1.5">
        {DAYS_SHORT.map((day, idx) => (
          <div
            key={day}
            className={cn(
              'w-12 h-6 flex items-center justify-center text-xs font-medium',
              idx >= 5 ? 'text-gray-400' : 'text-gray-500'
            )}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Weeks */}
      {weeks.map((week, weekIdx) => (
        <div key={weekIdx} className="flex gap-1.5">
          {week.map((cell, dayIdx) => {
            if (!cell) {
              return (
                <div key={dayIdx} className="w-12 h-12 rounded-lg bg-transparent" />
              );
            }

            const colorStyle = getColorStyle(cell.amount, dayIdx);
            const intensity = getIntensity(cell.amount);

            const textDark = cell.amount === 0 || intensity < 0.6;

            return (
              <div
                key={dayIdx}
                className={cn(
                  'w-12 h-12 rounded-lg flex flex-col items-center justify-center',
                  'transition-all duration-200 hover:scale-105 hover:shadow-md cursor-default',
                  'relative group'
                )}
                style={colorStyle}
              >
                <span className={cn(
                  'text-sm font-semibold',
                  textDark ? 'text-gray-700' : 'text-white'
                )}>
                  {cell.day}
                </span>
                {cell.amount > 0 && (
                  <span className={cn(
                    'text-[9px]',
                    textDark ? 'text-gray-500' : 'text-white/90'
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
          })}
        </div>
      ))}

      {/* Legend */}
      <div className="flex items-center gap-2 text-xs text-gray-500 pt-2">
        <span>Mniej</span>
        <div
          className="w-24 h-2.5 rounded-full"
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
