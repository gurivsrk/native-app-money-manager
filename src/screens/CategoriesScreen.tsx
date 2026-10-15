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
import { Category } from '../types';
import { theme } from '../constants/theme';

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

interface Props {
  onClose?: () => void;
}

export const CategoriesScreen: React.FC<Props> = ({ onClose }) => {
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
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {onClose && (
            <TouchableOpacity onPress={onClose} style={styles.closeHeaderBtn} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
            </TouchableOpacity>
          )}
          <View>
            <Text style={styles.headerSubtitle}>Manage & Customize</Text>
            <Text style={styles.headerTitle}>Categories</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={openAddModal} activeOpacity={0.8}>
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Toggle Income / Expense Categories */}
        <View style={styles.tabToggle}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'expense' && styles.tabBtnActiveExpense]}
            onPress={() => setActiveTab('expense')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="arrow-down-circle"
              size={16}
              color={activeTab === 'expense' ? '#FFF' : theme.colors.dangerLight}
            />
            <Text style={[styles.tabBtnText, activeTab === 'expense' && styles.tabBtnTextActive]}>
              Expenses
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'income' && styles.tabBtnActiveIncome]}
            onPress={() => setActiveTab('income')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="arrow-up-circle"
              size={16}
              color={activeTab === 'income' ? '#FFF' : theme.colors.successLight}
            />
            <Text style={[styles.tabBtnText, activeTab === 'income' && styles.tabBtnTextActive]}>
              Income
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.listHeader}>
            {activeTab === 'expense' ? 'Expense' : 'Income'} Categories ({filteredCategories.length})
          </Text>
          <Text style={styles.hintText}>Tap to customize</Text>
        </View>

        <View style={styles.categoryGrid}>
          {filteredCategories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={styles.categoryCard}
              onPress={() => openEditModal(cat)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.iconWrap,
                  { backgroundColor: `${cat.color}20`, borderColor: `${cat.color}40` },
                ]}
              >
                <Ionicons name={(cat.icon as any) || 'pricetag'} size={22} color={cat.color} />
              </View>

              <Text style={styles.catName} numberOfLines={2}>
                {cat.name}
              </Text>

              <View style={styles.editIndicator}>
                <Ionicons name="pencil-outline" size={13} color={theme.colors.textTertiary} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* Add / Edit Category Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  setEditingCategory(null);
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
              <Text style={styles.fieldLabel}>Category Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Groceries, Gym, Rent"
                placeholderTextColor={theme.colors.textTertiary}
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.fieldLabel}>Color Theme</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorsRow}>
                {COLOR_PRESETS.map((color) => {
                  const isSelected = selectedColor === color;
                  return (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorDot,
                        { backgroundColor: color },
                        isSelected && styles.colorDotSelected,
                      ]}
                      onPress={() => setSelectedColor(color)}
                      activeOpacity={0.8}
                    >
                      {isSelected && <Ionicons name="checkmark" size={18} color="#FFF" />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={styles.fieldLabel}>Select Icon</Text>
              <View style={styles.iconsGrid}>
                {ICON_PRESETS.map((icon) => {
                  const isSelected = selectedIcon === icon;
                  return (
                    <TouchableOpacity
                      key={icon}
                      style={[
                        styles.iconPickerBox,
                        isSelected && {
                          borderColor: selectedColor,
                          backgroundColor: `${selectedColor}20`,
                        },
                      ]}
                      onPress={() => setSelectedIcon(icon)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={icon as any}
                        size={22}
                        color={isSelected ? selectedColor : theme.colors.textSecondary}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
                <Text style={styles.saveBtnText}>
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </Text>
              </TouchableOpacity>

              {editingCategory && (
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(editingCategory)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="trash-outline" size={18} color={theme.colors.dangerLight} />
                  <Text style={styles.deleteBtnText}>Delete Category</Text>
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  closeHeaderBtn: {
    padding: 6,
    borderRadius: theme.radii.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
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
  tabToggle: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceCard,
    padding: 4,
    borderRadius: theme.radii.md,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: theme.radii.sm,
    gap: 6,
  },
  tabBtnActiveExpense: {
    backgroundColor: 'rgba(244, 63, 94, 0.25)',
    borderWidth: 1,
    borderColor: theme.colors.danger,
  },
  tabBtnActiveIncome: {
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    borderWidth: 1,
    borderColor: theme.colors.success,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  listHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
  },
  hintText: {
    fontSize: 11,
    color: theme.colors.textTertiary,
    fontStyle: 'italic',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryCard: {
    width: '31%',
    backgroundColor: theme.colors.surfaceCard,
    padding: 12,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
  },
  catName: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
    minHeight: 28,
  },
  editIndicator: {
    marginTop: 4,
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
    maxHeight: '90%',
    borderTopWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: -0.3,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    marginBottom: 6,
    marginTop: 8,
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
    marginBottom: 14,
    color: theme.colors.text,
    fontWeight: '600',
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
    borderColor: '#FFFFFF',
  },
  iconsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  iconPickerBox: {
    width: 46,
    height: 46,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
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
