'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { PieChart } from '@/components/charts/PieChart';
import { useTopSpenders } from '@/hooks/useAnalytics';
import { Loader2 } from 'lucide-react';
import { formatCurrency, formatShortDate } from '@/lib/utils';
import type { TimePeriodRange } from '@/types';

interface TopSpendersCardProps {
  range: TimePeriodRange;
}

export function TopSpendersCard({ range }: TopSpendersCardProps) {
  const { data, loading, error } = useTopSpenders(range.startDate, range.endDate);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Największe wydatki</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Największe wydatki</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Nie udało się załadować danych</p>
        </CardContent>
      </Card>
    );
  }

  const pieData = [
    { name: 'Cykliczne', y: data.recurringVsOneTime.recurring, color: '#3b82f6' },
    { name: 'Jednorazowe', y: data.recurringVsOneTime.oneTime, color: '#9ca3af' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Największe wydatki</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-4">Top 10 kontrahentów</h4>
            <div className="space-y-2">
              {data.topMerchants.slice(0, 10).map((merchant, idx) => (
                <div
                  key={merchant.name}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{merchant.name}</p>
                      <p className="text-xs text-gray-400">{merchant.count} transakcji</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatCurrency(merchant.amount)}</p>
                    {merchant.categoryName && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `${merchant.categoryColor}20`, color: merchant.categoryColor }}
                      >
                        {merchant.categoryName}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-4">Top 10 pojedynczych transakcji</h4>
            <div className="space-y-2">
              {data.topTransactions.slice(0, 10).map((transaction, idx) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium truncate max-w-[180px]">
                        {transaction.description}
                      </p>
                      <p className="text-xs text-gray-400">{formatShortDate(transaction.date)}</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold">{formatCurrency(transaction.amount)}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-4">Cykliczne vs jednorazowe</h4>
            <PieChart data={pieData} />
            <div className="mt-4 flex justify-center gap-6 text-sm">
              <div className="text-center">
                <p className="text-gray-500">Cykliczne</p>
                <p className="font-semibold">{formatCurrency(data.recurringVsOneTime.recurring)}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-500">Jednorazowe</p>
                <p className="font-semibold">{formatCurrency(data.recurringVsOneTime.oneTime)}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
