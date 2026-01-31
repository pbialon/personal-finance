import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { categorizeNewTransaction } from '@/lib/categorization';
import { findOrCreateMerchant } from '@/lib/merchants';
import { parseINGCsv, createExternalId } from '@/lib/csv-import';
import type { ImportProgressEvent } from '@/types';

function createSSEMessage(event: ImportProgressEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const skipCategorization = formData.get('skipCategorization') === 'true';

  if (!file) {
    return new Response(
      JSON.stringify({ error: 'No file provided' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
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
    return new Response(
      JSON.stringify({ error: 'No transactions found in file' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Create SSE stream
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      let imported = 0;
      let skipped = 0;
      let errors = 0;

      // Send start event
      const startEvent: ImportProgressEvent = {
        type: 'start',
        total: transactions.length,
        imported: 0,
        skipped: 0,
        errors: 0,
      };
      controller.enqueue(encoder.encode(createSSEMessage(startEvent)));

      const supabase = await createClient();

      for (let i = 0; i < transactions.length; i++) {
        const tx = transactions[i];
        const displayName = tx.counterparty_name || tx.description || 'Brak opisu';

        try {
          const externalId = createExternalId(tx);

          // Check if already exists
          const { data: existing } = await supabase
            .from('transactions')
            .select('id')
            .eq('external_id', externalId)
            .maybeSingle();

          if (existing) {
            skipped++;
          } else {
            const rawDescription = tx.description || tx.counterparty_name || 'Brak opisu';

            let categoryId = null;
            let categorySource = 'manual';
            let finalDisplayName = rawDescription;

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
              finalDisplayName = categorization.display_name;
            }

            const merchantId = await findOrCreateMerchant(
              tx.counterparty_name || tx.description,
              tx.counterparty_name || tx.description
            );

            await supabase.from('transactions').insert({
              external_id: externalId,
              bank_account_id: tx.account_name,
              raw_description: rawDescription,
              display_name: finalDisplayName,
              amount: tx.amount,
              currency: tx.currency,
              transaction_date: tx.transaction_date,
              booking_date: tx.booking_date || tx.transaction_date,
              counterparty_name: tx.counterparty_name || null,
              counterparty_account: tx.account_number,
              category_id: categoryId,
              category_source: categorySource,
              merchant_id: merchantId,
              is_income: tx.is_income,
              is_manual: false,
            });

            imported++;
          }
        } catch (err) {
          console.error('Error importing transaction:', err);
          errors++;
        }

        // Send progress event
        const progressEvent: ImportProgressEvent = {
          type: 'progress',
          current: i + 1,
          total: transactions.length,
          imported,
          skipped,
          errors,
          lastTransaction: displayName.slice(0, 50),
        };
        controller.enqueue(encoder.encode(createSSEMessage(progressEvent)));
      }

      // Send complete event
      const completeEvent: ImportProgressEvent = {
        type: 'complete',
        total: transactions.length,
        imported,
        skipped,
        errors,
      };
      controller.enqueue(encoder.encode(createSSEMessage(completeEvent)));

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
