import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Transaction, Account, Category } from '../types';
import { useBudget } from '../context/BudgetContext';
import { useTheme } from '../context/ThemeContext';
import { formatDateWithWeekday } from '../utils/dateUtils';
import { Theme } from '../constants/theme';

interface Props {
  transaction: Transaction;
  accounts: Account[];
  categories: Category[];
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (id: string) => void;
}

export const TransactionCard: React.FC<Props> = ({
  transaction,
  accounts,
  categories,
  onEdit,
  onDelete,
}) => {
  const { formatAmount } = useBudget();
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const getDetails = () => {
    if (transaction.type === 'transfer') {
      const fromAcc = accounts.find((a) => a.id === transaction.fromAccountId);
      const toAcc = accounts.find((a) => a.id === transaction.toAccountId);
      return {
        title: 'Account Transfer',
        subtitle: `${fromAcc?.name || 'Account'} → ${toAcc?.name || 'Account'}`,
        color: theme.colors.primary,
        icon: 'swap-horizontal',
        amountPrefix: '',
      };
    }

    const cat = categories.find((c) => c.id === transaction.categoryId);
    const acc = accounts.find((a) => a.id === transaction.accountId);

    if (transaction.type === 'income') {
      return {
        title: cat?.name || 'Income',
        subtitle: `${acc?.name || 'Account'}${transaction.note ? ' • ' + transaction.note : ''}`,
        color: theme.colors.success,
        icon: (cat?.icon as any) || 'arrow-up-circle',
        amountPrefix: '+',
      };
    }

    // Expense
    return {
      title: cat?.name || 'Expense',
      subtitle: `${acc?.name || 'Account'}${transaction.note ? ' • ' + transaction.note : ''}`,
      color: theme.colors.danger,
      icon: (cat?.icon as any) || 'arrow-down-circle',
      amountPrefix: '-',
    };
  };

  const details = getDetails();

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.clickableArea}
        onPress={() => onEdit && onEdit(transaction)}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.iconWrap,
            {
              backgroundColor: isDark ? `${details.color}25` : `${details.color}15`,
            },
          ]}
        >
          <Ionicons name={details.icon as any} size={20} color={details.color} />
        </View>

        <View style={styles.contentWrap}>
          <Text style={styles.title} numberOfLines={1}>
            {details.title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {details.subtitle}
          </Text>
          <Text style={styles.dateText}>{formatDateWithWeekday(transaction.date)}</Text>
        </View>

        <View style={styles.rightWrap}>
          <Text
            style={[
              styles.amount,
              {
                color:
                  details.amountPrefix === '+'
                    ? theme.colors.success
                    : details.amountPrefix === '-'
                    ? theme.colors.text
                    : theme.colors.primary,
              },
            ]}
          >
            {details.amountPrefix}
            {formatAmount(transaction.amount)}
          </Text>
        </View>
      </TouchableOpacity>

      <View style={styles.actionButtons}>
        {onEdit && (
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => onEdit(transaction)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="pencil" size={14} color={theme.colors.textTertiary} />
          </TouchableOpacity>
        )}
        {onDelete && (
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => onDelete(transaction.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={14} color={theme.colors.danger} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const createStyles = (theme: Theme, isDark: boolean) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceCard,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: theme.radii.lg,
      marginBottom: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      ...theme.shadows.card,
    },
    clickableArea: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    contentWrap: {
      flex: 1,
      marginRight: 8,
    },
    title: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.text,
      letterSpacing: -0.2,
      marginBottom: 2,
    },
    subtitle: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginBottom: 2,
    },
    dateText: {
      fontSize: 11,
      color: theme.colors.textTertiary,
      fontWeight: '500',
    },
    rightWrap: {
      alignItems: 'flex-end',
      marginRight: 8,
    },
    amount: {
      fontSize: 15,
      fontWeight: '700',
      letterSpacing: -0.2,
    },
    actionButtons: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderLeftWidth: StyleSheet.hairlineWidth,
      borderLeftColor: theme.colors.border,
      paddingLeft: 8,
    },
    iconBtn: {
      padding: 6,
      borderRadius: theme.radii.sm,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
    },
  });
