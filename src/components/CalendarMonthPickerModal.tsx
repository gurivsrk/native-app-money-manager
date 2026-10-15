import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs, { MONTH_NAMES_FULL } from '../utils/dateUtils';
import { useTheme } from '../context/ThemeContext';
import { Theme } from '../constants/theme';

interface Props {
  visible: boolean;
  currentYearMonth?: string;
  selectedYearMonth?: string;
  onSelect?: (ym: string) => void;
  onSelectYearMonth?: (ym: string) => void;
  onClose: () => void;
}

export const CalendarMonthPickerModal: React.FC<Props> = ({
  visible,
  currentYearMonth,
  selectedYearMonth,
  onSelect,
  onSelectYearMonth,
  onClose,
}) => {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const activeYM = selectedYearMonth || currentYearMonth || dayjs().format('YYYY-MM');
  const currentYmDate = dayjs(`${activeYM}-01`);

  const [currentYear, setCurrentYear] = useState(() => {
    return currentYmDate.isValid() ? currentYmDate.year() : dayjs().year();
  });

  const prevVisibleRef = useRef(false);

  useEffect(() => {
    if (!prevVisibleRef.current && visible) {
      const parsed = dayjs(`${activeYM}-01`);
      setCurrentYear(parsed.isValid() ? parsed.year() : dayjs().year());
    }
    prevVisibleRef.current = visible;
  }, [visible, activeYM]);

  const selectedMonth = currentYmDate.isValid() ? currentYmDate.month() + 1 : 1;
  const selectedYear = currentYmDate.isValid() ? currentYmDate.year() : dayjs().year();

  const handleSelectMonth = (monthIndex: number) => {
    const mm = String(monthIndex + 1).padStart(2, '0');
    const newYM = `${currentYear}-${mm}`;
    if (onSelect) onSelect(newYM);
    if (onSelectYearMonth) onSelectYearMonth(newYM);
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
              <Ionicons name="close" size={18} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Year Navigator (Apple Style) */}
          <View style={styles.yearRow}>
            <TouchableOpacity
              style={styles.yearNavBtn}
              onPress={() => setCurrentYear((y) => y - 1)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="chevron-back" size={18} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.yearText}>{currentYear}</Text>
            <TouchableOpacity
              style={styles.yearNavBtn}
              onPress={() => setCurrentYear((y) => y + 1)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="chevron-forward" size={18} color={theme.colors.text} />
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

const createStyles = (theme: Theme, isDark: boolean) =>
  StyleSheet.create({
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
      backgroundColor: theme.colors.surfaceCard,
      borderRadius: theme.radii.xl,
      padding: 20,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      ...theme.shadows.card,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 14,
    },
    title: {
      fontSize: 17,
      fontWeight: '700',
      color: theme.colors.text,
      letterSpacing: -0.2,
    },
    closeBtn: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA',
      alignItems: 'center',
      justifyContent: 'center',
    },
    yearRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
      borderRadius: theme.radii.md,
      paddingVertical: 8,
      paddingHorizontal: 12,
      marginBottom: 16,
    },
    yearNavBtn: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
    },
    yearText: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.text,
    },
    monthsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      justifyContent: 'space-between',
    },
    monthItem: {
      width: '30%',
      paddingVertical: 12,
      borderRadius: theme.radii.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
    },
    monthItemSelected: {
      backgroundColor: theme.colors.primary,
    },
    monthItemNow: {
      borderWidth: 1.5,
      borderColor: theme.colors.primary,
    },
    monthText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
    },
    monthTextSelected: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    monthTextNow: {
      color: theme.colors.primary,
      fontWeight: '700',
    },
  });
