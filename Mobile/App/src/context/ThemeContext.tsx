/**
 * ThemeContext – Quản lý Dark/Light mode cho toàn bộ app
 * Sử dụng React Context + useState, lưu trạng thái vào AsyncStorage
 */
import React, { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from 'react';
import { StatusBar, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─────────────────────────────────────────────────────────
//  Theme Types
// ─────────────────────────────────────────────────────────
export interface ThemeColors {
  // Backgrounds
  background: string;
  surface: string;
  card: string;
  cardPressed: string;
  headerBg: string;
  
  // Text
  text: string;
  textSecondary: string;
  textMuted: string;
  textWhite: string;
  
  // Borders
  border: string;
  borderLight: string;
  
  // Accent
  primary: string;
  primaryDark: string;
  primaryLight: string;
  
  // Status
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // Overlay
  overlay: string;
  overlayLight: string;
  
  // Shadows
  shadowColor: string;
}

export interface Theme {
  dark: boolean;
  colors: ThemeColors;
}

// ─────────────────────────────────────────────────────────
//  Color Palettes
// ─────────────────────────────────────────────────────────
const lightColors: ThemeColors = {
  background: '#F5F7FA',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  cardPressed: '#F0F2F5',
  headerBg: '#FFFFFF',
  
  text: '#1A1A2E',
  textSecondary: '#4A4A68',
  textMuted: '#9CA3AF',
  textWhite: '#FFFFFF',
  
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  
  primary: '#6C63FF',
  primaryDark: '#4F46E5',
  primaryLight: '#A78BFA',
  
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.08)',
  
  shadowColor: '#6C63FF',
};

const darkColors: ThemeColors = {
  background: '#0A0A1A',
  surface: '#12122A',
  card: '#1A1A35',
  cardPressed: '#222240',
  headerBg: '#0E0E24',
  
  text: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textMuted: 'rgba(255, 255, 255, 0.4)',
  textWhite: '#FFFFFF',
  
  border: 'rgba(108, 99, 255, 0.2)',
  borderLight: 'rgba(255, 255, 255, 0.08)',
  
  primary: '#6C63FF',
  primaryDark: '#4F46E5',
  primaryLight: '#A78BFA',
  
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  overlay: 'rgba(10, 10, 26, 0.85)',
  overlayLight: 'rgba(255, 255, 255, 0.05)',
  
  shadowColor: '#6C63FF',
};

// ─────────────────────────────────────────────────────────
//  Light Theme
// ─────────────────────────────────────────────────────────
export const lightTheme: Theme = {
  dark: false,
  colors: lightColors,
};

// ─────────────────────────────────────────────────────────
//  Dark Theme
// ─────────────────────────────────────────────────────────
export const darkTheme: Theme = {
  dark: true,
  colors: darkColors,
};

// ─────────────────────────────────────────────────────────
//  Storage Key
// ─────────────────────────────────────────────────────────
const STORAGE_THEME_KEY = '@app_theme_mode';

// ─────────────────────────────────────────────────────────
//  ThemeContext
// ─────────────────────────────────────────────────────────
interface ThemeContextType {
  theme: Theme;
  isDarkMode: boolean;
  toggleTheme: () => void;
  setDarkMode: (value: boolean) => void;
  themeTransition: Animated.Value;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// ─────────────────────────────────────────────────────────
//  ThemeProvider
// ─────────────────────────────────────────────────────────
interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  
  // Animation value for smooth theme transition (0 = light, 1 = dark)
  const themeTransition = useRef(new Animated.Value(1)).current;

  // Load saved theme on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(STORAGE_THEME_KEY);
        if (savedTheme !== null) {
          const isDark = savedTheme === 'dark';
          setIsDarkMode(isDark);
          themeTransition.setValue(isDark ? 1 : 0);
        }
      } catch (error) {
        console.log('Error loading theme:', error);
      } finally {
        setIsInitialized(true);
      }
    };
    loadTheme();
  }, []);

  // Save theme to storage
  const saveTheme = useCallback(async (isDark: boolean) => {
    try {
      await AsyncStorage.setItem(STORAGE_THEME_KEY, isDark ? 'dark' : 'light');
    } catch (error) {
      console.log('Error saving theme:', error);
    }
  }, []);

  // Toggle between dark and light mode with animation
  const toggleTheme = useCallback(() => {
    const newIsDark = !isDarkMode;
    
    // Animate transition
    Animated.spring(themeTransition, {
      toValue: newIsDark ? 1 : 0,
      tension: 50,
      friction: 12,
      useNativeDriver: false,
    }).start();
    
    setIsDarkMode(newIsDark);
    saveTheme(newIsDark);
  }, [isDarkMode, themeTransition, saveTheme]);

  // Set specific theme mode
  const setDarkMode = useCallback((value: boolean) => {
    if (value === isDarkMode) return;
    
    Animated.spring(themeTransition, {
      toValue: value ? 1 : 0,
      tension: 50,
      friction: 12,
      useNativeDriver: false,
    }).start();
    
    setIsDarkMode(value);
    saveTheme(value);
  }, [isDarkMode, themeTransition, saveTheme]);

  const theme = isDarkMode ? darkTheme : lightTheme;

  // Don't render until theme is loaded
  if (!isInitialized) {
    return null;
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDarkMode,
        toggleTheme,
        setDarkMode,
        themeTransition,
      }}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
        translucent={false}
      />
      {children}
    </ThemeContext.Provider>
  );
};

// ─────────────────────────────────────────────────────────
//  useTheme Hook
// ─────────────────────────────────────────────────────────
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// ─────────────────────────────────────────────────────────
//  Interpolation helpers for animated styles
// ─────────────────────────────────────────────────────────
export const interpolateTheme = (
  animation: Animated.Value,
  outputRange: [light: string, dark: string]
): Animated.AnimatedInterpolation<string> => {
  return animation.interpolate({
    inputRange: [0, 1],
    outputRange: outputRange,
  });
};
