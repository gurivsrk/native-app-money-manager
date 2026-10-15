import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';

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
      >
        <Ionicons name="chevron-back" size={20} color="#94A3B8" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.centerBtn}
        onPress={onOpenPicker}
        activeOpacity={0.7}
      >
        <Ionicons name="calendar-outline" size={16} color="#3B82F6" />
        <Text style={styles.monthText}>{formattedDisplay}</Text>
        <Ionicons name="chevron-down" size={14} color="#94A3B8" />
      </TouchableOpacity>

      <View style={styles.rightGroup}>
        {!isCurrentMonth() && (
          <TouchableOpacity style={styles.todayPill} onPress={handleResetToCurrent}>
            <Text style={styles.todayText}>Today</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.navBtn}
          onPress={handleNext}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
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
    backgroundColor: '#1E293B',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  navBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  centerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  monthText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  todayPill: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  todayText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
