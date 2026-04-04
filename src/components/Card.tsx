import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../constants/theme';

type Props = {
  title?: string;
  badge?: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  style?: ViewStyle;
};

export function Card({ title, badge, headerRight, children, style }: Props) {
  return (
    <View style={[styles.card, style]}>
      {(title || headerRight) && (
        <View style={styles.header}>
          <View style={styles.titleRow}>
            {title ? <Text style={styles.title}>{title}</Text> : null}
            {badge ? <Text style={styles.badge}>{badge}</Text> : null}
          </View>
          {headerRight}
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  badge: {
    color: Colors.orange,
    fontSize: 10,
    fontWeight: '700',
    backgroundColor: Colors.orangeBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
});
