'use client';

import { RefreshCw, Loader2, Calendar } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { formatCurrency, cn, formatShortDate } from '@/lib/utils';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { getDaysUntilPayment, type SubscriptionFrequency } from '@/lib/subscription-detector';

const frequencyLabels: Record<SubscriptionFrequency, string> = {
  weekly: 'tyg.',
  monthly: 'msc',
  quarterly: 'kw.',
  annual: 'rok',
};

function formatDaysUntil(days: number): string {
  if (days < 0) return 'zaległe';
  if (days === 0) return 'dziś';
  if (days === 1) return 'jutro';
  return `za ${days} dni`;
}

function getDaysUntilColor(days: number): string {
  if (days < 0) return 'text-red-600';
  if (days <= 3) return 'text-amber-600';
  if (days <= 7) return 'text-blue-600';
  return 'text-gray-500';
}

export function SubscriptionsCard() {
  const { subscriptions, totalMonthly, meta, loading, refresh } = useSubscriptions();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="p-1.5 bg-gradient-to-br from-rose-500 to-pink-600 rounded-lg">
              <RefreshCw className="w-4 h-4 text-white" />
            </div>
            Subskrypcje
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="p-1.5 bg-gradient-to-br from-rose-500 to-pink-600 rounded-lg">
              <RefreshCw className="w-4 h-4 text-white" />
            </div>
            Subskrypcje
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 text-center py-4">
            Nie wykryto płatności cyklicznych
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="p-1.5 bg-gradient-to-br from-rose-500 to-pink-600 rounded-lg">
              <RefreshCw className="w-4 h-4 text-white" />
            </div>
            Subskrypcje
          </CardTitle>
          <span className="text-sm font-semibold text-gray-900">
            {formatCurrency(totalMonthly)}/msc
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {meta?.isFinancialMonth && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3 pb-3 border-b">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              Analiza na podstawie 12 miesięcy finansowych
            </span>
          </div>
        )}
        <div className="space-y-3">
          {subscriptions.slice(0, 6).map((sub, index) => {
            const daysUntil = getDaysUntilPayment(sub.nextPayment);

            return (
              <div
                key={`${sub.merchantId || sub.merchantName}-${index}`}
                className="flex items-center justify-between py-1"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {sub.categoryColor && (
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: sub.categoryColor }}
                    />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {sub.merchantName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {frequencyLabels[sub.frequency]}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <span className="text-sm font-medium text-gray-900 tabular-nums">
                    {formatCurrency(sub.amount)}
                  </span>
                  <span className={cn(
                    'text-xs font-medium min-w-[60px] text-right',
                    getDaysUntilColor(daysUntil)
                  )}>
                    {formatDaysUntil(daysUntil)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {subscriptions.length > 6 && (
          <p className="text-xs text-gray-500 text-center mt-3 pt-3 border-t">
            +{subscriptions.length - 6} więcej subskrypcji
          </p>
        )}
      </CardContent>
    </Card>
  );
}
