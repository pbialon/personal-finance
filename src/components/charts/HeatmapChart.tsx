'use client';

import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { DynamicIcon } from '@/components/ui/DynamicIcon';

interface HeatmapChartProps {
  data: {
    category: string;
    color: string;
    icon: string | null;
    days: number[];
  }[];
}

const DAYS = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Niedz'];

export function HeatmapChart({ data }: HeatmapChartProps) {
  const maxValue = Math.max(...data.flatMap(d => d.days));

  const getOpacity = (value: number) => {
    if (maxValue === 0) return 0.15;
    return Math.max(0.15, Math.min(1, value / maxValue));
  };

  if (data.length === 0) {
    return <p className="text-sm text-gray-500 text-center py-8">Brak danych</p>;
  }

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex min-w-full">
        {/* Category labels column */}
        <div className="flex flex-col shrink-0">
          <div className="h-8 mb-1" /> {/* Header spacer */}
          {data.map((row) => (
            <div
              key={row.category}
              className="h-9 flex items-center gap-2 pr-3"
              title={row.category}
            >
              {row.icon ? (
                <div
                  className="w-6 h-6 rounded flex items-center justify-center shrink-0"
                  style={{ backgroundColor: row.color + '20' }}
                >
                  <DynamicIcon
                    name={row.icon}
                    className="w-3.5 h-3.5"
                    style={{ color: row.color }}
                  />
                </div>
              ) : (
                <div
                  className="w-6 h-6 rounded shrink-0"
                  style={{ backgroundColor: row.color + '30' }}
                />
              )}
              <span className="text-sm text-gray-700 truncate max-w-[100px]">
                {row.category}
              </span>
            </div>
          ))}
        </div>

        {/* Heatmap grid */}
        <div className="flex-1">
          {/* Day headers */}
          <div className="flex gap-1 mb-1">
            {DAYS.map((day) => (
              <div
                key={day}
                className="w-12 h-8 flex items-center justify-center text-xs font-medium text-gray-500"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Grid rows */}
          {data.map((row) => (
            <div key={row.category} className="flex gap-1 mb-1">
              {row.days.map((value, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'w-12 h-8 rounded-md flex items-center justify-center text-[10px] font-semibold transition-all hover:scale-105 cursor-default',
                    value === 0 ? 'bg-gray-100' : 'text-white'
                  )}
                  style={{
                    backgroundColor: value > 0 ? row.color : undefined,
                    opacity: value > 0 ? getOpacity(value) : 1,
                  }}
                  title={`${row.category} - ${DAYS[idx]}: ${formatCurrency(value)}`}
                >
                  {value > 0 && (value >= 1000 ? `${(value / 1000).toFixed(0)}k` : Math.round(value))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
