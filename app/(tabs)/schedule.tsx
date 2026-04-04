import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Colors, CATEGORY_COLORS } from '../../src/constants/theme';
import { TODAY, getDayType, formatTime12, timeToMin, NOW_MINUTES, uid } from '../../src/utils/helpers';
import { getData, setData } from '../../src/utils/storage';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { ModalSheet } from '../../src/components/ModalSheet';
import { FormField } from '../../src/components/FormField';

type Task = { id: string; name: string; start: string; end: string; category: string };

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

  const openAdd = () => { setEditId(''); setTaskName(''); setTaskStart(''); setTaskEnd(''); setTaskCategory('work'); setModalOpen(true); };

  const openEdit = (task: Task) => { setEditId(task.id); setTaskName(task.name); setTaskStart(task.start); setTaskEnd(task.end); setTaskCategory(task.category); setModalOpen(true); };

  const saveTask = async () => {
    if (!taskName || !taskStart || !taskEnd) return;
    const t = [...tasks];
    if (editId) {
      const idx = t.findIndex(x => x.id === editId);
      if (idx > -1) t[idx] = { ...t[idx], name: taskName, start: taskStart, end: taskEnd, category: taskCategory };
    } else {
      t.push({ id: uid(), name: taskName, start: taskStart, end: taskEnd, category: taskCategory });
    }
    t.sort((a, b) => a.start.localeCompare(b.start));
    setTasks(t);
    await setData('schedule_' + tab, t);
    setModalOpen(false);
  };

  const deleteTask = async (id: string) => {
    const t = tasks.filter(x => x.id !== id);
    setTasks(t);
    await setData('schedule_' + tab, t);
  };

  const nowMin = NOW_MINUTES();
  const isToday = tab === getDayType(TODAY());
  const categories = ['fitness', 'work', 'learning', 'personal', 'meal', 'sleep', 'date', 'skill'];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.tabRow}>
        {(['weekday', 'saturday', 'sunday'] as const).map(t => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t === 'weekday' ? 'Weekday' : t === 'saturday' ? 'Saturday' : 'Sunday'}</Text>
          </TouchableOpacity>
        ))}
        <Button title="+ Add" size="sm" onPress={openAdd} />
      </View>

      <Text style={styles.hint}>Edit your recurring schedule templates. Today's schedule shows on the Dashboard.</Text>

      <Card>
        {tasks.length === 0 ? (
          <Text style={styles.empty}>No tasks yet. Tap + Add to build your schedule.</Text>
        ) : tasks.map(t => {
          const sMin = timeToMin(t.start), eMin = timeToMin(t.end);
          const done = !!completion[t.id];
          const isActive = isToday && nowMin >= sMin && nowMin < eMin && !done;
          return (
            <TouchableOpacity key={t.id} style={[styles.timelineItem, isActive && styles.timelineActive, done && styles.timelineDone]} onPress={() => toggleDone(t.id)} onLongPress={() => openEdit(t)}>
              <View style={styles.timeCol}>
                <Text style={styles.timeText}>{formatTime12(t.start)}</Text>
                <Text style={styles.timeEndText}>{formatTime12(t.end)}</Text>
              </View>
              <View style={[styles.timeLine, { backgroundColor: CATEGORY_COLORS[t.category] || Colors.accent }]} />
              <View style={styles.taskContent}>
                <Text style={[styles.taskNameText, done && styles.taskNameDone]}>{t.name}</Text>
                <View style={styles.taskMeta}>
                  <Text style={[styles.categoryBadge, { color: CATEGORY_COLORS[t.category] || Colors.accent }]}>{t.category}</Text>
                  {done && <Text style={styles.doneLabel}>✓</Text>}
                </View>
              </View>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteTask(t.id)}><Text style={styles.deleteBtnText}>✕</Text></TouchableOpacity>
            </TouchableOpacity>
          );
        })}
      </Card>

      <ModalSheet visible={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Edit Task' : 'Add Task'}>
        <FormField label="Task Name" value={taskName} onChangeText={setTaskName} placeholder="Task name..." />
        <FormField label="Start Time (HH:MM)" value={taskStart} onChangeText={setTaskStart} placeholder="09:00" />
        <FormField label="End Time (HH:MM)" value={taskEnd} onChangeText={setTaskEnd} placeholder="10:00" />
        <FormField label="Category">
          <View style={styles.catGrid}>
            {categories.map(c => (
              <TouchableOpacity key={c} style={[styles.catBtn, taskCategory === c && { borderColor: CATEGORY_COLORS[c], backgroundColor: (CATEGORY_COLORS[c] || '#fff') + '20' }]} onPress={() => setTaskCategory(c)}>
                <Text style={[styles.catBtnText, { color: CATEGORY_COLORS[c] || Colors.text }]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </FormField>
        <View style={styles.modalActions}>
          <Button title="Cancel" variant="outline" onPress={() => setModalOpen(false)} />
          <Button title="Save" onPress={saveTask} />
        </View>
      </ModalSheet>
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: 14, paddingTop: 8 },
  tabRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12, backgroundColor: Colors.card, padding: 6, borderRadius: 14 },
  tab: { flex: 1, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  tabActive: { backgroundColor: Colors.accentBg },
  tabText: { color: Colors.textMuted, fontSize: 12, fontWeight: '700' },
  tabTextActive: { color: Colors.accentLight },
  hint: { color: Colors.textMuted, fontSize: 11, marginBottom: 10, marginTop: -4 },
  empty: { color: Colors.textMuted, fontSize: 14, textAlign: 'center', paddingVertical: 30 },
  timelineItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 14, backgroundColor: Colors.card, borderRadius: 14, padding: 16, marginBottom: 8 },
  timelineActive: { backgroundColor: Colors.accentBg, borderLeftWidth: 3, borderLeftColor: Colors.accent },
  timelineDone: { opacity: 0.45 },
  timeCol: { width: 56 },
  timeText: { color: Colors.text, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  timeEndText: { color: Colors.textMuted, fontSize: 10, marginTop: 2 },
  timeLine: { width: 4, height: 44, borderRadius: 2 },
  taskContent: { flex: 1 },
  taskNameText: { color: Colors.text, fontSize: 15, fontWeight: '700' },
  taskNameDone: { textDecorationLine: 'line-through' as const, color: Colors.textMuted },
  taskMeta: { flexDirection: 'row', gap: 8, marginTop: 4 },
  categoryBadge: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase' as const, letterSpacing: 1 },
  doneLabel: { color: Colors.green, fontSize: 10, fontWeight: '700' },
  deleteBtn: { padding: 8 },
  deleteBtnText: { color: Colors.textMuted, fontSize: 18 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap' as const, gap: 8 },
  catBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: Colors.border },
  catBtnText: { fontSize: 12, fontWeight: '600' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10, marginBottom: 20 },
});
