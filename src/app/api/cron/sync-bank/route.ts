import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTransactions, mapTransaction } from '@/lib/enable-banking';
import { categorizeNewTransaction } from '@/lib/categorization';

export const runtime = 'edge';
export const preferredRegion = 'auto';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = await createClient();

    const { data: connections } = await supabase
      .from('bank_connections')
      .select('*')
      .eq('status', 'active');

    if (!connections || connections.length === 0) {
      return NextResponse.json({ message: 'No active connections' });
    }

    const results = [];

    for (const connection of connections) {
      if (connection.consent_valid_until && new Date(connection.consent_valid_until) < new Date()) {
        results.push({
          connectionId: connection.id,
          status: 'expired',
          message: 'Consent expired',
        });
        continue;
      }

      const dateFrom = connection.last_sync_at?.split('T')[0] ||
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const dateTo = new Date().toISOString().split('T')[0];

      try {
        const bankTransactions = await getTransactions(
          connection.session_id!,
          connection.account_id!,
          dateFrom,
          dateTo
        );

        let imported = 0;

        for (const tx of bankTransactions) {
          const mapped = mapTransaction(tx, connection.account_id!);

          const { data: existing } = await supabase
            .from('transactions')
            .select('id')
            .eq('external_id', mapped.external_id)
            .single();

          if (existing) continue;

          const categorization = await categorizeNewTransaction({
            raw_description: mapped.raw_description,
            amount: mapped.amount,
            transaction_date: mapped.transaction_date,
            counterparty_name: mapped.counterparty_name,
            counterparty_account: mapped.counterparty_account,
          });

          await supabase.from('transactions').insert({
            ...mapped,
            display_name: categorization.display_name,
            category_id: categorization.category_id,
            category_source: categorization.category_source,
          });

          imported++;
        }

        await supabase
          .from('bank_connections')
          .update({ last_sync_at: new Date().toISOString() })
          .eq('id', connection.id);

        results.push({
          connectionId: connection.id,
          status: 'success',
          imported,
        });
      } catch (error) {
        results.push({
          connectionId: connection.id,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Cron sync error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Cron failed' },
      { status: 500 }
    );
  }
}
