import { Account, Category, Currency } from '../types';

export const DEFAULT_CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1.0 },
  { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92 },
  { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.79 },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', rate: 86.5 },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', rate: 1.38 },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rate: 1.55 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rate: 152.0 },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham', rate: 3.67 },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', rate: 1.34 },
];

export const INITIAL_ACCOUNTS: Account[] = [
  { id: 'acc_cash', name: 'Cash In Hand', type: 'cash', balance: 500, icon: 'cash-outline', color: '#10B981' },
  { id: 'acc_main', name: 'Main Checking Bank', type: 'bank', balance: 3500, icon: 'business-outline', color: '#3B82F6' },
  { id: 'acc_savings', name: 'Emergency Savings', type: 'savings', balance: 12000, icon: 'shield-checkmark-outline', color: '#8B5CF6' },
  { id: 'acc_card', name: 'Credit Card', type: 'credit', balance: -450, icon: 'card-outline', color: '#EC4899' },
];

export const INITIAL_CATEGORIES: Category[] = [
  // Income categories
  { id: 'inc_salary', name: 'Salary / Wages', type: 'income', icon: 'wallet-outline', color: '#10B981' },
  { id: 'inc_freelance', name: 'Freelance / Side Gig', type: 'income', icon: 'laptop-outline', color: '#06B6D4' },
  { id: 'inc_investment', name: 'Dividends & Interest', type: 'income', icon: 'trending-up-outline', color: '#6366F1' },
  { id: 'inc_gift', name: 'Gifts & Bonus', type: 'income', icon: 'gift-outline', color: '#F59E0B' },
  { id: 'inc_other', name: 'Other Income', type: 'income', icon: 'add-circle-outline', color: '#64748B' },

  // Expense categories
  { id: 'exp_housing', name: 'Rent & Housing', type: 'expense', icon: 'home-outline', color: '#EF4444' },
  { id: 'exp_food', name: 'Food & Groceries', type: 'expense', icon: 'restaurant-outline', color: '#F97316' },
  { id: 'exp_transport', name: 'Transport & Fuel', type: 'expense', icon: 'car-outline', color: '#EAB308' },
  { id: 'exp_bills', name: 'Utilities & Bills', type: 'expense', icon: 'receipt-outline', color: '#0EA5E9' },
  { id: 'exp_entertainment', name: 'Entertainment & Fun', type: 'expense', icon: 'film-outline', color: '#A855F7' },
  { id: 'exp_health', name: 'Health & Medical', type: 'expense', icon: 'fitness-outline', color: '#EC4899' },
  { id: 'exp_shopping', name: 'Shopping', type: 'expense', icon: 'cart-outline', color: '#14B8A6' },
  { id: 'exp_other', name: 'Other Expense', type: 'expense', icon: 'ellipsis-horizontal-circle-outline', color: '#64748B' },
];
