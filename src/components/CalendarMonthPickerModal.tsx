import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs, { MONTH_NAMES_FULL } from '../utils/dateUtils';

interface Props {
  visible: boolean;
  currentYearMonth: string; // 'YYYY-MM'
  onSelect: (ym: string) => void;
  onClose: () => void;
}

export const CalendarMonthPickerModal: React.FC<Props> = ({
  visible,
  currentYearMonth,
  onSelect,
  onClose,
}) => {
  const currentYmDate = dayjs(`${currentYearMonth}-01`);

  const [currentYear, setCurrentYear] = useState(() => {
    return currentYmDate.isValid() ? currentYmDate.year() : dayjs().year();
  });

  const prevVisibleRef = React.useRef(false);

  useEffect(() => {
    if (!prevVisibleRef.current && visible) {
      const parsed = dayjs(`${currentYearMonth}-01`);
      setCurrentYear(parsed.isValid() ? parsed.year() : dayjs().year());
    }
    prevVisibleRef.current = visible;
  }, [visible, currentYearMonth]);

  const selectedMonth = currentYmDate.isValid() ? currentYmDate.month() + 1 : 1;
  const selectedYear = currentYmDate.isValid() ? currentYmDate.year() : dayjs().year();

  const handleSelectMonth = (monthIndex: number) => {
    const mm = String(monthIndex + 1).padStart(2, '0');
    onSelect(`${currentYear}-${mm}`);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Select Month & Year</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Year Navigator */}
          <View style={styles.yearRow}>
            <TouchableOpacity
              style={styles.yearNavBtn}
              onPress={() => setCurrentYear((y) => y - 1)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="chevron-back" size={20} color="#0F172A" />
            </TouchableOpacity>
            <Text style={styles.yearText}>{currentYear}</Text>
            <TouchableOpacity
              style={styles.yearNavBtn}
              onPress={() => setCurrentYear((y) => y + 1)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="chevron-forward" size={20} color="#0F172A" />
            </TouchableOpacity>
          </View>

          {/* 12 Months Grid */}
          <View style={styles.monthsGrid}>
            {MONTH_NAMES_FULL.map((name, idx) => {
              const isSelected = currentYear === selectedYear && idx + 1 === selectedMonth;
              const isNow =
                dayjs().year() === currentYear && dayjs().month() === idx;

              return (
                <TouchableOpacity
                  key={name}
                  style={[
                    styles.monthItem,
                    isSelected && styles.monthItemSelected,
                    isNow && !isSelected && styles.monthItemNow,
                  ]}
                  onPress={() => handleSelectMonth(idx)}
                >
                  <Text
                    style={[
                      styles.monthText,
                      isSelected && styles.monthTextSelected,
                      isNow && !isSelected && styles.monthTextNow,
                    ]}
                  >
                    {name.substring(0, 3)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 4,
  },
  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 8,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  yearNavBtn: {
    padding: 6,
  },
  yearText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  monthItem: {
    width: '23%',
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  monthItemSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  monthItemNow: {
    borderColor: '#93C5FD',
    backgroundColor: '#EFF6FF',
  },
  monthText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  monthTextSelected: {
    color: '#FFFFFF',
  },
  monthTextNow: {
    color: '#2563EB',
  },
});
