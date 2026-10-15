import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBudget } from '../context/BudgetContext';
import { useTheme } from '../context/ThemeContext';
import { Account, Transaction, TransactionType } from '../types';
import { FullDatePickerModal } from './FullDatePickerModal';
import { getTodayDateString, formatDateWithWeekday } from '../utils/dateUtils';
import { Theme } from '../constants/theme';

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
  '#FF3B30',
  '#FF9500',
  '#FFCC00',
  '#34C759',
  '#00C7BE',
  '#007AFF',
  '#5856D6',
  '#AF52DE',
  '#FF2D55',
  '#8E8E93',
];

interface Props {
  visible: boolean;
  onClose: () => void;
  initialType?: TransactionType;
  editingTransaction?: Transaction | null;
  transactionToEdit?: Transaction | null;
  defaultDate?: string;
}

export const AddTransactionModal: React.FC<Props> = ({
  visible,
  onClose,
  initialType = 'expense',
  editingTransaction = null,
  transactionToEdit = null,
  defaultDate,
}) => {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const {
    accounts,
    categories,
    addTransaction,
    updateTransaction,
    addCategory,
    addAccount,
    activeCurrency,
  } = useBudget();

  const activeTx = editingTransaction || transactionToEdit || null;

  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(defaultDate || getTodayDateString());

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
  const [newCatColor, setNewCatColor] = useState('#007AFF');

  // Quick Add Account Modal state
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [newAccName, setNewAccName] = useState('');
  const [newAccBalance, setNewAccBalance] = useState('');
  const [newAccType, setNewAccType] = useState<Account['type']>('bank');

  // Full Calendar Date Picker Modal state
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Track previous visibility to prevent wiping typed inputs
  const prevVisibleRef = useRef(false);
  const prevEditingIdRef = useRef<string | null>(null);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const justOpened = !prevVisibleRef.current && visible;
    const editingChanged = (activeTx?.id || null) !== prevEditingIdRef.current;

    prevVisibleRef.current = visible;
    prevEditingIdRef.current = activeTx?.id || null;

    if (!visible) return;

    if (justOpened || editingChanged) {
      if (activeTx) {
        setType(activeTx.type);
        const displayedAmount = (activeTx.amount * (activeCurrency.rate || 1.0)).toFixed(2);
        setAmount(displayedAmount);
        setNote(activeTx.note || '');
        setDate(activeTx.date);
        if (activeTx.type === 'transfer') {
          setFromAccountId(activeTx.fromAccountId || accounts[0]?.id || '');
          setToAccountId(activeTx.toAccountId || accounts[1]?.id || '');
        } else {
          setSelectedAccountId(activeTx.accountId || accounts[0]?.id || '');
          setSelectedCategoryId(activeTx.categoryId || '');
        }
      } else {
        setType(initialType);
        setAmount('');
        setNote('');
        setDate(defaultDate || getTodayDateString());
        setSelectedAccountId(accounts[0]?.id || '');
        setSelectedCategoryId('');
        setFromAccountId(accounts[0]?.id || '');
        setToAccountId(accounts[1]?.id || '');
      }
    }
  }, [visible, activeTx, initialType, defaultDate, accounts, activeCurrency.rate]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const filteredCategories = categories.filter(
    (c) => c.type === (type === 'transfer' ? 'expense' : type)
  );

  // Category Quick Add handlers
  const handleOpenAddCategory = () => {
    setNewCatName('');
    setNewCatIcon(type === 'expense' ? 'cart-outline' : 'wallet-outline');
    setNewCatColor(type === 'expense' ? '#FF3B30' : '#34C759');
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
    let color = '#007AFF';

    if (newAccType === 'cash') {
      icon = 'cash-outline';
      color = '#34C759';
    } else if (newAccType === 'savings') {
      icon = 'shield-checkmark-outline';
      color = '#AF52DE';
    } else if (newAccType === 'credit') {
      icon = 'card-outline';
      color = '#FF3B30';
    } else if (newAccType === 'investment') {
      icon = 'trending-up-outline';
      color = '#FF9500';
    }

    const createdAcc = await addAccount({
      name: newAccName.trim(),
      balance: startingBal,
      type: newAccType,
      icon,
      color,
    });

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

      if (activeTx) {
        await updateTransaction(activeTx.id, txPayload);
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

      if (activeTx) {
        await updateTransaction(activeTx.id, txPayload);
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
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity
          style={styles.backdropDismiss}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.modalContent}>
          {/* Top Apple Handle Indicator */}
          <View style={styles.handleContainer}>
            <View style={styles.sheetHandle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {activeTx ? 'Edit Transaction' : 'New Transaction'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Apple iOS Native Segmented Tab */}
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
                size={16}
                color={type === 'expense' ? '#FFFFFF' : theme.colors.danger}
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
                size={16}
                color={type === 'income' ? '#FFFFFF' : theme.colors.success}
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
                size={16}
                color={type === 'transfer' ? '#FFFFFF' : theme.colors.primary}
              />
              <Text style={[styles.segmentText, type === 'transfer' && styles.segmentTextActive]}>
                Transfer
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.formScroll}
            contentContainerStyle={styles.formScrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Apple Style Numeric Amount Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Amount ({activeCurrency.symbol} {activeCurrency.code})
              </Text>
              <TextInput
                style={styles.amountInput}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor={theme.colors.textTertiary}
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
                placeholderTextColor={theme.colors.textTertiary}
                value={note}
                onChangeText={setNote}
              />
            </View>

            {/* Date Input with Apple Calendar Sheet Trigger */}
            <View style={styles.inputGroup}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.label}>Date</Text>
                <TouchableOpacity
                  style={styles.addQuickLink}
                  onPress={() => setDate(getTodayDateString())}
                >
                  <Ionicons name="today-outline" size={14} color={theme.colors.primary} />
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
                    <Ionicons name="calendar" size={18} color={theme.colors.primary} />
                  </View>
                  <View>
                    <Text style={styles.datePickerSelectedText}>{formatDateWithWeekday(date)}</Text>
                    <Text style={styles.datePickerSubText}>{date} • Tap to pick date</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.colors.textTertiary} />
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
                      <Ionicons name="add-circle-outline" size={15} color={theme.colors.primary} />
                      <Text style={styles.addQuickLinkText}>+ Add Account</Text>
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
                          activeOpacity={0.7}
                        >
                          <Ionicons
                            name={(acc.icon as any) || 'card-outline'}
                            size={15}
                            color={isSelected ? '#FFFFFF' : acc.color || theme.colors.primary}
                          />
                          <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                            {acc.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Categories Grid */}
                <View style={styles.inputGroup}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.label}>Category</Text>
                    <TouchableOpacity
                      style={styles.addQuickLink}
                      onPress={handleOpenAddCategory}
                    >
                      <Ionicons name="add-circle-outline" size={15} color={theme.colors.primary} />
                      <Text style={styles.addQuickLinkText}>+ Add Category</Text>
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
                            isSelected && {
                              borderColor: cat.color,
                              backgroundColor: isDark ? `${cat.color}25` : `${cat.color}15`,
                            },
                          ]}
                          onPress={() => setSelectedCategoryId(cat.id)}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.catIconCircle, { backgroundColor: cat.color }]}>
                            <Ionicons name={(cat.icon as any) || 'pricetag'} size={18} color="#FFFFFF" />
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
                      activeOpacity={0.7}
                    >
                      <View style={styles.addCatIconBox}>
                        <Ionicons name="add" size={18} color={theme.colors.primary} />
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
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
                    {accounts.map((acc) => {
                      const isSelected = fromAccountId === acc.id;
                      return (
                        <TouchableOpacity
                          key={acc.id}
                          style={[styles.chip, isSelected && styles.chipSelectedRed]}
                          onPress={() => setFromAccountId(acc.id)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                            {acc.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                <View style={styles.transferDivider}>
                  <Ionicons name="arrow-down" size={18} color={theme.colors.primary} />
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
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                            {acc.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              </View>
            )}

            {/* Apple Style Submit Button */}
            <TouchableOpacity style={styles.submitBtn} onPress={handleSave} activeOpacity={0.85}>
              <Text style={styles.submitBtnText}>
                {activeTx ? 'Save Changes' : 'Save Transaction'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      {/* Quick Add Category Overlay */}
      {isAddCategoryOpen && (
        <KeyboardAvoidingView
          style={styles.quickCatOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.quickCatCard}>
            <View style={styles.quickCatHeader}>
              <Text style={styles.quickCatTitle}>Add New Category</Text>
              <TouchableOpacity onPress={() => setIsAddCategoryOpen(false)}>
                <Ionicons name="close" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.quickLabel}>Category Name</Text>
            <TextInput
              style={styles.quickInput}
              placeholder="e.g. Health, Taxi, Coffee"
              placeholderTextColor={theme.colors.textTertiary}
              value={newCatName}
              onChangeText={setNewCatName}
              autoFocus
            />

            <Text style={styles.quickLabel}>Color</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickColorRow}>
              {PRESET_COLORS.map((c) => {
                const isSelected = newCatColor === c;
                return (
                  <TouchableOpacity
                    key={c}
                    style={[styles.colorDot, { backgroundColor: c }, isSelected && styles.colorDotSelected]}
                    onPress={() => setNewCatColor(c)}
                  >
                    {isSelected && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={styles.quickLabel}>Icon</Text>
            <View style={styles.quickIconGrid}>
              {PRESET_ICONS.slice(0, 10).map((icon) => {
                const isSelected = newCatIcon === icon;
                return (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.quickIconBox,
                      isSelected && { borderColor: newCatColor, backgroundColor: `${newCatColor}20` },
                    ]}
                    onPress={() => setNewCatIcon(icon)}
                  >
                    <Ionicons
                      name={icon as any}
                      size={20}
                      color={isSelected ? newCatColor : theme.colors.textSecondary}
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
        </KeyboardAvoidingView>
      )}

      {/* Quick Add Account Overlay */}
      {isAddAccountOpen && (
        <KeyboardAvoidingView
          style={styles.quickCatOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.quickCatCard}>
            <View style={styles.quickCatHeader}>
              <Text style={styles.quickCatTitle}>Add New Account</Text>
              <TouchableOpacity onPress={() => setIsAddAccountOpen(false)}>
                <Ionicons name="close" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.quickLabel}>Account Name</Text>
            <TextInput
              style={styles.quickInput}
              placeholder="e.g. PayPal, Revolut, Cash"
              placeholderTextColor={theme.colors.textTertiary}
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
              placeholderTextColor={theme.colors.textTertiary}
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
        </KeyboardAvoidingView>
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

const createStyles = (theme: Theme, isDark: boolean) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: theme.colors.backdrop,
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.colors.surfaceCard,
      borderTopLeftRadius: theme.radii.xl,
      borderTopRightRadius: theme.radii.xl,
      paddingHorizontal: 20,
      paddingTop: 10,
      maxHeight: '92%',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      ...theme.shadows.card,
    },
    backdropDismiss: {
      flex: 1,
    },
    handleContainer: {
      alignItems: 'center',
      paddingVertical: 8,
    },
    sheetHandle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: isDark ? '#3A3A3C' : '#D1D1D6',
    },
    formScroll: {
      maxHeight: 520,
    },
    formScrollContent: {
      paddingBottom: 40,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 14,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.text,
      letterSpacing: -0.3,
    },
    closeBtn: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA',
      alignItems: 'center',
      justifyContent: 'center',
    },
    // Segmented Control
    segmentContainer: {
      flexDirection: 'row',
      backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA',
      borderRadius: theme.radii.md,
      padding: 3,
      marginBottom: 16,
    },
    segmentBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      borderRadius: theme.radii.sm,
      gap: 6,
    },
    segmentExpenseActive: {
      backgroundColor: theme.colors.danger,
    },
    segmentIncomeActive: {
      backgroundColor: theme.colors.success,
    },
    segmentTransferActive: {
      backgroundColor: theme.colors.primary,
    },
    segmentText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    segmentTextActive: {
      color: '#FFFFFF',
      fontWeight: '700',
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
    },
    addQuickLinkText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    label: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      marginBottom: 6,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    amountInput: {
      fontSize: 32,
      fontWeight: '700',
      color: theme.colors.text,
      backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
      borderRadius: theme.radii.lg,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      letterSpacing: -0.5,
    },
    textInput: {
      fontSize: 15,
      color: theme.colors.text,
      backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
      borderRadius: theme.radii.md,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      fontWeight: '500',
    },
    datePickerTrigger: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
      borderRadius: theme.radii.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    datePickerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    calendarIconCircle: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: isDark ? 'rgba(10, 132, 255, 0.2)' : 'rgba(0, 122, 255, 0.12)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    datePickerSelectedText: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.text,
    },
    datePickerSubText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    chipsRow: {
      flexDirection: 'row',
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: theme.radii.full,
      marginRight: 8,
      gap: 6,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    },
    chipSelected: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    chipSelectedRed: {
      backgroundColor: theme.colors.danger,
      borderColor: theme.colors.danger,
    },
    chipSelectedGreen: {
      backgroundColor: theme.colors.success,
      borderColor: theme.colors.success,
    },
    chipText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    chipTextSelected: {
      color: '#FFFFFF',
      fontWeight: '700',
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
      borderRadius: theme.radii.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
    },
    catIconCircle: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 6,
    },
    catName: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      fontWeight: '600',
    },
    addCatTile: {
      width: '31%',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 6,
      borderRadius: theme.radii.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderStyle: 'dashed',
      borderColor: theme.colors.primary,
      backgroundColor: isDark ? 'rgba(10, 132, 255, 0.1)' : 'rgba(0, 122, 255, 0.08)',
    },
    addCatIconBox: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: isDark ? 'rgba(10, 132, 255, 0.2)' : 'rgba(0, 122, 255, 0.12)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 6,
    },
    addCatTileText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    transferSection: {
      backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
      padding: 14,
      borderRadius: theme.radii.lg,
      marginBottom: 16,
    },
    transferDivider: {
      alignItems: 'center',
      marginVertical: 4,
    },
    submitBtn: {
      backgroundColor: theme.colors.primary,
      paddingVertical: 15,
      borderRadius: theme.radii.lg,
      alignItems: 'center',
      marginTop: 8,
      ...theme.shadows.glowPrimary,
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
      backgroundColor: theme.colors.backdrop,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      zIndex: 99999,
      elevation: 30,
    },
    quickCatCard: {
      width: '100%',
      backgroundColor: theme.colors.surfaceCard,
      borderRadius: theme.radii.xl,
      padding: 20,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      ...theme.shadows.card,
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
      color: theme.colors.text,
    },
    quickLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      marginBottom: 6,
      marginTop: 8,
      textTransform: 'uppercase',
    },
    quickInput: {
      backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.md,
      paddingHorizontal: 14,
      paddingVertical: 10,
      fontSize: 15,
      color: theme.colors.text,
      fontWeight: '500',
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
      borderWidth: 2,
      borderColor: '#FFFFFF',
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
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
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
      borderRadius: theme.radii.full,
      backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    },
    accountTypePillSelected: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    accountTypePillText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      textTransform: 'capitalize',
    },
    accountTypePillTextSelected: {
      color: '#FFFFFF',
      fontWeight: '700',
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
      borderRadius: theme.radii.md,
      backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA',
    },
    quickCancelText: {
      color: theme.colors.text,
      fontWeight: '600',
    },
    quickSaveBtn: {
      backgroundColor: theme.colors.primary,
      paddingVertical: 10,
      paddingHorizontal: 18,
      borderRadius: theme.radii.md,
    },
    quickSaveText: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
  });
