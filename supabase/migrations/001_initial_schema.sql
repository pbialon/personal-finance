-- Personal Finance App - Initial Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Kategorie definiowane przez użytkownika
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7) NOT NULL, -- hex color
  icon VARCHAR(50),
  ai_prompt TEXT, -- dodatkowy kontekst dla AI
  is_savings BOOLEAN DEFAULT FALSE, -- czy to oszczędności
  created_at TIMESTAMP DEFAULT NOW()
);

-- Transakcje
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id VARCHAR(255) UNIQUE, -- ID z banku (deduplikacja)
  bank_account_id VARCHAR(100),

  -- Dane oryginalne
  raw_description TEXT,
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'PLN',
  transaction_date DATE NOT NULL,
  booking_date DATE,

  -- Dane przetworzone
  display_name VARCHAR(255), -- human-readable nazwa (AI generated)
  counterparty_account VARCHAR(50), -- numer konta docelowego
  counterparty_name VARCHAR(255),

  -- Kategoryzacja
  category_id UUID REFERENCES categories(id),
  category_source VARCHAR(20), -- 'ai', 'user', 'rule'

  -- Flagi
  is_manual BOOLEAN DEFAULT FALSE, -- transakcja gotówkowa
  is_ignored BOOLEAN DEFAULT FALSE, -- nieistotna
  is_income BOOLEAN DEFAULT FALSE,

  -- Meta
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Reguły kategoryzacji (na podstawie konta docelowego)
CREATE TABLE categorization_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  counterparty_account VARCHAR(50) UNIQUE,
  category_id UUID REFERENCES categories(id) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Budżety
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id),
  month DATE NOT NULL, -- pierwszy dzień miesiąca
  planned_amount DECIMAL(12,2) NOT NULL,
  is_income BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(category_id, month, is_income)
);

-- Konfiguracja synchronizacji banku
CREATE TABLE bank_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(50) DEFAULT 'enable_banking',
  session_id VARCHAR(255), -- Enable Banking session
  account_id VARCHAR(255),
  aspsp_name VARCHAR(100), -- nazwa banku (np. ING)
  consent_valid_until TIMESTAMP, -- PSD2 consent expiry (max 90 dni)
  last_sync_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Historia promptów AI (do audytu/debug)
CREATE TABLE ai_categorization_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES transactions(id),
  prompt TEXT,
  response TEXT,
  category_id UUID,
  confidence DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indeksy
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_category ON transactions(category_id);
CREATE INDEX idx_transactions_counterparty ON transactions(counterparty_account);
CREATE INDEX idx_budgets_month ON budgets(month);

-- Trigger do aktualizacji updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Domyślne kategorie
INSERT INTO categories (name, color, icon, ai_prompt, is_savings) VALUES
  ('Jedzenie', '#22c55e', 'utensils', 'Zakupy spożywcze, restauracje, jedzenie na wynos, dostawy jedzenia', false),
  ('Transport', '#3b82f6', 'car', 'Paliwo, przejazdy, bilety komunikacji miejskiej, Uber, Bolt, taxi', false),
  ('Mieszkanie', '#f59e0b', 'home', 'Czynsz, rachunki za prąd, gaz, wodę, internet, opłaty administracyjne', false),
  ('Rozrywka', '#ec4899', 'gamepad-2', 'Kino, koncerty, gry, streaming, subskrypcje rozrywkowe', false),
  ('Zdrowie', '#ef4444', 'heart-pulse', 'Leki, wizyty lekarskie, ubezpieczenia zdrowotne, siłownia', false),
  ('Zakupy', '#8b5cf6', 'shopping-bag', 'Ubrania, elektronika, AGD, zakupy online', false),
  ('Subskrypcje', '#06b6d4', 'repeat', 'Netflix, Spotify, Adobe, cykliczne płatności', false),
  ('Oszczędności', '#10b981', 'piggy-bank', 'Przelewy na konta oszczędnościowe, lokaty, inwestycje', true),
  ('Przychód', '#22d3ee', 'banknote', 'Wynagrodzenie, premie, przychody dodatkowe', false),
  ('Inne', '#6b7280', 'circle-help', 'Transakcje nieprzypisane do żadnej kategorii', false);
