import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Colors } from '../constants/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

export function ModalSheet({ visible, onClose, title, children }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)' },
  sheet: {
    backgroundColor: '#1c1b1d',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  handle: { width: 40, height: 4, backgroundColor: Colors.surfaceHighest, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  title: { color: Colors.text, fontSize: 20, fontWeight: '800', letterSpacing: -0.4 },
  close: { color: Colors.textMuted, fontSize: 20, padding: 4 },
  body: { paddingHorizontal: 24, paddingTop: 8 },
});
