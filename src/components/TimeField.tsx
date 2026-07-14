import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Colors } from '../constants/theme';
import { formatTime12 } from '../utils/helpers';

type Props = {
  label: string;
  value: string; // "HH:MM"
  onChange: (v: string) => void;
  accentColor?: string;
};

const toDate = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  const d = new Date();
  d.setHours(Number.isFinite(h) ? h : 9, Number.isFinite(m) ? m : 0, 0, 0);
  return d;
};

const toHHMM = (d: Date) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

export function TimeField({ label, value, onChange, accentColor = Colors.accent }: Props) {
  const [open, setOpen] = useState(false);

  const handleChange = (_: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setOpen(false);
    if (date) onChange(toHHMM(date));
  };

  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.pill, open && { borderColor: accentColor }]}
        activeOpacity={0.7}
        onPress={() => setOpen(o => !o)}
      >
        <Text style={[styles.value, open && { color: accentColor }]}>{formatTime12(value)}</Text>
        <Text style={styles.chevron}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {open && (
        <View style={styles.pickerWrap}>
          <DateTimePicker
            value={toDate(value)}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            themeVariant="dark"
            textColor={Colors.text}
            accentColor={accentColor}
            onChange={handleChange}
          />
        </View>
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
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  value: { color: Colors.text, fontSize: 15, fontWeight: '600' },
  chevron: { color: Colors.textMuted, fontSize: 10 },
  pickerWrap: {
    marginTop: 8,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
});
