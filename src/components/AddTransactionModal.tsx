import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBudget } from '../context/BudgetContext';
import { Account, Transaction, TransactionType } from '../types';
import { FullDatePickerModal } from './FullDatePickerModal';

const PRESET_ICONS = [
  'cart-outline',
  'restaurant-outline',
  'home-outline',
  'car-outline',
  'receipt-outline',
  'film-outline',
  'fitness-outline',
  'gift-outline',
  'wallet-outline',
  'briefcase-outline',
  'cash-outline',
  'laptop-outline',
  'school-outline',
  'airplane-outline',
  'medkit-outline',
  'trending-up-outline',
  'pricetag-outline',
];

const PRESET_COLORS = [
  '#EF4444',
  '#F97316',
  '#F59E0B',
  '#10B981',
  '#06B6D4',
  '#3B82F6',
  '#6366F1',
  '#8B5CF6',
  '#EC4899',
  '#14B8A6',
  '#64748B',
];

interface Props {
  visible: boolean;
  onClose: () => void;
  initialType?: TransactionType;
  editingTransaction?: Transaction | null;
}

export const AddTransactionModal: React.FC<Props> = ({
  visible,
  onClose,
  initialType = 'expense',
  editingTransaction = null,
}) => {
  const {
    accounts,
    categories,
    addTransaction,
    updateTransaction,
    addCategory,
    addAccount,
    activeCurrency,
  } = useBudget();

  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));

  // Single Account for Income & Expense
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  // Dual Accounts for Transfer
  const [fromAccountId, setFromAccountId] = useState(accounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState(accounts[1]?.id || '');

  // Quick Add Category Modal state
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('pricetag-outline');
  const [newCatColor, setNewCatColor] = useState('#3B82F6');

  // Quick Add Account Modal state
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [newAccName, setNewAccName] = useState('');
  const [newAccBalance, setNewAccBalance] = useState('');
  const [newAccType, setNewAccType] = useState<Account['type']>('bank');

  // Full Calendar Date Picker Modal state
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Track previous visibility and editing transaction to prevent wiping typed inputs
  const prevVisibleRef = React.useRef(false);
  const prevEditingIdRef = React.useRef<string | null>(null);

  // Populate fields ONLY when modal freshly opens (false -> true) or editingTransaction changes
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const justOpened = !prevVisibleRef.current && visible;
    const editingChanged = (editingTransaction?.id || null) !== prevEditingIdRef.current;

    prevVisibleRef.current = visible;
    prevEditingIdRef.current = editingTransaction?.id || null;

    if (!visible) return;

    if (justOpened || editingChanged) {
      if (editingTransaction) {
        setType(editingTransaction.type);
        const displayedAmount = (editingTransaction.amount * (activeCurrency.rate || 1.0)).toFixed(2);
        setAmount(displayedAmount);
        setNote(editingTransaction.note || '');
        setDate(editingTransaction.date);
        if (editingTransaction.type === 'transfer') {
          setFromAccountId(editingTransaction.fromAccountId || accounts[0]?.id || '');
          setToAccountId(editingTransaction.toAccountId || accounts[1]?.id || '');
        } else {
          setSelectedAccountId(editingTransaction.accountId || accounts[0]?.id || '');
          setSelectedCategoryId(editingTransaction.categoryId || '');
        }
      } else {
        setType(initialType);
        setAmount('');
        setNote('');
        setDate(new Date().toISOString().substring(0, 10));
        setSelectedAccountId(accounts[0]?.id || '');
        setSelectedCategoryId('');
        setFromAccountId(accounts[0]?.id || '');
        setToAccountId(accounts[1]?.id || '');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, editingTransaction, initialType]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const filteredCategories = categories.filter((c) => c.type === (type === 'transfer' ? 'expense' : type));

  // Category Quick Add handlers
  const handleOpenAddCategory = () => {
    setNewCatName('');
    setNewCatIcon(type === 'expense' ? 'cart-outline' : 'wallet-outline');
    setNewCatColor(type === 'expense' ? '#EF4444' : '#10B981');
    setIsAddCategoryOpen(true);
  };

  const handleSaveNewCategory = async () => {
    if (!newCatName.trim()) {
      Alert.alert('Category Name Required', 'Please enter a name for the new category.');
      return;
    }

    const catType = type === 'transfer' ? 'expense' : type;
    const catName = newCatName.trim();

    const createdCat = await addCategory({
      name: catName,
      type: catType,
      icon: newCatIcon,
      color: newCatColor,
    });

    // Auto-select the newly created category immediately!
    setSelectedCategoryId(createdCat.id);
    setIsAddCategoryOpen(false);
  };

  // Account Quick Add handlers
  const handleOpenAddAccount = () => {
    setNewAccName('');
    setNewAccBalance('');
    setNewAccType('bank');
    setIsAddAccountOpen(true);
  };

  const handleSaveNewAccount = async () => {
    if (!newAccName.trim()) {
      Alert.alert('Account Name Required', 'Please enter a name for the new account.');
      return;
    }

    const startingBal = parseFloat(newAccBalance) || 0;

    let icon = 'business-outline';
    let color = '#3B82F6';

    if (newAccType === 'cash') {
      icon = 'cash-outline';
      color = '#10B981';
    } else if (newAccType === 'savings') {
      icon = 'shield-checkmark-outline';
      color = '#8B5CF6';
    } else if (newAccType === 'credit') {
      icon = 'card-outline';
      color = '#EC4899';
    } else if (newAccType === 'investment') {
      icon = 'trending-up-outline';
      color = '#F59E0B';
    }

    const createdAcc = await addAccount({
      name: newAccName.trim(),
      balance: startingBal,
      type: newAccType,
      icon,
      color,
    });

    // Auto-select the newly created account immediately!
    if (type === 'transfer') {
      if (!toAccountId || toAccountId === fromAccountId) {
        setToAccountId(createdAcc.id);
      } else {
        setFromAccountId(createdAcc.id);
      }
    } else {
      setSelectedAccountId(createdAcc.id);
    }

    setIsAddAccountOpen(false);
  };

  const handleSave = async () => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount greater than 0.');
      return;
    }

    if (type === 'transfer') {
      if (!fromAccountId || !toAccountId) {
        Alert.alert('Select Accounts', 'Please select both source and destination accounts.');
        return;
      }
      if (fromAccountId === toAccountId) {
        Alert.alert('Invalid Transfer', 'Source and destination accounts must be different.');
        return;
      }

      const txPayload = {
        type: 'transfer' as TransactionType,
        amount: parsedAmount,
        date,
        note: note.trim() || undefined,
        fromAccountId,
        toAccountId,
      };

      if (editingTransaction) {
        await updateTransaction(editingTransaction.id, txPayload);
      } else {
        await addTransaction(txPayload);
      }
    } else {
      if (!selectedAccountId) {
        Alert.alert('Select Account', 'Please choose an account.');
        return;
      }
      if (!selectedCategoryId) {
        Alert.alert('Select Category', 'Please choose a category.');
        return;
      }

      const txPayload = {
        type,
        amount: parsedAmount,
        date,
        note: note.trim() || undefined,
        accountId: selectedAccountId,
        categoryId: selectedCategoryId,
      };

      if (editingTransaction) {
        await updateTransaction(editingTransaction.id, txPayload);
      } else {
        await addTransaction(txPayload);
      }
    }

    setAmount('');
    setNote('');
    onClose();
  };

  const handleRequestClose = () => {
    if (isDatePickerOpen) {
      setIsDatePickerOpen(false);
    } else if (isAddCategoryOpen) {
      setIsAddCategoryOpen(false);
    } else if (isAddAccountOpen) {
      setIsAddAccountOpen(false);
    } else {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleRequestClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {editingTransaction ? 'Edit Transaction' : 'Add Record'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Type Segmented Buttons */}
          <View style={styles.segmentContainer}>
            <TouchableOpacity
              style={[styles.segmentBtn, type === 'expense' && styles.segmentExpenseActive]}
              onPress={() => {
                setType('expense');
                setSelectedCategoryId('');
              }}
            >
              <Ionicons
                name="arrow-down-circle"
                size={18}
                color={type === 'expense' ? '#FFF' : '#EF4444'}
              />
              <Text style={[styles.segmentText, type === 'expense' && styles.segmentTextActive]}>
                Expense
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.segmentBtn, type === 'income' && styles.segmentIncomeActive]}
              onPress={() => {
                setType('income');
                setSelectedCategoryId('');
              }}
            >
              <Ionicons
                name="arrow-up-circle"
                size={18}
                color={type === 'income' ? '#FFF' : '#10B981'}
              />
              <Text style={[styles.segmentText, type === 'income' && styles.segmentTextActive]}>
                Income
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.segmentBtn, type === 'transfer' && styles.segmentTransferActive]}
              onPress={() => setType('transfer')}
            >
              <Ionicons
                name="swap-horizontal"
                size={18}
                color={type === 'transfer' ? '#FFF' : '#3B82F6'}
              />
              <Text style={[styles.segmentText, type === 'transfer' && styles.segmentTextActive]}>
                Transfer
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.formScroll}>
            {/* Amount Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Amount ({activeCurrency.symbol} {activeCurrency.code})
              </Text>
              <TextInput
                style={styles.amountInput}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor="#94A3B8"
                value={amount}
                onChangeText={setAmount}
              />
            </View>

            {/* Note Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Note / Description</Text>
              <TextInput
                style={styles.textInput}
                placeholder="What is this for?"
                placeholderTextColor="#94A3B8"
                value={note}
                onChangeText={setNote}
              />
            </View>

            {/* Date Input with Interactive Calendar Picker */}
            <View style={styles.inputGroup}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.label}>Date</Text>
                <TouchableOpacity
                  style={styles.addQuickLink}
                  onPress={() => setDate(new Date().toISOString().substring(0, 10))}
                >
                  <Ionicons name="today-outline" size={15} color="#3B82F6" />
                  <Text style={styles.addQuickLinkText}>Today</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.datePickerTrigger}
                onPress={() => setIsDatePickerOpen(true)}
                activeOpacity={0.8}
              >
                <View style={styles.datePickerLeft}>
                  <View style={styles.calendarIconCircle}>
                    <Ionicons name="calendar" size={18} color="#2563EB" />
                  </View>
                  <View>
                    <Text style={styles.datePickerSelectedText}>{date}</Text>
                    <Text style={styles.datePickerSubText}>Tap to pick from calendar</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Account selection for Income / Expense */}
            {type !== 'transfer' ? (
              <>
                <View style={styles.inputGroup}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.label}>Account</Text>
                    <TouchableOpacity
                      style={styles.addQuickLink}
                      onPress={handleOpenAddAccount}
                    >
                      <Ionicons name="add-circle-outline" size={16} color="#3B82F6" />
                      <Text style={styles.addQuickLinkText}>Add Account</Text>
                    </TouchableOpacity>
                  </View>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
                    {accounts.map((acc) => {
                      const isSelected = selectedAccountId === acc.id;
                      return (
                        <TouchableOpacity
                          key={acc.id}
                          style={[styles.chip, isSelected && styles.chipSelected]}
                          onPress={() => setSelectedAccountId(acc.id)}
                        >
                          <Ionicons
                            name={(acc.icon as any) || 'card-outline'}
                            size={16}
                            color={isSelected ? '#FFF' : acc.color}
                          />
                          <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                            {acc.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}

                    {/* Dedicated "+ New Account" pill in horizontal scroll */}
                    <TouchableOpacity
                      style={styles.addChipBtn}
                      onPress={handleOpenAddAccount}
                    >
                      <Ionicons name="add" size={16} color="#2563EB" />
                      <Text style={styles.addChipBtnText}>New Account</Text>
                    </TouchableOpacity>
                  </ScrollView>
                </View>

                {/* Categories */}
                <View style={styles.inputGroup}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.label}>Category</Text>
                    <TouchableOpacity
                      style={styles.addQuickLink}
                      onPress={handleOpenAddCategory}
                    >
                      <Ionicons name="add-circle-outline" size={16} color="#3B82F6" />
                      <Text style={styles.addQuickLinkText}>Add Category</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.categoryGrid}>
                    {filteredCategories.map((cat) => {
                      const isSelected = selectedCategoryId === cat.id;
                      return (
                        <TouchableOpacity
                          key={cat.id}
                          style={[
                            styles.catItem,
                            isSelected && { borderColor: cat.color, backgroundColor: `${cat.color}15` },
                          ]}
                          onPress={() => setSelectedCategoryId(cat.id)}
                        >
                          <View style={[styles.catIconCircle, { backgroundColor: cat.color }]}>
                            <Ionicons name={(cat.icon as any) || 'pricetag'} size={18} color="#FFF" />
                          </View>
                          <Text
                            style={[
                              styles.catName,
                              isSelected && { color: cat.color, fontWeight: '700' },
                            ]}
                            numberOfLines={1}
                          >
                            {cat.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}

                    {/* Dedicated Add Category Tile inside the Grid */}
                    <TouchableOpacity
                      style={styles.addCatTile}
                      onPress={handleOpenAddCategory}
                    >
                      <View style={styles.addCatIconBox}>
                        <Ionicons name="add" size={20} color="#3B82F6" />
                      </View>
                      <Text style={styles.addCatTileText}>+ New</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            ) : (
              /* Transfer: Source & Destination Accounts */
              <View style={styles.transferSection}>
                <View style={styles.inputGroup}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.label}>From Account (Withdrawal)</Text>
                    <TouchableOpacity
                      style={styles.addQuickLink}
                      onPress={handleOpenAddAccount}
                    >
                      <Ionicons name="add-circle-outline" size={16} color="#3B82F6" />
                      <Text style={styles.addQuickLinkText}>Add Account</Text>
                    </TouchableOpacity>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
                    {accounts.map((acc) => {
                      const isSelected = fromAccountId === acc.id;
                      return (
                        <TouchableOpacity
                          key={acc.id}
                          style={[styles.chip, isSelected && styles.chipSelectedRed]}
                          onPress={() => setFromAccountId(acc.id)}
                        >
                          <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                            {acc.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                    <TouchableOpacity
                      style={styles.addChipBtn}
                      onPress={handleOpenAddAccount}
                    >
                      <Ionicons name="add" size={16} color="#2563EB" />
                      <Text style={styles.addChipBtnText}>New Account</Text>
                    </TouchableOpacity>
                  </ScrollView>
                </View>

                <View style={styles.transferDivider}>
                  <Ionicons name="arrow-down" size={20} color="#3B82F6" />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>To Account (Deposit)</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
                    {accounts.map((acc) => {
                      const isSelected = toAccountId === acc.id;
                      return (
                        <TouchableOpacity
                          key={acc.id}
                          style={[styles.chip, isSelected && styles.chipSelectedGreen]}
                          onPress={() => setToAccountId(acc.id)}
                        >
                          <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                            {acc.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                    <TouchableOpacity
                      style={styles.addChipBtn}
                      onPress={handleOpenAddAccount}
                    >
                      <Ionicons name="add" size={16} color="#2563EB" />
                      <Text style={styles.addChipBtnText}>New Account</Text>
                    </TouchableOpacity>
                  </ScrollView>
                </View>
              </View>
            )}

            <TouchableOpacity style={styles.submitBtn} onPress={handleSave}>
              <Text style={styles.submitBtnText}>
                {editingTransaction ? 'Update Transaction' : 'Save Transaction'}
              </Text>
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>

      {/* Quick Add Category Overlay */}
      {isAddCategoryOpen && (
        <View style={styles.quickCatOverlay}>
          <View style={styles.quickCatCard}>
            <View style={styles.quickCatHeader}>
              <Text style={styles.quickCatTitle}>
                Add {type === 'expense' ? 'Expense' : 'Income'} Category
              </Text>
              <TouchableOpacity onPress={() => setIsAddCategoryOpen(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.quickLabel}>Category Name</Text>
            <TextInput
              style={styles.quickInput}
              placeholder="e.g. Freelance, Taxi, Coffee"
              placeholderTextColor="#94A3B8"
              value={newCatName}
              onChangeText={setNewCatName}
              autoFocus
            />

            <Text style={styles.quickLabel}>Color</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickColorRow}>
              {PRESET_COLORS.map((col) => {
                const isSelected = newCatColor === col;
                return (
                  <TouchableOpacity
                    key={col}
                    style={[
                      styles.colorDot,
                      { backgroundColor: col },
                      isSelected && styles.colorDotSelected,
                    ]}
                    onPress={() => setNewCatColor(col)}
                  >
                    {isSelected && <Ionicons name="checkmark" size={14} color="#FFF" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={styles.quickLabel}>Icon</Text>
            <View style={styles.quickIconGrid}>
              {PRESET_ICONS.slice(0, 12).map((ico) => {
                const isSelected = newCatIcon === ico;
                return (
                  <TouchableOpacity
                    key={ico}
                    style={[
                      styles.quickIconBox,
                      isSelected && { borderColor: newCatColor, backgroundColor: `${newCatColor}15` },
                    ]}
                    onPress={() => setNewCatIcon(ico)}
                  >
                    <Ionicons
                      name={ico as any}
                      size={20}
                      color={isSelected ? newCatColor : '#64748B'}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.quickCancelBtn}
                onPress={() => setIsAddCategoryOpen(false)}
              >
                <Text style={styles.quickCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickSaveBtn}
                onPress={handleSaveNewCategory}
              >
                <Text style={styles.quickSaveText}>Create Category</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Quick Add Account Overlay */}
      {isAddAccountOpen && (
        <View style={styles.quickCatOverlay}>
          <View style={styles.quickCatCard}>
            <View style={styles.quickCatHeader}>
              <Text style={styles.quickCatTitle}>Add New Account</Text>
              <TouchableOpacity onPress={() => setIsAddAccountOpen(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.quickLabel}>Account Name</Text>
            <TextInput
              style={styles.quickInput}
              placeholder="e.g. PayPal, Revolut, Pocket Cash"
              placeholderTextColor="#94A3B8"
              value={newAccName}
              onChangeText={setNewAccName}
              autoFocus
            />

            <Text style={styles.quickLabel}>
              Starting Balance ({activeCurrency.symbol} {activeCurrency.code})
            </Text>
            <TextInput
              style={styles.quickInput}
              placeholder="0.00"
              keyboardType="numeric"
              placeholderTextColor="#94A3B8"
              value={newAccBalance}
              onChangeText={setNewAccBalance}
            />

            <Text style={styles.quickLabel}>Account Type</Text>
            <View style={styles.accountTypeRow}>
              {(['bank', 'cash', 'savings', 'credit', 'investment'] as Account['type'][]).map((t) => {
                const isSelected = newAccType === t;
                return (
                  <TouchableOpacity
                    key={t}
                    style={[styles.accountTypePill, isSelected && styles.accountTypePillSelected]}
                    onPress={() => setNewAccType(t)}
                  >
                    <Text
                      style={[
                        styles.accountTypePillText,
                        isSelected && styles.accountTypePillTextSelected,
                      ]}
                    >
                      {t}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.quickCancelBtn}
                onPress={() => setIsAddAccountOpen(false)}
              >
                <Text style={styles.quickCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickSaveBtn}
                onPress={handleSaveNewAccount}
              >
                <Text style={styles.quickSaveText}>Create Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Full Visual Calendar Date Picker Modal */}
      <FullDatePickerModal
        visible={isDatePickerOpen}
        currentDate={date}
        onSelectDate={(chosenDate) => setDate(chosenDate)}
        onClose={() => setIsDatePickerOpen(false)}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  segmentExpenseActive: {
    backgroundColor: '#EF4444',
  },
  segmentIncomeActive: {
    backgroundColor: '#10B981',
  },
  segmentTransferActive: {
    backgroundColor: '#3B82F6',
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  formScroll: {
    maxHeight: 520,
  },
  inputGroup: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addQuickLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
  },
  addQuickLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3B82F6',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amountInput: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  textInput: {
    fontSize: 15,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  datePickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  datePickerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  calendarIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  datePickerSelectedText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  datePickerSubText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  chipsRow: {
    flexDirection: 'row',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    gap: 6,
  },
  chipSelected: {
    backgroundColor: '#0F172A',
  },
  chipSelectedRed: {
    backgroundColor: '#EF4444',
  },
  chipSelectedGreen: {
    backgroundColor: '#10B981',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  addChipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#93C5FD',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    gap: 4,
  },
  addChipBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  catItem: {
    width: '31%',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  catIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  catName: {
    fontSize: 12,
    color: '#475569',
    textAlign: 'center',
  },
  addCatTile: {
    width: '31%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#93C5FD',
    backgroundColor: '#EFF6FF',
  },
  addCatIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  addCatTileText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  transferSection: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  transferDivider: {
    alignItems: 'center',
    marginVertical: 4,
  },
  submitBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  // Quick Add Modal styles
  quickCatOverlay: {
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
  quickCatCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  quickCatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  quickCatTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  quickLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
    marginTop: 8,
    textTransform: 'uppercase',
  },
  quickInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  quickColorRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  colorDotSelected: {
    borderWidth: 3,
    borderColor: '#0F172A',
  },
  quickIconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  quickIconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  accountTypePill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  accountTypePillSelected: {
    backgroundColor: '#3B82F6',
  },
  accountTypePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    textTransform: 'capitalize',
  },
  accountTypePillTextSelected: {
    color: '#FFFFFF',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  quickCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  quickCancelText: {
    color: '#64748B',
    fontWeight: '600',
  },
  quickSaveBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  quickSaveText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
