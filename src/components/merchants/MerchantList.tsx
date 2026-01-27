'use client';

import { Pencil, Trash2, Store } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { DynamicIcon } from '../ui/DynamicIcon';
import type { Merchant } from '@/types';

interface MerchantListProps {
  merchants: Merchant[];
  onEdit: (merchant: Merchant) => void;
  onDelete: (merchantId: string) => void;
}

export function MerchantList({ merchants, onEdit, onDelete }: MerchantListProps) {
  if (merchants.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-500">Brak kontrahentów</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {merchants.map((merchant) => (
        <Card key={merchant.id} className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {merchant.icon_url ? (
                <img
                  src={merchant.icon_url}
                  alt={merchant.display_name}
                  className="w-10 h-10 rounded-lg object-contain bg-gray-100"
                />
              ) : merchant.category?.icon ? (
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: merchant.category.color + '20' }}
                >
                  <DynamicIcon
                    name={merchant.category.icon}
                    className="h-5 w-5"
                    style={{ color: merchant.category.color }}
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Store className="h-5 w-5 text-gray-400" />
                </div>
              )}
              <div className="min-w-0">
                <h3 className="font-medium text-gray-900 truncate">
                  {merchant.display_name}
                </h3>
                {merchant.category && (
                  <span
                    className="text-xs px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: merchant.category.color + '20',
                      color: merchant.category.color,
                    }}
                  >
                    {merchant.category.name}
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(merchant)}
                className="p-2"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(merchant.id)}
                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {merchant.name !== merchant.display_name && (
            <p className="mt-2 text-xs text-gray-500 truncate">
              {merchant.name}
            </p>
          )}
        </Card>
      ))}
    </div>
  );
}
