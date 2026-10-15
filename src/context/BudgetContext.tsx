import React, { createContext, useContext, useEffect, useState } from 'react';
import { Account, Category, Transaction, MonthlySummary, Currency } from '../types';
import { StorageService } from '../services/storage';
import { DEFAULT_CURRENCIES } from '../constants/initialData';
import { getCurrentYearMonthString } from '../utils/dateUtils';
import { FirebaseService } from '../services/firebaseService';

export type CloudSyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

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
  // Firebase Cloud Sync
  cloudSyncStatus: CloudSyncStatus;
  lastSyncTime: string | null;
  syncWithCloud: () => Promise<{ success: boolean; message: string }>;
  uploadToCloud: () => Promise<{ success: boolean; message: string }>;
  restoreFromCloud: () => Promise<{ success: boolean; message: string }>;
  testCloudConnection: () => Promise<{ success: boolean; message: string }>;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

export const BudgetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>(DEFAULT_CURRENCIES);
  const [activeCurrencyCode, setActiveCode] = useState<string>('USD');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Cloud Sync state
  const [cloudSyncStatus, setCloudSyncStatus] = useState<CloudSyncStatus>('offline');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      // 1. Instant local load (0ms delay for UI)
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

      // 2. Trigger asynchronous background sync with Firebase
      performAutoCloudSync(loadedAccs, loadedCats, loadedTxs, loadedCurrs, loadedActiveCode);
    } finally {
      setIsLoading(false);
    }
  };

  const performAutoCloudSync = async (
    localAccs: Account[],
    localCats: Category[],
    localTxs: Transaction[],
    localCurrs: Currency[],
    localActiveCode: string
  ) => {
    try {
      setCloudSyncStatus('syncing');
      const cloudData = await FirebaseService.fetchCloudData();

      if (!cloudData) {
        setCloudSyncStatus('offline');
        return;
      }

      const hasCloudData =
        cloudData.transactions.length > 0 ||
        cloudData.accounts.length > 0 ||
        cloudData.categories.length > 0;

      if (!hasCloudData) {
        // First-time connection to a blank Firebase project: auto-seed local data to cloud
        await FirebaseService.backupAllToCloud({
          accounts: localAccs,
          categories: localCats,
          transactions: localTxs,
          currencies: localCurrs,
          activeCurrencyCode: localActiveCode,
        });
        setCloudSyncStatus('synced');
        setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      } else {
        // Merge cloud data with local data (preferring cloud IDs)
        const mergedTxsMap = new Map<string, Transaction>();
        localTxs.forEach((t) => mergedTxsMap.set(t.id, t));
        cloudData.transactions.forEach((t) => mergedTxsMap.set(t.id, t));
        const mergedTxs = Array.from(mergedTxsMap.values()).sort((a, b) => b.date.localeCompare(a.date));

        const mergedAccsMap = new Map<string, Account>();
        localAccs.forEach((a) => mergedAccsMap.set(a.id, a));
        cloudData.accounts.forEach((a) => mergedAccsMap.set(a.id, a));
        const mergedAccs = Array.from(mergedAccsMap.values());

        const mergedCatsMap = new Map<string, Category>();
        localCats.forEach((c) => mergedCatsMap.set(c.id, c));
        cloudData.categories.forEach((c) => mergedCatsMap.set(c.id, c));
        const mergedCats = Array.from(mergedCatsMap.values());

        setTransactions(mergedTxs);
        setAccounts(mergedAccs);
        setCategories(mergedCats);

        await Promise.all([
          StorageService.saveTransactions(mergedTxs),
          StorageService.saveAccounts(mergedAccs),
          StorageService.saveCategories(mergedCats),
        ]);

        setCloudSyncStatus('synced');
        setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (err) {
      console.warn('Auto cloud sync error:', err);
      setCloudSyncStatus('offline');
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeCurrency: Currency =
    currencies.find((c) => c.code === activeCurrencyCode) || currencies[0] || DEFAULT_CURRENCIES[0];

  const setActiveCurrencyCode = async (code: string) => {
    setActiveCode(code);
    await StorageService.saveActiveCurrencyCode(code);
    FirebaseService.saveCurrencySettings(currencies, code).catch(() => {});
  };

  const updateCurrencyRate = async (code: string, newRate: number) => {
    const updated = currencies.map((c) => (c.code === code ? { ...c, rate: newRate } : c));
    setCurrencies(updated);
    await StorageService.saveCurrencies(updated);
    FirebaseService.saveCurrencySettings(updated, activeCurrencyCode).catch(() => {});
  };

  const addCustomCurrency = async (curr: Currency) => {
    const updated = [...currencies.filter((c) => c.code !== curr.code), curr];
    setCurrencies(updated);
    await StorageService.saveCurrencies(updated);
    FirebaseService.saveCurrencySettings(updated, activeCurrencyCode).catch(() => {});
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

  // Transactions CRUD with live Firebase sync
  const addTransaction = async (txData: Omit<Transaction, 'id' | 'createdAt'>) => {
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

    // Live sync to Firebase in background
    FirebaseService.saveTransaction(newTx).catch(console.warn);
    // Also sync affected accounts
    updatedAccounts.forEach((acc) => {
      if (
        acc.id === newTx.accountId ||
        acc.id === newTx.fromAccountId ||
        acc.id === newTx.toAccountId
      ) {
        FirebaseService.saveAccount(acc).catch(console.warn);
      }
    });
    setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  };

  const updateTransaction = async (id: string, updatedTxData: Omit<Transaction, 'id' | 'createdAt'>) => {
    const oldTx = transactions.find((t) => t.id === id);
    if (!oldTx) return;

    const baseAmount = updatedTxData.amount / (activeCurrency.rate || 1.0);

    const editedTx: Transaction = {
      ...updatedTxData,
      amount: baseAmount,
      id: oldTx.id,
      createdAt: oldTx.createdAt,
    };

    let updatedAccounts = applyTxToBalances(accounts, oldTx, -1);
    updatedAccounts = applyTxToBalances(updatedAccounts, editedTx, 1);

    const updatedTransactions = transactions.map((t) => (t.id === id ? editedTx : t));

    setAccounts(updatedAccounts);
    setTransactions(updatedTransactions);

    await Promise.all([
      StorageService.saveAccounts(updatedAccounts),
      StorageService.saveTransactions(updatedTransactions),
    ]);

    // Live sync to Firebase in background
    FirebaseService.saveTransaction(editedTx).catch(console.warn);
    updatedAccounts.forEach((acc) => {
      FirebaseService.saveAccount(acc).catch(console.warn);
    });
    setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  };

  const deleteTransaction = async (id: string) => {
    const targetTx = transactions.find((t) => t.id === id);
    if (!targetTx) return;

    const updatedAccounts = applyTxToBalances(accounts, targetTx, -1);
    const updatedTransactions = transactions.filter((t) => t.id !== id);

    setAccounts(updatedAccounts);
    setTransactions(updatedTransactions);

    await Promise.all([
      StorageService.saveAccounts(updatedAccounts),
      StorageService.saveTransactions(updatedTransactions),
    ]);

    // Live sync delete to Firebase in background
    FirebaseService.deleteTransaction(id).catch(console.warn);
    updatedAccounts.forEach((acc) => {
      FirebaseService.saveAccount(acc).catch(console.warn);
    });
    setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  };

  // Accounts CRUD with live Firebase sync
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

    FirebaseService.saveAccount(newAccount).catch(console.warn);
    setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
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

    const changedAcc = updatedAccounts.find((a) => a.id === id);
    if (changedAcc) {
      FirebaseService.saveAccount(changedAcc).catch(console.warn);
    }
    setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  };

  const deleteAccount = async (id: string) => {
    const updatedAccounts = accounts.filter((a) => a.id !== id);
    setAccounts(updatedAccounts);
    await StorageService.saveAccounts(updatedAccounts);

    FirebaseService.deleteAccount(id).catch(console.warn);
    setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  };

  // Categories CRUD with live Firebase sync
  const addCategory = async (catData: Omit<Category, 'id'>): Promise<Category> => {
    const newCategory: Category = {
      ...catData,
      id: 'cat_' + Date.now(),
    };
    const updatedCategories = [...categories, newCategory];
    setCategories(updatedCategories);
    await StorageService.saveCategories(updatedCategories);

    FirebaseService.saveCategory(newCategory).catch(console.warn);
    setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    return newCategory;
  };

  const updateCategory = async (id: string, updatedFields: Partial<Omit<Category, 'id'>>) => {
    const updatedCategories = categories.map((c) =>
      c.id === id ? { ...c, ...updatedFields } : c
    );
    setCategories(updatedCategories);
    await StorageService.saveCategories(updatedCategories);

    const changedCat = updatedCategories.find((c) => c.id === id);
    if (changedCat) {
      FirebaseService.saveCategory(changedCat).catch(console.warn);
    }
    setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  };

  const deleteCategory = async (id: string) => {
    const updatedCategories = categories.filter((c) => c.id !== id);
    setCategories(updatedCategories);
    await StorageService.saveCategories(updatedCategories);

    FirebaseService.deleteCategory(id).catch(console.warn);
    setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  };

  const getMonthlySummary = (yearMonth?: string): MonthlySummary => {
    const currentYM = yearMonth || getCurrentYearMonthString();

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

    return {
      totalIncome,
      totalExpense,
      netSavings,
      savingsRate,
    };
  };

  // Explicit Cloud Sync operations
  const syncWithCloud = async (): Promise<{ success: boolean; message: string }> => {
    try {
      setCloudSyncStatus('syncing');
      await performAutoCloudSync(accounts, categories, transactions, currencies, activeCurrencyCode);
      return {
        success: true,
        message: 'Successfully synchronized with Firebase Firestore cloud!',
      };
    } catch (err: any) {
      setCloudSyncStatus('error');
      return {
        success: false,
        message: err?.message || 'Sync failed. Please check internet and Firestore rules.',
      };
    }
  };

  const uploadToCloud = async (): Promise<{ success: boolean; message: string }> => {
    try {
      setCloudSyncStatus('syncing');
      const res = await FirebaseService.backupAllToCloud({
        accounts,
        categories,
        transactions,
        currencies,
        activeCurrencyCode,
      });
      if (res.success) {
        setCloudSyncStatus('synced');
        setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      } else {
        setCloudSyncStatus('error');
      }
      return res;
    } catch (err: any) {
      setCloudSyncStatus('error');
      return {
        success: false,
        message: err?.message || 'Failed to upload to cloud.',
      };
    }
  };

  const restoreFromCloud = async (): Promise<{ success: boolean; message: string }> => {
    try {
      setCloudSyncStatus('syncing');
      const cloudData = await FirebaseService.fetchCloudData();
      if (!cloudData) {
        setCloudSyncStatus('offline');
        return {
          success: false,
          message: 'Unable to reach Firebase Firestore. Please check your connection.',
        };
      }

      setAccounts(cloudData.accounts);
      setCategories(cloudData.categories);
      setTransactions(cloudData.transactions);
      if (cloudData.currencies && cloudData.currencies.length > 0) {
        setCurrencies(cloudData.currencies);
      }
      if (cloudData.activeCurrencyCode) {
        setActiveCode(cloudData.activeCurrencyCode);
      }

      await Promise.all([
        StorageService.saveAccounts(cloudData.accounts),
        StorageService.saveCategories(cloudData.categories),
        StorageService.saveTransactions(cloudData.transactions),
      ]);

      setCloudSyncStatus('synced');
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      return {
        success: true,
        message: `Restored ${cloudData.transactions.length} transactions, ${cloudData.accounts.length} accounts, and ${cloudData.categories.length} categories from Firestore.`,
      };
    } catch (err: any) {
      setCloudSyncStatus('error');
      return {
        success: false,
        message: err?.message || 'Failed to restore from cloud.',
      };
    }
  };

  const testCloudConnection = async (): Promise<{ success: boolean; message: string }> => {
    const res = await FirebaseService.testConnection();
    if (res.success) {
      setCloudSyncStatus('synced');
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } else {
      setCloudSyncStatus('error');
    }
    return res;
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
        cloudSyncStatus,
        lastSyncTime,
        syncWithCloud,
        uploadToCloud,
        restoreFromCloud,
        testCloudConnection,
      }}
    >
      {children}
    </BudgetContext.Provider>
  );
};

export const useBudget = (): BudgetContextType => {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error('useBudget must be used within a BudgetProvider');
  }
  return context;
};
