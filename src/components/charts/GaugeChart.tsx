'use client';

import { cn } from '@/lib/utils';

interface GaugeChartProps {
  value: number;
  max?: number;
  color?: string;
  title?: string;
}

export function GaugeChart({ value, max = 100, color = '#3b82f6' }: GaugeChartProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const rotation = (percentage / 100) * 180 - 90;

  return (
    <div className="relative w-full h-[160px] flex items-center justify-center">
      <svg viewBox="0 0 200 130" className="w-full max-w-[280px]">
        {/* Background arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="16"
          strokeLinecap="round"
        />
        {/* Colored arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={color}
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={`${percentage * 2.51}, 251`}
          className="transition-all duration-500"
        />
        {/* Pointer */}
        <g transform={`rotate(${rotation}, 100, 100)`}>
          <line
            x1="100"
            y1="100"
            x2="100"
            y2="40"
            stroke="#374151"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="100" cy="100" r="8" fill="#374151" />
        </g>
        {/* Min/Max labels */}
        <text x="20" y="125" textAnchor="middle" className="text-xs fill-gray-400">0</text>
        <text x="180" y="125" textAnchor="middle" className="text-xs fill-gray-400">{max}</text>
      </svg>
    </div>
  );
}
