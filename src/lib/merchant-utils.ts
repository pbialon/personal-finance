// Known brand mappings - maps variations to canonical brand name
const BRAND_MAPPINGS: Record<string, string> = {
  // Food delivery
  'wolt': 'wolt',
  'uber eats': 'uber eats',
  'uber': 'uber',
  'glovo': 'glovo',
  'bolt food': 'bolt food',
  'pyszne': 'pyszne.pl',

  // Grocery stores
  'lidl': 'lidl',
  'biedronka': 'biedronka',
  'zabka': 'żabka',
  'żabka': 'żabka',
  'lewiatan': 'lewiatan',
  'carrefour': 'carrefour',
  'auchan': 'auchan',
  'kaufland': 'kaufland',
  'netto': 'netto',
  'dino': 'dino',
  'stokrotka': 'stokrotka',
  'polo market': 'polo market',

  // Gas stations
  'orlen': 'orlen',
  'pkn orlen': 'orlen',
  'bp': 'bp',
  'shell': 'shell',
  'circle k': 'circle k',
  'mol': 'mol',
  'moya': 'moya',
  'avia': 'avia',
  'lotos': 'lotos',
  'total': 'total',

  // Transport
  'bolt': 'bolt',
  'freenow': 'freenow',
  'itaxi': 'itaxi',

  // Streaming
  'netflix': 'netflix',
  'spotify': 'spotify',
  'hbo': 'hbo max',
  'disney': 'disney+',
  'canal+': 'canal+',
  'canal plus': 'canal+',
  'amazon prime': 'amazon prime',
  'youtube': 'youtube',
  'apple': 'apple',

  // E-commerce
  'allegro': 'allegro',
  'amazon': 'amazon',
  'aliexpress': 'aliexpress',
  'shein': 'shein',
  'temu': 'temu',
  'zalando': 'zalando',
  'empik': 'empik',
  'mediamarkt': 'media markt',
  'media markt': 'media markt',
  'rtv euro agd': 'rtv euro agd',
  'x-kom': 'x-kom',
  'morele': 'morele.net',

  // Fast food
  'mcdonalds': 'mcdonald\'s',
  'mcdonald': 'mcdonald\'s',
  'kfc': 'kfc',
  'burger king': 'burger king',
  'subway': 'subway',
  'starbucks': 'starbucks',
  'costa': 'costa coffee',
  'pizza hut': 'pizza hut',
  'dominos': 'domino\'s',
  'domino': 'domino\'s',

  // Telecoms
  'orange': 'orange',
  'play': 'play',
  't-mobile': 't-mobile',
  'plus': 'plus',
  'vectra': 'vectra',
  'upc': 'upc',

  // Banks/Finance
  'revolut': 'revolut',
  'paypal': 'paypal',
};

// Prefixes to skip when extracting brand
const SKIP_PREFIXES = new Set([
  'sklep', 'shop', 'store', 'market', 'super', 'mini', 'punkt', 'salon',
  'restauracja', 'restaurant', 'bar', 'kawiarnia', 'cafe', 'pizzeria', 'kebab',
  'stacja', 'station', 'apteka', 'pharmacy', 'kiosk', 'stoisko',
]);

// Suffixes to strip from counterparty names
const STRIP_PATTERNS = [
  // Company forms
  /\s*(sp\.?\s*z\.?\s*o\.?\s*o\.?|s\.?\s*a\.?|ltd\.?|gmbh|inc\.?|corp\.?|llc|s\.?\s*c\.?)\.?\s*$/i,
  // Polish locations
  /\s+(poland|polska|pol|pl)\s*$/i,
  /\s+(warszawa|warsaw|krakow|kraków|wroclaw|wrocław|poznan|poznań|gdansk|gdańsk|lodz|łódź|katowice|lublin|szczecin|bydgoszcz|białystok|bialystok)\s*$/i,
  // Common country codes
  /\s+(nld|deu|gbr|usa|irl|est|ltu|lva|cze|svk|hun|aut|che|fra|esp|ita|bel)\s*$/i,
  // Transaction IDs, terminal numbers, etc.
  /\s+(nr|no|id|terminal|kasa|pos|ref|#)?\s*\.?\s*\d+.*$/i,
  // Uber-style patterns
  /\s+\*\s*\w+.*$/i, // "* EATS"
  /\s+help\.[a-z]+\.[a-z]+$/i, // "help.uber.com"
  // Operations suffixes
  /\s+operations?\s*(ou|oy|ab|as|bv)?\s*$/i,
  // Domain suffixes
  /\.(com|pl|eu|net|org)\s*$/i,
  // Fort, address parts
  /\s+fort\s+\w+/i,
];

// Patterns that indicate personal transfer (not a merchant)
const PERSONAL_PATTERNS = [
  /^[A-ZŁŚŻŹĆŃĘ][a-złśżźćńęą]+\s+[A-ZŁŚŻŹĆŃĘ][a-złśżźćńęą]+$/,  // "Jan Kowalski"
  /^[A-ZŁŚŻŹĆŃĘ]+\s+[A-ZŁŚŻŹĆŃĘ]+$/i,  // "KOWALSKI JAN" (all caps)
  /^[A-ZŁŚŻŹĆŃĘ][a-złśżźćńęą]+\s+[A-ZŁŚŻŹĆŃĘ][a-złśżźćńęą]+\s+(fizjoterapeut|masażyst|lekarz|dentysta|psycholog|terapeut|coach|trener|fryzjer|kosmetyczk|pedagog|logoped)/i,  // Personal service providers
  /przelew\s+(do|od|na)/i,
  /wpłata\s+własna/i,
  /wypłata\s+własna/i,
];

/**
 * Extract canonical brand name from a counterparty name.
 * Returns null if it looks like a personal transfer.
 */
export function extractBrandName(counterpartyName: string): string | null {
  if (!counterpartyName?.trim()) return null;

  const input = counterpartyName.trim();
  const inputLower = input.toLowerCase();

  // First check if it contains any known brand - if so, it's not a personal transfer
  const knownBrands = Object.keys(BRAND_MAPPINGS);
  const containsKnownBrand = knownBrands.some(brand => inputLower.includes(brand));

  // Only check personal patterns if no known brand found
  if (!containsKnownBrand) {
    for (const pattern of PERSONAL_PATTERNS) {
      if (pattern.test(input)) {
        return null;
      }
    }
  }

  // Remove quotes and clean up
  let normalized = inputLower.replace(/["'„"]/g, '').trim();

  // Strip known suffixes
  for (const pattern of STRIP_PATTERNS) {
    normalized = normalized.replace(pattern, '').trim();
  }

  // Handle special cases first
  // Uber Eats
  if (/uber.*eats/i.test(counterpartyName) || /uber\s*\*/i.test(counterpartyName)) {
    return 'uber eats';
  }

  // Żabka/Zabka normalization
  if (/zabka|żabka/i.test(normalized)) {
    return 'żabka';
  }

  // Netflix.com
  if (/netflix/i.test(normalized)) {
    return 'netflix';
  }

  // Canal+
  if (/canal\s*\+|canal\s*plus/i.test(normalized)) {
    return 'canal+';
  }

  // Split into words
  const words = normalized.split(/[\s\-_.,]+/).filter(w => w.length >= 2);

  // PRIORITY 1: Check ALL words for exact known brand match first
  // This ensures "JMP S.A. BIEDRONKA" matches "biedronka" not "jmp"
  for (const word of words) {
    if (BRAND_MAPPINGS[word]) {
      return BRAND_MAPPINGS[word];
    }
  }

  // Check if any word contains a known brand (but only if word is longer)
  // Avoid matching "sp" to "spotify" - require minimum 4 chars for substring match
  for (const word of words) {
    if (word.length < 4) continue; // Skip short words for substring matching
    for (const [key, brand] of Object.entries(BRAND_MAPPINGS)) {
      if (key.length < 4) continue; // Skip short keys
      if (word.includes(key) || key.includes(word)) {
        return brand;
      }
    }
  }

  // PRIORITY 2: No known brand found - return first significant word
  for (const word of words) {
    if (SKIP_PREFIXES.has(word)) continue;
    if (word.length < 3) continue;
    return word;
  }

  return null;
}

/**
 * Calculate similarity between two strings (0-1).
 */
function calculateSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (!a || !b) return 0;

  // Check containment
  if (a.includes(b)) return b.length / a.length;
  if (b.includes(a)) return a.length / b.length;

  // Levenshtein distance
  const matrix: number[][] = [];
  for (let i = 0; i <= a.length; i++) matrix[i] = [i];
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

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

/**
 * Find best matching merchant from existing merchants.
 */
export function findBestMerchantMatch(
  counterpartyName: string,
  existingMerchants: { id: string; name: string }[],
  threshold: number = 0.7
): { id: string; name: string } | null {
  const brand = extractBrandName(counterpartyName);
  if (!brand) return null;

  const brandLower = brand.toLowerCase();

  // Try exact match first (case-insensitive)
  for (const merchant of existingMerchants) {
    const merchantNameLower = merchant.name.toLowerCase();
    if (merchantNameLower === brandLower) {
      return merchant;
    }
    // Also check if brand is contained in merchant name or vice versa
    if (merchantNameLower.includes(brandLower) || brandLower.includes(merchantNameLower)) {
      return merchant;
    }
  }

  // Try matching brand against extracted brand from existing merchant names
  for (const merchant of existingMerchants) {
    const existingBrand = extractBrandName(merchant.name);
    if (existingBrand && existingBrand === brandLower) {
      return merchant;
    }
  }

  // Try fuzzy match
  let bestMatch: { id: string; name: string } | null = null;
  let bestScore = threshold;

  for (const merchant of existingMerchants) {
    const merchantLower = merchant.name.toLowerCase();
    const score = calculateSimilarity(brandLower, merchantLower);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = merchant;
    }
  }

  return bestMatch;
}

/**
 * Generate a nice display name from brand.
 */
export function formatDisplayName(brand: string): string {
  // Special cases
  const specialCases: Record<string, string> = {
    'mcdonald\'s': 'McDonald\'s',
    'domino\'s': 'Domino\'s',
    'żabka': 'Żabka',
    'uber eats': 'Uber Eats',
    'canal+': 'Canal+',
    'hbo max': 'HBO Max',
    'disney+': 'Disney+',
    'x-kom': 'x-kom',
    'pyszne.pl': 'Pyszne.pl',
    'morele.net': 'Morele.net',
    't-mobile': 'T-Mobile',
    'rtv euro agd': 'RTV Euro AGD',
  };

  if (specialCases[brand]) {
    return specialCases[brand];
  }

  // Capitalize first letter
  return brand.charAt(0).toUpperCase() + brand.slice(1);
}
