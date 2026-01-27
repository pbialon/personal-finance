'use client';

import { cn } from '@/lib/utils';
import { useSidebar } from './SidebarContext';

export function MainContent({ children }: { children: React.ReactNode }) {
  const { isExpanded } = useSidebar();

  return (
    <main className={cn(
      'min-h-screen pb-20 lg:pb-0 transition-all duration-300 ease-out',
      isExpanded ? 'lg:pl-64' : 'lg:pl-[72px]'
    )}>
      <div className="p-4 lg:p-8">
        {children}
      </div>
    </main>
  );
}
