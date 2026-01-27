'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Category } from '@/types';

interface UseCategoriesResult {
  categories: Category[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  addCategory: (data: {
    name: string;
    color: string;
    icon: string;
    ai_prompt: string;
    is_savings: boolean;
  }) => Promise<void>;
  updateCategory: (id: string, data: {
    name: string;
    color: string;
    icon: string;
    ai_prompt: string;
    is_savings: boolean;
  }) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
}

export function useCategories(): UseCategoriesResult {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');

      const data = await response.json();
      setCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const addCategory = async (data: {
    name: string;
    color: string;
    icon: string;
    ai_prompt: string;
    is_savings: boolean;
  }) => {
    const response = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error('Failed to add category');

    const newCategory = await response.json();
    setCategories((prev) => [...prev, newCategory].sort((a, b) => a.name.localeCompare(b.name)));
  };

  const updateCategory = async (id: string, data: {
    name: string;
    color: string;
    icon: string;
    ai_prompt: string;
    is_savings: boolean;
  }) => {
    const response = await fetch('/api/categories', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...data }),
    });

    if (!response.ok) throw new Error('Failed to update category');

    const updated = await response.json();
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? updated : c)).sort((a, b) => a.name.localeCompare(b.name))
    );
  };

  const deleteCategory = async (id: string) => {
    const response = await fetch(`/api/categories?id=${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) throw new Error('Failed to delete category');

    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  return {
    categories,
    loading,
    error,
    refresh: fetchCategories,
    addCategory,
    updateCategory,
    deleteCategory,
  };
}
