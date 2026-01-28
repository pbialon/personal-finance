'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, Store, Trash2, ChevronRight, ExternalLink, Pencil, Check } from 'lucide-react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { DynamicIcon } from '@/components/ui/DynamicIcon';
import { Button } from '@/components/ui/Button';
import type { Transaction, Category } from '@/types';

interface TransactionDetailSheetProps {
  transaction: Transaction | null;
  categories: Category[];
  onClose: () => void;
  onCategoryChange: (transactionId: string, categoryId: string) => void;
  onDescriptionChange?: (transactionId: string, description: string) => void;
  onDelete?: (transactionId: string) => void;
}

export function TransactionDetailSheet({
  transaction,
  categories,
  onClose,
  onCategoryChange,
  onDescriptionChange,
  onDelete,
}: TransactionDetailSheetProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');

  useEffect(() => {
    if (!transaction) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [transaction, onClose]);

  if (!transaction) return null;

  const displayName =
    transaction.description ||
    transaction.merchant?.display_name ||
    transaction.display_name ||
    transaction.raw_description ||
    'Brak opisu';
  const amount = transaction.is_income ? transaction.amount : -transaction.amount;
  const merchant = transaction.merchant;
  const category = transaction.category;

  const handleCategorySelect = (categoryId: string) => {
    onCategoryChange(transaction.id, categoryId);
    setIsEditingCategory(false);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(transaction.id);
      onClose();
    }
  };

  const handleStartEditDescription = () => {
    setEditedDescription(transaction.description || '');
    setIsEditingDescription(true);
  };

  const handleSaveDescription = () => {
    if (onDescriptionChange) {
      onDescriptionChange(transaction.id, editedDescription);
    }
    setIsEditingDescription(false);
  };

  const handleCancelEditDescription = () => {
    setIsEditingDescription(false);
    setEditedDescription('');
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

        {/* Description - editable AI-generated */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              Opis transakcji
            </p>
            {!isEditingDescription && onDescriptionChange && (
              <button
                onClick={handleStartEditDescription}
                className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <Pencil className="w-3 h-3" />
                Edytuj
              </button>
            )}
          </div>
          {isEditingDescription ? (
            <div className="space-y-2">
              <textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
                maxLength={200}
                placeholder="Dodaj opis transakcji..."
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {editedDescription.length}/200
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={handleCancelEditDescription}
                    className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800"
                  >
                    Anuluj
                  </button>
                  <button
                    onClick={handleSaveDescription}
                    className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    Zapisz
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-900">
              {transaction.description || 'Brak opisu'}
            </p>
          )}
        </div>

        {/* Details - raw description and counterparty */}
        {(transaction.raw_description || transaction.counterparty_name) && (
          <div className="px-6 py-4 border-b border-gray-100">
            {transaction.raw_description && (
              <div className="mb-2">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  Opis bankowy
                </p>
                <p className="text-sm text-gray-900">
                  {transaction.raw_description}
                </p>
              </div>
            )}
            {(transaction.counterparty_name || merchant) && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  Kontrahent
                </p>
                {merchant ? (
                  <Link
                    href={`/merchants/${merchant.id}`}
                    className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium"
                    onClick={onClose}
                  >
                    {merchant.display_name}
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <p className="text-sm text-gray-900">
                    {transaction.counterparty_name}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Category section */}
        <div className="px-6 py-4 border-b border-gray-100">
          {!isEditingCategory ? (
            /* Display current category with change button */
            <button
              onClick={() => setIsEditingCategory(true)}
              className="w-full flex items-center justify-between hover:bg-gray-50 -mx-2 px-2 py-1 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                {category ? (
                  <>
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: category.color + '20' }}
                    >
                      {category.icon && (
                        <DynamicIcon
                          name={category.icon}
                          className="w-4 h-4"
                          style={{ color: category.color }}
                        />
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {category.name}
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Store className="w-4 h-4 text-gray-400" />
                    </div>
                    <span className="text-sm text-gray-500">
                      Bez kategorii
                    </span>
                  </>
                )}
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          ) : (
            /* Category selection mode */
            <>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Wybierz kategorię
                </p>
                <button
                  onClick={() => setIsEditingCategory(false)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Anuluj
                </button>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide">
                {/* Uncategorized option */}
                <button
                  onClick={() => handleCategorySelect('')}
                  className={cn(
                    'px-2.5 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0',
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
                      'px-2.5 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap flex-shrink-0',
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
            </>
          )}
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
