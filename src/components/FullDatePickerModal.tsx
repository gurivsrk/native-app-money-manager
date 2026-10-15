import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs, {
  WEEKDAYS_SHORT,
  MONTH_NAMES_FULL,
  formatDateWithWeekday,
} from '../utils/dateUtils';
import { useTheme } from '../context/ThemeContext';
import { Theme } from '../constants/theme';

interface Props {
  visible: boolean;
  currentDate: string; // 'YYYY-MM-DD'
  onSelectDate: (dateStr: string) => void;
  onClose: () => void;
}

export const FullDatePickerModal: React.FC<Props> = ({
  visible,
  currentDate,
  onSelectDate,
  onClose,
}) => {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const initial = dayjs(currentDate || undefined);

  const [year, setYear] = useState(initial.year());
  const [month, setMonth] = useState(initial.month() + 1); // 1-12
  const [selectedDay, setSelectedDay] = useState(initial.date());

  const prevVisibleRef = useRef(false);

  useEffect(() => {
    const justOpened = !prevVisibleRef.current && visible;
    prevVisibleRef.current = visible;

    if (justOpened && visible) {
      const parsed = dayjs(currentDate || undefined);
      setYear(parsed.year());
      setMonth(parsed.month() + 1);
      setSelectedDay(parsed.date());
    }
  }, [visible, currentDate]);

  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const monthStart = dayjs(`${year}-${String(month).padStart(2, '0')}-01`);
  const daysInCurrentMonth = monthStart.daysInMonth();
  const firstDayWeekday = monthStart.day(); // 0=Sun, 1=Mon, ..., 6=Sat

  const flatDays: (number | null)[] = [];
  for (let i = 0; i < firstDayWeekday; i++) {
    flatDays.push(null);
  }
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    flatDays.push(d);
  }

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < flatDays.length; i += 7) {
    const week = flatDays.slice(i, i + 7);
    while (week.length < 7) {
      week.push(null);
    }
    weeks.push(week);
  }

  const handleSelectDay = (day: number) => {
    setSelectedDay(day);
    const mm = String(month).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    onSelectDate(`${year}-${mm}-${dd}`);
    onClose();
  };

  const handlePickToday = () => {
    const today = dayjs();
    setYear(today.year());
    setMonth(today.month() + 1);
    setSelectedDay(today.date());
    onSelectDate(today.format('YYYY-MM-DD'));
    onClose();
  };

  const isSelected = (day: number) => {
    if (!currentDate) return false;
    const cellDate = dayjs(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
    return dayjs(currentDate).isSame(cellDate, 'day');
  };

  const isToday = (day: number) => {
    const cellDate = dayjs(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
    return dayjs().isSame(cellDate, 'day');
  };

  const previewDateStr = `${year}-${String(month).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
  const previewFormatted = formatDateWithWeekday(previewDateStr);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Select Date</Text>
              <Text style={styles.headerSubtitle}>{previewFormatted}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={18} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Month & Year Navigator */}
          <View style={styles.monthNavRow}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.navArrowBtn}>
              <Ionicons name="chevron-back" size={18} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.monthLabel}>
              {MONTH_NAMES_FULL[month - 1]} {year}
            </Text>
            <TouchableOpacity onPress={handleNextMonth} style={styles.navArrowBtn}>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarContainer}>
            <View style={styles.weekdaysRow}>
              {WEEKDAYS_SHORT.map((wd, i) => (
                <View key={i} style={styles.dayCol}>
                  <Text
                    style={[
                      styles.weekdayText,
                      i === 0 && styles.weekdaySunday,
                      i === 6 && styles.weekdaySaturday,
                    ]}
                  >
                    {wd}
                  </Text>
                </View>
              ))}
            </View>

            {weeks.map((week, wIdx) => (
              <View key={wIdx} style={styles.weekRow}>
                {week.map((day, dIdx) => {
                  if (day === null) {
                    return <View key={dIdx} style={styles.dayCol} />;
                  }

                  const selected = isSelected(day);
                  const today = isToday(day);

                  return (
                    <View key={dIdx} style={styles.dayCol}>
                      <TouchableOpacity
                        style={[
                          styles.dayCell,
                          selected && styles.dayCellSelected,
                          today && !selected && styles.dayCellToday,
                        ]}
                        onPress={() => handleSelectDay(day)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.dayText,
                            selected && styles.dayTextSelected,
                            today && !selected && styles.dayTextToday,
                          ]}
                        >
                          {day}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>

          {/* Footer Controls */}
          <View style={styles.footerRow}>
            <TouchableOpacity style={styles.todayBtn} onPress={handlePickToday}>
              <Ionicons name="today" size={14} color={theme.colors.primary} />
              <Text style={styles.todayBtnText}>Today</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (theme: Theme, isDark: boolean) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: theme.colors.backdrop,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    card: {
      width: '100%',
      maxWidth: 360,
      backgroundColor: theme.colors.surfaceCard,
      borderRadius: theme.radii.xl,
      padding: 18,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      ...theme.shadows.card,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: theme.colors.text,
      letterSpacing: -0.2,
    },
    headerSubtitle: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    closeBtn: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA',
      alignItems: 'center',
      justifyContent: 'center',
    },
    monthNavRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
      borderRadius: theme.radii.md,
      paddingVertical: 6,
      paddingHorizontal: 10,
      marginBottom: 14,
    },
    navArrowBtn: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
    },
    monthLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.text,
    },
    calendarContainer: {
      width: '100%',
      marginBottom: 12,
    },
    weekdaysRow: {
      flexDirection: 'row',
      marginBottom: 6,
    },
    weekRow: {
      flexDirection: 'row',
      marginBottom: 4,
    },
    dayCol: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    weekdayText: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.textTertiary,
      textAlign: 'center',
    },
    weekdaySunday: {
      color: theme.colors.danger,
    },
    weekdaySaturday: {
      color: theme.colors.primary,
    },
    dayCell: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayCellSelected: {
      backgroundColor: theme.colors.primary,
    },
    dayCellToday: {
      borderWidth: 1.5,
      borderColor: theme.colors.primary,
    },
    dayText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.text,
    },
    dayTextSelected: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    dayTextToday: {
      color: theme.colors.primary,
      fontWeight: '700',
    },
    footerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border,
      paddingTop: 12,
    },
    todayBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 6,
      paddingHorizontal: 12,
      backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
      borderRadius: theme.radii.full,
    },
    todayBtnText: {
      color: theme.colors.primary,
      fontSize: 12,
      fontWeight: '600',
    },
    cancelBtn: {
      paddingVertical: 6,
      paddingHorizontal: 12,
    },
    cancelBtnText: {
      color: theme.colors.primary,
      fontSize: 14,
      fontWeight: '600',
    },
  });
