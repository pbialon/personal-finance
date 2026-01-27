-- Wyczyść stare kategorie (baza jest świeża, brak transakcji)
TRUNCATE TABLE categories CASCADE;

-- Wstaw nowe kategorie
INSERT INTO categories (name, color, icon, ai_prompt, is_savings) VALUES
  ('Zakupy spożywcze', '#22c55e', 'shopping-cart', 'Zakupy w sklepach spożywczych: Biedronka, Lidl, Żabka, Auchan, Carrefour, Kaufland, sklepy osiedlowe', false),
  ('Restauracje', '#84cc16', 'utensils', 'Restauracje, kawiarnie, jedzenie na wynos, dostawy jedzenia (Glovo, Pyszne.pl, Wolt, Uber Eats), bary', false),
  ('Transport', '#3b82f6', 'car', 'Paliwo, przejazdy, bilety komunikacji miejskiej, Uber, Bolt, taxi, parkowanie, serwis auta', false),
  ('Mieszkanie', '#f59e0b', 'home', 'Czynsz, rachunki za prąd, gaz, wodę, internet, opłaty administracyjne, ubezpieczenie mieszkania', false),
  ('Rozrywka', '#ec4899', 'gamepad-2', 'Kino, koncerty, gry, streaming, hobby, wyjścia ze znajomymi, imprezy', false),
  ('Zdrowie', '#ef4444', 'heart-pulse', 'Leki, wizyty lekarskie, ubezpieczenia zdrowotne, siłownia, suplementy, badania', false),
  ('Uroda', '#e879f9', 'flower-2', 'Kosmetyki, fryzjer, manicure, salon piękności, perfumy, pielęgnacja, spa, zabiegi kosmetyczne', false),
  ('Zakupy', '#8b5cf6', 'shopping-bag', 'Ubrania, elektronika, AGD, zakupy online, wyposażenie domu, meble', false),
  ('Subskrypcje', '#06b6d4', 'repeat', 'Netflix, Spotify, Adobe, YouTube Premium, cykliczne płatności, abonamenty', false),
  ('Edukacja', '#a855f7', 'book-open', 'Kursy, książki, szkolenia, konferencje, Udemy, Coursera', false),
  ('Podróże', '#0ea5e9', 'plane', 'Hotele, loty, wynajem auta, wakacje, Airbnb, booking', false),
  ('Prezenty', '#f472b6', 'gift', 'Prezenty dla innych, darowizny, charity, wsparcie bliskich', false),
  ('Oszczędności', '#10b981', 'piggy-bank', 'Przelewy na konta oszczędnościowe, lokaty, inwestycje, fundusze', true),
  ('Przychód', '#22d3ee', 'banknote', 'Wynagrodzenie, premie, przychody dodatkowe, zwroty, cashback', false),
  ('Inne', '#6b7280', 'circle-help', 'Transakcje nieprzypisane do żadnej kategorii', false);
