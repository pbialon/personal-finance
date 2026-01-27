'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { CategoryList } from '@/components/categories/CategoryList';
import { CategoryForm } from '@/components/categories/CategoryForm';
import { useCategories } from '@/hooks/useCategories';
import type { Category } from '@/types';
import { Loader2 } from 'lucide-react';

export default function CategoriesPage() {
  const { categories, loading, addCategory, updateCategory, deleteCategory } = useCategories();
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setShowModal(true);
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Czy na pewno chcesz usunąć tę kategorię?')) return;
    try {
      await deleteCategory(categoryId);
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  const handleSubmit = async (data: {
    name: string;
    color: string;
    icon: string;
    ai_prompt: string;
    is_savings: boolean;
  }) => {
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, data);
      } else {
        await addCategory(data);
      }
      setShowModal(false);
      setEditingCategory(null);
    } catch (error) {
      console.error('Failed to save category:', error);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingCategory(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kategorie</h1>
          <p className="text-sm text-gray-500">
            Zarządzaj kategoriami transakcji i promptami AI
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Dodaj kategorię
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <CategoryList
          categories={categories}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      <Modal
        isOpen={showModal}
        onClose={handleClose}
        title={editingCategory ? 'Edytuj kategorię' : 'Dodaj kategorię'}
        size="md"
      >
        <CategoryForm
          category={editingCategory || undefined}
          onSubmit={handleSubmit}
          onCancel={handleClose}
        />
      </Modal>
    </div>
  );
}
