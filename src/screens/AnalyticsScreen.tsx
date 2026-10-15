import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBudget } from '../context/BudgetContext';
import { Transaction, TransactionType } from '../types';
import { MonthCalendarBar } from '../components/MonthCalendarBar';
import { CalendarMonthPickerModal } from '../components/CalendarMonthPickerModal';
import {
  CategoryTransactionsModal,
  CategoryModalData,
} from '../components/CategoryTransactionsModal';
import { AddTransactionModal } from '../components/AddTransactionModal';
import { getCurrentYearMonthString, formatYearMonth } from '../utils/dateUtils';

export const AnalyticsScreen: React.FC = () => {
  const {
    categories,
    accounts,
    transactions,
    formatAmount,
    activeCurrency,
    deleteTransaction,
  } = useBudget();
  const [filterType, setFilterType] = useState<TransactionType>('expense');

  // Month navigation state
  const [selectedYM, setSelectedYM] = useState(() => getCurrentYearMonthString());
  const [pickerModalVisible, setPickerModalVisible] = useState(false);

  // Category drilldown modal state
  const [selectedCategory, setSelectedCategory] = useState<CategoryModalData | null>(null);

  // Transaction editing state
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);

  // Compute breakdown by category strictly for the selected year and month
  const filteredTxs = transactions.filter(
    (t) => t.type === filterType && t.date.startsWith(selectedYM)
  );
  const totalAmount = filteredTxs.reduce((sum, t) => sum + t.amount, 0);

  const categoryTotals: { [catId: string]: number } = {};
  filteredTxs.forEach((t) => {
    if (t.categoryId) {
      categoryTotals[t.categoryId] = (categoryTotals[t.categoryId] || 0) + t.amount;
    }
  });

  const categoryBreakdown: CategoryModalData[] = Object.keys(categoryTotals)
    .map((catId) => {
      const cat = categories.find((c) => c.id === catId);
      const amount = categoryTotals[catId];
      const percent = totalAmount > 0 ? Math.round((amount / totalAmount) * 100) : 0;
      return {
        id: catId,
        name: cat?.name || 'Other',
        color: cat?.color || '#64748B',
        icon: (cat?.icon as any) || 'pricetag',
        amount,
        percent,
        type: filterType === 'income' ? ('income' as const) : ('expense' as const),
      };
    })
    .sort((a, b) => b.amount - a.amount);

  const handleEditTx = (tx: Transaction) => {
    setSelectedCategory(null);
    setEditingTx(tx);
    setEditModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      <View style={styles.header}>
        <Text style={styles.headerSubtitle}>Financial Insights</Text>
        <Text style={styles.headerTitle}>Monthly Analytics</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Interactive Month Calendar Bar */}
        <MonthCalendarBar
          selectedYearMonth={selectedYM}
          onChangeYearMonth={setSelectedYM}
          onOpenPicker={() => setPickerModalVisible(true)}
        />

        {/* Toggle Expense / Income */}
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, filterType === 'expense' && styles.toggleExpenseActive]}
            onPress={() => setFilterType('expense')}
          >
            <Text style={[styles.toggleText, filterType === 'expense' && styles.toggleTextActive]}>
              Expenses Breakdown
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleBtn, filterType === 'income' && styles.toggleIncomeActive]}
            onPress={() => setFilterType('income')}
          >
            <Text style={[styles.toggleText, filterType === 'income' && styles.toggleTextActive]}>
              Income Breakdown
            </Text>
          </TouchableOpacity>
        </View>

        {/* Total Metric Card */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>
            Total {filterType === 'expense' ? 'Expenses' : 'Income'} ({activeCurrency.code})
          </Text>
          <Text
            style={[
              styles.totalAmount,
              { color: filterType === 'expense' ? '#EF4444' : '#10B981' },
            ]}
          >
            {formatAmount(totalAmount)}
          </Text>
        </View>

        {/* Category List Header with Hint */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Category Spending Distribution</Text>
          <Text style={styles.sectionHint}>Tap category to see entries</Text>
        </View>

        {categoryBreakdown.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="pie-chart-outline" size={42} color="#CBD5E1" />
            <Text style={styles.emptyText}>
              No {filterType} records for this month ({formatYearMonth(selectedYM)}).
            </Text>
          </View>
        ) : (
          categoryBreakdown.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.categoryRow}
              onPress={() => setSelectedCategory(item)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconCircle, { backgroundColor: `${item.color}20` }]}>
                <Ionicons name={item.icon as any} size={20} color={item.color} />
              </View>

              <View style={styles.detailsWrap}>
                <View style={styles.nameAndAmount}>
                  <Text style={styles.catName}>{item.name}</Text>
                  <Text style={styles.catAmount}>{formatAmount(item.amount)}</Text>
                </View>

                {/* Visual Progress Bar */}
                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${item.percent}%` as const, backgroundColor: item.color },
                    ]}
                  />
                </View>

                <View style={styles.bottomInfoRow}>
                  <Text style={styles.percentText}>{item.percent}% of total</Text>
                  <View style={styles.viewEntriesPill}>
                    <Text style={styles.viewEntriesText}>View entries</Text>
                    <Ionicons name="chevron-forward" size={13} color="#3B82F6" />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Calendar Month Picker Modal */}
      <CalendarMonthPickerModal
        visible={pickerModalVisible}
        currentYearMonth={selectedYM}
        onSelect={setSelectedYM}
        onClose={() => setPickerModalVisible(false)}
      />

      {/* Category Drilldown Modal */}
      <CategoryTransactionsModal
        visible={!!selectedCategory}
        onClose={() => setSelectedCategory(null)}
        category={selectedCategory}
        periodLabel={formatYearMonth(selectedYM)}
        transactions={filteredTxs}
        accounts={accounts}
        onEditTransaction={handleEditTx}
        onDeleteTransaction={deleteTransaction}
      />

      {/* Edit Transaction Modal */}
      <AddTransactionModal
        visible={editModalVisible}
        onClose={() => {
          setEditModalVisible(false);
          setEditingTx(null);
        }}
        initialType={editingTx?.type || filterType}
        editingTransaction={editingTx}
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#0F172A',
  },
  headerSubtitle: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  scrollContent: {
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 24,
    minHeight: '100%',
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  toggleExpenseActive: {
    backgroundColor: '#EF4444',
  },
  toggleIncomeActive: {
    backgroundColor: '#10B981',
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  totalCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  totalLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 6,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: '800',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionHint: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  detailsWrap: {
    flex: 1,
  },
  nameAndAmount: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  catName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  catAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  bottomInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  percentText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  viewEntriesPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewEntriesText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3B82F6',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyText: {
    marginTop: 10,
    fontSize: 14,
    color: '#94A3B8',
  },
});
