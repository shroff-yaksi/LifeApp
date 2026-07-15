import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors } from '../constants/theme';

export type Ring = {
  pct: number;      // 0–100 fill
  color: string;
  width?: number;   // stroke width; falls back to Props.width
};

type Props = {
  size?: number;
  rings: Ring[];        // outermost first
  gap?: number;         // spacing between concentric rings
  width?: number;       // default stroke width
  trackColor?: string;
  children?: React.ReactNode;  // centered content
};

// N concentric progress rings — generalizes the old single GoalRing into the
// mockup's hero dual-ring. Outermost ring is index 0.
export function RingStack({
  size = 86,
  rings,
  gap = 4,
  width = 7,
  trackColor = Colors.surfaceHighest,
  children,
}: Props) {
  const c = size / 2;
  let outerR = c - width / 2;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {rings.map((ring, i) => {
          const w = ring.width ?? width;
          const r = outerR - (i === 0 ? 0 : gap / 2);
          // advance the running radius for the next inner ring
          const circ = 2 * Math.PI * r;
          const dash = circ * (Math.max(0, Math.min(100, ring.pct)) / 100);
          const el = (
            <React.Fragment key={i}>
              <Circle cx={c} cy={c} r={r} stroke={trackColor} strokeWidth={w} fill="none" />
              <Circle
                cx={c} cy={c} r={r} stroke={ring.color} strokeWidth={w} fill="none"
                strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
                transform={`rotate(-90 ${c} ${c})`}
              />
            </React.Fragment>
          );
          const nextW = rings[i + 1]?.width ?? width;
          outerR = r - w / 2 - gap - nextW / 2;
          return el;
        })}
      </Svg>
      {children != null && <View style={[styles.center, { width: size, height: size }]}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
});
