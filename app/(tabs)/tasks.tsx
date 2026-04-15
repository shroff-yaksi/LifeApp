import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, RefreshControl, TextInput } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Colors, DEFAULT_HABITS, CATEGORY_COLORS, TAB_COLORS } from '../../src/constants/theme';
import { TODAY, getDayType, formatTime12, timeToMin, NOW_MINUTES, uid, addDays, getWeekStart } from '../../src/utils/helpers';
import { getData, setData } from '../../src/utils/storage';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { ModalSheet } from '../../src/components/ModalSheet';
import { FormField } from '../../src/components/FormField';

const C = TAB_COLORS.tasks; // blue
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

type ScheduleTask = { id: string; name: string; start: string; end: string; category: string };
type ManualTask = { id: string; name: string; done: boolean; createdAt: string };

export default function TasksScreen() {
  // Habits
  const [habits, setHabits] = useState<string[]>([]);
  const [habitData, setHabitData] = useState<Record<string, boolean>>({});

  // Fixed schedule
  const [scheduleTasks, setScheduleTasks] = useState<ScheduleTask[]>([]);
  const [completion, setCompletion] = useState<Record<string, any>>({});

  // Catchup (Sunday leftover)
  const [catchupItems, setCatchupItems] = useState<{ date: string; task: ScheduleTask }[]>([]);

  // Manual tasks
  const [manualTasks, setManualTasks] = useState<ManualTask[]>([]);
  const [newTaskText, setNewTaskText] = useState('');

  // Schedule task modal
  const [schedModal, setSchedModal] = useState(false);
  const [editId, setEditId] = useState('');
  const [taskName, setTaskName] = useState('');
  const [taskStart, setTaskStart] = useState('');
  const [taskEnd, setTaskEnd] = useState('');
  const [taskCategory, setTaskCategory] = useState('work');

  const [refreshing, setRefreshing] = useState(false);

  const todayType = getDayType(TODAY());
  const now = new Date();
  const dayName = DAY_NAMES[now.getDay()];
  const fullDate = `${MONTH_NAMES[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;

  const loadData = useCallback(async () => {
    // Habits
    const hList = await getData<string[]>('habits', DEFAULT_HABITS);
    const hData = await getData<Record<string, boolean>>('habitData_' + TODAY(), {});
    setHabits(hList);
    setHabitData(hData);

    // Fixed schedule tasks for today
    const t = await getData<ScheduleTask[]>('schedule_' + todayType, []);
    setScheduleTasks(t);
    setCompletion(await getData<Record<string, any>>('scheduleCompletion_' + TODAY(), {}));

    // Manual tasks for today
    setManualTasks(await getData<ManualTask[]>('manualTasks_' + TODAY(), []));
  }, [todayType]);

  const loadCatchup = useCallback(async () => {
    if (todayType !== 'sunday') { setCatchupItems([]); return; }
    const weekStart = getWeekStart(TODAY());
    const items: { date: string; task: ScheduleTask }[] = [];
    for (let i = 0; i < 6; i++) {
      const ds = addDays(weekStart, i);
      if (ds > TODAY()) break;
      const dt = getDayType(ds);
      const dayTasks = await getData<ScheduleTask[]>('schedule_' + dt, []);
      const comp = await getData<Record<string, any>>('scheduleCompletion_' + ds, {});
      dayTasks.forEach(t => {
        if (!comp[t.id] && t.category !== 'sleep' && t.category !== 'meal')
          items.push({ date: ds, task: t });
      });
    }
    setCatchupItems(items);
  }, [todayType]);

  useFocusEffect(useCallback(() => { loadData(); loadCatchup(); }, [loadData, loadCatchup]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadData(), loadCatchup()]);
    setRefreshing(false);
  }, [loadData, loadCatchup]);

  // ── Habits ──────────────────────────────────────────────────────
  const toggleHabit = async (h: string) => {
    const newData = { ...habitData, [h]: !habitData[h] };
    setHabitData(newData);
    await setData('habitData_' + TODAY(), newData);
  };

  // ── Schedule tasks ───────────────────────────────────────────────
  const toggleScheduleTask = async (id: string) => {
    const comp = { ...completion };
    if (comp[id]) delete comp[id]; else comp[id] = { doneAt: new Date().toISOString() };
    setCompletion(comp);
    await setData('scheduleCompletion_' + TODAY(), comp);
  };

  const openAddSchedule = () => {
    setEditId(''); setTaskName(''); setTaskStart(''); setTaskEnd(''); setTaskCategory('work');
    setSchedModal(true);
  };
  const openEditSchedule = (task: ScheduleTask) => {
    setEditId(task.id); setTaskName(task.name); setTaskStart(task.start);
    setTaskEnd(task.end); setTaskCategory(task.category); setSchedModal(true);
  };

  const saveScheduleTask = async () => {
    if (!taskName.trim()) { Alert.alert('Missing', 'Enter a task name.'); return; }
    if (!TIME_RE.test(taskStart)) { Alert.alert('Invalid', 'Start must be HH:MM.'); return; }
    if (!TIME_RE.test(taskEnd)) { Alert.alert('Invalid', 'End must be HH:MM.'); return; }
    if (timeToMin(taskEnd) <= timeToMin(taskStart)) { Alert.alert('Invalid', 'End must be after start.'); return; }
    const t = [...scheduleTasks];
    if (editId) {
      const idx = t.findIndex(x => x.id === editId);
      if (idx > -1) t[idx] = { ...t[idx], name: taskName.trim(), start: taskStart, end: taskEnd, category: taskCategory };
    } else {
      t.push({ id: uid(), name: taskName.trim(), start: taskStart, end: taskEnd, category: taskCategory });
    }
    t.sort((a, b) => a.start.localeCompare(b.start));
    setScheduleTasks(t);
    await setData('schedule_' + todayType, t);
    setSchedModal(false);
  };

  const deleteScheduleTask = (id: string, name: string) => {
    Alert.alert('Delete', `Remove "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const t = scheduleTasks.filter(x => x.id !== id);
        setScheduleTasks(t); await setData('schedule_' + todayType, t);
      }},
    ]);
  };

  // ── Manual tasks ─────────────────────────────────────────────────
  const addManualTask = async () => {
    const name = newTaskText.trim();
    if (!name) return;
    const task: ManualTask = { id: uid(), name, done: false, createdAt: new Date().toISOString() };
    const updated = [...manualTasks, task];
    setManualTasks(updated);
    await setData('manualTasks_' + TODAY(), updated);
    setNewTaskText('');
  };

  const toggleManualTask = async (id: string) => {
    const updated = manualTasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
    setManualTasks(updated);
    await setData('manualTasks_' + TODAY(), updated);
  };

  const deleteManualTask = (id: string) => {
    const updated = manualTasks.filter(t => t.id !== id);
    setManualTasks(updated);
    setData('manualTasks_' + TODAY(), updated);
  };

  // ── Derived ───────────────────────────────────────────────────────
  const nowMin = NOW_MINUTES();
  const habitDone = habits.filter(h => habitData[h]).length;
  const schedDone = scheduleTasks.filter(t => completion[t.id]).length;
  const manualDone = manualTasks.filter(t => t.done).length;
  const categories = ['fitness', 'work', 'learning', 'personal', 'meal', 'sleep', 'date', 'skill'];

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C} />}
    >
      {/* ── HEADER ───────────────────────────────────────────── */}
      <View style={styles.todayHeader}>
        <View>
          <Text style={styles.todayDay}>{dayName}</Text>
          <Text style={styles.todayDate}>{fullDate}</Text>
        </View>
        <View style={[styles.progressBadge, { borderColor: C + '50', backgroundColor: C + '12' }]}>
          <Text style={[styles.progressNum, { color: C }]}>{schedDone + manualDone}/{scheduleTasks.length + manualTasks.length}</Text>
          <Text style={styles.progressLabel}>tasks</Text>
        </View>
      </View>

      {/* ── DAILY HABITS ─────────────────────────────────────── */}
      <Card
        title="Daily Habits"
        badge={`${habitDone}/${habits.length}`}
        badgeColor={Colors.green}
        accentColor={Colors.green}
      >
        {habits.map(h => {
          const done = !!habitData[h];
          return (
            <TouchableOpacity key={h} style={styles.habitRow} onPress={() => toggleHabit(h)} activeOpacity={0.7}>
              <View style={[styles.habitCheck, done && { backgroundColor: Colors.green, borderColor: Colors.green }]}>
                {done && <Text style={styles.habitCheckMark}>✓</Text>}
              </View>
              <Text style={[styles.habitName, done && { color: Colors.green, textDecorationLine: 'line-through' }]}>{h}</Text>
            </TouchableOpacity>
          );
        })}
      </Card>

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

      {/* ── FIXED DAILY SCHEDULE ─────────────────────────────── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Fixed Schedule</Text>
        <Button title="+ Add" size="sm" color={C} onPress={openAddSchedule} />
      </View>

      {scheduleTasks.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyText}>No scheduled tasks</Text>
          <Text style={styles.emptySubtext}>Tap + Add to build your {dayName} routine</Text>
        </View>
      ) : scheduleTasks.map(t => {
        const sMin = timeToMin(t.start), eMin = timeToMin(t.end);
        const done = !!completion[t.id];
        const isActive = nowMin >= sMin && nowMin < eMin && !done;
        const col = CATEGORY_COLORS[t.category] || C;
        return (
          <TouchableOpacity
            key={t.id}
            style={[styles.taskItem, { borderLeftColor: done ? Colors.surfaceHighest : col }, isActive && { backgroundColor: col + '10' }]}
            onPress={() => toggleScheduleTask(t.id)}
            onLongPress={() => openEditSchedule(t)}
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
            <TouchableOpacity onPress={() => deleteScheduleTask(t.id, t.name)} hitSlop={{ top: 8, bottom: 8, left: 12, right: 8 }}>
              <Text style={{ color: Colors.textMuted, fontSize: 14 }}>✕</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        );
      })}

      {/* ── MANUAL (AD-HOC) TASKS ────────────────────────────── */}
      <View style={[styles.sectionHeader, { marginTop: 8 }]}>
        <Text style={styles.sectionTitle}>Today's Tasks</Text>
        <Text style={styles.sectionBadge}>{manualDone}/{manualTasks.length}</Text>
      </View>

      {/* Quick add row */}
      <View style={styles.addRow}>
        <TextInput
          style={styles.addInput}
          value={newTaskText}
          onChangeText={setNewTaskText}
          placeholder="Add a task for today..."
          placeholderTextColor={Colors.textMuted}
          onSubmitEditing={addManualTask}
          returnKeyType="done"
        />
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: C }]} onPress={addManualTask}>
          <Text style={styles.addBtnTxt}>+</Text>
        </TouchableOpacity>
      </View>

      {manualTasks.length === 0 && (
        <Text style={styles.emptyInline}>No tasks yet — add something above</Text>
      )}
      {manualTasks.map(t => (
        <TouchableOpacity key={t.id} style={styles.manualItem} onPress={() => toggleManualTask(t.id)} activeOpacity={0.7}>
          <View style={[styles.taskCheck, t.done && { backgroundColor: C, borderColor: C }]}>
            {t.done && <Text style={styles.taskCheckMark}>✓</Text>}
          </View>
          <Text style={[styles.manualName, t.done && { textDecorationLine: 'line-through', color: Colors.textMuted }]}>{t.name}</Text>
          <TouchableOpacity onPress={() => deleteManualTask(t.id)} hitSlop={{ top: 8, bottom: 8, left: 12, right: 8 }}>
            <Text style={{ color: Colors.textMuted, fontSize: 14 }}>✕</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      ))}

      {/* ── SCHEDULE TASK MODAL ───────────────────────────────── */}
      <ModalSheet visible={schedModal} onClose={() => setSchedModal(false)} title={editId ? 'Edit Task' : 'Add Scheduled Task'} accentColor={C}>
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
                  <Text style={[styles.catBtnTxt, { color: taskCategory === c ? col : Colors.textSecondary }]}>{c}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </FormField>
        <View style={styles.modalActions}>
          <Button title="Cancel" variant="outline" onPress={() => setSchedModal(false)} />
          <Button title={editId ? 'Update' : 'Add Task'} onPress={saveScheduleTask} color={C} />
        </View>
      </ModalSheet>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: 14, paddingTop: 12 },

  todayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingHorizontal: 2 },
  todayDay: { color: Colors.text, fontSize: 28, fontWeight: '800', letterSpacing: -1 },
  todayDate: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  progressBadge: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, borderWidth: 1, alignItems: 'center' },
  progressNum: { fontSize: 20, fontWeight: '800', lineHeight: 24 },
  progressLabel: { color: Colors.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },

  habitRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, gap: 12 },
  habitCheck: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  habitCheckMark: { color: '#fff', fontSize: 12, fontWeight: '800' },
  habitName: { flex: 1, color: Colors.text, fontSize: 14, fontWeight: '600' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, marginTop: 4 },
  sectionTitle: { color: Colors.textMuted, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' as const, letterSpacing: 0.8 },
  sectionBadge: { color: Colors.textMuted, fontSize: 11, fontWeight: '700' },

  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 36, marginBottom: 10 },
  emptyText: { color: Colors.text, fontSize: 15, fontWeight: '700', marginBottom: 4 },
  emptySubtext: { color: Colors.textMuted, fontSize: 12, textAlign: 'center' },
  emptyInline: { color: Colors.textMuted, fontSize: 13, textAlign: 'center', paddingVertical: 16 },

  taskItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.card, borderRadius: 16,
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

  addRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  addInput: { flex: 1, backgroundColor: Colors.card, borderRadius: 14, color: Colors.text, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, borderWidth: 1, borderColor: Colors.border },
  addBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  addBtnTxt: { color: '#fff', fontSize: 22, fontWeight: '700', lineHeight: 26 },

  manualItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    marginBottom: 8, borderWidth: 1, borderColor: Colors.border,
  },
  manualName: { flex: 1, color: Colors.text, fontSize: 14, fontWeight: '600' },

  catGrid: { flexDirection: 'row', flexWrap: 'wrap' as const, gap: 8 },
  catBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surfaceHigh },
  catBtnTxt: { fontSize: 12, fontWeight: '600' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10, marginBottom: 20 },
});
