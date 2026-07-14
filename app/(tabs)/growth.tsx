import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, TAB_COLORS } from '../../src/constants/theme';
import { LearningPanel } from '../../src/components/growth/LearningPanel';
import { SkillsPanel } from '../../src/components/growth/SkillsPanel';

type Section = 'learning' | 'skills';

const SEGMENTS: { key: Section; label: string; color: string }[] = [
  { key: 'learning', label: 'Learning', color: TAB_COLORS.learning },
  { key: 'skills', label: 'Skills', color: TAB_COLORS.skills },
];

export default function GrowthScreen() {
  const [section, setSection] = useState<Section>('learning');

  return (
    <View style={styles.container}>
      <View style={styles.segment}>
        {SEGMENTS.map(s => {
          const active = section === s.key;
          return (
            <TouchableOpacity
              key={s.key}
              style={[styles.segBtn, active && { backgroundColor: s.color + '20', borderColor: s.color + '55' }]}
              onPress={() => setSection(s.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.segTxt, active && { color: s.color }]}>{s.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {section === 'learning' ? <LearningPanel /> : <SkillsPanel />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  segment: { flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 2 },
  segBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  segTxt: { color: Colors.textSecondary, fontSize: 13, fontWeight: '700', letterSpacing: 0.2 },
});
