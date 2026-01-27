import { createClient } from '@/lib/supabase/server';
import { extractBrandName, findBestMerchantMatch, formatDisplayName } from './merchant-utils';

export async function findOrCreateMerchant(
  counterpartyName: string | null,
  displayName?: string
): Promise<string | null> {
  if (!counterpartyName || !counterpartyName.trim()) {
    return null;
  }

  const supabase = await createClient();

  // Extract brand name from counterparty
  const brandName = extractBrandName(counterpartyName);
  if (!brandName) {
    // Looks like a personal transfer, not a merchant
    return null;
  }

  // Get existing merchants for matching
  const { data: existingMerchants } = await supabase
    .from('merchants')
    .select('id, name');

  const merchants = existingMerchants || [];

  // Try to find existing merchant match
  const match = findBestMerchantMatch(counterpartyName, merchants);
  if (match) {
    return match.id;
  }

  // Check aliases
  const { data: aliasMatch } = await supabase
    .from('merchant_aliases')
    .select('merchant_id')
    .eq('alias', brandName)
    .maybeSingle();

  if (aliasMatch) {
    return aliasMatch.merchant_id;
  }

  // Create new merchant with extracted brand name
  const finalDisplayName = displayName?.trim() || formatDisplayName(brandName);

  const { data: newMerchant, error } = await supabase
    .from('merchants')
    .insert({
      name: brandName,
      display_name: finalDisplayName,
      icon_url: null,
      website: null,
    })
    .select('id')
    .single();

  if (error) {
    if (error.code === '23505') {
      // Duplicate - try to get existing
      const { data: retryMerchant } = await supabase
        .from('merchants')
        .select('id')
        .eq('name', brandName)
        .maybeSingle();
      return retryMerchant?.id || null;
    }
    throw error;
  }

  return newMerchant.id;
}
