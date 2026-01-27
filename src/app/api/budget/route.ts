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

  // Pojedynczy upsert (stara logika)
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
