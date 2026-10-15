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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBudget } from '../context/BudgetContext';
import { Currency } from '../types';
import { firebaseConfig } from '../config/firebase';

export const SettingsScreen: React.FC = () => {
  const {
    currencies,
    activeCurrency,
    setActiveCurrencyCode,
    updateCurrencyRate,
    addCustomCurrency,
  } = useBudget();

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

  const showFirebaseInfo = () => {
    Alert.alert(
      'Firebase Configuration',
      `Firebase is initialized in src/config/firebase.ts.\n\nProject ID: ${firebaseConfig.projectId}\n\nTo connect your live Firebase project, replace the keys in src/config/firebase.ts.`
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      <View style={styles.header}>
        <Text style={styles.headerSubtitle}>Preferences & Sync</Text>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Active Currency Summary Card */}
        <View style={styles.activeCurrencyCard}>
          <View style={styles.currencyTop}>
            <View style={styles.currencySymbolBadge}>
              <Text style={styles.currencySymbolText}>{activeCurrency.symbol}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.activeCurrencyLabel}>Default Currency</Text>
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

        {/* Currency Select Dropdown Input */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Default Currency & Rate</Text>
          <TouchableOpacity
            style={styles.addCurrencyBtn}
            onPress={() => setShowAddModal(true)}
          >
            <Ionicons name="add" size={18} color="#3B82F6" />
            <Text style={styles.addCurrencyBtnText}>+ Custom Currency</Text>
          </TouchableOpacity>
        </View>

        {/* Interactive Select Box Dropdown */}
        <View style={styles.selectCard}>
          <Text style={styles.selectFieldLabel}>Choose Active Currency</Text>
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
                  Rate: 1 USD = {activeCurrency.rate} {activeCurrency.code}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-down" size={20} color="#64748B" />
          </TouchableOpacity>

          {/* Quick Edit Current Rate Button */}
          <TouchableOpacity
            style={styles.editCurrentRateBtn}
            onPress={() => handleEditRate(activeCurrency)}
          >
            <Ionicons name="create-outline" size={17} color="#2563EB" />
            <Text style={styles.editCurrentRateText}>
              Edit Exchange Rate for {activeCurrency.code} ({activeCurrency.rate} / $)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Firebase Cloud Sync Card */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Cloud Synchronization</Text>
        <TouchableOpacity style={styles.syncCard} onPress={showFirebaseInfo}>
          <View style={styles.syncHeader}>
            <View style={styles.firebaseLogoWrap}>
              <Ionicons name="cloud-upload-outline" size={24} color="#F59E0B" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.syncTitle}>Firebase Firestore Sync</Text>
              <Text style={styles.syncSub}>Automatic cloud sync & cross-device backup</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </View>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Select Option Dropdown Modal */}
      <Modal visible={selectModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.selectSheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Select Currency</Text>
              <TouchableOpacity onPress={() => setSelectModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
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
                            isSelected && { color: '#1E40AF', fontWeight: '800' },
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
                        <Ionicons name="checkmark-circle" size={22} color="#2563EB" />
                      ) : (
                        <TouchableOpacity
                          style={styles.smallRateEditBtn}
                          onPress={() => {
                            setSelectModalVisible(false);
                            handleEditRate(curr);
                          }}
                        >
                          <Ionicons name="pencil-outline" size={15} color="#64748B" />
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
                <Ionicons name="close" size={24} color="#64748B" />
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
              autoCapitalize="characters"
              value={newCode}
              onChangeText={setNewCode}
            />

            <Text style={styles.fieldLabel}>Currency Symbol (e.g. Fr, $, €)</Text>
            <TextInput
              style={styles.sheetInput}
              placeholder="e.g. Fr."
              value={newSymbol}
              onChangeText={setNewSymbol}
            />

            <Text style={styles.fieldLabel}>Currency Full Name</Text>
            <TextInput
              style={styles.sheetInput}
              placeholder="e.g. Swiss Franc"
              value={newName}
              onChangeText={setNewName}
            />

            <Text style={styles.fieldLabel}>Exchange Rate (Relative to 1 USD)</Text>
            <TextInput
              style={styles.sheetInput}
              keyboardType="numeric"
              placeholder="e.g. 0.90"
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
    backgroundColor: '#0F172A',
  },
  header: {
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
  scrollContent: {
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 24,
    minHeight: '100%',
  },
  activeCurrencyCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
  },
  currencyTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  currencySymbolBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencySymbolText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  activeCurrencyLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  activeCurrencyName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  activeRatePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  activeRatePillText: {
    color: '#93C5FD',
    fontSize: 11,
    fontWeight: '700',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  addCurrencyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addCurrencyBtnText: {
    color: '#3B82F6',
    fontWeight: '700',
    fontSize: 13,
  },
  selectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectFieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  selectLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectFlagCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  selectSymbol: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2563EB',
  },
  selectMainText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  selectSubText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  editCurrentRateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    paddingVertical: 10,
    gap: 6,
  },
  editCurrentRateText: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '700',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  dropdownItemSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  dropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dropdownSymbolCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownSymbolCircleActive: {
    backgroundColor: '#2563EB',
  },
  dropdownSymbolText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#334155',
  },
  dropdownName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  dropdownRate: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  dropdownRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallRateEditBtn: {
    padding: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  syncCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  syncHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  firebaseLogoWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  syncTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  syncSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  selectSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: '80%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  dialogCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 40,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  dialogSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
  },
  dialogInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
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
    color: '#64748B',
    fontWeight: '600',
  },
  dialogSaveBtn: {
    backgroundColor: '#3B82F6',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  dialogSaveText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 4,
    marginTop: 8,
  },
  sheetInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  sheetSaveBtn: {
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  sheetSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
