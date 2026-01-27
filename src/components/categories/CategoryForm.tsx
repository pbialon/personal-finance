'use client';

import { useState } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { DynamicIcon } from '../ui/DynamicIcon';
import type { Category } from '@/types';

interface CategoryFormProps {
  category?: Category;
  onSubmit: (data: {
    name: string;
    color: string;
    icon: string;
    ai_prompt: string;
    is_savings: boolean;
  }) => Promise<void>;
  onCancel: () => void;
}

const colorOptions = [
  '#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#ef4444',
  '#8b5cf6', '#06b6d4', '#10b981', '#f97316', '#6366f1',
  '#fb7185', '#a855f7',
];

const iconOptions = [
  'utensils', 'car', 'home', 'gamepad-2', 'heart-pulse',
  'shopping-bag', 'repeat', 'piggy-bank', 'banknote', 'circle-help',
  'plane', 'smartphone', 'gift', 'briefcase', 'music',
  'flower-2', 'sparkles', 'scissors', 'graduation-cap', 'dumbbell',
];

export function CategoryForm({ category, onSubmit, onCancel }: CategoryFormProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(category?.name || '');
  const [color, setColor] = useState(category?.color || colorOptions[0]);
  const [icon, setIcon] = useState(category?.icon || iconOptions[0]);
  const [aiPrompt, setAiPrompt] = useState(category?.ai_prompt || '');
  const [isSavings, setIsSavings] = useState(category?.is_savings || false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    setLoading(true);
    try {
      await onSubmit({
        name,
        color,
        icon,
        ai_prompt: aiPrompt,
        is_savings: isSavings,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Nazwa kategorii"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="np. Jedzenie"
        required
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Kolor
        </label>
        <div className="flex flex-wrap gap-2">
          {colorOptions.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-8 h-8 rounded-full border-2 transition-all ${
                color === c ? 'border-gray-900 scale-110' : 'border-transparent'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ikona
        </label>
        <div className="flex flex-wrap gap-2">
          {iconOptions.map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIcon(i)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                icon === i
                  ? 'ring-2 ring-offset-2 ring-gray-900'
                  : 'hover:opacity-80'
              }`}
              style={{ backgroundColor: color + '20' }}
            >
              <DynamicIcon name={i} className="w-5 h-5" style={{ color }} />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Podpowiedź dla AI
        </label>
        <textarea
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          placeholder="Opisz jakie transakcje powinny być przypisane do tej kategorii..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          rows={3}
        />
      </div>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={isSavings}
          onChange={(e) => setIsSavings(e.target.checked)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-700">Kategoria oszczędności</span>
      </label>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          Anuluj
        </Button>
        <Button type="submit" loading={loading} className="flex-1">
          {category ? 'Zapisz zmiany' : 'Dodaj kategorię'}
        </Button>
      </div>
    </form>
  );
}
