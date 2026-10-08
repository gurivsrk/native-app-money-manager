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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBudget } from '../context/BudgetContext';
import { Account } from '../types';

export const AccountsScreen: React.FC = () => {
  const { accounts, addAccount, updateAccount, deleteAccount, formatAmount, activeCurrency } = useBudget();
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
    // Display converted balance in active currency
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
    let color = '#3B82F6';

    if (type === 'cash') {
      icon = 'cash-outline';
      color = '#10B981';
    } else if (type === 'savings') {
      icon = 'shield-checkmark-outline';
      color = '#8B5CF6';
    } else if (type === 'credit') {
      icon = 'card-outline';
      color = '#EC4899';
    } else if (type === 'investment') {
      icon = 'trending-up-outline';
      color = '#F59E0B';
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
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>Portfolio & Wallets ({activeCurrency.code})</Text>
          <Text style={styles.headerTitle}>Accounts</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Total Net Worth Card */}
        <View style={styles.netWorthCard}>
          <Text style={styles.netWorthLabel}>Total Available Funds</Text>
          <Text style={styles.netWorthAmount}>
            {formatAmount(totalBalance)}
          </Text>
          <Text style={styles.netWorthSub}>Across {accounts.length} active accounts</Text>
        </View>

        <Text style={styles.sectionTitle}>Your Accounts</Text>

        {accounts.map((acc) => (
          <TouchableOpacity
            key={acc.id}
            style={styles.accountItem}
            onPress={() => openEditModal(acc)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconCircle, { backgroundColor: acc.color }]}>
              <Ionicons name={(acc.icon as any) || 'wallet-outline'} size={22} color="#FFF" />
            </View>

            <View style={styles.infoWrap}>
              <Text style={styles.accountName}>{acc.name}</Text>
              <Text style={styles.accountType}>{acc.type.toUpperCase()}</Text>
            </View>

            <View style={styles.rightAccountSide}>
              <Text
                style={[
                  styles.accountBalance,
                  acc.balance < 0 ? { color: '#EF4444' } : { color: '#0F172A' },
                ]}
              >
                {formatAmount(acc.balance)}
              </Text>
              <Ionicons name="pencil-outline" size={16} color="#94A3B8" style={{ marginTop: 4 }} />
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add / Edit Account Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
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
              >
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Account Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. PayPal, Chase, Cash Envelope"
              placeholderTextColor="#94A3B8"
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
              placeholderTextColor="#94A3B8"
              value={balance}
              onChangeText={setBalance}
            />

            <Text style={styles.inputLabel}>Account Type</Text>
            <View style={styles.typeSelector}>
              {(['bank', 'cash', 'savings', 'credit', 'investment'] as Account['type'][]).map((t) => {
                const isSelected = type === t;
                return (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeOption, isSelected && styles.typeOptionSelected]}
                    onPress={() => setType(t)}
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
              })}
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveAccount}>
              <Text style={styles.saveBtnText}>
                {editingAccount ? 'Update Account' : 'Create Account'}
              </Text>
            </TouchableOpacity>

            {editingAccount && (
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDelete(editingAccount)}
              >
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
                <Text style={styles.deleteBtnText}>Delete Account</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#0F172A',
  },
  headerSubtitle: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  addBtn: {
    backgroundColor: '#3B82F6',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 24,
    minHeight: '100%',
  },
  netWorthCard: {
    backgroundColor: '#1E293B',
    padding: 20,
    borderRadius: 20,
    marginBottom: 24,
  },
  netWorthLabel: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  netWorthAmount: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    marginVertical: 6,
  },
  netWorthSub: {
    color: '#64748B',
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 14,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  infoWrap: {
    flex: 1,
  },
  accountName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  accountType: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  rightAccountSide: {
    alignItems: 'flex-end',
  },
  accountBalance: {
    fontSize: 16,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#0F172A',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 16,
    color: '#0F172A',
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
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  typeOptionSelected: {
    backgroundColor: '#3B82F6',
  },
  typeOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    textTransform: 'capitalize',
  },
  typeOptionTextSelected: {
    color: '#FFFFFF',
  },
  saveBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
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
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '600',
  },
});
