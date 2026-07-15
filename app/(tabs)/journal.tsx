import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Colors, TAB_COLORS, radius } from '../../src/constants/theme';
import { TODAY, addDays, hexToRgba } from '../../src/utils/helpers';
import { getData, setData } from '../../src/utils/storage';
import { Card } from '../../src/components/Card';

const C = TAB_COLORS.journal; // muted purple
const P = {
  bg:     hexToRgba(C, 0.08),
  bgMid:  hexToRgba(C, 0.16),
  border: hexToRgba(C, 0.22),
};

type JournalEntry = { notes?: string; mood?: number; updatedAt?: string };

const MOODS = [
  { level: 1, emoji: '😞', label: 'Rough', color: Colors.ramp1 },
  { level: 2, emoji: '😕', label: 'Low', color: Colors.ramp2 },
  { level: 3, emoji: '😐', label: 'Okay', color: Colors.ramp3 },
  { level: 4, emoji: '🙂', label: 'Good', color: Colors.ramp4 },
  { level: 5, emoji: '😄', label: 'Great', color: Colors.ramp5 },
];

const fmtLong = (d: string) =>
  new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
const fmtShort = (d: string) =>
  new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

// Small uppercase section label with a 3px accent bar (redesign v1 convention).
function SectionLabel({ text, color }: { text: string; color: string }) {
  return (
    <View style={styles.sectionLabelRow}>
      <View style={[styles.sectionBar, { backgroundColor: color }]} />
      <Text style={styles.sectionLabelTxt}>{text}</Text>
    </View>
  );
}

export default function JournalScreen() {
  const [date, setDate] = useState(TODAY());
  const [refreshing, setRefreshing] = useState(false);
  const [entry, setEntry] = useState<JournalEntry>({});
  const [history, setHistory] = useState<{ date: string; mood?: number; preview: string }[]>([]);

  const loadEntry = useCallback(async (d: string) => {
    setEntry(await getData<JournalEntry>('journal_' + d, {}));
    const entries: any[] = [];
    for (let i = 0; i < 60; i++) {
      const ds = addDays(TODAY(), -i);
      const je = await getData<JournalEntry>('journal_' + ds, {});
      if (je?.notes) entries.push({ date: ds, mood: je.mood, preview: je.notes.slice(0, 120) });
    }
    setHistory(entries);
  }, []);

  useFocusEffect(useCallback(() => { loadEntry(date); }, [date, loadEntry]));

  const onRefresh = useCallback(async () => { setRefreshing(true); await loadEntry(date); setRefreshing(false); }, [loadEntry, date]);

  const updateNotes = async (value: string) => {
    const updated = { ...entry, notes: value, updatedAt: new Date().toISOString() };
    setEntry(updated);
    await setData('journal_' + date, updated);
  };

  const setMood = async (level: number) => {
    const newMood = entry.mood === level ? undefined : level;
    const updated = { ...entry, mood: newMood, updatedAt: new Date().toISOString() };
    setEntry(updated);
    await setData('journal_' + date, updated);
  };

  const isToday = date === TODAY();
  const atFuture = date >= TODAY();
  const currentMood = MOODS.find(m => m.level === entry.mood);

  return (
    <ScrollView
      style={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C} />}
    >
      {/* ── JOURNAL HERO ─────────────────────────────────────── */}
      <Card accentColor={C} style={styles.hero}>
        <View style={styles.hi} />

        {/* Date navigation */}
        <View style={styles.dateRow}>
          <TouchableOpacity style={styles.navBtn} onPress={() => setDate(addDays(date, -1))} activeOpacity={0.7}>
            <Text style={[styles.navArrow, { color: C }]}>‹</Text>
          </TouchableOpacity>
          <View style={styles.dateMid}>
            <Text style={styles.dateTitle}>{fmtLong(date)}</Text>
            <View style={styles.dateTagRow}>
              {isToday && (
                <View style={[styles.tag, { backgroundColor: P.bgMid, borderColor: P.border }]}>
                  <Text style={[styles.tagTxt, { color: C }]}>Today</Text>
                </View>
              )}
              {currentMood && (
                <View style={[styles.tag, styles.moodTag, { backgroundColor: hexToRgba(currentMood.color, 0.16), borderColor: hexToRgba(currentMood.color, 0.4) }]}>
                  <Text style={styles.tagEmoji}>{currentMood.emoji}</Text>
                  <Text style={[styles.tagTxt, { color: currentMood.color }]}>{currentMood.label}</Text>
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity
            style={[styles.navBtn, atFuture && styles.navBtnDisabled]}
            onPress={() => { if (!atFuture) setDate(addDays(date, 1)); }}
            activeOpacity={0.7}
          >
            <Text style={[styles.navArrow, { color: C }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Mood selector — the big, calm focal row */}
        <SectionLabel text="How are you feeling?" color={C} />
        <View style={styles.moodBtns}>
          {MOODS.map(m => {
            const selected = entry.mood === m.level;
            return (
              <TouchableOpacity
                key={m.level}
                style={[
                  styles.moodBtn,
                  selected && { backgroundColor: hexToRgba(m.color, 0.16), borderColor: m.color, transform: [{ scale: 1.06 }] },
                ]}
                onPress={() => setMood(m.level)}
                activeOpacity={0.8}
              >
                <Text style={styles.moodEmoji}>{m.emoji}</Text>
                <Text style={[styles.moodLabel, selected && { color: m.color }]}>{m.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Notes — airy free-write */}
        <View style={styles.notesHead}>
          <SectionLabel text="Reflection" color={C} />
          {entry.updatedAt ? (
            <Text style={styles.savedHint}>
              Saved {new Date(entry.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          ) : null}
        </View>
        <View style={styles.notesContainer}>
          <TextInput
            style={styles.notesInput}
            value={entry.notes || ''}
            onChangeText={updateNotes}
            placeholder="Write freely — what's on your mind today?"
            placeholderTextColor={Colors.textMuted}
            multiline
            textAlignVertical="top"
          />
        </View>
      </Card>

      {/* ── PAST ENTRIES ─────────────────────────────────────── */}
      {history.length > 0 && (
        <Card title="Past entries" badge={`${history.length}`} badgeColor={C} accentColor={C} style={styles.pastCard}>
          {history.map((e, i) => {
            const mood = MOODS.find(m => m.level === e.mood);
            return (
              <TouchableOpacity key={i} style={styles.historyItem} onPress={() => setDate(e.date)} activeOpacity={0.7}>
                <View style={[styles.moodDot, { backgroundColor: mood ? hexToRgba(mood.color, 0.16) : Colors.surfaceHigh, borderColor: mood ? hexToRgba(mood.color, 0.4) : Colors.border }]}>
                  <Text style={styles.moodDotEmoji}>{mood ? mood.emoji : '·'}</Text>
                </View>
                <View style={styles.historyBody}>
                  <View style={styles.historyTopRow}>
                    <Text style={styles.historyDate}>{fmtShort(e.date)}</Text>
                    {mood && <Text style={[styles.historyMoodLabel, { color: mood.color }]}>{mood.label}</Text>}
                  </View>
                  <Text style={styles.historyPreview} numberOfLines={2}>{e.preview}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </Card>
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: 14, paddingTop: 8 },

  hero: { borderRadius: radius.lg, padding: 20, marginBottom: 12 },
  hi: { position: 'absolute', top: 0, left: 16, right: 16, height: 1, backgroundColor: Colors.innerHighlight },

  // Date navigation
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 26 },
  navBtn: { width: 42, height: 42, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  navBtnDisabled: { opacity: 0.25 },
  navArrow: { fontSize: 26, fontWeight: '500', lineHeight: 30, marginTop: -2 },
  dateMid: { alignItems: 'center', flex: 1 },
  dateTitle: { color: Colors.text, fontSize: 18, fontWeight: '800', letterSpacing: -0.4, textAlign: 'center' },
  dateTagRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, borderWidth: 1 },
  moodTag: {},
  tagEmoji: { fontSize: 12 },
  tagTxt: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' as const, letterSpacing: 0.5 },

  // Section labels
  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionBar: { width: 3, height: 13, borderRadius: 2, opacity: 0.8 },
  sectionLabelTxt: { color: Colors.textSecondary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' as const, letterSpacing: 1 },

  // Mood row
  moodBtns: { flexDirection: 'row', gap: 8, marginBottom: 28 },
  moodBtn: {
    flex: 1,
    height: 74,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderTopColor: Colors.innerHighlight,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    gap: 6,
  },
  moodEmoji: { fontSize: 28 },
  moodLabel: { fontSize: 9, fontWeight: '700', color: Colors.textMuted, letterSpacing: 0.4 },

  // Notes
  notesHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  savedHint: { color: Colors.textMuted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' as const, letterSpacing: 0.6, marginBottom: 14 },
  notesContainer: {
    backgroundColor: Colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderTopColor: Colors.innerHighlight,
    padding: 16,
    minHeight: 220,
  },
  notesInput: {
    color: Colors.text,
    fontSize: 15,
    lineHeight: 26,
    fontWeight: '500',
    textAlignVertical: 'top' as const,
    minHeight: 190,
  },

  // Past entries
  pastCard: { borderRadius: radius.lg, padding: 18 },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderTopColor: Colors.innerHighlight,
    padding: 14,
    marginBottom: 8,
  },
  moodDot: { width: 40, height: 40, borderRadius: radius.pill, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  moodDotEmoji: { fontSize: 18, color: Colors.textMuted },
  historyBody: { flex: 1 },
  historyTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  historyDate: { color: Colors.text, fontSize: 13, fontWeight: '700' },
  historyMoodLabel: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' as const, letterSpacing: 0.4 },
  historyPreview: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20 },
});
