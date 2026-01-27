'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useCategories } from '@/hooks/useCategories';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Transaction } from '@/types';
import { Loader2 } from 'lucide-react';

export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { categories } = useCategories();

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isIgnored, setIsIgnored] = useState(false);
  const [createRule, setCreateRule] = useState(false);

  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        const response = await fetch(`/api/transactions?limit=1&search=${params.id}`);
        const result = await response.json();
        const tx = result.data?.find((t: Transaction) => t.id === params.id);

        if (tx) {
          setTransaction(tx);
          setDisplayName(tx.display_name || tx.raw_description || '');
          setCategoryId(tx.category_id || '');
          setIsIgnored(tx.is_ignored);
        }
      } catch (error) {
        console.error('Failed to fetch transaction:', error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchTransaction();
    }
  }, [params.id]);

  const handleSave = async () => {
    if (!transaction) return;

    setSaving(true);
    try {
      await fetch('/api/transactions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: transaction.id,
          display_name: displayName,
          category_id: categoryId || null,
          is_ignored: isIgnored,
          create_rule: createRule && !!transaction.counterparty_account,
          apply_rule_to_existing: createRule,
        }),
      });

      router.push('/transactions');
    } catch (error) {
      console.error('Failed to save transaction:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Transakcja nie znaleziona</p>
        <Link href="/transactions" className="text-blue-600 hover:underline mt-2 inline-block">
          Powrót do listy
        </Link>
      </div>
    );
  }

  const categoryOptions = [
    { value: '', label: 'Bez kategorii' },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/transactions">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Szczegóły transakcji</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informacje</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Data</span>
              <p className="font-medium">{formatDate(transaction.transaction_date)}</p>
            </div>
            <div>
              <span className="text-gray-500">Kwota</span>
              <p className={`font-medium ${transaction.is_income ? 'text-green-600' : 'text-gray-900'}`}>
                {transaction.is_income ? '+' : '-'}{formatCurrency(transaction.amount)}
              </p>
            </div>
            <div className="col-span-2">
              <span className="text-gray-500">Oryginalny opis</span>
              <p className="font-medium">{transaction.raw_description || 'Brak'}</p>
            </div>
            {transaction.counterparty_name && (
              <div className="col-span-2">
                <span className="text-gray-500">Kontrahent</span>
                <p className="font-medium">{transaction.counterparty_name}</p>
              </div>
            )}
            {transaction.counterparty_account && (
              <div className="col-span-2">
                <span className="text-gray-500">Numer konta</span>
                <p className="font-medium font-mono text-xs">{transaction.counterparty_account}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Edycja</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Nazwa wyświetlana"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Nazwa transakcji"
          />

          <Select
            label="Kategoria"
            options={categoryOptions}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          />

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isIgnored}
              onChange={(e) => setIsIgnored(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Ignoruj tę transakcję w statystykach</span>
          </label>

          {transaction.counterparty_account && categoryId && (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={createRule}
                onChange={(e) => setCreateRule(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                Utwórz regułę dla tego konta (automatyczna kategoryzacja przyszłych transakcji)
              </span>
            </label>
          )}

          <div className="flex gap-2 pt-4">
            <Link href="/transactions" className="flex-1">
              <Button variant="secondary" className="w-full">
                Anuluj
              </Button>
            </Link>
            <Button onClick={handleSave} loading={saving} className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              Zapisz
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
