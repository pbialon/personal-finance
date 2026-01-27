export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  ai_prompt: string | null;
  is_savings: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  external_id: string | null;
  bank_account_id: string | null;
  raw_description: string | null;
  amount: number;
  currency: string;
  transaction_date: string;
  booking_date: string | null;
  display_name: string | null;
  counterparty_account: string | null;
  counterparty_name: string | null;
  category_id: string | null;
  category_source: 'ai' | 'user' | 'rule' | null;
  is_manual: boolean;
  is_ignored: boolean;
  is_income: boolean;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface CategorizationRule {
  id: string;
  counterparty_account: string;
  category_id: string;
  created_at: string;
}

export interface Budget {
  id: string;
  category_id: string | null;
  month: string;
  planned_amount: number;
  is_income: boolean;
  created_at: string;
  category?: Category;
}

export interface BankConnection {
  id: string;
  provider: string;
  session_id: string | null;
  account_id: string | null;
  aspsp_name: string | null;
  consent_valid_until: string | null;
  last_sync_at: string | null;
  status: string;
  created_at: string;
}

export interface AiCategorizationLog {
  id: string;
  transaction_id: string | null;
  prompt: string | null;
  response: string | null;
  category_id: string | null;
  confidence: number | null;
  created_at: string;
}

export interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  isIncome?: boolean;
  isIgnored?: boolean;
  search?: string;
}

export interface MonthlyStats {
  income: number;
  expenses: number;
  savings: number;
  incomeChange: number;
  expensesChange: number;
  savingsChange: number;
}

export interface CategorySpending {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  amount: number;
  percentage: number;
}

export interface MonthlyTrend {
  month: string;
  income: number;
  expenses: number;
  savings: number;
}

export interface BudgetProgress {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  planned: number;
  actual: number;
  percentage: number;
}
