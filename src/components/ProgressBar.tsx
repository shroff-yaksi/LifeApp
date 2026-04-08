import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../constants/theme';

type Props = {
  progress: number;
  color?: string;
  height?: number;
};

export function ProgressBar({ progress, color = Colors.accent, height = 6 }: Props) {
  return (
    <View style={[styles.track, { height }]}>
      <View
        style={[
          styles.fill,
          {
            width: `${Math.min(100, Math.max(0, progress))}%`,
            backgroundColor: color,
            height,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: Colors.surfaceHighest,
    borderRadius: 999,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    borderRadius: 999,
  },
});
