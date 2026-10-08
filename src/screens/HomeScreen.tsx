import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBudget } from '../context/BudgetContext';
import { TransactionCard } from '../components/TransactionCard';
import { AddTransactionModal } from '../components/AddTransactionModal';
import { Transaction, TransactionType } from '../types';
import { MonthCalendarBar } from '../components/MonthCalendarBar';
import { CalendarMonthPickerModal } from '../components/CalendarMonthPickerModal';

export const HomeScreen: React.FC = () => {
  const {
    accounts,
    categories,
    transactions,
    getMonthlySummary,
    deleteTransaction,
    formatAmount,
    activeCurrency,
  } = useBudget();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<TransactionType>('expense');

  // Month Calendar selector state ('YYYY-MM')
  const [selectedYM, setSelectedYM] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [pickerModalVisible, setPickerModalVisible] = useState(false);

  const summary = getMonthlySummary(selectedYM);
  const totalBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);

  // Transactions belonging to the currently selected month
  const monthlyTransactions = transactions.filter((t) => t.date.startsWith(selectedYM));

  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const openAddModal = (type: TransactionType) => {
    setEditingTx(null);
    setModalType(type);
    setModalVisible(true);
  };

  const handleEditTx = (tx: Transaction) => {
    setEditingTx(tx);
    setModalType(tx.type);
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greetingText}>Monthly Budget</Text>
          <Text style={styles.appName}>Money Manager</Text>
        </View>
        <TouchableOpacity
          style={styles.headerAddBtn}
          onPress={() => openAddModal('expense')}
        >
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Interactive Month Navigator Bar */}
        <MonthCalendarBar
          selectedYearMonth={selectedYM}
          onChangeYearMonth={setSelectedYM}
          onOpenPicker={() => setPickerModalVisible(true)}
        />

        {/* Main Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Net Worth ({activeCurrency.code})</Text>
          <Text style={styles.balanceAmount}>{formatAmount(totalBalance)}</Text>

          <View style={styles.summaryRow}>
            {/* Income */}
            <View style={styles.summaryItem}>
              <View style={[styles.arrowCircle, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                <Ionicons name="arrow-up" size={16} color="#10B981" />
              </View>
              <View>
                <Text style={styles.summaryItemLabel}>Income</Text>
                <Text style={[styles.summaryItemValue, { color: '#10B981' }]}>
                  +{formatAmount(summary.totalIncome)}
                </Text>
              </View>
            </View>

            {/* Expense */}
            <View style={styles.summaryItem}>
              <View style={[styles.arrowCircle, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
                <Ionicons name="arrow-down" size={16} color="#EF4444" />
              </View>
              <View>
                <Text style={styles.summaryItemLabel}>Expense</Text>
                <Text style={[styles.summaryItemValue, { color: '#EF4444' }]}>
                  -{formatAmount(summary.totalExpense)}
                </Text>
              </View>
            </View>
          </View>

          {/* Savings Metric */}
          <View style={styles.savingsBanner}>
            <Text style={styles.savingsBannerText}>
              Savings this month: <Text style={{ fontWeight: '800' }}>{formatAmount(summary.netSavings)}</Text>
            </Text>
            <View style={styles.savingsBadge}>
              <Text style={styles.savingsBadgeText}>{summary.savingsRate}% Saved</Text>
            </View>
          </View>
        </View>

        {/* Quick Action Buttons */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#ECFDF5' }]}
            onPress={() => openAddModal('income')}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#10B981' }]}>
              <Ionicons name="arrow-up-circle" size={20} color="#FFF" />
            </View>
            <Text style={[styles.actionBtnText, { color: '#065F46' }]}>+ Income</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#FEF2F2' }]}
            onPress={() => openAddModal('expense')}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#EF4444' }]}>
              <Ionicons name="arrow-down-circle" size={20} color="#FFF" />
            </View>
            <Text style={[styles.actionBtnText, { color: '#991B1B' }]}>- Expense</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#EFF6FF' }]}
            onPress={() => openAddModal('transfer')}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#3B82F6' }]}>
              <Ionicons name="swap-horizontal" size={20} color="#FFF" />
            </View>
            <Text style={[styles.actionBtnText, { color: '#1E40AF' }]}>Transfer</Text>
          </TouchableOpacity>
        </View>

        {/* Accounts Horizontal List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Accounts & Wallets</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.accountsScroll}>
          {accounts.map((acc) => (
            <View key={acc.id} style={styles.accountCard}>
              <View style={[styles.accountIcon, { backgroundColor: acc.color }]}>
                <Ionicons name={(acc.icon as any) || 'wallet-outline'} size={18} color="#FFF" />
              </View>
              <Text style={styles.accountName} numberOfLines={1}>
                {acc.name}
              </Text>
              <Text style={styles.accountBalance}>
                {formatAmount(acc.balance)}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* Activities for the selected month */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Activities ({selectedYM})</Text>
          <Text style={styles.sectionCount}>{monthlyTransactions.length} entries</Text>
        </View>

        {monthlyTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No records in {selectedYM}</Text>
            <Text style={styles.emptySubtitle}>
              {'Tap "+ Income", "- Expense", or "Transfer" above to add records for this month!'}
            </Text>
          </View>
        ) : (
          monthlyTransactions.map((tx) => (
            <TransactionCard
              key={tx.id}
              transaction={tx}
              accounts={accounts}
              categories={categories}
              onEdit={handleEditTx}
              onDelete={deleteTransaction}
            />
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add / Edit Transaction Modal */}
      <AddTransactionModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditingTx(null);
        }}
        initialType={modalType}
        editingTransaction={editingTx}
      />

      {/* Month Calendar Picker Modal */}
      <CalendarMonthPickerModal
        visible={pickerModalVisible}
        currentYearMonth={selectedYM}
        onSelect={setSelectedYM}
        onClose={() => setPickerModalVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#0F172A',
  },
  greetingText: {
    fontSize: 13,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
  },
  appName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerAddBtn: {
    backgroundColor: '#3B82F6',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  scrollContent: {
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 24,
    minHeight: '100%',
  },
  balanceCard: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: 20,
  },
  balanceLabel: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  balanceAmount: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
    marginVertical: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    marginBottom: 14,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryItemLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  summaryItemValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  savingsBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  savingsBannerText: {
    color: '#E2E8F0',
    fontSize: 13,
  },
  savingsBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  savingsBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
  },
  actionIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionCount: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  accountsScroll: {
    flexDirection: 'row',
    marginBottom: 24,
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  accountCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginRight: 12,
    width: 140,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  accountIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  accountName: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 4,
  },
  accountBalance: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
});
