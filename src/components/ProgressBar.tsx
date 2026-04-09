import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../constants/theme';

type Props = {
  progress: number;
  color?: string;
  height?: number;
};

export function ProgressBar({ progress, color = Colors.accent, height = 6 }: Props) {
  const pct = Math.min(100, Math.max(0, progress));
  return (
    <View style={[styles.track, { height }]}>
      {pct > 0 && (
        <View
          style={[
            styles.fill,
            {
              width: `${pct}%`,
              backgroundColor: color,
              height,
              shadowColor: color,
              shadowOpacity: 0.55,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 0 },
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: Colors.surfaceHighest,
    borderRadius: 999,
    overflow: 'visible',
    width: '100%',
  },
  fill: {
    borderRadius: 999,
  },
});
