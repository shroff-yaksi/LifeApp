import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Colors, CATEGORY_COLORS, TAB_COLORS } from '../../src/constants/theme';
import { TODAY, getDayType, formatTime12, timeToMin, NOW_MINUTES, uid } from '../../src/utils/helpers';
import { getData, setData } from '../../src/utils/storage';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { ModalSheet } from '../../src/components/ModalSheet';
import { FormField } from '../../src/components/FormField';

const C = TAB_COLORS.schedule; // cyan

type Task = { id: string; name: string; start: string; end: string; category: string };

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export default function ScheduleScreen() {
  const [tab, setTab] = useState<'weekday' | 'saturday' | 'sunday'>('weekday');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completion, setCompletion] = useState<Record<string, any>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState('');
  const [taskName, setTaskName] = useState('');
  const [taskStart, setTaskStart] = useState('');
  const [taskEnd, setTaskEnd] = useState('');
  const [taskCategory, setTaskCategory] = useState('work');

  const loadData = useCallback(async () => {
    const t = await getData<Task[]>('schedule_' + tab, []);
    setTasks(t);
    const isToday = tab === getDayType(TODAY());
    setCompletion(isToday ? await getData<Record<string, any>>('scheduleCompletion_' + TODAY(), {}) : {});
  }, [tab]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const toggleDone = async (id: string) => {
    if (tab !== getDayType(TODAY())) return;
    const comp = { ...completion };
    if (comp[id]) delete comp[id]; else comp[id] = { doneAt: new Date().toISOString() };
    setCompletion(comp);
    await setData('scheduleCompletion_' + TODAY(), comp);
  };

  const openAdd = () => {
    setEditId(''); setTaskName(''); setTaskStart(''); setTaskEnd(''); setTaskCategory('work'); setModalOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditId(task.id); setTaskName(task.name); setTaskStart(task.start); setTaskEnd(task.end); setTaskCategory(task.category); setModalOpen(true);
  };

  const saveTask = async () => {
    if (!taskName.trim()) { Alert.alert('Missing Name', 'Please enter a task name.'); return; }
    if (!TIME_RE.test(taskStart)) { Alert.alert('Invalid Time', 'Start time must be HH:MM (e.g. 09:00).'); return; }
    if (!TIME_RE.test(taskEnd)) { Alert.alert('Invalid Time', 'End time must be HH:MM (e.g. 10:00).'); return; }
    if (timeToMin(taskEnd) <= timeToMin(taskStart)) {
      Alert.alert('Invalid Range', 'End time must be after start time.'); return;
    }
    const t = [...tasks];
    if (editId) {
      const idx = t.findIndex(x => x.id === editId);
      if (idx > -1) t[idx] = { ...t[idx], name: taskName.trim(), start: taskStart, end: taskEnd, category: taskCategory };
    } else {
      t.push({ id: uid(), name: taskName.trim(), start: taskStart, end: taskEnd, category: taskCategory });
    }
    t.sort((a, b) => a.start.localeCompare(b.start));
    setTasks(t);
    await setData('schedule_' + tab, t);
    setModalOpen(false);
  };

  const deleteTask = (id: string, name: string) => {
    Alert.alert('Delete Task', `Remove "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          const t = tasks.filter(x => x.id !== id);
          setTasks(t);
          await setData('schedule_' + tab, t);
        },
      },
    ]);
  };

  const nowMin = NOW_MINUTES();
  const isToday = tab === getDayType(TODAY());
  const categories = ['fitness', 'work', 'learning', 'personal', 'meal', 'sleep', 'date', 'skill'];

  const tabLabels: Record<string, string> = { weekday: 'Weekday', saturday: 'Saturday', sunday: 'Sunday' };
  const tabEmojis: Record<string, string> = { weekday: '📅', saturday: '🎉', sunday: '🌿' };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Tab Pills */}
      <View style={styles.tabRow}>
        {(['weekday', 'saturday', 'sunday'] as const).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && { backgroundColor: C + '20', borderColor: C + '50' }]}
            onPress={() => setTab(t)}
          >
            <Text style={{ fontSize: 14, marginBottom: 2 }}>{tabEmojis[t]}</Text>
            <Text style={[styles.tabText, tab === t && { color: C }]}>{tabLabels[t]}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.addRow}>
        <Text style={styles.hint}>
          {isToday ? '✓ Tap to mark done · Long-press to edit' : 'Long-press to edit · Template for all ' + tab + 's'}
        </Text>
        <Button title="+ Add Task" size="sm" onPress={openAdd} color={C} />
      </View>

      <Card accentColor={C}>
        {tasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No tasks yet</Text>
            <Text style={styles.emptySubtext}>Tap + Add Task to build your {tabLabels[tab].toLowerCase()} schedule</Text>
          </View>
        ) : tasks.map(t => {
          const sMin = timeToMin(t.start), eMin = timeToMin(t.end);
          const done = !!completion[t.id];
          const isActive = isToday && nowMin >= sMin && nowMin < eMin && !done;
          const taskColor = CATEGORY_COLORS[t.category] || C;
          return (
            <TouchableOpacity
              key={t.id}
              style={[
                styles.timelineItem,
                isActive && { backgroundColor: taskColor + '15', borderColor: taskColor + '40' },
                done && styles.timelineDone,
              ]}
              onPress={() => toggleDone(t.id)}
              onLongPress={() => openEdit(t)}
            >
              <View style={styles.timeCol}>
                <Text style={[styles.timeText, isActive && { color: taskColor }]}>{formatTime12(t.start)}</Text>
                <Text style={styles.timeEndText}>{formatTime12(t.end)}</Text>
              </View>
              <View style={[styles.timeLine, { backgroundColor: done ? Colors.surfaceHighest : taskColor }]} />
              <View style={styles.taskContent}>
                <Text style={[styles.taskNameText, done && styles.taskNameDone]}>{t.name}</Text>
                <View style={styles.taskMeta}>
                  <View style={[styles.catBadge, { backgroundColor: taskColor + '20' }]}>
                    <Text style={[styles.catBadgeTxt, { color: taskColor }]}>{t.category}</Text>
                  </View>
                  {isActive && (
                    <View style={[styles.nowPill, { backgroundColor: taskColor + '25', borderColor: taskColor + '60' }]}>
                      <Text style={[styles.nowPillTxt, { color: taskColor }]}>NOW</Text>
                    </View>
                  )}
                  {done && <Text style={styles.doneLabel}>✓ Done</Text>}
                </View>
              </View>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteTask(t.id, t.name)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.deleteBtnText}>✕</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}
      </Card>

      <ModalSheet visible={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Edit Task' : 'Add Task'} accentColor={C}>
        <FormField label="Task Name" value={taskName} onChangeText={setTaskName} placeholder="e.g. Morning workout" />
        <FormField label="Start Time (HH:MM)" value={taskStart} onChangeText={setTaskStart} placeholder="09:00" keyboardType="numbers-and-punctuation" />
        <FormField label="End Time (HH:MM)" value={taskEnd} onChangeText={setTaskEnd} placeholder="10:00" keyboardType="numbers-and-punctuation" />
        <FormField label="Category">
          <View style={styles.catGrid}>
            {categories.map(c => {
              const col = CATEGORY_COLORS[c] || C;
              return (
                <TouchableOpacity
                  key={c}
                  style={[styles.catBtn, taskCategory === c && { borderColor: col, backgroundColor: col + '20' }]}
                  onPress={() => setTaskCategory(c)}
                >
                  <Text style={[styles.catBtnText, { color: taskCategory === c ? col : Colors.textSecondary }]}>{c}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </FormField>
        <View style={styles.modalActions}>
          <Button title="Cancel" variant="outline" onPress={() => setModalOpen(false)} />
          <Button title={editId ? 'Update' : 'Add Task'} onPress={saveTask} color={C} />
        </View>
      </ModalSheet>
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: 14, paddingTop: 8 },
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabText: { color: Colors.textMuted, fontSize: 11, fontWeight: '700' },
  addRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  hint: { color: Colors.textMuted, fontSize: 10, flex: 1, marginRight: 8 },
  emptyState: { alignItems: 'center', paddingVertical: 30 },
  emptyIcon: { fontSize: 32, marginBottom: 8 },
  emptyText: { color: Colors.text, fontSize: 15, fontWeight: '700', marginBottom: 4 },
  emptySubtext: { color: Colors.textMuted, fontSize: 12, textAlign: 'center' },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  timelineDone: { opacity: 0.45 },
  timeCol: { width: 60 },
  timeText: { color: Colors.text, fontSize: 12, fontWeight: '700' },
  timeEndText: { color: Colors.textMuted, fontSize: 10, marginTop: 2 },
  timeLine: { width: 3, height: 44, borderRadius: 2 },
  taskContent: { flex: 1 },
  taskNameText: { color: Colors.text, fontSize: 14, fontWeight: '700' },
  taskNameDone: { textDecorationLine: 'line-through' as const, color: Colors.textMuted },
  taskMeta: { flexDirection: 'row', gap: 6, marginTop: 5, alignItems: 'center' },
  catBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  catBadgeTxt: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  nowPill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  nowPillTxt: { fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },
  doneLabel: { color: Colors.green, fontSize: 9, fontWeight: '700' },
  deleteBtn: { padding: 4 },
  deleteBtnText: { color: Colors.textMuted, fontSize: 16 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap' as const, gap: 8 },
  catBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surfaceHigh },
  catBtnText: { fontSize: 12, fontWeight: '600' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10, marginBottom: 20 },
});
