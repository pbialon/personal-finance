import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { categorizeNewTransaction } from '@/lib/categorization';

export const maxDuration = 300; // 5 minutes max for Vercel

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const limit = body.limit || 100; // Process in batches
    const offset = body.offset || 0;

    const supabase = await createClient();

    // Get uncategorized transactions
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('id, raw_description, amount, transaction_date, counterparty_name, counterparty_account')
      .is('category_id', null)
      .order('transaction_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch transactions: ${error.message}`);
    }

    if (!transactions || transactions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No uncategorized transactions found',
        categorized: 0,
        remaining: 0
      });
    }

    // Count total uncategorized
    const { count } = await supabase
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .is('category_id', null);

    let categorized = 0;
    let errors = 0;

    for (const tx of transactions) {
      try {
        const categorization = await categorizeNewTransaction({
          raw_description: tx.raw_description,
          amount: tx.amount,
          transaction_date: tx.transaction_date,
          counterparty_name: tx.counterparty_name,
          counterparty_account: tx.counterparty_account,
        });

        await supabase
          .from('transactions')
          .update({
            category_id: categorization.category_id,
            category_source: categorization.category_source,
            display_name: categorization.display_name,
          })
          .eq('id', tx.id);

        categorized++;
      } catch (err) {
        console.error(`Error categorizing transaction ${tx.id}:`, err);
        errors++;
      }
    }

    const remaining = (count || 0) - categorized;

    return NextResponse.json({
      success: true,
      categorized,
      errors,
      remaining,
      hasMore: remaining > 0,
      nextOffset: offset + limit,
    });
  } catch (error) {
    console.error('Batch categorization error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Categorization failed' },
      { status: 500 }
    );
  }
}

// GET to check status
export async function GET() {
  const supabase = await createClient();

  const { count: uncategorized } = await supabase
    .from('transactions')
    .select('id', { count: 'exact', head: true })
    .is('category_id', null);

  const { count: total } = await supabase
    .from('transactions')
    .select('id', { count: 'exact', head: true });

  return NextResponse.json({
    uncategorized: uncategorized || 0,
    categorized: (total || 0) - (uncategorized || 0),
    total: total || 0,
  });
}
