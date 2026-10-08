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
import { TransactionType } from '../types';
import { MonthCalendarBar } from '../components/MonthCalendarBar';
import { CalendarMonthPickerModal } from '../components/CalendarMonthPickerModal';

export const AnalyticsScreen: React.FC = () => {
  const { categories, transactions, formatAmount, activeCurrency } = useBudget();
  const [filterType, setFilterType] = useState<TransactionType>('expense');

  // Month navigation state
  const [selectedYM, setSelectedYM] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [pickerModalVisible, setPickerModalVisible] = useState(false);

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

  const categoryBreakdown = Object.keys(categoryTotals)
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
      };
    })
    .sort((a, b) => b.amount - a.amount);

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

        {/* Category List with Progress Bars */}
        <Text style={styles.sectionTitle}>Category Spending Distribution</Text>

        {categoryBreakdown.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="pie-chart-outline" size={42} color="#CBD5E1" />
            <Text style={styles.emptyText}>
              No {filterType} records for this month ({selectedYM}).
            </Text>
          </View>
        ) : (
          categoryBreakdown.map((item) => (
            <View key={item.id} style={styles.categoryRow}>
              <View style={[styles.iconCircle, { backgroundColor: `${item.color}20` }]}>
                <Ionicons name={item.icon} size={20} color={item.color} />
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
                      { width: `${item.percent}%`, backgroundColor: item.color },
                    ]}
                  />
                </View>

                <Text style={styles.percentText}>{item.percent}% of total</Text>
              </View>
            </View>
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 16,
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
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  percentText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
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
