'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSidebar } from './SidebarContext';
import {
  LayoutDashboard,
  Receipt,
  Tags,
  Store,
  PiggyBank,
  Settings,
  Wallet,
  BarChart3,
  ChevronLeft,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Transakcje', href: '/transactions', icon: Receipt },
  { name: 'Analityka', href: '/analytics', icon: BarChart3 },
  { name: 'Kategorie', href: '/categories', icon: Tags },
  { name: 'Kontrahenci', href: '/merchants', icon: Store },
  { name: 'Budżet', href: '/budget', icon: PiggyBank },
  { name: 'Ustawienia', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isExpanded, setIsExpanded } = useSidebar();

  return (
    <aside
      className={cn(
        'hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:flex lg:flex-col',
        'bg-white border-r border-gray-200',
        'transition-all duration-300 ease-out',
        isExpanded ? 'w-64' : 'w-[72px]'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-gray-200 px-4 gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Wallet className="h-5 w-5 text-white" />
        </div>
        <span className={cn(
          'text-lg font-bold text-gray-900 whitespace-nowrap transition-all duration-300',
          isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'
        )}>
          Finanse
        </span>
      </div>

      {/* Toggle button - floating on edge */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'absolute top-20 -right-3 z-10',
          'w-6 h-6 rounded-full bg-white border border-gray-200 shadow-sm',
          'flex items-center justify-center',
          'text-gray-400 hover:text-gray-600 hover:bg-gray-50',
          'transition-all duration-300'
        )}
        title={isExpanded ? 'Zwiń menu' : 'Rozwiń menu'}
      >
        <ChevronLeft className={cn(
          'h-4 w-4 transition-transform duration-300',
          isExpanded ? 'rotate-0' : 'rotate-180'
        )} />
      </button>

      {/* Main navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              title={!isExpanded ? item.name : undefined}
              className={cn(
                'group/item relative flex items-center gap-3 rounded-xl px-3 py-2.5',
                'transition-all duration-300',
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-r-full" />
              )}

              <item.icon className={cn(
                'h-5 w-5 flex-shrink-0',
                isActive ? 'text-blue-600' : 'text-gray-500 group-hover/item:text-gray-700'
              )} />

              <span className={cn(
                'text-sm font-medium whitespace-nowrap transition-all duration-300',
                isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'
              )}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
