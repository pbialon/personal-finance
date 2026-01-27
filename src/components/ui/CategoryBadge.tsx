'use client';

import { cn } from '@/lib/utils';
import { DynamicIcon } from './DynamicIcon';
import type { Category } from '@/types';

interface CategoryBadgeProps {
  category: Category | null | undefined;
  size?: 'sm' | 'md';
  showIcon?: boolean;
  className?: string;
}

export function CategoryBadge({
  category,
  size = 'sm',
  showIcon = true,
  className,
}: CategoryBadgeProps) {
  if (!category) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full bg-gray-100 text-gray-500',
          size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
          className
        )}
      >
        Bez kategorii
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        className
      )}
      style={{
        backgroundColor: `${category.color}15`,
        color: category.color,
      }}
    >
      {showIcon && category.icon && (
        <DynamicIcon
          name={category.icon}
          className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'}
          style={{ color: category.color }}
        />
      )}
      {category.name}
    </span>
  );
}
