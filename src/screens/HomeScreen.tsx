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
import { getCurrentYearMonthString, formatYearMonth } from '../utils/dateUtils';
import { theme } from '../constants/theme';

export const HomeScreen: React.FC = () => {
  const {
    accounts,
    categories,
    transactions,
    getMonthlySummary,
    deleteTransaction,
    formatAmount,
    activeCurrency,
    openGlobalAddModal,
  } = useBudget();

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<TransactionType>('expense');
  const [showBalance, setShowBalance] = useState(true);

  // Month Calendar selector state ('YYYY-MM')
  const [selectedYM, setSelectedYM] = useState(() => getCurrentYearMonthString());
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

  // Calculate expense vs income percentage for progress bar
  const totalVolume = summary.totalIncome + summary.totalExpense;
  const incomeRatio = totalVolume > 0 ? (summary.totalIncome / totalVolume) * 100 : 50;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />

      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <View style={styles.statusPill}>
            <View style={styles.statusDot} />
            <Text style={styles.statusPillText}>Personal Finance</Text>
          </View>
          <Text style={styles.appName}>Money Manager</Text>
        </View>

        <TouchableOpacity
          style={styles.headerAddBtn}
          onPress={() => openGlobalAddModal('expense')}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Interactive Month Navigator Bar */}
        <MonthCalendarBar
          selectedYearMonth={selectedYM}
          onChangeYearMonth={setSelectedYM}
          onOpenPicker={() => setPickerModalVisible(true)}
        />

        {/* Main Balance Card (Fintech Card Glow) */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceTopRow}>
            <View style={styles.currencyBadge}>
              <Text style={styles.currencyBadgeText}>{activeCurrency.code}</Text>
            </View>

            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowBalance(!showBalance)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={showBalance ? 'eye-outline' : 'eye-off-outline'}
                size={18}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.balanceLabel}>Total Net Worth</Text>
          <Text style={styles.balanceAmount}>
            {showBalance ? formatAmount(totalBalance) : '••••••••'}
          </Text>

          {/* Income vs Expense Ratio Mini Bar */}
          <View style={styles.ratioBarContainer}>
            <View style={[styles.ratioBarFill, { width: `${Math.min(100, Math.max(0, incomeRatio))}%` }]} />
          </View>

          {/* Income & Expense Breakdown Row */}
          <View style={styles.summaryRow}>
            {/* Income */}
            <View style={styles.summaryItem}>
              <View style={[styles.arrowCircle, { backgroundColor: theme.colors.successGlow }]}>
                <Ionicons name="arrow-up" size={16} color={theme.colors.successLight} />
              </View>
              <View>
                <Text style={styles.summaryItemLabel}>Income</Text>
                <Text style={[styles.summaryItemValue, { color: theme.colors.successLight }]}>
                  +{formatAmount(summary.totalIncome)}
                </Text>
              </View>
            </View>

            <View style={styles.summaryDivider} />

            {/* Expense */}
            <View style={styles.summaryItem}>
              <View style={[styles.arrowCircle, { backgroundColor: theme.colors.dangerGlow }]}>
                <Ionicons name="arrow-down" size={16} color={theme.colors.dangerLight} />
              </View>
              <View>
                <Text style={styles.summaryItemLabel}>Expense</Text>
                <Text style={[styles.summaryItemValue, { color: theme.colors.dangerLight }]}>
                  -{formatAmount(summary.totalExpense)}
                </Text>
              </View>
            </View>
          </View>

          {/* Savings Metric Banner */}
          <View style={styles.savingsBanner}>
            <View style={styles.savingsLeft}>
              <Ionicons name="sparkles" size={15} color={theme.colors.warningLight} />
              <Text style={styles.savingsBannerText}>
                Net Saved:{' '}
                <Text style={{ fontWeight: '800', color: theme.colors.text }}>
                  {formatAmount(summary.netSavings)}
                </Text>
              </Text>
            </View>
            <View
              style={[
                styles.savingsBadge,
                {
                  backgroundColor:
                    summary.netSavings >= 0 ? theme.colors.successGlow : theme.colors.dangerGlow,
                  borderColor:
                    summary.netSavings >= 0 ? theme.colors.successDark : theme.colors.dangerDark,
                },
              ]}
            >
              <Text
                style={[
                  styles.savingsBadgeText,
                  {
                    color:
                      summary.netSavings >= 0
                        ? theme.colors.successLight
                        : theme.colors.dangerLight,
                  },
                ]}
              >
                {summary.savingsRate}% Saved
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Action Buttons */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnIncome]}
            onPress={() => openAddModal('income')}
            activeOpacity={0.75}
          >
            <View style={[styles.actionIconBox, { backgroundColor: theme.colors.successGlow }]}>
              <Ionicons name="arrow-up-circle" size={18} color={theme.colors.successLight} />
            </View>
            <Text style={[styles.actionBtnText, { color: theme.colors.successLight }]}>+ Income</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnExpense]}
            onPress={() => openAddModal('expense')}
            activeOpacity={0.75}
          >
            <View style={[styles.actionIconBox, { backgroundColor: theme.colors.dangerGlow }]}>
              <Ionicons name="arrow-down-circle" size={18} color={theme.colors.dangerLight} />
            </View>
            <Text style={[styles.actionBtnText, { color: theme.colors.dangerLight }]}>- Expense</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnTransfer]}
            onPress={() => openAddModal('transfer')}
            activeOpacity={0.75}
          >
            <View style={[styles.actionIconBox, { backgroundColor: theme.colors.primaryGlow }]}>
              <Ionicons name="swap-horizontal" size={18} color={theme.colors.primaryLight} />
            </View>
            <Text style={[styles.actionBtnText, { color: theme.colors.primaryLight }]}>Transfer</Text>
          </TouchableOpacity>
        </View>

        {/* Accounts Horizontal List */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="wallet-outline" size={18} color={theme.colors.primaryLight} />
            <Text style={styles.sectionTitle}>Accounts & Wallets</Text>
          </View>
          <Text style={styles.sectionCount}>{accounts.length} Total</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.accountsScroll}
          contentContainerStyle={{ paddingRight: 20 }}
        >
          {accounts.map((acc) => (
            <View key={acc.id} style={styles.accountCard}>
              <View style={styles.accountTopRow}>
                <View style={[styles.accountIcon, { backgroundColor: `${acc.color}25`, borderColor: `${acc.color}45` }]}>
                  <Ionicons name={(acc.icon as any) || 'wallet-outline'} size={18} color={acc.color} />
                </View>
                <View style={[styles.accountTypeBadge, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
                  <Text style={styles.accountTypeText}>{acc.type}</Text>
                </View>
              </View>

              <Text style={styles.accountName} numberOfLines={1}>
                {acc.name}
              </Text>
              <Text style={styles.accountBalance}>{formatAmount(acc.balance)}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Activities for the selected month */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="receipt-outline" size={18} color={theme.colors.textSecondary} />
            <Text style={styles.sectionTitle}>Monthly Activity</Text>
          </View>
          <View style={styles.entriesBadge}>
            <Text style={styles.entriesBadgeText}>{monthlyTransactions.length} entries</Text>
          </View>
        </View>

        {monthlyTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="calendar-clear-outline" size={36} color={theme.colors.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>No records in {formatYearMonth(selectedYM)}</Text>
            <Text style={styles.emptySubtitle}>
              Tap the buttons above to log your first transaction for this month!
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

        <View style={{ height: 60 }} />
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
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 14,
    backgroundColor: theme.colors.background,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.successLight,
  },
  statusPillText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  appName: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  headerAddBtn: {
    backgroundColor: theme.colors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 12,
  },
  balanceCard: {
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radii.lg,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  balanceTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  currencyBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  currencyBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.primaryLight,
    letterSpacing: 0.5,
  },
  eyeBtn: {
    padding: 6,
    borderRadius: theme.radii.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  balanceLabel: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  balanceAmount: {
    color: theme.colors.text,
    fontSize: 36,
    fontWeight: '800',
    marginVertical: 6,
    letterSpacing: -0.8,
  },
  ratioBarContainer: {
    height: 4,
    backgroundColor: theme.colors.dangerGlow,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 6,
    marginBottom: 16,
  },
  ratioBarFill: {
    height: '100%',
    backgroundColor: theme.colors.successLight,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    marginBottom: 14,
  },
  summaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: theme.colors.border,
  },
  summaryItem: {
    flex: 1,
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
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  summaryItemValue: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  savingsBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  savingsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  savingsBannerText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  savingsBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radii.xs,
    borderWidth: 1,
  },
  savingsBadgeText: {
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
    paddingVertical: 11,
    borderRadius: theme.radii.md,
    gap: 6,
    borderWidth: 1,
  },
  actionBtnIncome: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  actionBtnExpense: {
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
    borderColor: 'rgba(244, 63, 94, 0.25)',
  },
  actionBtnTransfer: {
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderColor: 'rgba(59, 130, 246, 0.25)',
  },
  actionIconBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    letterSpacing: -0.2,
  },
  sectionCount: {
    fontSize: 12,
    color: theme.colors.textTertiary,
    fontWeight: '600',
  },
  entriesBadge: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  entriesBadgeText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  accountsScroll: {
    marginBottom: 24,
    marginHorizontal: -18,
    paddingHorizontal: 18,
  },
  accountCard: {
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radii.md,
    padding: 14,
    marginRight: 10,
    width: 145,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  accountTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  accountIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  accountTypeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  accountTypeText: {
    fontSize: 10,
    color: theme.colors.textTertiary,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  accountName: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  accountBalance: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: -0.3,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 17,
  },
});
