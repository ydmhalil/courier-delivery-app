import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AppTheme from '../theme/AppTheme';

// Modern Header Component - Chatbot header style
export const ModernHeader = ({ 
  title, 
  subtitle, 
  leftIcon, 
  rightIcon, 
  onLeftPress, 
  onRightPress,
  gradient = AppTheme.gradients.primary 
}) => {
  return (
    <LinearGradient
      colors={gradient}
      style={styles.modernHeader}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
    >
      <View style={styles.headerContent}>
        <View style={styles.headerLeft}>
          {leftIcon && (
            <TouchableOpacity style={styles.headerButton} onPress={onLeftPress}>
              <Ionicons name={leftIcon} size={24} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>{title}</Text>
            {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
          </View>
        </View>
        {rightIcon && (
          <TouchableOpacity style={styles.headerButton} onPress={onRightPress}>
            <Ionicons name={rightIcon} size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
  );
};

// Modern Card Component - Chatbot mesaj balonları style
export const ModernCard = ({ children, style, shadow = 'md' }) => {
  return (
    <View style={[styles.modernCard, AppTheme.shadows[shadow], style]}>
      {children}
    </View>
  );
};

// Modern Button Component
export const ModernButton = ({ 
  title, 
  onPress, 
  variant = 'primary', 
  size = 'medium',
  icon,
  style,
  disabled = false
}) => {
  const getButtonStyle = () => {
    let baseStyle = [styles.modernButton];
    
    // Variant styles
    switch (variant) {
      case 'primary':
        baseStyle.push(styles.primaryButton);
        break;
      case 'secondary':
        baseStyle.push(styles.secondaryButton);
        break;
      case 'outline':
        baseStyle.push(styles.outlineButton);
        break;
    }
    
    // Size styles
    switch (size) {
      case 'small':
        baseStyle.push(styles.smallButton);
        break;
      case 'large':
        baseStyle.push(styles.largeButton);
        break;
    }
    
    if (disabled) {
      baseStyle.push(styles.disabledButton);
    }
    
    return baseStyle;
  };

  const getTextStyle = () => {
    let textStyle = [styles.buttonText];
    
    switch (variant) {
      case 'primary':
        textStyle.push(styles.primaryButtonText);
        break;
      case 'secondary':
        textStyle.push(styles.secondaryButtonText);
        break;
      case 'outline':
        textStyle.push(styles.outlineButtonText);
        break;
    }
    
    return textStyle;
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={styles.buttonContent}>
        {icon && (
          <Ionicons 
            name={icon} 
            size={20} 
            color={variant === 'primary' ? '#FFFFFF' : AppTheme.colors.primary}
            style={styles.buttonIcon}
          />
        )}
        <Text style={getTextStyle()}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
};

// Modern Badge Component - Kargo durumları için
export const ModernBadge = ({ 
  text, 
  type = 'default', 
  size = 'medium',
  style 
}) => {
  const getBadgeStyle = () => {
    let baseStyle = [styles.modernBadge];
    
    switch (type) {
      case 'express':
        baseStyle.push({ backgroundColor: AppTheme.colors.express });
        break;
      case 'scheduled':
        baseStyle.push({ backgroundColor: AppTheme.colors.scheduled });
        break;
      case 'standard':
        baseStyle.push({ backgroundColor: AppTheme.colors.standard });
        break;
      case 'delivered':
        baseStyle.push({ backgroundColor: AppTheme.colors.delivered });
        break;
      case 'success':
        baseStyle.push({ backgroundColor: AppTheme.colors.success });
        break;
      case 'warning':
        baseStyle.push({ backgroundColor: AppTheme.colors.warning });
        break;
      case 'error':
        baseStyle.push({ backgroundColor: AppTheme.colors.error });
        break;
      default:
        baseStyle.push({ backgroundColor: AppTheme.colors.primary });
    }
    
    if (size === 'small') {
      baseStyle.push(styles.smallBadge);
    }
    
    return baseStyle;
  };

  return (
    <View style={[getBadgeStyle(), style]}>
      <Text style={styles.badgeText}>{text}</Text>
    </View>
  );
};

// Modern Input Component
export const ModernInput = ({ 
  label,
  placeholder, 
  value, 
  onChangeText, 
  icon,
  style,
  error,
  ...props 
}) => {
  return (
    <View style={styles.inputContainer}>
      {label && <Text style={styles.inputLabel}>{label}</Text>}
      <View style={[styles.modernInput, error && styles.inputError, style]}>
        {icon && (
          <Ionicons 
            name={icon} 
            size={20} 
            color={AppTheme.colors.onSurfaceVariant}
            style={styles.inputIcon}
          />
        )}
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={AppTheme.colors.text ? AppTheme.colors.text.tertiary : '#6B7280'}
          value={value}
          onChangeText={onChangeText}
          style={styles.inputText}
          {...props}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  // Modern Header Styles
  modernHeader: {
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerButton: {
    padding: 8,
    marginRight: 8,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },

  // Modern Card Styles
  modernCard: {
    backgroundColor: AppTheme.colors.surface,
    borderRadius: AppTheme.borderRadius.lg,
    padding: AppTheme.spacing.md,
    marginBottom: AppTheme.spacing.sm,
  },

  // Modern Button Styles
  modernButton: {
    borderRadius: AppTheme.borderRadius.lg,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Button Variants
  primaryButton: {
    backgroundColor: AppTheme.colors.primary,
    ...AppTheme.shadows.md,
  },
  primaryButtonText: {
    color: AppTheme.colors.onPrimary,
  },
  secondaryButton: {
    backgroundColor: AppTheme.colors.secondary,
    ...AppTheme.shadows.md,
  },
  secondaryButtonText: {
    color: AppTheme.colors.onPrimary,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: AppTheme.colors.primary,
  },
  outlineButtonText: {
    color: AppTheme.colors.primary,
  },
  
  // Button Sizes
  smallButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  largeButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  
  disabledButton: {
    opacity: 0.5,
  },

  // Modern Badge Styles
  modernBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: AppTheme.borderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  // Modern Input Styles
  inputContainer: {
    marginBottom: AppTheme.spacing.sm,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: AppTheme.colors.text ? AppTheme.colors.text.secondary : '#374151',
    marginBottom: AppTheme.spacing.sm,
  },
  modernInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: AppTheme.colors.border,
    borderRadius: AppTheme.borderRadius.lg,
    paddingHorizontal: AppTheme.spacing.md,
    paddingVertical: 12,
    backgroundColor: AppTheme.colors.surface,
  },
  inputError: {
    borderColor: AppTheme.colors.error,
  },
  inputIcon: {
    marginRight: 12,
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    color: AppTheme.colors.onSurface,
  },
  errorText: {
    fontSize: 12,
    color: AppTheme.colors.error,
    marginTop: 4,
    marginLeft: 4,
  },
});

export default {
  ModernHeader,
  ModernCard,
  ModernButton,
  ModernBadge,
  ModernInput,
};
