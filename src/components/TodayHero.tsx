import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Stop, Rect } from 'react-native-svg';
import { Colors, heroGradient, radius } from '../constants/theme';
import { RingStack } from './RingStack';
import { ProgressBar } from './ProgressBar';

export type HeroMetric = {
  label: string;
  value: string;
  barPct: number;
  color: string;
};

type Props = {
  overallPct: number;       // pill %
  ringOuterPct: number;     // accent (schedule)
  ringInnerPct: number;     // green (habits)
  centerValue: string;      // big number
  centerSub: string;        // e.g. "of 6"
  metrics: HeroMetric[];
};

// "Today at a glance" hero — gradient surface, restrained accent glow,
// dual RingStack, and a mini-metric list with inline bars. Matches mockup .hero.
export function TodayHero({ overallPct, ringOuterPct, ringInnerPct, centerValue, centerSub, metrics }: Props) {
  return (
    <View style={styles.card}>
      {/* gradient fill (SVG — pure JS, no native gradient dep) */}
      {/* gradient fill + soft ambient accent glow, both clipped to the card via
          this SVG filling the overflow:hidden, rounded card (no hard-edged disc) */}
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="heroBg" x1="0" y1="0" x2="0.35" y2="1">
            <Stop offset="0" stopColor={heroGradient.colors[0]} />
            <Stop offset="1" stopColor={heroGradient.colors[1]} />
          </LinearGradient>
          {/* radial glow: bright near the top-right corner, fading smoothly to
              fully transparent so it reads as ambient light rather than a solid disc */}
          <RadialGradient id="heroGlow" cx="0.9" cy="0.05" r="0.85" fx="0.9" fy="0.05">
            <Stop offset="0" stopColor={Colors.accent} stopOpacity={0.32} />
            <Stop offset="0.45" stopColor={Colors.accent} stopOpacity={0.1} />
            <Stop offset="1" stopColor={Colors.accent} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#heroBg)" />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#heroGlow)" />
      </Svg>

      <View style={styles.row}>
        <Text style={styles.title}>Today at a glance</Text>
        <View style={styles.pctPill}>
          <Text style={styles.pctTxt}>{overallPct}%</Text>
        </View>
      </View>

      <View style={styles.rings}>
        <RingStack
          size={86}
          rings={[
            { pct: ringOuterPct, color: Colors.accent, width: 7 },
            { pct: ringInnerPct, color: Colors.green, width: 6 },
          ]}
        >
          <Text style={styles.centerVal}>{centerValue}</Text>
          <Text style={styles.centerSub}>{centerSub}</Text>
        </RingStack>

        <View style={styles.metrics}>
          {metrics.map(m => (
            <View key={m.label} style={styles.metric}>
              <Text style={styles.mLabel}>{m.label}</Text>
              <Text style={styles.mVal}>{m.value}</Text>
              <View style={styles.mBar}>
                <ProgressBar progress={m.barPct} color={m.color} height={5} />
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase', color: Colors.textSecondary },
  pctPill: { backgroundColor: Colors.accentChipBg, paddingHorizontal: 9, paddingVertical: 3, borderRadius: radius.pill },
  pctTxt: { fontSize: 12, fontWeight: '700', color: Colors.accentLight },

  rings: { flexDirection: 'row', gap: 16, alignItems: 'center', marginTop: 14 },
  centerVal: { color: Colors.text, fontSize: 19, fontWeight: '800', lineHeight: 22 },
  centerSub: { color: Colors.textMuted, fontSize: 9, fontWeight: '700' },

  metrics: { flex: 1, gap: 9 },
  metric: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  mLabel: { color: Colors.textSecondary, fontSize: 13, fontWeight: '500', flex: 1 },
  mVal: { color: Colors.text, fontSize: 13, fontWeight: '700' },
  mBar: { width: 62 },
});
