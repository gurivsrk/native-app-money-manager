import React, { useState, useMemo } from 'react';
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
import { useTheme } from '../context/ThemeContext';
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
import { Theme } from '../constants/theme';

type MainViewMode = 'insights' | 'reports';

export const AnalyticsScreen: React.FC = () => {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const {
    categories,
    accounts,
    transactions,
    formatAmount,
    activeCurrency,
    deleteTransaction,
  } = useBudget();

  // Top view mode: Insights vs Reports
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
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>Intelligence & Statements</Text>
          <Text style={styles.headerTitle}>Analytics</Text>
        </View>

        {viewMode === 'reports' && (
          <TouchableOpacity style={styles.shareBtn} onPress={handleShareReport} activeOpacity={0.8}>
            <Ionicons name="share-outline" size={16} color="#FFFFFF" />
            <Text style={styles.shareBtnText}>Export</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Apple iOS Native Segmented Control */}
      <View style={styles.segmentedContainer}>
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[styles.segmentBtn, viewMode === 'insights' && styles.segmentBtnActive]}
            onPress={() => setViewMode('insights')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="pie-chart"
              size={15}
              color={viewMode === 'insights' ? theme.colors.text : theme.colors.textSecondary}
            />
            <Text
              style={[styles.segmentText, viewMode === 'insights' && styles.segmentTextActive]}
            >
              Insights & Charts
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, viewMode === 'reports' && styles.segmentBtnActive]}
            onPress={() => setViewMode('reports')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="document-text"
              size={15}
              color={viewMode === 'reports' ? theme.colors.text : theme.colors.textSecondary}
            />
            <Text
              style={[styles.segmentText, viewMode === 'reports' && styles.segmentTextActive]}
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
        {viewMode === 'insights' ? (
          // ================= VIEW MODE 1: INSIGHTS & BREAKDOWN =================
          <>
            {/* Month Navigator */}
            <MonthCalendarBar
              selectedYearMonth={selectedYM}
              onChangeYearMonth={setSelectedYM}
              onOpenPicker={() => setPickerModalVisible(true)}
            />

            {/* Income / Expense Apple Filter Pills */}
            <View style={styles.typeFilterRow}>
              <TouchableOpacity
                style={[
                  styles.typeFilterBtn,
                  filterType === 'expense' && styles.typeFilterBtnExpense,
                ]}
                onPress={() => setFilterType('expense')}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="arrow-down-circle"
                  size={16}
                  color={filterType === 'expense' ? theme.colors.danger : theme.colors.textSecondary}
                />
                <Text
                  style={[
                    styles.typeFilterText,
                    filterType === 'expense' && styles.typeFilterTextExpense,
                  ]}
                >
                  Expenses
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeFilterBtn,
                  filterType === 'income' && styles.typeFilterBtnIncome,
                ]}
                onPress={() => setFilterType('income')}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="arrow-up-circle"
                  size={16}
                  color={filterType === 'income' ? theme.colors.success : theme.colors.textSecondary}
                />
                <Text
                  style={[
                    styles.typeFilterText,
                    filterType === 'income' && styles.typeFilterTextIncome,
                  ]}
                >
                  Income
                </Text>
              </TouchableOpacity>
            </View>

            {/* Total Hero Card */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryTop}>
                <View>
                  <Text style={styles.summaryLabel}>
                    Total {filterType === 'expense' ? 'Spending' : 'Income'} •{' '}
                    {formatYearMonth(selectedYM)}
                  </Text>
                  <Text
                    style={[
                      styles.summaryAmount,
                      { color: filterType === 'expense' ? theme.colors.danger : theme.colors.success },
                    ]}
                  >
                    {formatAmount(totalInsightsAmount)}
                  </Text>
                </View>
                <View style={styles.entriesBadge}>
                  <Text style={styles.entriesBadgeText}>
                    {filteredInsightsTxs.length} {filteredInsightsTxs.length === 1 ? 'txn' : 'txns'}
                  </Text>
                </View>
              </View>

              {categoryBreakdown.length > 0 && (
                <View style={styles.topCategoryRow}>
                  <Ionicons name="trophy-outline" size={14} color={theme.colors.warning} />
                  <Text style={styles.topCategoryText}>
                    Top Category:{' '}
                    <Text style={{ fontWeight: '700', color: theme.colors.text }}>
                      {categoryBreakdown[0].name} ({categoryBreakdown[0].percent}%)
                    </Text>
                  </Text>
                </View>
              )}
            </View>

            {/* Visual Charts Component */}
            {filteredInsightsTxs.length > 0 && (
              <ReportCharts
                reportMode="monthly"
                selectedYM={selectedYM}
                selectedYear={selectedYear}
                totalIncome={totalInsightsAmount}
                totalExpense={totalInsightsAmount}
                netSavings={0}
                categoriesData={categoryBreakdown}
                transactions={transactions}
                onSelectCategory={(cat) => setSelectedCategory(cat)}
              />
            )}

            {/* Category Drilldown Inset Group */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeader}>CATEGORY SPENDING BREAKDOWN</Text>
              <Text style={styles.sectionHint}>Tap for details</Text>
            </View>

            {categoryBreakdown.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="pie-chart-outline" size={36} color={theme.colors.textTertiary} />
                <Text style={styles.emptyTitle}>No transactions recorded</Text>
                <Text style={styles.emptySubtitle}>
                  Add {filterType} entries for {formatYearMonth(selectedYM)} to see distribution.
                </Text>
              </View>
            ) : (
              <View style={styles.groupedCard}>
                {categoryBreakdown.map((cat, index) => (
                  <React.Fragment key={cat.id}>
                    {index > 0 && <View style={styles.separator} />}
                    <TouchableOpacity
                      style={styles.categoryItem}
                      onPress={() => setSelectedCategory(cat)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.catIconBadge,
                          { backgroundColor: isDark ? `${cat.color}25` : `${cat.color}15` },
                        ]}
                      >
                        <Ionicons name={cat.icon as any} size={18} color={cat.color} />
                      </View>

                      <View style={styles.catInfo}>
                        <View style={styles.catTopRow}>
                          <Text style={styles.catName} numberOfLines={1}>
                            {cat.name}
                          </Text>
                          <Text style={styles.catAmount}>{formatAmount(cat.amount)}</Text>
                        </View>

                        <View style={styles.progressBarWrap}>
                          <View
                            style={[
                              styles.progressBarFill,
                              { width: `${cat.percent}%`, backgroundColor: cat.color },
                            ]}
                          />
                        </View>

                        <View style={styles.catMetaRow}>
                          <Text style={styles.catPercent}>{cat.percent}% of total</Text>
                          <Ionicons
                            name="chevron-forward"
                            size={14}
                            color={theme.colors.textTertiary}
                          />
                        </View>
                      </View>
                    </TouchableOpacity>
                  </React.Fragment>
                ))}
              </View>
            )}
          </>
        ) : (
          // ================= VIEW MODE 2: FINANCIAL REPORTS =================
          <>
            {/* Period Selector: Monthly vs Annual */}
            <View style={styles.typeFilterRow}>
              <TouchableOpacity
                style={[
                  styles.typeFilterBtn,
                  reportMode === 'monthly' && styles.typeFilterBtnSelected,
                ]}
                onPress={() => setReportMode('monthly')}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="calendar-outline"
                  size={15}
                  color={reportMode === 'monthly' ? theme.colors.primary : theme.colors.textSecondary}
                />
                <Text
                  style={[
                    styles.typeFilterText,
                    reportMode === 'monthly' && styles.typeFilterTextSelected,
                  ]}
                >
                  Monthly Summary
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeFilterBtn,
                  reportMode === 'yearly' && styles.typeFilterBtnSelected,
                ]}
                onPress={() => setReportMode('yearly')}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="calendar"
                  size={15}
                  color={reportMode === 'yearly' ? theme.colors.primary : theme.colors.textSecondary}
                />
                <Text
                  style={[
                    styles.typeFilterText,
                    reportMode === 'yearly' && styles.typeFilterTextSelected,
                  ]}
                >
                  Annual Summary
                </Text>
              </TouchableOpacity>
            </View>

            {/* Time Picker */}
            {reportMode === 'monthly' ? (
              <MonthCalendarBar
                selectedYearMonth={selectedYM}
                onChangeYearMonth={setSelectedYM}
                onOpenPicker={() => setPickerModalVisible(true)}
              />
            ) : (
              <View style={styles.yearPickerRow}>
                <TouchableOpacity
                  style={styles.yearArrowBtn}
                  onPress={() => setSelectedYear((y) => y - 1)}
                >
                  <Ionicons name="chevron-back" size={18} color={theme.colors.text} />
                </TouchableOpacity>

                <View style={styles.yearDisplayBadge}>
                  <Ionicons name="calendar-outline" size={15} color={theme.colors.primary} />
                  <Text style={styles.yearDisplayText}>Year {selectedYear}</Text>
                </View>

                <TouchableOpacity
                  style={styles.yearArrowBtn}
                  onPress={() => setSelectedYear((y) => y + 1)}
                >
                  <Ionicons name="chevron-forward" size={18} color={theme.colors.text} />
                </TouchableOpacity>
              </View>
            )}

            {/* Financial Overview Card */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>
                {reportMode === 'monthly'
                  ? `Financial Health • ${formatYearMonth(selectedYM)}`
                  : `Annual Financial Health • ${selectedYear}`}
              </Text>
              <Text style={styles.summaryAmount}>
                {netSavings >= 0 ? '+' : ''}
                {formatAmount(netSavings)}
              </Text>
              <Text style={styles.summarySub}>Net Balance Retained</Text>

              {/* 3 Metric Inset Badges */}
              <View style={styles.metricRow}>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>Income</Text>
                  <Text style={[styles.metricVal, { color: theme.colors.success }]}>
                    +{formatAmount(totalIncome)}
                  </Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>Expenses</Text>
                  <Text style={[styles.metricVal, { color: theme.colors.danger }]}>
                    -{formatAmount(totalExpense)}
                  </Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>Savings Rate</Text>
                  <Text style={[styles.metricVal, { color: theme.colors.primary }]}>
                    {savingsRate}%
                  </Text>
                </View>
              </View>
            </View>

            {/* Reports Charts & Trends */}
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
      </ScrollView>

      {/* Category Drilldown Modal */}
      {selectedCategory && (
        <CategoryTransactionsModal
          visible={!!selectedCategory}
          categoryData={selectedCategory}
          allTransactions={transactions}
          selectedYearMonth={selectedYM}
          accounts={accounts}
          onClose={() => setSelectedCategory(null)}
          onEditTransaction={handleEditTx}
          onDeleteTransaction={deleteTransaction}
        />
      )}

      {/* Edit Transaction Modal */}
      <AddTransactionModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        transactionToEdit={editingTx || undefined}
        initialType={editingTx?.type || 'expense'}
      />

      {/* Calendar Month Picker Modal */}
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
    shareBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.colors.primary,
      paddingVertical: 7,
      paddingHorizontal: 12,
      borderRadius: theme.radii.full,
    },
    shareBtnText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '600',
    },
    // Apple iOS Segmented Control
    segmentedContainer: {
      paddingHorizontal: 16,
      paddingVertical: 6,
    },
    segmentedControl: {
      flexDirection: 'row',
      backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA',
      padding: 3,
      borderRadius: theme.radii.sm,
    },
    segmentBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 7,
      borderRadius: theme.radii.xs,
    },
    segmentBtnActive: {
      backgroundColor: isDark ? '#636366' : '#FFFFFF',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.12,
      shadowRadius: 3,
      elevation: 2,
    },
    segmentText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    segmentTextActive: {
      color: isDark ? '#FFFFFF' : '#1C1C1E',
      fontWeight: '700',
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingBottom: 36,
    },
    // Type Filter Pills
    typeFilterRow: {
      flexDirection: 'row',
      gap: 10,
      marginVertical: 12,
    },
    typeFilterBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 9,
      borderRadius: theme.radii.md,
      backgroundColor: theme.colors.surfaceCard,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      ...theme.shadows.card,
    },
    typeFilterBtnExpense: {
      borderColor: theme.colors.danger,
      backgroundColor: isDark ? 'rgba(255, 69, 58, 0.15)' : 'rgba(255, 59, 48, 0.1)',
    },
    typeFilterBtnIncome: {
      borderColor: theme.colors.success,
      backgroundColor: isDark ? 'rgba(48, 209, 88, 0.15)' : 'rgba(52, 199, 89, 0.1)',
    },
    typeFilterBtnSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: isDark ? 'rgba(10, 132, 255, 0.15)' : 'rgba(0, 122, 255, 0.1)',
    },
    typeFilterText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    typeFilterTextExpense: {
      color: theme.colors.danger,
      fontWeight: '700',
    },
    typeFilterTextIncome: {
      color: theme.colors.success,
      fontWeight: '700',
    },
    typeFilterTextSelected: {
      color: theme.colors.primary,
      fontWeight: '700',
    },
    // Summary Card
    summaryCard: {
      backgroundColor: theme.colors.surfaceCard,
      borderRadius: theme.radii.lg,
      padding: 18,
      marginBottom: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      ...theme.shadows.card,
    },
    summaryTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    summaryLabel: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    summaryAmount: {
      fontSize: 32,
      fontWeight: '700',
      letterSpacing: -0.6,
    },
    summarySub: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    entriesBadge: {
      backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: theme.radii.sm,
    },
    entriesBadgeText: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    topCategoryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 12,
      paddingTop: 10,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border,
    },
    topCategoryText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    // Metric Row
    metricRow: {
      flexDirection: 'row',
      marginTop: 16,
      paddingTop: 14,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border,
    },
    metricBox: {
      flex: 1,
      alignItems: 'center',
    },
    metricLabel: {
      fontSize: 11,
      fontWeight: '500',
      color: theme.colors.textSecondary,
      marginBottom: 2,
    },
    metricVal: {
      fontSize: 14,
      fontWeight: '700',
    },
    metricDivider: {
      width: StyleSheet.hairlineWidth,
      height: 28,
      backgroundColor: theme.colors.border,
    },
    // Year Picker
    yearPickerRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 16,
      marginBottom: 14,
    },
    yearArrowBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.surfaceCard,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    },
    yearDisplayBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: theme.colors.surfaceCard,
      paddingVertical: 8,
      paddingHorizontal: 18,
      borderRadius: theme.radii.full,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    },
    yearDisplayText: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.text,
    },
    // Section Headers
    sectionHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 20,
      marginBottom: 8,
      paddingHorizontal: 4,
    },
    sectionHeader: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.textTertiary,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    sectionHint: {
      fontSize: 11,
      color: theme.colors.primary,
      fontWeight: '500',
    },
    groupedCard: {
      backgroundColor: theme.colors.surfaceCard,
      borderRadius: theme.radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      overflow: 'hidden',
      ...theme.shadows.card,
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.border,
      marginLeft: 58,
    },
    categoryItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 14,
    },
    catIconBadge: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    catInfo: {
      flex: 1,
    },
    catTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    catName: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.text,
      flex: 1,
      marginRight: 8,
    },
    catAmount: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.text,
    },
    progressBarWrap: {
      height: 5,
      backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA',
      borderRadius: 3,
      overflow: 'hidden',
      marginBottom: 4,
    },
    progressBarFill: {
      height: '100%',
      borderRadius: 3,
    },
    catMetaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    catPercent: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },
    emptyCard: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 36,
      paddingHorizontal: 20,
      backgroundColor: theme.colors.surfaceCard,
      borderRadius: theme.radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      ...theme.shadows.card,
    },
    emptyTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.text,
      marginTop: 10,
      marginBottom: 4,
    },
    emptySubtitle: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
  });
