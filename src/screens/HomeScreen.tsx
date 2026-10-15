import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useBudget } from '../context/BudgetContext';
import { useTheme } from '../context/ThemeContext';
import { TransactionCard } from '../components/TransactionCard';
import { AddTransactionModal } from '../components/AddTransactionModal';
import { Transaction, TransactionType } from '../types';
import { MonthCalendarBar } from '../components/MonthCalendarBar';
import { CalendarMonthPickerModal } from '../components/CalendarMonthPickerModal';
import { getCurrentYearMonthString, formatYearMonth } from '../utils/dateUtils';
import { Theme } from '../constants/theme';

export const HomeScreen: React.FC = () => {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

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
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />

      {/* Apple Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>Personal Finance</Text>
          <Text style={styles.headerTitle}>Overview</Text>
        </View>

        <TouchableOpacity
          style={styles.headerAddBtn}
          onPress={() => openGlobalAddModal('expense')}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Apple Style Month Navigator Bar */}
        <MonthCalendarBar
          selectedYearMonth={selectedYM}
          onChangeYearMonth={setSelectedYM}
          onOpenPicker={() => setPickerModalVisible(true)}
        />

        {/* Apple Wallet Style Hero Balance Card */}
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

          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceAmount}>
            {showBalance ? formatAmount(totalBalance) : '••••••••'}
          </Text>

          {/* Income vs Expense Ratio Mini Bar */}
          <View style={styles.ratioBarContainer}>
            <View
              style={[
                styles.ratioBarFill,
                { width: `${Math.min(100, Math.max(0, incomeRatio))}%` },
              ]}
            />
          </View>

          {/* Income & Expense Breakdown Row */}
          <View style={styles.summaryRow}>
            {/* Income */}
            <View style={styles.summaryItem}>
              <View style={[styles.arrowCircle, { backgroundColor: isDark ? 'rgba(48, 209, 88, 0.2)' : 'rgba(52, 199, 89, 0.15)' }]}>
                <Ionicons name="arrow-up" size={15} color={theme.colors.success} />
              </View>
              <View>
                <Text style={styles.summaryItemLabel}>Income</Text>
                <Text style={[styles.summaryItemValue, { color: theme.colors.success }]}>
                  +{formatAmount(summary.totalIncome)}
                </Text>
              </View>
            </View>

            <View style={styles.summaryDivider} />

            {/* Expense */}
            <View style={styles.summaryItem}>
              <View style={[styles.arrowCircle, { backgroundColor: isDark ? 'rgba(255, 69, 58, 0.2)' : 'rgba(255, 59, 48, 0.15)' }]}>
                <Ionicons name="arrow-down" size={15} color={theme.colors.danger} />
              </View>
              <View>
                <Text style={styles.summaryItemLabel}>Expense</Text>
                <Text style={[styles.summaryItemValue, { color: theme.colors.danger }]}>
                  -{formatAmount(summary.totalExpense)}
                </Text>
              </View>
            </View>
          </View>

          {/* Savings Metric Banner */}
          <View style={styles.savingsBanner}>
            <View style={styles.savingsLeft}>
              <Ionicons name="sparkles" size={14} color={theme.colors.warning} />
              <Text style={styles.savingsBannerText}>
                Net Saved:{' '}
                <Text style={{ fontWeight: '700', color: theme.colors.text }}>
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
                },
              ]}
            >
              <Text
                style={[
                  styles.savingsBadgeText,
                  {
                    color:
                      summary.netSavings >= 0
                        ? theme.colors.success
                        : theme.colors.danger,
                  },
                ]}
              >
                {summary.savingsRate}% Saved
              </Text>
            </View>
          </View>
        </View>

        {/* Apple Style Quick Action Buttons */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => openAddModal('expense')}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: theme.colors.danger }]}>
              <Ionicons name="remove" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.actionBtnLabel}>Expense</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => openAddModal('income')}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: theme.colors.success }]}>
              <Ionicons name="add" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.actionBtnLabel}>Income</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => openAddModal('transfer')}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: theme.colors.primary }]}>
              <Ionicons name="swap-horizontal" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.actionBtnLabel}>Transfer</Text>
          </TouchableOpacity>
        </View>

        {/* ACCOUNTS SECTION */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeader}>ACCOUNTS</Text>
          <Text style={styles.sectionBadge}>{accounts.length} total</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.accountsScroll}
        >
          {accounts.map((acc) => (
            <View key={acc.id} style={styles.accountCard}>
              <View style={styles.accountTop}>
                <View
                  style={[
                    styles.accountIconBox,
                    {
                      backgroundColor: isDark ? 'rgba(10, 132, 255, 0.2)' : 'rgba(0, 122, 255, 0.12)',
                    },
                  ]}
                >
                  <Ionicons name="wallet-outline" size={18} color={theme.colors.primary} />
                </View>
                <View style={styles.accountTypePill}>
                  <Text style={styles.accountTypePillText}>{acc.type}</Text>
                </View>
              </View>

              <Text style={styles.accountName} numberOfLines={1}>
                {acc.name}
              </Text>
              <Text style={styles.accountBalance}>{formatAmount(acc.balance)}</Text>
            </View>
          ))}
        </ScrollView>

        {/* RECENT ACTIVITY SECTION */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeader}>
            ACTIVITY • {formatYearMonth(selectedYM)}
          </Text>
          <Text style={styles.sectionBadge}>
            {monthlyTransactions.length} {monthlyTransactions.length === 1 ? 'entry' : 'entries'}
          </Text>
        </View>

        {monthlyTransactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="receipt-outline" size={32} color={theme.colors.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>No entries for {formatYearMonth(selectedYM)}</Text>
            <Text style={styles.emptySubtitle}>
              Tap the buttons above to log your expenses, income, or transfers.
            </Text>
            <TouchableOpacity
              style={styles.emptyAddBtn}
              onPress={() => openAddModal('expense')}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={16} color="#FFFFFF" />
              <Text style={styles.emptyAddBtnText}>Add First Transaction</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.activityList}>
            {monthlyTransactions.map((tx) => (
              <TransactionCard
                key={tx.id}
                transaction={tx}
                accounts={accounts}
                categories={categories}
                onEdit={handleEditTx}
                onDelete={deleteTransaction}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Screen-Specific Add Transaction Modal */}
      <AddTransactionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        initialType={modalType}
        transactionToEdit={editingTx || undefined}
        defaultDate={selectedYM + '-01'}
      />

      {/* Interactive Calendar Month Picker Modal */}
      <CalendarMonthPickerModal
        visible={pickerModalVisible}
        selectedYearMonth={selectedYM}
        onSelectYearMonth={setSelectedYM}
        onClose={() => setPickerModalVisible(false)}
      />
    </SafeAreaView>
  );
};

const createStyles = (theme: Theme, isDark: boolean) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 8,
    },
    headerSubtitle: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.textTertiary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    headerTitle: {
      fontSize: 34,
      fontWeight: '700',
      color: theme.colors.text,
      letterSpacing: -0.6,
    },
    headerAddBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      ...theme.shadows.glowPrimary,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingBottom: 36,
    },
    // Balance Card (Apple Wallet Inset Hero)
    balanceCard: {
      backgroundColor: theme.colors.surfaceCard,
      borderRadius: theme.radii.xl,
      padding: 20,
      marginTop: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      ...theme.shadows.card,
    },
    balanceTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    currencyBadge: {
      backgroundColor: isDark ? 'rgba(10, 132, 255, 0.15)' : 'rgba(0, 122, 255, 0.1)',
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: theme.radii.sm,
    },
    currencyBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.primary,
      letterSpacing: 0.5,
    },
    eyeBtn: {
      padding: 6,
      borderRadius: theme.radii.sm,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
    },
    balanceLabel: {
      color: theme.colors.textSecondary,
      fontSize: 13,
      fontWeight: '500',
    },
    balanceAmount: {
      color: theme.colors.text,
      fontSize: 36,
      fontWeight: '700',
      marginVertical: 4,
      letterSpacing: -0.8,
    },
    ratioBarContainer: {
      height: 4,
      backgroundColor: isDark ? 'rgba(255, 69, 58, 0.25)' : 'rgba(255, 59, 48, 0.15)',
      borderRadius: 2,
      overflow: 'hidden',
      marginTop: 4,
      marginBottom: 14,
    },
    ratioBarFill: {
      height: '100%',
      backgroundColor: theme.colors.success,
    },
    summaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border,
    },
    summaryItem: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: 10,
    },
    summaryDivider: {
      width: StyleSheet.hairlineWidth,
      height: 32,
      backgroundColor: theme.colors.border,
      marginHorizontal: 8,
    },
    arrowCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    summaryItemLabel: {
      color: theme.colors.textSecondary,
      fontSize: 11,
      fontWeight: '500',
    },
    summaryItemValue: {
      fontSize: 15,
      fontWeight: '700',
      letterSpacing: -0.2,
      marginTop: 1,
    },
    savingsBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: theme.radii.md,
      marginTop: 14,
    },
    savingsLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    savingsBannerText: {
      color: theme.colors.textSecondary,
      fontSize: 12,
      fontWeight: '500',
    },
    savingsBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: theme.radii.sm,
    },
    savingsBadgeText: {
      fontSize: 11,
      fontWeight: '700',
    },
    // Quick Actions (Apple pill buttons)
    quickActions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 16,
    },
    actionBtn: {
      flex: 1,
      backgroundColor: theme.colors.surfaceCard,
      paddingVertical: 12,
      paddingHorizontal: 8,
      borderRadius: theme.radii.lg,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      ...theme.shadows.card,
    },
    actionIconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 6,
    },
    actionBtnLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.text,
      letterSpacing: -0.1,
    },
    // Section Headers
    sectionHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 24,
      marginBottom: 10,
      paddingHorizontal: 4,
    },
    sectionHeader: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.textTertiary,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    sectionBadge: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.colors.textSecondary,
    },
    // Accounts Carousel
    accountsScroll: {
      paddingRight: 8,
      gap: 12,
    },
    accountCard: {
      width: 160,
      backgroundColor: theme.colors.surfaceCard,
      borderRadius: theme.radii.lg,
      padding: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      ...theme.shadows.card,
    },
    accountTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    accountIconBox: {
      width: 32,
      height: 32,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
    },
    accountTypePill: {
      backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: theme.radii.xs,
    },
    accountTypePillText: {
      fontSize: 10,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      textTransform: 'capitalize',
    },
    accountName: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 4,
    },
    accountBalance: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.text,
      letterSpacing: -0.3,
    },
    // Activity List
    activityList: {
      marginTop: 2,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
      paddingHorizontal: 20,
      backgroundColor: theme.colors.surfaceCard,
      borderRadius: theme.radii.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      ...theme.shadows.card,
    },
    emptyIconCircle: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 14,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 6,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 18,
      marginBottom: 18,
    },
    emptyAddBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.colors.primary,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: theme.radii.full,
    },
    emptyAddBtnText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '600',
    },
  });
