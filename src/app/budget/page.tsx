'use client';

import { useState } from 'react';
import { Plus, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { BudgetOverview } from '@/components/budget/BudgetOverview';
import { BudgetForm } from '@/components/budget/BudgetForm';
import { BudgetWizard } from '@/components/budget/BudgetWizard';
import { useBudget } from '@/hooks/useBudget';
import { useCategories } from '@/hooks/useCategories';
import { useCategorySpending } from '@/hooks/useAnalytics';
import { formatMonthYear, getFirstDayOfMonth, addMonths, getFinancialMonthBoundaries, formatFinancialMonthRange } from '@/lib/utils';
import { useFinancialMonthStartDay } from '@/hooks/useSettings';
import type { Budget } from '@/types';
import { Loader2, Info } from 'lucide-react';

export default function BudgetPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const monthStr = getFirstDayOfMonth(currentMonth);
  const { financialStartDay } = useFinancialMonthStartDay();
  const showFinancialNote = financialStartDay !== 1;
  const { label: financialLabel } = getFinancialMonthBoundaries(currentMonth, financialStartDay);

  const { budgets, loading, addBudget, saveBudgetPlan, deleteBudget } = useBudget(monthStr);
  const { categories } = useCategories();
  const { spending } = useCategorySpending(monthStr);

  const [showModal, setShowModal] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  const goToPreviousMonth = () => setCurrentMonth((m) => addMonths(m, -1));
  const goToNextMonth = () => setCurrentMonth((m) => addMonths(m, 1));

  const actualSpending: Record<string, number> = {};
  spending.forEach((s) => {
    actualSpending[s.categoryId] = s.amount;
  });

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setShowModal(true);
  };

  const handleSubmit = async (data: {
    category_id: string | null;
    planned_amount: number;
    is_income: boolean;
    month: string;
  }) => {
    try {
      await addBudget(data);
      setShowModal(false);
      setEditingBudget(null);
    } catch (error) {
      console.error('Failed to save budget:', error);
    }
  };

  const handleDelete = async () => {
    if (!editingBudget) return;
    try {
      await deleteBudget(editingBudget.id);
      setShowModal(false);
      setEditingBudget(null);
    } catch (error) {
      console.error('Failed to delete budget:', error);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingBudget(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Budżet</h1>
          <p className="text-sm text-gray-500">
            Planuj i śledź wydatki
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <span
              className="text-sm font-medium min-w-[120px] text-center"
              title={showFinancialNote ? `Budżet przypisany do miesiąca kalendarzowego (${formatMonthYear(currentMonth)})` : undefined}
            >
              {formatMonthYear(currentMonth)}
            </span>
            <Button variant="ghost" size="sm" onClick={goToNextMonth}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
          <Button variant="secondary" onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Dodaj budżet
          </Button>
          <Button onClick={() => setShowWizard(true)}>
            <Sparkles className="h-4 w-4 mr-2" />
            Zaplanuj miesiąc
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <BudgetOverview
          budgets={budgets}
          categories={categories}
          actualSpending={actualSpending}
          onEdit={handleEdit}
        />
      )}

      <Modal
        isOpen={showModal}
        onClose={handleClose}
        title={editingBudget ? 'Edytuj budżet' : 'Dodaj budżet'}
        size="sm"
      >
        <BudgetForm
          budget={editingBudget || undefined}
          categories={categories}
          month={monthStr}
          actualSpending={editingBudget ? actualSpending[editingBudget.category_id || 'total'] || 0 : undefined}
          onSubmit={handleSubmit}
          onDelete={editingBudget ? handleDelete : undefined}
          onCancel={handleClose}
        />
      </Modal>

      <BudgetWizard
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        onSave={saveBudgetPlan}
        categories={categories}
        initialMonth={currentMonth}
      />
    </div>
  );
}
