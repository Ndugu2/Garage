import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TextStyle, TouchableOpacity, ViewStyle } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}) => {
  const getContainerStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondaryContainer;
      case 'outline':
        return styles.outlineContainer;
      case 'danger':
        return styles.dangerContainer;
      case 'ghost':
        return styles.ghostContainer;
      default:
        return styles.primaryContainer;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondaryText;
      case 'outline':
        return styles.outlineText;
      case 'danger':
        return styles.dangerText;
      case 'ghost':
        return styles.ghostText;
      default:
        return styles.primaryText;
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return styles.sizeSmall;
      case 'large':
        return styles.sizeLarge;
      default:
        return styles.sizeMedium;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      style={[
        styles.base,
        getContainerStyle(),
        getSizeStyle(),
        (disabled || loading) && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? '#E65100' : '#FFFFFF'}
        />
      ) : (
        <>
          {icon}
          <Text style={[styles.baseText, getTextStyle(), textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    gap: 8,
  },
  baseText: {
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  sizeSmall: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  sizeMedium: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  sizeLarge: {
    paddingVertical: 18,
    paddingHorizontal: 26,
    borderRadius: 16,
  },
  primaryContainer: {
    backgroundColor: '#059669', // Makanika vibrant emerald green from mockups
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  secondaryContainer: {
    backgroundColor: '#0F2942', // Deep navy
  },
  secondaryText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  outlineContainer: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#059669',
  },
  outlineText: {
    color: '#059669',
    fontSize: 16,
  },
  dangerContainer: {
    backgroundColor: '#DC2626',
  },
  dangerText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  ghostContainer: {
    backgroundColor: 'transparent',
  },
  ghostText: {
    color: '#475569',
    fontSize: 15,
  },
  disabled: {
    opacity: 0.55,
  },
});
