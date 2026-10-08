import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  visible: boolean;
  currentDate: string; // 'YYYY-MM-DD'
  onSelectDate: (dateStr: string) => void;
  onClose: () => void;
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const FullDatePickerModal: React.FC<Props> = ({
  visible,
  currentDate,
  onSelectDate,
  onClose,
}) => {
  // Parse initial date
  const initialParts = (currentDate || new Date().toISOString().substring(0, 10)).split('-');
  const initialYear = parseInt(initialParts[0], 10) || new Date().getFullYear();
  const initialMonth = parseInt(initialParts[1], 10) || new Date().getMonth() + 1;
  const initialDay = parseInt(initialParts[2], 10) || new Date().getDate();

  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth); // 1-12
  const [selectedDay, setSelectedDay] = useState(initialDay);

  // Month navigation
  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  // Days in month calculation
  const daysInCurrentMonth = new Date(year, month, 0).getDate();
  const firstDayWeekday = new Date(year, month - 1, 1).getDay(); // 0 for Sun, 1 for Mon...

  const daysGrid: (number | null)[] = [];
  for (let i = 0; i < firstDayWeekday; i++) {
    daysGrid.push(null);
  }
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    daysGrid.push(d);
  }

  const handleSelectDay = (day: number) => {
    setSelectedDay(day);
    const mm = String(month).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    onSelectDate(`${year}-${mm}-${dd}`);
    onClose();
  };

  const handlePickToday = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth() + 1;
    const d = today.getDate();
    setYear(y);
    setMonth(m);
    setSelectedDay(d);
    const mm = String(m).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    onSelectDate(`${y}-${mm}-${dd}`);
    onClose();
  };

  const isSelected = (day: number) => {
    return (
      day === selectedDay &&
      month === initialMonth &&
      year === initialYear
    );
  };

  const isToday = (day: number) => {
    const now = new Date();
    return (
      now.getFullYear() === year &&
      now.getMonth() + 1 === month &&
      now.getDate() === day
    );
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Select Date</Text>
              <Text style={styles.headerSubtitle}>
                {MONTH_NAMES[month - 1]} {year}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Month & Year Navigator */}
          <View style={styles.navRow}>
            <TouchableOpacity
              style={styles.navBtn}
              onPress={handlePrevMonth}
            >
              <Ionicons name="chevron-back" size={20} color="#0F172A" />
            </TouchableOpacity>

            <Text style={styles.monthLabel}>
              {MONTH_NAMES[month - 1]} {year}
            </Text>

            <TouchableOpacity
              style={styles.navBtn}
              onPress={handleNextMonth}
            >
              <Ionicons name="chevron-forward" size={20} color="#0F172A" />
            </TouchableOpacity>
          </View>

          {/* Weekday Names */}
          <View style={styles.weekdaysRow}>
            {DAYS_OF_WEEK.map((d) => (
              <Text key={d} style={styles.weekdayText}>
                {d}
              </Text>
            ))}
          </View>

          {/* Days Grid */}
          <View style={styles.daysGrid}>
            {daysGrid.map((day, index) => {
              if (day === null) {
                return <View key={`empty-${index}`} style={styles.dayCellEmpty} />;
              }

              const selected = isSelected(day);
              const today = isToday(day);

              return (
                <TouchableOpacity
                  key={`day-${day}`}
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
              );
            })}
          </View>

          {/* Quick Actions */}
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
    );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 99999,
    elevation: 30,
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
    color: '#64748B',
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
    marginBottom: 16,
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
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekdayText: {
    width: 38,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  dayCellEmpty: {
    width: 38,
    height: 38,
    marginVertical: 3,
  },
  dayCell: {
    width: 38,
    height: 38,
    marginVertical: 3,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellSelected: {
    backgroundColor: '#2563EB',
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
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
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
  },
  todayBtnText: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '700',
  },
  cancelBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  cancelBtnText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
});
