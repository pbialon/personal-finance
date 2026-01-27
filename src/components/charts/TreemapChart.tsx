'use client';

import { formatCurrency } from '@/lib/utils';

interface TreemapChartProps {
  data: {
    name: string;
    value: number;
    color?: string;
  }[];
}

export function TreemapChart({ data }: TreemapChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const sortedData = [...data].sort((a, b) => b.value - a.value);

  if (data.length === 0) {
    return <p className="text-sm text-gray-500 text-center py-8">Brak danych</p>;
  }

  return (
    <div className="space-y-2">
      {sortedData.slice(0, 8).map((item, idx) => {
        const percentage = total > 0 ? (item.value / total) * 100 : 0;
        return (
          <div key={item.name} className="group">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="truncate max-w-[60%]" title={item.name}>
                {item.name}
              </span>
              <span className="text-gray-600 font-medium">
                {formatCurrency(item.value)} ({percentage.toFixed(1)}%)
              </span>
            </div>
            <div className="h-6 bg-gray-100 rounded-md overflow-hidden">
              <div
                className="h-full rounded-md transition-all duration-300"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: item.color || `hsl(${210 + idx * 20}, 70%, 50%)`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
