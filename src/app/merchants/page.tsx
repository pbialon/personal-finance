'use client';

import { useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { MerchantList } from '@/components/merchants/MerchantList';
import { MerchantForm } from '@/components/merchants/MerchantForm';
import { useMerchants } from '@/hooks/useMerchants';
import { useCategories } from '@/hooks/useCategories';
import type { Merchant } from '@/types';

export default function MerchantsPage() {
  const { merchants, loading, updateMerchant, deleteMerchant } = useMerchants();
  const { categories } = useCategories();
  const [showModal, setShowModal] = useState(false);
  const [editingMerchant, setEditingMerchant] = useState<Merchant | null>(null);
  const [search, setSearch] = useState('');

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
