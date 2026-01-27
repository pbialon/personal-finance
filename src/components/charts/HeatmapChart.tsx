'use client';

import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface HeatmapChartProps {
  data: {
    category: string;
    color: string;
    days: number[];
  }[];
}

const DAYS = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Niedz'];

export function HeatmapChart({ data }: HeatmapChartProps) {
  const maxValue = Math.max(...data.flatMap(d => d.days));

  const getOpacity = (value: number) => {
    if (maxValue === 0) return 0.1;
    return Math.max(0.1, value / maxValue);
  };

  if (data.length === 0) {
    return <p className="text-sm text-gray-500 text-center py-8">Brak danych</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="text-left py-2 px-1 font-medium text-gray-500 min-w-[100px]">Kategoria</th>
            {DAYS.map((day) => (
              <th key={day} className="text-center py-2 px-1 font-medium text-gray-500 w-[60px]">
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.category}>
              <td className="py-1 px-1 text-sm truncate max-w-[120px]" title={row.category}>
                {row.category}
              </td>
              {row.days.map((value, idx) => (
                <td key={idx} className="py-1 px-1">
                  <div
                    className={cn(
                      'w-full h-8 rounded flex items-center justify-center text-white text-[10px] font-medium',
                      value === 0 && 'bg-gray-100 text-gray-400'
                    )}
                    style={{
                      backgroundColor: value > 0 ? row.color : undefined,
                      opacity: value > 0 ? getOpacity(value) : 1,
                    }}
                    title={formatCurrency(value)}
                  >
                    {value > 0 && (value >= 1000 ? `${(value / 1000).toFixed(0)}k` : Math.round(value))}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
