-- Add description column to transactions
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS description TEXT;

-- Migrate existing data: use display_name or raw_description as initial value
UPDATE transactions
SET description = COALESCE(display_name, raw_description)
WHERE description IS NULL;
