'use client';

import { useState, useRef, useEffect } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { pl } from 'date-fns/locale';
import { format } from 'date-fns';
import { Calendar, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import 'react-datepicker/dist/react-datepicker.css';

registerLocale('pl', pl);

interface SingleDatePickerProps {
  label: string;
  value: string | undefined;
  onChange: (date: string | undefined) => void;
  maxDate?: Date;
  minDate?: Date;
}

function SingleDatePicker({ label, value, onChange, maxDate, minDate }: SingleDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const dateObj = value ? new Date(value) : null;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (date: Date | null) => {
    onChange(date ? format(date, 'yyyy-MM-dd') : undefined);
    setIsOpen(false);
  };

  const clearDate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all w-full',
          'border bg-gray-50 hover:bg-white',
          value ? 'border-blue-300' : 'border-gray-200',
          isOpen && 'ring-2 ring-blue-500 bg-white'
        )}
      >
        <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
        <span className={cn('flex-1 text-left', value ? 'text-gray-700 font-medium' : 'text-gray-400')}>
          {dateObj ? format(dateObj, 'd MMM yyyy', { locale: pl }) : label}
        </span>
        {value && (
          <span
            role="button"
            tabIndex={0}
            onClick={clearDate}
            onKeyDown={(e) => e.key === 'Enter' && clearDate(e as unknown as React.MouseEvent)}
            className="p-0.5 hover:bg-gray-200 rounded transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5 text-gray-400" />
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-white rounded-xl shadow-xl border border-gray-200 p-3">
          <DatePicker
            selected={dateObj}
            onChange={handleChange}
            inline
            locale="pl"
            dateFormat="dd.MM.yyyy"
            maxDate={maxDate}
            minDate={minDate}
            calendarClassName="!border-0 !font-sans"
            showPopperArrow={false}
          />
        </div>
      )}
    </div>
  );
}

interface DateRangePickerProps {
  startDate: string | undefined;
  endDate: string | undefined;
  onStartDateChange: (date: string | undefined) => void;
  onEndDateChange: (date: string | undefined) => void;
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: DateRangePickerProps) {
  const endDateObj = endDate ? new Date(endDate) : undefined;
  const startDateObj = startDate ? new Date(startDate) : undefined;

  return (
    <div className="flex items-center gap-2">
      <div className="w-40">
        <SingleDatePicker
          label="Od"
          value={startDate}
          onChange={onStartDateChange}
          maxDate={endDateObj}
        />
      </div>
      <span className="text-gray-300">→</span>
      <div className="w-40">
        <SingleDatePicker
          label="Do"
          value={endDate}
          onChange={onEndDateChange}
          minDate={startDateObj}
        />
      </div>
    </div>
  );
}
