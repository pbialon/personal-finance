'use client';

import { useState } from 'react';
import { Plus, Trash2, Wallet, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatCurrency } from '@/lib/utils';
import type { WizardIncomeItem } from '@/types';

interface IncomeStepProps {
  incomes: WizardIncomeItem[];
  onIncomesChange: (incomes: WizardIncomeItem[]) => void;
  averageIncome?: number;
}

export function IncomeStep({ incomes, onIncomesChange, averageIncome }: IncomeStepProps) {
  const [newIncomeName, setNewIncomeName] = useState('');

  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);

  const updateIncome = (id: string, amount: number) => {
    onIncomesChange(
      incomes.map((i) => (i.id === id ? { ...i, amount } : i))
    );
  };

  const addIncome = () => {
    if (!newIncomeName.trim()) return;
    onIncomesChange([
      ...incomes,
      { id: crypto.randomUUID(), name: newIncomeName.trim(), amount: 0 },
    ]);
    setNewIncomeName('');
  };

  const removeIncome = (id: string) => {
    if (incomes.length <= 1) return;
    onIncomesChange(incomes.filter((i) => i.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addIncome();
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Wallet className="mx-auto h-12 w-12 text-green-600 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900">Planowane przychody</h3>
        <p className="text-sm text-gray-500 mt-1">
          Ile planujesz zarobić w tym miesiącu?
        </p>
      </div>

      {averageIncome !== undefined && averageIncome > 0 && (
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3">
          <Lightbulb className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            Średni przychód z ostatnich 3 miesięcy:{' '}
            <span className="font-medium">{formatCurrency(averageIncome)}</span>
          </p>
        </div>
      )}

      <div className="space-y-3">
        {incomes.map((income) => (
          <div key={income.id} className="flex items-center gap-3">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700">
                {income.name}
              </label>
              <div className="relative mt-1">
                <Input
                  type="number"
                  value={income.amount || ''}
                  onChange={(e) => updateIncome(income.id, parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                  zł
                </span>
              </div>
            </div>
            {incomes.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeIncome(income.id)}
                className="mt-6 text-gray-400 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Input
          placeholder="Nazwa dodatkowego przychodu"
          value={newIncomeName}
          onChange={(e) => setNewIncomeName(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1"
        />
        <Button
          variant="secondary"
          onClick={addIncome}
          disabled={!newIncomeName.trim()}
        >
          <Plus className="h-4 w-4 mr-1" />
          Dodaj
        </Button>
      </div>

      <div className="rounded-lg bg-green-50 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-green-800">
            Suma przychodów
          </span>
          <span className="text-lg font-bold text-green-700">
            {formatCurrency(totalIncome)}
          </span>
        </div>
      </div>
    </div>
  );
}
