// Shared Design System for Vakshesa Family Directory
// Used across Mobile App and Admin Panel
export const colors = {
    // Primary colors
    primary: {
        black: '#000000',
        white: '#FFFFFF',
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
    },
    // Brand colors
    brand: {
        logo: '#8B4513', // Brown from logo
        gold: '#FFD700',
        lightPurple: '#F3E8FF',
    },
    // Semantic colors
    text: {
        primary: '#000000',
        secondary: '#6B7280',
        tertiary: '#9CA3AF',
        link: '#000000',
    },
    // Background colors
    background: {
        primary: '#FFFFFF',
        secondary: '#F9FAFB',
        tertiary: '#F3F4F6',
        purple: '#F3E8FF',
    },
    // UI colors
    border: {
        light: '#E5E7EB',
        medium: '#D1D5DB',
        dark: '#9CA3AF',
    },
    // Button colors
    button: {
        primary: '#000000',
        primaryHover: '#1F2937',
        secondary: '#F3F4F6',
        secondaryHover: '#E5E7EB',
    },
    // Social button colors
    social: {
        google: '#FFFFFF',
        apple: '#F3F4F6',
    },
};
export const typography = {
    fontFamily: {
        primary: 'System',
        heading: 'System',
        body: 'System',
    },
    fontSize: {
        xs: 12,
        sm: 14,
        base: 16,
        lg: 18,
        xl: 20,
        '2xl': 24,
        '3xl': 28,
        '4xl': 32,
        '5xl': 36,
    },
    fontWeight: {
        regular: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
    },
    lineHeight: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.75,
    },
};
export const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    base: 16,
    lg: 20,
    xl: 24,
    '2xl': 32,
    '3xl': 40,
    '4xl': 48,
    '5xl': 64,
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
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
};
export const layout = {
    maxWidth: {
        sm: 640,
        md: 768,
        lg: 1024,
        xl: 1280,
    },
    container: {
        padding: spacing.base,
    },
};
// Component-specific styles
export const components = {
    button: {
        primary: {
            backgroundColor: colors.button.primary,
            color: colors.primary.white,
            paddingVertical: spacing.base,
            paddingHorizontal: spacing.xl,
            borderRadius: borderRadius.md,
            fontSize: typography.fontSize.base,
            fontWeight: typography.fontWeight.semibold,
        },
        secondary: {
            backgroundColor: colors.button.secondary,
            color: colors.text.primary,
            paddingVertical: spacing.base,
            paddingHorizontal: spacing.xl,
            borderRadius: borderRadius.md,
            fontSize: typography.fontSize.base,
            fontWeight: typography.fontWeight.medium,
        },
        social: {
            paddingVertical: spacing.base,
            paddingHorizontal: spacing.xl,
            borderRadius: borderRadius.md,
            fontSize: typography.fontSize.base,
            fontWeight: typography.fontWeight.medium,
            borderWidth: 1,
            borderColor: colors.border.light,
        },
    },
    input: {
        default: {
            backgroundColor: colors.primary.white,
            borderWidth: 1,
            borderColor: colors.border.light,
            borderRadius: borderRadius.md,
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.base,
            fontSize: typography.fontSize.base,
            color: colors.text.primary,
        },
        focused: {
            borderColor: colors.text.primary,
        },
        error: {
            borderColor: '#EF4444',
        },
    },
    logo: {
        container: {
            width: 150,
            height: 150,
            backgroundColor: colors.background.purple,
            borderRadius: borderRadius.lg,
            padding: spacing.lg,
        },
    },
};
// Helper functions
export const getButtonStyle = (variant = 'primary') => {
    return components.button[variant];
};
export const getInputStyle = (state = 'default') => {
    if (state === 'focused') {
        return { ...components.input.default, ...components.input.focused };
    }
    if (state === 'error') {
        return { ...components.input.default, ...components.input.error };
    }
    return components.input.default;
};
export default {
    colors,
    typography,
    spacing,
    borderRadius,
    shadows,
    layout,
    components,
};
