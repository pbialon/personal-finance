'use client';

import { Wallet, Menu } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/' },
  { name: 'Transakcje', href: '/transactions' },
  { name: 'Kategorie', href: '/categories' },
  { name: 'Budżet', href: '/budget' },
  { name: 'Ustawienia', href: '/settings' },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 border-b border-gray-200 bg-white lg:left-64">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 lg:hidden">
            <Wallet className="h-6 w-6 text-blue-600" />
            <span className="font-bold text-gray-900">Finanse</span>
          </div>
        </div>

        <button
          type="button"
          className="lg:hidden p-2 text-gray-600 hover:text-gray-900"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white">
          <nav className="space-y-1 px-4 py-3">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'block rounded-lg px-3 py-2 text-sm font-medium',
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
