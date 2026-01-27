'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import type { TimePeriod, TimePeriodRange } from '@/types';
import { getFirstDayOfMonth, getLastDayOfMonth, addMonths } from '@/lib/utils';

interface TimePeriodSelectorProps {
  onPeriodChange: (range: TimePeriodRange) => void;
  showCompare?: boolean;
}

const PERIOD_OPTIONS: { value: TimePeriod; label: string }[] = [
  { value: 'month', label: 'Miesiąc' },
  { value: 'quarter', label: 'Kwartał' },
  { value: 'half-year', label: 'Pół roku' },
  { value: 'year', label: 'Rok' },
  { value: 'custom', label: 'Własny' },
];

export function TimePeriodSelector({ onPeriodChange, showCompare = true }: TimePeriodSelectorProps) {
  const [period, setPeriod] = useState<TimePeriod>('year');
  const [compare, setCompare] = useState(false);
  const [customStart, setCustomStart] = useState<string | undefined>(undefined);
  const [customEnd, setCustomEnd] = useState<string | undefined>(undefined);

  const calculateRange = useCallback((selectedPeriod: TimePeriod, compareEnabled: boolean): TimePeriodRange => {
    const now = new Date();
    let startDate: string;
    let endDate: string;
    let compareStartDate: string | undefined;
    let compareEndDate: string | undefined;

    switch (selectedPeriod) {
      case 'month': {
        startDate = getFirstDayOfMonth(now);
        endDate = getLastDayOfMonth(now);
        if (compareEnabled) {
          const prevMonth = addMonths(now, -1);
          compareStartDate = getFirstDayOfMonth(prevMonth);
          compareEndDate = getLastDayOfMonth(prevMonth);
        }
        break;
      }
      case 'quarter': {
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        const quarterEnd = addMonths(quarterStart, 3);
        quarterEnd.setDate(0);
        startDate = getFirstDayOfMonth(quarterStart);
        endDate = `${quarterEnd.getFullYear()}-${String(quarterEnd.getMonth() + 1).padStart(2, '0')}-${String(quarterEnd.getDate()).padStart(2, '0')}`;
        if (compareEnabled) {
          const prevQuarterStart = addMonths(quarterStart, -3);
          const prevQuarterEnd = new Date(quarterStart);
          prevQuarterEnd.setDate(0);
          compareStartDate = getFirstDayOfMonth(prevQuarterStart);
          compareEndDate = `${prevQuarterEnd.getFullYear()}-${String(prevQuarterEnd.getMonth() + 1).padStart(2, '0')}-${String(prevQuarterEnd.getDate()).padStart(2, '0')}`;
        }
        break;
      }
      case 'half-year': {
        const halfStart = new Date(now.getFullYear(), now.getMonth() >= 6 ? 6 : 0, 1);
        const halfEnd = addMonths(halfStart, 6);
        halfEnd.setDate(0);
        startDate = getFirstDayOfMonth(halfStart);
        endDate = `${halfEnd.getFullYear()}-${String(halfEnd.getMonth() + 1).padStart(2, '0')}-${String(halfEnd.getDate()).padStart(2, '0')}`;
        if (compareEnabled) {
          const prevHalfStart = addMonths(halfStart, -6);
          const prevHalfEnd = new Date(halfStart);
          prevHalfEnd.setDate(0);
          compareStartDate = getFirstDayOfMonth(prevHalfStart);
          compareEndDate = `${prevHalfEnd.getFullYear()}-${String(prevHalfEnd.getMonth() + 1).padStart(2, '0')}-${String(prevHalfEnd.getDate()).padStart(2, '0')}`;
        }
        break;
      }
      case 'year': {
        startDate = `${now.getFullYear()}-01-01`;
        endDate = `${now.getFullYear()}-12-31`;
        if (compareEnabled) {
          compareStartDate = `${now.getFullYear() - 1}-01-01`;
          compareEndDate = `${now.getFullYear() - 1}-12-31`;
        }
        break;
      }
      case 'custom': {
        startDate = customStart || getFirstDayOfMonth(now);
        endDate = customEnd || getLastDayOfMonth(now);
        break;
      }
    }

    return { startDate, endDate, compareStartDate, compareEndDate };
  }, [customStart, customEnd]);

  const handlePeriodChange = useCallback((newPeriod: TimePeriod) => {
    setPeriod(newPeriod);
    if (newPeriod !== 'custom') {
      const range = calculateRange(newPeriod, compare);
      onPeriodChange(range);
    }
  }, [compare, calculateRange, onPeriodChange]);

  const handleCompareToggle = useCallback(() => {
    const newCompare = !compare;
    setCompare(newCompare);
    const range = calculateRange(period, newCompare);
    onPeriodChange(range);
  }, [compare, period, calculateRange, onPeriodChange]);

  const handleCustomStartChange = useCallback((date: string | undefined) => {
    setCustomStart(date);
  }, []);

  const handleCustomEndChange = useCallback((date: string | undefined) => {
    setCustomEnd(date);
  }, []);

  const handleCustomApply = useCallback(() => {
    if (customStart && customEnd) {
      onPeriodChange({ startDate: customStart, endDate: customEnd });
    }
  }, [customStart, customEnd, onPeriodChange]);

  // Apply custom range when both dates are set
  useEffect(() => {
    if (period === 'custom' && customStart && customEnd) {
      onPeriodChange({ startDate: customStart, endDate: customEnd });
    }
  }, [period, customStart, customEnd, onPeriodChange]);

  const currentRange = useMemo(() => calculateRange(period, compare), [period, compare, calculateRange]);

  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {PERIOD_OPTIONS.map((option) => (
            <Button
              key={option.value}
              variant={period === option.value ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => handlePeriodChange(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>

        {showCompare && period !== 'custom' && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={compare}
              onChange={handleCompareToggle}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Porównaj z poprzednim okresem</span>
          </label>
        )}
      </div>

      {period === 'custom' && (
        <div className="flex flex-wrap items-center gap-3">
          <DateRangePicker
            startDate={customStart}
            endDate={customEnd}
            onStartDateChange={handleCustomStartChange}
            onEndDateChange={handleCustomEndChange}
          />
          <Button size="sm" onClick={handleCustomApply} disabled={!customStart || !customEnd}>
            Zastosuj
          </Button>
        </div>
      )}

      {period !== 'custom' && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4" />
          <span>
            {formatDisplayDate(currentRange.startDate)} - {formatDisplayDate(currentRange.endDate)}
          </span>
        </div>
      )}
    </div>
  );
}
