import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTheme, Theme, ThemeColors, ThemeMode } from '../constants/theme';

export type { ThemeMode };

const THEME_STORAGE_KEY = '@app_theme_mode_v1';

interface ThemeContextType {
  themeMode: ThemeMode;
  isDark: boolean;
  theme: Theme;
  colors: ThemeColors;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    const loadStoredTheme = async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (stored === 'system' || stored === 'light' || stored === 'dark') {
          setThemeModeState(stored);
        }
      } catch (e) {
        console.warn('Failed to load theme preference', e);
      }
    };
    loadStoredTheme();
  }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (e) {
      console.warn('Failed to persist theme preference', e);
    }
  };

  // Determine active visual mode
  const isDark =
    themeMode === 'system'
      ? systemColorScheme === 'dark'
      : themeMode === 'dark';

  const theme = getTheme(isDark);

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        isDark,
        theme,
        colors: theme.colors,
        setThemeMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
