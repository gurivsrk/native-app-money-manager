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
import { BudgetProvider } from './src/context/BudgetContext';
import { HomeScreen } from './src/screens/HomeScreen';
import { AnalyticsScreen } from './src/screens/AnalyticsScreen';
import { ReportsScreen } from './src/screens/ReportsScreen';
import { AccountsScreen } from './src/screens/AccountsScreen';
import { CategoriesScreen } from './src/screens/CategoriesScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();

function MainAppShell() {
  const isWeb = Platform.OS === 'web';
  const insets = useSafeAreaInsets();
  const [isFullscreen, setIsFullscreen] = useState(!isWeb);

  // Dynamic top padding ensures status bar, camera hole-punch, and notch are completely cleared
  // Especially on Android devices like Poco F6, Xiaomi, OnePlus, Samsung
  const topPadding = !isWeb
    ? Math.max(insets.top, StatusBar.currentHeight ? StatusBar.currentHeight + 8 : 40)
    : 0;

  return (
    <View style={[styles.rootContainer, isFullscreen && styles.rootFullscreen]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#0F172A"
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
        {/* Hardware Notch / Dynamic Island for Realistic Web View */}
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
                tabBarActiveTintColor: '#3B82F6',
                tabBarInactiveTintColor: '#94A3B8',
                tabBarStyle: {
                  backgroundColor: '#FFFFFF',
                  borderTopColor: '#E2E8F0',
                  height: 64 + (isWeb ? 0 : insets.bottom),
                  paddingBottom: 10 + (isWeb ? 0 : insets.bottom),
                  paddingTop: 8,
                },
                tabBarLabelStyle: {
                  fontSize: 10,
                  fontWeight: '600',
                },
                tabBarIcon: ({ focused, color, size }) => {
                  let iconName: any = 'home';

                  if (route.name === 'Dashboard') {
                    iconName = focused ? 'home' : 'home-outline';
                  } else if (route.name === 'Analytics') {
                    iconName = focused ? 'pie-chart' : 'pie-chart-outline';
                  } else if (route.name === 'Reports') {
                    iconName = focused ? 'document-text' : 'document-text-outline';
                  } else if (route.name === 'Accounts') {
                    iconName = focused ? 'wallet' : 'wallet-outline';
                  } else if (route.name === 'Categories') {
                    iconName = focused ? 'grid' : 'grid-outline';
                  } else if (route.name === 'Settings') {
                    iconName = focused ? 'settings' : 'settings-outline';
                  }

                  return <Ionicons name={iconName} size={20} color={color} />;
                },
              })}
            >
              <Tab.Screen name="Dashboard" component={HomeScreen} />
              <Tab.Screen name="Analytics" component={AnalyticsScreen} />
              <Tab.Screen name="Reports" component={ReportsScreen} />
              <Tab.Screen name="Accounts" component={AccountsScreen} />
              <Tab.Screen name="Categories" component={CategoriesScreen} />
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
    backgroundColor: '#090D16',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  rootFullscreen: {
    backgroundColor: '#0F172A',
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
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderWidth: 1,
    borderColor: '#475569',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  toggleFullscreenText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  appFrame: {
    backgroundColor: '#0F172A',
    overflow: 'hidden',
  },
  appFrameBordered: {
    width: '100%',
    maxWidth: 440,
    height: '95%',
    maxHeight: 900,
    borderRadius: 44,
    borderWidth: 10,
    borderColor: '#1E293B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.45,
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
    backgroundColor: '#0F172A',
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
  bottomBarContainer: {
    height: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeIndicator: {
    width: 130,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
  },
});
