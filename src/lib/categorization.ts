import { createClient } from '@/lib/supabase/server';
import { categorizeTransaction } from '@/lib/openai';
import type { Category, CategorizationRule } from '@/types';

interface CategorizationInput {
  raw_description: string;
  amount: number;
  transaction_date: string;
  counterparty_name: string | null;
  counterparty_account: string | null;
}

interface CategorizationOutput {
  category_id: string;
  category_source: 'ai' | 'rule';
  display_name: string;
  description: string;
  confidence?: number;
}

export async function categorizeNewTransaction(
  input: CategorizationInput
): Promise<CategorizationOutput> {
  const supabase = await createClient();

  if (input.counterparty_account) {
    const { data: rule } = await supabase
      .from('categorization_rules')
      .select('*')
      .eq('counterparty_account', input.counterparty_account)
      .single();

    if (rule) {
      return {
        category_id: rule.category_id,
        category_source: 'rule',
        display_name: input.counterparty_name || input.raw_description.slice(0, 50),
        description: input.counterparty_name || input.raw_description.slice(0, 200),
      };
    }
  }

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  if (!categories || categories.length === 0) {
    throw new Error('No categories found');
  }

  const result = await categorizeTransaction(
    input.raw_description,
    input.amount,
    input.transaction_date,
    input.counterparty_name,
    categories as Category[]
  );

  await supabase.from('ai_categorization_log').insert({
    prompt: `${input.raw_description} | ${input.amount} | ${input.transaction_date}`,
    response: JSON.stringify(result),
    category_id: result.category_id,
    confidence: result.confidence,
  });

  return {
    category_id: result.category_id,
    category_source: 'ai',
    display_name: result.display_name,
    description: result.description,
    confidence: result.confidence,
  };
}

export async function createCategorizationRule(
  counterpartyAccount: string,
  categoryId: string
): Promise<CategorizationRule> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('categorization_rules')
    .upsert(
      {
        counterparty_account: counterpartyAccount,
        category_id: categoryId,
      },
      { onConflict: 'counterparty_account' }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function recategorizeByCounrerparty(
  counterpartyAccount: string,
  categoryId: string
): Promise<number> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('transactions')
    .update({
      category_id: categoryId,
      category_source: 'rule',
    })
    .eq('counterparty_account', counterpartyAccount)
    .select('id');

  if (error) throw error;
  return data?.length || 0;
}
