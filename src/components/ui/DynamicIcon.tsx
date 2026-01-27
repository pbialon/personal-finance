'use client';

import { lazy, Suspense } from 'react';
import * as LucideIcons from 'lucide-react';

interface DynamicIconProps {
  name: string | null;
  className?: string;
  style?: React.CSSProperties;
  fallback?: React.ReactNode;
}

// Convert kebab-case to PascalCase for Lucide icon names
function toPascalCase(str: string): string {
  return str
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

export function DynamicIcon({ name, className = 'h-4 w-4', style, fallback }: DynamicIconProps) {
  if (!name) {
    return fallback ? <>{fallback}</> : null;
  }

  const iconName = toPascalCase(name) as keyof typeof LucideIcons;
  const IconComponent = LucideIcons[iconName] as React.ComponentType<{ className?: string; style?: React.CSSProperties }>;

  if (!IconComponent) {
    // Fallback to a default icon if the specified one doesn't exist
    const FallbackIcon = LucideIcons.CircleDot;
    return <FallbackIcon className={className} style={style} />;
  }

  return <IconComponent className={className} style={style} />;
}
