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
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { HomeScreen } from './src/screens/HomeScreen';
import { AnalyticsScreen } from './src/screens/AnalyticsScreen';
import { AccountsScreen } from './src/screens/AccountsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { AddTransactionModal } from './src/components/AddTransactionModal';

const Tab = createBottomTabNavigator();
const DummyScreen = () => null;

function MainAppShell() {
  const isWeb = Platform.OS === 'web';
  const insets = useSafeAreaInsets();
  const [isFullscreen, setIsFullscreen] = useState(!isWeb);
  const { theme, isDark } = useTheme();

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
    <View
      style={[
        styles.rootContainer,
        { backgroundColor: isDark ? '#000000' : '#E5E5EA' },
        isFullscreen && { backgroundColor: theme.colors.background },
      ]}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
        translucent={false}
      />

      {/* Web Mockup Toggle Floating Control */}
      {isWeb && (
        <View style={styles.floatingControls}>
          <TouchableOpacity
            style={[
              styles.toggleFullscreenBtn,
              {
                backgroundColor: isDark ? 'rgba(28, 28, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                borderColor: theme.colors.border,
              },
            ]}
            onPress={() => setIsFullscreen(!isFullscreen)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isFullscreen ? 'phone-portrait-outline' : 'expand-outline'}
              size={18}
              color={theme.colors.text}
            />
            <Text style={[styles.toggleFullscreenText, { color: theme.colors.text }]}>
              {isFullscreen ? 'Show Phone Frame' : 'Fullscreen'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Main Phone Device Shell with Apple Rounded Inset */}
      <View
        style={[
          styles.appFrame,
          { backgroundColor: theme.colors.background },
          isFullscreen
            ? styles.appFrameFullscreen
            : [
                styles.appFrameBordered,
                { borderColor: isDark ? '#2C2C2E' : '#D1D1D6' },
              ],
          { paddingTop: topPadding },
        ]}
      >
        {/* Hardware Notch / Dynamic Island for Web View */}
        {isWeb && !isFullscreen && (
          <View style={[styles.notchContainer, { backgroundColor: theme.colors.background }]}>
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
                  backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                  borderTopColor: theme.colors.border,
                  borderTopWidth: StyleSheet.hairlineWidth,
                  height: 58 + (isWeb ? 0 : insets.bottom),
                  paddingBottom: 6 + (isWeb ? 0 : insets.bottom),
                  paddingTop: 6,
                  shadowColor: '#000000',
                  shadowOffset: { width: 0, height: -2 },
                  shadowOpacity: isDark ? 0.25 : 0.04,
                  shadowRadius: 8,
                  elevation: 8,
                },
                tabBarLabelStyle: {
                  fontSize: 10,
                  fontWeight: '600',
                  letterSpacing: -0.1,
                },
                tabBarIcon: ({ focused, color }) => {
                  let iconName: any = 'home';

                  if (route.name === 'Dashboard') {
                    iconName = focused ? 'house.fill' : 'house';
                    return <Ionicons name={focused ? 'home' : 'home-outline'} size={21} color={color} />;
                  } else if (route.name === 'Analytics') {
                    return <Ionicons name={focused ? 'pie-chart' : 'pie-chart-outline'} size={21} color={color} />;
                  } else if (route.name === 'Accounts') {
                    return <Ionicons name={focused ? 'wallet' : 'wallet-outline'} size={21} color={color} />;
                  } else if (route.name === 'Settings') {
                    return <Ionicons name={focused ? 'settings' : 'settings-outline'} size={21} color={color} />;
                  }

                  return <Ionicons name={iconName} size={21} color={color} />;
                },
              })}
            >
              <Tab.Screen name="Dashboard" component={HomeScreen} />
              <Tab.Screen name="Analytics" component={AnalyticsScreen} />

              {/* Center Floating Quick-Add Action Button (Apple Style) */}
              <Tab.Screen
                name="QuickAdd"
                component={DummyScreen}
                options={{
                  tabBarLabel: () => null,
                  tabBarButton: () => (
                    <View style={styles.floatingBtnWrapper}>
                      <TouchableOpacity
                        style={[
                          styles.floatingCenterBtn,
                          {
                            backgroundColor: theme.colors.primary,
                            borderColor: isDark ? '#1C1C1E' : '#FFFFFF',
                            shadowColor: theme.colors.primary,
                          },
                        ]}
                        onPress={() => openGlobalAddModal('expense')}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="add" size={26} color="#FFFFFF" />
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
          <View style={[styles.bottomBarContainer, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
            <View style={[styles.homeIndicator, { backgroundColor: isDark ? '#3A3A3C' : '#D1D1D6' }]} />
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
      <ThemeProvider>
        <BudgetProvider>
          <MainAppShell />
        </BudgetProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
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
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  toggleFullscreenText: {
    fontSize: 13,
    fontWeight: '600',
  },
  appFrame: {
    overflow: 'hidden',
  },
  appFrameBordered: {
    width: '100%',
    maxWidth: 440,
    height: '95%',
    maxHeight: 900,
    borderRadius: 44,
    borderWidth: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.25,
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
    backgroundColor: '#1C1C1E',
  },
  speakerPill: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#1C1C1E',
  },
  appContent: {
    flex: 1,
  },
  floatingBtnWrapper: {
    top: -14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingCenterBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  bottomBarContainer: {
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeIndicator: {
    width: 134,
    height: 4,
    borderRadius: 2,
  },
});
