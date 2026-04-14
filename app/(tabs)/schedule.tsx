import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Colors, CATEGORY_COLORS, TAB_COLORS } from '../../src/constants/theme';
import { TODAY, getDayType, formatTime12, timeToMin, NOW_MINUTES, uid, getWeekStart, addDays } from '../../src/utils/helpers';
import { getData, setData } from '../../src/utils/storage';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { ModalSheet } from '../../src/components/ModalSheet';
import { FormField } from '../../src/components/FormField';

const C = TAB_COLORS.schedule;
type Task = { id: string; name: string; start: string; end: string; category: string };
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function ScheduleScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completion, setCompletion] = useState<Record<string, any>>({});
  const [catchupItems, setCatchupItems] = useState<{ date: string; task: Task }[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState('');
  const [taskName, setTaskName] = useState('');
  const [taskStart, setTaskStart] = useState('');
  const [taskEnd, setTaskEnd] = useState('');
  const [taskCategory, setTaskCategory] = useState('work');

  const todayType = getDayType(TODAY());
  const now = new Date();
  const dayName = DAY_NAMES[now.getDay()];
  const fullDate = `${MONTH_NAMES[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;

  const loadData = useCallback(async () => {
    const t = await getData<Task[]>('schedule_' + todayType, []);
    setTasks(t);
    setCompletion(await getData<Record<string, any>>('scheduleCompletion_' + TODAY(), {}));
  }, [todayType]);

  const loadCatchup = useCallback(async () => {
    if (todayType !== 'sunday') { setCatchupItems([]); return; }
    const weekStart = getWeekStart(TODAY());
    const items: { date: string; task: Task }[] = [];
    for (let i = 0; i < 6; i++) {
      const ds = addDays(weekStart, i);
      if (ds > TODAY()) break;
      const dt = getDayType(ds);
      const dayTasks = await getData<Task[]>('schedule_' + dt, []);
      const comp = await getData<Record<string, any>>('scheduleCompletion_' + ds, {});
      dayTasks.forEach(t => {
        if (!comp[t.id] && t.category !== 'sleep' && t.category !== 'meal')
          items.push({ date: ds, task: t });
      });
    }
    setCatchupItems(items);
  }, [todayType]);

  useFocusEffect(useCallback(() => { loadData(); loadCatchup(); }, [loadData, loadCatchup]));

  const onRefresh = useCallback(async () => { setRefreshing(true); await Promise.all([loadData(), loadCatchup()]); setRefreshing(false); }, [loadData, loadCatchup]);

  const toggleDone = async (id: string) => {
    const comp = { ...completion };
    if (comp[id]) delete comp[id]; else comp[id] = { doneAt: new Date().toISOString() };
    setCompletion(comp);
    await setData('scheduleCompletion_' + TODAY(), comp);
  };

  const openAdd = () => { setEditId(''); setTaskName(''); setTaskStart(''); setTaskEnd(''); setTaskCategory('work'); setModalOpen(true); };
  const openEdit = (task: Task) => { setEditId(task.id); setTaskName(task.name); setTaskStart(task.start); setTaskEnd(task.end); setTaskCategory(task.category); setModalOpen(true); };

  const saveTask = async () => {
    if (!taskName.trim()) { Alert.alert('Missing', 'Enter a task name.'); return; }
    if (!TIME_RE.test(taskStart)) { Alert.alert('Invalid', 'Start must be HH:MM.'); return; }
    if (!TIME_RE.test(taskEnd)) { Alert.alert('Invalid', 'End must be HH:MM.'); return; }
    if (timeToMin(taskEnd) <= timeToMin(taskStart)) { Alert.alert('Invalid', 'End must be after start.'); return; }
    const t = [...tasks];
    if (editId) {
      const idx = t.findIndex(x => x.id === editId);
      if (idx > -1) t[idx] = { ...t[idx], name: taskName.trim(), start: taskStart, end: taskEnd, category: taskCategory };
    } else {
      t.push({ id: uid(), name: taskName.trim(), start: taskStart, end: taskEnd, category: taskCategory });
    }
    t.sort((a, b) => a.start.localeCompare(b.start));
    setTasks(t); await setData('schedule_' + todayType, t); setModalOpen(false);
  };

  const deleteTask = (id: string, name: string) => {
    Alert.alert('Delete', `Remove "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const t = tasks.filter(x => x.id !== id);
        setTasks(t); await setData('schedule_' + todayType, t);
      }},
    ]);
  };

  const nowMin = NOW_MINUTES();
  const doneTasks = tasks.filter(t => completion[t.id]).length;
  const categories = ['fitness', 'work', 'learning', 'personal', 'meal', 'sleep', 'date', 'skill'];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C} />}>

      {/* ── TODAY HEADER ─────────────────────────────────────── */}
      <View style={styles.todayHeader}>
        <View>
          <Text style={styles.todayDay}>{dayName}</Text>
          <Text style={styles.todayDate}>{fullDate}</Text>
        </View>
        <View style={[styles.progressBadge, { borderColor: C + '50', backgroundColor: C + '12' }]}>
          <Text style={[styles.progressNum, { color: C }]}>{doneTasks}/{tasks.length}</Text>
          <Text style={styles.progressLabel}>done</Text>
        </View>
      </View>

      {/* ── SUNDAY CATCHUP ───────────────────────────────────── */}
      {catchupItems.length > 0 && (
        <Card title="Week's Leftover" badge={`${catchupItems.length}`} badgeColor={Colors.orange} accentColor={Colors.orange}>
          {catchupItems.map((item, i) => {
            const col = CATEGORY_COLORS[item.task.category] || C;
            return (
              <View key={i} style={styles.catchupItem}>
                <View style={[styles.catchupDot, { backgroundColor: col }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.catchupName}>{item.task.name}</Text>
                  <Text style={styles.catchupMeta}>{item.date}  ·  {formatTime12(item.task.start)}–{formatTime12(item.task.end)}</Text>
                </View>
                <View style={[styles.catChip, { backgroundColor: col + '20' }]}>
                  <Text style={[styles.catChipTxt, { color: col }]}>{item.task.category}</Text>
                </View>
              </View>
            );
          })}
        </Card>
      )}

      {/* ── TASKS ────────────────────────────────────────────── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Today's Tasks</Text>
        <Button title="+ Add" size="sm" color={C} onPress={openAdd} />
      </View>

      {tasks.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyText}>No tasks for today</Text>
          <Text style={styles.emptySubtext}>Tap + Add to plan your {dayName}</Text>
        </View>
      ) : tasks.map(t => {
        const sMin = timeToMin(t.start), eMin = timeToMin(t.end);
        const done = !!completion[t.id];
        const isActive = nowMin >= sMin && nowMin < eMin && !done;
        const col = CATEGORY_COLORS[t.category] || C;
        return (
          <TouchableOpacity
            key={t.id}
            style={[styles.taskItem, { borderLeftColor: done ? Colors.surfaceHighest : col }, isActive && { backgroundColor: col + '10' }]}
            onPress={() => toggleDone(t.id)}
            onLongPress={() => openEdit(t)}
            activeOpacity={0.8}
          >
            <View style={[styles.taskCheck, done && { backgroundColor: col, borderColor: col }]}>
              {done && <Text style={styles.taskCheckMark}>✓</Text>}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.taskName, done && styles.taskNameDone]}>{t.name}</Text>
              <Text style={styles.taskTime}>{formatTime12(t.start)} – {formatTime12(t.end)}</Text>
            </View>
            {isActive && (
              <View style={[styles.nowPill, { backgroundColor: col + '25', borderColor: col + '50' }]}>
                <Text style={[styles.nowTxt, { color: col }]}>NOW</Text>
              </View>
            )}
            <View style={[styles.catChip, { backgroundColor: col + '20' }]}>
              <Text style={[styles.catChipTxt, { color: col }]}>{t.category}</Text>
            </View>
            <TouchableOpacity onPress={() => deleteTask(t.id, t.name)} hitSlop={{ top: 8, bottom: 8, left: 12, right: 8 }}>
              <Text style={{ color: Colors.textMuted, fontSize: 14 }}>✕</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        );
      })}

      {/* ── MODAL ────────────────────────────────────────────── */}
      <ModalSheet visible={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Edit Task' : 'Add Task'} accentColor={C}>
        <FormField label="Task Name" value={taskName} onChangeText={setTaskName} placeholder="e.g. Morning workout" />
        <FormField label="Start Time (HH:MM)" value={taskStart} onChangeText={setTaskStart} placeholder="09:00" keyboardType="numbers-and-punctuation" />
        <FormField label="End Time (HH:MM)" value={taskEnd} onChangeText={setTaskEnd} placeholder="10:00" keyboardType="numbers-and-punctuation" />
        <FormField label="Category">
          <View style={styles.catGrid}>
            {categories.map(c => {
              const col = CATEGORY_COLORS[c] || C;
              return (
                <TouchableOpacity key={c} style={[styles.catBtn, taskCategory === c && { borderColor: col, backgroundColor: col + '20' }]} onPress={() => setTaskCategory(c)}>
                  <Text style={[styles.catBtnTxt, { color: taskCategory === c ? col : Colors.textSecondary }]}>{c}</Text>
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

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: 14, paddingTop: 12 },

  todayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingHorizontal: 2 },
  todayDay: { color: Colors.text, fontSize: 32, fontWeight: '800', letterSpacing: -1 },
  todayDate: { color: Colors.textMuted, fontSize: 13, marginTop: 4 },
  progressBadge: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 18, borderWidth: 1, alignItems: 'center' },
  progressNum: { fontSize: 24, fontWeight: '800', lineHeight: 28 },
  progressLabel: { color: Colors.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { color: Colors.textMuted, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' as const, letterSpacing: 0.8 },

  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 44, marginBottom: 14 },
  emptyText: { color: Colors.text, fontSize: 17, fontWeight: '700', marginBottom: 6 },
  emptySubtext: { color: Colors.textMuted, fontSize: 13, textAlign: 'center' },

  taskItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.card, borderRadius: 18,
    padding: 14, marginBottom: 8, gap: 12, borderLeftWidth: 3,
    borderWidth: 1, borderColor: Colors.border,
  },
  taskCheck: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  taskCheckMark: { color: '#fff', fontSize: 12, fontWeight: '800' },
  taskName: { color: Colors.text, fontSize: 14, fontWeight: '700' },
  taskNameDone: { textDecorationLine: 'line-through' as const, color: Colors.textMuted },
  taskTime: { color: Colors.textMuted, fontSize: 11, marginTop: 3 },
  nowPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  nowTxt: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  catChip: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 9 },
  catChipTxt: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase' as const, letterSpacing: 0.5 },

  catchupItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11, backgroundColor: Colors.surface, borderRadius: 14, paddingHorizontal: 12, marginBottom: 6, borderWidth: 1, borderColor: Colors.border },
  catchupDot: { width: 8, height: 8, borderRadius: 4 },
  catchupName: { color: Colors.text, fontSize: 13, fontWeight: '600' },
  catchupMeta: { color: Colors.textMuted, fontSize: 10, marginTop: 2 },

  catGrid: { flexDirection: 'row', flexWrap: 'wrap' as const, gap: 8 },
  catBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surfaceHigh },
  catBtnTxt: { fontSize: 12, fontWeight: '600' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10, marginBottom: 20 },
});
