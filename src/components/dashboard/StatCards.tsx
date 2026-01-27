'use client';

import { TrendingUp, TrendingDown, PiggyBank, Wallet } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { formatCurrency, cn } from '@/lib/utils';
import type { MonthlyStats } from '@/types';

interface StatCardsProps {
  stats: MonthlyStats;
}

export function StatCards({ stats }: StatCardsProps) {
  const cards = [
    {
      title: 'Przychody',
      value: stats.income,
      change: stats.incomeChange,
      icon: Wallet,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Wydatki',
      value: stats.expenses,
      change: stats.expensesChange,
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      invertChange: true,
    },
    {
      title: 'Oszczędności',
      value: stats.savings,
      change: stats.savingsChange,
      icon: PiggyBank,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((card) => {
        const isPositive = card.invertChange ? card.change < 0 : card.change > 0;
        return (
          <Card key={card.title}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{card.title}</p>
                  <p className={cn('text-2xl font-bold', card.color)}>
                    {card.title === 'Wydatki' ? '-' : '+'}
                    {formatCurrency(card.value)}
                  </p>
                </div>
                <div className={cn('p-3 rounded-xl', card.bgColor)}>
                  <card.icon className={cn('h-6 w-6', card.color)} />
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1 text-sm">
                {card.change !== 0 && (
                  <>
                    {isPositive ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <span
                      className={cn(
                        isPositive ? 'text-green-600' : 'text-red-600'
                      )}
                    >
                      {Math.abs(card.change)}%
                    </span>
                    <span className="text-gray-500">vs poprzedni miesiąc</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
