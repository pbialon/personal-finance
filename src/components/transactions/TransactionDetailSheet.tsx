'use client';

import { useState } from 'react';
import { X, Store, Pencil, Trash2 } from 'lucide-react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { DynamicIcon } from '@/components/ui/DynamicIcon';
import { Button } from '@/components/ui/Button';
import type { Transaction, Category } from '@/types';

interface TransactionDetailSheetProps {
  transaction: Transaction | null;
  categories: Category[];
  onClose: () => void;
  onCategoryChange: (transactionId: string, categoryId: string) => void;
  onDelete?: (transactionId: string) => void;
}

export function TransactionDetailSheet({
  transaction,
  categories,
  onClose,
  onCategoryChange,
  onDelete,
}: TransactionDetailSheetProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!transaction) return null;

  const displayName =
    transaction.merchant?.display_name ||
    transaction.display_name ||
    transaction.raw_description ||
    'Brak opisu';
  const amount = transaction.is_income ? transaction.amount : -transaction.amount;
  const merchant = transaction.merchant;
  const category = transaction.category;

  const handleCategorySelect = (categoryId: string) => {
    onCategoryChange(transaction.id, categoryId);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(transaction.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative z-50 w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl max-h-[90vh] overflow-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {/* Header with icon and amount */}
        <div className="pt-8 pb-6 px-6 text-center border-b border-gray-100">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            {merchant?.icon_url ? (
              <img
                src={merchant.icon_url}
                alt={merchant.display_name}
                className="w-16 h-16 rounded-2xl object-contain bg-gray-100"
              />
            ) : category?.icon ? (
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: category.color + '20' }}
              >
                <DynamicIcon
                  name={category.icon}
                  className="w-8 h-8"
                  style={{ color: category.color }}
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                <Store className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>

          {/* Name */}
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {displayName}
          </h2>

          {/* Amount */}
          <p
            className={cn(
              'text-3xl font-bold tabular-nums',
              amount >= 0 ? 'text-green-600' : 'text-gray-900'
            )}
          >
            {amount > 0 && '+'}
            {formatCurrency(amount)}
          </p>

          {/* Date */}
          <p className="text-sm text-gray-500 mt-2">
            {formatDate(transaction.transaction_date)}
          </p>
        </div>

        {/* Details */}
        {(transaction.raw_description || transaction.counterparty_name) && (
          <div className="px-6 py-4 border-b border-gray-100">
            {transaction.raw_description && (
              <div className="mb-2">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  Opis
                </p>
                <p className="text-sm text-gray-900">
                  {transaction.raw_description}
                </p>
              </div>
            )}
            {transaction.counterparty_name && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  Kontrahent
                </p>
                <p className="text-sm text-gray-900">
                  {transaction.counterparty_name}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Category selection */}
        <div className="px-6 py-4 border-b border-gray-100">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">
            Kategoria
          </p>
          <div className="flex flex-wrap gap-2">
            {/* Uncategorized option */}
            <button
              onClick={() => handleCategorySelect('')}
              className={cn(
                'px-3 py-2 rounded-full text-sm font-medium transition-colors',
                !transaction.category_id
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              Bez kategorii
            </button>

            {/* Category options */}
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat.id)}
                className={cn(
                  'px-3 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5',
                  transaction.category_id === cat.id
                    ? 'ring-2 ring-offset-2'
                    : 'hover:opacity-80'
                )}
                style={{
                  backgroundColor:
                    transaction.category_id === cat.id
                      ? cat.color
                      : `${cat.color}15`,
                  color:
                    transaction.category_id === cat.id ? 'white' : cat.color,
                  ...(transaction.category_id === cat.id
                    ? { ['--tw-ring-color' as string]: cat.color }
                    : {}),
                }}
              >
                {cat.icon && (
                  <DynamicIcon
                    name={cat.icon}
                    className="w-4 h-4"
                    style={{
                      color:
                        transaction.category_id === cat.id
                          ? 'white'
                          : cat.color,
                    }}
                  />
                )}
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 flex gap-3">
          {onDelete && (
            showDeleteConfirm ? (
              <div className="flex-1 flex gap-2">
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={handleDelete}
                >
                  Potwierdź usunięcie
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Anuluj
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                className="flex-1 text-red-600 hover:bg-red-50"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Usuń
              </Button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
