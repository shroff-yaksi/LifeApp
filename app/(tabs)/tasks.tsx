import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, RefreshControl, TextInput } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Colors, DEFAULT_HABITS, CATEGORY_COLORS, TAB_COLORS, TAB_PALETTE, radius } from '../../src/constants/theme';
import { TODAY, getDayKey, formatTime12, timeToMin, NOW_MINUTES, uid, addDays } from '../../src/utils/helpers';
import { getData, setData } from '../../src/utils/storage';
import { getBacklogItems } from '../../src/utils/aggregates';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { ModalSheet } from '../../src/components/ModalSheet';
import { FormField } from '../../src/components/FormField';
import { TimeField } from '../../src/components/TimeField';

const C = TAB_COLORS.tasks; // muted blue
const P = TAB_PALETTE.tasks;
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

type ScheduleTask = { id: string; name: string; start: string; end: string; category: string };
type ManualTask = { id: string; name: string; done: boolean; createdAt: string };
type BacklogItem = { date: string; taskId: string; name: string; category: string; start: string; end: string };

// Small uppercase section label with a 3px accent bar (redesign v1 §.sect).
function SectionHeader({ label, right }: { label: string; right?: React.ReactNode }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleRow}>
        <View style={styles.sectionBar} />
        <Text style={styles.sectionTitle}>{label}</Text>
      </View>
      {right}
    </View>
  );
}

export default function TasksScreen() {
  // Habits
  const [habits, setHabits] = useState<string[]>([]);
  const [habitData, setHabitData] = useState<Record<string, boolean>>({});

  // Fixed schedule
  const [scheduleTasks, setScheduleTasks] = useState<ScheduleTask[]>([]);
  const [completion, setCompletion] = useState<Record<string, any>>({});
  const [skipped, setSkipped] = useState<string[]>([]); // task ids skipped for today (scheduleOverride)

  // Backlog / catchup — incomplete, non-skipped schedule tasks from the past 7 days
  const [catchupItems, setCatchupItems] = useState<BacklogItem[]>([]);

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

  const todayKey = getDayKey(TODAY());
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
    const t = await getData<ScheduleTask[]>('schedule_' + todayKey, []);
    setScheduleTasks(t);
    setCompletion(await getData<Record<string, any>>('scheduleCompletion_' + TODAY(), {}));
    const ov = await getData<{ skipped?: string[] }>('scheduleOverride_' + TODAY(), {});
    setSkipped(ov.skipped || []);

    // Manual tasks for today
    setManualTasks(await getData<ManualTask[]>('manualTasks_' + TODAY(), []));
  }, [todayKey]);

  const loadCatchup = useCallback(async () => {
    setCatchupItems(await getBacklogItems());
  }, []);

  // Dismiss a leftover: skip it on its original date so it leaves the backlog for good
  const dismissBacklog = async (date: string, taskId: string) => {
    const ov = await getData<{ skipped?: string[] }>('scheduleOverride_' + date, {});
    const sk = new Set(ov.skipped || []);
    sk.add(taskId);
    await setData('scheduleOverride_' + date, { skipped: [...sk] });
    loadCatchup();
  };

  // Carry a leftover to tomorrow as a one-off manual task, then clear it from the backlog
  const carryBacklog = async (item: BacklogItem) => {
    const tomorrow = addDays(TODAY(), 1);
    const list = await getData<ManualTask[]>('manualTasks_' + tomorrow, []);
    await setData('manualTasks_' + tomorrow, [...list, { id: uid(), name: item.name, done: false, createdAt: new Date().toISOString() }]);
    await dismissBacklog(item.date, item.taskId);
  };

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

  const toggleSkip = async (id: string) => {
    const next = skipped.includes(id) ? skipped.filter(x => x !== id) : [...skipped, id];
    setSkipped(next);
    await setData('scheduleOverride_' + TODAY(), { skipped: next });
  };

  const openAddSchedule = () => {
    setEditId(''); setTaskName(''); setTaskStart('09:00'); setTaskEnd('10:00'); setTaskCategory('work');
    setSchedModal(true);
  };
  const openEditSchedule = (task: ScheduleTask) => {
    setEditId(task.id); setTaskName(task.name); setTaskStart(task.start);
    setTaskEnd(task.end); setTaskCategory(task.category); setSchedModal(true);
  };

  const saveScheduleTask = async () => {
    if (!taskName.trim()) { Alert.alert('Missing', 'Enter a task name.'); return; }
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
    await setData('schedule_' + todayKey, t);
    setSchedModal(false);
  };

  const deleteScheduleTask = (id: string, name: string) => {
    Alert.alert('Delete', `Remove "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const t = scheduleTasks.filter(x => x.id !== id);
        setScheduleTasks(t); await setData('schedule_' + todayKey, t);
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
  const skipSet = new Set(skipped);
  const habitDone = habits.filter(h => habitData[h]).length;
  const habitPct = habits.length ? Math.round((habitDone / habits.length) * 100) : 0;
  const activeSched = scheduleTasks.filter(t => !skipSet.has(t.id)); // skipped tasks don't count today
  const schedDone = activeSched.filter(t => completion[t.id]).length;
  const manualDone = manualTasks.filter(t => t.done).length;
  const totalDone = schedDone + manualDone;
  const totalCount = activeSched.length + manualTasks.length;
  const categories = ['fitness', 'work', 'learning', 'personal', 'meal', 'sleep', 'date', 'skill'];

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C} />}
    >
      {/* Header */}
      <View style={styles.todayHeader}>
        <View>
          <Text style={styles.todayDay}>{dayName}</Text>
          <Text style={styles.todayDate}>{fullDate}</Text>
        </View>
        <View style={styles.progressBadge}>
          <Text style={styles.progressNum}>{totalDone}<Text style={styles.progressDen}>/{totalCount}</Text></Text>
          <Text style={styles.progressLabel}>DONE</Text>
        </View>
      </View>

      {/* ── DAILY HABITS ─────────────────────────────────────── */}
      <Card
        title="Daily Habits"
        badge={habitPct === 100 ? '✓ All done' : `${habitDone}/${habits.length}`}
        badgeColor={habitPct === 100 ? Colors.green : C}
        accentColor={C}
      >
        <View style={styles.habitsGrid}>
          {habits.map(h => {
            const done = !!habitData[h];
            return (
              <TouchableOpacity
                key={h}
                style={[styles.habitChip, done && { borderColor: P.border, backgroundColor: P.bgMid, borderTopColor: Colors.innerHighlight }]}
                onPress={() => toggleHabit(h)}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 11, color: done ? C : Colors.textMuted, lineHeight: 14 }}>{done ? '✓' : '○'}</Text>
                <Text style={[styles.habitChipTxt, { color: done ? P.text : Colors.textSecondary }]}>{h}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Card>

      {/* ── BACKLOG / CATCHUP (past 7 days, any day) ─────────── */}
      {catchupItems.length > 0 && (
        <Card title="Backlog" badge={`${catchupItems.length}`} badgeColor={C} accentColor={C}>
          {catchupItems.map((item, i) => {
            const col = CATEGORY_COLORS[item.category] || C;
            return (
              <View key={item.date + item.taskId + i} style={styles.catchupItem}>
                <View style={[styles.catchupDot, { backgroundColor: col }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.catchupName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.catchupMeta}>{item.date}  ·  {formatTime12(item.start)}–{formatTime12(item.end)}</Text>
                </View>
                <TouchableOpacity style={[styles.backlogAction, { borderColor: P.border, backgroundColor: P.bg }]} onPress={() => carryBacklog(item)} hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}>
                  <Text style={[styles.backlogActionTxt, { color: P.text }]}>Carry →</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.backlogAction} onPress={() => dismissBacklog(item.date, item.taskId)} hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}>
                  <Text style={[styles.backlogActionTxt, { color: Colors.textMuted }]}>Dismiss</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </Card>
      )}

      {/* ── FIXED DAILY SCHEDULE (timeline) ──────────────────── */}
      <Card
        title="Fixed Schedule"
        badge={activeSched.length ? `${schedDone}/${activeSched.length}` : undefined}
        badgeColor={C}
        accentColor={C}
        headerRight={<Button title="+ Add" size="sm" color={C} onPress={openAddSchedule} />}
      >
        {scheduleTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🗓️</Text>
            <Text style={styles.emptyText}>No scheduled tasks</Text>
            <Text style={styles.emptySubtext}>Tap + Add to build your {dayName} routine</Text>
          </View>
        ) : scheduleTasks.map((t, i) => {
          const sMin = timeToMin(t.start), eMin = timeToMin(t.end);
          const isSkipped = skipSet.has(t.id);
          const done = !isSkipped && !!completion[t.id];
          const isActive = nowMin >= sMin && nowMin < eMin && !done && !isSkipped;
          const dim = done || isSkipped;
          const col = CATEGORY_COLORS[t.category] || C;
          const last = i === scheduleTasks.length - 1;
          return (
            <TouchableOpacity
              key={t.id}
              style={[styles.seg, last && styles.segLast]}
              onPress={() => { if (!isSkipped) toggleScheduleTask(t.id); }}
              onLongPress={() => openEditSchedule(t)}
              activeOpacity={0.75}
            >
              {!last && <View style={styles.rail} />}
              <View style={[styles.dot, { backgroundColor: dim ? Colors.surfaceHighest : col }, isActive && { borderColor: col + '55' }]} />
              <View style={styles.segBody}>
                <View style={styles.segNameRow}>
                  <Text style={[styles.segName, dim && styles.segNameDone]} numberOfLines={1}>{t.name}</Text>
                  {isActive && (
                    <View style={styles.nowPill}><Text style={styles.nowTxt}>NOW</Text></View>
                  )}
                </View>
                <View style={styles.segMetaRow}>
                  <Text style={styles.segTime}>{formatTime12(t.start)} – {formatTime12(t.end)}</Text>
                  {isSkipped ? (
                    <View style={[styles.catChip, { backgroundColor: Colors.yellowBg }]}>
                      <Text style={[styles.catChipTxt, { color: Colors.yellow }]}>skipped</Text>
                    </View>
                  ) : (
                    <View style={[styles.catChip, { backgroundColor: col + '18' }]}>
                      <Text style={[styles.catChipTxt, { color: col }]}>{t.category}</Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={styles.segControls}>
                <TouchableOpacity onPress={() => toggleSkip(t.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 6 }}>
                  <Text style={[styles.ctrlIcon, isSkipped && { color: Colors.yellow }]}>{isSkipped ? '↺' : '⤫'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteScheduleTask(t.id, t.name)} hitSlop={{ top: 8, bottom: 8, left: 6, right: 8 }}>
                  <Text style={styles.ctrlIcon}>✕</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}
      </Card>

      {/* ── MANUAL (AD-HOC) TASKS ────────────────────────────── */}
      <SectionHeader label="Today's Tasks" right={<Text style={styles.sectionBadge}>{manualDone}/{manualTasks.length}</Text>} />

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
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: C }]} onPress={addManualTask} activeOpacity={0.8}>
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
            <Text style={styles.ctrlIcon}>✕</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      ))}

      {/* ── SCHEDULE TASK MODAL ───────────────────────────────── */}
      <ModalSheet visible={schedModal} onClose={() => setSchedModal(false)} title={editId ? 'Edit Task' : 'Add Scheduled Task'} accentColor={C}>
        <FormField label="Task Name" value={taskName} onChangeText={setTaskName} placeholder="e.g. Morning workout" />
        <TimeField label="Start Time" value={taskStart || '09:00'} onChange={setTaskStart} accentColor={C} />
        <TimeField label="End Time" value={taskEnd || '10:00'} onChange={setTaskEnd} accentColor={C} />
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
  todayDate: { color: Colors.textMuted, fontSize: 12, fontWeight: '500', marginTop: 3 },
  progressBadge: { paddingHorizontal: 15, paddingVertical: 9, borderRadius: radius.md, borderWidth: 1, borderColor: P.border, borderTopColor: Colors.innerHighlight, backgroundColor: P.bg, alignItems: 'center' },
  progressNum: { color: P.text, fontSize: 20, fontWeight: '800', lineHeight: 23 },
  progressDen: { color: Colors.textMuted, fontSize: 14, fontWeight: '700' },
  progressLabel: { color: Colors.textMuted, fontSize: 9, fontWeight: '800', letterSpacing: 1 },

  // Habit chips (mirrors the Today screen's grid)
  habitsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  habitChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.sm, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
  habitChipTxt: { fontSize: 12, fontWeight: '600' },

  // Section header — 3px accent bar + uppercase label
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, marginTop: 6, paddingHorizontal: 2 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionBar: { width: 3, height: 13, borderRadius: 2, backgroundColor: C },
  sectionTitle: { color: Colors.textSecondary, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' as const, letterSpacing: 0.8 },
  sectionBadge: { color: Colors.textMuted, fontSize: 11, fontWeight: '700' },

  emptyState: { alignItems: 'center', paddingVertical: 28 },
  emptyIcon: { fontSize: 32, marginBottom: 10 },
  emptyText: { color: Colors.text, fontSize: 15, fontWeight: '700', marginBottom: 4 },
  emptySubtext: { color: Colors.textMuted, fontSize: 12, textAlign: 'center' },
  emptyInline: { color: Colors.textMuted, fontSize: 13, textAlign: 'center', paddingVertical: 16 },

  // Schedule timeline segments (DayTimeline-adjacent)
  seg: { flexDirection: 'row', gap: 12, position: 'relative', paddingBottom: 15, alignItems: 'flex-start' },
  segLast: { paddingBottom: 2 },
  rail: { position: 'absolute', left: 5, top: 16, bottom: -2, width: 1.5, backgroundColor: Colors.borderHover },
  dot: { width: 12, height: 12, borderRadius: 6, marginTop: 3, borderWidth: 2.5, borderColor: Colors.card, zIndex: 1 },
  segBody: { flex: 1, minWidth: 0 },
  segNameRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  segName: { color: Colors.text, fontSize: 14, fontWeight: '700', flexShrink: 1 },
  segNameDone: { color: Colors.textMuted, textDecorationLine: 'line-through' as const },
  segMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  segTime: { color: Colors.textMuted, fontSize: 11.5, fontWeight: '500' },
  nowPill: { backgroundColor: Colors.accentChipBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
  nowTxt: { fontSize: 9.5, fontWeight: '800', letterSpacing: 0.5, color: Colors.accentLight },
  catChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.sm },
  catChipTxt: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  segControls: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 2 },
  ctrlIcon: { color: Colors.textMuted, fontSize: 14, fontWeight: '700' },

  // Backlog tiles
  catchupItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11, backgroundColor: Colors.surface, borderRadius: radius.md, paddingHorizontal: 12, marginBottom: 7, borderWidth: 1, borderColor: Colors.border, borderTopColor: Colors.innerHighlight },
  catchupDot: { width: 8, height: 8, borderRadius: 4 },
  catchupName: { color: Colors.text, fontSize: 13, fontWeight: '600' },
  catchupMeta: { color: Colors.textMuted, fontSize: 10, marginTop: 2 },
  backlogAction: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.sm, borderWidth: 1, borderColor: Colors.border },
  backlogActionTxt: { fontSize: 10, fontWeight: '700' },

  // Manual tasks
  addRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  addInput: { flex: 1, backgroundColor: Colors.card, borderRadius: radius.md, color: Colors.text, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, borderWidth: 1, borderColor: Colors.border, borderTopColor: Colors.innerHighlight },
  addBtn: { width: 46, height: 46, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  addBtnTxt: { color: '#fff', fontSize: 22, fontWeight: '700', lineHeight: 26 },
  manualItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.card, borderRadius: radius.md, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: Colors.border, borderTopColor: Colors.innerHighlight },
  manualName: { flex: 1, color: Colors.text, fontSize: 14, fontWeight: '600' },
  taskCheck: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  taskCheckMark: { color: '#fff', fontSize: 12, fontWeight: '800' },

  // Category picker (modal)
  catGrid: { flexDirection: 'row', flexWrap: 'wrap' as const, gap: 8 },
  catBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.sm, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surfaceHigh },
  catBtnTxt: { fontSize: 12, fontWeight: '600' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10, marginBottom: 20 },
});
