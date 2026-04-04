import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Colors } from '../../src/constants/theme';
import { TODAY, addDays } from '../../src/utils/helpers';
import { getData, setData } from '../../src/utils/storage';
import { Card } from '../../src/components/Card';

type JournalEntry = { notes?: string; mood?: number; updatedAt?: string };

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
      if (je?.notes) entries.push({ date: ds, mood: je.mood, preview: je.notes.slice(0, 100) });
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
    const updated = { ...entry, mood: level, updatedAt: new Date().toISOString() };
    setEntry(updated);
    await setData('journal_' + date, updated);
  };

  const moodColors = ['', Colors.red, Colors.orange, Colors.yellow, Colors.green, Colors.accentLight];
  const moodLabels = ['', '😞', '😕', '😐', '🙂', '😄'];
  const isToday = date === TODAY();

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Card>
        {/* Date Navigation */}
        <View style={styles.dateRow}>
          <TouchableOpacity onPress={() => setDate(addDays(date, -1))} style={styles.dateArrow}>
            <Text style={styles.dateArrowText}>‹</Text>
          </TouchableOpacity>
          <View style={styles.dateMid}>
            <Text style={styles.dateTitle}>
              {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </Text>
            {isToday && <Text style={styles.todayTag}>Today</Text>}
          </View>
          <TouchableOpacity onPress={() => { if (date < TODAY()) setDate(addDays(date, 1)); }} style={styles.dateArrow}>
            <Text style={[styles.dateArrowText, date >= TODAY() && { opacity: 0.2 }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Mood */}
        <View style={styles.moodRow}>
          <Text style={styles.moodLabel}>How are you feeling?</Text>
          <View style={styles.moodBtns}>
            {[1, 2, 3, 4, 5].map(n => (
              <TouchableOpacity
                key={n}
                style={[styles.moodBtn, entry.mood === n && { backgroundColor: moodColors[n] + '30', borderColor: moodColors[n] }]}
                onPress={() => setMood(n)}
              >
                <Text style={styles.moodEmoji}>{moodLabels[n]}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notes */}
        <TextInput
          style={styles.notesInput}
          value={entry.notes || ''}
          onChangeText={updateNotes}
          placeholder="Write anything on your mind..."
          placeholderTextColor={Colors.textMuted}
          multiline
          textAlignVertical="top"
        />
        {entry.updatedAt && (
          <Text style={styles.savedHint}>saved {new Date(entry.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        )}
      </Card>

      {/* Past Entries */}
      {history.length > 0 && (
        <Card title="Past Entries">
          {history.map((e, i) => (
            <TouchableOpacity key={i} style={styles.historyItem} onPress={() => setDate(e.date)}>
              <View style={styles.historyHeader}>
                <Text style={styles.historyDate}>
                  {new Date(e.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </Text>
                {e.mood ? (
                  <Text style={{ color: moodColors[e.mood], fontSize: 16 }}>{moodLabels[e.mood]}</Text>
                ) : null}
              </View>
              <Text style={styles.historyPreview} numberOfLines={2}>{e.preview}</Text>
            </TouchableOpacity>
          ))}
        </Card>
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: 14, paddingTop: 8 },
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  dateArrow: { padding: 8 },
  dateArrowText: { color: Colors.accent, fontSize: 36, fontWeight: '300' },
  dateMid: { alignItems: 'center', gap: 6 },
  dateTitle: { color: Colors.text, fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  todayTag: { color: Colors.accentLight, fontSize: 9, fontWeight: '700', backgroundColor: Colors.accentBg, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, textTransform: 'uppercase' as const, letterSpacing: 0.8, overflow: 'hidden' },
  moodRow: { marginBottom: 20 },
  moodLabel: { color: Colors.textMuted, fontSize: 9, fontWeight: '700', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 12 },
  moodBtns: { flexDirection: 'row', gap: 8 },
  moodBtn: { flex: 1, height: 52, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface },
  moodEmoji: { fontSize: 22 },
  notesInput: { backgroundColor: 'transparent', color: Colors.text, fontSize: 16, minHeight: 200, lineHeight: 26, textAlignVertical: 'top' as const },
  savedHint: { color: Colors.textMuted, fontSize: 9, textAlign: 'right', marginTop: 8, fontWeight: '700', textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  historyItem: { paddingVertical: 16, marginBottom: 4, backgroundColor: Colors.surface, borderRadius: 14, padding: 14 },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  historyDate: { color: Colors.accentLight, fontSize: 12, fontWeight: '700' },
  historyPreview: { color: Colors.textMuted, fontSize: 13, lineHeight: 20 },
});
