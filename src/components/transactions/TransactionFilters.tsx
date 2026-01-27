'use client';

import { useState } from 'react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Search, X } from 'lucide-react';
import type { Category, TransactionFilters } from '@/types';

interface TransactionFiltersProps {
  categories: Category[];
  filters: TransactionFilters;
  onFiltersChange: (filters: TransactionFilters) => void;
}

export function TransactionFiltersComponent({
  categories,
  filters,
  onFiltersChange,
}: TransactionFiltersProps) {
  const [search, setSearch] = useState(filters.search || '');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFiltersChange({ ...filters, search });
  };

  const clearFilters = () => {
    setSearch('');
    onFiltersChange({});
  };

  const categoryOptions = [
    { value: '', label: 'Wszystkie kategorie' },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ];

  const typeOptions = [
    { value: '', label: 'Wszystkie' },
    { value: 'income', label: 'Przychody' },
    { value: 'expense', label: 'Wydatki' },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
      <div className="flex flex-col lg:flex-row gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <Input
            placeholder="Szukaj transakcji..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" variant="secondary" size="md">
            <Search className="h-4 w-4" />
          </Button>
        </form>

        <div className="flex gap-2">
          <Input
            type="date"
            value={filters.startDate || ''}
            onChange={(e) =>
              onFiltersChange({ ...filters, startDate: e.target.value })
            }
            className="w-40"
          />
          <Input
            type="date"
            value={filters.endDate || ''}
            onChange={(e) =>
              onFiltersChange({ ...filters, endDate: e.target.value })
            }
            className="w-40"
          />
        </div>

        <Select
          options={categoryOptions}
          value={filters.categoryId || ''}
          onChange={(e) =>
            onFiltersChange({ ...filters, categoryId: e.target.value || undefined })
          }
          className="w-48"
        />

        <Select
          options={typeOptions}
          value={
            filters.isIncome === true
              ? 'income'
              : filters.isIncome === false
              ? 'expense'
              : ''
          }
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              isIncome:
                e.target.value === 'income'
                  ? true
                  : e.target.value === 'expense'
                  ? false
                  : undefined,
            })
          }
          className="w-36"
        />

        <Button variant="ghost" size="md" onClick={clearFilters}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
