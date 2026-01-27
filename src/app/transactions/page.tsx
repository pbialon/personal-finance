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

  const { transactions, loading, count, updateCategory, addTransaction, deleteTransaction } = useTransactions(filters);
  const { categories } = useCategories();

  const handleCategoryChange = async (transactionId: string, categoryId: string) => {
    try {
      await updateCategory(transactionId, categoryId);
    } catch (error) {
      console.error('Failed to update category:', error);
    }
  };

  const handleDelete = async (transactionId: string) => {
    try {
      await deleteTransaction(transactionId);
    } catch (error) {
      console.error('Failed to delete transaction:', error);
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Transakcje</h1>
          <span className="bg-gray-100 text-gray-600 text-sm font-medium px-2.5 py-0.5 rounded-full">
            {count}
          </span>
        </div>
        {/* Desktop add button */}
        <Button onClick={() => setShowAddModal(true)} className="hidden sm:flex">
          <Plus className="h-4 w-4 mr-2" />
          Dodaj transakcję
        </Button>
      </div>

      {/* Filters */}
      <TransactionFiltersComponent
        categories={categories}
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* Transaction list */}
      <TransactionList
        transactions={transactions}
        categories={categories}
        loading={loading}
        onCategoryChange={handleCategoryChange}
        onDelete={handleDelete}
      />

      {/* Mobile FAB */}
      <button
        onClick={() => setShowAddModal(true)}
        className="sm:hidden fixed bottom-24 right-4 z-40 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 active:bg-blue-800 transition-colors flex items-center justify-center"
        aria-label="Dodaj transakcję"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Add transaction modal */}
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
