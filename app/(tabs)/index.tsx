import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Colors, CATEGORY_COLORS, DEFAULT_HABITS, DEFAULT_GOALS } from '../../src/constants/theme';
import { TODAY, addDays, getDayType, getWeekStart, formatTime12, timeToMin, NOW_MINUTES, clamp } from '../../src/utils/helpers';
import { getData, setData } from '../../src/utils/storage';
import { getWeeklyAggregates, WeeklyStats } from '../../src/utils/aggregates';
import { Card } from '../../src/components/Card';
import { ProgressBar } from '../../src/components/ProgressBar';

export default function DashboardScreen() {
  const router = useRouter();
  const [greeting, setGreeting] = useState('');
  const [streak, setStreak] = useState(0);
  const [habits, setHabits] = useState<string[]>([]);
  const [habitData, setHabitData] = useState<Record<string, boolean>>({});
  const [water, setWater] = useState(0);
  const [cigs, setCigs] = useState(0);
  const [cigTimer, setCigTimer] = useState('');
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [goals, setGoals] = useState<any>(DEFAULT_GOALS);
  const [tasks, setTasks] = useState<any[]>([]);
  const [completion, setCompletion] = useState<Record<string, any>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(0);

  const loadData = useCallback(async () => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening');

    const lastActive = await getData<string>('lastActiveDate', '');
    let s = await getData<number>('currentStreak', 0);
    if (lastActive !== TODAY()) {
      const yesterday = addDays(TODAY(), -1);
      s = lastActive === yesterday ? s + 1 : 1;
      await setData('lastActiveDate', TODAY());
      await setData('currentStreak', s);
    }
    setStreak(Math.max(1, s));

    const dayType = getDayType(TODAY());
    const t = await getData<any[]>('schedule_' + dayType, []);
    const comp = await getData<Record<string, any>>('scheduleCompletion_' + TODAY(), {});
    setTasks(t);
    setCompletion(comp);

    const hList = await getData<string[]>('habits', DEFAULT_HABITS);
    const hData = await getData<Record<string, boolean>>('habitData_' + TODAY(), {});
    setHabits(hList);
    setHabitData(hData);

    setWater(await getData<number>('water_' + TODAY(), 0));
    const cigLog = await getData<any[]>('cigLog_' + TODAY(), []);
    setCigs(cigLog.length);
    if (cigLog.length) {
      const last = new Date(cigLog[cigLog.length - 1].time);
      const mins = Math.floor((Date.now() - last.getTime()) / 60000);
      setCigTimer(`${Math.floor(mins / 60)}h ${mins % 60}m since last`);
    } else { setCigTimer(''); }

    const ws = getWeekStart(TODAY());
    setStats(await getWeeklyAggregates(ws));
    setGoals(await getData('goals', DEFAULT_GOALS));
    setPomodoroCount(await getData<number>('pomodoro_' + TODAY(), 0));
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const toggleHabit = async (h: string) => {
    const newData = { ...habitData, [h]: !habitData[h] };
    setHabitData(newData);
    await setData('habitData_' + TODAY(), newData);
  };

  const adjustWater = async (d: number) => {
    const newVal = Math.max(0, water + d);
    setWater(newVal);
    await setData('water_' + TODAY(), newVal);
    const hist = await getData<Record<string, number>>('waterHistory', {});
    hist[TODAY()] = newVal;
    await setData('waterHistory', hist);
  };

  const adjustCigs = async (d: number) => {
    const log = await getData<any[]>('cigLog_' + TODAY(), []);
    if (d > 0) {
      log.push({ time: new Date().toISOString() });
    } else if (d < 0 && log.length > 0) {
      log.pop();
    }
    await setData('cigLog_' + TODAY(), log);
    setCigs(log.length);
    if (log.length) {
      const last = new Date(log[log.length - 1].time);
      const mins = Math.floor((Date.now() - last.getTime()) / 60000);
      setCigTimer(`${Math.floor(mins / 60)}h ${mins % 60}m since last`);
    } else { setCigTimer(''); }
  };

  const toggleTask = async (id: string) => {
    const comp = { ...completion };
    if (comp[id]) delete comp[id]; else comp[id] = { doneAt: new Date().toISOString() };
    setCompletion(comp);
    await setData('scheduleCompletion_' + TODAY(), comp);
  };

  const nowMin = NOW_MINUTES();
  const habitDone = habits.filter(h => habitData[h]).length;
  const habitPct = habits.length ? Math.round((habitDone / habits.length) * 100) : 0;
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => completion[t.id]).length;
  const schedPct = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const goalItems = stats ? [
    { label: 'Gym Sessions', actual: stats.gymCount, target: goals.weeklyGym || 5, color: Colors.green },
    { label: 'Study Hours', actual: stats.studyHours, target: goals.weeklyStudyHours || 10, color: Colors.orange },
    { label: 'Cigarettes', actual: stats.totalCigs, target: goals.weeklyCigLimit || 5, color: Colors.red, invert: true },
    { label: 'Water', actual: stats.totalWater, target: goals.weeklyWater || 56, color: Colors.accentLight },
    { label: 'Avg Sleep', actual: stats.avgSleep, target: goals.weeklySleepAvg || 7.25, color: Colors.purple },
    { label: 'Skill Hours', actual: stats.skillHours, target: goals.weeklySkillHours || 8, color: Colors.yellow },
  ] : [];

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}>
      {/* Greeting */}
      <View style={styles.greetingBar}>
        <Text style={{ color: Colors.textMuted, fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>Overview</Text>
        <View style={styles.greetingRow}>
          <Text style={styles.greetingText}>{greeting}</Text>
          <View style={styles.streakBadge}>
            <Text style={{ color: Colors.accent, fontSize: 13 }}>🔥</Text>
            <Text style={styles.streakText}>{streak} day streak</Text>
          </View>
        </View>
      </View>

      {/* Today's Schedule — always visible full timeline */}
      <Card title="Today's Schedule" badge={`${schedPct}%`}>
        {tasks.length === 0 ? (
          <Text style={styles.emptyText}>No tasks — set up your schedule in the Schedule tab</Text>
        ) : tasks.map(t => {
          const sMin = timeToMin(t.start), eMin = timeToMin(t.end);
          const done = !!completion[t.id];
          const isActive = nowMin >= sMin && nowMin < eMin && !done;
          return (
            <TouchableOpacity key={t.id} style={[styles.taskRow, isActive && styles.taskRowActive, done && styles.taskRowDone]} onPress={() => toggleTask(t.id)}>
              <View style={[styles.taskDot, { backgroundColor: done ? Colors.textMuted : (CATEGORY_COLORS[t.category] || Colors.accent) }]} />
              <View style={styles.taskInfo}>
                <Text style={[styles.taskName, done && styles.taskNameDone]}>{t.name}</Text>
                <Text style={styles.taskTime}>{formatTime12(t.start)} – {formatTime12(t.end)}</Text>
              </View>
              {isActive && <Text style={styles.nowBadge}>NOW</Text>}
              {done && <Text style={styles.doneMark}>✓</Text>}
            </TouchableOpacity>
          );
        })}
        <View style={{ marginTop: 10 }}><ProgressBar progress={schedPct} color={Colors.accent} /></View>
      </Card>

      {/* Daily Habits */}
      <Card title="Daily Habits" badge={`${habitPct}%`}>
        {habits.map(h => (
          <TouchableOpacity key={h} style={styles.habitItem} onPress={() => toggleHabit(h)}>
            <View style={[styles.checkbox, habitData[h] && styles.checkboxChecked]}>
              {habitData[h] && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={[styles.habitText, habitData[h] && styles.habitDone]}>{h}</Text>
          </TouchableOpacity>
        ))}
      </Card>

      {/* Quick Tracking */}
      <Card title="Quick Tracking">
        {/* Water */}
        <View style={[styles.trackerRow, { backgroundColor: Colors.surface, borderRadius: 14, paddingHorizontal: 14, marginBottom: 8 }]}>
          <View>
            <Text style={{ color: Colors.textMuted, fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>Water Intake</Text>
            <Text style={styles.trackerVal}>{water} <Text style={{ color: Colors.textMuted, fontSize: 13, fontWeight: '400' }}>/ 8</Text></Text>
          </View>
          <TouchableOpacity style={[styles.trackerBtn, { backgroundColor: Colors.accentBg }]} onPress={() => adjustWater(1)}>
            <Text style={[styles.trackerBtnText, { color: Colors.accentLight }]}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Cigarettes */}
        <View style={[styles.trackerRow, { backgroundColor: Colors.surface, borderRadius: 14, paddingHorizontal: 14, marginBottom: 8 }]}>
          <View>
            <Text style={{ color: Colors.textMuted, fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>Cigarettes</Text>
            <Text style={[styles.trackerVal, { color: cigs > 0 ? Colors.red : Colors.green }]}>{cigs} <Text style={{ color: Colors.textMuted, fontSize: 13, fontWeight: '400' }}>today</Text></Text>
            {cigTimer ? <Text style={styles.cigTimer}>{cigTimer}</Text> : null}
          </View>
          <TouchableOpacity style={[styles.trackerBtn, { backgroundColor: Colors.redBg }]} onPress={() => adjustCigs(1)}>
            <Text style={[styles.trackerBtnText, { color: Colors.red }]}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Pomodoros */}
        <View style={[styles.trackerRow, { backgroundColor: Colors.surface, borderRadius: 14, paddingHorizontal: 14 }]}>
          <View>
            <Text style={{ color: Colors.textMuted, fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>Pomodoros</Text>
            <Text style={[styles.trackerVal, { color: Colors.orange }]}>{pomodoroCount} <Text style={{ color: Colors.textMuted, fontSize: 13, fontWeight: '400' }}>today</Text></Text>
          </View>
          <TouchableOpacity style={[styles.trackerBtn, { backgroundColor: Colors.accentBg }]} onPress={() => router.push('/timer')}>
            <Text style={[styles.trackerBtnText, { color: Colors.accentLight, fontSize: 12 }]}>START SESSION</Text>
          </TouchableOpacity>
        </View>
      </Card>

      {/* Weekly Goals */}
      {stats && (
        <Card title="Weekly Goals">
          <View style={styles.goalGrid}>
            {goalItems.map(g => {
              const pct = g.invert
                ? (g.target > 0 ? clamp((1 - g.actual / g.target) * 100, 0, 100) : 100)
                : (g.target > 0 ? clamp((g.actual / g.target) * 100, 0, 100) : 0);
              const display = typeof g.actual === 'number' ? (Number.isInteger(g.actual) ? String(g.actual) : g.actual.toFixed(1)) : String(g.actual);
              return (
                <View key={g.label} style={styles.goalItem}>
                  <Text style={styles.goalLabel}>{g.label}</Text>
                  <Text style={[styles.goalVal, { color: g.color }]}>{display}</Text>
                  <View style={{ marginTop: 8 }}><ProgressBar progress={pct} color={g.color} height={2} /></View>
                  <Text style={styles.goalTarget}>{g.invert ? 'limit' : 'target'}: {g.target}</Text>
                </View>
              );
            })}
          </View>
        </Card>
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: 14, paddingTop: 8 },
  greetingBar: { backgroundColor: Colors.card, borderRadius: 20, padding: 20, marginBottom: 12 },
  greetingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greetingText: { color: Colors.text, fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  streakBadge: { backgroundColor: Colors.accentBg, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 4 },
  streakText: { color: Colors.accentLight, fontSize: 12, fontWeight: '700' },
  emptyText: { color: Colors.textMuted, fontSize: 13, textAlign: 'center', paddingVertical: 16 },
  taskRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12, marginBottom: 4 },
  taskRowActive: { backgroundColor: Colors.accentBg, borderRadius: 12, marginHorizontal: -8, paddingHorizontal: 8, borderLeftWidth: 3, borderLeftColor: Colors.accent },
  taskRowDone: { opacity: 0.4 },
  taskDot: { width: 4, height: 40, borderRadius: 2 },
  taskInfo: { flex: 1 },
  taskName: { color: Colors.text, fontSize: 15, fontWeight: '700' },
  taskNameDone: { textDecorationLine: 'line-through', color: Colors.textMuted },
  taskTime: { color: Colors.textMuted, fontSize: 10, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  nowBadge: { backgroundColor: Colors.accentBg, color: Colors.accentLight, fontSize: 9, fontWeight: '800', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, overflow: 'hidden', letterSpacing: 0.5 },
  doneMark: { color: Colors.green, fontSize: 15, fontWeight: '700' },
  habitItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  checkbox: { width: 24, height: 24, borderRadius: 8, borderWidth: 1.5, borderColor: Colors.borderHover, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  checkmark: { color: '#fff', fontSize: 12, fontWeight: '800' },
  habitText: { color: Colors.text, fontSize: 14, fontWeight: '500' },
  habitDone: { color: Colors.textMuted, textDecorationLine: 'line-through' },
  trackerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, marginBottom: 4 },
  trackerLabel: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  trackerControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  trackerBtn: { backgroundColor: Colors.surface, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
  trackerBtnText: { color: Colors.text, fontSize: 15, fontWeight: '700' },
  trackerVal: { color: Colors.text, fontSize: 20, fontWeight: '800', minWidth: 40, textAlign: 'center' },
  cigTimer: { color: Colors.textMuted, fontSize: 10, marginTop: 2 },
  goalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  goalItem: { width: '47%', backgroundColor: Colors.surfaceHighest, borderRadius: 14, padding: 12, marginBottom: 4 },
  goalVal: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  goalLabel: { color: Colors.textMuted, fontSize: 9, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 },
  goalTarget: { color: Colors.textMuted, fontSize: 9, marginTop: 6 },
});
