'use client';

import { useState, useEffect } from 'react';
import { Loader2, Search, Sparkles } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { MerchantList } from '@/components/merchants/MerchantList';
import { MerchantForm } from '@/components/merchants/MerchantForm';
import { useMerchants } from '@/hooks/useMerchants';
import { useCategories } from '@/hooks/useCategories';
import type { Merchant } from '@/types';

interface ExtractionStatus {
  transactionsWithoutMerchant: number;
  transactionsWithMerchant: number;
  totalMerchants: number;
}

export default function MerchantsPage() {
  const { merchants, loading, refresh, updateMerchant, deleteMerchant } = useMerchants();
  const { categories } = useCategories();
  const [showModal, setShowModal] = useState(false);
  const [editingMerchant, setEditingMerchant] = useState<Merchant | null>(null);
  const [search, setSearch] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extractionStatus, setExtractionStatus] = useState<ExtractionStatus | null>(null);

  const fetchExtractionStatus = async () => {
    try {
      const response = await fetch('/api/merchants/extract');
      if (response.ok) {
        const data = await response.json();
        setExtractionStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch extraction status:', error);
    }
  };

  useEffect(() => {
    fetchExtractionStatus();
  }, [merchants.length]);

  const handleExtract = async () => {
    setExtracting(true);
    try {
      const response = await fetch('/api/merchants/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 50 }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.processed > 0) {
          refresh();
        }
        await fetchExtractionStatus();
      }
    } catch (error) {
      console.error('Failed to extract merchants:', error);
    } finally {
      setExtracting(false);
    }
  };

  const handleEdit = (merchant: Merchant) => {
    setEditingMerchant(merchant);
    setShowModal(true);
  };

  const handleDelete = async (merchantId: string) => {
    if (!confirm('Czy na pewno chcesz usunąć tego kontrahenta?')) return;
    try {
      await deleteMerchant(merchantId);
    } catch (error) {
      console.error('Failed to delete merchant:', error);
    }
  };

  const handleSubmit = async (data: {
    display_name: string;
    icon_url: string | null;
    category_id: string | null;
    website: string | null;
  }) => {
    if (!editingMerchant) return;
    try {
      await updateMerchant(editingMerchant.id, data);
      setShowModal(false);
      setEditingMerchant(null);
    } catch (error) {
      console.error('Failed to update merchant:', error);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingMerchant(null);
  };

  const filteredMerchants = search
    ? merchants.filter(
        (m) =>
          m.display_name.toLowerCase().includes(search.toLowerCase()) ||
          m.name.toLowerCase().includes(search.toLowerCase())
      )
    : merchants;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kontrahenci</h1>
          <p className="text-sm text-gray-500">
            Zarządzaj kontrahentami, ich ikonami i domyślnymi kategoriami
          </p>
        </div>
        {extractionStatus && extractionStatus.transactionsWithoutMerchant > 0 && (
          <Button onClick={handleExtract} disabled={extracting}>
            {extracting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Rozpoznaj ({extractionStatus.transactionsWithoutMerchant})
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Szukaj kontrahenta..."
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500">
            {filteredMerchants.length} kontrahentów
          </p>
          <MerchantList
            merchants={filteredMerchants}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </>
      )}

      <Modal
        isOpen={showModal}
        onClose={handleClose}
        title="Edytuj kontrahenta"
        size="md"
      >
        {editingMerchant && (
          <MerchantForm
            merchant={editingMerchant}
            categories={categories}
            onSubmit={handleSubmit}
            onCancel={handleClose}
          />
        )}
      </Modal>
    </div>
  );
}
