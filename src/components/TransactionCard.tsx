import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Transaction, Account, Category } from '../types';
import { useBudget } from '../context/BudgetContext';

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
        color: '#3B82F6',
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
        color: '#10B981',
        icon: (cat?.icon as any) || 'arrow-up-circle',
        amountPrefix: '+',
      };
    }

    // Expense
    return {
      title: cat?.name || 'Expense',
      subtitle: `${acc?.name || 'Account'}${transaction.note ? ' • ' + transaction.note : ''}`,
      color: '#EF4444',
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
        <View style={[styles.iconWrap, { backgroundColor: `${details.color}15` }]}>
          <Ionicons name={details.icon as any} size={22} color={details.color} />
        </View>

        <View style={styles.contentWrap}>
          <Text style={styles.title}>{details.title}</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {details.subtitle}
          </Text>
          <Text style={styles.dateText}>{transaction.date}</Text>
        </View>

        <View style={styles.rightWrap}>
          <Text
            style={[
              styles.amount,
              { color: details.amountPrefix === '+' ? '#10B981' : details.amountPrefix === '-' ? '#EF4444' : '#3B82F6' },
            ]}
          >
            {details.amountPrefix}{formatAmount(transaction.amount)}
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
            <Ionicons name="pencil-outline" size={17} color="#64748B" />
          </TouchableOpacity>
        )}
        {onDelete && (
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => onDelete(transaction.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={17} color="#EF4444" />
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
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  clickableArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contentWrap: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 2,
  },
  dateText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  rightWrap: {
    alignItems: 'flex-end',
    marginRight: 8,
  },
  amount: {
    fontSize: 15,
    fontWeight: '800',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderLeftWidth: 1,
    borderLeftColor: '#F1F5F9',
    paddingLeft: 8,
  },
  iconBtn: {
    padding: 4,
  },
});
