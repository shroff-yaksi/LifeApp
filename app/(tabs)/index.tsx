import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useFocusEffect, useRouter } from 'expo-router';
import { Colors, CATEGORY_COLORS, DEFAULT_HABITS, DEFAULT_GOALS, TAB_COLORS, TAB_PALETTE } from '../../src/constants/theme';
import { TODAY, addDays, getDayKey, getWeekStart, formatTime12, timeToMin, NOW_MINUTES } from '../../src/utils/helpers';
import { getData, setData } from '../../src/utils/storage';
import { getBacklogItems, getWeeklyAggregates, WeeklyStats } from '../../src/utils/aggregates';
import { Card } from '../../src/components/Card';
import { ProgressBar } from '../../src/components/ProgressBar';

const C = TAB_COLORS.index;
const P = TAB_PALETTE.index;

const MOODS = [
  { level: 1, emoji: '😞', label: 'Rough', color: Colors.red },
  { level: 2, emoji: '😕', label: 'Low', color: Colors.orange },
  { level: 3, emoji: '😐', label: 'Okay', color: Colors.yellow },
  { level: 4, emoji: '🙂', label: 'Good', color: Colors.green },
  { level: 5, emoji: '😄', label: 'Great', color: Colors.cyan },
];

const SHORTCUTS = [
  { icon: '📓', label: 'Journal', route: '/(tabs)/journal' },
  { icon: '💰', label: 'Finance', route: '/(tabs)/finance' },
  { icon: '📊', label: 'Analytics', route: '/(tabs)/analytics' },
  { icon: '⏰', label: 'Alarms', route: '/(tabs)/alarms' },
];

const pctOf = (v: number, goal: number) => (goal > 0 ? Math.min(100, (v / goal) * 100) : 0);

// A compact circular progress ring (weekly goal at a glance)
function GoalRing({ pct, color, label }: { pct: number; color: string; label: string }) {
  const size = 58, stroke = 5, r = (size - stroke) / 2, circ = 2 * Math.PI * r;
  const dash = circ * (pct / 100);
  return (
    <View style={styles.ring}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Circle cx={size / 2} cy={size / 2} r={r} stroke={Colors.surfaceHighest} strokeWidth={stroke} fill="none" />
          <Circle
            cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View style={styles.ringCenter}>
          <Text style={styles.ringPct}>{Math.round(pct)}%</Text>
        </View>
      </View>
      <Text style={styles.ringLabel}>{label}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const router = useRouter();

  const [greeting, setGreeting] = useState('');
  const [streak, setStreak] = useState(0);
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

    const bl = await getBacklogItems();
    setBacklog(bl.slice(0, 5));

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
  const greetEmoji = greeting.includes('morning') ? '🌅' : greeting.includes('afternoon') ? '☀️' : '🌙';

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C} />}
      showsVerticalScrollIndicator={false}
    >
      {/* ── GREETING BANNER ──────────────────────────────────── */}
      <View style={[styles.banner, { borderTopColor: C, borderTopWidth: 2, borderColor: Colors.border, borderWidth: 1, borderRadius: 22 }]}>
        <View style={{ position: 'absolute', top: -20, right: -20, width: 140, height: 140, borderRadius: 70, backgroundColor: C + '0e', pointerEvents: 'none' }} />
        <View style={styles.bannerTop}>
          <View>
            <Text style={styles.bannerEmoji}>{greetEmoji}</Text>
            <Text style={styles.bannerGreeting}>{greeting}</Text>
            <Text style={styles.bannerSub}>Let's make today count</Text>
          </View>
          <View style={[styles.streakBadge, { borderColor: P.border, backgroundColor: P.bg }]}>
            <Text style={styles.streakFire}>🔥</Text>
            <Text style={[styles.streakNum, { color: C }]}>{streak}</Text>
            <Text style={[styles.streakLabel, { color: P.text }]}>day streak</Text>
          </View>
        </View>

        {/* Habit + Task progress bars */}
        <View style={styles.progressSection}>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Habits</Text>
            <Text style={[styles.progressPct, { color: P.text }]}>{habitDone}/{habits.length}</Text>
          </View>
          <ProgressBar progress={habitPct} color={P.text} height={4} />
          <View style={[styles.progressRow, { marginTop: 10 }]}>
            <Text style={styles.progressLabel}>Schedule</Text>
            <Text style={[styles.progressPct, { color: C }]}>{doneTasks}/{tasks.length}</Text>
          </View>
          <ProgressBar progress={schedPct} color={C} height={4} />
        </View>
      </View>

      {/* ── TODAY'S SCHEDULE ─────────────────────────────────── */}
      <Card title="Today's Schedule" badge={`${schedPct}%`} badgeColor={C} accentColor={C}>
        {tasks.length === 0 ? (
          <Text style={styles.emptyText}>No tasks — set up your schedule in the Tasks tab</Text>
        ) : tasks.map(t => {
          const sMin = timeToMin(t.start), eMin = timeToMin(t.end);
          const done = !!completion[t.id];
          const isActive = nowMin >= sMin && nowMin < eMin && !done;
          const taskColor = CATEGORY_COLORS[t.category] || C;
          return (
            <TouchableOpacity
              key={t.id}
              style={[styles.taskRow, isActive && { backgroundColor: taskColor + '15', borderRadius: 12 }, done && styles.taskRowDone]}
              onPress={() => toggleTask(t.id)}
            >
              <View style={[styles.taskDot, { backgroundColor: done ? Colors.surfaceHighest : taskColor }]} />
              <View style={styles.taskInfo}>
                <Text style={[styles.taskName, done && styles.taskNameDone]}>{t.name}</Text>
                <Text style={styles.taskTime}>{formatTime12(t.start)} – {formatTime12(t.end)}</Text>
              </View>
              {isActive && (
                <View style={[styles.nowBadge, { backgroundColor: taskColor + '25', borderColor: taskColor + '60' }]}>
                  <Text style={[styles.nowBadgeTxt, { color: taskColor }]}>NOW</Text>
                </View>
              )}
              {done && <Text style={[styles.doneMark, { color: Colors.green }]}>✓</Text>}
            </TouchableOpacity>
          );
        })}
      </Card>

      {/* ── QUICK TRACKING ───────────────────────────────────── */}
      <Card title="Quick Tracking" accentColor={C}>
        <View style={styles.trackerGrid}>
          <View style={[styles.trackerBox, { borderColor: P.border, backgroundColor: P.bg }]}>
            <Text style={styles.trackerBoxIcon}>💧</Text>
            <Text style={[styles.trackerBoxVal, { color: C }]}>{water}</Text>
            <Text style={styles.trackerBoxLabel}>glasses</Text>
            <View style={styles.trackerBtns}>
              <TouchableOpacity style={[styles.trackerBtn, { backgroundColor: Colors.surface }]} onPress={() => adjustWater(-1)}>
                <Text style={styles.trackerBtnTxt}>−</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.trackerBtn, { backgroundColor: P.bgMid }]} onPress={() => adjustWater(1)}>
                <Text style={[styles.trackerBtnTxt, { color: C }]}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.trackerBox, { borderColor: cigs > 0 ? Colors.red + '40' : P.border, backgroundColor: cigs > 0 ? Colors.redBg : P.bg }]}>
            <Text style={styles.trackerBoxIcon}>🚬</Text>
            <Text style={[styles.trackerBoxVal, { color: cigs > 0 ? Colors.red : P.text }]}>{cigs}</Text>
            <Text style={styles.trackerBoxLabel}>{cigTimer || 'clean today'}</Text>
            <View style={styles.trackerBtns}>
              <TouchableOpacity style={[styles.trackerBtn, { backgroundColor: Colors.surface }]} onPress={() => adjustCigs(-1)}>
                <Text style={styles.trackerBtnTxt}>−</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.trackerBtn, { backgroundColor: Colors.red + '25' }]} onPress={() => adjustCigs(1)}>
                <Text style={[styles.trackerBtnTxt, { color: Colors.red }]}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Card>

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
            <GoalRing label="Gym" color={Colors.green} pct={pctOf(weekly.gymCount, goals.weeklyGym)} />
            <GoalRing label="Study" color={Colors.orange} pct={pctOf(weekly.studyHours, goals.weeklyStudyHours)} />
            <GoalRing label="Water" color={Colors.cyan} pct={pctOf(weekly.totalWater, goals.weeklyWater)} />
            <GoalRing label="Sleep" color={Colors.purple} pct={pctOf(weekly.avgSleep, goals.weeklySleepAvg)} />
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

  banner: { backgroundColor: Colors.card, padding: 20, marginBottom: 12, overflow: 'hidden' },
  bannerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  bannerEmoji: { fontSize: 28, marginBottom: 6 },
  bannerGreeting: { color: Colors.text, fontSize: 27, fontWeight: '800', letterSpacing: -0.5 },
  bannerSub: { color: Colors.textMuted, fontSize: 12, marginTop: 3 },
  streakBadge: { borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, alignItems: 'center' },
  streakFire: { fontSize: 18 },
  streakNum: { fontSize: 22, fontWeight: '700', lineHeight: 26 },
  streakLabel: { fontSize: 9, fontWeight: '600', letterSpacing: 0.5 },
  progressSection: { gap: 4 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { color: Colors.textMuted, fontSize: 11, fontWeight: '600' },
  progressPct: { fontSize: 11, fontWeight: '800' },

  emptyText: { color: Colors.textMuted, fontSize: 13, textAlign: 'center', paddingVertical: 16 },
  taskRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, paddingHorizontal: 4, gap: 12, marginBottom: 2 },
  taskRowDone: { opacity: 0.4 },
  taskDot: { width: 4, height: 38, borderRadius: 2 },
  taskInfo: { flex: 1 },
  taskName: { color: Colors.text, fontSize: 14, fontWeight: '700' },
  taskNameDone: { textDecorationLine: 'line-through', color: Colors.textMuted },
  taskTime: { color: Colors.textMuted, fontSize: 10, marginTop: 2, letterSpacing: 0.3 },
  nowBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  nowBadgeTxt: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  doneMark: { fontSize: 16, fontWeight: '700' },

  trackerGrid: { flexDirection: 'row', gap: 10 },
  trackerBox: { flex: 1, backgroundColor: Colors.surface, borderRadius: 18, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  trackerBoxIcon: { fontSize: 24, marginBottom: 6 },
  trackerBoxVal: { fontSize: 28, fontWeight: '800', lineHeight: 32 },
  trackerBoxLabel: { color: Colors.textMuted, fontSize: 9, fontWeight: '600', marginTop: 3, marginBottom: 10, textAlign: 'center' },
  trackerBtns: { flexDirection: 'row', gap: 6 },
  trackerBtn: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 10 },
  trackerBtnTxt: { color: Colors.textSecondary, fontSize: 15, fontWeight: '800' },

  habitsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  habitChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  habitChipTxt: { fontSize: 11, fontWeight: '600' },

  ring: { alignItems: 'center', flex: 1 },
  ringRow: { flexDirection: 'row', justifyContent: 'space-between' },
  ringCenter: { position: 'absolute', width: 58, height: 58, alignItems: 'center', justifyContent: 'center' },
  ringPct: { color: Colors.text, fontSize: 12, fontWeight: '800' },
  ringLabel: { color: Colors.textMuted, fontSize: 9, fontWeight: '700', marginTop: 6, textTransform: 'uppercase', letterSpacing: 0.4 },

  moodRow: { flexDirection: 'row', gap: 8 },
  moodBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 14, borderWidth: 1, backgroundColor: Colors.surface, gap: 3 },
  moodEmoji: { fontSize: 22 },
  moodLbl: { color: Colors.textMuted, fontSize: 9, fontWeight: '700' },

  shortcutRow: { flexDirection: 'row', gap: 8 },
  shortcut: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 14, borderWidth: 1, backgroundColor: Colors.surface, gap: 5 },
  shortcutIcon: { fontSize: 20 },
  shortcutLbl: { color: Colors.textSecondary, fontSize: 10, fontWeight: '700' },

  backlogItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, backgroundColor: Colors.surface, borderRadius: 12, paddingHorizontal: 12, marginBottom: 6 },
  backlogDot: { width: 8, height: 8, borderRadius: 4 },
  backlogName: { color: Colors.text, fontSize: 13, fontWeight: '600' },
  backlogDate: { color: Colors.textMuted, fontSize: 10, marginTop: 1 },
  backlogCat: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
});
