'use client';

import { ChevronLeft, ChevronRight, Calendar, Copy } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatMonthYear, addMonths, getFirstDayOfMonth } from '@/lib/utils';
import type { Budget } from '@/types';

interface MonthSelectStepProps {
  selectedMonth: Date;
  onMonthChange: (month: Date) => void;
  copyFromPrevious: boolean;
  onCopyChange: (copy: boolean) => void;
  existingBudgets: Budget[];
}

export function MonthSelectStep({
  selectedMonth,
  onMonthChange,
  copyFromPrevious,
  onCopyChange,
  existingBudgets,
}: MonthSelectStepProps) {
  const goToPreviousMonth = () => onMonthChange(addMonths(selectedMonth, -1));
  const goToNextMonth = () => onMonthChange(addMonths(selectedMonth, 1));

  const totalPlanned = existingBudgets
    .filter((b) => !b.is_income)
    .reduce((sum, b) => sum + b.planned_amount, 0);

  const totalIncome = existingBudgets
    .filter((b) => b.is_income)
    .reduce((sum, b) => sum + b.planned_amount, 0);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Calendar className="mx-auto h-12 w-12 text-blue-600 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900">Wybierz miesiąc</h3>
        <p className="text-sm text-gray-500 mt-1">
          Na jaki miesiąc chcesz zaplanować budżet?
        </p>
      </div>

      <div className="flex items-center justify-center gap-4">
        <Button variant="ghost" size="sm" onClick={goToPreviousMonth}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <span className="text-xl font-semibold min-w-[180px] text-center">
          {formatMonthYear(selectedMonth)}
        </span>
        <Button variant="ghost" size="sm" onClick={goToNextMonth}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {existingBudgets.length > 0 && (
        <div className="rounded-lg bg-blue-50 p-4">
          <p className="text-sm text-blue-800">
            <span className="font-medium">Istniejący budżet:</span>{' '}
            {existingBudgets.length} pozycji
          </p>
          <p className="text-sm text-blue-700 mt-1">
            Przychody: {totalIncome.toLocaleString('pl-PL')} zł |{' '}
            Wydatki: {totalPlanned.toLocaleString('pl-PL')} zł
          </p>
        </div>
      )}

      <label className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
        <input
          type="checkbox"
          checked={copyFromPrevious}
          onChange={(e) => onCopyChange(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <Copy className="h-5 w-5 text-gray-400" />
        <div>
          <p className="text-sm font-medium text-gray-900">
            Skopiuj wartości z poprzedniego miesiąca
          </p>
          <p className="text-xs text-gray-500">
            Wypełni formularz danymi z miesiąca{' '}
            {formatMonthYear(addMonths(selectedMonth, -1))}
          </p>
        </div>
      </label>
    </div>
  );
}
