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
import { Category } from '../types';
import { Theme } from '../constants/theme';

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
  '#FF3B30', // Apple Red
  '#FF9500', // Apple Orange
  '#FFCC00', // Apple Yellow
  '#34C759', // Apple Green
  '#00C7BE', // Apple Teal
  '#007AFF', // Apple Blue
  '#5856D6', // Apple Indigo
  '#AF52DE', // Apple Purple
  '#FF2D55', // Apple Pink
  '#8E8E93', // Apple Gray
];

interface Props {
  onClose?: () => void;
}

export const CategoriesScreen: React.FC<Props> = ({ onClose }) => {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const { categories, addCategory, updateCategory, deleteCategory } = useBudget();
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');

  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('pricetag-outline');
  const [selectedColor, setSelectedColor] = useState('#FF3B30');

  const filteredCategories = categories.filter((c) => c.type === activeTab);

  const openAddModal = () => {
    setEditingCategory(null);
    setName('');
    setSelectedIcon(activeTab === 'expense' ? 'cart-outline' : 'wallet-outline');
    setSelectedColor(activeTab === 'expense' ? '#FF3B30' : '#34C759');
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
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${cat.name}"? Existing transactions will retain their history.`,
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
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {onClose && (
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="chevron-down" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          )}
          <View>
            <Text style={styles.headerSubtitle}>Classifications & Icons</Text>
            <Text style={styles.headerTitle}>Categories</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={openAddModal} activeOpacity={0.8}>
          <Ionicons name="add" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Apple iOS Native Segmented Tab */}
      <View style={styles.segmentedContainer}>
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'expense' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('expense')}
            activeOpacity={0.8}
          >
            <Text
              style={[styles.segmentText, activeTab === 'expense' && styles.segmentTextActive]}
            >
              Expense Categories
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'income' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('income')}
            activeOpacity={0.8}
          >
            <Text
              style={[styles.segmentText, activeTab === 'income' && styles.segmentTextActive]}
            >
              Income Categories
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionHeader}>
          {activeTab.toUpperCase()} CATEGORIES ({filteredCategories.length})
        </Text>

        <View style={styles.groupedCard}>
          {filteredCategories.map((cat, index) => (
            <React.Fragment key={cat.id}>
              {index > 0 && <View style={styles.separator} />}
              <TouchableOpacity
                style={styles.categoryRow}
                onPress={() => openEditModal(cat)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.iconBox,
                    {
                      backgroundColor: isDark ? `${cat.color}25` : `${cat.color}15`,
                    },
                  ]}
                >
                  <Ionicons name={(cat.icon as any) || 'pricetag-outline'} size={20} color={cat.color} />
                </View>

                <Text style={styles.categoryName} numberOfLines={1}>
                  {cat.name}
                </Text>

                <View style={styles.colorIndicatorRow}>
                  <View style={[styles.colorDot, { backgroundColor: cat.color }]} />
                  <Ionicons name="chevron-forward" size={16} color={theme.colors.textTertiary} />
                </View>
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </View>
      </ScrollView>

      {/* Modal Sheet for Add/Edit Category */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>
                {editingCategory ? 'Edit Category' : `New ${activeTab} Category`}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close-circle" size={26} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Category Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Groceries, Entertainment"
                placeholderTextColor={theme.colors.textTertiary}
              />

              <Text style={styles.inputLabel}>Theme Color</Text>
              <View style={styles.colorPresetsRow}>
                {COLOR_PRESETS.map((color) => {
                  const isSelected = selectedColor === color;
                  return (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorCircle,
                        { backgroundColor: color },
                        isSelected && styles.colorCircleSelected,
                      ]}
                      onPress={() => setSelectedColor(color)}
                    >
                      {isSelected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.inputLabel}>Icon Symbol</Text>
              <View style={styles.iconPresetsGrid}>
                {ICON_PRESETS.map((icon) => {
                  const isSelected = selectedIcon === icon;
                  return (
                    <TouchableOpacity
                      key={icon}
                      style={[
                        styles.iconPresetBtn,
                        isSelected && {
                          borderColor: selectedColor,
                          backgroundColor: `${selectedColor}20`,
                        },
                      ]}
                      onPress={() => setSelectedIcon(icon)}
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

              <View style={styles.modalActions}>
                {editingCategory && (
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(editingCategory)}
                  >
                    <Ionicons name="trash-outline" size={16} color={theme.colors.danger} />
                    <Text style={styles.deleteBtnText}>Delete</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                  <Text style={styles.saveBtnText}>
                    {editingCategory ? 'Save Changes' : 'Create Category'}
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
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    closeBtn: {
      padding: 4,
      marginRight: 4,
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
    // Segmented Control
    segmentedContainer: {
      paddingHorizontal: 16,
      paddingVertical: 6,
    },
    segmentedControl: {
      flexDirection: 'row',
      backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA',
      padding: 3,
      borderRadius: theme.radii.sm,
    },
    segmentBtn: {
      flex: 1,
      paddingVertical: 7,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.radii.xs,
    },
    segmentBtnActive: {
      backgroundColor: isDark ? '#636366' : '#FFFFFF',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.12,
      shadowRadius: 3,
      elevation: 2,
    },
    segmentText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    segmentTextActive: {
      color: isDark ? '#FFFFFF' : '#1C1C1E',
      fontWeight: '700',
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingBottom: 36,
    },
    sectionHeader: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.textTertiary,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginTop: 20,
      marginBottom: 8,
      paddingHorizontal: 4,
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
    categoryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    iconBox: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    categoryName: {
      flex: 1,
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      letterSpacing: -0.2,
    },
    colorIndicatorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    colorDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
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
    colorPresetsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginTop: 6,
    },
    colorCircle: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
    },
    colorCircleSelected: {
      borderWidth: 2,
      borderColor: '#FFFFFF',
    },
    iconPresetsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginTop: 6,
    },
    iconPresetBtn: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: 'transparent',
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
