export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  ai_prompt: string | null;
  is_savings: boolean;
  created_at: string;
}

export interface Merchant {
  id: string;
  name: string;
  display_name: string;
  icon_url: string | null;
  category_id: string | null;
  website: string | null;
  created_at: string;
  updated_at: string;
  category?: Category;
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
  description: string | null;
  counterparty_account: string | null;
  counterparty_name: string | null;
  category_id: string | null;
  category_source: 'ai' | 'user' | 'rule' | null;
  merchant_id: string | null;
  is_manual: boolean;
  is_ignored: boolean;
  is_income: boolean;
  created_at: string;
  updated_at: string;
  category?: Category;
  merchant?: Merchant;
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
  savingsIn: number;      // wpłaty na oszczędności (odkładam)
  savingsOut: number;     // wypłaty z oszczędności (odbieram)
  netSavings: number;     // bilans netto (savingsIn - savingsOut)
  incomeChange: number;
  expensesChange: number;
  savingsInChange: number;
  savingsOutChange: number;
  netSavingsChange: number;
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
  savingsIn: number;
  savingsOut: number;
  netSavings: number;
}

export interface BudgetProgress {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  planned: number;
  actual: number;
  percentage: number;
}

// Analytics types
export type TimePeriod = 'month' | 'quarter' | 'half-year' | 'year' | 'custom';

export interface TimePeriodRange {
  startDate: string;
  endDate: string;
  compareStartDate?: string;
  compareEndDate?: string;
}

export interface FinancialHealthScore {
  score: number;
  components: {
    savingsRate: { value: number; score: number; target: number };
    expenseRatio: { value: number; score: number; target: number };
    budgetAdherence: { value: number; score: number; target: number };
    incomeStability: { value: number; score: number };
  };
}

export interface SpendingPatterns {
  byDayOfWeek: { day: string; amount: number; count: number }[];
  byDayOfMonth: { day: number; amount: number }[];
  categoryHeatmap: {
    category: string;
    color: string;
    icon: string | null;
    days: number[];
  }[];
  totalAmount: number;
  averageDaily: number;
  daysWithSpending: number;
}

export interface CategoryAnalysis {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  totalAmount: number;
  averageAmount: number;
  maxMonth: { month: string; amount: number };
  minMonth: { month: string; amount: number };
  percentOfTotal: number;
  monthlyTrend: { month: string; amount: number; prevYearAmount?: number }[];
  topMerchants: { name: string; amount: number; count: number }[];
}

export interface TopSpenders {
  topMerchants: {
    name: string;
    amount: number;
    count: number;
    categoryName?: string;
    categoryColor?: string;
  }[];
  topTransactions: {
    id: string;
    description: string;
    amount: number;
    date: string;
    categoryName?: string;
    categoryColor?: string;
  }[];
  recurringVsOneTime: {
    recurring: number;
    oneTime: number;
  };
}

export interface YearOverview {
  totalIncome: number;
  totalExpenses: number;
  totalSavings: number;
  netChange: number;
  monthlyData: {
    month: string;
    income: number;
    expenses: number;
    savings: number;
    savingsRate: number;
  }[];
  yearComparison?: {
    prevYearIncome: number;
    prevYearExpenses: number;
    prevYearSavings: number;
    incomeChange: number;
    expensesChange: number;
    savingsChange: number;
  };
  categoryYoY: {
    categoryName: string;
    categoryColor: string;
    categoryIcon: string | null;
    currentYear: number;
    prevYear: number;
    change: number;
  }[];
}
