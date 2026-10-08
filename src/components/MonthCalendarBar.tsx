import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
  const [yearStr, monthStr] = selectedYearMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10); // 1-12

  const dateObj = new Date(year, month - 1, 1);
  const formattedDisplay = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });

  const isCurrentMonth = () => {
    const now = new Date();
    return now.getFullYear() === year && now.getMonth() + 1 === month;
  };

  const handlePrev = () => {
    let newYear = year;
    let newMonth = month - 1;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    const ym = `${newYear}-${String(newMonth).padStart(2, '0')}`;
    onChangeYearMonth(ym);
  };

  const handleNext = () => {
    let newYear = year;
    let newMonth = month + 1;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    const ym = `${newYear}-${String(newMonth).padStart(2, '0')}`;
    onChangeYearMonth(ym);
  };

  const handleResetToCurrent = () => {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    onChangeYearMonth(ym);
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
