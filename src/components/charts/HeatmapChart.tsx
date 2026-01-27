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

// Convert hex to RGB
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 128, g: 128, b: 128 };
};

export function HeatmapChart({ data }: HeatmapChartProps) {
  const maxValue = Math.max(...data.flatMap(d => d.days));

  const getIntensity = (value: number) => {
    if (maxValue === 0 || value === 0) return 0;
    return Math.max(0.2, Math.min(1, value / maxValue));
  };

  const getBackgroundColor = (value: number, color: string) => {
    if (value === 0) return '#f3f4f6';

    const intensity = getIntensity(value);
    const rgb = hexToRgb(color);
    const blend = (c: number) => Math.round(255 - (255 - c) * intensity);

    return `rgb(${blend(rgb.r)}, ${blend(rgb.g)}, ${blend(rgb.b)})`;
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
              {row.days.map((value, idx) => {
                const intensity = getIntensity(value);
                const textDark = value === 0 || intensity < 0.6;

                return (
                  <div
                    key={idx}
                    className={cn(
                      'w-12 h-8 rounded-md flex items-center justify-center text-[10px] font-semibold',
                      'transition-all hover:scale-105 cursor-default relative group'
                    )}
                    style={{
                      backgroundColor: getBackgroundColor(value, row.color),
                    }}
                  >
                    <span className={textDark ? 'text-gray-600' : 'text-white'}>
                      {value > 0 && (value >= 1000 ? `${(value / 1000).toFixed(0)}k` : Math.round(value))}
                    </span>

                    {/* Tooltip */}
                    {value > 0 && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                        {formatCurrency(value)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
