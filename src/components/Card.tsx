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
    <View style={[styles.card, style]}>
      {(title || headerRight) && (
        <View style={styles.header}>
          <View style={styles.titleRow}>
            {accentColor && (
              <View style={[styles.accent, { backgroundColor: accentColor }]} />
            )}
            {title ? <Text style={styles.title}>{title}</Text> : null}
            {badge ? (
              <View style={[styles.badgeContainer, { backgroundColor: (badgeColor || Colors.orange) + '18' }]}>
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
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accent: {
    width: 3,
    height: 14,
    borderRadius: 2,
    opacity: 0.7,
  },
  title: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  badgeContainer: {
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  badge: {
    fontSize: 10,
    fontWeight: '600',
    overflow: 'hidden',
  },
});
