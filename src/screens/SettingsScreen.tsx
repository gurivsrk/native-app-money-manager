import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useBudget } from '../context/BudgetContext';
import { useTheme } from '../context/ThemeContext';
import { Currency } from '../types';
import { firebaseConfig } from '../config/firebase';
import { CategoriesScreen } from './CategoriesScreen';
import { Theme } from '../constants/theme';

export const SettingsScreen: React.FC = () => {
  const { theme, isDark, themeMode, setThemeMode } = useTheme();
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const {
    currencies,
    activeCurrency,
    setActiveCurrencyCode,
    updateCurrencyRate,
    addCustomCurrency,
    cloudSyncStatus,
    lastSyncTime,
    syncWithCloud,
    uploadToCloud,
    restoreFromCloud,
    testCloudConnection,
  } = useBudget();

  // Cloud Sync state
  const [syncInProgress, setSyncInProgress] = useState(false);

  // Categories Modal state
  const [categoriesModalVisible, setCategoriesModalVisible] = useState(false);

  // Dropdown select modal state
  const [selectModalVisible, setSelectModalVisible] = useState(false);

  // Edit exchange rate modal
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);
  const [rateInput, setRateInput] = useState('');

  // Add custom currency modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newSymbol, setNewSymbol] = useState('');
  const [newName, setNewName] = useState('');
  const [newRate, setNewRate] = useState('1.0');

  const handleEditRate = (currency: Currency) => {
    setEditingCurrency(currency);
    setRateInput(currency.rate.toString());
    setModalVisible(true);
  };

  const handleSaveRate = async () => {
    if (!editingCurrency) return;
    const parsed = parseFloat(rateInput);
    if (isNaN(parsed) || parsed <= 0) {
      Alert.alert('Invalid Rate', 'Please enter a positive exchange rate value.');
      return;
    }
    await updateCurrencyRate(editingCurrency.code, parsed);
    setModalVisible(false);
    setEditingCurrency(null);
  };

  const handleCreateCurrency = async () => {
    if (!newCode.trim() || !newSymbol.trim() || !newName.trim()) {
      Alert.alert('Missing Fields', 'Please fill in code, symbol, and name.');
      return;
    }
    const parsed = parseFloat(newRate);
    if (isNaN(parsed) || parsed <= 0) {
      Alert.alert('Invalid Rate', 'Please enter a positive exchange rate.');
      return;
    }

    const createdCurrency: Currency = {
      code: newCode.trim().toUpperCase(),
      symbol: newSymbol.trim(),
      name: newName.trim(),
      rate: parsed,
    };

    await addCustomCurrency(createdCurrency);
    await setActiveCurrencyCode(createdCurrency.code);

    setNewCode('');
    setNewSymbol('');
    setNewName('');
    setNewRate('1.0');
    setShowAddModal(false);
  };

  const handleTestConnection = async () => {
    setSyncInProgress(true);
    try {
      const res = await testCloudConnection();
      if (res.success) {
        Alert.alert('Cloud Connected', res.message);
      } else {
        Alert.alert(
          'Firebase Setup Required',
          `${res.message}\n\nTip: In the Firebase Console (console.firebase.google.com):\n1. Go to project: "${firebaseConfig.projectId}"\n2. Open "Build" > "Firestore Database"\n3. Click "Create Database" (default mode, test rules)\n4. Rules must allow: "allow read, write: if true;"`
        );
      }
    } finally {
      setSyncInProgress(false);
    }
  };

  const handleSyncNow = async () => {
    setSyncInProgress(true);
    try {
      const res = await syncWithCloud();
      Alert.alert(res.success ? 'Sync Successful' : 'Sync Status', res.message);
    } finally {
      setSyncInProgress(false);
    }
  };

  const handleBackupToCloud = () => {
    Alert.alert(
      'Backup to Cloud',
      'Upload all local transactions, accounts, categories, and currency settings to your live Firestore database.\n\nProceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Upload',
          onPress: async () => {
            setSyncInProgress(true);
            try {
              const res = await uploadToCloud();
              Alert.alert(res.success ? 'Backup Successful' : 'Backup Status', res.message);
            } finally {
              setSyncInProgress(false);
            }
          },
        },
      ]
    );
  };

  const handleRestoreFromCloud = () => {
    Alert.alert(
      'Restore from Cloud',
      'Download all data from Firestore into your local device. Any local changes not backed up will be overwritten.\n\nProceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          style: 'destructive',
          onPress: async () => {
            setSyncInProgress(true);
            try {
              const res = await restoreFromCloud();
              Alert.alert(res.success ? 'Restore Successful' : 'Restore Status', res.message);
            } finally {
              setSyncInProgress(false);
            }
          },
        },
      ]
    );
  };

  const showFirebaseInfo = () => {
    Alert.alert(
      'Firebase Configuration',
      `Firebase is configured and live!\n\n• Project: ${firebaseConfig.projectId}\n• Auth Domain: ${firebaseConfig.authDomain}\n• App ID: ${firebaseConfig.appId}\n\nArchitecture: Offline-first with auto-sync on change.`
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* APPEARANCE SECTION (Apple HIG Display & Appearance) */}
        <Text style={styles.sectionHeader}>APPEARANCE</Text>
        <View style={styles.groupedCard}>
          <View style={styles.appearanceRow}>
            {/* System Default Option */}
            <TouchableOpacity
              style={[
                styles.appearanceOption,
                themeMode === 'system' && styles.appearanceOptionSelected,
              ]}
              onPress={() => setThemeMode('system')}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.appearanceIconCircle,
                  themeMode === 'system' && styles.appearanceIconCircleSelected,
                ]}
              >
                <Ionicons
                  name="phone-portrait-outline"
                  size={20}
                  color={themeMode === 'system' ? '#FFFFFF' : theme.colors.textSecondary}
                />
              </View>
              <Text
                style={[
                  styles.appearanceText,
                  themeMode === 'system' && styles.appearanceTextSelected,
                ]}
              >
                System
              </Text>
              <Text style={styles.appearanceCaption}>Auto</Text>
              {themeMode === 'system' && (
                <View style={styles.checkBadge}>
                  <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>

            {/* Light Option */}
            <TouchableOpacity
              style={[
                styles.appearanceOption,
                themeMode === 'light' && styles.appearanceOptionSelected,
              ]}
              onPress={() => setThemeMode('light')}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.appearanceIconCircle,
                  themeMode === 'light' && styles.appearanceIconCircleSelected,
                ]}
              >
                <Ionicons
                  name="sunny"
                  size={20}
                  color={themeMode === 'light' ? '#FFFFFF' : '#FF9500'}
                />
              </View>
              <Text
                style={[
                  styles.appearanceText,
                  themeMode === 'light' && styles.appearanceTextSelected,
                ]}
              >
                Light
              </Text>
              <Text style={styles.appearanceCaption}>Clean</Text>
              {themeMode === 'light' && (
                <View style={styles.checkBadge}>
                  <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>

            {/* Dark Option */}
            <TouchableOpacity
              style={[
                styles.appearanceOption,
                themeMode === 'dark' && styles.appearanceOptionSelected,
              ]}
              onPress={() => setThemeMode('dark')}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.appearanceIconCircle,
                  themeMode === 'dark' && styles.appearanceIconCircleSelected,
                ]}
              >
                <Ionicons
                  name="moon"
                  size={20}
                  color={themeMode === 'dark' ? '#FFFFFF' : '#8E8E93'}
                />
              </View>
              <Text
                style={[
                  styles.appearanceText,
                  themeMode === 'dark' && styles.appearanceTextSelected,
                ]}
              >
                Dark
              </Text>
              <Text style={styles.appearanceCaption}>OLED</Text>
              {themeMode === 'dark' && (
                <View style={styles.checkBadge}>
                  <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* CATEGORIES SECTION */}
        <Text style={styles.sectionHeader}>CATEGORIES & TAGS</Text>
        <View style={styles.groupedCard}>
          <TouchableOpacity
            style={styles.cellRow}
            onPress={() => setCategoriesModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={[styles.cellIconBadge, { backgroundColor: '#AF52DE' }]}>
              <Ionicons name="grid" size={18} color="#FFFFFF" />
            </View>
            <View style={styles.cellContent}>
              <Text style={styles.cellTitle}>Manage Categories</Text>
              <Text style={styles.cellSubtitle}>Icons, colors & budget classifications</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* CURRENCY & VALUATION SECTION */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeader}>CURRENCY & EXCHANGE RATES</Text>
          <TouchableOpacity
            onPress={() => setShowAddModal(true)}
            activeOpacity={0.7}
            style={styles.headerActionBtn}
          >
            <Text style={styles.headerActionText}>+ Add Custom</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.groupedCard}>
          {/* Active Currency Cell */}
          <TouchableOpacity
            style={styles.cellRow}
            onPress={() => setSelectModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={[styles.cellIconBadge, { backgroundColor: '#007AFF' }]}>
              <Text style={styles.currencyBadgeSymbol}>{activeCurrency.symbol}</Text>
            </View>
            <View style={styles.cellContent}>
              <Text style={styles.cellTitle}>Active Currency</Text>
              <Text style={styles.cellSubtitle}>
                {activeCurrency.name} ({activeCurrency.code})
              </Text>
            </View>
            <View style={styles.cellRightWrap}>
              <Text style={styles.cellValueText}>1 USD = {activeCurrency.rate}</Text>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.textTertiary} />
            </View>
          </TouchableOpacity>

          <View style={styles.separator} />

          {/* Quick Edit Current Currency Rate */}
          <TouchableOpacity
            style={styles.cellRow}
            onPress={() => handleEditRate(activeCurrency)}
            activeOpacity={0.7}
          >
            <View style={[styles.cellIconBadge, { backgroundColor: '#34C759' }]}>
              <Ionicons name="calculator" size={18} color="#FFFFFF" />
            </View>
            <View style={styles.cellContent}>
              <Text style={styles.cellTitle}>Adjust Exchange Rate</Text>
              <Text style={styles.cellSubtitle}>
                Edit rate for {activeCurrency.code} ({activeCurrency.rate} / USD)
              </Text>
            </View>
            <Ionicons name="create-outline" size={18} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* FIREBASE CLOUD SYNC SECTION */}
        <Text style={styles.sectionHeader}>FIREBASE CLOUD SYNC</Text>
        <View style={styles.groupedCard}>
          {/* Status Header Cell */}
          <TouchableOpacity style={styles.cellRow} onPress={showFirebaseInfo} activeOpacity={0.7}>
            <View style={[styles.cellIconBadge, { backgroundColor: '#FF9500' }]}>
              <Ionicons name="logo-firebase" size={18} color="#FFFFFF" />
            </View>
            <View style={styles.cellContent}>
              <Text style={styles.cellTitle}>Cloud Database</Text>
              <Text style={styles.cellSubtitle}>
                {firebaseConfig.projectId} • {lastSyncTime ? `Last: ${lastSyncTime}` : 'Offline-first'}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                cloudSyncStatus === 'synced' && styles.statusBadgeSynced,
                cloudSyncStatus === 'syncing' && styles.statusBadgeSyncing,
                cloudSyncStatus === 'error' && styles.statusBadgeError,
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  cloudSyncStatus === 'synced' && styles.statusDotSynced,
                  cloudSyncStatus === 'syncing' && styles.statusDotSyncing,
                  cloudSyncStatus === 'error' && styles.statusDotError,
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  cloudSyncStatus === 'synced' && styles.statusTextSynced,
                  cloudSyncStatus === 'syncing' && styles.statusTextSyncing,
                  cloudSyncStatus === 'error' && styles.statusTextError,
                ]}
              >
                {cloudSyncStatus === 'synced'
                  ? 'Live'
                  : cloudSyncStatus === 'syncing'
                  ? 'Syncing'
                  : cloudSyncStatus === 'error'
                  ? 'Check Rules'
                  : 'Offline'}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.separator} />

          {/* Sync Now */}
          <TouchableOpacity
            style={styles.cellRow}
            onPress={handleSyncNow}
            disabled={syncInProgress}
            activeOpacity={0.7}
          >
            <View style={[styles.cellIconBadge, { backgroundColor: '#007AFF' }]}>
              {syncInProgress ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="sync" size={18} color="#FFFFFF" />
              )}
            </View>
            <View style={styles.cellContent}>
              <Text style={styles.cellTitle}>Sync Now</Text>
              <Text style={styles.cellSubtitle}>Merge local & cloud entries seamlessly</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textTertiary} />
          </TouchableOpacity>

          <View style={styles.separator} />

          {/* Upload Local to Cloud */}
          <TouchableOpacity
            style={styles.cellRow}
            onPress={handleBackupToCloud}
            disabled={syncInProgress}
            activeOpacity={0.7}
          >
            <View style={[styles.cellIconBadge, { backgroundColor: '#34C759' }]}>
              <Ionicons name="cloud-upload" size={18} color="#FFFFFF" />
            </View>
            <View style={styles.cellContent}>
              <Text style={styles.cellTitle}>Backup to Cloud</Text>
              <Text style={styles.cellSubtitle}>Upload current device state to Firestore</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textTertiary} />
          </TouchableOpacity>

          <View style={styles.separator} />

          {/* Restore from Cloud */}
          <TouchableOpacity
            style={styles.cellRow}
            onPress={handleRestoreFromCloud}
            disabled={syncInProgress}
            activeOpacity={0.7}
          >
            <View style={[styles.cellIconBadge, { backgroundColor: '#FF3B30' }]}>
              <Ionicons name="cloud-download" size={18} color="#FFFFFF" />
            </View>
            <View style={styles.cellContent}>
              <Text style={[styles.cellTitle, { color: theme.colors.danger }]}>
                Restore from Cloud
              </Text>
              <Text style={styles.cellSubtitle}>Download remote state onto this device</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textTertiary} />
          </TouchableOpacity>

          <View style={styles.separator} />

          {/* Ping Test */}
          <TouchableOpacity
            style={styles.cellRow}
            onPress={handleTestConnection}
            disabled={syncInProgress}
            activeOpacity={0.7}
          >
            <View style={[styles.cellIconBadge, { backgroundColor: '#5856D6' }]}>
              <Ionicons name="pulse" size={18} color="#FFFFFF" />
            </View>
            <View style={styles.cellContent}>
              <Text style={styles.cellTitle}>Test Connection</Text>
              <Text style={styles.cellSubtitle}>Verify ping & Firestore read/write permissions</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* ALL AVAILABLE CURRENCIES */}
        <Text style={styles.sectionHeader}>SUPPORTED CURRENCIES & RATES</Text>
        <View style={styles.groupedCard}>
          {currencies.map((curr, index) => {
            const isSelected = curr.code === activeCurrency.code;
            return (
              <React.Fragment key={curr.code}>
                {index > 0 && <View style={styles.separator} />}
                <TouchableOpacity
                  style={styles.currencyRow}
                  onPress={() => setActiveCurrencyCode(curr.code)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.currencyIconWrap,
                      isSelected && { backgroundColor: theme.colors.primary },
                    ]}
                  >
                    <Text
                      style={[
                        styles.currencyIconText,
                        isSelected && { color: '#FFFFFF', fontWeight: '800' },
                      ]}
                    >
                      {curr.symbol}
                    </Text>
                  </View>
                  <View style={styles.currencyInfo}>
                    <Text style={styles.currencyRowName}>{curr.name}</Text>
                    <Text style={styles.currencyRowRate}>
                      1 USD = {curr.rate} {curr.code}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.editPill}
                    onPress={() => handleEditRate(curr)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="pencil" size={13} color={theme.colors.primary} />
                    <Text style={styles.editPillText}>Edit</Text>
                  </TouchableOpacity>
                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={theme.colors.primary}
                      style={{ marginLeft: 8 }}
                    />
                  )}
                </TouchableOpacity>
              </React.Fragment>
            );
          })}
        </View>

        {/* APP INFO FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Monthly Budget & Expense Manager</Text>
          <Text style={styles.footerSub}>Version 1.0.0 • Offline-first with Cloud Sync</Text>
        </View>
      </ScrollView>

      {/* MODAL 1: Currency Dropdown Picker */}
      <Modal visible={selectModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalSheetTitle}>Select Currency</Text>
              <TouchableOpacity onPress={() => setSelectModalVisible(false)}>
                <Ionicons name="close-circle" size={26} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 380 }}>
              {currencies.map((curr) => {
                const isSelected = curr.code === activeCurrency.code;
                return (
                  <TouchableOpacity
                    key={curr.code}
                    style={[styles.modalSelectItem, isSelected && styles.modalSelectItemActive]}
                    onPress={() => {
                      setActiveCurrencyCode(curr.code);
                      setSelectModalVisible(false);
                    }}
                  >
                    <View style={styles.modalSelectLeft}>
                      <View style={styles.modalSelectSymbolBadge}>
                        <Text style={styles.modalSelectSymbol}>{curr.symbol}</Text>
                      </View>
                      <View>
                        <Text style={styles.modalSelectName}>{curr.name}</Text>
                        <Text style={styles.modalSelectRate}>
                          1 USD = {curr.rate} {curr.code}
                        </Text>
                      </View>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={22} color={theme.colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: Edit Exchange Rate */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            <Text style={styles.modalSheetTitle}>
              Update Rate: {editingCurrency?.name} ({editingCurrency?.code})
            </Text>
            <Text style={styles.modalInputLabel}>Exchange rate against 1 USD base:</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              value={rateInput}
              onChangeText={setRateInput}
              placeholder="e.g. 83.5"
              placeholderTextColor={theme.colors.textTertiary}
            />
            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnSave]}
                onPress={handleSaveRate}
              >
                <Text style={styles.modalBtnSaveText}>Save Rate</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL 3: Add Custom Currency */}
      <Modal visible={showAddModal} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            <Text style={styles.modalSheetTitle}>Add Custom Currency</Text>
            <Text style={styles.modalInputLabel}>Currency Code (e.g. CAD, JPY)</Text>
            <TextInput
              style={styles.modalInput}
              autoCapitalize="characters"
              maxLength={4}
              value={newCode}
              onChangeText={setNewCode}
              placeholder="e.g. SGD"
              placeholderTextColor={theme.colors.textTertiary}
            />
            <Text style={styles.modalInputLabel}>Currency Symbol (e.g. $, ¥, ₹)</Text>
            <TextInput
              style={styles.modalInput}
              maxLength={4}
              value={newSymbol}
              onChangeText={setNewSymbol}
              placeholder="e.g. S$"
              placeholderTextColor={theme.colors.textTertiary}
            />
            <Text style={styles.modalInputLabel}>Full Name</Text>
            <TextInput
              style={styles.modalInput}
              value={newName}
              onChangeText={setNewName}
              placeholder="e.g. Singapore Dollar"
              placeholderTextColor={theme.colors.textTertiary}
            />
            <Text style={styles.modalInputLabel}>Exchange Rate (1 USD = ?)</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="numeric"
              value={newRate}
              onChangeText={setNewRate}
              placeholder="e.g. 1.35"
              placeholderTextColor={theme.colors.textTertiary}
            />
            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnSave]}
                onPress={handleCreateCurrency}
              >
                <Text style={styles.modalBtnSaveText}>Add Currency</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Full Categories Screen Modal */}
      <Modal
        visible={categoriesModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setCategoriesModalVisible(false)}
      >
        <CategoriesScreen onClose={() => setCategoriesModalVisible(false)} />
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
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 8,
    },
    headerTitle: {
      fontSize: 34,
      fontWeight: '700',
      color: theme.colors.text,
      letterSpacing: -0.6,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingBottom: 40,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
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
      marginTop: 22,
      marginBottom: 8,
      paddingHorizontal: 4,
    },
    headerActionBtn: {
      paddingVertical: 2,
      paddingHorizontal: 4,
    },
    headerActionText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.primary,
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
      marginLeft: 54,
    },
    cellRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      minHeight: 52,
    },
    cellIconBadge: {
      width: 34,
      height: 34,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
    },
    currencyBadgeSymbol: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
    },
    cellContent: {
      flex: 1,
      justifyContent: 'center',
    },
    cellTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      letterSpacing: -0.2,
    },
    cellSubtitle: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    cellRightWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    cellValueText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.textSecondary,
    },
    // Appearance Segmented Selector
    appearanceRow: {
      flexDirection: 'row',
      padding: 10,
      gap: 10,
    },
    appearanceOption: {
      flex: 1,
      backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
      borderRadius: theme.radii.md,
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 6,
      borderWidth: 1.5,
      borderColor: 'transparent',
      position: 'relative',
    },
    appearanceOptionSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: isDark ? '#3A3A3C' : '#FFFFFF',
      ...theme.shadows.card,
    },
    appearanceIconCircle: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    appearanceIconCircleSelected: {
      backgroundColor: theme.colors.primary,
    },
    appearanceText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    appearanceTextSelected: {
      color: theme.colors.text,
      fontWeight: '700',
    },
    appearanceCaption: {
      fontSize: 11,
      color: theme.colors.textTertiary,
      marginTop: 2,
    },
    checkBadge: {
      position: 'absolute',
      top: 6,
      right: 6,
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    // Status Badge
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: theme.radii.full,
      backgroundColor: 'rgba(142, 142, 147, 0.15)',
      gap: 5,
    },
    statusBadgeSynced: {
      backgroundColor: theme.colors.successGlow,
    },
    statusBadgeSyncing: {
      backgroundColor: theme.colors.primaryGlow,
    },
    statusBadgeError: {
      backgroundColor: theme.colors.dangerGlow,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.colors.textTertiary,
    },
    statusDotSynced: {
      backgroundColor: theme.colors.success,
    },
    statusDotSyncing: {
      backgroundColor: theme.colors.primary,
    },
    statusDotError: {
      backgroundColor: theme.colors.danger,
    },
    statusText: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    statusTextSynced: {
      color: theme.colors.success,
    },
    statusTextSyncing: {
      color: theme.colors.primary,
    },
    statusTextError: {
      color: theme.colors.danger,
    },
    // Currency list item
    currencyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    currencyIconWrap: {
      width: 34,
      height: 34,
      borderRadius: 9,
      backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    currencyIconText: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.text,
    },
    currencyInfo: {
      flex: 1,
    },
    currencyRowName: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.text,
    },
    currencyRowRate: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 1,
    },
    editPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: theme.radii.sm,
      backgroundColor: theme.colors.primaryGlow,
    },
    editPillText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    footer: {
      alignItems: 'center',
      marginTop: 36,
      marginBottom: 20,
    },
    footerText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    footerSub: {
      fontSize: 11,
      color: theme.colors.textTertiary,
      marginTop: 4,
    },
    // Modals
    modalOverlay: {
      flex: 1,
      backgroundColor: theme.colors.backdrop,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalSheet: {
      width: '100%',
      maxWidth: 420,
      backgroundColor: theme.colors.surfaceCard,
      borderRadius: theme.radii.xl,
      padding: 20,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      ...theme.shadows.card,
    },
    modalHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    modalSheetTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 12,
    },
    modalInputLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      marginBottom: 6,
      marginTop: 10,
    },
    modalInput: {
      backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
      borderRadius: theme.radii.md,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: theme.colors.text,
      fontSize: 15,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    },
    modalActionsRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 20,
    },
    modalBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: theme.radii.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalBtnCancel: {
      backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA',
    },
    modalBtnCancelText: {
      color: theme.colors.text,
      fontWeight: '600',
      fontSize: 15,
    },
    modalBtnSave: {
      backgroundColor: theme.colors.primary,
    },
    modalBtnSaveText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 15,
    },
    modalSelectItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: theme.radii.md,
      marginBottom: 6,
    },
    modalSelectItemActive: {
      backgroundColor: theme.colors.primaryGlow,
    },
    modalSelectLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    modalSelectSymbolBadge: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA',
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalSelectSymbol: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.text,
    },
    modalSelectName: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.text,
    },
    modalSelectRate: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
  });
