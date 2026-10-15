import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBudget } from '../context/BudgetContext';
import { Account } from '../types';
import { theme } from '../constants/theme';

export const AccountsScreen: React.FC = () => {
  const { accounts, addAccount, updateAccount, deleteAccount, formatAmount, activeCurrency } =
    useBudget();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [type, setType] = useState<Account['type']>('bank');

  const openAddModal = () => {
    setEditingAccount(null);
    setName('');
    setBalance('');
    setType('bank');
    setModalVisible(true);
  };

  const openEditModal = (acc: Account) => {
    setEditingAccount(acc);
    setName(acc.name);
    setBalance((acc.balance * (activeCurrency.rate || 1.0)).toFixed(2));
    setType(acc.type);
    setModalVisible(true);
  };

  const handleSaveAccount = async () => {
    if (!name.trim()) {
      Alert.alert('Missing Name', 'Please give this account a name.');
      return;
    }
    const enteredBal = parseFloat(balance) || 0;

    let icon = 'business-outline';
    let color = theme.colors.primary;

    if (type === 'cash') {
      icon = 'cash-outline';
      color = theme.colors.success;
    } else if (type === 'savings') {
      icon = 'shield-checkmark-outline';
      color = theme.colors.purple;
    } else if (type === 'credit') {
      icon = 'card-outline';
      color = theme.colors.danger;
    } else if (type === 'investment') {
      icon = 'trending-up-outline';
      color = theme.colors.warning;
    }

    if (editingAccount) {
      await updateAccount(editingAccount.id, {
        name: name.trim(),
        balance: enteredBal,
        type,
        icon,
        color,
      });
    } else {
      await addAccount({
        name: name.trim(),
        balance: enteredBal,
        type,
        icon,
        color,
      });
    }

    setModalVisible(false);
    setEditingAccount(null);
  };

  const handleDelete = (acc: Account) => {
    if (accounts.length <= 1) {
      Alert.alert('Cannot Delete', 'You must have at least one active account.');
      return;
    }

    Alert.alert(
      'Delete Account',
      `Are you sure you want to delete "${acc.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteAccount(acc.id);
            setModalVisible(false);
            setEditingAccount(null);
          },
        },
      ]
    );
  };

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>Portfolio & Wallets ({activeCurrency.code})</Text>
          <Text style={styles.headerTitle}>Accounts</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openAddModal} activeOpacity={0.8}>
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Total Available Funds Card */}
        <View style={styles.netWorthCard}>
          <View style={styles.cardTopRow}>
            <Text style={styles.netWorthLabel}>Total Available Funds</Text>
            <View style={styles.accountCountPill}>
              <Text style={styles.accountCountText}>{accounts.length} Accounts</Text>
            </View>
          </View>
          <Text style={styles.netWorthAmount}>{formatAmount(totalBalance)}</Text>
          <Text style={styles.netWorthSub}>All linked bank, cash, and credit accounts</Text>
        </View>

        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="wallet" size={17} color={theme.colors.primaryLight} />
            <Text style={styles.sectionTitle}>Your Accounts</Text>
          </View>
          <Text style={styles.sectionHint}>Tap to edit details</Text>
        </View>

        {accounts.map((acc) => (
          <TouchableOpacity
            key={acc.id}
            style={styles.accountItem}
            onPress={() => openEditModal(acc)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: `${acc.color}20`, borderColor: `${acc.color}40` },
              ]}
            >
              <Ionicons name={(acc.icon as any) || 'wallet-outline'} size={21} color={acc.color} />
            </View>

            <View style={styles.infoWrap}>
              <Text style={styles.accountName}>{acc.name}</Text>
              <View style={styles.typeBadge}>
                <Text style={styles.accountType}>{acc.type}</Text>
              </View>
            </View>

            <View style={styles.rightAccountSide}>
              <Text
                style={[
                  styles.accountBalance,
                  {
                    color:
                      acc.balance < 0 ? theme.colors.dangerLight : theme.colors.text,
                  },
                ]}
              >
                {formatAmount(acc.balance)}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={theme.colors.textTertiary}
                style={{ marginTop: 4 }}
              />
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* Add / Edit Account Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingAccount ? 'Edit Account' : 'Add New Account'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  setEditingAccount(null);
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              automaticallyAdjustKeyboardInsets={true}
              contentContainerStyle={{ paddingBottom: 40 }}
            >
              <Text style={styles.inputLabel}>Account Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. PayPal, Chase, Cash Envelope"
                placeholderTextColor={theme.colors.textTertiary}
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.inputLabel}>
                Balance ({activeCurrency.symbol} {activeCurrency.code})
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder="0.00"
                keyboardType="numeric"
                placeholderTextColor={theme.colors.textTertiary}
                value={balance}
                onChangeText={setBalance}
              />

              <Text style={styles.inputLabel}>Account Type</Text>
              <View style={styles.typeSelector}>
                {(['bank', 'cash', 'savings', 'credit', 'investment'] as Account['type'][]).map(
                  (t) => {
                    const isSelected = type === t;
                    return (
                      <TouchableOpacity
                        key={t}
                        style={[styles.typeOption, isSelected && styles.typeOptionSelected]}
                        onPress={() => setType(t)}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.typeOptionText,
                            isSelected && styles.typeOptionTextSelected,
                          ]}
                        >
                          {t}
                        </Text>
                      </TouchableOpacity>
                    );
                  }
                )}
              </View>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveAccount}
                activeOpacity={0.8}
              >
                <Text style={styles.saveBtnText}>
                  {editingAccount ? 'Update Account' : 'Create Account'}
                </Text>
              </TouchableOpacity>

              {editingAccount && (
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(editingAccount)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="trash-outline" size={17} color={theme.colors.dangerLight} />
                  <Text style={styles.deleteBtnText}>Delete Account</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 14,
    backgroundColor: theme.colors.background,
  },
  headerSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  headerTitle: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  addBtn: {
    backgroundColor: theme.colors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  netWorthCard: {
    backgroundColor: theme.colors.surfaceCard,
    padding: 20,
    borderRadius: theme.radii.lg,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  netWorthLabel: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  accountCountPill: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radii.xs,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  accountCountText: {
    fontSize: 11,
    color: theme.colors.primaryLight,
    fontWeight: '700',
  },
  netWorthAmount: {
    color: theme.colors.text,
    fontSize: 34,
    fontWeight: '800',
    marginVertical: 6,
    letterSpacing: -0.8,
  },
  netWorthSub: {
    color: theme.colors.textTertiary,
    fontSize: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    letterSpacing: -0.2,
  },
  sectionHint: {
    fontSize: 11,
    color: theme.colors.textTertiary,
    fontStyle: 'italic',
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceCard,
    padding: 15,
    borderRadius: theme.radii.md,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1,
  },
  infoWrap: {
    flex: 1,
  },
  accountName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  accountType: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
  },
  rightAccountSide: {
    alignItems: 'flex-end',
  },
  accountBalance: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.backdrop,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.surfaceElevated,
    borderTopLeftRadius: theme.radii.xl,
    borderTopRightRadius: theme.radii.xl,
    padding: 24,
    maxHeight: '88%',
    borderTopWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: -0.3,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 16,
    color: theme.colors.text,
    fontWeight: '600',
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  typeOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  typeOptionSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primaryLight,
  },
  typeOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    textTransform: 'capitalize',
  },
  typeOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  saveBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 15,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 10,
    gap: 8,
  },
  deleteBtnText: {
    color: theme.colors.dangerLight,
    fontSize: 14,
    fontWeight: '600',
  },
});
