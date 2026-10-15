import React, { useState, useMemo } from 'react';
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
import { useTheme } from '../context/ThemeContext';
import { MONTH_NAMES_SHORT } from '../utils/dateUtils';
import { CategoryModalData } from './CategoryTransactionsModal';
import { Theme } from '../constants/theme';

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
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const [activeTab, setActiveTab] = useState<ChartTab>('distribution');
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number | null>(null);

  // --- Calculation for Weekly Trend (Monthly Mode) ---
  const weeklyData = useMemo(() => {
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
  const yearlyData = useMemo(() => {
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
      {/* Chart Title & Apple Segmented Tab */}
      <View style={styles.chartHeader}>
        <View style={styles.titleWithIcon}>
          <Ionicons name="bar-chart" size={17} color={theme.colors.primary} />
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
              Compare
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
              <Ionicons name="pie-chart-outline" size={32} color={theme.colors.textTertiary} />
              <Text style={styles.emptyChartText}>No expense data to visualize</Text>
            </View>
          ) : (
            <>
              {/* Segmented Proportional Bar (Apple Fitness Style) */}
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

              {/* Category Pills */}
              <View style={styles.legendGrid}>
                {categoriesData.slice(0, 8).map((cat) => (
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
              <Text style={styles.tapPrompt}>Tap any category above to view itemized entries</Text>
            </>
          )}
        </View>
      )}

      {/* TAB 2: INCOME VS EXPENSE COMPARISON */}
      {activeTab === 'comparison' && (
        <View style={styles.tabContent}>
          <Text style={styles.subHeading}>Cash In vs Cash Out</Text>

          <View style={styles.comparisonBarsRow}>
            {/* Income Bar */}
            <View style={styles.comparisonBarCol}>
              <Text style={styles.barValueText}>{formatAmount(totalIncome)}</Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFillVertical,
                    {
                      height: `${Math.round((totalIncome / comparisonMax) * 100)}%`,
                      backgroundColor: theme.colors.success,
                    },
                  ]}
                />
              </View>
              <View style={styles.barLabelWrap}>
                <View style={[styles.miniDot, { backgroundColor: theme.colors.success }]} />
                <Text style={styles.barLabelText}>Income</Text>
              </View>
            </View>

            {/* Expense Bar */}
            <View style={styles.comparisonBarCol}>
              <Text style={styles.barValueText}>{formatAmount(totalExpense)}</Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFillVertical,
                    {
                      height: `${Math.round((totalExpense / comparisonMax) * 100)}%`,
                      backgroundColor: theme.colors.danger,
                    },
                  ]}
                />
              </View>
              <View style={styles.barLabelWrap}>
                <View style={[styles.miniDot, { backgroundColor: theme.colors.danger }]} />
                <Text style={styles.barLabelText}>Expense</Text>
              </View>
            </View>

            {/* Net Savings Bar */}
            <View style={styles.comparisonBarCol}>
              <Text style={styles.barValueText}>{formatAmount(Math.abs(netSavings))}</Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFillVertical,
                    {
                      height: `${Math.round((Math.abs(netSavings) / comparisonMax) * 100)}%`,
                      backgroundColor:
                        netSavings >= 0 ? theme.colors.primary : theme.colors.warning,
                    },
                  ]}
                />
              </View>
              <View style={styles.barLabelWrap}>
                <View
                  style={[
                    styles.miniDot,
                    {
                      backgroundColor:
                        netSavings >= 0 ? theme.colors.primary : theme.colors.warning,
                    },
                  ]}
                />
                <Text style={styles.barLabelText}>
                  {netSavings >= 0 ? 'Saved' : 'Deficit'}
                </Text>
              </View>
            </View>
          </View>

          {/* Cashflow Summary Pill */}
          <View style={styles.cashflowPill}>
            <Ionicons
              name={netSavings >= 0 ? 'trending-up' : 'trending-down'}
              size={16}
              color={netSavings >= 0 ? theme.colors.success : theme.colors.danger}
            />
            <Text style={styles.cashflowPillText}>
              {netSavings >= 0
                ? `Net Positive: Retained ${formatAmount(netSavings)} this period`
                : `Net Deficit: Spent ${formatAmount(Math.abs(netSavings))} more than earned`}
            </Text>
          </View>
        </View>
      )}

      {/* TAB 3: TEMPORAL TREND (WEEKLY OR 12-MONTH) */}
      {activeTab === 'trend' && (
        <View style={styles.tabContent}>
          <Text style={styles.subHeading}>
            {reportMode === 'monthly' ? 'Weekly Spending Progression' : '12-Month Expense Trend'}
          </Text>

          {reportMode === 'monthly' ? (
            // Weekly Breakdown (Monthly Mode)
            <View style={styles.trendChartContainer}>
              {weeklyData.map((week, idx) => (
                <View key={idx} style={styles.trendBarCol}>
                  <Text style={styles.trendValText}>
                    {week.expense > 0 ? formatAmount(week.expense) : '$0'}
                  </Text>
                  <View style={styles.trendBarTrack}>
                    <View
                      style={[
                        styles.trendBarFill,
                        {
                          height: `${Math.max(12, Math.round(week.ratio * 100))}%`,
                          backgroundColor:
                            week.expense > 0 ? theme.colors.primary : theme.colors.border,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.trendWeekLabel}>{week.label.split(' ')[0]}</Text>
                </View>
              ))}
            </View>
          ) : (
            // 12-Month Annual Trend
            <>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.annualTrendScroll}
              >
                {yearlyData.map((item) => {
                  const isSelected = selectedMonthIndex === item.monthIndex;
                  return (
                    <TouchableOpacity
                      key={item.monthIndex}
                      style={[
                        styles.annualMonthCol,
                        isSelected && styles.annualMonthColSelected,
                      ]}
                      onPress={() =>
                        setSelectedMonthIndex(isSelected ? null : item.monthIndex)
                      }
                      activeOpacity={0.8}
                    >
                      <View style={styles.annualDualTrack}>
                        {/* Income mini bar */}
                        <View
                          style={[
                            styles.annualMiniBar,
                            {
                              height: `${Math.max(8, Math.round(item.incomeRatio * 100))}%`,
                              backgroundColor: theme.colors.success,
                            },
                          ]}
                        />
                        {/* Expense mini bar */}
                        <View
                          style={[
                            styles.annualMiniBar,
                            {
                              height: `${Math.max(8, Math.round(item.expenseRatio * 100))}%`,
                              backgroundColor: theme.colors.danger,
                            },
                          ]}
                        />
                      </View>
                      <Text
                        style={[
                          styles.annualMonthLabel,
                          isSelected && styles.annualMonthLabelSelected,
                        ]}
                      >
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Selected Month Detail Callout */}
              {selectedMonthIndex !== null && (
                <View style={styles.monthCallout}>
                  <Text style={styles.monthCalloutTitle}>
                    {MONTH_NAMES_SHORT[selectedMonthIndex]} {selectedYear} Breakdown:
                  </Text>
                  <View style={styles.monthCalloutStats}>
                    <Text style={{ color: theme.colors.success, fontWeight: '700', fontSize: 12 }}>
                      +{formatAmount(yearlyData[selectedMonthIndex].income)} Income
                    </Text>
                    <Text style={{ color: theme.colors.danger, fontWeight: '700', fontSize: 12 }}>
                      -{formatAmount(yearlyData[selectedMonthIndex].expense)} Spent
                    </Text>
                    <Text
                      style={{
                        color:
                          yearlyData[selectedMonthIndex].net >= 0
                            ? theme.colors.primary
                            : theme.colors.warning,
                        fontWeight: '700',
                        fontSize: 12,
                      }}
                    >
                      {yearlyData[selectedMonthIndex].net >= 0 ? '+' : ''}
                      {formatAmount(yearlyData[selectedMonthIndex].net)} Net
                    </Text>
                  </View>
                </View>
              )}
            </>
          )}
        </View>
      )}
    </View>
  );
};

const createStyles = (theme: Theme, isDark: boolean) =>
  StyleSheet.create({
    chartCard: {
      backgroundColor: theme.colors.surfaceCard,
      borderRadius: theme.radii.lg,
      padding: 16,
      marginBottom: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      ...theme.shadows.card,
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
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.text,
      letterSpacing: -0.2,
    },
    tabGroup: {
      flexDirection: 'row',
      backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA',
      borderRadius: theme.radii.xs,
      padding: 2,
    },
    tabBtn: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: theme.radii.xs - 1,
    },
    tabBtnActive: {
      backgroundColor: isDark ? '#636366' : '#FFFFFF',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    tabBtnText: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    tabBtnTextActive: {
      color: isDark ? '#FFFFFF' : '#1C1C1E',
      fontWeight: '700',
    },
    tabContent: {
      marginTop: 2,
    },
    subHeading: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      marginBottom: 10,
    },
    segmentedBar: {
      height: 12,
      borderRadius: 6,
      flexDirection: 'row',
      overflow: 'hidden',
      backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA',
      marginBottom: 14,
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
      backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
      padding: 8,
      borderRadius: theme.radii.sm,
    },
    legendDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
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
      fontWeight: '600',
      color: theme.colors.text,
      flex: 1,
      marginRight: 4,
    },
    legendPercent: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    legendAmount: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      fontWeight: '500',
      marginTop: 1,
    },
    tapPrompt: {
      fontSize: 11,
      color: theme.colors.textTertiary,
      textAlign: 'center',
      marginTop: 10,
    },
    comparisonBarsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'flex-end',
      height: 140,
      paddingTop: 8,
      paddingBottom: 4,
    },
    comparisonBarCol: {
      alignItems: 'center',
      width: 76,
    },
    barValueText: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 4,
      textAlign: 'center',
    },
    barTrack: {
      width: 28,
      height: 90,
      backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA',
      borderRadius: 6,
      justifyContent: 'flex-end',
      overflow: 'hidden',
    },
    barFillVertical: {
      width: '100%',
      borderRadius: 6,
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
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    cashflowPill: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
      borderRadius: theme.radii.sm,
      paddingVertical: 8,
      paddingHorizontal: 12,
      marginTop: 12,
    },
    cashflowPillText: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.text,
      textAlign: 'center',
    },
    trendChartContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      height: 130,
      paddingTop: 6,
    },
    trendBarCol: {
      flex: 1,
      alignItems: 'center',
    },
    trendValText: {
      fontSize: 9,
      fontWeight: '600',
      color: theme.colors.textTertiary,
      marginBottom: 4,
    },
    trendBarTrack: {
      width: 20,
      height: 80,
      backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA',
      borderRadius: 5,
      justifyContent: 'flex-end',
      overflow: 'hidden',
    },
    trendBarFill: {
      width: '100%',
      borderRadius: 5,
    },
    trendWeekLabel: {
      fontSize: 10,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      marginTop: 6,
    },
    annualTrendScroll: {
      paddingVertical: 8,
      gap: 12,
    },
    annualMonthCol: {
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: theme.radii.sm,
      backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
    },
    annualMonthColSelected: {
      backgroundColor: isDark ? '#3A3A3C' : '#E5E5EA',
      borderWidth: 1,
      borderColor: theme.colors.primary,
    },
    annualDualTrack: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 3,
      height: 70,
      width: 22,
      justifyContent: 'center',
    },
    annualMiniBar: {
      width: 9,
      borderRadius: 3,
    },
    annualMonthLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      marginTop: 6,
    },
    annualMonthLabelSelected: {
      color: theme.colors.primary,
      fontWeight: '700',
    },
    monthCallout: {
      backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
      borderRadius: theme.radii.sm,
      padding: 10,
      marginTop: 10,
    },
    monthCalloutTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 4,
    },
    monthCalloutStats: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    emptyChart: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 24,
    },
    emptyChartText: {
      fontSize: 12,
      color: theme.colors.textTertiary,
      marginTop: 6,
    },
  });
