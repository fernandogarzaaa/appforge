/**
 * AppForge Spectrum Design System - Master Color Configuration
 * Single source of truth for all 8 agents working in parallel
 * 
 * All agents MUST import colors from this file, never hardcode colors
 * Usage: import { colors, semanticColors, gradients } from '@/config/spectrum-colors';
 */

export const colors = {
  // Primary Gradient: Purple → Indigo → Cyan (Spectrum)
  purple: {
    50: '#F3E8FF',
    100: '#E9D5FF',
    200: '#D8B4FE',
    300: '#C084FC',
    400: '#A855F7',
    500: '#9333EA',
    600: '#7E22CE',
    700: '#6B21A8',
    800: '#581C87',
    900: '#3F0F5C',
  },
  indigo: {
    50: '#EEF2FF',
    100: '#E0E7FF',
    200: '#C7D2FE',
    300: '#A5B4FC',
    400: '#818CF8',
    500: '#6366F1',
    600: '#4F46E5',
    700: '#4338CA',
    800: '#3730A3',
    900: '#312E81',
  },
  cyan: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#2DD4BF',
    500: '#06B6D4',
    600: '#0891B2',
    700: '#0E7490',
    800: '#155E75',
    900: '#164E63',
  },

  // Quantum Accents
  quantum: {
    cyan: '#00F0FF',      // Neon cyan (electric bright)
    purple: '#B700FF',    // Electric purple (vibrant)
  },

  // Secondary: Amber for Progress/Accents
  amber: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },

  // Status Colors
  emerald: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBFBCE',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#145231',
  },
  red: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },

  // Neutrals
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
    950: '#030712',
  },
};

/**
 * Semantic Color System
 * Maps abstract meanings to specific colors
 */
export const semanticColors = {
  success: {
    light: colors.emerald[100],
    base: colors.emerald[500],
    dark: colors.emerald[700],
    background: colors.emerald[50],
    border: colors.emerald[200],
  },
  error: {
    light: colors.red[100],
    base: colors.red[500],
    dark: colors.red[700],
    background: colors.red[50],
    border: colors.red[200],
  },
  warning: {
    light: colors.amber[100],
    base: colors.amber[500],
    dark: colors.amber[700],
    background: colors.amber[50],
    border: colors.amber[200],
  },
  info: {
    light: colors.cyan[100],
    base: colors.cyan[500],
    dark: colors.cyan[700],
    background: colors.cyan[50],
    border: colors.cyan[200],
  },
  primary: {
    light: colors.purple[200],
    base: colors.purple[600],
    dark: colors.purple[900],
    background: colors.purple[50],
    border: colors.purple[200],
  },
  secondary: {
    light: colors.indigo[200],
    base: colors.indigo[600],
    dark: colors.indigo[900],
    background: colors.indigo[50],
    border: colors.indigo[200],
  },
  accent: {
    light: colors.amber[100],
    base: colors.amber[500],
    dark: colors.amber[700],
    background: colors.amber[50],
    border: colors.amber[200],
  },
  neutral: {
    light: colors.gray[100],
    base: colors.gray[500],
    dark: colors.gray[900],
    background: colors.gray[50],
    border: colors.gray[200],
  },
};

/**
 * Gradient System
 * All gradients follow the purple → indigo → cyan spectrum
 */
export const gradients = {
  // Primary spectrum gradient (most used)
  spectrum: `linear-gradient(135deg, ${colors.purple[600]} 0%, ${colors.indigo[600]} 50%, ${colors.cyan[500]} 100%)`,
  
  // Light variant for backgrounds
  spectrumLight: `linear-gradient(135deg, ${colors.purple[200]} 0%, ${colors.indigo[200]} 50%, ${colors.cyan[200]} 100%)`,
  
  // Dark variant for dark mode
  spectrumDark: `linear-gradient(135deg, ${colors.purple[800]} 0%, ${colors.indigo[800]} 50%, ${colors.cyan[800]} 100%)`,

  // Quantum neon gradient
  quantum: `linear-gradient(135deg, ${colors.quantum.cyan} 0%, ${colors.quantum.purple} 100%)`,

  // Accent gradients
  warmAccent: `linear-gradient(135deg, ${colors.amber[500]} 0%, ${colors.amber[400]} 100%)`,
  coolAccent: `linear-gradient(135deg, ${colors.cyan[500]} 0%, ${colors.indigo[500]} 100%)`,

  // Status gradients
  successGradient: `linear-gradient(135deg, ${colors.emerald[500]} 0%, ${colors.emerald[400]} 100%)`,
  errorGradient: `linear-gradient(135deg, ${colors.red[500]} 0%, ${colors.red[400]} 100%)`,
  warningGradient: `linear-gradient(135deg, ${colors.amber[500]} 0%, ${colors.amber[400]} 100%)`,
  infoGradient: `linear-gradient(135deg, ${colors.cyan[500]} 0%, ${colors.indigo[500]} 100%)`,
};

/**
 * Spacing System (8px base grid)
 */
export const spacing = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  7: '28px',
  8: '32px',
  9: '36px',
  10: '40px',
  12: '48px',
  14: '56px',
  16: '64px',
  20: '80px',
  24: '96px',
  32: '128px',
};

/**
 * Typography Scale (12-18px base)
 */
export const fontSize = {
  xs: ['12px', { lineHeight: '16px' }],
  sm: ['13px', { lineHeight: '18px' }],
  base: ['14px', { lineHeight: '20px' }],
  lg: ['16px', { lineHeight: '24px' }],
  xl: ['18px', { lineHeight: '28px' }],
  '2xl': ['20px', { lineHeight: '32px' }],
  '3xl': ['24px', { lineHeight: '36px' }],
  '4xl': ['28px', { lineHeight: '40px' }],
  '5xl': ['32px', { lineHeight: '44px' }],
};

/**
 * Shadow Depth System
 */
export const boxShadow = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  spectrum: `0 10px 30px -5px rgba(147, 51, 234, 0.3)`,
};

/**
 * Border Radius System
 */
export const borderRadius = {
  none: '0px',
  sm: '4px',
  base: '6px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '20px',
  '3xl': '24px',
  full: '9999px',
};

/**
 * Transition/Animation Tokens
 */
export const transitionDuration = {
  fast: '150ms',
  base: '200ms',
  slow: '300ms',
};

export const transitionTiming = {
  ease: 'ease',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',
  linear: 'linear',
};

/**
 * Font Family Stack
 */
export const fontFamily = {
  heading: "'Space Grotesk', system-ui, sans-serif",
  body: "'Inter', system-ui, sans-serif",
  mono: "'JetBrains Mono', 'Courier New', monospace",
};

/**
 * Z-Index System
 */
export const zIndex = {
  hide: '-1',
  auto: 'auto',
  base: '0',
  dropdown: '1000',
  sticky: '1020',
  fixed: '1030',
  backdrop: '1040',
  offcanvas: '1050',
  modal: '1060',
  popover: '1070',
  tooltip: '1080',
};

/**
 * Complete Spectrum Design System Export
 * Includes all tokens for agent reference
 */
export const spectrum = {
  colors,
  semanticColors,
  gradients,
  spacing,
  fontSize,
  boxShadow,
  borderRadius,
  transitionDuration,
  transitionTiming,
  fontFamily,
  zIndex,
};

export default spectrum;
