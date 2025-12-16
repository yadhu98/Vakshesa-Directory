/**
 * Shared Design Tokens for Vksha Carnival
 * Used across Admin Panel (React) and Mobile App (React Native)
 */

export const colors = {
  // Primary Brand Colors
  primary: {
    50: '#EEF2FF',
    100: '#E0E7FF',
    200: '#C7D2FE',
    300: '#A5B4FC',
    400: '#818CF8',
    500: '#6366F1',  // Main primary
    600: '#4F46E5',
    700: '#4338CA',
    800: '#3730A3',
    900: '#312E81',
  },
  
  // Secondary/Accent Colors
  secondary: {
    50: '#FFF1F2',
    100: '#FFE4E6',
    200: '#FECDD3',
    300: '#FDA4AF',
    400: '#FB7185',
    500: '#F43F5E',
    600: '#E11D48',
    700: '#BE123C',
    800: '#9F1239',
    900: '#881337',
  },
  
  // Carnival Theme Colors
  carnival: {
    orange: '#FF6B6B',
    yellow: '#FFD93D',
    pink: '#FF6BCB',
    purple: '#A78BFA',
    teal: '#2DD4BF',
  },
  
  // Neutral Colors
  neutral: {
    white: '#FFFFFF',
    black: '#000000',
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
  
  // Semantic Colors
  success: {
    light: '#D1FAE5',
    main: '#10B981',
    dark: '#047857',
  },
  error: {
    light: '#FEE2E2',
    main: '#EF4444',
    dark: '#DC2626',
  },
  warning: {
    light: '#FEF3C7',
    main: '#F59E0B',
    dark: '#D97706',
  },
  info: {
    light: '#DBEAFE',
    main: '#3B82F6',
    dark: '#1D4ED8',
  },
  
  // Background Colors
  background: {
    primary: '#FFFFFF',
    secondary: '#F9FAFB',
    tertiary: '#F3F4F6',
    dark: '#111827',
  },
  
  // Text Colors
  text: {
    primary: '#111827',
    secondary: '#6B7280',
    tertiary: '#9CA3AF',
    disabled: '#D1D5DB',
    inverse: '#FFFFFF',
  },
  
  // Border Colors
  border: {
    light: '#F3F4F6',
    main: '#E5E7EB',
    dark: '#D1D5DB',
  },
};

export const typography = {
  // Font Families
  fontFamily: {
    primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  },
  
  // Font Sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
    '6xl': 60,
  },
  
  // Font Weights
  fontWeight: {
    thin: '100',
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
  
  // Line Heights
  lineHeight: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
  
  // Letter Spacing
  letterSpacing: {
    tighter: -0.05,
    tight: -0.025,
    normal: 0,
    wide: 0.025,
    wider: 0.05,
    widest: 0.1,
  },
};

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
  32: 128,
};

export const borderRadius = {
  none: 0,
  sm: 4,
  base: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  base: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 25,
    elevation: 8,
  },
};

export const animations = {
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  easing: {
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    linear: 'linear',
  },
};

export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

// Component-specific design tokens
export const components = {
  button: {
    height: {
      sm: 32,
      md: 40,
      lg: 48,
      xl: 56,
    },
    padding: {
      sm: { horizontal: 12, vertical: 6 },
      md: { horizontal: 16, vertical: 10 },
      lg: { horizontal: 20, vertical: 12 },
      xl: { horizontal: 24, vertical: 14 },
    },
  },
  input: {
    height: {
      sm: 36,
      md: 44,
      lg: 52,
    },
    padding: {
      horizontal: 12,
      vertical: 10,
    },
  },
  card: {
    padding: {
      sm: 12,
      md: 16,
      lg: 20,
      xl: 24,
    },
  },
};

// Emojis/Icons library
export const emojis = {
  // Brand
  logo: '🎪',
  carnival: '🎡',
  
  // Navigation
  home: '🏠',
  dashboard: '📊',
  users: '👥',
  settings: '⚙️',
  profile: '👤',
  logout: '🚪',
  
  // Features
  wallet: '💰',
  tokens: '🎟️',
  points: '⭐',
  leaderboard: '🏆',
  family: '👨‍👩‍👧‍👦',
  tree: '🌳',
  directory: '📖',
  qr: '📷',
  scan: '🔍',
  
  // Actions
  add: '➕',
  edit: '✏️',
  delete: '🗑️',
  save: '💾',
  search: '🔍',
  filter: '🎯',
  export: '📤',
  import: '📥',
  refresh: '🔄',
  
  // Status
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
  pending: '⏳',
  
  // Games/Stalls
  game: '🎮',
  food: '🍔',
  service: '🎯',
  shop: '🏪',
  
  // Medals
  first: '🥇',
  second: '🥈',
  third: '🥉',
  
  // Communication
  email: '✉️',
  phone: '📱',
  message: '💬',
  notification: '🔔',
  
  // Date/Time
  calendar: '📅',
  time: '⏰',
  clock: '🕐',
  
  // Security
  lock: '🔒',
  unlock: '🔓',
  key: '🔑',
  shield: '🛡️',
};
