'use client';

import { useState } from 'react';
import type { Transaction, Category } from '@/types';
import { groupByDate } from '@/lib/utils';
import { TransactionDateGroup } from './TransactionDateGroup';
import { TransactionDetailSheet } from './TransactionDetailSheet';
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
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

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

  const groupedTransactions = groupByDate(transactions);

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
  };

  const handleCategoryChange = (transactionId: string, categoryId: string) => {
    onCategoryChange(transactionId, categoryId);
    // Update selected transaction if it's the one being modified
    if (selectedTransaction?.id === transactionId) {
      const updatedCategory = categories.find((c) => c.id === categoryId) || null;
      setSelectedTransaction({
        ...selectedTransaction,
        category_id: categoryId || null,
        category: updatedCategory || undefined,
      });
    }
  };

  return (
    <>
      <Card className="overflow-hidden">
        {groupedTransactions.map((group) => (
          <TransactionDateGroup
            key={group.date}
            label={group.label}
            transactions={group.transactions}
            onTransactionClick={handleTransactionClick}
          />
        ))}
      </Card>

      <TransactionDetailSheet
        transaction={selectedTransaction}
        categories={categories}
        onClose={() => setSelectedTransaction(null)}
        onCategoryChange={handleCategoryChange}
        onDelete={onDelete}
      />
    </>
  );
}
