'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Store, Receipt } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { DynamicIcon } from '../ui/DynamicIcon';
import { CategoryBadge } from '../ui/CategoryBadge';
import { TransactionDetailSheet } from '../transactions/TransactionDetailSheet';
import { formatCurrency, cn } from '@/lib/utils';
import type { Transaction, Category } from '@/types';

interface RecentTransactionsProps {
  transactions: Transaction[];
  categories: Category[];
  onCategoryChange?: (transactionId: string, categoryId: string) => void;
  onDescriptionChange?: (transactionId: string, description: string) => void;
  onDelete?: (transactionId: string) => void;
}

export function RecentTransactions({
  transactions,
  categories,
  onCategoryChange,
  onDescriptionChange,
  onDelete,
}: RecentTransactionsProps) {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const getCategoryById = (id: string | null) =>
    categories.find((c) => c.id === id);

  const handleCategoryChange = (transactionId: string, categoryId: string) => {
    onCategoryChange?.(transactionId, categoryId);
    if (selectedTransaction?.id === transactionId) {
      const updatedCategory = categories.find((c) => c.id === categoryId) || null;
      setSelectedTransaction({
        ...selectedTransaction,
        category_id: categoryId || null,
        category: updatedCategory || undefined,
      });
    }
  };

  const handleDescriptionChange = (transactionId: string, description: string) => {
    onDescriptionChange?.(transactionId, description);
    if (selectedTransaction?.id === transactionId) {
      setSelectedTransaction({
        ...selectedTransaction,
        description,
      });
    }
  };

  return (
  <>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Ostatnie transakcje</CardTitle>
        <Link
          href="/transactions"
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          Zobacz wszystkie
          <ArrowRight className="h-4 w-4" />
        </Link>
      </CardHeader>
      <CardContent className="px-0">
        {transactions.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Brak transakcji</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {transactions.map((transaction) => {
              const category = transaction.category || getCategoryById(transaction.category_id);
              const merchant = transaction.merchant;
              const amount = transaction.is_income
                ? transaction.amount
                : -transaction.amount;
              const displayName =
                transaction.description ||
                merchant?.display_name ||
                transaction.display_name ||
                transaction.raw_description ||
                'Brak opisu';

              // Subtitle: show merchant name if different from displayName
              const subtitle = merchant?.display_name;
              const showSubtitle = subtitle && subtitle !== displayName;

              return (
                <button
                  key={transaction.id}
                  onClick={() => setSelectedTransaction(transaction)}
                  className="w-full flex items-center gap-4 py-4 px-6 hover:bg-gray-50 transition-colors text-left"
                >
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    {merchant?.icon_url ? (
                      <img
                        src={merchant.icon_url}
                        alt={merchant.display_name}
                        className="w-12 h-12 rounded-2xl object-contain bg-gray-100"
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
                    <p className="text-base font-semibold text-gray-900 truncate">
                      {displayName}
                    </p>
                    {showSubtitle && (
                      <p className="text-sm text-gray-500 truncate">
                        {subtitle}
                      </p>
                    )}
                    <div className="mt-1">
                      <CategoryBadge category={category} size="sm" showIcon={false} />
                    </div>
                  </div>

                  {/* Amount */}
                  <span
                    className={cn(
                      'text-base font-bold tabular-nums flex-shrink-0',
                      amount >= 0 ? 'text-green-600' : 'text-gray-900'
                    )}
                  >
                    {amount > 0 && '+'}
                    {formatCurrency(amount)}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>

    <TransactionDetailSheet
      transaction={selectedTransaction}
      categories={categories}
      onClose={() => setSelectedTransaction(null)}
      onCategoryChange={handleCategoryChange}
      onDescriptionChange={handleDescriptionChange}
      onDelete={onDelete}
    />
  </>
  );
}
