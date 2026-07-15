import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors } from '../constants/theme';

export type DonutSegment = { value: number; color: string };

type Props = {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  gap?: number;          // px gap between segments (arc units)
  trackColor?: string;
  children?: React.ReactNode;
};

// Segmented donut — arcs sized by value, laid out with stroke-dasharray like
// the mockup's Money donut. Purely proportional; no external chart lib.
export function DonutChart({
  segments,
  size = 128,
  strokeWidth = 14,
  gap = 3,
  trackColor = Colors.surfaceHigh,
  children,
}: Props) {
  const c = size / 2;
  const r = c - strokeWidth / 2;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((s, seg) => s + Math.max(0, seg.value), 0) || 1;

  let offset = 0;
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={c} cy={c} r={r} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
        {segments.map((seg, i) => {
          const frac = Math.max(0, seg.value) / total;
          const len = Math.max(0, frac * circ - gap);
          const dashOffset = -offset;
          offset += frac * circ;
          if (len <= 0) return null;
          return (
            <Circle
              key={i}
              cx={c} cy={c} r={r} fill="none"
              stroke={seg.color} strokeWidth={strokeWidth} strokeLinecap="round"
              strokeDasharray={`${len} ${circ - len}`}
              strokeDashoffset={dashOffset}
              transform={`rotate(-90 ${c} ${c})`}
            />
          );
        })}
      </Svg>
      {children != null && <View style={[styles.center, { width: size, height: size }]}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
});
