import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month');

  let query = supabase
    .from('budgets')
    .select('*, category:categories(*)')
    .order('created_at');

  if (month) {
    query = query.eq('month', month);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json();

  // Batch upsert dla wizarda
  if (body.budgets && Array.isArray(body.budgets)) {
    const { month, budgets } = body as {
      month: string;
      budgets: { category_id: string | null; planned_amount: number; is_income: boolean }[];
    };

    // Usuń istniejące rekordy z category_id = NULL przed wstawieniem nowych
    // (upsert z onConflict nie działa dla NULL, bo NULL != NULL w PostgreSQL)
    const nullCategoryBudgets = budgets.filter((b) => b.category_id === null);
    if (nullCategoryBudgets.length > 0) {
      const incomeNulls = nullCategoryBudgets.filter((b) => b.is_income);
      const expenseNulls = nullCategoryBudgets.filter((b) => !b.is_income);

      if (incomeNulls.length > 0) {
        await supabase
          .from('budgets')
          .delete()
          .eq('month', month)
          .is('category_id', null)
          .eq('is_income', true);
      }
      if (expenseNulls.length > 0) {
        await supabase
          .from('budgets')
          .delete()
          .eq('month', month)
          .is('category_id', null)
          .eq('is_income', false);
      }
    }

    // Przygotuj dane do upsert
    const upsertData = budgets.map((b) => ({
      category_id: b.category_id,
      month,
      planned_amount: b.planned_amount,
      is_income: b.is_income,
    }));

    const { data, error } = await supabase
      .from('budgets')
      .upsert(upsertData, { onConflict: 'category_id,month,is_income' })
      .select('*, category:categories(*)');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  }

  // Pojedynczy upsert
  // Dla category_id = NULL, usuń istniejący rekord przed wstawieniem
  // (upsert z onConflict nie działa dla NULL, bo NULL != NULL w PostgreSQL)
  if (body.category_id === null || body.category_id === undefined) {
    await supabase
      .from('budgets')
      .delete()
      .eq('month', body.month)
      .is('category_id', null)
      .eq('is_income', body.is_income || false);
  }

  const { data, error } = await supabase
    .from('budgets')
    .upsert(
      {
        category_id: body.category_id,
        month: body.month,
        planned_amount: body.planned_amount,
        is_income: body.is_income || false,
      },
      { onConflict: 'category_id,month,is_income' }
    )
    .select('*, category:categories(*)')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID is required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('budgets')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
