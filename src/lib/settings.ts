import { createClient } from '@/lib/supabase/server';

const DEFAULT_FINANCIAL_MONTH_START_DAY = 1;

/**
 * Fetches the financial month start day from app_settings.
 * Returns 1 (calendar month) if not configured.
 *
 * @returns The day of month (1-31) when the financial month starts
 */
export async function getFinancialMonthStartDay(): Promise<number> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'financial_month_start_day')
      .single();

    if (error || !data) {
      return DEFAULT_FINANCIAL_MONTH_START_DAY;
    }

    const value = typeof data.value === 'number' ? data.value : parseInt(data.value, 10);

    // Validate range 1-31
    if (isNaN(value) || value < 1 || value > 31) {
      return DEFAULT_FINANCIAL_MONTH_START_DAY;
    }

    return value;
  } catch {
    return DEFAULT_FINANCIAL_MONTH_START_DAY;
  }
}

export async function getIgnoredIbans(): Promise<string[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'ignored_ibans')
      .single();

    if (error || !data) {
      return [];
    }

    // Value is stored as JSON array
    return Array.isArray(data.value) ? data.value : [];
  } catch {
    return [];
  }
}

// Extract numeric part of IBAN (without country code)
function getIbanNumericPart(iban: string): string {
  const clean = iban.replace(/\s/g, '').toUpperCase();
  // If starts with 2 letters (country code), remove them
  if (/^[A-Z]{2}/.test(clean)) {
    return clean.slice(2);
  }
  return clean;
}

export function isInternalTransfer(
  counterpartyAccount: string | null,
  ignoredIbans: string[]
): boolean {
  if (!counterpartyAccount || ignoredIbans.length === 0) {
    return false;
  }

  // Normalize IBAN - remove spaces and convert to uppercase
  const normalizedAccount = counterpartyAccount.replace(/\s/g, '').toUpperCase();
  const accountNumericPart = getIbanNumericPart(normalizedAccount);

  return ignoredIbans.some((iban) => {
    const normalizedIban = iban.replace(/\s/g, '').toUpperCase();
    const ibanNumericPart = getIbanNumericPart(normalizedIban);

    // Match full IBAN or just numeric part (for CSV without country code)
    return normalizedAccount === normalizedIban ||
           accountNumericPart === ibanNumericPart;
  });
}
