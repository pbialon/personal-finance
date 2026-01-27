'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { formatCurrency, formatShortDate, cn } from '@/lib/utils';
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
              const category = getCategoryById(transaction.category_id);
              const amount = transaction.is_income
                ? transaction.amount
                : -transaction.amount;

              return (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between py-3 px-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-medium"
                      style={{ backgroundColor: category?.color || '#6b7280' }}
                    >
                      {(category?.name || '?').charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {transaction.display_name || transaction.raw_description}
                      </p>
                      <p className="text-xs text-gray-500">
                        {category?.name || 'Bez kategorii'} •{' '}
                        {formatShortDate(transaction.transaction_date)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      'text-sm font-semibold',
                      amount >= 0 ? 'text-green-600' : 'text-gray-900'
                    )}
                  >
                    {formatCurrency(amount)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
