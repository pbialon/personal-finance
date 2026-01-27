import { createClient } from '@/lib/supabase/server';

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
