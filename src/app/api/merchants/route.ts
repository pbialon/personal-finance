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
      .select('*, category:categories(*), aliases:merchant_aliases(*)')
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
    .select('*, category:categories(*), aliases:merchant_aliases(*)')
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

  const merchantId = body.id;

  // Validate name and aliases for conflicts
  if (body.name !== undefined || body.aliases !== undefined) {
    const newName = body.name?.toLowerCase().trim();
    const newAliases = (body.aliases || []).map((a: string) => a.toLowerCase().trim()).filter((a: string) => a);

    // Get all merchants except current one
    const { data: otherMerchants } = await supabase
      .from('merchants')
      .select('id, name')
      .neq('id', merchantId);

    // Get all aliases from other merchants
    const { data: otherAliases } = await supabase
      .from('merchant_aliases')
      .select('merchant_id, alias')
      .neq('merchant_id', merchantId);

    const existingNames = new Set((otherMerchants || []).map(m => m.name.toLowerCase()));
    const existingAliases = new Set((otherAliases || []).map(a => a.alias.toLowerCase()));

    // Validate new name
    if (newName) {
      if (existingNames.has(newName)) {
        return NextResponse.json(
          { error: `Klucz "${newName}" jest już używany przez innego kontrahenta` },
          { status: 409 }
        );
      }
      if (existingAliases.has(newName)) {
        return NextResponse.json(
          { error: `Klucz "${newName}" jest już aliasem innego kontrahenta` },
          { status: 409 }
        );
      }
    }

    // Validate new aliases
    for (const alias of newAliases) {
      if (existingNames.has(alias)) {
        return NextResponse.json(
          { error: `Alias "${alias}" jest już głównym kluczem innego kontrahenta` },
          { status: 409 }
        );
      }
      if (existingAliases.has(alias)) {
        return NextResponse.json(
          { error: `Alias "${alias}" jest już aliasem innego kontrahenta` },
          { status: 409 }
        );
      }
    }

    // Check for duplicates between name and aliases
    if (newName && newAliases.includes(newName)) {
      return NextResponse.json(
        { error: `Alias nie może być taki sam jak główny klucz "${newName}"` },
        { status: 400 }
      );
    }

    // Check for duplicate aliases
    const uniqueAliases = new Set(newAliases);
    if (uniqueAliases.size !== newAliases.length) {
      return NextResponse.json(
        { error: 'Lista aliasów zawiera duplikaty' },
        { status: 400 }
      );
    }
  }

  const updateData: Record<string, unknown> = {};
  if (body.name !== undefined) updateData.name = body.name.toLowerCase().trim();
  if (body.display_name !== undefined) updateData.display_name = body.display_name;
  if (body.icon_url !== undefined) updateData.icon_url = body.icon_url;
  if (body.category_id !== undefined) updateData.category_id = body.category_id;
  if (body.website !== undefined) updateData.website = body.website;
  updateData.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('merchants')
    .update(updateData)
    .eq('id', merchantId)
    .select('*, category:categories(*)')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Handle aliases update (full replacement strategy)
  if (body.aliases !== undefined) {
    // Delete all existing aliases
    await supabase
      .from('merchant_aliases')
      .delete()
      .eq('merchant_id', merchantId);

    // Insert new aliases
    const newAliases = (body.aliases || [])
      .map((a: string) => a.toLowerCase().trim())
      .filter((a: string) => a);

    if (newAliases.length > 0) {
      await supabase.from('merchant_aliases').insert(
        newAliases.map((alias: string) => ({
          merchant_id: merchantId,
          alias,
        }))
      );
    }
  }

  // Fetch updated merchant with aliases
  const { data: updatedMerchant } = await supabase
    .from('merchants')
    .select('*, category:categories(*), aliases:merchant_aliases(*)')
    .eq('id', merchantId)
    .single();

  return NextResponse.json(updatedMerchant);
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
