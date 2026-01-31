'use client';

import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { DynamicIcon } from '../ui/DynamicIcon';
import type { Merchant, Category } from '@/types';

interface MerchantFormProps {
  merchant: Merchant;
  categories: Category[];
  onSubmit: (data: {
    name: string;
    display_name: string;
    icon_url: string | null;
    category_id: string | null;
    website: string | null;
    aliases: string[];
  }) => Promise<{ error?: string } | void>;
  onCancel: () => void;
}

export function MerchantForm({ merchant, categories, onSubmit, onCancel }: MerchantFormProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(merchant.name);
  const [displayName, setDisplayName] = useState(merchant.display_name);
  const [iconUrl, setIconUrl] = useState(merchant.icon_url || '');
  const [categoryId, setCategoryId] = useState(merchant.category_id || '');
  const [website, setWebsite] = useState(merchant.website || '');
  const [aliases, setAliases] = useState<string[]>(
    merchant.aliases?.map(a => a.alias) || []
  );
  const [newAlias, setNewAlias] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [aliasError, setAliasError] = useState<string | null>(null);

  const handleAddAlias = () => {
    const alias = newAlias.toLowerCase().trim();
    if (!alias) return;

    // Validate
    if (alias === name.toLowerCase().trim()) {
      setAliasError('Alias nie może być taki sam jak główny klucz');
      return;
    }
    if (aliases.includes(alias)) {
      setAliasError('Ten alias już istnieje');
      return;
    }

    setAliases([...aliases, alias]);
    setNewAlias('');
    setAliasError(null);
  };

  const handleRemoveAlias = (aliasToRemove: string) => {
    setAliases(aliases.filter(a => a !== aliasToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddAlias();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName || !name.trim()) return;

    setNameError(null);
    setAliasError(null);
    setLoading(true);

    try {
      const result = await onSubmit({
        name: name.toLowerCase().trim(),
        display_name: displayName,
        icon_url: iconUrl || null,
        category_id: categoryId || null,
        website: website || null,
        aliases,
      });

      if (result?.error) {
        // Check if error is related to name or alias
        if (result.error.includes('Klucz') || result.error.includes('głównym kluczem')) {
          setNameError(result.error);
        } else if (result.error.includes('Alias') || result.error.includes('alias')) {
          setAliasError(result.error);
        } else {
          setNameError(result.error);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedCategory = categories.find(c => c.id === categoryId);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Primary matching key */}
      <div>
        <Input
          label="Klucz dopasowania (główny)"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setNameError(null);
          }}
          placeholder="np. zabka"
          className="font-mono"
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          Główny klucz do rozpoznawania transakcji
        </p>
        {nameError && (
          <p className="text-xs text-red-600 mt-1">{nameError}</p>
        )}
      </div>

      {/* Aliases section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Dodatkowe klucze dopasowania
        </label>

        {/* Existing aliases as chips */}
        {aliases.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {aliases.map((alias) => (
              <span
                key={alias}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 rounded-full text-sm font-mono"
              >
                {alias}
                <button
                  type="button"
                  onClick={() => handleRemoveAlias(alias)}
                  className="p-0.5 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-gray-500" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Add new alias */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newAlias}
            onChange={(e) => {
              setNewAlias(e.target.value);
              setAliasError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="np. żabka express"
            className="flex-1 px-3 py-2 text-sm font-mono border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleAddAlias}
            disabled={!newAlias.trim()}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Aliasy dla różnych wariantów nazwy kontrahenta
        </p>
        {aliasError && (
          <p className="text-xs text-red-600 mt-1">{aliasError}</p>
        )}
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
