import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  getDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Account, Category, Transaction, Currency } from '../types';

export interface CloudData {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  currencies?: Currency[];
  activeCurrencyCode?: string;
}

export const FirebaseService = {
  /**
   * Test connection to Firestore
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const pingRef = doc(db, '_connection_test', 'ping');
      await setDoc(pingRef, { timestamp: new Date().toISOString() });
      return {
        success: true,
        message: 'Successfully connected to Firebase Firestore!',
      };
    } catch (error: any) {
      console.warn('Firebase connection test failed:', error);
      return {
        success: false,
        message: error?.message || 'Failed to connect to Firebase. Check your internet connection and Firestore rules.',
      };
    }
  },

  /**
   * Save a single transaction to Firestore
   */
  async saveTransaction(transaction: Transaction): Promise<void> {
    try {
      const txRef = doc(db, 'transactions', transaction.id);
      await setDoc(txRef, transaction);
    } catch (error) {
      console.warn('Failed to save transaction to Firestore:', error);
    }
  },

  /**
   * Delete a transaction from Firestore
   */
  async deleteTransaction(id: string): Promise<void> {
    try {
      const txRef = doc(db, 'transactions', id);
      await deleteDoc(txRef);
    } catch (error) {
      console.warn('Failed to delete transaction from Firestore:', error);
    }
  },

  /**
   * Save an account to Firestore
   */
  async saveAccount(account: Account): Promise<void> {
    try {
      const accRef = doc(db, 'accounts', account.id);
      await setDoc(accRef, account);
    } catch (error) {
      console.warn('Failed to save account to Firestore:', error);
    }
  },

  /**
   * Delete an account from Firestore
   */
  async deleteAccount(id: string): Promise<void> {
    try {
      const accRef = doc(db, 'accounts', id);
      await deleteDoc(accRef);
    } catch (error) {
      console.warn('Failed to delete account from Firestore:', error);
    }
  },

  /**
   * Save a category to Firestore
   */
  async saveCategory(category: Category): Promise<void> {
    try {
      const catRef = doc(db, 'categories', category.id);
      await setDoc(catRef, category);
    } catch (error) {
      console.warn('Failed to save category to Firestore:', error);
    }
  },

  /**
   * Delete a category from Firestore
   */
  async deleteCategory(id: string): Promise<void> {
    try {
      const catRef = doc(db, 'categories', id);
      await deleteDoc(catRef);
    } catch (error) {
      console.warn('Failed to delete category from Firestore:', error);
    }
  },

  /**
   * Save currency preferences to Firestore
   */
  async saveCurrencySettings(currencies: Currency[], activeCode: string): Promise<void> {
    try {
      const settingsRef = doc(db, 'settings', 'currency');
      await setDoc(settingsRef, {
        activeCode,
        currencies,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.warn('Failed to save currency settings to Firestore:', error);
    }
  },

  /**
   * Fetch all data from Firestore
   */
  async fetchCloudData(): Promise<CloudData | null> {
    try {
      // 1. Fetch accounts
      const accSnap = await getDocs(collection(db, 'accounts'));
      const accounts: Account[] = [];
      accSnap.forEach((d) => accounts.push(d.data() as Account));

      // 2. Fetch categories
      const catSnap = await getDocs(collection(db, 'categories'));
      const categories: Category[] = [];
      catSnap.forEach((d) => categories.push(d.data() as Category));

      // 3. Fetch transactions
      const txSnap = await getDocs(collection(db, 'transactions'));
      const transactions: Transaction[] = [];
      txSnap.forEach((d) => transactions.push(d.data() as Transaction));

      // 4. Fetch settings
      let currencies: Currency[] | undefined;
      let activeCurrencyCode: string | undefined;
      const settingsDoc = await getDoc(doc(db, 'settings', 'currency'));
      if (settingsDoc.exists()) {
        const sData = settingsDoc.data();
        currencies = sData.currencies;
        activeCurrencyCode = sData.activeCode;
      }

      return {
        accounts,
        categories,
        transactions,
        currencies,
        activeCurrencyCode,
      };
    } catch (error) {
      console.warn('Failed to fetch data from Firestore:', error);
      return null;
    }
  },

  /**
   * Backup / Upload all local data to Firestore in batches
   */
  async backupAllToCloud(data: {
    accounts: Account[];
    categories: Category[];
    transactions: Transaction[];
    currencies: Currency[];
    activeCurrencyCode: string;
  }): Promise<{ success: boolean; message: string }> {
    try {
      const batch = writeBatch(db);

      // Accounts
      data.accounts.forEach((acc) => {
        const ref = doc(db, 'accounts', acc.id);
        batch.set(ref, acc);
      });

      // Categories
      data.categories.forEach((cat) => {
        const ref = doc(db, 'categories', cat.id);
        batch.set(ref, cat);
      });

      // Transactions
      data.transactions.forEach((tx) => {
        const ref = doc(db, 'transactions', tx.id);
        batch.set(ref, tx);
      });

      // Settings
      const settingsRef = doc(db, 'settings', 'currency');
      batch.set(settingsRef, {
        activeCode: data.activeCurrencyCode,
        currencies: data.currencies,
        updatedAt: new Date().toISOString(),
      });

      await batch.commit();

      return {
        success: true,
        message: `Successfully uploaded ${data.transactions.length} transactions, ${data.accounts.length} accounts, and ${data.categories.length} categories to Firestore!`,
      };
    } catch (error: any) {
      console.warn('Batch backup to Firestore failed:', error);
      return {
        success: false,
        message: error?.message || 'Failed to upload data to Firestore.',
      };
    }
  },
};
