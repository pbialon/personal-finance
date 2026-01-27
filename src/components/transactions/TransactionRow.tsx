'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { cn, formatCurrency, formatShortDate } from '@/lib/utils';
import type { Transaction, Category } from '@/types';

interface TransactionRowProps {
  transaction: Transaction;
  categories: Category[];
  onCategoryChange: (transactionId: string, categoryId: string) => void;
  onDelete?: (transactionId: string) => void;
}

export function TransactionRow({
  transaction,
  categories,
  onCategoryChange,
  onDelete,
}: TransactionRowProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const displayName = transaction.display_name || transaction.raw_description || 'Brak opisu';
  const amount = transaction.is_income ? transaction.amount : -transaction.amount;

  return (
    <div className="flex items-center justify-between py-3 px-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0">
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm font-medium truncate',
          transaction.is_ignored ? 'text-gray-400' : 'text-gray-900'
        )}>
          {displayName}
        </p>
        <p className="text-xs text-gray-500">
          {formatShortDate(transaction.transaction_date)}
          {transaction.counterparty_name && ` • ${transaction.counterparty_name}`}
        </p>
      </div>

      <div className="flex items-center gap-4 ml-4">
        <select
          value={transaction.category_id || ''}
          onChange={(e) => onCategoryChange(transaction.id, e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Bez kategorii</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        <span
          className={cn(
            'text-sm font-semibold min-w-[100px] text-right',
            amount >= 0 ? 'text-green-600' : 'text-gray-900'
          )}
        >
          {formatCurrency(amount)}
        </span>

        {onDelete && (
          showConfirm ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  onDelete(transaction.id);
                  setShowConfirm(false);
                }}
                className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Usuń
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Anuluj
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirm(true)}
              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
              title="Usuń transakcję"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )
        )}
      </div>
    </div>
  );
}
