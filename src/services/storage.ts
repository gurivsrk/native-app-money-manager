import AsyncStorage from '@react-native-async-storage/async-storage';
import { Account, Category, Transaction, Currency } from '../types';
import { INITIAL_ACCOUNTS, INITIAL_CATEGORIES, DEFAULT_CURRENCIES } from '../constants/initialData';

const KEYS = {
  ACCOUNTS: '@app_accounts_v1',
  CATEGORIES: '@app_categories_v1',
  TRANSACTIONS: '@app_transactions_v1',
  CURRENCIES: '@app_currencies_v1',
  ACTIVE_CURRENCY: '@app_active_currency_v1',
};

export const StorageService = {
  // Load Currencies
  async getCurrencies(): Promise<Currency[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.CURRENCIES);
      if (data) return JSON.parse(data);
      await AsyncStorage.setItem(KEYS.CURRENCIES, JSON.stringify(DEFAULT_CURRENCIES));
      return DEFAULT_CURRENCIES;
    } catch {
      return DEFAULT_CURRENCIES;
    }
  },

  async saveCurrencies(currencies: Currency[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.CURRENCIES, JSON.stringify(currencies));
  },

  // Active Currency code
  async getActiveCurrencyCode(): Promise<string> {
    try {
      const data = await AsyncStorage.getItem(KEYS.ACTIVE_CURRENCY);
      if (data) return data;
      return 'USD';
    } catch {
      return 'USD';
    }
  },

  async saveActiveCurrencyCode(code: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.ACTIVE_CURRENCY, code);
  },

  // Load Accounts
  async getAccounts(): Promise<Account[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.ACCOUNTS);
      if (data) return JSON.parse(data);
      // Seed initial accounts
      await AsyncStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(INITIAL_ACCOUNTS));
      return INITIAL_ACCOUNTS;
    } catch {
      return INITIAL_ACCOUNTS;
    }
  },

  async saveAccounts(accounts: Account[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(accounts));
  },

  // Load Categories
  async getCategories(): Promise<Category[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.CATEGORIES);
      if (data) return JSON.parse(data);
      // Seed initial categories
      await AsyncStorage.setItem(KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
      return INITIAL_CATEGORIES;
    } catch {
      return INITIAL_CATEGORIES;
    }
  },

  async saveCategories(categories: Category[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.CATEGORIES, JSON.stringify(categories));
  },

  // Load Transactions
  async getTransactions(): Promise<Transaction[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.TRANSACTIONS);
      if (data) return JSON.parse(data);
      return [];
    } catch {
      return [];
    }
  },

  async saveTransactions(transactions: Transaction[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(transactions));
  },
};
