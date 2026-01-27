'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Store, Pencil, Trash2, ExternalLink, Loader2 } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { MerchantForm } from '@/components/merchants/MerchantForm';
import { TransactionList } from '@/components/transactions/TransactionList';
import { DynamicIcon } from '@/components/ui/DynamicIcon';
import { useCategories } from '@/hooks/useCategories';
import type { Merchant, Transaction } from '@/types';

interface MerchantDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function MerchantDetailPage({ params }: MerchantDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { categories } = useCategories();

  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [stats, setStats] = useState({ totalSpent: 0, transactionCount: 0 });

  useEffect(() => {
    fetchMerchant();
    fetchTransactions();
  }, [id]);

  const fetchMerchant = async () => {
    try {
      const response = await fetch(`/api/merchants?id=${id}`);
      if (response.ok) {
        const data = await response.json();
        setMerchant(data);
      }
    } catch (error) {
      console.error('Failed to fetch merchant:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch(`/api/transactions?merchantId=${id}&limit=100`);
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.data || []);

        // Calculate stats
        const txs = data.data || [];
        const totalSpent = txs.reduce((sum: number, tx: Transaction) => {
          return sum + (tx.is_income ? tx.amount : -tx.amount);
        }, 0);
        setStats({
          totalSpent,
          transactionCount: txs.length,
        });
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (data: {
    display_name: string;
    icon_url: string | null;
    category_id: string | null;
    website: string | null;
  }) => {
    try {
      const response = await fetch('/api/merchants', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data }),
      });
      if (response.ok) {
        const updated = await response.json();
        setMerchant(updated);
        setShowEditModal(false);
      }
    } catch (error) {
      console.error('Failed to update merchant:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Czy na pewno chcesz usunąć tego kontrahenta?')) return;
    try {
      const response = await fetch(`/api/merchants?id=${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        router.push('/merchants');
      }
    } catch (error) {
      console.error('Failed to delete merchant:', error);
    }
  };

  const handleCategoryChange = async (transactionId: string, categoryId: string) => {
    try {
      const response = await fetch('/api/transactions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: transactionId, category_id: categoryId || null }),
      });
      if (response.ok) {
        const updated = await response.json();
        setTransactions(prev =>
          prev.map(tx => tx.id === transactionId ? { ...tx, ...updated } : tx)
        );
      }
    } catch (error) {
      console.error('Failed to update category:', error);
    }
  };

  const handleDescriptionChange = async (transactionId: string, description: string) => {
    try {
      const response = await fetch('/api/transactions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: transactionId, description }),
      });
      if (response.ok) {
        const updated = await response.json();
        setTransactions(prev =>
          prev.map(tx => tx.id === transactionId ? { ...tx, ...updated } : tx)
        );
      }
    } catch (error) {
      console.error('Failed to update description:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Nie znaleziono kontrahenta</p>
        <Link href="/merchants" className="text-blue-600 hover:underline mt-2 inline-block">
          Wróć do listy
        </Link>
      </div>
    );
  }

  const category = merchant.category || categories.find(c => c.id === merchant.category_id);

  // Calculate suggested category from transactions (most frequent)
  const suggestedCategoryId = (() => {
    if (transactions.length === 0) return null;
    const categoryCounts = new Map<string, number>();
    transactions.forEach(tx => {
      if (tx.category_id) {
        categoryCounts.set(tx.category_id, (categoryCounts.get(tx.category_id) || 0) + 1);
      }
    });
    if (categoryCounts.size === 0) return null;
    let maxCount = 0;
    let mostFrequentId: string | null = null;
    categoryCounts.forEach((count, catId) => {
      if (count > maxCount) {
        maxCount = count;
        mostFrequentId = catId;
      }
    });
    return mostFrequentId;
  })();

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/merchants"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="w-4 h-4" />
        Wszyscy kontrahenci
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-start gap-4">
          {/* Icon */}
          {merchant.icon_url ? (
            <img
              src={merchant.icon_url}
              alt={merchant.display_name}
              className="w-16 h-16 rounded-xl object-contain bg-gray-50"
            />
          ) : category?.icon ? (
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: category.color + '20' }}
            >
              <DynamicIcon
                name={category.icon}
                className="w-8 h-8"
                style={{ color: category.color }}
              />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center">
              <Store className="w-8 h-8 text-gray-400" />
            </div>
          )}

          {/* Info */}
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">
              {merchant.display_name}
            </h1>
            {merchant.name !== merchant.display_name && (
              <p className="text-sm text-gray-500 mt-0.5">
                {merchant.name}
              </p>
            )}
            {category && (
              <div
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium mt-2"
                style={{
                  backgroundColor: category.color + '15',
                  color: category.color,
                }}
              >
                {category.icon && (
                  <DynamicIcon name={category.icon} className="w-3 h-3" />
                )}
                {category.name}
              </div>
            )}
            {merchant.website && (
              <a
                href={merchant.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-blue-600 hover:underline mt-2"
              >
                {merchant.website.replace(/^https?:\/\//, '')}
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowEditModal(true)}
            >
              <Pencil className="w-4 h-4 mr-1.5" />
              Edytuj
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-6 mt-6 pt-6 border-t border-gray-100">
          <div>
            <p className="text-sm text-gray-500">Łączna kwota</p>
            <p className={cn(
              'text-2xl font-bold tabular-nums',
              stats.totalSpent >= 0 ? 'text-green-600' : 'text-gray-900'
            )}>
              {formatCurrency(stats.totalSpent)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Transakcje</p>
            <p className="text-2xl font-bold text-gray-900 tabular-nums">
              {stats.transactionCount}
            </p>
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Historia transakcji
        </h2>
        <TransactionList
          transactions={transactions}
          categories={categories}
          loading={false}
          onCategoryChange={handleCategoryChange}
          onDescriptionChange={handleDescriptionChange}
        />
      </div>

      {/* Edit modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edytuj kontrahenta"
        size="md"
      >
        <MerchantForm
          merchant={merchant}
          categories={categories}
          suggestedCategoryId={suggestedCategoryId}
          onSubmit={handleUpdate}
          onCancel={() => setShowEditModal(false)}
        />
      </Modal>
    </div>
  );
}
