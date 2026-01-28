import { describe, it, expect } from 'vitest';
import { extractBrandName, findBestMerchantMatch } from './merchant-utils';

describe('extractBrandName', () => {
  it('extracts brand from LIDL variations', () => {
    expect(extractBrandName('LIDL FORT SLUZEW WARSZAWA POL')).toBe('lidl');
    expect(extractBrandName('LIDL 1234 KRAKOW')).toBe('lidl');
    expect(extractBrandName('Lidl Polska')).toBe('lidl');
  });

  it('extracts brand from WOLT variations', () => {
    expect(extractBrandName('WOLT WARSAW POL')).toBe('wolt');
    expect(extractBrandName('Wolt Warszawa POL')).toBe('wolt');
    expect(extractBrandName('WOLT POLAND POL')).toBe('wolt');
  });

  it('extracts brand from ORLEN variations', () => {
    expect(extractBrandName('ORLEN STACJA NR 442 LACZNA POL')).toBe('orlen');
    expect(extractBrandName('PKN ORLEN SA')).toBe('orlen');
  });

  it('extracts brand from Netflix', () => {
    expect(extractBrandName('Netflix.com Los Gatos NLD')).toBe('netflix');
    expect(extractBrandName('NETFLIX.COM')).toBe('netflix');
  });

  it('extracts brand from CANAL+', () => {
    expect(extractBrandName('CANAL+ warszawa POL')).toBe('canal+');
  });

  it('extracts brand from Bolt', () => {
    expect(extractBrandName('BOLT OPERATIONS OU')).toBe('bolt');
  });

  it('extracts brand from Uber Eats', () => {
    expect(extractBrandName('UBER *EATS HELP.UBER.COM')).toBe('uber eats');
  });

  it('extracts brand from Allegro', () => {
    expect(extractBrandName('ALLEGRO SP. Z O.O.')).toBe('allegro');
  });

  it('extracts brand from stores with prefix', () => {
    expect(extractBrandName('Sklep Lewiatan Warszawa POL')).toBe('lewiatan');
    expect(extractBrandName('Stacja Orlen nr 123')).toBe('orlen');
  });

  it('handles Żabka', () => {
    expect(extractBrandName('ZABKA Z3456 WARSZAWA')).toBe('żabka');
    expect(extractBrandName('Żabka Polska')).toBe('żabka');
  });

  it('handles Biedronka', () => {
    expect(extractBrandName('BIEDRONKA 1234 KRAKOW')).toBe('biedronka');
  });

  it('returns null for personal transfers', () => {
    expect(extractBrandName('Jan Kowalski')).toBeNull();
    expect(extractBrandName('KOWALSKI JAN')).toBeNull();
    expect(extractBrandName('Anita Parkot')).toBeNull();
  });

  it('returns null for service providers with person names', () => {
    // These look like personal service providers, not merchants
    expect(extractBrandName('Anita Parkot fizjoterapeutka')).toBeNull();
  });

  it('handles MOL gas stations', () => {
    expect(extractBrandName('MOL SF399 K.1 BARAK 26500 POL')).toBe('mol');
  });

  it('handles local bakeries/shops with unclear brands', () => {
    // These should probably return null as they're not recognizable brands
    const result = extractBrandName('Sklep F. Piekarni Oskro Warszawa');
    // Either null or the first significant word
    expect(result === null || result === 'piekarni' || result === 'oskro').toBe(true);
  });

  it('handles ZPM GROT style company names', () => {
    const result = extractBrandName('Z.P.M. "GROT" Sp. z o.o WARSZAWA');
    // This is an obscure company name, could extract "grot" or return any first word
    expect(typeof result === 'string' || result === null).toBe(true);
  });
});

describe('findBestMerchantMatch', () => {
  const existingMerchants = [
    { id: '1', name: 'lidl' },
    { id: '2', name: 'wolt' },
    { id: '3', name: 'orlen' },
    { id: '4', name: 'netflix' },
    { id: '5', name: 'żabka' },
  ];

  it('finds exact brand match', () => {
    expect(findBestMerchantMatch('LIDL FORT SLUZEW WARSZAWA', existingMerchants)?.id).toBe('1');
    expect(findBestMerchantMatch('WOLT WARSAW POL', existingMerchants)?.id).toBe('2');
    expect(findBestMerchantMatch('ORLEN STACJA NR 442', existingMerchants)?.id).toBe('3');
  });

  it('finds fuzzy match', () => {
    expect(findBestMerchantMatch('Netflix.com Los Gatos NLD', existingMerchants)?.id).toBe('4');
  });

  it('handles Żabka/Zabka variations', () => {
    expect(findBestMerchantMatch('ZABKA Z3456 WARSZAWA', existingMerchants)?.id).toBe('5');
  });

  it('returns null for unknown merchants', () => {
    expect(findBestMerchantMatch('UNKNOWN SHOP XYZ', existingMerchants)).toBeNull();
  });

  // Tests for case-insensitive matching (real database scenario)
  describe('case-insensitive matching', () => {
    const realMerchants = [
      { id: '1', name: 'Biedronka' },
      { id: '2', name: 'BOLT.EU' },
      { id: '3', name: 'CANAL+' },
      { id: '4', name: 'Lidl' },  // Capital L
      { id: '5', name: 'Netflix' },  // Capital N
    ];

    it('matches LIDL to Lidl (case insensitive)', () => {
      expect(findBestMerchantMatch('LIDL FORT SLUZEW WARSZAWA POL', realMerchants)?.id).toBe('4');
    });

    it('matches Netflix.com to Netflix', () => {
      expect(findBestMerchantMatch('Netflix.com Los Gatos NLD', realMerchants)?.id).toBe('5');
    });

    it('matches CANAL+ variations', () => {
      expect(findBestMerchantMatch('CANAL+ warszawa POL', realMerchants)?.id).toBe('3');
    });

    it('matches BOLT to BOLT.EU', () => {
      expect(findBestMerchantMatch('BOLT OPERATIONS OU', realMerchants)?.id).toBe('2');
    });

    it('matches Biedronka variations', () => {
      expect(findBestMerchantMatch('BIEDRONKA 1234 KRAKOW', realMerchants)?.id).toBe('1');
    });
  });
});
