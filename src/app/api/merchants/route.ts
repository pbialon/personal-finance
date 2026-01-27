import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const search = searchParams.get('search');

  // Get single merchant by ID
  if (id) {
    const { data, error } = await supabase
      .from('merchants')
      .select('*, category:categories(*)')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  }

  // Get all merchants
  let query = supabase
    .from('merchants')
    .select('*, category:categories(*)')
    .order('name');

  if (search) {
    query = query.ilike('name', `%${search}%`);
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

  const { data, error } = await supabase
    .from('merchants')
    .insert({
      name: body.name.toLowerCase().trim(),
      display_name: body.display_name || body.name,
      icon_url: body.icon_url,
      category_id: body.category_id,
      website: body.website,
    })
    .select('*, category:categories(*)')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Add aliases if provided
  if (body.aliases && Array.isArray(body.aliases)) {
    for (const alias of body.aliases) {
      await supabase.from('merchant_aliases').insert({
        merchant_id: data.id,
        alias: alias.toLowerCase().trim(),
      });
    }
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
  if (body.display_name !== undefined) updateData.display_name = body.display_name;
  if (body.icon_url !== undefined) updateData.icon_url = body.icon_url;
  if (body.category_id !== undefined) updateData.category_id = body.category_id;
  if (body.website !== undefined) updateData.website = body.website;
  updateData.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('merchants')
    .update(updateData)
    .eq('id', body.id)
    .select('*, category:categories(*)')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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
    .from('merchants')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
