import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Colors, TAB_COLORS } from '../../src/constants/theme';
import { TODAY, addDays } from '../../src/utils/helpers';
import { getData, setData } from '../../src/utils/storage';
import { Card } from '../../src/components/Card';

const C = TAB_COLORS.journal; // pink

type JournalEntry = { notes?: string; mood?: number; updatedAt?: string };

const MOODS = [
  { level: 1, emoji: '😞', label: 'Rough', color: Colors.red },
  { level: 2, emoji: '😕', label: 'Low', color: Colors.orange },
  { level: 3, emoji: '😐', label: 'Okay', color: Colors.yellow },
  { level: 4, emoji: '🙂', label: 'Good', color: Colors.green },
  { level: 5, emoji: '😄', label: 'Great', color: Colors.cyan },
];

export default function JournalScreen() {
  const [date, setDate] = useState(TODAY());
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
  const currentMood = MOODS.find(m => m.level === entry.mood);

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      {/* Main Journal Card */}
      <Card accentColor={C}>
        {/* Date Navigation */}
        <View style={styles.dateRow}>
          <TouchableOpacity style={styles.dateArrowBtn} onPress={() => setDate(addDays(date, -1))}>
            <Text style={[styles.dateArrow, { color: C }]}>‹</Text>
          </TouchableOpacity>
          <View style={styles.dateMid}>
            <Text style={styles.dateTitle}>
              {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </Text>
            <View style={styles.dateTagRow}>
              {isToday && (
                <View style={[styles.todayTag, { backgroundColor: C + '20', borderColor: C + '50' }]}>
                  <Text style={[styles.todayTagTxt, { color: C }]}>Today</Text>
                </View>
              )}
              {currentMood && (
                <View style={[styles.moodTag, { backgroundColor: currentMood.color + '20', borderColor: currentMood.color + '50' }]}>
                  <Text style={{ fontSize: 12 }}>{currentMood.emoji}</Text>
                  <Text style={[styles.moodTagTxt, { color: currentMood.color }]}>{currentMood.label}</Text>
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity
            style={[styles.dateArrowBtn, date >= TODAY() && { opacity: 0.2 }]}
            onPress={() => { if (date < TODAY()) setDate(addDays(date, 1)); }}
          >
            <Text style={[styles.dateArrow, { color: C }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Mood Selector */}
        <View style={styles.moodSection}>
          <Text style={styles.moodSectionLabel}>How are you feeling?</Text>
          <View style={styles.moodBtns}>
            {MOODS.map(m => {
              const selected = entry.mood === m.level;
              return (
                <TouchableOpacity
                  key={m.level}
                  style={[
                    styles.moodBtn,
                    selected && { backgroundColor: m.color + '25', borderColor: m.color, transform: [{ scale: 1.08 }] },
                  ]}
                  onPress={() => setMood(m.level)}
                >
                  <Text style={styles.moodEmoji}>{m.emoji}</Text>
                  <Text style={[styles.moodLabel, selected && { color: m.color }]}>{m.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Notes */}
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

        {entry.updatedAt && (
          <Text style={styles.savedHint}>
            ✓ saved {new Date(entry.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        )}
      </Card>

      {/* Past Entries */}
      {history.length > 0 && (
        <Card title="Past Entries" accentColor={C}>
          {history.map((e, i) => {
            const mood = MOODS.find(m => m.level === e.mood);
            return (
              <TouchableOpacity key={i} style={styles.historyItem} onPress={() => setDate(e.date)}>
                <View style={styles.historyHeader}>
                  <View>
                    <Text style={styles.historyDate}>
                      {new Date(e.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </Text>
                    {mood && (
                      <View style={styles.historyMoodRow}>
                        <Text style={{ fontSize: 12 }}>{mood.emoji}</Text>
                        <Text style={[styles.historyMoodLabel, { color: mood.color }]}>{mood.label}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.historyArrow, { color: C }]}>›</Text>
                </View>
                <Text style={styles.historyPreview} numberOfLines={2}>{e.preview}</Text>
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
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  dateArrowBtn: { padding: 8 },
  dateArrow: { fontSize: 38, fontWeight: '300', lineHeight: 42 },
  dateMid: { alignItems: 'center', flex: 1 },
  dateTitle: { color: Colors.text, fontSize: 16, fontWeight: '800', letterSpacing: -0.3, textAlign: 'center' },
  dateTagRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  todayTag: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  todayTagTxt: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  moodTag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  moodTagTxt: { fontSize: 10, fontWeight: '700' },
  moodSection: { marginBottom: 20 },
  moodSectionLabel: { color: Colors.textMuted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 12 },
  moodBtns: { flexDirection: 'row', gap: 6 },
  moodBtn: {
    flex: 1,
    height: 58,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    gap: 3,
  },
  moodEmoji: { fontSize: 22 },
  moodLabel: { fontSize: 8, fontWeight: '700', color: Colors.textMuted, letterSpacing: 0.3 },
  notesContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    minHeight: 200,
  },
  notesInput: {
    color: Colors.text,
    fontSize: 15,
    lineHeight: 26,
    textAlignVertical: 'top' as const,
    minHeight: 180,
  },
  savedHint: { color: Colors.textMuted, fontSize: 9, textAlign: 'right', fontWeight: '700', textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  historyItem: { backgroundColor: Colors.surface, borderRadius: 14, padding: 14, marginBottom: 8 },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  historyDate: { color: Colors.text, fontSize: 13, fontWeight: '700' },
  historyMoodRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  historyMoodLabel: { fontSize: 10, fontWeight: '700' },
  historyArrow: { fontSize: 24, fontWeight: '300' },
  historyPreview: { color: Colors.textMuted, fontSize: 13, lineHeight: 20 },
});
