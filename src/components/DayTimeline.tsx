import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, CATEGORY_COLORS } from '../constants/theme';
import { formatTime12, timeToMin, NOW_MINUTES } from '../utils/helpers';

export type TimelineItem = {
  id: string;
  name: string;
  start: string;      // "HH:MM"
  end: string;        // "HH:MM"
  category?: string;
  done?: boolean;
};

type Props = {
  items: TimelineItem[];
  nowMin?: number;
  accent?: string;
  onToggle?: (id: string) => void;   // tap a segment to mark done/undone
};

// Vertical connector rail with colored category dots + a NOW pill on the
// in-progress segment. Driven by the same schedule_{day} rows the Today screen
// already reads — the mockup's "Today's rhythm" card.
export function DayTimeline({ items, nowMin = NOW_MINUTES(), accent = Colors.accent, onToggle }: Props) {
  if (items.length === 0) {
    return <Text style={styles.empty}>No schedule yet — add tasks in the Tasks tab</Text>;
  }
  return (
    <View>
      {items.map((it, i) => {
        const color = CATEGORY_COLORS[it.category || ''] || accent;
        const sMin = timeToMin(it.start);
        const eMin = timeToMin(it.end);
        const active = nowMin >= sMin && nowMin < eMin && !it.done;
        const last = i === items.length - 1;
        const Row = onToggle ? TouchableOpacity : View;
        return (
          <Row
            key={it.id}
            style={[styles.seg, last && styles.segLast]}
            {...(onToggle ? { onPress: () => onToggle(it.id), activeOpacity: 0.7 } : {})}
          >
            {!last && <View style={styles.rail} />}
            <View style={[styles.dot, { backgroundColor: it.done ? Colors.surfaceHighest : color }]} />
            <View style={styles.body}>
              <View style={styles.nameRow}>
                <Text style={[styles.name, it.done && styles.nameDone]} numberOfLines={1}>{it.name}</Text>
                {active && (
                  <View style={styles.nowPill}>
                    <Text style={styles.nowTxt}>NOW</Text>
                  </View>
                )}
              </View>
              <Text style={styles.time}>{formatTime12(it.start)} – {formatTime12(it.end)}</Text>
            </View>
          </Row>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { color: Colors.textMuted, fontSize: 13, textAlign: 'center', paddingVertical: 12 },
  seg: { flexDirection: 'row', gap: 11, position: 'relative', paddingBottom: 13 },
  segLast: { paddingBottom: 2 },
  rail: { position: 'absolute', left: 5, top: 16, bottom: -2, width: 1.5, backgroundColor: Colors.borderHover },
  dot: { width: 11, height: 11, borderRadius: 6, marginTop: 3, borderWidth: 2, borderColor: Colors.bg, zIndex: 1 },
  body: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  name: { color: Colors.text, fontSize: 13.5, fontWeight: '600', flexShrink: 1 },
  nameDone: { color: Colors.textMuted, textDecorationLine: 'line-through' },
  time: { color: Colors.textMuted, fontSize: 11.5, marginTop: 1 },
  nowPill: { backgroundColor: Colors.accentChipBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
  nowTxt: { fontSize: 9.5, fontWeight: '800', letterSpacing: 0.5, color: Colors.accentLight },
});
