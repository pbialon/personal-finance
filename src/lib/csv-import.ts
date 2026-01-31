export interface ParsedTransaction {
  transaction_date: string;
  booking_date: string | null;
  counterparty_name: string;
  description: string;
  account_number: string | null;
  bank_name: string | null;
  transaction_id: string | null;
  amount: number;
  currency: string;
  account_name: string;
  is_income: boolean;
}

/**
 * Creates a unique external ID for a CSV-imported transaction.
 * Used to detect duplicates during import.
 */
export function createExternalId(tx: Pick<ParsedTransaction, 'transaction_date' | 'transaction_id' | 'amount' | 'counterparty_name'>): string {
  const txIdPart = tx.transaction_id || `${tx.amount}-${(tx.counterparty_name || '').slice(0, 30)}`;
  return `csv-${tx.transaction_date}-${txIdPart}`.replace(/\s/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
}

/**
 * Parses ING Bank CSV export file into structured transactions.
 */
export function parseINGCsv(content: string): ParsedTransaction[] {
  const lines = content.split('\n');
  const transactions: ParsedTransaction[] = [];

  let headerFound = false;

  for (const line of lines) {
    // Skip empty lines
    if (!line.trim()) continue;

    // Find header row
    if (line.includes('Data transakcji') && line.includes('Data księgowania')) {
      headerFound = true;
      continue;
    }

    if (!headerFound) continue;

    // Parse transaction row
    // Format: date;booking_date;counterparty;title;account;bank;details;tx_id;amount;currency;...;account_name;balance;currency
    const parts = line.split(';').map(p => p.replace(/^"|"$/g, '').trim());

    if (parts.length < 17) continue;

    const transactionDate = parts[0];
    if (!transactionDate || !/^\d{4}-\d{2}-\d{2}$/.test(transactionDate)) continue;

    const bookingDate = parts[1] || null;
    const counterpartyName = parts[2] || '';
    const description = parts[3] || '';
    const accountNumber = parts[4]?.replace(/'/g, '').trim() || null;
    const bankName = parts[5] || null;
    const transactionId = parts[7]?.replace(/'/g, '').trim() || null;

    // Amount can be in column 8 (with currency in 9) or column 10 (with currency in 11)
    // Column 8 = "Kwota transakcji" (main transaction amount)
    // Column 10 = "Kwota blokady/zwolnienie blokady" (blocking amount for pending transactions)
    let amountStr = parts[8];
    let currency = parts[9] || 'PLN';

    // If amount is empty, try column 10 (for pending card/BLIK transactions)
    if (!amountStr && parts[10]) {
      amountStr = parts[10];
      currency = parts[11] || 'PLN';
    }

    if (!amountStr) continue;

    // Parse amount (Polish format: -144,23)
    const amount = parseFloat(amountStr.replace(',', '.').replace(/\s/g, ''));
    if (isNaN(amount)) continue;

    const accountName = parts[14] || 'Unknown';

    transactions.push({
      transaction_date: transactionDate,
      booking_date: bookingDate && /^\d{4}-\d{2}-\d{2}$/.test(bookingDate) ? bookingDate : null,
      counterparty_name: counterpartyName,
      description,
      account_number: accountNumber,
      bank_name: bankName,
      transaction_id: transactionId,
      amount: Math.abs(amount),
      currency,
      account_name: accountName,
      is_income: amount > 0,
    });
  }

  return transactions;
}
