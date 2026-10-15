import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Platform,
  TouchableOpacity,
  Text,
  StatusBar,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { BudgetProvider, useBudget } from './src/context/BudgetContext';
import { HomeScreen } from './src/screens/HomeScreen';
import { AnalyticsScreen } from './src/screens/AnalyticsScreen';
import { AccountsScreen } from './src/screens/AccountsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { AddTransactionModal } from './src/components/AddTransactionModal';
import { theme } from './src/constants/theme';

const Tab = createBottomTabNavigator();
const DummyScreen = () => null;

function MainAppShell() {
  const isWeb = Platform.OS === 'web';
  const insets = useSafeAreaInsets();
  const [isFullscreen, setIsFullscreen] = useState(!isWeb);

  const {
    isGlobalAddModalOpen,
    globalAddModalType,
    openGlobalAddModal,
    closeGlobalAddModal,
  } = useBudget();

  // Dynamic top padding ensures status bar, camera hole-punch, and notch are completely cleared
  const topPadding = !isWeb
    ? Math.max(insets.top, StatusBar.currentHeight ? StatusBar.currentHeight + 8 : 40)
    : 0;

  return (
    <View style={[styles.rootContainer, isFullscreen && styles.rootFullscreen]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={theme.colors.background}
        translucent={false}
      />

      {/* Web Mockup Toggle Floating Control */}
      {isWeb && (
        <View style={styles.floatingControls}>
          <TouchableOpacity
            style={styles.toggleFullscreenBtn}
            onPress={() => setIsFullscreen(!isFullscreen)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isFullscreen ? 'phone-portrait-outline' : 'expand-outline'}
              size={18}
              color="#FFFFFF"
            />
            <Text style={styles.toggleFullscreenText}>
              {isFullscreen ? 'Show Phone Frame' : 'Fullscreen'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Main Phone Device Shell with Notch & Border */}
      <View
        style={[
          styles.appFrame,
          isFullscreen ? styles.appFrameFullscreen : styles.appFrameBordered,
          { paddingTop: topPadding },
        ]}
      >
        {/* Hardware Notch / Dynamic Island for Web View */}
        {isWeb && !isFullscreen && (
          <View style={styles.notchContainer}>
            <View style={styles.dynamicIsland}>
              <View style={styles.cameraDot} />
              <View style={styles.speakerPill} />
            </View>
          </View>
        )}

        {/* Core App Navigation */}
        <View style={styles.appContent}>
          <NavigationContainer>
            <Tab.Navigator
              screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: theme.colors.primary,
                tabBarInactiveTintColor: theme.colors.textTertiary,
                tabBarStyle: {
                  backgroundColor: theme.colors.surface,
                  borderTopColor: theme.colors.border,
                  borderTopWidth: 1,
                  height: 64 + (isWeb ? 0 : insets.bottom),
                  paddingBottom: 8 + (isWeb ? 0 : insets.bottom),
                  paddingTop: 8,
                },
                tabBarLabelStyle: {
                  fontSize: 10,
                  fontWeight: '700',
                  letterSpacing: 0.2,
                },
                tabBarIcon: ({ focused, color, size }) => {
                  let iconName: any = 'home';

                  if (route.name === 'Dashboard') {
                    iconName = focused ? 'home' : 'home-outline';
                  } else if (route.name === 'Analytics') {
                    iconName = focused ? 'pie-chart' : 'pie-chart-outline';
                  } else if (route.name === 'Accounts') {
                    iconName = focused ? 'wallet' : 'wallet-outline';
                  } else if (route.name === 'Settings') {
                    iconName = focused ? 'options' : 'options-outline';
                  }

                  return <Ionicons name={iconName} size={21} color={color} />;
                },
              })}
            >
              <Tab.Screen name="Dashboard" component={HomeScreen} />
              <Tab.Screen name="Analytics" component={AnalyticsScreen} />

              {/* Center Floating Quick-Add Action Button */}
              <Tab.Screen
                name="QuickAdd"
                component={DummyScreen}
                options={{
                  tabBarLabel: () => null,
                  tabBarButton: () => (
                    <View style={styles.floatingBtnWrapper}>
                      <TouchableOpacity
                        style={styles.floatingCenterBtn}
                        onPress={() => openGlobalAddModal('expense')}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="add" size={28} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  ),
                }}
              />

              <Tab.Screen name="Accounts" component={AccountsScreen} />
              <Tab.Screen name="Settings" component={SettingsScreen} />
            </Tab.Navigator>
          </NavigationContainer>
        </View>

        {/* Bottom Home Indicator Bar on Device Frame on Web */}
        {isWeb && !isFullscreen && (
          <View style={styles.bottomBarContainer}>
            <View style={styles.homeIndicator} />
          </View>
        )}
      </View>

      {/* Global Add Transaction Modal mounted at root */}
      <AddTransactionModal
        visible={isGlobalAddModalOpen}
        onClose={closeGlobalAddModal}
        initialType={globalAddModalType}
      />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <BudgetProvider>
        <MainAppShell />
      </BudgetProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#070A12',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  rootFullscreen: {
    backgroundColor: theme.colors.background,
  },
  floatingControls: {
    position: 'absolute',
    top: 18,
    right: 20,
    zIndex: 9999,
  },
  toggleFullscreenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(19, 27, 43, 0.9)',
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: theme.radii.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  toggleFullscreenText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  appFrame: {
    backgroundColor: theme.colors.background,
    overflow: 'hidden',
  },
  appFrameBordered: {
    width: '100%',
    maxWidth: 440,
    height: '95%',
    maxHeight: 900,
    borderRadius: 44,
    borderWidth: 10,
    borderColor: '#182234',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 28,
    elevation: 12,
  },
  appFrameFullscreen: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
    borderWidth: 0,
  },
  notchContainer: {
    height: 34,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  dynamicIsland: {
    width: 120,
    height: 24,
    backgroundColor: '#000000',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  cameraDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1E293B',
  },
  speakerPill: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#1E293B',
  },
  appContent: {
    flex: 1,
  },
  floatingBtnWrapper: {
    top: -16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingCenterBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.primary,
    borderWidth: 3,
    borderColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  bottomBarContainer: {
    height: 20,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeIndicator: {
    width: 130,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#334155',
  },
});
