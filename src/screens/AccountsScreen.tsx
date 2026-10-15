import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useBudget } from '../context/BudgetContext';
import { useTheme } from '../context/ThemeContext';
import { Account } from '../types';
import { Theme } from '../constants/theme';

export const AccountsScreen: React.FC = () => {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

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
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>Wallets & Cards ({activeCurrency.code})</Text>
          <Text style={styles.headerTitle}>Accounts</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openAddModal} activeOpacity={0.8}>
          <Ionicons name="add" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Apple Wallet Style Total Funds Hero Card */}
        <View style={styles.netWorthCard}>
          <View style={styles.cardTopRow}>
            <Text style={styles.netWorthLabel}>Total Available Funds</Text>
            <View style={styles.accountCountPill}>
              <Text style={styles.accountCountText}>{accounts.length} Accounts</Text>
            </View>
          </View>
          <Text style={styles.netWorthAmount}>{formatAmount(totalBalance)}</Text>
          <Text style={styles.netWorthSubtitle}>Liquid cash, savings, and investments combined</Text>
        </View>

        {/* Apple Grouped Inset List of Accounts */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeader}>YOUR ACCOUNTS</Text>
        </View>

        <View style={styles.groupedCard}>
          {accounts.map((acc, index) => (
            <React.Fragment key={acc.id}>
              {index > 0 && <View style={styles.separator} />}
              <TouchableOpacity
                style={styles.accountRow}
                onPress={() => openEditModal(acc)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.iconBox,
                    {
                      backgroundColor: isDark
                        ? `${acc.color || theme.colors.primary}25`
                        : `${acc.color || theme.colors.primary}15`,
                    },
                  ]}
                >
                  <Ionicons
                    name={(acc.icon as any) || 'wallet-outline'}
                    size={20}
                    color={acc.color || theme.colors.primary}
                  />
                </View>

                <View style={styles.accountInfo}>
                  <Text style={styles.accountName} numberOfLines={1}>
                    {acc.name}
                  </Text>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>{acc.type}</Text>
                  </View>
                </View>

                <View style={styles.accountRight}>
                  <Text style={styles.accountBalance}>{formatAmount(acc.balance)}</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={theme.colors.textTertiary}
                    style={{ marginTop: 2 }}
                  />
                </View>
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </View>
      </ScrollView>

      {/* Add / Edit Account Apple Bottom Sheet Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>
                {editingAccount ? 'Edit Account' : 'New Account'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close-circle" size={26} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Account Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Chase Checking, Cash Wallet"
                placeholderTextColor={theme.colors.textTertiary}
              />

              <Text style={styles.inputLabel}>Initial Balance ({activeCurrency.code})</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={balance}
                onChangeText={setBalance}
                placeholder="0.00"
                placeholderTextColor={theme.colors.textTertiary}
              />

              <Text style={styles.inputLabel}>Account Classification</Text>
              <View style={styles.typePills}>
                {(['bank', 'cash', 'savings', 'credit', 'investment'] as Account['type'][]).map(
                  (t) => {
                    const isSelected = type === t;
                    return (
                      <TouchableOpacity
                        key={t}
                        style={[styles.typePill, isSelected && styles.typePillSelected]}
                        onPress={() => setType(t)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.typePillText,
                            isSelected && styles.typePillTextSelected,
                          ]}
                        >
                          {t}
                        </Text>
                      </TouchableOpacity>
                    );
                  }
                )}
              </View>

              <View style={styles.modalActions}>
                {editingAccount && (
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(editingAccount)}
                  >
                    <Ionicons name="trash-outline" size={16} color={theme.colors.danger} />
                    <Text style={styles.deleteBtnText}>Delete</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveAccount}>
                  <Text style={styles.saveBtnText}>
                    {editingAccount ? 'Update Account' : 'Create Account'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const createStyles = (theme: Theme, isDark: boolean) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 8,
    },
    headerSubtitle: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.textTertiary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    headerTitle: {
      fontSize: 34,
      fontWeight: '700',
      color: theme.colors.text,
      letterSpacing: -0.6,
    },
    addBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      ...theme.shadows.glowPrimary,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingBottom: 36,
    },
    // Net Worth Hero Card
    netWorthCard: {
      backgroundColor: theme.colors.surfaceCard,
      borderRadius: theme.radii.xl,
      padding: 20,
      marginTop: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      ...theme.shadows.card,
    },
    cardTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    netWorthLabel: {
      fontSize: 13,
      fontWeight: '500',
      color: theme.colors.textSecondary,
    },
    accountCountPill: {
      backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: theme.radii.sm,
    },
    accountCountText: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    netWorthAmount: {
      fontSize: 34,
      fontWeight: '700',
      color: theme.colors.text,
      letterSpacing: -0.6,
      marginVertical: 4,
    },
    netWorthSubtitle: {
      fontSize: 12,
      color: theme.colors.textTertiary,
      marginTop: 2,
    },
    // Section Header
    sectionHeaderRow: {
      marginTop: 24,
      marginBottom: 8,
      paddingHorizontal: 4,
    },
    sectionHeader: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.textTertiary,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    groupedCard: {
      backgroundColor: theme.colors.surfaceCard,
      borderRadius: theme.radii.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      overflow: 'hidden',
      ...theme.shadows.card,
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.border,
      marginLeft: 62,
    },
    accountRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
    },
    iconBox: {
      width: 40,
      height: 40,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    accountInfo: {
      flex: 1,
    },
    accountName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      letterSpacing: -0.2,
      marginBottom: 3,
    },
    typeBadge: {
      alignSelf: 'flex-start',
      backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: theme.radii.xs,
    },
    typeBadgeText: {
      fontSize: 10,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      textTransform: 'capitalize',
    },
    accountRight: {
      alignItems: 'flex-end',
      flexDirection: 'row',
      gap: 6,
    },
    accountBalance: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.text,
      letterSpacing: -0.2,
    },
    // Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: theme.colors.backdrop,
      justifyContent: 'flex-end',
    },
    modalSheet: {
      backgroundColor: theme.colors.surfaceCard,
      borderTopLeftRadius: theme.radii.xl,
      borderTopRightRadius: theme.radii.xl,
      padding: 20,
      maxHeight: '85%',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border,
      ...theme.shadows.card,
    },
    modalHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.text,
      letterSpacing: -0.3,
    },
    inputLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      marginBottom: 6,
      marginTop: 12,
    },
    input: {
      backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
      borderRadius: theme.radii.md,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: theme.colors.text,
      fontSize: 15,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    },
    typePills: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 6,
    },
    typePill: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: theme.radii.full,
      backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    },
    typePillSelected: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    typePillText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      textTransform: 'capitalize',
    },
    typePillTextSelected: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    modalActions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 24,
      marginBottom: 12,
    },
    deleteBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: theme.radii.md,
      backgroundColor: isDark ? 'rgba(255, 69, 58, 0.15)' : 'rgba(255, 59, 48, 0.1)',
    },
    deleteBtnText: {
      color: theme.colors.danger,
      fontWeight: '600',
      fontSize: 14,
    },
    saveBtn: {
      flex: 1,
      backgroundColor: theme.colors.primary,
      borderRadius: theme.radii.md,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveBtnText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 15,
    },
  });
