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

export function isInternalTransfer(
  counterpartyAccount: string | null,
  ignoredIbans: string[]
): boolean {
  if (!counterpartyAccount || ignoredIbans.length === 0) {
    return false;
  }

  // Normalize IBAN - remove spaces and convert to uppercase
  const normalizedAccount = counterpartyAccount.replace(/\s/g, '').toUpperCase();

  return ignoredIbans.some((iban) => {
    const normalizedIban = iban.replace(/\s/g, '').toUpperCase();
    return normalizedAccount === normalizedIban;
  });
}
