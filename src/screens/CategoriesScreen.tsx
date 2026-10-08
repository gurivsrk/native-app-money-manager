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
import { Category } from '../types';

const ICON_PRESETS = [
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
  'shield-outline',
  'pizza-outline',
  'cafe-outline',
  'trending-up-outline',
  'pricetag-outline',
];

const COLOR_PRESETS = [
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

export const CategoriesScreen: React.FC = () => {
  const { categories, addCategory, updateCategory, deleteCategory } = useBudget();
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');

  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('pricetag-outline');
  const [selectedColor, setSelectedColor] = useState('#EF4444');

  const filteredCategories = categories.filter((c) => c.type === activeTab);

  const openAddModal = () => {
    setEditingCategory(null);
    setName('');
    setSelectedIcon(activeTab === 'expense' ? 'cart-outline' : 'wallet-outline');
    setSelectedColor(activeTab === 'expense' ? '#EF4444' : '#10B981');
    setModalVisible(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSelectedIcon(cat.icon);
    setSelectedColor(cat.color);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Missing Name', 'Please enter a category name.');
      return;
    }

    if (editingCategory) {
      await updateCategory(editingCategory.id, {
        name: name.trim(),
        icon: selectedIcon,
        color: selectedColor,
      });
    } else {
      await addCategory({
        name: name.trim(),
        type: activeTab,
        icon: selectedIcon,
        color: selectedColor,
      });
    }

    setModalVisible(false);
    setEditingCategory(null);
  };

  const handleDelete = (cat: Category) => {
    if (filteredCategories.length <= 1) {
      Alert.alert('Cannot Delete', `You must keep at least one ${cat.type} category.`);
      return;
    }

    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${cat.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteCategory(cat.id);
            setModalVisible(false);
            setEditingCategory(null);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>Manage & Customize</Text>
          <Text style={styles.headerTitle}>Categories</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Toggle Income / Expense Categories */}
        <View style={styles.tabToggle}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'expense' && styles.tabBtnActiveExpense]}
            onPress={() => setActiveTab('expense')}
          >
            <Ionicons
              name="arrow-down-circle"
              size={18}
              color={activeTab === 'expense' ? '#FFF' : '#EF4444'}
            />
            <Text style={[styles.tabBtnText, activeTab === 'expense' && styles.tabBtnTextActive]}>
              Expense Categories
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'income' && styles.tabBtnActiveIncome]}
            onPress={() => setActiveTab('income')}
          >
            <Ionicons
              name="arrow-up-circle"
              size={18}
              color={activeTab === 'income' ? '#FFF' : '#10B981'}
            />
            <Text style={[styles.tabBtnText, activeTab === 'income' && styles.tabBtnTextActive]}>
              Income Categories
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.listHeader}>
          {activeTab === 'expense' ? 'Expense' : 'Income'} Categories ({filteredCategories.length})
        </Text>

        <View style={styles.categoryGrid}>
          {filteredCategories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={styles.categoryCard}
              onPress={() => openEditModal(cat)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconWrap, { backgroundColor: cat.color }]}>
                <Ionicons name={(cat.icon as any) || 'pricetag'} size={22} color="#FFF" />
              </View>

              <Text style={styles.catName} numberOfLines={2}>
                {cat.name}
              </Text>

              <View style={styles.editBadge}>
                <Ionicons name="pencil-outline" size={13} color="#64748B" />
                <Text style={styles.editBadgeText}>Edit</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add / Edit Category Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingCategory ? 'Edit Category' : `Add ${activeTab.toUpperCase()} Category`}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  setEditingCategory(null);
                }}
              >
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 520 }}>
              <Text style={styles.fieldLabel}>Category Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Freelance, Coffee, Gym, Subscriptions"
                placeholderTextColor="#94A3B8"
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.fieldLabel}>Select Color</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorsRow}>
                {COLOR_PRESETS.map((col) => {
                  const isSelected = selectedColor === col;
                  return (
                    <TouchableOpacity
                      key={col}
                      style={[
                        styles.colorDot,
                        { backgroundColor: col },
                        isSelected && styles.colorDotSelected,
                      ]}
                      onPress={() => setSelectedColor(col)}
                    >
                      {isSelected && <Ionicons name="checkmark" size={16} color="#FFF" />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={styles.fieldLabel}>Select Icon</Text>
              <View style={styles.iconsGrid}>
                {ICON_PRESETS.map((ico) => {
                  const isSelected = selectedIcon === ico;
                  return (
                    <TouchableOpacity
                      key={ico}
                      style={[
                        styles.iconPickerBox,
                        isSelected && { borderColor: selectedColor, backgroundColor: `${selectedColor}15` },
                      ]}
                      onPress={() => setSelectedIcon(ico)}
                    >
                      <Ionicons
                        name={ico as any}
                        size={22}
                        color={isSelected ? selectedColor : '#64748B'}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </Text>
              </TouchableOpacity>

              {editingCategory && (
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(editingCategory)}
                >
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  <Text style={styles.deleteBtnText}>Delete Category</Text>
                </TouchableOpacity>
              )}
              <View style={{ height: 20 }} />
            </ScrollView>
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
  tabToggle: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  tabBtnActiveExpense: {
    backgroundColor: '#EF4444',
  },
  tabBtnActiveIncome: {
    backgroundColor: '#10B981',
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
  },
  listHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 14,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  iconWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  catName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  editBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  editBadgeText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
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
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#0F172A',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
    marginTop: 8,
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
    marginBottom: 14,
    color: '#0F172A',
  },
  colorsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  colorDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  colorDotSelected: {
    borderWidth: 3,
    borderColor: '#0F172A',
  },
  iconsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  iconPickerBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
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
