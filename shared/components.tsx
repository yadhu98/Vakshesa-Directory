import React from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, typography, borderRadius, shadows, spacing } from './design-tokens';
import { buttonVariants, buttonSizes, inputStyles, cardStyles, logoConfig } from './component-styles';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: string;
  style?: any;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  style,
}) => {
  const variantStyle = buttonVariants[variant];
  const sizeStyle = buttonSizes[size];
  
  const buttonStyle = {
    backgroundColor: disabled ? variantStyle.disabledBackgroundColor : variantStyle.backgroundColor,
    height: sizeStyle.height,
    paddingHorizontal: sizeStyle.paddingHorizontal,
    paddingVertical: sizeStyle.paddingVertical,
    borderRadius: sizeStyle.borderRadius,
    borderWidth: 1,
    borderColor: disabled ? variantStyle.disabledBackgroundColor : variantStyle.borderColor,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    width: fullWidth ? '100%' : undefined,
  };

  const textStyle = {
    color: disabled ? variantStyle.disabledColor : variantStyle.color,
    fontSize: sizeStyle.fontSize,
    fontWeight: typography.fontWeight.semibold,
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[buttonStyle, style]}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={textStyle.color} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
          {icon && <Text style={{ fontSize: sizeStyle.fontSize }}>{icon}</Text>}
          <Text style={textStyle}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
  error?: boolean;
  disabled?: boolean;
  icon?: string;
  style?: any;
}

export const Input: React.FC<InputProps> = ({
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  error,
  disabled,
  icon,
  style,
}) => {
  const [focused, setFocused] = React.useState(false);

  const containerStyle = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    ...inputStyles.base,
    ...(focused && inputStyles.focused),
    ...(error && inputStyles.error),
    ...(disabled && inputStyles.disabled),
  };

  return (
    <View style={[containerStyle, style]}>
      {icon && (
        <Text style={{ fontSize: typography.fontSize.lg, marginRight: spacing[2] }}>
          {icon}
        </Text>
      )}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.text.tertiary}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        editable={!disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          flex: 1,
          fontSize: inputStyles.base.fontSize,
          color: inputStyles.base.color,
          padding: 0,
        }}
      />
    </View>
  );
};

interface CardProps {
  children: React.ReactNode;
  variant?: 'base' | 'elevated' | 'outlined';
  style?: any;
}

export const Card: React.FC<CardProps> = ({ children, variant = 'base', style }) => {
  const cardStyle = cardStyles[variant];
  return <View style={[cardStyle, style]}>{children}</View>;
};

interface LogoProps {
  size?: keyof typeof logoConfig.sizes;
  showSubtitle?: boolean;
  style?: any;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showSubtitle = true, style }) => {
  const sizeConfig = logoConfig.sizes[size];
  
  return (
    <View style={[styles.logoContainer, style]}>
      <Text style={{ fontSize: sizeConfig.emojiSize }}>{logoConfig.primary.emoji}</Text>
      <View style={{ marginLeft: spacing[2] }}>
        <Text style={{
          fontSize: sizeConfig.fontSize,
          fontWeight: typography.fontWeight.bold,
          color: logoConfig.primary.color,
        }}>
          {logoConfig.primary.text}
        </Text>
        {showSubtitle && (
          <Text style={{
            fontSize: sizeConfig.subtitleSize,
            color: colors.text.secondary,
            marginTop: -4,
          }}>
            {logoConfig.primary.subtitle}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

// Export all components
export { colors, typography, spacing, borderRadius, shadows };
