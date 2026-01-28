'use client';

import { ChevronRight, Store } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { DynamicIcon } from '@/components/ui/DynamicIcon';
import { CategoryBadge } from '@/components/ui/CategoryBadge';
import type { Transaction } from '@/types';

interface TransactionRowProps {
  transaction: Transaction;
  onClick?: (transaction: Transaction) => void;
  isRecurring?: boolean;
}

export function TransactionRow({ transaction, onClick, isRecurring }: TransactionRowProps) {
  const displayName =
    transaction.description ||
    transaction.merchant?.display_name ||
    transaction.display_name ||
    transaction.raw_description ||
    'Brak opisu';

  // Subtitle: show merchant name if different from displayName
  const subtitle = transaction.merchant?.display_name;
  const showSubtitle = subtitle && subtitle !== displayName;

  const amount = transaction.is_income ? transaction.amount : -transaction.amount;

  const merchant = transaction.merchant;
  const category = transaction.category;

  return (
    <button
      type="button"
      onClick={() => onClick?.(transaction)}
      className={cn(
        'w-full flex items-center gap-4 px-4 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left',
        transaction.is_ignored && 'opacity-50'
      )}
    >
      {/* Icon - 48x48 */}
      <div className="flex-shrink-0">
        {merchant?.icon_url ? (
          <img
            src={merchant.icon_url}
            alt={merchant.display_name}
            className="w-12 h-12 rounded-2xl object-contain bg-gray-100"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : category?.icon ? (
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: category.color + '20' }}
          >
            <DynamicIcon
              name={category.icon}
              className="w-6 h-6"
              style={{ color: category.color }}
            />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
            <Store className="w-6 h-6 text-gray-400" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-base font-semibold truncate',
            transaction.is_ignored ? 'text-gray-400' : 'text-gray-900'
          )}
        >
          {displayName}
        </p>
        {showSubtitle && (
          <p
            className={cn(
              'text-sm truncate',
              transaction.is_ignored ? 'text-gray-300' : 'text-gray-500'
            )}
          >
            {subtitle}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <CategoryBadge category={category} size="sm" showIcon={false} />
          {isRecurring && (
            <span className="text-xs bg-cyan-100 text-cyan-700 px-1.5 py-0.5 rounded font-medium">
              Cykliczna
            </span>
          )}
        </div>
      </div>

      {/* Amount + Chevron */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span
          className={cn(
            'text-base font-bold tabular-nums',
            amount >= 0 ? 'text-green-600' : 'text-gray-900'
          )}
        >
          {amount > 0 && '+'}
          {formatCurrency(amount)}
        </span>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </div>
    </button>
  );
}
