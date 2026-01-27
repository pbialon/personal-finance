'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeadlinePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  minYear?: number;
  maxYear?: number;
}

const MONTHS = [
  'Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze',
  'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'
];

const MONTH_NAMES = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
];

export function DeadlinePicker({
  value,
  onChange,
  label,
  placeholder = 'Wybierz miesiąc',
  minYear = new Date().getFullYear(),
  maxYear = new Date().getFullYear() + 10,
}: DeadlinePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => {
    if (value) {
      return parseInt(value.split('-')[0]);
    }
    return new Date().getFullYear();
  });
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedYear = value ? parseInt(value.split('-')[0]) : null;
  const selectedMonth = value ? parseInt(value.split('-')[1]) - 1 : null;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMonthSelect = (monthIndex: number) => {
    const month = String(monthIndex + 1).padStart(2, '0');
    onChange(`${viewYear}-${month}`);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  const displayValue = value
    ? `${MONTH_NAMES[selectedMonth!]} ${selectedYear}`
    : null;

  return (
    <div ref={containerRef} className="relative w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between rounded-lg border border-gray-300 px-3 py-2 text-sm transition-colors',
          'hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500',
          !value && 'text-gray-400'
        )}
      >
        <span>{displayValue || placeholder}</span>
        <div className="flex items-center gap-1">
          {value && (
            <span
              onClick={handleClear}
              className="p-0.5 hover:bg-gray-100 rounded"
            >
              <X className="h-4 w-4 text-gray-400" />
            </span>
          )}
          <Calendar className="h-4 w-4 text-gray-400" />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-xl border border-gray-200 shadow-lg p-3">
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => setViewYear(Math.max(minYear, viewYear - 1))}
              disabled={viewYear <= minYear}
              className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-lg font-semibold">{viewYear}</span>
            <button
              type="button"
              onClick={() => setViewYear(Math.min(maxYear, viewYear + 1))}
              disabled={viewYear >= maxYear}
              className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {MONTHS.map((month, index) => {
              const isSelected = selectedYear === viewYear && selectedMonth === index;
              const isPast = viewYear === new Date().getFullYear() && index < new Date().getMonth();

              return (
                <button
                  key={month}
                  type="button"
                  onClick={() => handleMonthSelect(index)}
                  disabled={isPast}
                  className={cn(
                    'py-2.5 px-2 rounded-lg text-sm font-medium transition-all',
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-gray-100 text-gray-700',
                    isPast && 'opacity-30 cursor-not-allowed'
                  )}
                >
                  {month}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
