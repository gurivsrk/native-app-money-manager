import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { useTheme } from '../context/ThemeContext';
import { Theme } from '../constants/theme';

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
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

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
        <Ionicons name="chevron-back" size={17} color={theme.colors.textSecondary} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.centerBtn}
        onPress={onOpenPicker}
        activeOpacity={0.7}
      >
        <Ionicons name="calendar-outline" size={15} color={theme.colors.primary} />
        <Text style={styles.monthText}>{formattedDisplay}</Text>
        <Ionicons name="chevron-down" size={13} color={theme.colors.textTertiary} />
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
          <Ionicons name="chevron-forward" size={17} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const createStyles = (theme: Theme, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.surfaceCard,
      borderRadius: theme.radii.lg,
      paddingHorizontal: 8,
      paddingVertical: 6,
      marginBottom: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      ...theme.shadows.card,
    },
    navBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
    },
    centerBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: theme.radii.full,
      backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
    },
    monthText: {
      color: theme.colors.text,
      fontSize: 14,
      fontWeight: '600',
      letterSpacing: -0.2,
    },
    rightGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    todayPill: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: theme.radii.full,
    },
    todayText: {
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: '700',
    },
  });
