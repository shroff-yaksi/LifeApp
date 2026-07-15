import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Colors, CATEGORY_COLORS, DEFAULT_HABITS, DEFAULT_GOALS, TAB_COLORS, TAB_PALETTE, radius } from '../../src/constants/theme';
import { TODAY, addDays, getDayKey, getWeekStart, NOW_MINUTES, formatDayLine } from '../../src/utils/helpers';
import { getData, setData } from '../../src/utils/storage';
import { getBacklogItems, getWeeklyAggregates, WeeklyStats } from '../../src/utils/aggregates';
import { Card } from '../../src/components/Card';
import { RingStack } from '../../src/components/RingStack';
import { TodayHero, HeroMetric } from '../../src/components/TodayHero';
import { DayTimeline } from '../../src/components/DayTimeline';

const C = TAB_COLORS.index;
const P = TAB_PALETTE.index;

const MOODS = [
  { level: 1, emoji: '😞', label: 'Rough', color: Colors.ramp1 },
  { level: 2, emoji: '😕', label: 'Low', color: Colors.ramp2 },
  { level: 3, emoji: '😐', label: 'Okay', color: Colors.ramp3 },
  { level: 4, emoji: '🙂', label: 'Good', color: Colors.ramp4 },
  { level: 5, emoji: '😄', label: 'Great', color: Colors.ramp5 },
];

const SHORTCUTS = [
  { icon: '📓', label: 'Journal', route: '/(tabs)/journal' },
  { icon: '💰', label: 'Finance', route: '/(tabs)/finance' },
  { icon: '📊', label: 'Analytics', route: '/(tabs)/analytics' },
  { icon: '⏰', label: 'Alarms', route: '/(tabs)/alarms' },
];

const pctOf = (v: number, goal: number) => (goal > 0 ? Math.min(100, (v / goal) * 100) : 0);
const fmtMove = (m: number) => (m < 60 ? `${m}m` : `${Math.floor(m / 60)}h${m % 60 ? ' ' + (m % 60) + 'm' : ''}`);
const fmtFocus = (h: number) => (Number.isInteger(h) ? `${h}h` : `${h.toFixed(1)}h`);

// Compact weekly-goal ring (single RingStack + label) — replaces the old GoalRing.
function WeekRing({ pct, color, label }: { pct: number; color: string; label: string }) {
  return (
    <View style={styles.weekRing}>
      <RingStack size={58} width={5} rings={[{ pct, color }]}>
        <Text style={styles.weekRingPct}>{Math.round(pct)}%</Text>
      </RingStack>
      <Text style={styles.weekRingLabel}>{label}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const router = useRouter();

  const [greeting, setGreeting] = useState('');
  const [habits, setHabits] = useState<string[]>([]);
  const [habitData, setHabitData] = useState<Record<string, boolean>>({});
  const [water, setWater] = useState(0);
  const [cigs, setCigs] = useState(0);
  const [cigTimer, setCigTimer] = useState('');
  const [tasks, setTasks] = useState<any[]>([]);
  const [completion, setCompletion] = useState<Record<string, any>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [backlog, setBacklog] = useState<any[]>([]);
  const [weekly, setWeekly] = useState<WeeklyStats | null>(null);
  const [goals, setGoals] = useState(DEFAULT_GOALS);
  const [mood, setMood] = useState<number | undefined>(undefined);
  const [moveMin, setMoveMin] = useState(0);
  const [focusHours, setFocusHours] = useState(0);

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

    const dayKey = getDayKey(TODAY());
    const t = await getData<any[]>('schedule_' + dayKey, []);
    const comp = await getData<Record<string, any>>('scheduleCompletion_' + TODAY(), {});
    const ov = await getData<{ skipped?: string[] }>('scheduleOverride_' + TODAY(), {});
    const sk = new Set(ov.skipped || []);
    setTasks(t.filter(x => !sk.has(x.id))); // skipped-today tasks drop off the glance
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
      setCigTimer(`${Math.floor(mins / 60)}h ${mins % 60}m ago`);
    } else { setCigTimer(''); }

    // Today's Move (activity) + Focus (study/skill) for the hero mini-metrics
    const act = await getData<any>('activityLog_' + TODAY(), {});
    setMoveMin(Math.round(((act.gymHours || 0) + (act.walkHours || 0) + (act.swimHours || 0)) * 60));
    const studyLogs = await getData<any[]>('studyLogs', []);
    const skillLogs = await getData<any[]>('skillLogs', []);
    setFocusHours(
      [...studyLogs, ...skillLogs]
        .filter(l => l.date === TODAY())
        .reduce((sum, l) => sum + (l.hours || 0), 0)
    );

    setBacklog((await getBacklogItems()).slice(0, 5));
    setGoals(await getData('goals', DEFAULT_GOALS));
    setWeekly(await getWeeklyAggregates(getWeekStart(TODAY())));
    const je = await getData<{ mood?: number }>('journal_' + TODAY(), {});
    setMood(je.mood);
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const toggleTask = async (id: string) => {
    const comp = { ...completion };
    if (comp[id]) delete comp[id]; else comp[id] = { doneAt: new Date().toISOString() };
    setCompletion(comp);
    await setData('scheduleCompletion_' + TODAY(), comp);
  };

  const toggleHabit = async (h: string) => {
    const updated = { ...habitData, [h]: !habitData[h] };
    setHabitData(updated);
    await setData('habitData_' + TODAY(), updated);
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
    if (d > 0) log.push({ time: new Date().toISOString() });
    else if (d < 0 && log.length > 0) log.pop();
    await setData('cigLog_' + TODAY(), log);
    setCigs(log.length);
    if (log.length) {
      const last = new Date(log[log.length - 1].time);
      const mins = Math.floor((Date.now() - last.getTime()) / 60000);
      setCigTimer(`${Math.floor(mins / 60)}h ${mins % 60}m ago`);
    } else { setCigTimer(''); }
  };

  const setMoodQuick = async (level: number) => {
    const next = mood === level ? undefined : level;
    setMood(next);
    const je = await getData<Record<string, any>>('journal_' + TODAY(), {});
    await setData('journal_' + TODAY(), { ...je, mood: next, updatedAt: new Date().toISOString() });
  };

  const nowMin = NOW_MINUTES();
  const habitDone = habits.filter(h => habitData[h]).length;
  const habitPct = habits.length ? Math.round((habitDone / habits.length) * 100) : 0;
  const doneTasks = tasks.filter(t => completion[t.id]).length;
  const schedPct = tasks.length ? Math.round((doneTasks / tasks.length) * 100) : 0;

  const moveGoalMin = ((goals.weeklyWalkHours + goals.weeklyGymHours) / 7) * 60 || 60;
  const focusGoalHrs = goals.weeklyStudyHours / 7 || 2;
  const moveBar = pctOf(moveMin, moveGoalMin);
  const focusBar = pctOf(focusHours, focusGoalHrs);
  const overallPct = Math.round((habitPct + schedPct + moveBar + focusBar) / 4);

  const metrics: HeroMetric[] = [
    { label: 'Habits', value: `${habitDone}/${habits.length}`, barPct: habitPct, color: Colors.accent },
    { label: 'Schedule', value: `${doneTasks}/${tasks.length}`, barPct: schedPct, color: Colors.green },
    { label: 'Move', value: fmtMove(moveMin), barPct: moveBar, color: Colors.teal },
    { label: 'Focus', value: fmtFocus(focusHours), barPct: focusBar, color: Colors.orange },
  ];

  const timelineItems = tasks.map(t => ({ ...t, done: !!completion[t.id] }));

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C} />}
      showsVerticalScrollIndicator={false}
    >
      {/* ── GREETING ─────────────────────────────────────────── */}
      <View style={styles.greet}>
        <Text style={styles.greetDay}>{formatDayLine()}</Text>
        <Text style={styles.greetHi}>{greeting}</Text>
      </View>

      {/* ── TODAY AT A GLANCE (hero) ─────────────────────────── */}
      <TodayHero
        overallPct={overallPct}
        ringOuterPct={schedPct}
        ringInnerPct={habitPct}
        centerValue={`${doneTasks}`}
        centerSub={`of ${tasks.length}`}
        metrics={metrics}
      />

      {/* ── TODAY'S RHYTHM (timeline) ────────────────────────── */}
      <Card title="Today's rhythm" accentColor={C}>
        <DayTimeline items={timelineItems} nowMin={nowMin} accent={C} onToggle={toggleTask} />
      </Card>

      {/* ── QUICK LOG TILES ──────────────────────────────────── */}
      <View style={styles.qlRow}>
        <View style={styles.qcard}>
          <Text style={styles.qIcon}>💧</Text>
          <Text style={styles.qVal}>{water}</Text>
          <Text style={styles.qKey}>glasses</Text>
          <View style={styles.step}>
            <TouchableOpacity style={styles.stepBtn} onPress={() => adjustWater(-1)}>
              <Text style={styles.stepTxt}>−</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.stepBtn, styles.stepPlus]} onPress={() => adjustWater(1)}>
              <Text style={[styles.stepTxt, { color: Colors.accentLight }]}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.qcard}>
          <Text style={styles.qIcon}>🚭</Text>
          <Text style={[styles.qVal, cigs > 0 && { color: Colors.red }]}>{cigs}</Text>
          <Text style={styles.qKey}>{cigTimer || 'clean today'}</Text>
          <View style={styles.step}>
            <TouchableOpacity style={styles.stepBtn} onPress={() => adjustCigs(-1)}>
              <Text style={styles.stepTxt}>−</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.stepBtn, styles.stepRed]} onPress={() => adjustCigs(1)}>
              <Text style={[styles.stepTxt, { color: Colors.red }]}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ── TODAY'S HABITS ───────────────────────────────────── */}
      {habits.length > 0 && (
        <Card
          title="Today's Habits"
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
                  style={[styles.habitChip, done && { borderColor: P.border, backgroundColor: P.bgMid }]}
                  onPress={() => toggleHabit(h)}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 11, color: done ? C : Colors.textMuted, lineHeight: 14 }}>{done ? '✓' : '○'}</Text>
                  <Text style={[styles.habitChipTxt, { color: done ? P.text : Colors.textMuted }]}>{h}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>
      )}

      {/* ── QUICK MOOD ───────────────────────────────────────── */}
      <Card title="Today's Mood" accentColor={C}>
        <View style={styles.moodRow}>
          {MOODS.map(m => {
            const sel = mood === m.level;
            return (
              <TouchableOpacity
                key={m.level}
                style={[styles.moodBtn, { borderColor: P.border }, sel && { borderColor: m.color, backgroundColor: m.color + '20' }]}
                onPress={() => setMoodQuick(m.level)}
                activeOpacity={0.7}
              >
                <Text style={styles.moodEmoji}>{m.emoji}</Text>
                <Text style={[styles.moodLbl, sel && { color: m.color }]}>{m.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Card>

      {/* ── WEEKLY GOAL RINGS ────────────────────────────────── */}
      {weekly && (
        <Card title="This Week" accentColor={C}>
          <View style={styles.ringRow}>
            <WeekRing label="Gym" color={Colors.green} pct={pctOf(weekly.gymCount, goals.weeklyGym)} />
            <WeekRing label="Study" color={Colors.orange} pct={pctOf(weekly.studyHours, goals.weeklyStudyHours)} />
            <WeekRing label="Water" color={Colors.cyan} pct={pctOf(weekly.totalWater, goals.weeklyWater)} />
            <WeekRing label="Sleep" color={Colors.purple} pct={pctOf(weekly.avgSleep, goals.weeklySleepAvg)} />
          </View>
        </Card>
      )}

      {/* ── HIDDEN-TAB SHORTCUTS ─────────────────────────────── */}
      <Card title="Jump To" accentColor={C}>
        <View style={styles.shortcutRow}>
          {SHORTCUTS.map(s => (
            <TouchableOpacity
              key={s.route}
              style={[styles.shortcut, { borderColor: P.border, backgroundColor: P.bg }]}
              onPress={() => router.push(s.route as any)}
              activeOpacity={0.7}
            >
              <Text style={styles.shortcutIcon}>{s.icon}</Text>
              <Text style={styles.shortcutLbl}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      {/* ── MISSED TASKS ─────────────────────────────────────── */}
      {backlog.length > 0 && (
        <Card title="Missed Tasks" badge={`${backlog.length}`} badgeColor={Colors.red} accentColor={Colors.red}>
          {backlog.map((item, i) => (
            <View key={i} style={styles.backlogItem}>
              <View style={[styles.backlogDot, { backgroundColor: CATEGORY_COLORS[item.category] || Colors.textMuted }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.backlogName}>{item.name}</Text>
                <Text style={styles.backlogDate}>{item.date}</Text>
              </View>
              <Text style={[styles.backlogCat, { color: CATEGORY_COLORS[item.category] || Colors.textMuted }]}>{item.category}</Text>
            </View>
          ))}
        </Card>
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: 14, paddingTop: 8 },

  greet: { paddingHorizontal: 2, paddingTop: 6, paddingBottom: 14 },
  greetDay: { color: Colors.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  greetHi: { color: Colors.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.5, marginTop: 5 },

  qlRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  qcard: { flex: 1, backgroundColor: Colors.surface, borderColor: Colors.border, borderWidth: 1, borderRadius: radius.md, padding: 13, alignItems: 'center' },
  qIcon: { fontSize: 19 },
  qVal: { color: Colors.text, fontSize: 23, fontWeight: '800', marginTop: 4, marginBottom: 1 },
  qKey: { color: Colors.textMuted, fontSize: 10.5, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4, textAlign: 'center' },
  step: { flexDirection: 'row', gap: 8, marginTop: 9 },
  stepBtn: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surfaceHigh, borderWidth: 1, borderColor: Colors.border },
  stepPlus: { backgroundColor: P.bgMid, borderColor: P.border },
  stepRed: { backgroundColor: Colors.red + '25', borderColor: Colors.red + '48' },
  stepTxt: { color: Colors.textSecondary, fontSize: 17, fontWeight: '600' },

  habitsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  habitChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 7, borderRadius: radius.sm, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
  habitChipTxt: { fontSize: 11, fontWeight: '600' },

  weekRing: { alignItems: 'center', flex: 1 },
  weekRingPct: { color: Colors.text, fontSize: 12, fontWeight: '800' },
  weekRingLabel: { color: Colors.textMuted, fontSize: 9, fontWeight: '700', marginTop: 6, textTransform: 'uppercase', letterSpacing: 0.4 },
  ringRow: { flexDirection: 'row', justifyContent: 'space-between' },

  moodRow: { flexDirection: 'row', gap: 8 },
  moodBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: radius.md, borderWidth: 1, backgroundColor: Colors.surface, gap: 3 },
  moodEmoji: { fontSize: 22 },
  moodLbl: { color: Colors.textMuted, fontSize: 9, fontWeight: '700' },

  shortcutRow: { flexDirection: 'row', gap: 8 },
  shortcut: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: radius.md, borderWidth: 1, backgroundColor: Colors.surface, gap: 5 },
  shortcutIcon: { fontSize: 20 },
  shortcutLbl: { color: Colors.textSecondary, fontSize: 10, fontWeight: '700' },

  backlogItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, backgroundColor: Colors.surface, borderRadius: radius.sm, paddingHorizontal: 12, marginBottom: 6 },
  backlogDot: { width: 8, height: 8, borderRadius: 4 },
  backlogName: { color: Colors.text, fontSize: 13, fontWeight: '600' },
  backlogDate: { color: Colors.textMuted, fontSize: 10, marginTop: 1 },
  backlogCat: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, color: Colors.textMuted },
});
