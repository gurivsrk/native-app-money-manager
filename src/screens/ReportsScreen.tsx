import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Share,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBudget } from '../context/BudgetContext';
import { MonthCalendarBar } from '../components/MonthCalendarBar';
import { CalendarMonthPickerModal } from '../components/CalendarMonthPickerModal';

export const ReportsScreen: React.FC = () => {
  const { transactions, categories, accounts, formatAmount, activeCurrency } = useBudget();

  // Mode: 'monthly' | 'yearly'
  const [reportMode, setReportMode] = useState<'monthly' | 'yearly'>('monthly');

  // Selected Month ('YYYY-MM')
  const [selectedYM, setSelectedYM] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [pickerVisible, setPickerVisible] = useState(false);

  // Selected Year ('YYYY')
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());

  // Filter transactions based on reportMode
  const filteredTxs = transactions.filter((t) => {
    if (reportMode === 'monthly') {
      return t.date.startsWith(selectedYM);
    } else {
      return t.date.startsWith(String(selectedYear));
    }
  });

  const totalIncome = filteredTxs
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = filteredTxs
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

  // Breakdown by Category
  const expenseTxs = filteredTxs.filter((t) => t.type === 'expense');
  const catTotals: { [id: string]: number } = {};
  expenseTxs.forEach((t) => {
    if (t.categoryId) {
      catTotals[t.categoryId] = (catTotals[t.categoryId] || 0) + t.amount;
    }
  });

  const topCategories = Object.keys(catTotals)
    .map((catId) => {
      const cat = categories.find((c) => c.id === catId);
      const amount = catTotals[catId];
      const percent = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;
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

  // Export / Share report summary
  const handleShareReport = async () => {
    const periodLabel =
      reportMode === 'monthly' ? `Monthly Report (${selectedYM})` : `Annual Report (${selectedYear})`;

    const reportContent = `📊 ${periodLabel}
💰 Net Worth Currency: ${activeCurrency.name} (${activeCurrency.code})
-----------------------------------------
📈 Total Income: ${formatAmount(totalIncome)}
📉 Total Expenses: ${formatAmount(totalExpense)}
💵 Net Savings: ${formatAmount(netSavings)} (${savingsRate}%)
-----------------------------------------
Top Spending Categories:
${topCategories.map((c) => `• ${c.name}: ${formatAmount(c.amount)} (${c.percent}%)`).join('\n')}
-----------------------------------------
Generated with Money Manager App`;

    try {
      if (Platform.OS === 'web') {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(reportContent);
          alert('Report summary copied to clipboard!');
        } else {
          alert(reportContent);
        }
      } else {
        await Share.share({
          message: reportContent,
          title: periodLabel,
        });
      }
    } catch {
      // Ignored
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>Audit & Statements</Text>
          <Text style={styles.headerTitle}>Financial Reports</Text>
        </View>
        <TouchableOpacity style={styles.shareBtn} onPress={handleShareReport}>
          <Ionicons name="share-social-outline" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Toggle Mode: Monthly vs Yearly */}
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeBtn, reportMode === 'monthly' && styles.modeBtnActive]}
            onPress={() => setReportMode('monthly')}
          >
            <Ionicons
              name="calendar-outline"
              size={16}
              color={reportMode === 'monthly' ? '#FFFFFF' : '#64748B'}
            />
            <Text style={[styles.modeText, reportMode === 'monthly' && styles.modeTextActive]}>
              Monthly Report
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeBtn, reportMode === 'yearly' && styles.modeBtnActive]}
            onPress={() => setReportMode('yearly')}
          >
            <Ionicons
              name="stats-chart-outline"
              size={16}
              color={reportMode === 'yearly' ? '#FFFFFF' : '#64748B'}
            />
            <Text style={[styles.modeText, reportMode === 'yearly' && styles.modeTextActive]}>
              Yearly Report
            </Text>
          </TouchableOpacity>
        </View>

        {/* Date Navigator */}
        {reportMode === 'monthly' ? (
          <MonthCalendarBar
            selectedYearMonth={selectedYM}
            onChangeYearMonth={setSelectedYM}
            onOpenPicker={() => setPickerVisible(true)}
          />
        ) : (
          <View style={styles.yearNavigator}>
            <TouchableOpacity
              style={styles.yearNavBtn}
              onPress={() => setSelectedYear(selectedYear - 1)}
            >
              <Ionicons name="chevron-back" size={20} color="#94A3B8" />
            </TouchableOpacity>
            <Text style={styles.yearTitle}>Annual Overview ({selectedYear})</Text>
            <TouchableOpacity
              style={styles.yearNavBtn}
              onPress={() => setSelectedYear(selectedYear + 1)}
            >
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        )}

        {/* P&L Statement Card */}
        <View style={styles.statementCard}>
          <Text style={styles.statementTitle}>Profit & Loss Statement</Text>
          <Text style={styles.statementPeriod}>
            Period:{' '}
            <Text style={{ fontWeight: '700', color: '#FFFFFF' }}>
              {reportMode === 'monthly' ? selectedYM : selectedYear}
            </Text>
          </Text>

          <View style={styles.statementTable}>
            <View style={styles.tableRow}>
              <View style={styles.tableLabelWrap}>
                <Ionicons name="arrow-up-circle" size={18} color="#10B981" />
                <Text style={styles.tableLabel}>Total Gross Income</Text>
              </View>
              <Text style={[styles.tableValue, { color: '#10B981' }]}>
                +{formatAmount(totalIncome)}
              </Text>
            </View>

            <View style={styles.tableRow}>
              <View style={styles.tableLabelWrap}>
                <Ionicons name="arrow-down-circle" size={18} color="#EF4444" />
                <Text style={styles.tableLabel}>Total Expenses</Text>
              </View>
              <Text style={[styles.tableValue, { color: '#EF4444' }]}>
                -{formatAmount(totalExpense)}
              </Text>
            </View>

            <View style={[styles.tableRow, styles.tableRowHighlight]}>
              <View style={styles.tableLabelWrap}>
                <Ionicons name="shield-checkmark" size={18} color="#3B82F6" />
                <Text style={styles.tableLabelHighlight}>Net Savings / Balance</Text>
              </View>
              <Text
                style={[
                  styles.tableValueHighlight,
                  { color: netSavings >= 0 ? '#10B981' : '#EF4444' },
                ]}
              >
                {formatAmount(netSavings)}
              </Text>
            </View>
          </View>

          <View style={styles.metricBanner}>
            <Text style={styles.metricBannerText}>Savings Rate:</Text>
            <View style={styles.metricPill}>
              <Text style={styles.metricPillText}>{savingsRate}% of income saved</Text>
            </View>
          </View>
        </View>

        {/* Top Spending Categories */}
        <Text style={styles.sectionHeading}>Expenses by Category</Text>
        {topCategories.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="documents-outline" size={42} color="#CBD5E1" />
            <Text style={styles.emptyBoxText}>No transactions recorded for this period.</Text>
          </View>
        ) : (
          topCategories.map((cat) => (
            <View key={cat.id} style={styles.reportCatRow}>
              <View style={[styles.catIconCircle, { backgroundColor: cat.color }]}>
                <Ionicons name={cat.icon} size={18} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.catNameRow}>
                  <Text style={styles.catRowTitle}>{cat.name}</Text>
                  <Text style={styles.catRowAmt}>{formatAmount(cat.amount)}</Text>
                </View>
                <View style={styles.barTrack}>
                  <View
                    style={[styles.barFill, { width: `${cat.percent}%`, backgroundColor: cat.color }]}
                  />
                </View>
              </View>
              <Text style={styles.catPercentBadge}>{cat.percent}%</Text>
            </View>
          ))
        )}

        {/* Account Distribution */}
        <Text style={styles.sectionHeading}>Active Accounts Position</Text>
        <View style={styles.accountPositionList}>
          {accounts.map((acc) => (
            <View key={acc.id} style={styles.accPositionItem}>
              <View style={[styles.accMiniIcon, { backgroundColor: acc.color }]}>
                <Ionicons name={(acc.icon as any) || 'card-outline'} size={15} color="#FFFFFF" />
              </View>
              <Text style={styles.accPositionName}>{acc.name}</Text>
              <Text style={styles.accPositionBal}>{formatAmount(acc.balance)}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Month Picker Modal */}
      <CalendarMonthPickerModal
        visible={pickerVisible}
        currentYearMonth={selectedYM}
        onSelect={setSelectedYM}
        onClose={() => setPickerVisible(false)}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  shareBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 24,
    minHeight: '100%',
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  modeBtnActive: {
    backgroundColor: '#2563EB',
  },
  modeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  modeTextActive: {
    color: '#FFFFFF',
  },
  yearNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  yearNavBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  yearTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  statementCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  statementTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statementPeriod: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 16,
  },
  statementTable: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  tableRowHighlight: {
    borderTopWidth: 1,
    borderTopColor: '#334155',
    marginTop: 6,
    paddingTop: 12,
  },
  tableLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tableLabel: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  tableValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  tableLabelHighlight: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  tableValueHighlight: {
    fontSize: 17,
    fontWeight: '800',
  },
  metricBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricBannerText: {
    color: '#94A3B8',
    fontSize: 13,
  },
  metricPill: {
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  metricPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  reportCatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 12,
  },
  catIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  catRowTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  catRowAmt: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  barTrack: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  catPercentBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  accountPositionList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  accPositionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },
  accMiniIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accPositionName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  accPositionBal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyBoxText: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 8,
  },
});
