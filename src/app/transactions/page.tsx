'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { TransactionList } from '@/components/transactions/TransactionList';
import { TransactionFiltersComponent } from '@/components/transactions/TransactionFilters';
import { ManualTransactionForm } from '@/components/transactions/ManualTransactionForm';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import type { TransactionFilters } from '@/types';

export default function TransactionsPage() {
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [showAddModal, setShowAddModal] = useState(false);

  const { transactions, loading, count, updateCategory, addTransaction } = useTransactions(filters);
  const { categories } = useCategories();

  const handleCategoryChange = async (transactionId: string, categoryId: string) => {
    try {
      await updateCategory(transactionId, categoryId);
    } catch (error) {
      console.error('Failed to update category:', error);
    }
  };

  const handleAddTransaction = async (data: {
    amount: number;
    description: string;
    category_id: string;
    transaction_date: string;
    is_income: boolean;
  }) => {
    await addTransaction(data);
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transakcje</h1>
          <p className="text-sm text-gray-500">
            {count} transakcji
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Dodaj transakcję
        </Button>
      </div>

      <TransactionFiltersComponent
        categories={categories}
        filters={filters}
        onFiltersChange={setFilters}
      />

      <TransactionList
        transactions={transactions}
        categories={categories}
        loading={loading}
        onCategoryChange={handleCategoryChange}
      />

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Dodaj transakcję"
      >
        <ManualTransactionForm
          categories={categories}
          onSubmit={handleAddTransaction}
          onCancel={() => setShowAddModal(false)}
        />
      </Modal>
    </div>
  );
}
