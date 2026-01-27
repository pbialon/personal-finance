import { NextRequest, NextResponse } from 'next/server';
import { createSession, getAccounts } from '@/lib/enable-banking';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const redirectUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (error) {
    console.error('Bank authorization error:', error);
    return NextResponse.redirect(`${redirectUrl}/settings?error=bank_auth_failed`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${redirectUrl}/settings?error=missing_params`);
  }

  try {
    const supabase = await createClient();

    const { data: connection } = await supabase
      .from('bank_connections')
      .select('*')
      .eq('session_id', state)
      .eq('status', 'pending')
      .single();

    if (!connection) {
      return NextResponse.redirect(`${redirectUrl}/settings?error=invalid_state`);
    }

    const session = await createSession(code);
    const accounts = await getAccounts(session.session_id);

    const primaryAccount = accounts[0];

    const consentValidUntil = new Date();
    consentValidUntil.setDate(consentValidUntil.getDate() + 90);

    await supabase
      .from('bank_connections')
      .update({
        session_id: session.session_id,
        account_id: primaryAccount?.account_id,
        consent_valid_until: consentValidUntil.toISOString(),
        status: 'active',
      })
      .eq('id', connection.id);

    return NextResponse.redirect(`${redirectUrl}/settings?success=bank_connected`);
  } catch (err) {
    console.error('Bank callback error:', err);
    return NextResponse.redirect(`${redirectUrl}/settings?error=callback_failed`);
  }
}
