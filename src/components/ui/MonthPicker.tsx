'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn, getFinancialMonthBoundaries } from '@/lib/utils';

interface MonthPickerProps {
  value: Date;
  onChange: (date: Date) => void;
  isOpen: boolean;
  onClose: () => void;
  maxDate?: Date;
  financialStartDay?: number;
}

const MONTHS = [
  'Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze',
  'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'
];

export function MonthPicker({ value, onChange, isOpen, onClose, maxDate, financialStartDay = 1 }: MonthPickerProps) {
  const [viewYear, setViewYear] = useState(value.getFullYear());
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setViewYear(value.getFullYear());
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // For financial month, determine the current financial month label
  // which tells us which calendar month we're "in" financially
  const today = new Date();
  const { label: currentFinancialLabel } = getFinancialMonthBoundaries(today, financialStartDay);

  // Parse the financial label to get the month index (e.g., "Luty 2026" -> 1)
  const monthNames = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
                      'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'];
  const labelParts = currentFinancialLabel.split(' ');
  const financialMonthIndex = monthNames.findIndex(m => m.toLowerCase() === labelParts[0].toLowerCase());
  const financialYear = parseInt(labelParts[1], 10);

  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  // Use financial month boundaries for determining max selectable month
  const maxYear = financialStartDay !== 1 ? financialYear : (maxDate?.getFullYear() ?? currentYear);
  const maxMonth = financialStartDay !== 1 ? financialMonthIndex : (maxDate?.getMonth() ?? currentMonth);

  const handleMonthClick = (monthIndex: number) => {
    const newDate = new Date(viewYear, monthIndex, 1);
    onChange(newDate);
    onClose();
  };

  const isMonthDisabled = (monthIndex: number) => {
    if (viewYear > maxYear) return true;
    if (viewYear === maxYear && monthIndex > maxMonth) return true;
    return false;
  };

  const isMonthSelected = (monthIndex: number) => {
    return viewYear === value.getFullYear() && monthIndex === value.getMonth();
  };

  const canGoNextYear = viewYear < maxYear;

  return (
    <div
      ref={pickerRef}
      className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-50 w-[280px]"
    >
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setViewYear(y => y - 1)}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="font-semibold text-gray-900">{viewYear}</span>
        <button
          onClick={() => setViewYear(y => y + 1)}
          disabled={!canGoNextYear}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {MONTHS.map((month, index) => {
          const disabled = isMonthDisabled(index);
          const selected = isMonthSelected(index);
          // Highlight the current financial month, not calendar month
          const isCurrent = viewYear === maxYear && index === maxMonth;

          return (
            <button
              key={month}
              onClick={() => handleMonthClick(index)}
              disabled={disabled}
              className={cn(
                'py-2 px-3 rounded-lg text-sm font-medium transition-all',
                selected
                  ? 'bg-blue-600 text-white'
                  : disabled
                  ? 'text-gray-300 cursor-not-allowed'
                  : isCurrent
                  ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              {month}
            </button>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 flex justify-center">
        <button
          onClick={() => {
            onChange(new Date());
            onClose();
          }}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Bieżący miesiąc
        </button>
      </div>
    </div>
  );
}
