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

  // Get existing merchants with aliases for matching
  const { data: existingMerchants } = await supabase
    .from('merchants')
    .select('id, name, aliases:merchant_aliases(alias)');

  const merchants = existingMerchants || [];

  // Try to find existing merchant match (now checks both names and aliases)
  const match = findBestMerchantMatch(counterpartyName, merchants);
  if (match) {
    return match.id;
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
