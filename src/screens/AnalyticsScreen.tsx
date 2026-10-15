import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { ReportCharts } from '../components/ReportCharts';
import dayjs, { getCurrentYearMonthString, formatYearMonth } from '../utils/dateUtils';
import { theme } from '../constants/theme';

type MainViewMode = 'insights' | 'reports';

export const AnalyticsScreen: React.FC = () => {
  const {
    categories,
    accounts,
    transactions,
    formatAmount,
    activeCurrency,
    deleteTransaction,
  } = useBudget();

  // Top view mode: Insights (Breakdown & Trends) vs Reports (Statements & Exports)
  const [viewMode, setViewMode] = useState<MainViewMode>('insights');

  // Insights filter type: Expense vs Income
  const [filterType, setFilterType] = useState<TransactionType>('expense');

  // Month navigation state ('YYYY-MM')
  const [selectedYM, setSelectedYM] = useState(() => getCurrentYearMonthString());
  const [pickerModalVisible, setPickerModalVisible] = useState(false);

  // Reports mode: Monthly vs Annual
  const [reportMode, setReportMode] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedYear, setSelectedYear] = useState(() => dayjs().year());

  // Category drilldown modal state
  const [selectedCategory, setSelectedCategory] = useState<CategoryModalData | null>(null);

  // Transaction editing state
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);

  // --- Computations for Insights ---
  const filteredInsightsTxs = transactions.filter(
    (t) => t.type === filterType && t.date.startsWith(selectedYM)
  );
  const totalInsightsAmount = filteredInsightsTxs.reduce((sum, t) => sum + t.amount, 0);

  const categoryTotals: { [catId: string]: number } = {};
  filteredInsightsTxs.forEach((t) => {
    if (t.categoryId) {
      categoryTotals[t.categoryId] = (categoryTotals[t.categoryId] || 0) + t.amount;
    }
  });

  const categoryBreakdown: CategoryModalData[] = Object.keys(categoryTotals)
    .map((catId) => {
      const cat = categories.find((c) => c.id === catId);
      const amount = categoryTotals[catId];
      const percent = totalInsightsAmount > 0 ? Math.round((amount / totalInsightsAmount) * 100) : 0;
      return {
        id: catId,
        name: cat?.name || 'Other',
        color: cat?.color || theme.colors.primary,
        icon: (cat?.icon as any) || 'pricetag',
        amount,
        percent,
        type: filterType === 'income' ? ('income' as const) : ('expense' as const),
      };
    })
    .sort((a, b) => b.amount - a.amount);

  // --- Computations for Reports ---
  const filteredReportTxs = transactions.filter((t) => {
    if (reportMode === 'monthly') {
      return t.date.startsWith(selectedYM);
    } else {
      return t.date.startsWith(String(selectedYear));
    }
  });

  const totalIncome = filteredReportTxs
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = filteredReportTxs
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

  const handleEditTx = (tx: Transaction) => {
    setSelectedCategory(null);
    setEditingTx(tx);
    setEditModalVisible(true);
  };

  const handleShareReport = async () => {
    const periodLabel =
      reportMode === 'monthly' ? formatYearMonth(selectedYM) : `Annual ${selectedYear}`;
    const reportTitle = `Financial Summary - ${periodLabel}`;

    const reportContent = `📊 ${reportTitle}
Currency: ${activeCurrency.name} (${activeCurrency.code})
-----------------------------------------
📈 Total Income: ${formatAmount(totalIncome)}
📉 Total Expense: ${formatAmount(totalExpense)}
💰 Net Savings: ${formatAmount(netSavings)} (${savingsRate}% saved)
-----------------------------------------
Exported from Money Manager App`;

    try {
      await Share.share({
        message: reportContent,
        title: reportTitle,
      });
    } catch (error) {
      console.warn('Share error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>Financial Intelligence</Text>
          <Text style={styles.headerTitle}>Analytics & Reports</Text>
        </View>

        {viewMode === 'reports' && (
          <TouchableOpacity
            style={styles.shareBtn}
            onPress={handleShareReport}
            activeOpacity={0.8}
          >
            <Ionicons name="share-outline" size={18} color="#FFFFFF" />
            <Text style={styles.shareBtnText}>Export</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Primary View Switcher: Insights vs Reports */}
      <View style={styles.viewModeContainer}>
        <View style={styles.viewModePillGroup}>
          <TouchableOpacity
            style={[styles.viewModeBtn, viewMode === 'insights' && styles.viewModeBtnActive]}
            onPress={() => setViewMode('insights')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="pie-chart"
              size={15}
              color={viewMode === 'insights' ? '#FFFFFF' : theme.colors.textSecondary}
            />
            <Text
              style={[
                styles.viewModeBtnText,
                viewMode === 'insights' && styles.viewModeBtnTextActive,
              ]}
            >
              Insights & Charts
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.viewModeBtn, viewMode === 'reports' && styles.viewModeBtnActive]}
            onPress={() => setViewMode('reports')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="document-text"
              size={15}
              color={viewMode === 'reports' ? '#FFFFFF' : theme.colors.textSecondary}
            />
            <Text
              style={[
                styles.viewModeBtnText,
                viewMode === 'reports' && styles.viewModeBtnTextActive,
              ]}
            >
              Financial Reports
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ================= INSIGHTS VIEW ================= */}
        {viewMode === 'insights' && (
          <>
            {/* Interactive Month Selector */}
            <MonthCalendarBar
              selectedYearMonth={selectedYM}
              onChangeYearMonth={setSelectedYM}
              onOpenPicker={() => setPickerModalVisible(true)}
            />

            {/* Income / Expense Toggle */}
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleBtn, filterType === 'expense' && styles.toggleBtnActiveExpense]}
                onPress={() => setFilterType('expense')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="arrow-down-circle"
                  size={16}
                  color={filterType === 'expense' ? '#FFF' : theme.colors.dangerLight}
                />
                <Text
                  style={[
                    styles.toggleBtnText,
                    filterType === 'expense' && styles.toggleBtnTextActive,
                  ]}
                >
                  Expenses
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.toggleBtn, filterType === 'income' && styles.toggleBtnActiveIncome]}
                onPress={() => setFilterType('income')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="arrow-up-circle"
                  size={16}
                  color={filterType === 'income' ? '#FFF' : theme.colors.successLight}
                />
                <Text
                  style={[
                    styles.toggleBtnText,
                    filterType === 'income' && styles.toggleBtnTextActive,
                  ]}
                >
                  Income
                </Text>
              </TouchableOpacity>
            </View>

            {/* Summary Highlight Card */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryTop}>
                <View>
                  <Text style={styles.summaryLabel}>
                    Total {filterType === 'expense' ? 'Expenses' : 'Income'}
                  </Text>
                  <Text
                    style={[
                      styles.summaryAmount,
                      {
                        color:
                          filterType === 'expense'
                            ? theme.colors.dangerLight
                            : theme.colors.successLight,
                      },
                    ]}
                  >
                    {formatAmount(totalInsightsAmount)}
                  </Text>
                </View>
                <View style={styles.entriesBadge}>
                  <Text style={styles.entriesBadgeText}>
                    {filteredInsightsTxs.length} Transactions
                  </Text>
                </View>
              </View>

              {categoryBreakdown.length > 0 && (
                <View style={styles.topCategoryRow}>
                  <Ionicons name="flame" size={16} color={theme.colors.warningLight} />
                  <Text style={styles.topCategoryText}>
                    Top Category:{' '}
                    <Text style={{ fontWeight: '800', color: theme.colors.text }}>
                      {categoryBreakdown[0].name} ({categoryBreakdown[0].percent}%)
                    </Text>
                  </Text>
                </View>
              )}
            </View>

            {/* Interactive Charts Section */}
            <ReportCharts
              reportMode="monthly"
              selectedYM={selectedYM}
              selectedYear={dayjs(selectedYM).year()}
              totalIncome={totalIncome}
              totalExpense={totalExpense}
              netSavings={netSavings}
              categoriesData={categoryBreakdown}
              transactions={transactions}
              onSelectCategory={(cat) => setSelectedCategory(cat)}
            />

            {/* Category Breakdown Header */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="list" size={17} color={theme.colors.primaryLight} />
                <Text style={styles.sectionTitle}>Category Breakdown</Text>
              </View>
              <Text style={styles.hintText}>Tap category to inspect</Text>
            </View>

            {/* Breakdown List */}
            {categoryBreakdown.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="pie-chart-outline" size={40} color={theme.colors.textTertiary} />
                <Text style={styles.emptyTitle}>No data recorded</Text>
                <Text style={styles.emptySubtitle}>
                  No {filterType} transactions recorded for {formatYearMonth(selectedYM)}.
                </Text>
              </View>
            ) : (
              categoryBreakdown.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.categoryCard}
                  onPress={() => setSelectedCategory(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.categoryTopRow}>
                    <View style={styles.categoryLeft}>
                      <View
                        style={[
                          styles.catIconWrap,
                          { backgroundColor: `${item.color}20`, borderColor: `${item.color}40` },
                        ]}
                      >
                        <Ionicons name={item.icon as any} size={18} color={item.color} />
                      </View>
                      <View>
                        <Text style={styles.catName}>{item.name}</Text>
                        <Text style={styles.catPercent}>{item.percent}% of total</Text>
                      </View>
                    </View>

                    <View style={styles.categoryRight}>
                      <Text style={styles.catAmount}>{formatAmount(item.amount)}</Text>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={theme.colors.textTertiary}
                      />
                    </View>
                  </View>

                  {/* Visual Progress Bar */}
                  <View style={styles.progressBarTrack}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${Math.min(100, Math.max(2, item.percent))}%`,
                          backgroundColor: item.color,
                        },
                      ]}
                    />
                  </View>
                </TouchableOpacity>
              ))
            )}
          </>
        )}

        {/* ================= REPORTS VIEW ================= */}
        {viewMode === 'reports' && (
          <>
            {/* Period Selector: Monthly vs Annual */}
            <View style={styles.reportPeriodRow}>
              <TouchableOpacity
                style={[
                  styles.periodBtn,
                  reportMode === 'monthly' && styles.periodBtnActive,
                ]}
                onPress={() => setReportMode('monthly')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.periodBtnText,
                    reportMode === 'monthly' && styles.periodBtnTextActive,
                  ]}
                >
                  Monthly Report
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.periodBtn,
                  reportMode === 'yearly' && styles.periodBtnActive,
                ]}
                onPress={() => setReportMode('yearly')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.periodBtnText,
                    reportMode === 'yearly' && styles.periodBtnTextActive,
                  ]}
                >
                  Annual Statement
                </Text>
              </TouchableOpacity>
            </View>

            {/* Date Navigator */}
            {reportMode === 'monthly' ? (
              <MonthCalendarBar
                selectedYearMonth={selectedYM}
                onChangeYearMonth={setSelectedYM}
                onOpenPicker={() => setPickerModalVisible(true)}
              />
            ) : (
              <View style={styles.yearNavigator}>
                <TouchableOpacity
                  style={styles.yearBtn}
                  onPress={() => setSelectedYear((y) => y - 1)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chevron-back" size={18} color={theme.colors.textSecondary} />
                </TouchableOpacity>
                <View style={styles.yearBadge}>
                  <Ionicons name="calendar" size={16} color={theme.colors.primaryLight} />
                  <Text style={styles.yearText}>Calendar Year {selectedYear}</Text>
                </View>
                <TouchableOpacity
                  style={styles.yearBtn}
                  onPress={() => setSelectedYear((y) => y + 1)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>
            )}

            {/* Financial Statement Overview Card */}
            <View style={styles.statementCard}>
              <Text style={styles.statementTitle}>
                {reportMode === 'monthly'
                  ? `Monthly Statement (${formatYearMonth(selectedYM)})`
                  : `Annual Statement (${selectedYear})`}
              </Text>

              <View style={styles.statementGrid}>
                {/* Income */}
                <View style={styles.statementGridItem}>
                  <Text style={styles.statementItemLabel}>Total Income</Text>
                  <Text style={[styles.statementItemValue, { color: theme.colors.successLight }]}>
                    +{formatAmount(totalIncome)}
                  </Text>
                </View>

                {/* Expense */}
                <View style={styles.statementGridItem}>
                  <Text style={styles.statementItemLabel}>Total Expenses</Text>
                  <Text style={[styles.statementItemValue, { color: theme.colors.dangerLight }]}>
                    -{formatAmount(totalExpense)}
                  </Text>
                </View>
              </View>

              {/* Net Savings Highlight */}
              <View style={styles.netSavingsBox}>
                <View>
                  <Text style={styles.netSavingsLabel}>Net Savings</Text>
                  <Text
                    style={[
                      styles.netSavingsValue,
                      {
                        color:
                          netSavings >= 0 ? theme.colors.successLight : theme.colors.dangerLight,
                      },
                    ]}
                  >
                    {formatAmount(netSavings)}
                  </Text>
                </View>

                <View
                  style={[
                    styles.savingsRateBadge,
                    {
                      backgroundColor:
                        netSavings >= 0 ? theme.colors.successGlow : theme.colors.dangerGlow,
                      borderColor:
                        netSavings >= 0 ? theme.colors.successDark : theme.colors.dangerDark,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.savingsRateBadgeText,
                      {
                        color:
                          netSavings >= 0 ? theme.colors.successLight : theme.colors.dangerLight,
                      },
                    ]}
                  >
                    {savingsRate}% Savings Rate
                  </Text>
                </View>
              </View>
            </View>

            {/* Charts Component for Report Mode */}
            <ReportCharts
              reportMode={reportMode}
              selectedYM={selectedYM}
              selectedYear={selectedYear}
              totalIncome={totalIncome}
              totalExpense={totalExpense}
              netSavings={netSavings}
              categoriesData={categoryBreakdown}
              transactions={transactions}
              onSelectCategory={(cat) => setSelectedCategory(cat)}
            />
          </>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* Month Calendar Picker Modal */}
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
        periodLabel={reportMode === 'monthly' ? formatYearMonth(selectedYM) : `Annual ${selectedYear}`}
        transactions={transactions}
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
        initialType={editingTx?.type || 'expense'}
        editingTransaction={editingTx}
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
    paddingBottom: 10,
    backgroundColor: theme.colors.background,
  },
  headerSubtitle: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: theme.radii.sm,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  shareBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  viewModeContainer: {
    paddingHorizontal: 18,
    paddingBottom: 12,
  },
  viewModePillGroup: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceCard,
    padding: 4,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  viewModeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: theme.radii.sm,
  },
  viewModeBtnActive: {
    backgroundColor: theme.colors.primary,
  },
  viewModeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  viewModeBtnTextActive: {
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: theme.radii.sm,
    gap: 6,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  toggleBtnActiveExpense: {
    backgroundColor: 'rgba(244, 63, 94, 0.2)',
    borderColor: theme.colors.danger,
  },
  toggleBtnActiveIncome: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: theme.colors.success,
  },
  toggleBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  toggleBtnTextActive: {
    color: '#FFFFFF',
  },
  summaryCard: {
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radii.lg,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  summaryLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  entriesBadge: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  entriesBadgeText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: '700',
  },
  topCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  topCategoryText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  hintText: {
    fontSize: 11,
    color: theme.colors.textTertiary,
    fontStyle: 'italic',
  },
  categoryCard: {
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radii.md,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  categoryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  catIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  catName: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 2,
  },
  catPercent: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  categoryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  catAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.text,
  },
  progressBarTrack: {
    height: 5,
    backgroundColor: theme.colors.surface,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  reportPeriodRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceCard,
    padding: 4,
    borderRadius: theme.radii.md,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  periodBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: theme.radii.sm,
  },
  periodBtnActive: {
    backgroundColor: theme.colors.primary,
  },
  periodBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  periodBtnTextActive: {
    color: '#FFFFFF',
  },
  yearNavigator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    padding: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  yearBtn: {
    padding: 8,
    borderRadius: theme.radii.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  yearBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  yearText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
  },
  statementCard: {
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radii.lg,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  statementTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 14,
  },
  statementGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  statementGridItem: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    padding: 12,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statementItemLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  statementItemValue: {
    fontSize: 17,
    fontWeight: '800',
  },
  netSavingsBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: 12,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  netSavingsLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    marginBottom: 2,
  },
  netSavingsValue: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  savingsRateBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radii.xs,
    borderWidth: 1,
  },
  savingsRateBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
