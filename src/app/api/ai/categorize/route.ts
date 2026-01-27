import { NextRequest, NextResponse } from 'next/server';
import { categorizeNewTransaction } from '@/lib/categorization';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const result = await categorizeNewTransaction({
      raw_description: body.description,
      amount: body.amount,
      transaction_date: body.date,
      counterparty_name: body.counterparty_name || null,
      counterparty_account: body.counterparty_account || null,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('AI categorization error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Categorization failed' },
      { status: 500 }
    );
  }
}
