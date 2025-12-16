# Shared Design System

This folder contains the shared design system for both mobile (React Native) and admin (React Web) applications.

## Design Tokens

Based on the Figma design for Vakshesa Family Directory:

### Colors
- **Primary**: `#000000` (Black) - Used for buttons, headings
- **White**: `#FFFFFF` - Used for backgrounds, button text
- **Purple Accent**: `#F3E8FF` - Used for logo container background
- **Gray Scale**: 50, 100, 200, 300, 400, 500 - Used for borders, text, backgrounds

### Typography
- **Font Sizes**: 12px (xs) to 36px (5xl)
- **Font Weights**: 400 (regular) to 800 (extrabold)
- **Line Heights**: Relative to font size

### Spacing
- **Scale**: 4px (xs) to 64px (5xl)
- **Uses**: Padding, margins, gaps

### Border Radius
- **Scale**: 0 (none) to 9999 (full)
- **Common**: 12px for buttons and inputs, 16px for cards

## Components

### Buttons
- **Primary**: Black background, white text, 16px vertical padding
- **Secondary**: Gray background, black text
- **Social**: White/gray background with border

### Inputs
- **Default**: White background, gray border, 12px radius
- **Focused**: Darker border
- **Error**: Red border

### Logo Container
- **Size**: 150x150px
- **Background**: Purple (#F3E8FF)
- **Radius**: 16px
- **Padding**: 20px

## Files

### `theme.ts`
Core design tokens and component styles. Import this directly:

```typescript
// Mobile (React Native)
import { colors, typography, spacing } from '../../../shared/theme';

// Admin (React Web)  
import { colors, typography, spacing } from '../../../shared/theme';
```

### `assets/logo.png`
Logo image (currently placeholder - replace with actual logo)

## Usage Examples

### Mobile (React Native)
```tsx
import { colors, typography } from '../../../shared/theme';

<View style={{ backgroundColor: colors.primary }}>
  <Text style={{ fontSize: typography.fontSize.xl }}>Hello</Text>
</View>
```

### Admin (React Web)
```tsx
import { colors, typography } from '../../../shared/theme';

<div style={{ backgroundColor: colors.primary }}>
  <h1 style={{ fontSize: typography.fontSize.xl + 'px' }}>Hello</h1>
</div>
```

## Design Principles

1. **Consistency**: Same colors, spacing, and styles across platforms
2. **Simplicity**: Clean black & white design with purple accent
3. **Accessibility**: Good contrast ratios, readable text sizes
4. **Flexibility**: Design tokens can be used in any context

## Updating the Design System

When making changes:

1. Update `theme.ts` with new tokens
2. Test on both mobile and admin platforms
3. Update this README with new examples
4. Communicate changes to team

## Logo Asset

Replace `assets/logo.png` with the actual Vakshesa Family Directory logo. The logo should:
- Be a PNG with transparent background
- Fit within 150x150px container
- Work well on purple background (#F3E8FF)
