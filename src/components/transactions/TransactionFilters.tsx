'use client';

import { useState } from 'react';
import { Search, SlidersHorizontal, X, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '../ui/Input';
import { DynamicIcon } from '../ui/DynamicIcon';
import type { Category, TransactionFilters } from '@/types';

interface TransactionFiltersProps {
  categories: Category[];
  filters: TransactionFilters;
  onFiltersChange: (filters: TransactionFilters) => void;
}

type QuickFilter = 'today' | 'week' | 'month' | null;

export function TransactionFiltersComponent({
  categories,
  filters,
  onFiltersChange,
}: TransactionFiltersProps) {
  const [search, setSearch] = useState(filters.search || '');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>(null);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    onFiltersChange({ ...filters, search: value || undefined });
  };

  const getDateRange = (type: QuickFilter): { startDate: string; endDate: string } | null => {
    if (!type) return null;

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    switch (type) {
      case 'today':
        return { startDate: todayStr, endDate: todayStr };
      case 'week': {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay() + 1); // Monday
        return { startDate: weekStart.toISOString().split('T')[0], endDate: todayStr };
      }
      case 'month': {
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        return { startDate: monthStart.toISOString().split('T')[0], endDate: todayStr };
      }
      default:
        return null;
    }
  };

  const handleQuickFilter = (type: QuickFilter) => {
    if (quickFilter === type) {
      // Toggle off
      setQuickFilter(null);
      onFiltersChange({ ...filters, startDate: undefined, endDate: undefined });
    } else {
      setQuickFilter(type);
      const dateRange = getDateRange(type);
      if (dateRange) {
        onFiltersChange({ ...filters, ...dateRange });
      }
    }
  };

  const handleCategoryFilter = (categoryId: string) => {
    if (filters.categoryId === categoryId) {
      onFiltersChange({ ...filters, categoryId: undefined });
    } else {
      onFiltersChange({ ...filters, categoryId });
    }
  };

  const handleTypeFilter = (type: 'income' | 'expense' | null) => {
    if (type === null) {
      onFiltersChange({ ...filters, isIncome: undefined });
    } else {
      const isIncome = type === 'income';
      onFiltersChange({ ...filters, isIncome: filters.isIncome === isIncome ? undefined : isIncome });
    }
  };

  const clearFilters = () => {
    setSearch('');
    setQuickFilter(null);
    setShowAdvanced(false);
    onFiltersChange({});
  };

  const hasActiveFilters =
    filters.search ||
    filters.startDate ||
    filters.endDate ||
    filters.categoryId ||
    filters.isIncome !== undefined;

  const activeFilterCount = [
    filters.search,
    filters.startDate || filters.endDate,
    filters.categoryId,
    filters.isIncome !== undefined,
  ].filter(Boolean).length;

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Szukaj transakcji..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-gray-100 rounded-xl border-0 text-base placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
        />
        {search && (
          <button
            onClick={() => handleSearchChange('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        )}
      </div>

      {/* Quick filter pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {/* Advanced filters toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap',
            showAdvanced || hasActiveFilters
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtruj
          {activeFilterCount > 0 && (
            <span className="ml-1 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">
              {activeFilterCount}
            </span>
          )}
          {showAdvanced ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        {/* Quick date filters */}
        <button
          onClick={() => handleQuickFilter('today')}
          className={cn(
            'px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap',
            quickFilter === 'today'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          Dzisiaj
        </button>
        <button
          onClick={() => handleQuickFilter('week')}
          className={cn(
            'px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap',
            quickFilter === 'week'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          Ten tydzień
        </button>
        <button
          onClick={() => handleQuickFilter('month')}
          className={cn(
            'px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap',
            quickFilter === 'month'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          Ten miesiąc
        </button>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-3 py-1.5 rounded-full text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors whitespace-nowrap"
          >
            Wyczyść
          </button>
        )}
      </div>

      {/* Advanced filters panel */}
      {showAdvanced && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
          {/* Date range */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
              Zakres dat
            </p>
            <div className="flex gap-2">
              <Input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => {
                  setQuickFilter(null);
                  onFiltersChange({ ...filters, startDate: e.target.value || undefined });
                }}
                className="flex-1"
              />
              <span className="text-gray-400 self-center">—</span>
              <Input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => {
                  setQuickFilter(null);
                  onFiltersChange({ ...filters, endDate: e.target.value || undefined });
                }}
                className="flex-1"
              />
            </div>
          </div>

          {/* Transaction type */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
              Typ transakcji
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleTypeFilter('expense')}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  filters.isIncome === false
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                Wydatki
              </button>
              <button
                onClick={() => handleTypeFilter('income')}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  filters.isIncome === true
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                Przychody
              </button>
            </div>
          </div>

          {/* Categories */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
              Kategoria
            </p>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryFilter(cat.id)}
                  className={cn(
                    'px-3 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5',
                    filters.categoryId === cat.id
                      ? 'ring-2 ring-offset-1'
                      : 'hover:opacity-80'
                  )}
                  style={{
                    backgroundColor:
                      filters.categoryId === cat.id ? cat.color : `${cat.color}15`,
                    color: filters.categoryId === cat.id ? 'white' : cat.color,
                    ...(filters.categoryId === cat.id
                      ? { ['--tw-ring-color' as string]: cat.color }
                      : {}),
                  }}
                >
                  {cat.icon && (
                    <DynamicIcon
                      name={cat.icon}
                      className="w-4 h-4"
                      style={{
                        color: filters.categoryId === cat.id ? 'white' : cat.color,
                      }}
                    />
                  )}
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
