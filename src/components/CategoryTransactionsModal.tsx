import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Transaction, Account } from '../types';
import { useBudget } from '../context/BudgetContext';
import { formatDateWithWeekday } from '../utils/dateUtils';

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
  category: CategoryModalData | null;
  periodLabel: string;
  transactions: Transaction[];
  accounts: Account[];
  onEditTransaction?: (tx: Transaction) => void;
  onDeleteTransaction?: (id: string) => void;
}

type SortOption = 'newest' | 'oldest' | 'highest';

export const CategoryTransactionsModal: React.FC<Props> = ({
  visible,
  onClose,
  category,
  periodLabel,
  transactions,
  accounts,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  const { formatAmount } = useBudget();
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  if (!category) return null;

  // Filter transactions specifically for this category
  const categoryTxs = transactions.filter((t) => t.categoryId === category.id);

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
  const isIncome = category.type === 'income';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Header Bar */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.catIconWrap, { backgroundColor: category.color }]}>
                <Ionicons name={category.icon as any} size={22} color="#FFFFFF" />
              </View>
              <View style={styles.headerTitles}>
                <View style={styles.titleRow}>
                  <Text style={styles.catTitle}>{category.name}</Text>
                  <View
                    style={[
                      styles.typeBadge,
                      { backgroundColor: isIncome ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.typeBadgeText,
                        { color: isIncome ? '#10B981' : '#EF4444' },
                      ]}
                    >
                      {isIncome ? 'Income' : 'Expense'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.periodText}>{periodLabel}</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Metric Summary Card */}
          <View style={styles.summaryBanner}>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Total {isIncome ? 'Earned' : 'Spent'}</Text>
              <Text
                style={[
                  styles.summaryValue,
                  { color: isIncome ? '#10B981' : '#EF4444' },
                ]}
              >
                {formatAmount(totalAmount)}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Share</Text>
              <Text style={styles.summaryValue}>
                {category.percent !== undefined ? `${category.percent}%` : '—'}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Entries</Text>
              <Text style={styles.summaryValue}>{categoryTxs.length}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Avg/Entry</Text>
              <Text style={styles.summaryValue}>{formatAmount(avgAmount)}</Text>
            </View>
          </View>

          {/* Sort Controls */}
          {categoryTxs.length > 1 && (
            <View style={styles.sortRow}>
              <Text style={styles.sortLabel}>Sort by:</Text>
              <View style={styles.sortPills}>
                <TouchableOpacity
                  style={[styles.sortPill, sortBy === 'newest' && styles.sortPillActive]}
                  onPress={() => setSortBy('newest')}
                >
                  <Text style={[styles.sortPillText, sortBy === 'newest' && styles.sortPillTextActive]}>
                    Newest
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.sortPill, sortBy === 'highest' && styles.sortPillActive]}
                  onPress={() => setSortBy('highest')}
                >
                  <Text style={[styles.sortPillText, sortBy === 'highest' && styles.sortPillTextActive]}>
                    Highest
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.sortPill, sortBy === 'oldest' && styles.sortPillActive]}
                  onPress={() => setSortBy('oldest')}
                >
                  <Text style={[styles.sortPillText, sortBy === 'oldest' && styles.sortPillTextActive]}>
                    Oldest
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Transaction List */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          >
            {sortedTxs.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="receipt-outline" size={40} color="#94A3B8" />
                </View>
                <Text style={styles.emptyTitle}>No Entries Found</Text>
                <Text style={styles.emptySubtitle}>
                  There are no recorded transactions for {category.name} in {periodLabel}.
                </Text>
              </View>
            ) : (
              sortedTxs.map((tx) => {
                const account = accounts.find((a) => a.id === tx.accountId);
                return (
                  <View key={tx.id} style={styles.txCard}>
                    <View style={styles.txMain}>
                      {/* Left: Date with weekday and Account */}
                      <View style={styles.txLeft}>
                        <View style={styles.dateTag}>
                          <Ionicons name="calendar-outline" size={13} color="#3B82F6" />
                          <Text style={styles.dateText}>
                            {formatDateWithWeekday(tx.date)}
                          </Text>
                        </View>

                        {tx.note ? (
                          <Text style={styles.txNote} numberOfLines={2}>
                            {tx.note}
                          </Text>
                        ) : (
                          <Text style={styles.txNoteEmpty}>No description</Text>
                        )}

                        {account && (
                          <View style={styles.accountBadge}>
                            <Ionicons
                              name={(account.icon as any) || 'wallet-outline'}
                              size={12}
                              color={account.color || '#64748B'}
                            />
                            <Text style={styles.accountName}>{account.name}</Text>
                          </View>
                        )}
                      </View>

                      {/* Right: Amount & Actions */}
                      <View style={styles.txRight}>
                        <Text
                          style={[
                            styles.txAmount,
                            { color: isIncome ? '#10B981' : '#EF4444' },
                          ]}
                        >
                          {isIncome ? '+' : '-'}{formatAmount(tx.amount)}
                        </Text>

                        <View style={styles.actionsRow}>
                          {onEditTransaction && (
                            <TouchableOpacity
                              style={styles.actionBtn}
                              onPress={() => {
                                onClose();
                                onEditTransaction(tx);
                              }}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                              <Ionicons name="pencil-outline" size={16} color="#64748B" />
                            </TouchableOpacity>
                          )}

                          {onDeleteTransaction && (
                            <TouchableOpacity
                              style={styles.actionBtn}
                              onPress={() => onDeleteTransaction(tx.id)}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                              <Ionicons name="trash-outline" size={16} color="#EF4444" />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
            <View style={{ height: 30 }} />
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '88%',
    minHeight: '55%',
    paddingTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  catIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitles: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  catTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  periodText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  summaryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    marginHorizontal: 20,
    marginTop: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryCol: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: '#CBD5E1',
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 14,
    marginBottom: 8,
  },
  sortLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  sortPills: {
    flexDirection: 'row',
    gap: 6,
  },
  sortPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  sortPillActive: {
    backgroundColor: '#3B82F6',
  },
  sortPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  sortPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  txCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  txMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  txLeft: {
    flex: 1,
    marginRight: 12,
  },
  dateTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  txNote: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 6,
  },
  txNoteEmpty: {
    fontSize: 13,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginBottom: 6,
  },
  accountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  accountName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  txRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  txAmount: {
    fontSize: 16,
    fontWeight: '800',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  actionBtn: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 18,
  },
});
