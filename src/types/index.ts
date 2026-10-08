export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Currency {
  code: string;       // e.g. 'USD', 'EUR', 'INR', 'GBP', 'JPY'
  symbol: string;     // e.g. '$', '€', '₹', '£', '¥'
  name: string;       // e.g. 'US Dollar'
  rate: number;       // exchange rate relative to base USD (1.0)
}

export interface Account {
  id: string;
  name: string;
  type: 'bank' | 'cash' | 'savings' | 'credit' | 'investment';
  balance: number;
  icon: string;
  color: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string; // ISO date string YYYY-MM-DD
  note?: string;
  // For Income & Expense:
  accountId?: string;
  categoryId?: string;
  // For Transfer:
  fromAccountId?: string;
  toAccountId?: string;
  createdAt: number;
}

export interface MonthlySummary {
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  savingsRate: number;
}
