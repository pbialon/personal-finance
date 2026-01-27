import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface Merchant {
  id: string;
  name: string;
  display_name: string;
  category_id: string | null;
  icon_url: string | null;
  website: string | null;
}

// Common prefixes that should not be used for matching
const EXCLUDED_PREFIXES = new Set([
  'sklep', 'shop', 'store', 'market', 'super', 'mini', 'punkt', 'salon',
  'restauracja', 'bar', 'kawiarnia', 'pizzeria', 'kebab', 'stacja',
]);

// Get normalized brand name for matching
function getNormalizedBrand(name: string): string {
  const words = name.toLowerCase().split(/[\s\-_]+/);
  // Skip common prefixes
  for (const word of words) {
    if (!EXCLUDED_PREFIXES.has(word) && word.length >= 3) {
      return word;
    }
  }
  // If all words are excluded, use the full name
  return name.toLowerCase().replace(/[\s\-_]+/g, '');
}

export async function POST() {
  try {
    const supabase = await createClient();

    // Get all merchants
    const { data: merchants, error } = await supabase
      .from('merchants')
      .select('id, name, display_name, category_id, icon_url, website')
      .order('created_at');

    if (error || !merchants) {
      return NextResponse.json({ error: error?.message || 'Failed to fetch merchants' }, { status: 500 });
    }

    // Group merchants by normalized brand name
    const groups = new Map<string, Merchant[]>();

    for (const merchant of merchants) {
      const normalized = getNormalizedBrand(merchant.name);
      const existing = groups.get(normalized) || [];
      existing.push(merchant as Merchant);
      groups.set(normalized, existing);
    }

    let merged = 0;
    let deleted = 0;
    const results: { group: string; kept: string; deleted: string[] }[] = [];

    for (const [normalizedName, group] of groups) {
      if (group.length <= 1) continue;

      // Find the best merchant to keep (one with category_id, or icon_url, or first)
      const sorted = [...group].sort((a, b) => {
        // Prefer one with category_id
        if (a.category_id && !b.category_id) return -1;
        if (!a.category_id && b.category_id) return 1;
        // Prefer one with icon_url
        if (a.icon_url && !b.icon_url) return -1;
        if (!a.icon_url && b.icon_url) return 1;
        // Prefer shorter name (more normalized)
        return a.name.length - b.name.length;
      });

      const keeper = sorted[0];
      const duplicates = sorted.slice(1);

      // Update all transactions pointing to duplicates to point to keeper
      for (const dup of duplicates) {
        const { error: updateError } = await supabase
          .from('transactions')
          .update({ merchant_id: keeper.id })
          .eq('merchant_id', dup.id);

        if (updateError) {
          console.error(`Failed to update transactions for ${dup.name}:`, updateError);
          continue;
        }

        // Delete the duplicate merchant
        const { error: deleteError } = await supabase
          .from('merchants')
          .delete()
          .eq('id', dup.id);

        if (deleteError) {
          console.error(`Failed to delete ${dup.name}:`, deleteError);
          continue;
        }

        deleted++;
      }

      merged++;
      results.push({
        group: normalizedName,
        kept: keeper.name,
        deleted: duplicates.map((d) => d.name),
      });
    }

    return NextResponse.json({
      success: true,
      merged,
      deleted,
      results,
    });
  } catch (error) {
    console.error('Deduplication error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Deduplication failed' },
      { status: 500 }
    );
  }
}

// GET to preview duplicates without merging
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: merchants, error } = await supabase
      .from('merchants')
      .select('id, name, display_name, category_id, icon_url')
      .order('created_at');

    if (error || !merchants) {
      return NextResponse.json({ error: error?.message || 'Failed to fetch merchants' }, { status: 500 });
    }

    // Group merchants by normalized brand name
    const groups = new Map<string, typeof merchants>();

    for (const merchant of merchants) {
      const normalized = getNormalizedBrand(merchant.name);
      const existing = groups.get(normalized) || [];
      existing.push(merchant);
      groups.set(normalized, existing);
    }

    // Return only groups with duplicates
    const duplicates: { group: string; merchants: typeof merchants }[] = [];
    for (const [normalizedName, group] of groups) {
      if (group.length > 1) {
        duplicates.push({
          group: normalizedName,
          merchants: group,
        });
      }
    }

    return NextResponse.json({
      duplicateGroups: duplicates.length,
      duplicates,
    });
  } catch (error) {
    console.error('Preview error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Preview failed' },
      { status: 500 }
    );
  }
}
