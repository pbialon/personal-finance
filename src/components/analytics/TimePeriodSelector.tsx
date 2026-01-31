'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import type { TimePeriod, TimePeriodRange } from '@/types';
import { getFinancialMonthBoundaries, addFinancialMonths } from '@/lib/utils';

interface TimePeriodSelectorProps {
  onPeriodChange: (range: TimePeriodRange) => void;
  showCompare?: boolean;
  financialStartDay?: number;
}

const PERIOD_OPTIONS: { value: TimePeriod; label: string }[] = [
  { value: 'month', label: 'Miesiąc' },
  { value: 'quarter', label: 'Kwartał' },
  { value: 'half-year', label: 'Pół roku' },
  { value: 'year', label: 'Rok' },
  { value: 'custom', label: 'Własny' },
];

export function TimePeriodSelector({ onPeriodChange, showCompare = true, financialStartDay = 1 }: TimePeriodSelectorProps) {
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
        const { start, end } = getFinancialMonthBoundaries(now, financialStartDay);
        startDate = start;
        endDate = end;
        if (compareEnabled) {
          const prevMonth = addFinancialMonths(now, -1, financialStartDay);
          const prev = getFinancialMonthBoundaries(prevMonth, financialStartDay);
          compareStartDate = prev.start;
          compareEndDate = prev.end;
        }
        break;
      }
      case 'quarter': {
        // Financial quarters are based on financial year, not calendar year
        // Q1 = Financial Jan-Mar, Q2 = Financial Apr-Jun, Q3 = Financial Jul-Sep, Q4 = Financial Oct-Dec
        const year = now.getFullYear();

        // Find financial January of current year (start of financial year)
        const financialJanDate = new Date(year, 0, 15); // Jan 15 to be safe
        const financialJan = getFinancialMonthBoundaries(financialJanDate, financialStartDay);
        const financialYearStart = new Date(financialJan.start + 'T00:00:00');

        // Get current financial month
        const currentFM = getFinancialMonthBoundaries(now, financialStartDay);
        const currentFMStart = new Date(currentFM.start + 'T00:00:00');

        // Calculate months since financial year start
        const monthsSinceYearStart = Math.round(
          (currentFMStart.getTime() - financialYearStart.getTime()) / (30.44 * 24 * 60 * 60 * 1000)
        );

        // Determine quarter (0-3)
        const quarterIndex = Math.floor(Math.max(0, monthsSinceYearStart) / 3);

        // Get first financial month of this quarter
        const quarterFirstMonth = addFinancialMonths(financialYearStart, quarterIndex * 3, financialStartDay);
        const quarterStart = getFinancialMonthBoundaries(quarterFirstMonth, financialStartDay);

        // Get last financial month of the quarter (2 months later)
        const quarterLastMonth = addFinancialMonths(quarterFirstMonth, 2, financialStartDay);
        const quarterEnd = getFinancialMonthBoundaries(quarterLastMonth, financialStartDay);

        startDate = quarterStart.start;
        endDate = quarterEnd.end;

        if (compareEnabled) {
          const prevQuarterFirstMonth = addFinancialMonths(quarterFirstMonth, -3, financialStartDay);
          const prevQuarterStart = getFinancialMonthBoundaries(prevQuarterFirstMonth, financialStartDay);
          const prevQuarterLastMonth = addFinancialMonths(prevQuarterFirstMonth, 2, financialStartDay);
          const prevQuarterEnd = getFinancialMonthBoundaries(prevQuarterLastMonth, financialStartDay);
          compareStartDate = prevQuarterStart.start;
          compareEndDate = prevQuarterEnd.end;
        }
        break;
      }
      case 'half-year': {
        // Financial halves are based on financial year, not calendar year
        // H1 = Financial Jan-Jun, H2 = Financial Jul-Dec
        const year = now.getFullYear();

        // Find financial January of current year (start of financial year)
        const financialJanDate = new Date(year, 0, 15); // Jan 15 to be safe
        const financialJan = getFinancialMonthBoundaries(financialJanDate, financialStartDay);
        const financialYearStart = new Date(financialJan.start + 'T00:00:00');

        // Get current financial month
        const currentFM = getFinancialMonthBoundaries(now, financialStartDay);
        const currentFMStart = new Date(currentFM.start + 'T00:00:00');

        // Calculate months since financial year start
        const monthsSinceYearStart = Math.round(
          (currentFMStart.getTime() - financialYearStart.getTime()) / (30.44 * 24 * 60 * 60 * 1000)
        );

        // Determine half (0 or 1)
        const halfIndex = Math.floor(Math.max(0, monthsSinceYearStart) / 6);

        // Get first financial month of this half
        const halfFirstMonth = addFinancialMonths(financialYearStart, halfIndex * 6, financialStartDay);
        const halfStart = getFinancialMonthBoundaries(halfFirstMonth, financialStartDay);

        // Get last financial month of the half (5 months later)
        const halfLastMonth = addFinancialMonths(halfFirstMonth, 5, financialStartDay);
        const halfEnd = getFinancialMonthBoundaries(halfLastMonth, financialStartDay);

        startDate = halfStart.start;
        endDate = halfEnd.end;

        if (compareEnabled) {
          const prevHalfFirstMonth = addFinancialMonths(halfFirstMonth, -6, financialStartDay);
          const prevHalfStart = getFinancialMonthBoundaries(prevHalfFirstMonth, financialStartDay);
          const prevHalfLastMonth = addFinancialMonths(prevHalfFirstMonth, 5, financialStartDay);
          const prevHalfEnd = getFinancialMonthBoundaries(prevHalfLastMonth, financialStartDay);
          compareStartDate = prevHalfStart.start;
          compareEndDate = prevHalfEnd.end;
        }
        break;
      }
      case 'year': {
        // Financial year: from financial January to financial December
        // Financial January = period containing most of calendar January
        const year = now.getFullYear();

        // Get financial January (use Jan 15 to ensure we're in the right financial month)
        const janDate = new Date(year, 0, 15);
        const financialJan = getFinancialMonthBoundaries(janDate, financialStartDay);

        // Get financial December (use Dec 15 to ensure we're in the right financial month)
        const decDate = new Date(year, 11, 15);
        const financialDec = getFinancialMonthBoundaries(decDate, financialStartDay);

        startDate = financialJan.start;
        endDate = financialDec.end;

        if (compareEnabled) {
          const prevJanDate = new Date(year - 1, 0, 15);
          const prevFinancialJan = getFinancialMonthBoundaries(prevJanDate, financialStartDay);
          const prevDecDate = new Date(year - 1, 11, 15);
          const prevFinancialDec = getFinancialMonthBoundaries(prevDecDate, financialStartDay);
          compareStartDate = prevFinancialJan.start;
          compareEndDate = prevFinancialDec.end;
        }
        break;
      }
      case 'custom': {
        const { start, end } = getFinancialMonthBoundaries(now, financialStartDay);
        startDate = customStart || start;
        endDate = customEnd || end;
        break;
      }
    }

    return { startDate, endDate, compareStartDate, compareEndDate };
  }, [customStart, customEnd, financialStartDay]);

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

  // Calculate and emit range on mount and when financialStartDay changes
  useEffect(() => {
    if (period !== 'custom') {
      const range = calculateRange(period, compare);
      onPeriodChange(range);
    }
  }, [financialStartDay, calculateRange]); // eslint-disable-line react-hooks/exhaustive-deps

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
