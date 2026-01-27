'use client';

import { useState } from 'react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import type { Merchant, Category } from '@/types';

interface MerchantFormProps {
  merchant: Merchant;
  categories: Category[];
  onSubmit: (data: {
    display_name: string;
    icon_url: string | null;
    category_id: string | null;
    website: string | null;
  }) => Promise<void>;
  onCancel: () => void;
}

export function MerchantForm({ merchant, categories, onSubmit, onCancel }: MerchantFormProps) {
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState(merchant.display_name);
  const [iconUrl, setIconUrl] = useState(merchant.icon_url || '');
  const [categoryId, setCategoryId] = useState(merchant.category_id || '');
  const [website, setWebsite] = useState(merchant.website || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName) return;

    setLoading(true);
    try {
      await onSubmit({
        display_name: displayName,
        icon_url: iconUrl || null,
        category_id: categoryId || null,
        website: website || null,
      });
    } finally {
      setLoading(false);
    }
  };

  const categoryOptions = [
    { value: '', label: 'Bez kategorii' },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
          Klucz dopasowania
        </p>
        <p className="text-sm text-gray-900 font-mono">{merchant.name}</p>
      </div>

      <Input
        label="Wyświetlana nazwa"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        placeholder="np. Żabka"
        required
      />

      <Input
        label="URL ikony"
        value={iconUrl}
        onChange={(e) => setIconUrl(e.target.value)}
        placeholder="https://example.com/icon.png"
        type="url"
      />

      {iconUrl && (
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <img
            src={iconUrl}
            alt="Preview"
            className="w-10 h-10 rounded-lg object-contain bg-white"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <span className="text-sm text-gray-600">Podgląd ikony</span>
        </div>
      )}

      <Select
        label="Domyślna kategoria"
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        options={categoryOptions}
      />

      <Input
        label="Strona WWW"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        placeholder="https://example.com"
        type="url"
      />

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          Anuluj
        </Button>
        <Button type="submit" loading={loading} className="flex-1">
          Zapisz zmiany
        </Button>
      </div>
    </form>
  );
}
