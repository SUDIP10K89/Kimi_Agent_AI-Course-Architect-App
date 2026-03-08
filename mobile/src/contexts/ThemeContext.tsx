/**
 * Theme context for persisted mobile theme preference.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Theme } from '@/types';

const THEME_STORAGE_KEY = 'theme_preference';

type ThemeColors = {
  background: string;
  surface: string;
  surfaceMuted: string;
  text: string;
  textMuted: string;
  textInverse: string;
  border: string;
  primary: string;
  primarySoft: string;
  success: string;
  successSoft: string;
  danger: string;
  dangerSoft: string;
};

interface ThemeContextType {
  theme: Theme;
  colors: ThemeColors;
  isLoading: boolean;
  setTheme: (theme: Theme) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const lightColors: ThemeColors = {
  background: '#f9fafb',
  surface: '#ffffff',
  surfaceMuted: '#f3f4f6',
  text: '#111827',
  textMuted: '#6b7280',
  textInverse: '#ffffff',
  border: '#e5e7eb',
  primary: '#6366f1',
  primarySoft: '#eef2ff',
  success: '#10b981',
  successSoft: '#ecfdf5',
  danger: '#dc2626',
  dangerSoft: '#fef2f2',
};

const darkColors: ThemeColors = {
  background: '#111827',
  surface: '#1f2937',
  surfaceMuted: '#374151',
  text: '#f9fafb',
  textMuted: '#9ca3af',
  textInverse: '#ffffff',
  border: '#374151',
  primary: '#818cf8',
  primarySoft: '#312e81',
  success: '#34d399',
  successSoft: '#064e3b',
  danger: '#f87171',
  dangerSoft: '#7f1d1d',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('light');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (storedTheme === 'light' || storedTheme === 'dark') {
          setThemeState(storedTheme);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
  }, []);

  const setTheme = async (nextTheme: Theme) => {
    setThemeState(nextTheme);
    await AsyncStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  };

  const toggleTheme = async () => {
    await setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        colors: theme === 'dark' ? darkColors : lightColors,
        isLoading,
        setTheme,
        toggleTheme,
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
