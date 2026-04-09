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
    <View style={[
      styles.card,
      accentColor
        ? { borderColor: Colors.border, borderTopColor: accentColor, borderTopWidth: 2 }
        : {},
      style,
    ]}>
      {(title || headerRight) && (
        <View style={styles.header}>
          <View style={styles.titleRow}>
            {accentColor && (
              <View style={[styles.dot, { backgroundColor: accentColor, shadowColor: accentColor, shadowOpacity: 0.8, shadowRadius: 4 }]} />
            )}
            {title ? <Text style={styles.title}>{title}</Text> : null}
            {badge ? (
              <View style={[styles.badgeContainer, { backgroundColor: (badgeColor || Colors.orange) + '22' }]}>
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
    borderRadius: 22,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
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
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  title: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  badgeContainer: {
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  badge: {
    fontSize: 10,
    fontWeight: '800',
    overflow: 'hidden',
  },
});
