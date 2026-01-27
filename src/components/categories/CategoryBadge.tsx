import { cn } from '@/lib/utils';
import type { Category } from '@/types';

interface CategoryBadgeProps {
  category: Category | null;
  size?: 'sm' | 'md';
}

export function CategoryBadge({ category, size = 'md' }: CategoryBadgeProps) {
  if (!category) {
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-full bg-gray-100 text-gray-600',
          size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
        )}
      >
        Bez kategorii
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      )}
      style={{
        backgroundColor: `${category.color}20`,
        color: category.color,
      }}
    >
      {category.name}
    </span>
  );
}
