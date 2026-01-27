import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { categorizeNewTransaction } from '@/lib/categorization';

interface ParsedTransaction {
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

function parseINGCsv(content: string): ParsedTransaction[] {
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

    // Amount can be in column 8 (with currency in 9) or column 11 (with currency in 12)
    let amountStr = parts[8];
    let currency = parts[9] || 'PLN';

    // If amount is empty, try column 11 (for card transactions)
    if (!amountStr && parts[11]) {
      amountStr = parts[11];
      currency = parts[12] || 'PLN';
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

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const skipCategorization = formData.get('skipCategorization') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Read file content
    const buffer = await file.arrayBuffer();
    // Try to decode as Windows-1250 (Polish encoding)
    const decoder = new TextDecoder('windows-1250');
    let content = decoder.decode(buffer);

    // If that doesn't work well, try UTF-8
    if (!content.includes('Data transakcji')) {
      const utf8Decoder = new TextDecoder('utf-8');
      content = utf8Decoder.decode(buffer);
    }

    const transactions = parseINGCsv(content);

    if (transactions.length === 0) {
      return NextResponse.json({ error: 'No transactions found in file' }, { status: 400 });
    }

    const supabase = await createClient();

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (const tx of transactions) {
      try {
        // Create external_id from transaction data - include transaction_id if available for uniqueness
        const txIdPart = tx.transaction_id || `${tx.amount}-${tx.counterparty_name.slice(0, 30)}`;
        const externalId = `csv-${tx.transaction_date}-${txIdPart}`.replace(/\s/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');

        // Check if already exists
        const { data: existing } = await supabase
          .from('transactions')
          .select('id')
          .eq('external_id', externalId)
          .maybeSingle();

        if (existing) {
          skipped++;
          continue;
        }

        const rawDescription = tx.description || tx.counterparty_name || 'Brak opisu';

        let categoryId = null;
        let categorySource = 'manual';
        let displayName = rawDescription;

        if (!skipCategorization) {
          const categorization = await categorizeNewTransaction({
            raw_description: rawDescription,
            amount: tx.amount,
            transaction_date: tx.transaction_date,
            counterparty_name: tx.counterparty_name || null,
            counterparty_account: tx.account_number,
          });

          categoryId = categorization.category_id;
          categorySource = categorization.category_source;
          displayName = categorization.display_name;
        }

        await supabase.from('transactions').insert({
          external_id: externalId,
          bank_account_id: tx.account_name,
          raw_description: rawDescription,
          display_name: displayName,
          amount: tx.amount,
          currency: tx.currency,
          transaction_date: tx.transaction_date,
          booking_date: tx.booking_date || tx.transaction_date,
          counterparty_name: tx.counterparty_name || null,
          counterparty_account: tx.account_number,
          category_id: categoryId,
          category_source: categorySource,
          is_income: tx.is_income,
          is_manual: false,
        });

        imported++;
      } catch (err) {
        console.error('Error importing transaction:', err);
        errors++;
      }
    }

    return NextResponse.json({
      success: true,
      total: transactions.length,
      imported,
      skipped,
      errors,
    });
  } catch (error) {
    console.error('CSV import error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Import failed' },
      { status: 500 }
    );
  }
}
