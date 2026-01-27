import jwt from 'jsonwebtoken';

const ENABLE_BANKING_API_URL = 'https://api.enablebanking.com';

interface EnableBankingConfig {
  applicationId: string;
  privateKey: string;
}

interface AuthorizationUrlResponse {
  url: string;
}

interface Session {
  session_id: string;
  accounts: Account[];
}

interface Account {
  account_id: string;
  iban: string;
  name: string;
  currency: string;
}

interface Transaction {
  transaction_id: string;
  booking_date: string;
  value_date?: string;
  transaction_amount: {
    amount: string;
    currency: string;
  };
  creditor_name?: string;
  creditor_account?: {
    iban?: string;
  };
  debtor_name?: string;
  debtor_account?: {
    iban?: string;
  };
  remittance_information_unstructured?: string;
  remittance_information_structured?: string;
}

interface TransactionsResponse {
  transactions: {
    booked: Transaction[];
    pending?: Transaction[];
  };
}

function getConfig(): EnableBankingConfig {
  const applicationId = process.env.ENABLE_BANKING_APPLICATION_ID;
  let privateKey = process.env.ENABLE_BANKING_PRIVATE_KEY;

  if (!applicationId || !privateKey) {
    throw new Error('Enable Banking credentials not configured');
  }

  // Handle escaped newlines from .env file
  privateKey = privateKey.replace(/\\n/g, '\n');

  return { applicationId, privateKey };
}

function createJWT(): string {
  const config = getConfig();
  const now = Math.floor(Date.now() / 1000);

  const payload = {
    iss: 'enablebanking.com',
    aud: 'api.enablebanking.com',
    iat: now,
    exp: now + 3600, // 1 hour expiration
    sub: config.applicationId,
  };

  return jwt.sign(payload, config.privateKey, {
    algorithm: 'RS256',
    header: {
      alg: 'RS256',
      typ: 'JWT',
      kid: config.applicationId,
    },
  });
}

function getAccessToken(): string {
  // Enable Banking uses JWT directly as the Bearer token
  return createJWT();
}

export async function getAuthorizationUrl(
  aspspName: string,
  redirectUri: string,
  state: string
): Promise<string> {
  const accessToken = getAccessToken();

  const response = await fetch(`${ENABLE_BANKING_API_URL}/auth`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      aspsp: {
        name: aspspName,
        country: 'PL',
      },
      state,
      redirect_url: redirectUri,
      psu_type: 'personal',
      access: {
        valid_until: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get authorization URL: ${error}`);
  }

  const data: AuthorizationUrlResponse = await response.json();
  return data.url;
}

export async function createSession(authCode: string): Promise<Session> {
  const accessToken = getAccessToken();

  const response = await fetch(`${ENABLE_BANKING_API_URL}/sessions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      code: authCode,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create session: ${error}`);
  }

  return response.json();
}

export async function getAccounts(sessionId: string): Promise<Account[]> {
  const accessToken = getAccessToken();

  const response = await fetch(`${ENABLE_BANKING_API_URL}/sessions/${sessionId}/accounts`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get accounts: ${response.statusText}`);
  }

  const data = await response.json();
  return data.accounts;
}

export async function getTransactions(
  sessionId: string,
  accountId: string,
  dateFrom?: string,
  dateTo?: string
): Promise<Transaction[]> {
  const accessToken = getAccessToken();

  const params = new URLSearchParams();
  if (dateFrom) params.append('date_from', dateFrom);
  if (dateTo) params.append('date_to', dateTo);

  const response = await fetch(
    `${ENABLE_BANKING_API_URL}/accounts/${accountId}/transactions?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Session-ID': sessionId,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get transactions: ${response.statusText}`);
  }

  const data: TransactionsResponse = await response.json();
  return data.transactions.booked;
}

export async function refreshSession(sessionId: string): Promise<boolean> {
  const accessToken = getAccessToken();

  const response = await fetch(`${ENABLE_BANKING_API_URL}/sessions/${sessionId}/refresh`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  return response.ok;
}

export function mapTransaction(
  tx: Transaction,
  accountId: string
): {
  external_id: string;
  bank_account_id: string;
  raw_description: string;
  amount: number;
  currency: string;
  transaction_date: string;
  booking_date: string;
  counterparty_account: string | null;
  counterparty_name: string | null;
  is_income: boolean;
} {
  const amount = parseFloat(tx.transaction_amount.amount);
  const isIncome = amount > 0;

  const counterpartyName = isIncome ? tx.debtor_name : tx.creditor_name;
  const counterpartyAccount = isIncome
    ? tx.debtor_account?.iban
    : tx.creditor_account?.iban;

  const description =
    tx.remittance_information_unstructured ||
    tx.remittance_information_structured ||
    counterpartyName ||
    'Brak opisu';

  return {
    external_id: `${accountId}-${tx.transaction_id}-${tx.booking_date}`,
    bank_account_id: accountId,
    raw_description: description,
    amount: Math.abs(amount),
    currency: tx.transaction_amount.currency,
    transaction_date: tx.value_date || tx.booking_date,
    booking_date: tx.booking_date,
    counterparty_account: counterpartyAccount || null,
    counterparty_name: counterpartyName || null,
    is_income: isIncome,
  };
}
