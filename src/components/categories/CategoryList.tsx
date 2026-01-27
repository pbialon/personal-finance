'use client';

import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import type { Category } from '@/types';

interface CategoryListProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (categoryId: string) => void;
}

export function CategoryList({ categories, onEdit, onDelete }: CategoryListProps) {
  if (categories.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-500">Brak kategorii</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {categories.map((category) => (
        <Card key={category.id} className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: category.color }}
              >
                {category.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{category.name}</h3>
                {category.is_savings && (
                  <span className="text-xs text-green-600">Oszczędności</span>
                )}
              </div>
            </div>

            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(category)}
                className="p-2"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(category.id)}
                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {category.ai_prompt && (
            <p className="mt-2 text-xs text-gray-500 line-clamp-2">
              {category.ai_prompt}
            </p>
          )}
        </Card>
      ))}
    </div>
  );
}
