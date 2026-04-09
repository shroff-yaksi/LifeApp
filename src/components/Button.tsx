import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '../constants/theme';

type Variant = 'primary' | 'outline' | 'ghost' | 'danger' | 'success';

type Props = {
  title: string;
  onPress: () => void;
  variant?: Variant;
  size?: 'sm' | 'md';
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  color?: string;
};

export function Button({ title, onPress, variant = 'primary', size = 'md', style, textStyle, disabled, color }: Props) {
  const btnStyle = [
    styles.base,
    size === 'sm' ? styles.sm : styles.md,
    variant === 'primary' && (color ? { backgroundColor: color, shadowColor: color, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } } : styles.primary),
    variant === 'outline' && (color ? { borderColor: color + '50', backgroundColor: color + '10' } : styles.outline),
    variant === 'ghost' && styles.ghost,
    variant === 'danger' && styles.danger,
    variant === 'success' && styles.success,
    disabled && styles.disabled,
    style,
  ];

  const txtStyle = [
    styles.text,
    size === 'sm' ? styles.textSm : styles.textMd,
    variant === 'primary' && styles.textPrimary,
    variant === 'outline' && (color ? { color } : styles.textOutline),
    variant === 'ghost' && (color ? { color } : styles.textGhost),
    variant === 'danger' && styles.textDanger,
    variant === 'success' && styles.textSuccess,
    textStyle,
  ];

  return (
    <TouchableOpacity style={btnStyle} onPress={onPress} disabled={disabled} activeOpacity={0.7}>
      <Text style={txtStyle}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  sm: { paddingHorizontal: 14, paddingVertical: 7 },
  md: { paddingHorizontal: 20, paddingVertical: 13 },
  primary: { backgroundColor: Colors.accent, shadowColor: Colors.accent, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  outline: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: Colors.redBg, borderWidth: 1, borderColor: Colors.red + '50' },
  success: { backgroundColor: Colors.greenBg, borderWidth: 1, borderColor: Colors.green + '50' },
  disabled: { opacity: 0.38 },
  text: { fontWeight: '700', letterSpacing: 0.1 },
  textSm: { fontSize: 11 },
  textMd: { fontSize: 14 },
  textPrimary: { color: '#fff' },
  textOutline: { color: Colors.textSecondary },
  textGhost: { color: Colors.textSecondary },
  textDanger: { color: Colors.red },
  textSuccess: { color: Colors.green },
});
