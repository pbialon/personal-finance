'use client';

import Link from 'next/link';
import { ArrowRight, Store } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { DynamicIcon } from '../ui/DynamicIcon';
import { CategoryBadge } from '../ui/CategoryBadge';
import { formatCurrency, cn } from '@/lib/utils';
import type { Transaction, Category } from '@/types';

interface RecentTransactionsProps {
  transactions: Transaction[];
  categories: Category[];
}

export function RecentTransactions({ transactions, categories }: RecentTransactionsProps) {
  const getCategoryById = (id: string | null) =>
    categories.find((c) => c.id === id);

  return (
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
                merchant?.display_name ||
                transaction.display_name ||
                transaction.raw_description ||
                'Brak opisu';

              return (
                <Link
                  key={transaction.id}
                  href="/transactions"
                  className="flex items-center gap-4 py-4 px-6 hover:bg-gray-50 transition-colors"
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
                    {transaction.description && (
                      <p className="text-sm text-gray-500 truncate">
                        {transaction.description.length > 60
                          ? transaction.description.slice(0, 60) + '...'
                          : transaction.description}
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
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
