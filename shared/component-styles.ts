/**
 * Shared Button Component Styles
 * Used across Admin Panel and Mobile App
 */

import { colors, borderRadius, spacing, typography, shadows, components } from './design-tokens';

export const buttonVariants = {
  primary: {
    backgroundColor: colors.primary[500],
    color: colors.text.inverse,
    borderColor: colors.primary[500],
    hoverBackgroundColor: colors.primary[600],
    hoverBorderColor: colors.primary[600],
    activeBackgroundColor: colors.primary[700],
    disabledBackgroundColor: colors.neutral[300],
    disabledColor: colors.neutral[500],
  },
  secondary: {
    backgroundColor: colors.neutral[100],
    color: colors.text.primary,
    borderColor: colors.border.main,
    hoverBackgroundColor: colors.neutral[200],
    hoverBorderColor: colors.border.dark,
    activeBackgroundColor: colors.neutral[300],
    disabledBackgroundColor: colors.neutral[100],
    disabledColor: colors.neutral[400],
  },
  success: {
    backgroundColor: colors.success.main,
    color: colors.text.inverse,
    borderColor: colors.success.main,
    hoverBackgroundColor: colors.success.dark,
    hoverBorderColor: colors.success.dark,
    activeBackgroundColor: '#047857',
    disabledBackgroundColor: colors.neutral[300],
    disabledColor: colors.neutral[500],
  },
  danger: {
    backgroundColor: colors.error.main,
    color: colors.text.inverse,
    borderColor: colors.error.main,
    hoverBackgroundColor: colors.error.dark,
    hoverBorderColor: colors.error.dark,
    activeBackgroundColor: '#B91C1C',
    disabledBackgroundColor: colors.neutral[300],
    disabledColor: colors.neutral[500],
  },
  outline: {
    backgroundColor: 'transparent',
    color: colors.primary[500],
    borderColor: colors.primary[500],
    hoverBackgroundColor: colors.primary[50],
    hoverBorderColor: colors.primary[600],
    activeBackgroundColor: colors.primary[100],
    disabledBackgroundColor: 'transparent',
    disabledColor: colors.neutral[400],
  },
  ghost: {
    backgroundColor: 'transparent',
    color: colors.text.primary,
    borderColor: 'transparent',
    hoverBackgroundColor: colors.neutral[100],
    hoverBorderColor: 'transparent',
    activeBackgroundColor: colors.neutral[200],
    disabledBackgroundColor: 'transparent',
    disabledColor: colors.neutral[400],
  },
  carnival: {
    backgroundColor: colors.carnival.orange,
    color: colors.text.inverse,
    borderColor: colors.carnival.orange,
    hoverBackgroundColor: '#FF5252',
    hoverBorderColor: '#FF5252',
    activeBackgroundColor: '#E53935',
    disabledBackgroundColor: colors.neutral[300],
    disabledColor: colors.neutral[500],
  },
};

export const buttonSizes = {
  sm: {
    height: components.button.height.sm,
    paddingHorizontal: components.button.padding.sm.horizontal,
    paddingVertical: components.button.padding.sm.vertical,
    fontSize: typography.fontSize.sm,
    borderRadius: borderRadius.base,
  },
  md: {
    height: components.button.height.md,
    paddingHorizontal: components.button.padding.md.horizontal,
    paddingVertical: components.button.padding.md.vertical,
    fontSize: typography.fontSize.base,
    borderRadius: borderRadius.base,
  },
  lg: {
    height: components.button.height.lg,
    paddingHorizontal: components.button.padding.lg.horizontal,
    paddingVertical: components.button.padding.lg.vertical,
    fontSize: typography.fontSize.lg,
    borderRadius: borderRadius.md,
  },
  xl: {
    height: components.button.height.xl,
    paddingHorizontal: components.button.padding.xl.horizontal,
    paddingVertical: components.button.padding.xl.vertical,
    fontSize: typography.fontSize.xl,
    borderRadius: borderRadius.md,
  },
};

export const inputStyles = {
  base: {
    height: components.input.height.md,
    paddingHorizontal: components.input.padding.horizontal,
    paddingVertical: components.input.padding.vertical,
    fontSize: typography.fontSize.base,
    borderRadius: borderRadius.base,
    borderWidth: 1,
    borderColor: colors.border.main,
    backgroundColor: colors.background.secondary,
    color: colors.text.primary,
  },
  focused: {
    borderColor: colors.primary[500],
    backgroundColor: colors.background.primary,
  },
  error: {
    borderColor: colors.error.main,
  },
  disabled: {
    backgroundColor: colors.neutral[100],
    color: colors.text.disabled,
  },
};

export const cardStyles = {
  base: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    padding: components.card.padding.md,
    ...shadows.base,
  },
  elevated: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    padding: components.card.padding.md,
    ...shadows.lg,
  },
  outlined: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    padding: components.card.padding.md,
    borderWidth: 1,
    borderColor: colors.border.main,
  },
};

export const logoConfig = {
  primary: {
    emoji: '🎪',
    text: 'Vakshesa',
    subtitle: 'Carnival',
    color: colors.primary[500],
  },
  sizes: {
    sm: {
      emojiSize: 24,
      fontSize: typography.fontSize.xl,
      subtitleSize: typography.fontSize.sm,
    },
    md: {
      emojiSize: 32,
      fontSize: typography.fontSize['3xl'],
      subtitleSize: typography.fontSize.base,
    },
    lg: {
      emojiSize: 48,
      fontSize: typography.fontSize['4xl'],
      subtitleSize: typography.fontSize.lg,
    },
    xl: {
      emojiSize: 64,
      fontSize: typography.fontSize['5xl'],
      subtitleSize: typography.fontSize.xl,
    },
  },
};
