'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn, addMonths, getFirstDayOfMonth } from '@/lib/utils';
import { WizardProgress } from './wizard/WizardProgress';
import { MonthSelectStep } from './wizard/MonthSelectStep';
import { IncomeStep } from './wizard/IncomeStep';
import { ExpensesStep } from './wizard/ExpensesStep';
import { SummaryStep } from './wizard/SummaryStep';
import type {
  Category,
  Budget,
  WizardState,
  WizardIncomeItem,
  WizardExpenseItem,
} from '@/types';

interface BudgetWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    month: string;
    budgets: { category_id: string | null; planned_amount: number; is_income: boolean }[];
  }) => Promise<void>;
  categories: Category[];
  initialMonth?: Date;
}

const TOTAL_STEPS = 4;

export function BudgetWizard({
  isOpen,
  onClose,
  onSave,
  categories,
  initialMonth,
}: BudgetWizardProps) {
  const [step, setStep] = useState<WizardState['step']>(1);
  const [selectedMonth, setSelectedMonth] = useState<Date>(
    initialMonth || addMonths(new Date(), 1)
  );
  const [copyFromPrevious, setCopyFromPrevious] = useState(false);
  const [incomes, setIncomes] = useState<WizardIncomeItem[]>([
    { id: 'main', name: 'Pensja', amount: 0 },
  ]);
  const [expenses, setExpenses] = useState<WizardExpenseItem[]>([]);
  const [existingBudgets, setExistingBudgets] = useState<Budget[]>([]);
  const [previousBudgets, setPreviousBudgets] = useState<Budget[]>([]);
  const [previousMonthSpending, setPreviousMonthSpending] = useState<Record<string, number>>({});
  const [averageIncome, setAverageIncome] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');

  const monthStr = getFirstDayOfMonth(selectedMonth);
  const prevMonthStr = getFirstDayOfMonth(addMonths(selectedMonth, -1));

  // Pobierz budżety dla wybranego miesiąca
  const fetchBudgets = useCallback(async () => {
    try {
      const [currentRes, prevRes] = await Promise.all([
        fetch(`/api/budget?month=${monthStr}`),
        fetch(`/api/budget?month=${prevMonthStr}`),
      ]);
      if (currentRes.ok) {
        setExistingBudgets(await currentRes.json());
      }
      if (prevRes.ok) {
        setPreviousBudgets(await prevRes.json());
      }
    } catch (error) {
      console.error('Failed to fetch budgets:', error);
    }
  }, [monthStr, prevMonthStr]);

  // Pobierz wydatki z poprzedniego miesiąca
  const fetchHistoricalData = useCallback(async () => {
    try {
      // Pobierz wydatki z poprzedniego miesiąca
      const oneMonthAgo = addMonths(selectedMonth, -1);
      const twoMonthsAgo = addMonths(selectedMonth, -2);
      const prevStartDate = getFirstDayOfMonth(oneMonthAgo);
      const prevEndDate = getFirstDayOfMonth(selectedMonth);

      const res = await fetch(
        `/api/analytics/category-spending?startDate=${prevStartDate}&endDate=${prevEndDate}`
      );
      if (res.ok) {
        const data = await res.json();
        const spending: Record<string, number> = {};
        data.forEach((item: { categoryId: string; amount: number }) => {
          spending[item.categoryId] = Math.round(item.amount);
        });
        setPreviousMonthSpending(spending);
      }

      // Pobierz średni przychód z ostatnich 3 miesięcy
      const threeMonthsAgo = addMonths(selectedMonth, -3);
      const avgStartDate = getFirstDayOfMonth(threeMonthsAgo);
      const avgEndDate = getFirstDayOfMonth(selectedMonth);

      const trendsRes = await fetch(
        `/api/analytics/trends?startDate=${avgStartDate}&endDate=${avgEndDate}`
      );
      if (trendsRes.ok) {
        const trends = await trendsRes.json();
        const totalIncome = trends.reduce(
          (sum: number, t: { income: number }) => sum + t.income,
          0
        );
        setAverageIncome(Math.round(totalIncome / 3));
      }
    } catch (error) {
      console.error('Failed to fetch historical data:', error);
    }
  }, [selectedMonth]);

  useEffect(() => {
    if (isOpen) {
      fetchBudgets();
      fetchHistoricalData();
    }
  }, [isOpen, fetchBudgets, fetchHistoricalData]);

  // Kopiuj dane z poprzedniego miesiąca
  useEffect(() => {
    if (copyFromPrevious && previousBudgets.length > 0) {
      // Przychody
      const prevIncomes = previousBudgets.filter((b) => b.is_income);
      if (prevIncomes.length > 0) {
        setIncomes(
          prevIncomes.map((b) => ({
            id: b.id,
            name: b.category?.name || 'Przychód',
            amount: b.planned_amount,
          }))
        );
      }

      // Wydatki (wszystkie)
      const prevExpenses = previousBudgets.filter(
        (b) => !b.is_income && b.category_id
      );
      setExpenses(
        prevExpenses.map((b) => ({
          categoryId: b.category_id!,
          amount: b.planned_amount,
        }))
      );
    }
  }, [copyFromPrevious, previousBudgets]);

  // Reset stanu przy zamknięciu
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setCopyFromPrevious(false);
      setIncomes([{ id: 'main', name: 'Pensja', amount: 0 }]);
      setExpenses([]);
    }
  }, [isOpen]);

  // Oblicz sumy
  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);

  // Walidacja kroków
  const canProceed = () => {
    switch (step) {
      case 1:
        return true;
      case 2:
        return totalIncome > 0;
      case 3:
        return true; // Wydatki są opcjonalne
      case 4:
        return true;
      default:
        return false;
    }
  };

  const goNext = () => {
    if (step < TOTAL_STEPS && canProceed()) {
      setDirection('next');
      setStep((s) => (s + 1) as WizardState['step']);
    }
  };

  const goPrev = () => {
    if (step > 1) {
      setDirection('prev');
      setStep((s) => (s - 1) as WizardState['step']);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const budgets: { category_id: string | null; planned_amount: number; is_income: boolean }[] = [];

      // Dodaj przychody (bez category_id)
      incomes.forEach((income) => {
        if (income.amount > 0) {
          budgets.push({
            category_id: null,
            planned_amount: income.amount,
            is_income: true,
          });
        }
      });

      // Dodaj wydatki
      expenses.forEach((expense) => {
        if (expense.amount > 0) {
          budgets.push({
            category_id: expense.categoryId,
            planned_amount: expense.amount,
            is_income: false,
          });
        }
      });

      await onSave({ month: monthStr, budgets });
      onClose();
    } catch (error) {
      console.error('Failed to save budget plan:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter' && !e.shiftKey && step < TOTAL_STEPS) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          goNext();
        }
      }
    },
    [step, onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />
      <div className="relative z-50 w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-xl bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Kreator budżetu miesięcznego
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="p-1">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Progress */}
        <div className="px-6 py-4 border-b border-gray-100">
          <WizardProgress currentStep={step} totalSteps={TOTAL_STEPS} />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div
            className={cn('transition-all duration-300', {
              'animate-slide-left': direction === 'next',
              'animate-slide-right': direction === 'prev',
            })}
          >
            {step === 1 && (
              <MonthSelectStep
                selectedMonth={selectedMonth}
                onMonthChange={setSelectedMonth}
                copyFromPrevious={copyFromPrevious}
                onCopyChange={setCopyFromPrevious}
                existingBudgets={existingBudgets}
              />
            )}
            {step === 2 && (
              <IncomeStep
                incomes={incomes}
                onIncomesChange={setIncomes}
                averageIncome={averageIncome}
              />
            )}
            {step === 3 && (
              <ExpensesStep
                expenses={expenses}
                onExpensesChange={setExpenses}
                categories={categories}
                totalIncome={totalIncome}
                previousMonthSpending={previousMonthSpending}
              />
            )}
            {step === 4 && (
              <SummaryStep
                incomes={incomes}
                expenses={expenses}
                categories={categories}
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
          <Button
            variant="ghost"
            onClick={goPrev}
            disabled={step === 1}
            className={cn({ 'opacity-0 pointer-events-none': step === 1 })}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Wstecz
          </Button>

          {step < TOTAL_STEPS ? (
            <Button onClick={goNext} disabled={!canProceed()}>
              Dalej
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSave} loading={saving}>
              {saving ? 'Zapisuję...' : 'Zapisz plan miesiąca'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
