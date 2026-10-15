import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
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
import { Ionicons } from '@expo/vector-icons';
import { useBudget } from '../context/BudgetContext';
import { Currency } from '../types';
import { firebaseConfig } from '../config/firebase';
import { CategoriesScreen } from './CategoriesScreen';
import { theme } from '../constants/theme';

export const SettingsScreen: React.FC = () => {
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
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />

      <View style={styles.header}>
        <Text style={styles.headerSubtitle}>Preferences & Sync</Text>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Categories Navigation Card */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="grid" size={17} color={theme.colors.purpleLight} />
            <Text style={styles.sectionTitle}>Categories & Classification</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.actionNavCard}
          onPress={() => setCategoriesModalVisible(true)}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.navCardIconBox,
              { backgroundColor: theme.colors.purpleGlow, borderColor: 'rgba(139, 92, 246, 0.4)' },
            ]}
          >
            <Ionicons name="grid-outline" size={22} color={theme.colors.purpleLight} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.navCardTitle}>Manage Categories</Text>
            <Text style={styles.navCardSubtitle}>
              Customize income and expense categories, icons & colors
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.textTertiary} />
        </TouchableOpacity>

        {/* Currency Preferences Section */}
        <View style={[styles.sectionHeaderRow, { marginTop: 20 }]}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="cash" size={17} color={theme.colors.primaryLight} />
            <Text style={styles.sectionTitle}>Default Currency & Rate</Text>
          </View>
          <TouchableOpacity
            style={styles.addCurrencyBtn}
            onPress={() => setShowAddModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={16} color={theme.colors.primaryLight} />
            <Text style={styles.addCurrencyBtnText}>+ Custom</Text>
          </TouchableOpacity>
        </View>

        {/* Active Currency Summary Card */}
        <View style={styles.activeCurrencyCard}>
          <View style={styles.currencyTop}>
            <View style={styles.currencySymbolBadge}>
              <Text style={styles.currencySymbolText}>{activeCurrency.symbol}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.activeCurrencyLabel}>Active Currency</Text>
              <Text style={styles.activeCurrencyName}>
                {activeCurrency.name} ({activeCurrency.code})
              </Text>
            </View>
            <View style={styles.activeRatePill}>
              <Text style={styles.activeRatePillText}>
                1 USD = {activeCurrency.rate} {activeCurrency.code}
              </Text>
            </View>
          </View>
        </View>

        {/* Choose Currency Picker Card */}
        <View style={styles.selectCard}>
          <Text style={styles.selectFieldLabel}>Select Base Display Currency</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setSelectModalVisible(true)}
            activeOpacity={0.8}
          >
            <View style={styles.selectLeft}>
              <View style={styles.selectFlagCircle}>
                <Text style={styles.selectSymbol}>{activeCurrency.symbol}</Text>
              </View>
              <View>
                <Text style={styles.selectMainText}>
                  {activeCurrency.name} ({activeCurrency.code})
                </Text>
                <Text style={styles.selectSubText}>
                  Exchange Rate: 1 USD = {activeCurrency.rate} {activeCurrency.code}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-down" size={18} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          {/* Quick Edit Current Rate Button */}
          <TouchableOpacity
            style={styles.editCurrentRateBtn}
            onPress={() => handleEditRate(activeCurrency)}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={16} color={theme.colors.primaryLight} />
            <Text style={styles.editCurrentRateText}>
              Edit Rate for {activeCurrency.code} ({activeCurrency.rate} / $)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Firebase Cloud Sync Card */}
        <View style={[styles.sectionHeaderRow, { marginTop: 24 }]}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="cloud" size={17} color={theme.colors.warningLight} />
            <Text style={styles.sectionTitle}>Cloud Synchronization</Text>
          </View>
        </View>

        <View style={styles.syncCard}>
          <View style={styles.syncHeader}>
            <View style={styles.firebaseLogoWrap}>
              <Ionicons name="logo-firebase" size={24} color="#F59E0B" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.syncTitleRow}>
                <Text style={styles.syncTitle}>Firebase Firestore</Text>
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
                      ? 'Live & Synced'
                      : cloudSyncStatus === 'syncing'
                      ? 'Syncing...'
                      : cloudSyncStatus === 'error'
                      ? 'Needs Setup'
                      : 'Offline'}
                  </Text>
                </View>
              </View>
              <Text style={styles.syncSub}>Project: {firebaseConfig.projectId}</Text>
            </View>
            <TouchableOpacity onPress={showFirebaseInfo} style={styles.syncInfoBtn}>
              <Ionicons name="information-circle-outline" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Sync status metadata row */}
          <View style={styles.syncMetaRow}>
            <Ionicons name="time-outline" size={14} color={theme.colors.textSecondary} />
            <Text style={styles.syncMetaText}>
              Last Synced:{' '}
              {lastSyncTime
                ? new Date(lastSyncTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })
                : 'Pending sync'}
            </Text>
          </View>

          {/* Quick Action Buttons */}
          <View style={styles.syncActionGrid}>
            <TouchableOpacity
              style={[styles.syncActionButton, styles.syncPrimaryBtn]}
              onPress={handleSyncNow}
              disabled={syncInProgress}
              activeOpacity={0.8}
            >
              {syncInProgress ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="refresh-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.syncPrimaryBtnText}>Sync Now</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.syncActionButton, styles.syncSecondaryBtn]}
              onPress={handleTestConnection}
              disabled={syncInProgress}
              activeOpacity={0.8}
            >
              <Ionicons name="wifi-outline" size={16} color={theme.colors.primaryLight} />
              <Text style={styles.syncSecondaryBtnText}>Test Conn</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.syncActionGrid, { marginTop: 8 }]}>
            <TouchableOpacity
              style={[styles.syncActionButton, styles.syncOutlineBtn]}
              onPress={handleBackupToCloud}
              disabled={syncInProgress}
              activeOpacity={0.8}
            >
              <Ionicons name="cloud-upload-outline" size={16} color={theme.colors.textSecondary} />
              <Text style={styles.syncOutlineBtnText}>Backup to Cloud</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.syncActionButton, styles.syncOutlineBtn]}
              onPress={handleRestoreFromCloud}
              disabled={syncInProgress}
              activeOpacity={0.8}
            >
              <Ionicons name="cloud-download-outline" size={16} color={theme.colors.textSecondary} />
              <Text style={styles.syncOutlineBtnText}>Restore</Text>
            </TouchableOpacity>
          </View>

          {/* Offline-First notice */}
          <View style={styles.syncNotice}>
            <Ionicons name="shield-checkmark-outline" size={15} color={theme.colors.successLight} />
            <Text style={styles.syncNoticeText}>
              Offline-first: changes save instantly locally and sync to Firebase whenever online.
            </Text>
          </View>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* Categories Full Modal */}
      <Modal visible={categoriesModalVisible} animationType="slide">
        <CategoriesScreen onClose={() => setCategoriesModalVisible(false)} />
      </Modal>

      {/* Select Option Dropdown Modal */}
      <Modal visible={selectModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.selectSheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Select Currency</Text>
              <TouchableOpacity onPress={() => setSelectModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              {currencies.map((curr) => {
                const isSelected = curr.code === activeCurrency.code;
                return (
                  <TouchableOpacity
                    key={curr.code}
                    style={[styles.dropdownItem, isSelected && styles.dropdownItemSelected]}
                    onPress={async () => {
                      await setActiveCurrencyCode(curr.code);
                      setSelectModalVisible(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.dropdownLeft}>
                      <View
                        style={[
                          styles.dropdownSymbolCircle,
                          isSelected && styles.dropdownSymbolCircleActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.dropdownSymbolText,
                            isSelected && { color: '#FFFFFF' },
                          ]}
                        >
                          {curr.symbol}
                        </Text>
                      </View>
                      <View>
                        <Text
                          style={[
                            styles.dropdownName,
                            isSelected && { color: theme.colors.primaryLight, fontWeight: '800' },
                          ]}
                        >
                          {curr.name} ({curr.code})
                        </Text>
                        <Text style={styles.dropdownRate}>
                          1 USD = {curr.rate} {curr.code}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.dropdownRight}>
                      {isSelected ? (
                        <Ionicons name="checkmark-circle" size={22} color={theme.colors.primary} />
                      ) : (
                        <TouchableOpacity
                          style={styles.smallRateEditBtn}
                          onPress={() => {
                            setSelectModalVisible(false);
                            handleEditRate(curr);
                          }}
                        >
                          <Ionicons name="pencil-outline" size={15} color={theme.colors.textSecondary} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Rate Modal */}
      <Modal visible={modalVisible} animationType="fade" transparent>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.dialogCard}>
            <Text style={styles.dialogTitle}>Edit Exchange Rate</Text>
            <Text style={styles.dialogSubtitle}>
              Exchange rate for 1 USD to {editingCurrency?.name} ({editingCurrency?.code})
            </Text>

            <TextInput
              style={styles.dialogInput}
              keyboardType="numeric"
              placeholder="1.0"
              placeholderTextColor={theme.colors.textTertiary}
              value={rateInput}
              onChangeText={setRateInput}
            />

            <View style={styles.dialogActions}>
              <TouchableOpacity
                style={styles.dialogCancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.dialogCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.dialogSaveBtn} onPress={handleSaveRate}>
                <Text style={styles.dialogSaveText}>Save Rate</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Custom Currency Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalSheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Add Custom Currency</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              automaticallyAdjustKeyboardInsets={true}
              contentContainerStyle={{ paddingBottom: 40 }}
            >
              <Text style={styles.fieldLabel}>Currency Code (e.g. AUD, CHF)</Text>
              <TextInput
                style={styles.sheetInput}
                placeholder="e.g. CHF"
                placeholderTextColor={theme.colors.textTertiary}
                autoCapitalize="characters"
                value={newCode}
                onChangeText={setNewCode}
              />

              <Text style={styles.fieldLabel}>Currency Symbol (e.g. Fr, $, €)</Text>
              <TextInput
                style={styles.sheetInput}
                placeholder="e.g. Fr."
                placeholderTextColor={theme.colors.textTertiary}
                value={newSymbol}
                onChangeText={setNewSymbol}
              />

              <Text style={styles.fieldLabel}>Currency Full Name</Text>
              <TextInput
                style={styles.sheetInput}
                placeholder="e.g. Swiss Franc"
                placeholderTextColor={theme.colors.textTertiary}
                value={newName}
                onChangeText={setNewName}
              />

              <Text style={styles.fieldLabel}>Exchange Rate (Relative to 1 USD)</Text>
              <TextInput
                style={styles.sheetInput}
                keyboardType="numeric"
                placeholder="e.g. 0.90"
                placeholderTextColor={theme.colors.textTertiary}
                value={newRate}
                onChangeText={setNewRate}
              />

              <TouchableOpacity style={styles.sheetSaveBtn} onPress={handleCreateCurrency}>
                <Text style={styles.sheetSaveBtnText}>Add Currency</Text>
              </TouchableOpacity>
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
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    letterSpacing: -0.2,
  },
  actionNavCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceCard,
    padding: 16,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  navCardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1,
  },
  navCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 2,
  },
  navCardSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  addCurrencyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.primaryGlow,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  addCurrencyBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.primaryLight,
  },
  activeCurrencyCard: {
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radii.lg,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  currencyTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbolBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.colors.primaryGlow,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  currencySymbolText: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.primaryLight,
  },
  activeCurrencyLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  activeCurrencyName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 2,
  },
  activeRatePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  activeRatePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  selectCard: {
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.radii.md,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectFieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    padding: 12,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectFlagCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectSymbol: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
  },
  selectMainText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
  },
  selectSubText: {
    fontSize: 11,
    color: theme.colors.textTertiary,
    marginTop: 2,
  },
  editCurrentRateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingVertical: 6,
  },
  editCurrentRateText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primaryLight,
  },
  syncCard: {
    backgroundColor: theme.colors.surfaceCard,
    padding: 16,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  syncHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 6,
  },
  firebaseLogoWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  syncTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
  },
  syncSub: {
    fontSize: 11,
    color: theme.colors.textTertiary,
    marginTop: 2,
  },
  syncInfoBtn: {
    padding: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radii.xs,
    backgroundColor: theme.colors.surface,
  },
  statusBadgeSynced: {
    backgroundColor: theme.colors.successGlow,
  },
  statusBadgeSyncing: {
    backgroundColor: theme.colors.warningGlow,
  },
  statusBadgeError: {
    backgroundColor: theme.colors.dangerGlow,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.textSecondary,
    marginRight: 5,
  },
  statusDotSynced: {
    backgroundColor: theme.colors.successLight,
  },
  statusDotSyncing: {
    backgroundColor: theme.colors.warningLight,
  },
  statusDotError: {
    backgroundColor: theme.colors.dangerLight,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  statusTextSynced: {
    color: theme.colors.successLight,
  },
  statusTextSyncing: {
    color: theme.colors.warningLight,
  },
  statusTextError: {
    color: theme.colors.dangerLight,
  },
  syncMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  syncMetaText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  syncActionGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  syncActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: theme.radii.sm,
    gap: 6,
  },
  syncPrimaryBtn: {
    backgroundColor: theme.colors.primary,
  },
  syncPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  syncSecondaryBtn: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  syncSecondaryBtnText: {
    color: theme.colors.primaryLight,
    fontSize: 13,
    fontWeight: '700',
  },
  syncOutlineBtn: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  syncOutlineBtnText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  syncNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    padding: 10,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  syncNoticeText: {
    fontSize: 11,
    color: theme.colors.successLight,
    flex: 1,
    lineHeight: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.backdrop,
    justifyContent: 'flex-end',
  },
  selectSheet: {
    backgroundColor: theme.colors.surfaceElevated,
    borderTopLeftRadius: theme.radii.xl,
    borderTopRightRadius: theme.radii.xl,
    padding: 20,
    maxHeight: '80%',
    borderTopWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: theme.radii.sm,
    marginBottom: 6,
  },
  dropdownItemSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
  },
  dropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dropdownSymbolCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownSymbolCircleActive: {
    backgroundColor: theme.colors.primary,
  },
  dropdownSymbolText: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
  },
  dropdownName: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
  },
  dropdownRate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  dropdownRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallRateEditBtn: {
    padding: 6,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  dialogCard: {
    width: '90%',
    alignSelf: 'center',
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radii.lg,
    padding: 20,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 4,
  },
  dialogSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 16,
  },
  dialogInput: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 20,
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  dialogCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  dialogCancelText: {
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  dialogSaveBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: theme.radii.sm,
  },
  dialogSaveText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modalSheet: {
    backgroundColor: theme.colors.surfaceElevated,
    borderTopLeftRadius: theme.radii.xl,
    borderTopRightRadius: theme.radii.xl,
    padding: 20,
    borderTopWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    marginBottom: 4,
    marginTop: 8,
    textTransform: 'uppercase',
  },
  sheetInput: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: theme.colors.text,
  },
  sheetSaveBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    marginTop: 20,
  },
  sheetSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
