import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';

const openai = new OpenAI();

interface CategoryInfo {
  id: string;
  name: string;
  ai_prompt: string | null;
}

// Common prefixes that should not be used for matching
const EXCLUDED_PREFIXES = new Set([
  'sklep', 'shop', 'store', 'market', 'super', 'mini', 'punkt', 'salon',
  'restauracja', 'bar', 'kawiarnia', 'pizzeria', 'kebab', 'stacja',
]);

// Common suffixes to strip (company forms, locations, IDs)
const STRIP_SUFFIXES = [
  /\s+(sp\.?\s*z\.?\s*o\.?\s*o\.?|s\.?\s*a\.?|ltd|gmbh|inc|corp|llc)\.?$/i,
  /\s+(poland|polska|pol|warszawa|warsaw|krakow|wroclaw|poznan|gdansk)$/i,
  /\s+(nr|no|id|terminal|stacja)?\s*\d+.*$/i,
  /\s+\*.*$/i, // Uber *EATS patterns
  /\s+help\..+$/i, // help.uber.com patterns
  /\s+operations?\s*(ou|oy)?$/i, // Bolt Operations OU
];

// Get normalized brand name for matching (skips common prefixes)
function getNormalizedBrand(name: string): string {
  let normalized = name.toLowerCase().trim();

  // Strip common suffixes
  for (const suffix of STRIP_SUFFIXES) {
    normalized = normalized.replace(suffix, '');
  }
  normalized = normalized.trim();

  const words = normalized.split(/[\s\-_]+/);
  for (const word of words) {
    if (!EXCLUDED_PREFIXES.has(word) && word.length >= 3) {
      return word;
    }
  }
  return normalized.replace(/[\s\-_]+/g, '');
}

// Fuzzy match - calculate similarity ratio between two strings
function calculateSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;

  // Check if one contains the other
  if (a.includes(b) || b.includes(a)) {
    return Math.min(a.length, b.length) / Math.max(a.length, b.length);
  }

  // Simple Levenshtein-based similarity
  const matrix: number[][] = [];
  for (let i = 0; i <= a.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  const distance = matrix[a.length][b.length];
  return 1 - distance / Math.max(a.length, b.length);
}

// Find best fuzzy match from existing merchants
function findBestFuzzyMatch(
  name: string,
  merchantMapLower: Map<string, { id: string; name: string }>,
  brandToMerchant: Map<string, { id: string; name: string }>,
  threshold: number = 0.8
): { id: string; name: string } | null {
  const normalized = getNormalizedBrand(name);

  // First try exact brand match
  if (brandToMerchant.has(normalized)) {
    return brandToMerchant.get(normalized)!;
  }

  // Then try fuzzy matching on brand names
  let bestMatch: { id: string; name: string } | null = null;
  let bestScore = threshold;

  for (const [brand, merchant] of brandToMerchant) {
    const score = calculateSimilarity(normalized, brand);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = merchant;
    }
  }

  // Also check full names
  const lowerName = name.toLowerCase().trim();
  for (const [merchantLower, merchant] of merchantMapLower) {
    const score = calculateSimilarity(lowerName, merchantLower);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = merchant;
    }
  }

  return bestMatch;
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

EXISTING MERCHANTS (you MUST match to one of these if the brand is the same):
${existingMerchants.length > 0 ? existingMerchants.map(m => `- "${m}"`).join('\n') : '(none yet)'}

Available categories:
${categoriesPrompt}

CRITICAL MATCHING RULES - PRIORITY ORDER:
1. FIRST: Check if brand matches ANY existing merchant (case-insensitive comparison!)
   - If match found → return EXACT existing merchant name, is_existing: true, confidence: 0.95+
   - Examples with existing "wolt": "WOLT WARSAW POL" → "wolt", is_existing: true
   - Examples with existing "lidl": "LIDL FORT SLUZEW WARSZAWA" → "lidl", is_existing: true

2. ONLY IF NO MATCH EXISTS: Extract the brand name
   - Remove locations, cities, transaction IDs, terminal numbers, company suffixes
   - Examples: "UBER *EATS HELP.UBER.COM" → "uber eats", "BOLT OPERATIONS OU" → "bolt"
   - Return is_existing: false

3. Return null for:
   - Personal transfers (person names, IBAN transfers to individuals)
   - Unclear/generic counterparty names
   - Low confidence matches (< 0.7)

4. Select category based on merchant type

BRAND EXTRACTION (only when no existing match):
- Strip: locations (Warsaw, Warszawa, Poland, POL), IDs (#123, NR 442), company forms (SP. Z O.O., Ltd)
- Keep only the core brand name in lowercase

Respond in JSON format:
{
  "merchant_name": "string or null (lowercase brand name, or EXACT existing merchant name if matching)",
  "display_name": "string (nicely formatted for UI display)",
  "website": "string or null (domain without https://)",
  "category_id": "uuid of the best matching category or null",
  "is_existing": boolean (true if matched to existing merchant),
  "confidence": number (0-1, must be >= 0.9 to create new merchant)
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.1,
  });

  const result = JSON.parse(response.choices[0].message.content || '{}');

  // Normalize merchant name to lowercase (critical for deduplication!)
  const normalizeName = (name: string | null) => {
    if (!name) return null;
    return name.toLowerCase().trim();
  };

  return {
    merchant_name: normalizeName(result.merchant_name),
    is_new: !result.is_existing,
    confidence: result.confidence || 0,
    display_name: result.display_name,
    website: result.website,
    category_id: result.category_id,
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

    // Minimum confidence for creating NEW merchants (high threshold to prevent duplicates)
    const MIN_CONFIDENCE_NEW = 0.9;
    // Minimum confidence for matching existing merchants
    const MIN_CONFIDENCE_MATCH = 0.5;

    for (const tx of transactions) {
      try {
        const result = await extractMerchantFromTransaction(
          tx.counterparty_name || '',
          tx.raw_description || tx.display_name || '',
          merchantNames,
          categoryList
        );

        if (!result.merchant_name || result.confidence < MIN_CONFIDENCE_MATCH) {
          continue;
        }

        // Case-insensitive lookup for existing merchant
        let existingMerchant = findExistingMerchant(result.merchant_name);

        // If no exact match, try fuzzy matching
        if (!existingMerchant) {
          existingMerchant = findBestFuzzyMatch(
            result.merchant_name,
            merchantMapLower,
            brandToMerchant,
            0.8 // 80% similarity threshold
          );
        }

        let merchantId = existingMerchant?.id;

        if (!merchantId) {
          // Only create new merchant if confidence is high enough
          if (result.confidence < MIN_CONFIDENCE_NEW) {
            // Not confident enough to create new merchant, skip
            continue;
          }

          // Create new merchant with lowercase name
          const iconUrl = await fetchMerchantIcon(result.website);

          // Validate category_id exists
          const validCategoryId = result.category_id && categoryList.some(c => c.id === result.category_id)
            ? result.category_id
            : null;

          // Use lowercase name for storage, display_name for UI
          const merchantName = result.merchant_name.toLowerCase().trim();

          const { data: newMerchant, error: insertError } = await supabase
            .from('merchants')
            .insert({
              name: merchantName,
              display_name: result.display_name || result.merchant_name,
              icon_url: iconUrl,
              website: result.website,
              category_id: validCategoryId,
            })
            .select()
            .single();

          if (insertError) {
            // Maybe merchant was created in parallel, try to get it (case-insensitive)
            const { data: existing } = await supabase
              .from('merchants')
              .select('id, name')
              .ilike('name', merchantName)
              .single();

            merchantId = existing?.id;
          } else {
            merchantId = newMerchant.id;
            // Add to case-insensitive map
            merchantMapLower.set(merchantName, {
              id: merchantId,
              name: merchantName,
            });
            // Add to brand map
            const brand = getNormalizedBrand(merchantName);
            if (!brandToMerchant.has(brand)) {
              brandToMerchant.set(brand, { id: merchantId, name: merchantName });
            }
            merchantNames.push(merchantName);
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
