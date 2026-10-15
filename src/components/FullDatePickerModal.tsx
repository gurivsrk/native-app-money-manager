import React, { useState, useEffect } from 'react';
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
import { theme } from '../constants/theme';

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
  const initial = dayjs(currentDate || undefined);

  const [year, setYear] = useState(initial.year());
  const [month, setMonth] = useState(initial.month() + 1); // 1-12
  const [selectedDay, setSelectedDay] = useState(initial.date());

  const prevVisibleRef = React.useRef(false);

  // Sync state whenever modal freshly opens or currentDate prop changes
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

  // Month navigation
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

  // Days in month calculation via dayjs
  const monthStart = dayjs(`${year}-${String(month).padStart(2, '0')}-01`);
  const daysInCurrentMonth = monthStart.daysInMonth();
  const firstDayWeekday = monthStart.day(); // 0=Sun, 1=Mon, ..., 6=Sat

  // Build grid of days
  const flatDays: (number | null)[] = [];
  for (let i = 0; i < firstDayWeekday; i++) {
    flatDays.push(null);
  }
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    flatDays.push(d);
  }

  // Group into exact 7-day rows to strictly avoid any flex-wrap pixel wrapping bugs
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
              <Text style={styles.headerSubtitle}>
                {previewFormatted}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Month & Year Navigator */}
          <View style={styles.navRow}>
            <TouchableOpacity
              style={styles.navBtn}
              onPress={handlePrevMonth}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="chevron-back" size={20} color={theme.colors.text} />
            </TouchableOpacity>

            <Text style={styles.monthLabel}>
              {MONTH_NAMES_FULL[month - 1]} {year}
            </Text>

            <TouchableOpacity
              style={styles.navBtn}
              onPress={handleNextMonth}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="chevron-forward" size={20} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          {/* Calendar Table Container */}
          <View style={styles.calendarContainer}>
            {/* Weekday Names Header: Exact 7 equal columns */}
            <View style={styles.weekdaysRow}>
              {WEEKDAYS_SHORT.map((d, idx) => (
                <View key={d} style={styles.dayCol}>
                  <Text
                    style={[
                      styles.weekdayText,
                      idx === 0 && styles.weekdaySunday, // Sunday hint
                      idx === 6 && styles.weekdaySaturday, // Saturday hint
                    ]}
                  >
                    {d}
                  </Text>
                </View>
              ))}
            </View>

            {/* Weeks: Exact 7 cells per row */}
            {weeks.map((week, weekIndex) => (
              <View key={`week-${weekIndex}`} style={styles.weekRow}>
                {week.map((day, dayIndex) => {
                  if (day === null) {
                    return <View key={`empty-${weekIndex}-${dayIndex}`} style={styles.dayCol} />;
                  }

                  const selected = isSelected(day);
                  const today = isToday(day);

                  return (
                    <View key={`day-${day}`} style={styles.dayCol}>
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

          {/* Quick Actions Footer */}
          <View style={styles.footerRow}>
            <TouchableOpacity style={styles.todayBtn} onPress={handlePickToday}>
              <Ionicons name="today-outline" size={16} color="#2563EB" />
              <Text style={styles.todayBtnText}>Pick Today</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: theme.colors.backdrop,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radii.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: theme.colors.primaryLight,
    fontWeight: '700',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.sm,
    paddingHorizontal: 8,
    paddingVertical: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  navBtn: {
    padding: 6,
    borderRadius: 8,
  },
  monthLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
  },
  calendarContainer: {
    width: '100%',
    marginBottom: 14,
  },
  weekdaysRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  dayCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  weekdaySunday: {
    color: theme.colors.dangerLight,
  },
  weekdaySaturday: {
    color: theme.colors.primaryLight,
  },
  dayCell: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellSelected: {
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryGlow,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  dayTextToday: {
    color: theme.colors.primaryLight,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 14,
  },
  todayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.primaryGlow,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  todayBtnText: {
    color: theme.colors.primaryLight,
    fontSize: 13,
    fontWeight: '700',
  },
  cancelBtn: {
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  cancelBtnText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
});
