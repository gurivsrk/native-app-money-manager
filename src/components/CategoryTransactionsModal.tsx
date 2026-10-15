import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Transaction, Account } from '../types';
import { useBudget } from '../context/BudgetContext';
import { useTheme } from '../context/ThemeContext';
import { formatDateWithWeekday, formatYearMonth } from '../utils/dateUtils';
import { Theme } from '../constants/theme';

export interface CategoryModalData {
  id: string;
  name: string;
  color: string;
  icon: string;
  amount: number;
  percent: number;
  type?: 'expense' | 'income';
}

interface Props {
  visible: boolean;
  onClose: () => void;
  category?: CategoryModalData | null;
  categoryData?: CategoryModalData | null;
  periodLabel?: string;
  selectedYearMonth?: string;
  transactions?: Transaction[];
  allTransactions?: Transaction[];
  accounts: Account[];
  onEditTransaction?: (tx: Transaction) => void;
  onDeleteTransaction?: (id: string) => void;
}

type SortOption = 'newest' | 'oldest' | 'highest';

export const CategoryTransactionsModal: React.FC<Props> = ({
  visible,
  onClose,
  category,
  categoryData,
  periodLabel,
  selectedYearMonth,
  transactions,
  allTransactions,
  accounts,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  const { formatAmount } = useBudget();
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const [sortBy, setSortBy] = useState<SortOption>('newest');

  const activeCategory = category || categoryData || null;
  if (!activeCategory) return null;

  const txList = transactions || allTransactions || [];
  const ym = selectedYearMonth || '';
  const displayPeriod = periodLabel || (ym ? formatYearMonth(ym) : 'All Time');

  // Filter transactions specifically for this category and (if specified) month
  const categoryTxs = txList.filter((t) => {
    const matchesCat = t.categoryId === activeCategory.id;
    if (!matchesCat) return false;
    if (ym) {
      return t.date.startsWith(ym);
    }
    return true;
  });

  // Apply sorting
  const sortedTxs = [...categoryTxs].sort((a, b) => {
    if (sortBy === 'newest') {
      return b.date.localeCompare(a.date);
    }
    if (sortBy === 'oldest') {
      return a.date.localeCompare(b.date);
    }
    if (sortBy === 'highest') {
      return b.amount - a.amount;
    }
    return 0;
  });

  const totalAmount = categoryTxs.reduce((sum, t) => sum + t.amount, 0);
  const avgAmount = categoryTxs.length > 0 ? totalAmount / categoryTxs.length : 0;
  const isIncome = activeCategory.type === 'income';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Header Bar */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.catIconWrap, { backgroundColor: activeCategory.color }]}>
                <Ionicons name={(activeCategory.icon as any) || 'pricetag'} size={20} color="#FFFFFF" />
              </View>
              <View style={styles.headerTitles}>
                <View style={styles.titleRow}>
                  <Text style={styles.catTitle}>{activeCategory.name}</Text>
                  <View
                    style={[
                      styles.typeBadge,
                      {
                        backgroundColor: isIncome
                          ? isDark
                            ? 'rgba(48, 209, 88, 0.2)'
                            : 'rgba(52, 199, 89, 0.15)'
                          : isDark
                          ? 'rgba(255, 69, 58, 0.2)'
                          : 'rgba(255, 59, 48, 0.15)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.typeBadgeText,
                        { color: isIncome ? theme.colors.success : theme.colors.danger },
                      ]}
                    >
                      {isIncome ? 'Income' : 'Expense'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.periodText}>{displayPeriod}</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Metric Summary Card */}
          <View style={styles.summaryBanner}>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Total {isIncome ? 'Earned' : 'Spent'}</Text>
              <Text
                style={[
                  styles.summaryValue,
                  { color: isIncome ? theme.colors.success : theme.colors.danger },
                ]}
              >
                {formatAmount(totalAmount)}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Share</Text>
              <Text style={styles.summaryValue}>
                {activeCategory.percent !== undefined ? `${activeCategory.percent}%` : '—'}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Average</Text>
              <Text style={styles.summaryValue}>{formatAmount(avgAmount)}</Text>
            </View>
          </View>

          {/* Apple Style Sorting Filter Pills */}
          <View style={styles.sortContainer}>
            <Text style={styles.sortLabel}>SORT BY:</Text>
            <View style={styles.sortButtons}>
              <TouchableOpacity
                style={[styles.sortBtn, sortBy === 'newest' && styles.sortBtnActive]}
                onPress={() => setSortBy('newest')}
              >
                <Text style={[styles.sortBtnText, sortBy === 'newest' && styles.sortBtnTextActive]}>
                  Newest
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sortBtn, sortBy === 'oldest' && styles.sortBtnActive]}
                onPress={() => setSortBy('oldest')}
              >
                <Text style={[styles.sortBtnText, sortBy === 'oldest' && styles.sortBtnTextActive]}>
                  Oldest
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sortBtn, sortBy === 'highest' && styles.sortBtnActive]}
                onPress={() => setSortBy('highest')}
              >
                <Text style={[styles.sortBtnText, sortBy === 'highest' && styles.sortBtnTextActive]}>
                  Highest
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Itemized Transactions List */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
            {sortedTxs.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Ionicons name="receipt-outline" size={40} color={theme.colors.textTertiary} />
                <Text style={styles.emptyText}>No itemized entries found for this period</Text>
              </View>
            ) : (
              <View style={styles.groupedList}>
                {sortedTxs.map((tx, index) => {
                  const acc = accounts.find((a) => a.id === tx.accountId);
                  return (
                    <React.Fragment key={tx.id}>
                      {index > 0 && <View style={styles.separator} />}
                      <View style={styles.txRow}>
                        <View style={styles.txMain}>
                          <Text style={styles.txDate}>{formatDateWithWeekday(tx.date)}</Text>
                          <Text style={styles.txAccount}>{acc?.name || 'Account'}</Text>
                          {!!tx.note && <Text style={styles.txNote}>{`"${tx.note}"`}</Text>}
                        </View>

                        <View style={styles.txRight}>
                          <Text
                            style={[
                              styles.txAmount,
                              { color: isIncome ? theme.colors.success : theme.colors.text },
                            ]}
                          >
                            {isIncome ? '+' : '-'}
                            {formatAmount(tx.amount)}
                          </Text>

                          <View style={styles.txActions}>
                            {onEditTransaction && (
                              <TouchableOpacity
                                style={styles.actionIconBtn}
                                onPress={() => onEditTransaction(tx)}
                              >
                                <Ionicons name="pencil" size={13} color={theme.colors.textSecondary} />
                              </TouchableOpacity>
                            )}
                            {onDeleteTransaction && (
                              <TouchableOpacity
                                style={styles.actionIconBtn}
                                onPress={() => onDeleteTransaction(tx.id)}
                              >
                                <Ionicons name="trash-outline" size={13} color={theme.colors.danger} />
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      </View>
                    </React.Fragment>
                  );
                })}
              </View>
            )}
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const createStyles = (theme: Theme, isDark: boolean) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: theme.colors.backdrop,
      justifyContent: 'flex-end',
    },
    modalCard: {
      backgroundColor: theme.colors.surfaceCard,
      borderTopLeftRadius: theme.radii.xl,
      borderTopRightRadius: theme.radii.xl,
      maxHeight: '90%',
      paddingTop: 16,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      ...theme.shadows.card,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingBottom: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    catIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitles: {
      gap: 2,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    catTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.text,
      letterSpacing: -0.3,
    },
    typeBadge: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: theme.radii.xs,
    },
    typeBadgeText: {
      fontSize: 10,
      fontWeight: '700',
    },
    periodText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    closeBtn: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA',
      alignItems: 'center',
      justifyContent: 'center',
    },
    summaryBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
      marginHorizontal: 16,
      marginTop: 14,
      paddingVertical: 12,
      borderRadius: theme.radii.lg,
    },
    summaryCol: {
      alignItems: 'center',
    },
    summaryLabel: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      fontWeight: '500',
      marginBottom: 3,
    },
    summaryValue: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.text,
      letterSpacing: -0.2,
    },
    divider: {
      width: StyleSheet.hairlineWidth,
      height: 28,
      backgroundColor: theme.colors.border,
    },
    sortContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    sortLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.textTertiary,
      letterSpacing: 0.5,
    },
    sortButtons: {
      flexDirection: 'row',
      gap: 6,
    },
    sortBtn: {
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: theme.radii.full,
      backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA',
    },
    sortBtnActive: {
      backgroundColor: theme.colors.primary,
    },
    sortBtnText: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    sortBtnTextActive: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    listContent: {
      paddingHorizontal: 16,
      paddingBottom: 36,
    },
    groupedList: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      overflow: 'hidden',
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.border,
      marginLeft: 16,
    },
    txRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    txMain: {
      flex: 1,
    },
    txDate: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 2,
    },
    txAccount: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    txNote: {
      fontSize: 11,
      color: theme.colors.textTertiary,
      fontStyle: 'italic',
      marginTop: 2,
    },
    txRight: {
      alignItems: 'flex-end',
      gap: 6,
    },
    txAmount: {
      fontSize: 15,
      fontWeight: '700',
      letterSpacing: -0.2,
    },
    txActions: {
      flexDirection: 'row',
      gap: 6,
    },
    actionIconBtn: {
      padding: 5,
      borderRadius: theme.radii.xs,
      backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA',
    },
    emptyWrap: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
    },
    emptyText: {
      color: theme.colors.textTertiary,
      fontSize: 13,
      marginTop: 8,
    },
  });
