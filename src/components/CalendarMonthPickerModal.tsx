import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs, { MONTH_NAMES_FULL } from '../utils/dateUtils';
import { theme } from '../constants/theme';

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
              <Ionicons name="chevron-back" size={20} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.yearText}>{currentYear}</Text>
            <TouchableOpacity
              style={styles.yearNavBtn}
              onPress={() => setCurrentYear((y) => y + 1)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="chevron-forward" size={20} color={theme.colors.text} />
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
    backgroundColor: theme.colors.backdrop,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radii.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
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
    fontWeight: '800',
    color: theme.colors.text,
  },
  closeBtn: {
    padding: 4,
  },
  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.sm,
    paddingVertical: 8,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  yearNavBtn: {
    padding: 6,
  },
  yearText: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
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
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  monthItemSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primaryLight,
  },
  monthItemNow: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryGlow,
  },
  monthText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  monthTextSelected: {
    color: '#FFFFFF',
  },
  monthTextNow: {
    color: theme.colors.primaryLight,
  },
});
