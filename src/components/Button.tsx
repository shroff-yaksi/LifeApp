import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '../constants/theme';

type Variant = 'primary' | 'outline' | 'ghost' | 'danger';

type Props = {
  title: string;
  onPress: () => void;
  variant?: Variant;
  size?: 'sm' | 'md';
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
};

export function Button({ title, onPress, variant = 'primary', size = 'md', style, textStyle, disabled }: Props) {
  const btnStyle = [
    styles.base,
    size === 'sm' ? styles.sm : styles.md,
    variant === 'primary' && styles.primary,
    variant === 'outline' && styles.outline,
    variant === 'ghost' && styles.ghost,
    variant === 'danger' && styles.danger,
    disabled && styles.disabled,
    style,
  ];

  const txtStyle = [
    styles.text,
    size === 'sm' ? styles.textSm : styles.textMd,
    variant === 'primary' && styles.textPrimary,
    variant === 'outline' && styles.textOutline,
    variant === 'ghost' && styles.textGhost,
    variant === 'danger' && styles.textDanger,
    textStyle,
  ];

  return (
    <TouchableOpacity style={btnStyle} onPress={onPress} disabled={disabled} activeOpacity={0.7}>
      <Text style={txtStyle}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sm: { paddingHorizontal: 14, paddingVertical: 7 },
  md: { paddingHorizontal: 18, paddingVertical: 11 },
  primary: { backgroundColor: Colors.accent },
  outline: { backgroundColor: Colors.surface },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: Colors.redBg },
  disabled: { opacity: 0.4 },
  text: { fontWeight: '700', letterSpacing: 0.2 },
  textSm: { fontSize: 11 },
  textMd: { fontSize: 14 },
  textPrimary: { color: '#fff' },
  textOutline: { color: Colors.textSecondary },
  textGhost: { color: Colors.textSecondary },
  textDanger: { color: Colors.red },
});
