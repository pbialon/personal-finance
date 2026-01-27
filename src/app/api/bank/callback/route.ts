import { NextRequest, NextResponse } from 'next/server';
import { createSession } from '@/lib/enable-banking';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  console.log('Bank callback params:', { code: code?.slice(0, 20) + '...', state, error, url: request.url });

  const redirectUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (error) {
    console.error('Bank authorization error:', error);
    return NextResponse.redirect(`${redirectUrl}/settings?error=bank_auth_failed`);
  }

  if (!code || !state) {
    console.error('Missing params:', { code: !!code, state: !!state });
    return NextResponse.redirect(`${redirectUrl}/settings?error=missing_params`);
  }

  try {
    const supabase = await createClient();

    console.log('Looking for connection with state:', state);

    const { data: connection, error: dbError } = await supabase
      .from('bank_connections')
      .select('*')
      .eq('session_id', state)
      .eq('status', 'pending')
      .single();

    console.log('DB query result:', { connection: connection?.id, error: dbError?.message });

    if (!connection) {
      console.error('No connection found for state:', state);
      return NextResponse.redirect(`${redirectUrl}/settings?error=invalid_state`);
    }

    console.log('Creating session with code...');
    const session = await createSession(code);
    console.log('Session created:', session.session_id);
    console.log('Accounts from session:', session.accounts);

    // session.accounts is an array of account UIDs (strings)
    const primaryAccountId = session.accounts?.[0];

    const consentValidUntil = new Date();
    consentValidUntil.setDate(consentValidUntil.getDate() + 90);

    console.log('Updating connection with account_id:', primaryAccountId);
    const { error: updateError } = await supabase
      .from('bank_connections')
      .update({
        session_id: session.session_id,
        account_id: primaryAccountId,
        consent_valid_until: consentValidUntil.toISOString(),
        status: 'active',
      })
      .eq('id', connection.id);

    if (updateError) {
      console.error('Update error:', updateError);
      throw updateError;
    }

    console.log('Connection updated successfully!');
    return NextResponse.redirect(`${redirectUrl}/settings?success=bank_connected`);
  } catch (err) {
    console.error('Bank callback error:', err);
    return NextResponse.redirect(`${redirectUrl}/settings?error=callback_failed`);
  }
}
