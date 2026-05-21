import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const screen = { width, height };

export const colors = {
  // Brand
  primary: '#6C63FF',
  primaryDark: '#4F46E5',
  primaryLight: '#A78BFA',
  secondary: '#10B981',
  secondaryDark: '#059669',
  accent: '#F59E0B',

  // Dark theme
  dark: {
    bg: '#0A0A1A',
    surface: '#12122A',
    card: '#1A1A35',
    border: 'rgba(108, 99, 255, 0.2)',
    overlay: 'rgba(10, 10, 26, 0.85)',
  },

  // Light
  background: '#F0F2FF',
  white: '#FFFFFF',
  black: '#000000',

  // Gray scale
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },

  // Semantic
  error: '#EF4444',
  errorLight: '#FEE2E2',
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  info: '#3B82F6',

  // Text
  text: {
    primary: '#1F2937',
    secondary: '#6B7280',
    light: '#9CA3AF',
    white: '#FFFFFF',
    muted: 'rgba(255,255,255,0.6)',
  },

  // Gradients
  gradient: {
    primary: ['#6C63FF', '#4F46E5'],
    secondary: ['#10B981', '#059669'],
    dark: ['#1F2937', '#111827'],
    purple: ['#8B5CF6', '#6C63FF'],
    hero: ['#0A0A1A', '#1A1040', '#0A0A1A'],
    sunset: ['#F59E0B', '#EF4444'],
    ocean: ['#3B82F6', '#6C63FF'],
    forest: ['#10B981', '#3B82F6'],
    warmGold: ['#F59E0B', '#D97706'],
  },

  // Glass effect
  glass: {
    light: 'rgba(255, 255, 255, 0.08)',
    medium: 'rgba(255, 255, 255, 0.12)',
    heavy: 'rgba(255, 255, 255, 0.18)',
    border: 'rgba(255, 255, 255, 0.15)',
  },
};

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const fontSize = {
  xxs: 10,
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  display: 36,
  hero: 44,
};

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  lg: {
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
};
