import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Transaction } from '../types';
import { useBudget } from '../context/BudgetContext';
import { MONTH_NAMES_SHORT } from '../utils/dateUtils';
import { CategoryModalData } from './CategoryTransactionsModal';
import { theme } from '../constants/theme';

interface Props {
  reportMode: 'monthly' | 'yearly';
  selectedYM: string; // 'YYYY-MM'
  selectedYear: number;
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  categoriesData: CategoryModalData[];
  transactions: Transaction[];
  onSelectCategory?: (category: CategoryModalData) => void;
}

type ChartTab = 'distribution' | 'comparison' | 'trend';

export const ReportCharts: React.FC<Props> = ({
  reportMode,
  selectedYM,
  selectedYear,
  totalIncome,
  totalExpense,
  netSavings,
  categoriesData,
  transactions,
  onSelectCategory,
}) => {
  const { formatAmount } = useBudget();
  const [activeTab, setActiveTab] = useState<ChartTab>('distribution');
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number | null>(null);

  // --- Calculation for Weekly Trend (Monthly Mode) ---
  const weeklyData = React.useMemo(() => {
    if (reportMode !== 'monthly') return [];

    const weeks = [
      { label: 'W1 (1-7)', minDay: 1, maxDay: 7, expense: 0, income: 0 },
      { label: 'W2 (8-14)', minDay: 8, maxDay: 14, expense: 0, income: 0 },
      { label: 'W3 (15-21)', minDay: 15, maxDay: 21, expense: 0, income: 0 },
      { label: 'W4 (22-28)', minDay: 22, maxDay: 28, expense: 0, income: 0 },
      { label: 'W5 (29+)', minDay: 29, maxDay: 31, expense: 0, income: 0 },
    ];

    transactions.forEach((tx) => {
      if (tx.date.startsWith(selectedYM)) {
        const parts = tx.date.split('-');
        const day = parseInt(parts[2], 10);
        const targetWeek = weeks.find((w) => day >= w.minDay && day <= w.maxDay);
        if (targetWeek) {
          if (tx.type === 'expense') {
            targetWeek.expense += tx.amount;
          } else if (tx.type === 'income') {
            targetWeek.income += tx.amount;
          }
        }
      }
    });

    const maxWeeklyExpense = Math.max(...weeks.map((w) => w.expense), 1);
    return weeks.map((w) => ({
      ...w,
      ratio: w.expense / maxWeeklyExpense,
    }));
  }, [reportMode, selectedYM, transactions]);

  // --- Calculation for 12-Month Trend (Yearly Mode) ---
  const yearlyData = React.useMemo(() => {
    if (reportMode !== 'yearly') return [];

    const months = Array.from({ length: 12 }, (_, i) => {
      const monthNum = String(i + 1).padStart(2, '0');
      return {
        monthIndex: i,
        name: MONTH_NAMES_SHORT[i],
        ym: `${selectedYear}-${monthNum}`,
        income: 0,
        expense: 0,
        net: 0,
      };
    });

    transactions.forEach((tx) => {
      if (tx.date.startsWith(String(selectedYear))) {
        const parts = tx.date.split('-');
        const m = parseInt(parts[1], 10) - 1;
        if (m >= 0 && m < 12) {
          if (tx.type === 'income') {
            months[m].income += tx.amount;
          } else if (tx.type === 'expense') {
            months[m].expense += tx.amount;
          }
        }
      }
    });

    months.forEach((m) => {
      m.net = m.income - m.expense;
    });

    const maxVal = Math.max(
      ...months.map((m) => Math.max(m.income, m.expense)),
      1
    );

    return months.map((m) => ({
      ...m,
      expenseRatio: m.expense / maxVal,
      incomeRatio: m.income / maxVal,
    }));
  }, [reportMode, selectedYear, transactions]);

  // Comparison Bar Max
  const comparisonMax = Math.max(totalIncome, totalExpense, 1);

  return (
    <View style={styles.chartCard}>
      {/* Chart Title & Mode Tabs */}
      <View style={styles.chartHeader}>
        <View style={styles.titleWithIcon}>
          <Ionicons name="bar-chart" size={18} color="#3B82F6" />
          <Text style={styles.chartTitle}>Visual Analytics</Text>
        </View>

        <View style={styles.tabGroup}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'distribution' && styles.tabBtnActive]}
            onPress={() => setActiveTab('distribution')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'distribution' && styles.tabBtnTextActive]}>
              Categories
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'comparison' && styles.tabBtnActive]}
            onPress={() => setActiveTab('comparison')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'comparison' && styles.tabBtnTextActive]}>
              Comparison
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'trend' && styles.tabBtnActive]}
            onPress={() => setActiveTab('trend')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'trend' && styles.tabBtnTextActive]}>
              Trend
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* TAB 1: CATEGORY PROPORTIONAL DISTRIBUTION */}
      {activeTab === 'distribution' && (
        <View style={styles.tabContent}>
          <Text style={styles.subHeading}>Category Expense Share</Text>

          {categoriesData.length === 0 ? (
            <View style={styles.emptyChart}>
              <Ionicons name="pie-chart-outline" size={36} color="#CBD5E1" />
              <Text style={styles.emptyChartText}>No expense data to visualize</Text>
            </View>
          ) : (
            <>
              {/* Segmented Proportional Bar */}
              <View style={styles.segmentedBar}>
                {categoriesData.map((cat) => {
                  const percent = cat.percent || 0;
                  if (percent <= 0) return null;
                  return (
                    <View
                      key={cat.id}
                      style={[
                        styles.segment,
                        {
                          width: `${percent}%`,
                          backgroundColor: cat.color,
                        },
                      ]}
                    />
                  );
                })}
              </View>

              {/* Category Pills with click to view entries */}
              <View style={styles.legendGrid}>
                {categoriesData.slice(0, 6).map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={styles.legendItem}
                    onPress={() => onSelectCategory && onSelectCategory(cat)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.legendDot, { backgroundColor: cat.color }]} />
                    <View style={styles.legendInfo}>
                      <View style={styles.legendTop}>
                        <Text style={styles.legendName} numberOfLines={1}>
                          {cat.name}
                        </Text>
                        <Text style={styles.legendPercent}>{cat.percent}%</Text>
                      </View>
                      <Text style={styles.legendAmount}>{formatAmount(cat.amount)}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.tapPrompt}>
                💡 Tap any category to inspect its transactions
              </Text>
            </>
          )}
        </View>
      )}

      {/* TAB 2: INCOME VS EXPENSE COMPARISON */}
      {activeTab === 'comparison' && (
        <View style={styles.tabContent}>
          <Text style={styles.subHeading}>Cash Flow Comparison</Text>

          <View style={styles.comparisonBarsRow}>
            {/* Income Bar */}
            <View style={styles.comparisonBarCol}>
              <Text style={styles.barValueText}>+{formatAmount(totalIncome)}</Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFillVertical,
                    {
                      height: `${Math.max(12, Math.round((totalIncome / comparisonMax) * 100))}%`,
                      backgroundColor: '#10B981',
                    },
                  ]}
                />
              </View>
              <View style={styles.barLabelWrap}>
                <View style={[styles.miniDot, { backgroundColor: '#10B981' }]} />
                <Text style={styles.barLabelText}>Income</Text>
              </View>
            </View>

            {/* Expense Bar */}
            <View style={styles.comparisonBarCol}>
              <Text style={styles.barValueText}>-{formatAmount(totalExpense)}</Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFillVertical,
                    {
                      height: `${Math.max(12, Math.round((totalExpense / comparisonMax) * 100))}%`,
                      backgroundColor: '#EF4444',
                    },
                  ]}
                />
              </View>
              <View style={styles.barLabelWrap}>
                <View style={[styles.miniDot, { backgroundColor: '#EF4444' }]} />
                <Text style={styles.barLabelText}>Expense</Text>
              </View>
            </View>

            {/* Net Savings Bar */}
            <View style={styles.comparisonBarCol}>
              <Text
                style={[
                  styles.barValueText,
                  { color: netSavings >= 0 ? '#10B981' : '#EF4444' },
                ]}
              >
                {formatAmount(netSavings)}
              </Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFillVertical,
                    {
                      height: `${Math.max(12, Math.round((Math.abs(netSavings) / comparisonMax) * 100))}%`,
                      backgroundColor: netSavings >= 0 ? '#3B82F6' : '#F97316',
                    },
                  ]}
                />
              </View>
              <View style={styles.barLabelWrap}>
                <View
                  style={[
                    styles.miniDot,
                    { backgroundColor: netSavings >= 0 ? '#3B82F6' : '#F97316' },
                  ]}
                />
                <Text style={styles.barLabelText}>Net</Text>
              </View>
            </View>
          </View>

          {/* Cashflow Summary pill */}
          <View style={styles.cashflowPill}>
            <Ionicons
              name={netSavings >= 0 ? 'trending-up' : 'trending-down'}
              size={18}
              color={netSavings >= 0 ? '#10B981' : '#EF4444'}
            />
            <Text style={styles.cashflowPillText}>
              {netSavings >= 0
                ? `Net Surplus of ${formatAmount(netSavings)} for this period`
                : `Net Deficit of ${formatAmount(Math.abs(netSavings))} for this period`}
            </Text>
          </View>
        </View>
      )}

      {/* TAB 3: SPENDING TREND */}
      {activeTab === 'trend' && (
        <View style={styles.tabContent}>
          {reportMode === 'monthly' ? (
            <>
              <Text style={styles.subHeading}>Weekly Spending Trend ({selectedYM})</Text>
              <View style={styles.trendChartContainer}>
                {weeklyData.map((week, idx) => (
                  <View key={`week-${idx}`} style={styles.trendBarCol}>
                    <Text style={styles.trendValText}>{formatAmount(week.expense)}</Text>
                    <View style={styles.trendBarTrack}>
                      <View
                        style={[
                          styles.trendBarFill,
                          {
                            height: `${Math.max(10, Math.round(week.ratio * 100))}%`,
                            backgroundColor: week.ratio === 1 && week.expense > 0 ? '#EF4444' : '#3B82F6',
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.trendColLabel}>{week.label}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.trendFooterNote}>
                Showing weekly spending distribution across the month.
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.subHeading}>12-Month Cash Flow ({selectedYear})</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.annualTrendRow}>
                  {yearlyData.map((m) => {
                    const isSelected = selectedMonthIndex === m.monthIndex;
                    return (
                      <TouchableOpacity
                        key={m.ym}
                        style={[
                          styles.annualCol,
                          isSelected && styles.annualColSelected,
                        ]}
                        onPress={() => setSelectedMonthIndex(isSelected ? null : m.monthIndex)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.annualBarsTrack}>
                          {/* Income bar */}
                          <View
                            style={[
                              styles.annualMiniBar,
                              {
                                height: `${Math.max(4, Math.round(m.incomeRatio * 100))}%`,
                                backgroundColor: '#10B981',
                              },
                            ]}
                          />
                          {/* Expense bar */}
                          <View
                            style={[
                              styles.annualMiniBar,
                              {
                                height: `${Math.max(4, Math.round(m.expenseRatio * 100))}%`,
                                backgroundColor: '#EF4444',
                              },
                            ]}
                          />
                        </View>
                        <Text
                          style={[
                            styles.annualMonthText,
                            isSelected && styles.annualMonthTextSelected,
                          ]}
                        >
                          {m.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>

              {/* Selected Month Tooltip */}
              {selectedMonthIndex !== null && yearlyData[selectedMonthIndex] && (
                <View style={styles.monthDetailCard}>
                  <Text style={styles.monthDetailTitle}>
                    {yearlyData[selectedMonthIndex].name} {selectedYear} Breakdown:
                  </Text>
                  <View style={styles.monthDetailRow}>
                    <Text style={{ color: '#10B981', fontWeight: '700', fontSize: 13 }}>
                      Income: +{formatAmount(yearlyData[selectedMonthIndex].income)}
                    </Text>
                    <Text style={{ color: '#EF4444', fontWeight: '700', fontSize: 13 }}>
                      Expense: -{formatAmount(yearlyData[selectedMonthIndex].expense)}
                    </Text>
                  </View>
                </View>
              )}

              <View style={styles.legendRowSimple}>
                <View style={styles.legendItemSimple}>
                  <View style={[styles.miniDot, { backgroundColor: '#10B981' }]} />
                  <Text style={styles.legendSimpleText}>Income</Text>
                </View>
                <View style={styles.legendItemSimple}>
                  <View style={[styles.miniDot, { backgroundColor: '#EF4444' }]} />
                  <Text style={styles.legendSimpleText}>Expense</Text>
                </View>
                <Text style={styles.legendHint}>Tap any month to see figures</Text>
              </View>
            </>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  chartCard: {
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radii.lg,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
  },
  tabGroup: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.sm,
    padding: 3,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tabBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
  },
  tabBtnActive: {
    backgroundColor: theme.colors.primary,
  },
  tabBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
  },
  tabContent: {
    marginTop: 4,
  },
  subHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    marginBottom: 12,
  },
  segmentedBar: {
    height: 14,
    borderRadius: 7,
    flexDirection: 'row',
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
    marginBottom: 16,
  },
  segment: {
    height: '100%',
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '48%',
    backgroundColor: theme.colors.surface,
    padding: 8,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendInfo: {
    flex: 1,
  },
  legendTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legendName: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text,
    flex: 1,
    marginRight: 4,
  },
  legendPercent: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.primaryLight,
  },
  legendAmount: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    marginTop: 1,
  },
  tapPrompt: {
    fontSize: 11,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
  comparisonBarsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 150,
    paddingTop: 10,
    paddingBottom: 6,
  },
  comparisonBarCol: {
    alignItems: 'center',
    width: 80,
  },
  barValueText: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  barTrack: {
    width: 32,
    height: 95,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFillVertical: {
    width: '100%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  barLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  miniDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  barLabelText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  cashflowPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.sm,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cashflowPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text,
  },
  trendChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    paddingTop: 8,
  },
  trendBarCol: {
    flex: 1,
    alignItems: 'center',
  },
  trendValText: {
    fontSize: 9,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  trendBarTrack: {
    width: 24,
    height: 85,
    backgroundColor: theme.colors.surface,
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  trendBarFill: {
    width: '100%',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  trendColLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    marginTop: 6,
  },
  trendFooterNote: {
    fontSize: 11,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    marginTop: 10,
  },
  annualTrendRow: {
    flexDirection: 'row',
    gap: 10,
    height: 140,
    alignItems: 'flex-end',
    paddingVertical: 6,
  },
  annualCol: {
    alignItems: 'center',
    width: 38,
    padding: 3,
    borderRadius: 8,
  },
  annualColSelected: {
    backgroundColor: theme.colors.primaryGlow,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  annualBarsTrack: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 90,
  },
  annualMiniBar: {
    width: 8,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  annualMonthText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    marginTop: 6,
  },
  annualMonthTextSelected: {
    color: theme.colors.primaryLight,
    fontWeight: '800',
  },
  monthDetailCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  monthDetailTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  monthDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendRowSimple: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingHorizontal: 4,
  },
  legendItemSimple: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendSimpleText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  legendHint: {
    fontSize: 10,
    color: theme.colors.textTertiary,
    fontStyle: 'italic',
  },
  emptyChart: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  emptyChartText: {
    fontSize: 13,
    color: theme.colors.textTertiary,
    marginTop: 8,
  },
});
