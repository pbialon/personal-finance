import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

const openai = new OpenAI();

interface CategoryInfo {
  id: string;
  name: string;
  ai_prompt: string | null;
}

interface ExtractedMerchant {
  name: string;
  display_name: string;
  website?: string;
  category_id?: string;
}

// Common prefixes that should not be used for matching
const EXCLUDED_PREFIXES = new Set([
  'sklep', 'shop', 'store', 'market', 'super', 'mini', 'punkt', 'salon',
  'restauracja', 'bar', 'kawiarnia', 'pizzeria', 'kebab', 'stacja',
]);

// Get normalized brand name for matching (skips common prefixes)
function getNormalizedBrand(name: string): string {
  const words = name.toLowerCase().split(/[\s\-_]+/);
  for (const word of words) {
    if (!EXCLUDED_PREFIXES.has(word) && word.length >= 3) {
      return word;
    }
  }
  return name.toLowerCase().replace(/[\s\-_]+/g, '');
}

async function extractMerchantFromTransaction(
  counterpartyName: string,
  description: string,
  existingMerchants: string[],
  categories: CategoryInfo[]
): Promise<{ merchant_name: string | null; is_new: boolean; confidence: number; display_name?: string; website?: string; category_id?: string }> {
  const categoriesPrompt = categories
    .map(c => `- ${c.name} (ID: ${c.id}): ${c.ai_prompt || 'Brak opisu'}`)
    .join('\n');

  const prompt = `Analyze this transaction and identify the merchant/recipient.

Transaction info:
- Counterparty: "${counterpartyName}"
- Description: "${description}"

Existing merchants in database (CASE-INSENSITIVE, must match if brand is same): ${existingMerchants.length > 0 ? existingMerchants.join(', ') : 'none'}

Available categories:
${categoriesPrompt}

CRITICAL RULES:
1. ALWAYS extract just the BRAND NAME - remove locations, cities, transaction IDs, terminal numbers
   Examples:
   - "WOLT WARSAW POL" → "Wolt"
   - "Wolt Poland POL" → "Wolt"
   - "Wolt Warszawa POL" → "Wolt"
   - "LIDL FORT SLUZEW WARSZAWA" → "Lidl"
   - "BIEDRONKA 1234 KRAKOW" → "Biedronka"
   - "UBER *EATS HELP.UBER.COM" → "Uber eats"
   - "BOLT OPERATIONS OU" → "Bolt"
   - "ALLEGRO SP. Z O.O." → "Allegro"

2. CRITICAL: If the extracted brand matches ANY existing merchant (case-insensitive), return "is_existing": true and use that merchant name!
   Example: If "Orlen" exists and you see "ORLEN STACJA NR 442" → return merchant_name: "Orlen", is_existing: true
   Example: If "Wolt" exists and you see "WOLT WARSAW POL" → return merchant_name: "Wolt", is_existing: true
3. Return null for personal transfers (person names, IBAN transfers to individuals)
4. Select the most appropriate category based on merchant type

Common brands to normalize:
- All Wolt variations → "Wolt"
- All Lidl variations → "Lidl"
- All Biedronka variations → "Biedronka"
- All Żabka variations → "Żabka"
- All Bolt variations → "Bolt"
- All Uber/Uber Eats variations → "Uber eats" or "Uber"
- All Glovo variations → "Glovo"
- All Orlen variations → "Orlen"
- All Netflix variations → "Netflix"
- All Spotify variations → "Spotify"
- All Allegro variations → "Allegro"
- All Amazon variations → "Amazon"

Respond in JSON format:
{
  "merchant_name": "string or null (capitalized brand name only!)",
  "display_name": "string (nicely formatted brand name)",
  "website": "string or null (domain without https://)",
  "category_id": "uuid of the best matching category or null",
  "is_existing": boolean,
  "confidence": number (0-1)
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.1,
  });

  const result = JSON.parse(response.choices[0].message.content || '{}');

  // Capitalize first letter of merchant name
  const normalizeName = (name: string | null) => {
    if (!name) return null;
    const lower = name.toLowerCase().trim();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  };

  return {
    merchant_name: normalizeName(result.merchant_name),
    is_new: !result.is_existing,
    confidence: result.confidence || 0,
    ...result,
  };
}

async function fetchMerchantIcon(domain: string | undefined | null): Promise<string | null> {
  if (!domain) return null;

  // Try Clearbit Logo API (free for small usage)
  const clearbitUrl = `https://logo.clearbit.com/${domain}`;

  try {
    const response = await fetch(clearbitUrl, { method: 'HEAD' });
    if (response.ok) {
      return clearbitUrl;
    }
  } catch {
    // Clearbit failed, try Google favicon
  }

  // Fallback to Google favicon service
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const limit = body.limit || 50;

    // Get existing merchants
    const { data: existingMerchants } = await supabase
      .from('merchants')
      .select('id, name, display_name');

    const merchantNames = existingMerchants?.map((m) => m.name) || [];

    // Case-insensitive map: lowercase name -> { id, originalName }
    const merchantMapLower = new Map(
      existingMerchants?.map((m) => [m.name.toLowerCase(), { id: m.id, name: m.name }]) || []
    );

    // Pre-compute normalized brand names for all existing merchants
    const brandToMerchant = new Map<string, { id: string; name: string }>();
    for (const [lowerName, data] of merchantMapLower) {
      const brand = getNormalizedBrand(data.name);
      // Only use first match (prefer merchants added earlier)
      if (!brandToMerchant.has(brand)) {
        brandToMerchant.set(brand, data);
      }
    }

    // Function to find existing merchant (case-insensitive, brand-aware)
    const findExistingMerchant = (name: string): { id: string; name: string } | null => {
      const lower = name.toLowerCase().trim();

      // Exact match (case-insensitive)
      if (merchantMapLower.has(lower)) {
        return merchantMapLower.get(lower) || null;
      }

      // Try matching by normalized brand name
      const brand = getNormalizedBrand(name);
      if (brandToMerchant.has(brand)) {
        return brandToMerchant.get(brand) || null;
      }

      return null;
    };

    // Get categories for AI suggestion
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name, ai_prompt')
      .order('name');

    const categoryList: CategoryInfo[] = categories || [];

    // Get transactions without merchant_id
    const { data: transactions } = await supabase
      .from('transactions')
      .select('id, counterparty_name, raw_description, display_name')
      .is('merchant_id', null)
      .not('counterparty_name', 'is', null)
      .limit(limit);

    if (!transactions || transactions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No transactions to process',
        processed: 0,
      });
    }

    let processed = 0;
    let newMerchants = 0;
    let matched = 0;
    const errors: string[] = [];

    for (const tx of transactions) {
      try {
        const result = await extractMerchantFromTransaction(
          tx.counterparty_name || '',
          tx.raw_description || tx.display_name || '',
          merchantNames,
          categoryList
        );

        if (!result.merchant_name || result.confidence < 0.5) {
          continue;
        }

        // Case-insensitive lookup for existing merchant
        const existingMerchant = findExistingMerchant(result.merchant_name);
        let merchantId = existingMerchant?.id;

        if (!merchantId) {
          // Create new merchant
          const iconUrl = await fetchMerchantIcon(result.website);

          // Validate category_id exists
          const validCategoryId = result.category_id && categoryList.some(c => c.id === result.category_id)
            ? result.category_id
            : null;

          const { data: newMerchant, error: insertError } = await supabase
            .from('merchants')
            .insert({
              name: result.merchant_name,
              display_name: result.display_name || result.merchant_name,
              icon_url: iconUrl,
              website: result.website,
              category_id: validCategoryId,
            })
            .select()
            .single();

          if (insertError) {
            // Maybe merchant was created in parallel, try to get it
            const { data: existing } = await supabase
              .from('merchants')
              .select('id')
              .eq('name', result.merchant_name)
              .single();

            merchantId = existing?.id;
          } else {
            merchantId = newMerchant.id;
            // Add to case-insensitive map
            merchantMapLower.set(result.merchant_name.toLowerCase(), {
              id: merchantId,
              name: result.merchant_name,
            });
            merchantNames.push(result.merchant_name);
            newMerchants++;
          }
        } else {
          matched++;
        }

        if (merchantId) {
          await supabase
            .from('transactions')
            .update({ merchant_id: merchantId })
            .eq('id', tx.id);

          processed++;
        }
      } catch (err) {
        errors.push(`Transaction ${tx.id}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      success: true,
      processed,
      newMerchants,
      matched,
      errors: errors.length > 0 ? errors : undefined,
      remaining: transactions.length - processed,
    });
  } catch (error) {
    console.error('Merchant extraction error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Extraction failed' },
      { status: 500 }
    );
  }
}

// GET to check status
export async function GET() {
  const supabase = await createClient();

  const { count: withoutMerchant } = await supabase
    .from('transactions')
    .select('id', { count: 'exact', head: true })
    .is('merchant_id', null)
    .not('counterparty_name', 'is', null);

  const { count: withMerchant } = await supabase
    .from('transactions')
    .select('id', { count: 'exact', head: true })
    .not('merchant_id', 'is', null);

  const { count: totalMerchants } = await supabase
    .from('merchants')
    .select('id', { count: 'exact', head: true });

  return NextResponse.json({
    transactionsWithoutMerchant: withoutMerchant || 0,
    transactionsWithMerchant: withMerchant || 0,
    totalMerchants: totalMerchants || 0,
  });
}
