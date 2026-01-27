import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTransactions, mapTransaction } from '@/lib/enable-banking';
import { categorizeNewTransaction } from '@/lib/categorization';
import { findOrCreateMerchant } from '@/lib/merchants';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { data: connection } = await supabase
      .from('bank_connections')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!connection) {
      return NextResponse.json({ error: 'No active bank connection' }, { status: 400 });
    }

    if (connection.consent_valid_until && new Date(connection.consent_valid_until) < new Date()) {
      return NextResponse.json({ error: 'Bank consent expired', needsReauth: true }, { status: 401 });
    }

    const dateFrom = body.dateFrom || connection.last_sync_at?.split('T')[0] ||
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const dateTo = body.dateTo || new Date().toISOString().split('T')[0];

    const bankTransactions = await getTransactions(
      connection.session_id!,
      connection.account_id!,
      dateFrom,
      dateTo
    );

    let imported = 0;
    let skipped = 0;

    for (const tx of bankTransactions) {
      const mapped = mapTransaction(tx, connection.account_id!);

      const { data: existing } = await supabase
        .from('transactions')
        .select('id')
        .eq('external_id', mapped.external_id)
        .single();

      if (existing) {
        skipped++;
        continue;
      }

      const categorization = await categorizeNewTransaction({
        raw_description: mapped.raw_description,
        amount: mapped.amount,
        transaction_date: mapped.transaction_date,
        counterparty_name: mapped.counterparty_name,
        counterparty_account: mapped.counterparty_account,
      });

      const merchantId = await findOrCreateMerchant(
        mapped.counterparty_name || mapped.raw_description,
        mapped.counterparty_name || mapped.raw_description
      );

      await supabase.from('transactions').insert({
        ...mapped,
        display_name: categorization.display_name,
        category_id: categorization.category_id,
        category_source: categorization.category_source,
        merchant_id: merchantId,
      });

      imported++;
    }

    await supabase
      .from('bank_connections')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', connection.id);

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      total: bankTransactions.length,
    });
  } catch (error) {
    console.error('Bank sync error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 }
    );
  }
}
