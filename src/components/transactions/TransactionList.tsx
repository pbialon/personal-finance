'use client';

import type { Transaction, Category } from '@/types';
import { TransactionRow } from './TransactionRow';
import { Card, CardContent } from '../ui/Card';
import { Loader2 } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
  loading?: boolean;
  onCategoryChange: (transactionId: string, categoryId: string) => void;
  onDelete?: (transactionId: string) => void;
}

export function TransactionList({
  transactions,
  categories,
  loading,
  onCategoryChange,
  onDelete,
}: TransactionListProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-gray-500">Brak transakcji</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <div className="divide-y divide-gray-100">
        {transactions.map((transaction) => (
          <TransactionRow
            key={transaction.id}
            transaction={transaction}
            categories={categories}
            onCategoryChange={onCategoryChange}
            onDelete={onDelete}
          />
        ))}
      </div>
    </Card>
  );
}
