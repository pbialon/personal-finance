'use client';

import type { Transaction } from '@/types';
import { TransactionRow } from './TransactionRow';

interface TransactionDateGroupProps {
  label: string;
  transactions: Transaction[];
  onTransactionClick: (transaction: Transaction) => void;
}

export function TransactionDateGroup({
  label,
  transactions,
  onTransactionClick,
}: TransactionDateGroupProps) {
  return (
    <div>
      {/* Sticky date header */}
      <div className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm px-4 py-3 border-b border-gray-100">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {label}
        </span>
      </div>

      {/* Transactions */}
      <div className="divide-y divide-gray-100">
        {transactions.map((transaction) => (
          <TransactionRow
            key={transaction.id}
            transaction={transaction}
            onClick={onTransactionClick}
          />
        ))}
      </div>
    </div>
  );
}
