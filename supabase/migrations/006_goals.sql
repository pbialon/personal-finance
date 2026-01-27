-- Migration: Create goals table for financial goals tracking
-- Run this migration in Supabase SQL Editor

CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  target_amount DECIMAL(12,2) NOT NULL,
  current_amount DECIMAL(12,2) DEFAULT 0,
  deadline DATE,
  icon VARCHAR(50),
  color VARCHAR(7) DEFAULT '#3b82f6',
  is_completed BOOLEAN DEFAULT FALSE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_goals_is_completed ON goals(is_completed);
CREATE INDEX idx_goals_deadline ON goals(deadline);

-- Add RLS policies (adjust based on your auth setup)
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- Policy to allow all operations (adjust if you have user authentication)
CREATE POLICY "Allow all operations on goals" ON goals
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_goals_updated_at
  BEFORE UPDATE ON goals
  FOR EACH ROW
  EXECUTE FUNCTION update_goals_updated_at();
