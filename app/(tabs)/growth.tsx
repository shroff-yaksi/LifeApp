import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, TAB_COLORS, radius } from '../../src/constants/theme';
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
      {/* Segmented control — iOS-style track with a colored active pill */}
      <View style={styles.segWrap}>
        <View style={styles.track}>
          <View style={styles.hairline} pointerEvents="none" />
          {SEGMENTS.map(s => {
            const active = section === s.key;
            return (
              <TouchableOpacity
                key={s.key}
                style={[styles.segBtn, active && { backgroundColor: s.color + '22', borderColor: s.color + '55' }]}
                onPress={() => setSection(s.key)}
                activeOpacity={0.75}
              >
                <View style={[styles.dot, { backgroundColor: active ? s.color : Colors.textMuted }]} />
                <Text style={[styles.segTxt, { color: active ? s.color : Colors.textSecondary }]}>{s.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      {section === 'learning' ? <LearningPanel /> : <SkillsPanel />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  segWrap: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 4 },
  track: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    borderRadius: radius.pill,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  hairline: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Colors.innerHighlight,
  },
  segBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 9,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  segTxt: { fontSize: 13, fontWeight: '700', letterSpacing: 0.2 },
});
