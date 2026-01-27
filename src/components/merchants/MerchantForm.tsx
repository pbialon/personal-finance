'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { DynamicIcon } from '../ui/DynamicIcon';
import type { Merchant, Category } from '@/types';

interface MerchantFormProps {
  merchant: Merchant;
  categories: Category[];
  suggestedCategoryId?: string | null;
  onSubmit: (data: {
    display_name: string;
    icon_url: string | null;
    category_id: string | null;
    website: string | null;
  }) => Promise<void>;
  onCancel: () => void;
}

export function MerchantForm({ merchant, categories, suggestedCategoryId, onSubmit, onCancel }: MerchantFormProps) {
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState(merchant.display_name);
  const [iconUrl, setIconUrl] = useState(merchant.icon_url || '');
  // Use merchant's category, or suggested category if merchant has no category
  const [categoryId, setCategoryId] = useState(merchant.category_id || suggestedCategoryId || '');
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

  const selectedCategory = categories.find(c => c.id === categoryId);

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

      {/* Category picker */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Domyślna kategoria
        </label>

        {/* Selected category display */}
        {selectedCategory ? (
          <div
            className="flex items-center justify-between p-3 rounded-lg mb-3"
            style={{ backgroundColor: selectedCategory.color + '15' }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: selectedCategory.color + '30' }}
              >
                {selectedCategory.icon && (
                  <DynamicIcon
                    name={selectedCategory.icon}
                    className="w-4 h-4"
                    style={{ color: selectedCategory.color }}
                  />
                )}
              </div>
              <span className="font-medium" style={{ color: selectedCategory.color }}>
                {selectedCategory.name}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setCategoryId('')}
              className="p-1 rounded hover:bg-white/50 transition-colors"
            >
              <X className="w-4 h-4" style={{ color: selectedCategory.color }} />
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-500 mb-3 p-3 bg-gray-50 rounded-lg">
            Brak kategorii — wybierz poniżej
          </p>
        )}

        {/* Category grid */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryId(cat.id === categoryId ? '' : cat.id)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all',
                categoryId === cat.id
                  ? 'ring-2 ring-offset-1'
                  : 'hover:scale-105'
              )}
              style={{
                backgroundColor: categoryId === cat.id ? cat.color : `${cat.color}15`,
                color: categoryId === cat.id ? 'white' : cat.color,
                ...(categoryId === cat.id
                  ? { ['--tw-ring-color' as string]: cat.color }
                  : {}),
              }}
            >
              {cat.icon && (
                <DynamicIcon
                  name={cat.icon}
                  className="w-4 h-4"
                  style={{ color: categoryId === cat.id ? 'white' : cat.color }}
                />
              )}
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <Input
        label="Strona WWW"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        placeholder="https://example.com"
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
