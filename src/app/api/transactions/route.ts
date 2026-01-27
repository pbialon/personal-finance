import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createCategorizationRule, recategorizeByCounrerparty } from '@/lib/categorization';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const categoryId = searchParams.get('categoryId');
  const merchantId = searchParams.get('merchantId');
  const isIncome = searchParams.get('isIncome');
  const isIgnored = searchParams.get('isIgnored');
  const search = searchParams.get('search');
  const limit = parseInt(searchParams.get('limit') || '100');
  const offset = parseInt(searchParams.get('offset') || '0');

  let query = supabase
    .from('transactions')
    .select('*, category:categories(*), merchant:merchants(*)', { count: 'exact' })
    .order('transaction_date', { ascending: false })
    .range(offset, offset + limit - 1);

  if (startDate) {
    query = query.gte('transaction_date', startDate);
  }

  if (endDate) {
    query = query.lte('transaction_date', endDate);
  }

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  if (merchantId) {
    query = query.eq('merchant_id', merchantId);
  }

  if (isIncome !== null) {
    query = query.eq('is_income', isIncome === 'true');
  }

  if (isIgnored !== null) {
    query = query.eq('is_ignored', isIgnored === 'true');
  }

  if (search) {
    query = query.or(`raw_description.ilike.%${search}%,display_name.ilike.%${search}%,counterparty_name.ilike.%${search}%,description.ilike.%${search}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, count });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json();

  const { data, error } = await supabase
    .from('transactions')
    .insert({
      raw_description: body.description,
      display_name: body.description,
      description: body.description,
      amount: body.amount,
      currency: body.currency || 'PLN',
      transaction_date: body.transaction_date,
      booking_date: body.transaction_date,
      category_id: body.category_id,
      category_source: 'user',
      is_manual: true,
      is_income: body.is_income || false,
    })
    .select('*, category:categories(*), merchant:merchants(*)')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json();

  if (!body.id) {
    return NextResponse.json({ error: 'ID is required' }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};

  if (body.category_id !== undefined) {
    updateData.category_id = body.category_id;
    updateData.category_source = 'user';
  }

  if (body.is_ignored !== undefined) {
    updateData.is_ignored = body.is_ignored;
  }

  if (body.display_name !== undefined) {
    updateData.display_name = body.display_name;
  }

  if (body.description !== undefined) {
    updateData.description = body.description;
  }

  const { data, error } = await supabase
    .from('transactions')
    .update(updateData)
    .eq('id', body.id)
    .select('*, category:categories(*), merchant:merchants(*)')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (body.category_id && body.create_rule && data.counterparty_account) {
    await createCategorizationRule(data.counterparty_account, body.category_id);
    if (body.apply_rule_to_existing) {
      await recategorizeByCounrerparty(data.counterparty_account, body.category_id);
    }
  }

  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID is required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
