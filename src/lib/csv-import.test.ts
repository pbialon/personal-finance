import { describe, it, expect } from 'vitest';
import { createExternalId, parseINGCsv, ParsedTransaction } from './csv-import';

describe('createExternalId', () => {
  it('generates unique ID for transaction with transaction_id', () => {
    const tx = {
      transaction_date: '2024-01-15',
      transaction_id: 'TRX123456',
      amount: 150.50,
      counterparty_name: 'Sklep ABC',
    };

    const result = createExternalId(tx);

    expect(result).toBe('csv-2024-01-15-TRX123456');
  });

  it('generates unique ID for transaction without transaction_id (fallback to amount+counterparty)', () => {
    const tx = {
      transaction_date: '2024-01-15',
      transaction_id: null,
      amount: 150.50,
      counterparty_name: 'Sklep ABC',
    };

    const result = createExternalId(tx);

    // Note: dots are stripped by the regex (not in [a-zA-Z0-9_-])
    expect(result).toBe('csv-2024-01-15-1505-Sklep_ABC');
  });

  it('generates same ID for identical transactions (duplicate detection)', () => {
    const tx1 = {
      transaction_date: '2024-01-15',
      transaction_id: 'TRX123',
      amount: 100,
      counterparty_name: 'Test Shop',
    };

    const tx2 = {
      transaction_date: '2024-01-15',
      transaction_id: 'TRX123',
      amount: 100,
      counterparty_name: 'Test Shop',
    };

    expect(createExternalId(tx1)).toBe(createExternalId(tx2));
  });

  it('generates different IDs for different transactions', () => {
    const tx1 = {
      transaction_date: '2024-01-15',
      transaction_id: 'TRX123',
      amount: 100,
      counterparty_name: 'Shop A',
    };

    const tx2 = {
      transaction_date: '2024-01-15',
      transaction_id: 'TRX456',
      amount: 100,
      counterparty_name: 'Shop A',
    };

    expect(createExternalId(tx1)).not.toBe(createExternalId(tx2));
  });

  it('handles Polish characters by removing them', () => {
    const tx = {
      transaction_date: '2024-01-15',
      transaction_id: null,
      amount: 50,
      counterparty_name: 'Żabka Żółta Ćma',
    };

    const result = createExternalId(tx);

    // Polish characters should be stripped (not valid in [a-zA-Z0-9_-])
    // Ż->removed, a->a, b->b, k->k, a->a, space->_, Ż->removed, ó->removed, ł->removed, t->t, a->a, etc.
    expect(result).toBe('csv-2024-01-15-50-abka_ta_ma');
    expect(result).not.toContain('ż');
    expect(result).not.toContain('ó');
    expect(result).not.toContain('ć');
  });

  it('handles spaces by replacing with underscores', () => {
    const tx = {
      transaction_date: '2024-01-15',
      transaction_id: null,
      amount: 75,
      counterparty_name: 'Store With Spaces',
    };

    const result = createExternalId(tx);

    expect(result).toBe('csv-2024-01-15-75-Store_With_Spaces');
    expect(result).not.toContain(' ');
  });

  it('handles empty counterparty_name', () => {
    const tx = {
      transaction_date: '2024-01-15',
      transaction_id: null,
      amount: 25.99,
      counterparty_name: '',
    };

    const result = createExternalId(tx);

    // Note: dots are stripped by the regex (not in [a-zA-Z0-9_-])
    expect(result).toBe('csv-2024-01-15-2599-');
  });

  it('truncates long counterparty names to 30 characters', () => {
    const tx = {
      transaction_date: '2024-01-15',
      transaction_id: null,
      amount: 100,
      counterparty_name: 'Very Long Company Name That Exceeds Thirty Characters Limit',
    };

    const result = createExternalId(tx);

    // "Very Long Company Name That Ex" = 30 chars
    expect(result).toBe('csv-2024-01-15-100-Very_Long_Company_Name_That_Ex');
  });

  it('prefers transaction_id over fallback when both available', () => {
    const tx = {
      transaction_date: '2024-01-15',
      transaction_id: 'TRX999',
      amount: 100,
      counterparty_name: 'Some Shop',
    };

    const result = createExternalId(tx);

    expect(result).toBe('csv-2024-01-15-TRX999');
    expect(result).not.toContain('100');
    expect(result).not.toContain('Some');
  });
});

describe('parseINGCsv', () => {
  const createValidCsvLine = (overrides: Partial<{
    date: string;
    bookingDate: string;
    counterparty: string;
    description: string;
    account: string;
    bank: string;
    details: string;
    txId: string;
    amount: string;
    currency: string;
    col10: string;
    col11: string;
    col12: string;
    col13: string;
    accountName: string;
    balance: string;
    balanceCurrency: string;
  }> = {}): string => {
    const defaults = {
      date: '2024-01-15',
      bookingDate: '2024-01-15',
      counterparty: 'Test Shop',
      description: 'Test Description',
      account: '12345678901234567890123456',
      bank: 'Test Bank',
      details: 'Details',
      txId: 'TRX123',
      amount: '-100,00',
      currency: 'PLN',
      col10: '',
      col11: '',
      col12: '',
      col13: '',
      accountName: 'Konto Główne',
      balance: '5000,00',
      balanceCurrency: 'PLN',
    };
    const d = { ...defaults, ...overrides };
    return `${d.date};${d.bookingDate};${d.counterparty};${d.description};${d.account};${d.bank};${d.details};${d.txId};${d.amount};${d.currency};${d.col10};${d.col11};${d.col12};${d.col13};${d.accountName};${d.balance};${d.balanceCurrency}`;
  };

  const header = 'Data transakcji;Data księgowania;Dane kontrahenta;Tytuł;Numer konta;Nazwa banku;Szczegóły;Numer referencyjny;Kwota transakcji;Waluta transakcji;Kwota blokady/zwolnienie blokady;Waluta blokady;col12;col13;Rachunek;Saldo;Waluta salda';

  it('parses valid CSV file with single transaction', () => {
    const csv = `${header}\n${createValidCsvLine()}`;

    const result = parseINGCsv(csv);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      transaction_date: '2024-01-15',
      booking_date: '2024-01-15',
      counterparty_name: 'Test Shop',
      description: 'Test Description',
      transaction_id: 'TRX123',
      amount: 100,
      currency: 'PLN',
      account_name: 'Konto Główne',
      is_income: false,
    });
  });

  it('parses multiple transactions', () => {
    const csv = [
      header,
      createValidCsvLine({ date: '2024-01-15', txId: 'TRX1', amount: '-50,00' }),
      createValidCsvLine({ date: '2024-01-16', txId: 'TRX2', amount: '200,00' }),
      createValidCsvLine({ date: '2024-01-17', txId: 'TRX3', amount: '-75,50' }),
    ].join('\n');

    const result = parseINGCsv(csv);

    expect(result).toHaveLength(3);
    expect(result[0].transaction_date).toBe('2024-01-15');
    expect(result[1].transaction_date).toBe('2024-01-16');
    expect(result[2].transaction_date).toBe('2024-01-17');
  });

  it('ignores empty lines', () => {
    const csv = `${header}\n\n${createValidCsvLine()}\n\n\n${createValidCsvLine({ txId: 'TRX2' })}\n`;

    const result = parseINGCsv(csv);

    expect(result).toHaveLength(2);
  });

  it('ignores lines before header', () => {
    const csv = [
      'Some metadata line',
      'Another info line',
      '',
      header,
      createValidCsvLine(),
    ].join('\n');

    const result = parseINGCsv(csv);

    expect(result).toHaveLength(1);
  });

  it('returns empty array when no header found', () => {
    const csv = [
      createValidCsvLine(),
      createValidCsvLine({ txId: 'TRX2' }),
    ].join('\n');

    const result = parseINGCsv(csv);

    expect(result).toHaveLength(0);
  });

  it('correctly identifies income vs expense', () => {
    const csv = [
      header,
      createValidCsvLine({ amount: '-100,00' }),
      createValidCsvLine({ txId: 'TRX2', amount: '500,00' }),
    ].join('\n');

    const result = parseINGCsv(csv);

    expect(result[0].is_income).toBe(false);
    expect(result[0].amount).toBe(100);
    expect(result[1].is_income).toBe(true);
    expect(result[1].amount).toBe(500);
  });

  it('handles Polish decimal format (comma as separator)', () => {
    const csv = `${header}\n${createValidCsvLine({ amount: '-1234,56' })}`;

    const result = parseINGCsv(csv);

    expect(result[0].amount).toBe(1234.56);
  });

  it('handles amounts with spaces (thousand separators)', () => {
    const csv = `${header}\n${createValidCsvLine({ amount: '-1 234,56' })}`;

    const result = parseINGCsv(csv);

    expect(result[0].amount).toBe(1234.56);
  });

  it('uses column 10/11 for amount when column 8/9 is empty (pending transactions)', () => {
    const csv = `${header}\n${createValidCsvLine({ amount: '', currency: '', col10: '-50,00', col11: 'EUR' })}`;

    const result = parseINGCsv(csv);

    expect(result).toHaveLength(1);
    expect(result[0].amount).toBe(50);
    expect(result[0].currency).toBe('EUR');
  });

  it('skips lines with invalid date format', () => {
    const csv = [
      header,
      createValidCsvLine({ date: '15-01-2024' }), // wrong format
      createValidCsvLine({ date: '2024-01-15' }), // valid
    ].join('\n');

    const result = parseINGCsv(csv);

    expect(result).toHaveLength(1);
    expect(result[0].transaction_date).toBe('2024-01-15');
  });

  it('skips lines with less than 17 columns', () => {
    const csv = [
      header,
      '2024-01-15;2024-01-15;Shop;Desc;1234;Bank', // only 6 columns
      createValidCsvLine(),
    ].join('\n');

    const result = parseINGCsv(csv);

    expect(result).toHaveLength(1);
  });

  it('handles null/empty booking date', () => {
    const csv = `${header}\n${createValidCsvLine({ bookingDate: '' })}`;

    const result = parseINGCsv(csv);

    expect(result[0].booking_date).toBeNull();
  });

  it('handles invalid booking date format by setting to null', () => {
    const csv = `${header}\n${createValidCsvLine({ bookingDate: '15/01/2024' })}`;

    const result = parseINGCsv(csv);

    expect(result[0].booking_date).toBeNull();
  });

  it('handles empty counterparty and description', () => {
    const csv = `${header}\n${createValidCsvLine({ counterparty: '', description: '' })}`;

    const result = parseINGCsv(csv);

    expect(result[0].counterparty_name).toBe('');
    expect(result[0].description).toBe('');
  });

  it('strips quotes from fields', () => {
    const line = '"2024-01-15";"2024-01-15";"Test Shop";"Description";"123";"Bank";"details";"TRX123";"-100,00";"PLN";"";"";"";"";"";"Konto";"5000";"PLN"';
    // Need at least 17 columns for this test
    const fullLine = '"2024-01-15";"2024-01-15";"Test Shop";"Description";"123";"Bank";"details";"TRX123";"-100,00";"PLN";"";"";"";"";"Konto";"5000";"PLN"';
    const csv = `${header}\n${fullLine}`;

    const result = parseINGCsv(csv);

    expect(result).toHaveLength(1);
    expect(result[0].transaction_date).toBe('2024-01-15');
    expect(result[0].counterparty_name).toBe('Test Shop');
  });

  it('removes apostrophes from account number and transaction_id', () => {
    const csv = `${header}\n${createValidCsvLine({ account: "'12345678901234567890123456'", txId: "'TRX123'" })}`;

    const result = parseINGCsv(csv);

    expect(result[0].account_number).toBe('12345678901234567890123456');
    expect(result[0].transaction_id).toBe('TRX123');
  });

  it('defaults currency to PLN when empty', () => {
    const csv = `${header}\n${createValidCsvLine({ currency: '' })}`;

    const result = parseINGCsv(csv);

    expect(result[0].currency).toBe('PLN');
  });

  it('defaults account_name to Unknown when empty', () => {
    const csv = `${header}\n${createValidCsvLine({ accountName: '' })}`;

    const result = parseINGCsv(csv);

    expect(result[0].account_name).toBe('Unknown');
  });

  it('skips lines with invalid amount', () => {
    const csv = [
      header,
      createValidCsvLine({ amount: 'invalid' }),
      createValidCsvLine({ txId: 'TRX2', amount: '-100,00' }),
    ].join('\n');

    const result = parseINGCsv(csv);

    expect(result).toHaveLength(1);
    expect(result[0].transaction_id).toBe('TRX2');
  });
});
