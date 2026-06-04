import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Standard design baseline sizes (standard mobile screen aspect ratio 375x812)
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

export const rs = (size: number) => (width / guidelineBaseWidth) * size;
export const rvs = (size: number) => (height / guidelineBaseHeight) * size;
export const rms = (size: number, factor = 0.5) => size + (rs(size) - size) * factor;
export const rf = (size: number) => rms(size, 0.2); // Smaller scaling factor to keep typography neat

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
  xxs: rs(2),
  xs: rs(4),
  sm: rs(8),
  md: rs(16),
  lg: rs(24),
  xl: rs(32),
  xxl: rs(48),
  xxxl: rs(64),
};

export const fontSize = {
  xxs: rf(10),
  xs: rf(12),
  sm: rf(14),
  md: rf(16),
  lg: rf(18),
  xl: rf(20),
  xxl: rf(24),
  xxxl: rf(30),
  display: rf(36),
  hero: rf(44),
};

export const borderRadius = {
  xs: rs(4),
  sm: rs(8),
  md: rs(12),
  lg: rs(16),
  xl: rs(24),
  xxl: rs(32),
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
