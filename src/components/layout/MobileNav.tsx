'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Receipt,
  Tags,
  PiggyBank,
  BarChart3,
} from 'lucide-react';

const mainNav = [
  { name: 'Start', href: '/', icon: LayoutDashboard },
  { name: 'Transakcje', href: '/transactions', icon: Receipt },
  { name: 'Analityka', href: '/analytics', icon: BarChart3 },
  { name: 'Budżet', href: '/budget', icon: PiggyBank },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      {/* Gradient fade */}
      <div className="absolute inset-x-0 -top-6 h-6 bg-gradient-to-t from-white to-transparent pointer-events-none" />

      {/* Nav bar */}
      <div className="bg-white/90 backdrop-blur-xl border-t border-gray-200/50 px-2 pb-safe">
        <div className="flex items-center justify-around py-2">
          {mainNav.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200',
                  isActive
                    ? 'text-blue-600'
                    : 'text-gray-500 active:scale-95'
                )}
              >
                <div className={cn(
                  'p-1.5 rounded-xl transition-all duration-200',
                  isActive && 'bg-blue-100'
                )}>
                  <item.icon className={cn(
                    'h-5 w-5 transition-transform',
                    isActive && 'scale-110'
                  )} />
                </div>
                <span className={cn(
                  'text-[10px] font-medium',
                  isActive && 'text-blue-600'
                )}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
