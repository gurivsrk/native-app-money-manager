import React, { createContext, useContext, useEffect, useState } from 'react';
import { Account, Category, Transaction, MonthlySummary, Currency } from '../types';
import { StorageService } from '../services/storage';
import { DEFAULT_CURRENCIES } from '../constants/initialData';

interface BudgetContextType {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  currencies: Currency[];
  activeCurrency: Currency;
  isLoading: boolean;
  // Transactions
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
  updateTransaction: (id: string, updatedTx: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  // Accounts
  addAccount: (account: Omit<Account, 'id'>) => Promise<Account>;
  updateAccount: (id: string, account: Partial<Omit<Account, 'id'>>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  // Categories
  addCategory: (category: Omit<Category, 'id'>) => Promise<Category>;
  updateCategory: (id: string, category: Partial<Omit<Category, 'id'>>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  // Summary & Currency
  getMonthlySummary: (yearMonth?: string) => MonthlySummary;
  setActiveCurrencyCode: (code: string) => Promise<void>;
  updateCurrencyRate: (code: string, newRate: number) => Promise<void>;
  addCustomCurrency: (currency: Currency) => Promise<void>;
  formatAmount: (usdBaseAmount: number) => string;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

export const BudgetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>(DEFAULT_CURRENCIES);
  const [activeCurrencyCode, setActiveCode] = useState<string>('USD');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [loadedAccs, loadedCats, loadedTxs, loadedCurrs, loadedActiveCode] = await Promise.all([
        StorageService.getAccounts(),
        StorageService.getCategories(),
        StorageService.getTransactions(),
        StorageService.getCurrencies(),
        StorageService.getActiveCurrencyCode(),
      ]);
      setAccounts(loadedAccs);
      setCategories(loadedCats);
      setTransactions(loadedTxs);
      setCurrencies(loadedCurrs);
      setActiveCode(loadedActiveCode);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeCurrency: Currency =
    currencies.find((c) => c.code === activeCurrencyCode) || currencies[0] || DEFAULT_CURRENCIES[0];

  const setActiveCurrencyCode = async (code: string) => {
    setActiveCode(code);
    await StorageService.saveActiveCurrencyCode(code);
  };

  const updateCurrencyRate = async (code: string, newRate: number) => {
    const updated = currencies.map((c) => (c.code === code ? { ...c, rate: newRate } : c));
    setCurrencies(updated);
    await StorageService.saveCurrencies(updated);
  };

  const addCustomCurrency = async (curr: Currency) => {
    const updated = [...currencies.filter((c) => c.code !== curr.code), curr];
    setCurrencies(updated);
    await StorageService.saveCurrencies(updated);
  };

  const formatAmount = (baseAmount: number): string => {
    const converted = baseAmount * (activeCurrency.rate || 1.0);
    return `${activeCurrency.symbol}${converted.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Helper to apply balance delta to account list
  const applyTxToBalances = (accList: Account[], tx: Transaction, direction: 1 | -1): Account[] => {
    return accList.map((acc) => {
      let balance = acc.balance;
      const amt = tx.amount * direction;

      if (tx.type === 'income' && acc.id === tx.accountId) {
        balance += amt;
      } else if (tx.type === 'expense' && acc.id === tx.accountId) {
        balance -= amt;
      } else if (tx.type === 'transfer') {
        if (acc.id === tx.fromAccountId) {
          balance -= amt;
        } else if (acc.id === tx.toAccountId) {
          balance += amt;
        }
      }

      return { ...acc, balance };
    });
  };

  const addTransaction = async (txData: Omit<Transaction, 'id' | 'createdAt'>) => {
    // txData.amount comes in current active currency units -> convert to base USD
    const baseAmount = txData.amount / (activeCurrency.rate || 1.0);

    const newTx: Transaction = {
      ...txData,
      amount: baseAmount,
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      createdAt: Date.now(),
    };

    const updatedAccounts = applyTxToBalances(accounts, newTx, 1);
    const updatedTransactions = [newTx, ...transactions];

    setAccounts(updatedAccounts);
    setTransactions(updatedTransactions);

    await Promise.all([
      StorageService.saveAccounts(updatedAccounts),
      StorageService.saveTransactions(updatedTransactions),
    ]);
  };

  const updateTransaction = async (id: string, updatedTxData: Omit<Transaction, 'id' | 'createdAt'>) => {
    const oldTx = transactions.find((t) => t.id === id);
    if (!oldTx) return;

    // Convert new amount to base USD
    const baseAmount = updatedTxData.amount / (activeCurrency.rate || 1.0);

    const editedTx: Transaction = {
      ...updatedTxData,
      amount: baseAmount,
      id: oldTx.id,
      createdAt: oldTx.createdAt,
    };

    // Revert old transaction effect, then apply new transaction effect
    let updatedAccounts = applyTxToBalances(accounts, oldTx, -1);
    updatedAccounts = applyTxToBalances(updatedAccounts, editedTx, 1);

    const updatedTransactions = transactions.map((t) => (t.id === id ? editedTx : t));

    setAccounts(updatedAccounts);
    setTransactions(updatedTransactions);

    await Promise.all([
      StorageService.saveAccounts(updatedAccounts),
      StorageService.saveTransactions(updatedTransactions),
    ]);
  };

  const deleteTransaction = async (id: string) => {
    const targetTx = transactions.find((t) => t.id === id);
    if (!targetTx) return;

    // Revert effect on account balances
    const updatedAccounts = applyTxToBalances(accounts, targetTx, -1);
    const updatedTransactions = transactions.filter((t) => t.id !== id);

    setAccounts(updatedAccounts);
    setTransactions(updatedTransactions);

    await Promise.all([
      StorageService.saveAccounts(updatedAccounts),
      StorageService.saveTransactions(updatedTransactions),
    ]);
  };

  // Accounts CRUD
  const addAccount = async (accData: Omit<Account, 'id'>): Promise<Account> => {
    const baseBalance = accData.balance / (activeCurrency.rate || 1.0);
    const newAccount: Account = {
      ...accData,
      balance: baseBalance,
      id: 'acc_' + Date.now(),
    };
    const updatedAccounts = [...accounts, newAccount];
    setAccounts(updatedAccounts);
    await StorageService.saveAccounts(updatedAccounts);
    return newAccount;
  };

  const updateAccount = async (id: string, updatedFields: Partial<Omit<Account, 'id'>>) => {
    const updatedAccounts = accounts.map((acc) => {
      if (acc.id !== id) return acc;
      let balance = acc.balance;
      if (updatedFields.balance !== undefined) {
        balance = updatedFields.balance / (activeCurrency.rate || 1.0);
      }
      return {
        ...acc,
        ...updatedFields,
        balance,
      };
    });
    setAccounts(updatedAccounts);
    await StorageService.saveAccounts(updatedAccounts);
  };

  const deleteAccount = async (id: string) => {
    const updatedAccounts = accounts.filter((a) => a.id !== id);
    setAccounts(updatedAccounts);
    await StorageService.saveAccounts(updatedAccounts);
  };

  // Categories CRUD
  const addCategory = async (catData: Omit<Category, 'id'>): Promise<Category> => {
    const newCategory: Category = {
      ...catData,
      id: 'cat_' + Date.now(),
    };
    const updatedCategories = [...categories, newCategory];
    setCategories(updatedCategories);
    await StorageService.saveCategories(updatedCategories);
    return newCategory;
  };

  const updateCategory = async (id: string, updatedFields: Partial<Omit<Category, 'id'>>) => {
    const updatedCategories = categories.map((c) =>
      c.id === id ? { ...c, ...updatedFields } : c
    );
    setCategories(updatedCategories);
    await StorageService.saveCategories(updatedCategories);
  };

  const deleteCategory = async (id: string) => {
    const updatedCategories = categories.filter((c) => c.id !== id);
    setCategories(updatedCategories);
    await StorageService.saveCategories(updatedCategories);
  };

  const getMonthlySummary = (yearMonth?: string): MonthlySummary => {
    const currentYM = yearMonth || new Date().toISOString().substring(0, 7); // 'YYYY-MM'

    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach((tx) => {
      if (tx.date.startsWith(currentYM)) {
        if (tx.type === 'income') {
          totalIncome += tx.amount;
        } else if (tx.type === 'expense') {
          totalExpense += tx.amount;
        }
      }
    });

    const netSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

    return { totalIncome, totalExpense, netSavings, savingsRate };
  };

  return (
    <BudgetContext.Provider
      value={{
        accounts,
        categories,
        transactions,
        currencies,
        activeCurrency,
        isLoading,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addAccount,
        updateAccount,
        deleteAccount,
        addCategory,
        updateCategory,
        deleteCategory,
        getMonthlySummary,
        setActiveCurrencyCode,
        updateCurrencyRate,
        addCustomCurrency,
        formatAmount,
      }}
    >
      {children}
    </BudgetContext.Provider>
  );
};

export const useBudget = () => {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error('useBudget must be used within a BudgetProvider');
  }
  return context;
};
