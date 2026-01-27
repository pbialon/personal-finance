import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const ENABLE_BANKING_API_URL = 'https://api.enablebanking.com';

function getAccessToken(): string {
  const applicationId = process.env.ENABLE_BANKING_APPLICATION_ID;
  let privateKey = process.env.ENABLE_BANKING_PRIVATE_KEY;

  if (!applicationId || !privateKey) {
    throw new Error('Enable Banking credentials not configured');
  }

  privateKey = privateKey.replace(/\\n/g, '\n');
  const now = Math.floor(Date.now() / 1000);

  const payload = {
    iss: 'enablebanking.com',
    aud: 'api.enablebanking.com',
    iat: now,
    exp: now + 3600,
    sub: applicationId,
  };

  return jwt.sign(payload, privateKey, {
    algorithm: 'RS256',
    header: {
      alg: 'RS256',
      typ: 'JWT',
      kid: applicationId,
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country') || 'PL';
    const search = searchParams.get('search')?.toLowerCase();

    const accessToken = getAccessToken();

    const response = await fetch(`${ENABLE_BANKING_API_URL}/aspsps?country=${country}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get ASPSPs: ${error}`);
    }

    const data = await response.json();
    let aspsps = data.aspsps || [];

    if (search) {
      aspsps = aspsps.filter((a: { name: string }) =>
        a.name.toLowerCase().includes(search)
      );
    }

    return NextResponse.json(aspsps);
  } catch (error) {
    console.error('ASPSP error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
