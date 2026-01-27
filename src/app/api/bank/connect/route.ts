import { NextRequest, NextResponse } from 'next/server';
import { getAuthorizationUrl } from '@/lib/enable-banking';
import { createClient } from '@/lib/supabase/server';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const aspspName = body.aspspName || 'ING';
    const redirectUri = body.redirectUri || `${process.env.NEXT_PUBLIC_APP_URL}/api/bank/callback`;

    const state = randomUUID();

    const supabase = await createClient();
    await supabase.from('bank_connections').insert({
      provider: 'enable_banking',
      aspsp_name: aspspName,
      session_id: state,
      status: 'pending',
    });

    const authUrl = await getAuthorizationUrl(aspspName, redirectUri, state);

    return NextResponse.json({ authUrl, state });
  } catch (error) {
    console.error('Bank connect error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('bank_connections')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || null);
}
