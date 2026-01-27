'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { DeadlinePicker } from '@/components/ui/DeadlinePicker';
import type { GoalWithProgress } from '@/types';

interface GoalFormProps {
  goal?: GoalWithProgress | null;
  onSubmit: (data: GoalFormData) => Promise<void>;
  onCancel: () => void;
}

export interface GoalFormData {
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  icon: string | null;
  color: string;
}

const EMOJI_PRESETS = ['🎯', '🏠', '🚗', '✈️', '🌴', '💰', '📱', '💻', '🎓', '💍', '🏥', '🎁'];
const COLOR_PRESETS = ['#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6'];

export function GoalForm({ goal, onSubmit, onCancel }: GoalFormProps) {
  const [name, setName] = useState(goal?.name || '');
  const [targetAmount, setTargetAmount] = useState(goal?.target_amount?.toString() || '');
  const [currentAmount, setCurrentAmount] = useState(goal?.current_amount?.toString() || '0');
  const [deadline, setDeadline] = useState(goal?.deadline?.slice(0, 7) || '');
  const [icon, setIcon] = useState(goal?.icon || '🎯');
  const [color, setColor] = useState(goal?.color || '#3b82f6');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Nazwa jest wymagana';
    }

    const target = parseFloat(targetAmount);
    if (!targetAmount || isNaN(target) || target <= 0) {
      newErrors.targetAmount = 'Podaj prawidłową kwotę docelową';
    }

    const current = parseFloat(currentAmount);
    if (currentAmount && (isNaN(current) || current < 0)) {
      newErrors.currentAmount = 'Podaj prawidłową kwotę';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        target_amount: parseFloat(targetAmount),
        current_amount: parseFloat(currentAmount) || 0,
        deadline: deadline ? `${deadline}-01` : null,
        icon: icon || null,
        color,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        id="name"
        label="Nazwa celu"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="np. Fundusz awaryjny"
        error={errors.name}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          id="targetAmount"
          label="Kwota docelowa (zł)"
          type="number"
          min="0"
          step="100"
          value={targetAmount}
          onChange={(e) => setTargetAmount(e.target.value)}
          placeholder="np. 25000"
          error={errors.targetAmount}
        />

        <Input
          id="currentAmount"
          label="Aktualna kwota (zł)"
          type="number"
          min="0"
          step="100"
          value={currentAmount}
          onChange={(e) => setCurrentAmount(e.target.value)}
          placeholder="np. 5000"
          error={errors.currentAmount}
        />
      </div>

      <DeadlinePicker
        value={deadline}
        onChange={setDeadline}
        label="Termin realizacji (opcjonalnie)"
        placeholder="Wybierz miesiąc"
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ikona
        </label>
        <div className="flex flex-wrap gap-2">
          {EMOJI_PRESETS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => setIcon(emoji)}
              className={`w-10 h-10 text-xl rounded-lg border-2 transition-colors ${
                icon === emoji
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Kolor
        </label>
        <div className="flex flex-wrap gap-2">
          {COLOR_PRESETS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-8 h-8 rounded-full border-2 transition-transform ${
                color === c ? 'border-gray-900 scale-110' : 'border-transparent'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Anuluj
        </Button>
        <Button type="submit" loading={loading}>
          {goal ? 'Zapisz zmiany' : 'Dodaj cel'}
        </Button>
      </div>
    </form>
  );
}
