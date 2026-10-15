import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Transaction, Account, Category } from '../types';
import { useBudget } from '../context/BudgetContext';
import { formatDateWithWeekday } from '../utils/dateUtils';
import { theme } from '../constants/theme';

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
              backgroundColor: `${details.color}18`,
              borderColor: `${details.color}35`,
            },
          ]}
        >
          <Ionicons name={details.icon as any} size={21} color={details.color} />
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
                    ? theme.colors.successLight
                    : details.amountPrefix === '-'
                    ? theme.colors.dangerLight
                    : theme.colors.primaryLight,
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
            <Ionicons name="pencil-outline" size={16} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        )}
        {onDelete && (
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => onDelete(transaction.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={16} color={theme.colors.danger} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceCard,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: theme.radii.md,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  clickableArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
  },
  contentWrap: {
    flex: 1,
    paddingRight: 6,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 2,
    letterSpacing: -0.2,
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
    marginRight: 10,
  },
  amount: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderLeftWidth: 1,
    borderLeftColor: theme.colors.border,
    paddingLeft: 8,
  },
  iconBtn: {
    padding: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
});
