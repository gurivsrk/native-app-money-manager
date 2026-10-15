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
              <Ionicons name="chevron-back" size={20} color="#0F172A" />
            </TouchableOpacity>

            <Text style={styles.monthLabel}>
              {MONTH_NAMES_FULL[month - 1]} {year}
            </Text>

            <TouchableOpacity
              style={styles.navBtn}
              onPress={handleNextMonth}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="chevron-forward" size={20} color="#0F172A" />
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
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
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
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '700',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  navBtn: {
    padding: 6,
    borderRadius: 8,
  },
  monthLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
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
    flex: 1, // Guaranteed 1/7th width per column
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'center',
  },
  weekdaySunday: {
    color: '#EF4444',
  },
  weekdaySaturday: {
    color: '#3B82F6',
  },
  dayCell: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellSelected: {
    backgroundColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  dayTextToday: {
    color: '#2563EB',
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 14,
  },
  todayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
  },
  todayBtnText: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '700',
  },
  cancelBtn: {
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  cancelBtnText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
});
