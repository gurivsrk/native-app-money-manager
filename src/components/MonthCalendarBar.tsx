import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { theme } from '../constants/theme';

interface Props {
  selectedYearMonth: string; // 'YYYY-MM'
  onChangeYearMonth: (ym: string) => void;
  onOpenPicker?: () => void;
}

export const MonthCalendarBar: React.FC<Props> = ({
  selectedYearMonth,
  onChangeYearMonth,
  onOpenPicker,
}) => {
  const currentMonthDate = dayjs(`${selectedYearMonth}-01`);
  const formattedDisplay = currentMonthDate.isValid()
    ? currentMonthDate.format('MMMM YYYY')
    : selectedYearMonth;

  const isCurrentMonth = () => {
    return currentMonthDate.isSame(dayjs(), 'month');
  };

  const handlePrev = () => {
    const prev = currentMonthDate.subtract(1, 'month').format('YYYY-MM');
    onChangeYearMonth(prev);
  };

  const handleNext = () => {
    const next = currentMonthDate.add(1, 'month').format('YYYY-MM');
    onChangeYearMonth(next);
  };

  const handleResetToCurrent = () => {
    onChangeYearMonth(dayjs().format('YYYY-MM'));
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.navBtn}
        onPress={handlePrev}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        activeOpacity={0.7}
      >
        <Ionicons name="chevron-back" size={18} color={theme.colors.textSecondary} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.centerBtn}
        onPress={onOpenPicker}
        activeOpacity={0.7}
      >
        <Ionicons name="calendar-outline" size={15} color={theme.colors.primaryLight} />
        <Text style={styles.monthText}>{formattedDisplay}</Text>
        <Ionicons name="chevron-down" size={13} color={theme.colors.textSecondary} />
      </TouchableOpacity>

      <View style={styles.rightGroup}>
        {!isCurrentMonth() && (
          <TouchableOpacity
            style={styles.todayPill}
            onPress={handleResetToCurrent}
            activeOpacity={0.8}
          >
            <Text style={styles.todayText}>Today</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.navBtn}
          onPress={handleNext}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 2,
  },
  navBtn: {
    padding: 7,
    borderRadius: theme.radii.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  centerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.primaryGlow,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  monthText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  todayPill: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: theme.radii.xs,
  },
  todayText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
