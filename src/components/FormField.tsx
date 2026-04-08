import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { Colors } from '../constants/theme';

type Props = {
  label: string;
  children?: React.ReactNode;
} & TextInputProps;

export function FormField({ label, children, ...inputProps }: Props) {
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      {children || (
        <TextInput
          style={styles.input}
          placeholderTextColor={Colors.textMuted}
          {...inputProps}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { marginBottom: 16 },
  label: {
    color: Colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    color: Colors.text,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
