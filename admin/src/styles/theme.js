// Admin Panel Theme - Uses shared design system
import sharedTheme from '../../../shared/theme';
export const { colors, typography, spacing, borderRadius, shadows, components } = sharedTheme;
// Admin-specific CSS custom properties
export const cssVariables = `
  :root {
    /* Colors */
    --color-primary: ${colors.primary.black};
    --color-text-primary: ${colors.text.primary};
    --color-text-secondary: ${colors.text.secondary};
    --color-background: ${colors.background.primary};
    --color-background-secondary: ${colors.background.secondary};
    --color-border: ${colors.border.light};
    
    /* Typography */
    --font-size-base: ${typography.fontSize.base}px;
    --font-size-sm: ${typography.fontSize.sm}px;
    --font-size-lg: ${typography.fontSize.lg}px;
    --font-size-xl: ${typography.fontSize.xl}px;
    --font-size-2xl: ${typography.fontSize['2xl']}px;
    
    /* Spacing */
    --spacing-sm: ${spacing.sm}px;
    --spacing-base: ${spacing.base}px;
    --spacing-lg: ${spacing.lg}px;
    --spacing-xl: ${spacing.xl}px;
    
    /* Border Radius */
    --radius-sm: ${borderRadius.sm}px;
    --radius-base: ${borderRadius.base}px;
    --radius-md: ${borderRadius.md}px;
    --radius-lg: ${borderRadius.lg}px;
  }
`;
export default sharedTheme;
