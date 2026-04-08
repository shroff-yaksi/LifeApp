import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../constants/theme';

type Props = {
  title?: string;
  badge?: string;
  badgeColor?: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  style?: ViewStyle;
  accentColor?: string;
};

export function Card({ title, badge, badgeColor, headerRight, children, style, accentColor }: Props) {
  return (
    <View style={[styles.card, accentColor && { borderLeftColor: accentColor, borderLeftWidth: 3 }, style]}>
      {(title || headerRight) && (
        <View style={styles.header}>
          <View style={styles.titleRow}>
            {accentColor && <View style={[styles.dot, { backgroundColor: accentColor }]} />}
            {title ? <Text style={styles.title}>{title}</Text> : null}
            {badge ? (
              <View style={[styles.badgeContainer, { backgroundColor: (badgeColor || Colors.orange) + '20' }]}>
                <Text style={[styles.badge, { color: badgeColor || Colors.orange }]}>{badge}</Text>
              </View>
            ) : null}
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
    padding: 18,
    marginBottom: 12,
    borderLeftWidth: 0,
    borderLeftColor: 'transparent',
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
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  title: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  badgeContainer: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badge: {
    fontSize: 10,
    fontWeight: '800',
    overflow: 'hidden',
  },
});
