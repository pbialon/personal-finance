import { createClient } from '@/lib/supabase/server';

export async function findOrCreateMerchant(
  name: string | null,
  displayName?: string
): Promise<string | null> {
  if (!name || !name.trim()) {
    return null;
  }

  const supabase = await createClient();
  const normalizedName = name.toLowerCase().trim();
  const finalDisplayName = displayName?.trim() || name.trim();

  const { data: existingMerchant } = await supabase
    .from('merchants')
    .select('id')
    .eq('name', normalizedName)
    .maybeSingle();

  if (existingMerchant) {
    return existingMerchant.id;
  }

  const { data: aliasMatch } = await supabase
    .from('merchant_aliases')
    .select('merchant_id')
    .eq('alias', normalizedName)
    .maybeSingle();

  if (aliasMatch) {
    return aliasMatch.merchant_id;
  }

  const { data: newMerchant, error } = await supabase
    .from('merchants')
    .insert({
      name: normalizedName,
      display_name: finalDisplayName,
      icon_url: null,
      website: null,
    })
    .select('id')
    .single();

  if (error) {
    if (error.code === '23505') {
      const { data: retryMerchant } = await supabase
        .from('merchants')
        .select('id')
        .eq('name', normalizedName)
        .maybeSingle();
      return retryMerchant?.id || null;
    }
    throw error;
  }

  return newMerchant.id;
}
