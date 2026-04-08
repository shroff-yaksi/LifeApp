import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Dimensions, ActivityIndicator } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { LineChart } from 'react-native-chart-kit';
import { Colors, CATEGORY_COLORS, DEFAULT_HABITS, DEFAULT_GOALS, TAB_COLORS } from '../../src/constants/theme';
import { TODAY, addDays, getDayType, getWeekStart, formatTime12, timeToMin, NOW_MINUTES, clamp } from '../../src/utils/helpers';
import { getData, setData } from '../../src/utils/storage';
import { getWeeklyAggregates, getBacklogItems, WeeklyStats } from '../../src/utils/aggregates';
import { Card } from '../../src/components/Card';
import { ProgressBar } from '../../src/components/ProgressBar';

const C = TAB_COLORS.index;
const AC = TAB_COLORS.analytics;
const SW = Dimensions.get('window').width - 48;

function makeChartCfg(hex: string) {
  return {
    backgroundGradientFrom: Colors.surface,
    backgroundGradientTo: Colors.surface,
    color: (op = 1) => hex.replace(')', `,${op})`).replace('rgb', 'rgba'),
    labelColor: () => Colors.textMuted,
    decimalPlaces: 1,
    propsForBackgroundLines: { stroke: 'rgba(255,255,255,0.04)' },
    propsForLabels: { fontSize: 9 },
  };
}

function getDaysOfMonth(y: number, m: number): string[] {
  const days: string[] = [];
  const d = new Date(y, m, 1);
  while (d.getMonth() === m) { days.push(d.toISOString().slice(0, 10)); d.setDate(d.getDate() + 1); }
  return days;
}

type DayData = {
  date: string; habitPct: number; sleepH: number;
  studyH: number; skillH: number; cigs: number; water: number;
  gym: boolean;
};

export default function DashboardScreen() {
  const router = useRouter();

  // ── Today state ──────────────────────────────────────────────
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
  const [backlog, setBacklog] = useState<any[]>([]);

  // ── Analytics state ───────────────────────────────────────────
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [dayData, setDayData] = useState<DayData[]>([]);
  const [weightLog, setWeightLog] = useState<any[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // ── Load today ────────────────────────────────────────────────
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
      setCigTimer(`${Math.floor(mins / 60)}h ${mins % 60}m ago`);
    } else { setCigTimer(''); }

    const ws = getWeekStart(TODAY());
    setStats(await getWeeklyAggregates(ws));
    setGoals(await getData('goals', DEFAULT_GOALS));
    setPomodoroCount(await getData<number>('pomodoro_' + TODAY(), 0));

    const bl = await getBacklogItems();
    setBacklog(bl.slice(0, 5));
  }, []);

  // ── Load analytics month ──────────────────────────────────────
  const loadMonth = useCallback(async (y: number, m: number) => {
    setAnalyticsLoading(true);
    const allDays = getDaysOfMonth(y, m);
    const today = TODAY();
    const habitList = await getData<string[]>('habits', DEFAULT_HABITS);
    const sleepLog = await getData<any[]>('sleepLog', []);
    const studyLogs = await getData<any[]>('studyLogs', []);
    const skillLogs = await getData<any[]>('skillLogs', []);
    const wLog = await getData<any[]>('weightLog', []);
    setWeightLog([...wLog].sort((a, b) => a.date.localeCompare(b.date)));

    const data: DayData[] = [];
    for (const ds of allDays) {
      if (ds > today) break;
      const hd = await getData<Record<string, boolean>>('habitData_' + ds, {});
      const done = habitList.filter(h => hd[h]).length;
      const habitPct = habitList.length ? Math.round((done / habitList.length) * 100) : 0;
      const sleepEntry = sleepLog.find(s => s.date === ds);
      const dt = getDayType(ds);
      const taskList = await getData<any[]>('schedule_' + dt, []);
      const comp = await getData<Record<string, any>>('scheduleCompletion_' + ds, {});
      const gym = taskList.some(t => t.category === 'fitness' && comp[t.id]);
      const studyH = studyLogs.filter(l => l.date === ds).reduce((s: number, l: any) => s + l.hours, 0);
      const skillH = skillLogs.filter(l => l.date === ds).reduce((s: number, l: any) => s + l.hours, 0);
      const cigCount = (await getData<any[]>('cigLog_' + ds, [])).length;
      const waterAmt = await getData<number>('water_' + ds, 0);
      data.push({ date: ds, habitPct, sleepH: sleepEntry?.hours || 0, studyH, skillH, cigs: cigCount, water: waterAmt, gym });
    }
    setDayData(data);
    setAnalyticsLoading(false);
  }, []);

  useFocusEffect(useCallback(() => {
    loadData();
    loadMonth(year, month);
  }, [loadData, loadMonth, year, month]));

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadData(), loadMonth(year, month)]);
    setRefreshing(false);
  };

  // ── Month navigation ──────────────────────────────────────────
  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    const n = new Date();
    if (year === n.getFullYear() && month === n.getMonth()) return;
    if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1);
  };

  // ── Today handlers ────────────────────────────────────────────
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

  const toggleTask = async (id: string) => {
    const comp = { ...completion };
    if (comp[id]) delete comp[id]; else comp[id] = { doneAt: new Date().toISOString() };
    setCompletion(comp);
    await setData('scheduleCompletion_' + TODAY(), comp);
  };

  // ── Derived: today ────────────────────────────────────────────
  const nowMin = NOW_MINUTES();
  const habitDone = habits.filter(h => habitData[h]).length;
  const habitPct = habits.length ? Math.round((habitDone / habits.length) * 100) : 0;
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => completion[t.id]).length;
  const schedPct = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const greetEmoji = greeting.includes('morning') ? '🌅' : greeting.includes('afternoon') ? '☀️' : '🌙';

  const goalItems = stats ? [
    { label: 'Gym hrs', actual: stats.gymHours, target: goals.weeklyGymHours || 5, color: Colors.green, icon: '💪' },
    { label: 'Walk hrs', actual: stats.walkHours, target: goals.weeklyWalkHours || 7, color: Colors.teal, icon: '🚶' },
    { label: 'Swim hrs', actual: stats.swimHours, target: goals.weeklySwimHours || 3, color: Colors.cyan, icon: '🏊' },
    { label: 'Journalled', actual: stats.journalDays, target: goals.weeklyJournalDays || 7, color: Colors.pink, icon: '📓' },
    { label: 'Mindful', actual: stats.mindfulDays, target: goals.weeklyMindfulDays || 7, color: Colors.purple, icon: '🧘' },
    { label: 'Study hrs', actual: stats.studyHours, target: goals.weeklyStudyHours || 10, color: Colors.orange, icon: '📚' },
    { label: 'Skill hrs', actual: stats.skillHours, target: goals.weeklySkillHours || 8, color: Colors.yellow, icon: '🎸' },
    { label: 'Cigarettes', actual: stats.totalCigs, target: goals.weeklyCigLimit || 5, color: Colors.red, invert: true, icon: '🚬' },
    { label: 'Water', actual: stats.totalWater, target: goals.weeklyWater || 56, color: Colors.cyan, icon: '💧' },
    { label: 'Avg Sleep', actual: stats.avgSleep, target: goals.weeklySleepAvg || 7.25, color: Colors.purple, icon: '😴' },
  ] : [];

  // ── Derived: analytics ────────────────────────────────────────
  const monthLabel = new Date(year, month, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
  const avgHabitPct = dayData.length ? Math.round(dayData.reduce((s, d) => s + d.habitPct, 0) / dayData.length) : 0;
  const gymDays = dayData.filter(d => d.gym).length;
  const totalStudy = dayData.reduce((s, d) => s + d.studyH, 0);
  const totalSkill = dayData.reduce((s, d) => s + d.skillH, 0);
  const sleepDays = dayData.filter(d => d.sleepH > 0);
  const avgSleep = sleepDays.length ? sleepDays.reduce((s, d) => s + d.sleepH, 0) / sleepDays.length : 0;
  const totalCigs = dayData.reduce((s, d) => s + d.cigs, 0);

  const goodSleepDays = dayData.filter(d => d.sleepH >= 7);
  const badSleepDays = dayData.filter(d => d.sleepH > 0 && d.sleepH < 7);
  const goodSleepHabit = goodSleepDays.length ? Math.round(goodSleepDays.reduce((s, d) => s + d.habitPct, 0) / goodSleepDays.length) : null;
  const badSleepHabit = badSleepDays.length ? Math.round(badSleepDays.reduce((s, d) => s + d.habitPct, 0) / badSleepDays.length) : null;
  const bestDay = dayData.reduce<DayData | null>((best, d) => d.habitPct > (best?.habitPct || 0) ? d : best, null);

  const allMonthDays = getDaysOfMonth(year, month);
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7;
  const cells: (string | null)[] = [...Array(firstDow).fill(null), ...allMonthDays];
  while (cells.length % 7 !== 0) cells.push(null);

  const heatBg = (d: DayData | undefined, ds: string) => {
    if (ds > TODAY()) return Colors.surface;
    if (!d) return Colors.surfaceHigh;
    if (d.habitPct === 0) return Colors.redBg;
    if (d.habitPct < 50) return Colors.orangeBg;
    if (d.habitPct < 80) return Colors.yellowBg;
    return Colors.greenBg;
  };
  const heatTc = (d: DayData | undefined, ds: string) => {
    if (ds > TODAY() || !d) return Colors.textMuted;
    if (d.habitPct < 50) return Colors.orange;
    if (d.habitPct < 80) return Colors.yellow;
    return Colors.green;
  };

  const sleepChart = dayData.filter(d => d.sleepH > 0).slice(-14);
  const habitChart = dayData.slice(-14);
  const wChart = weightLog.filter(w => w.date.slice(0, 7) === `${year}-${String(month + 1).padStart(2, '0')}`);

  const summaryItems = [
    { val: `${avgHabitPct}%`, label: 'Avg Habits', color: Colors.green, icon: '✅' },
    { val: `${gymDays}`, label: 'Gym Days', color: Colors.green, icon: '💪' },
    { val: `${totalStudy.toFixed(1)}h`, label: 'Study', color: Colors.orange, icon: '📚' },
    { val: `${avgSleep.toFixed(1)}h`, label: 'Avg Sleep', color: Colors.purple, icon: '😴' },
    { val: `${totalCigs}`, label: 'Cigarettes', color: Colors.red, icon: '🚬' },
    { val: `${totalSkill.toFixed(1)}h`, label: 'Skills', color: Colors.yellow, icon: '🎸' },
    { val: `${dayData.length}`, label: 'Days Tracked', color: Colors.textSecondary, icon: '📅' },
  ];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C} />}
      showsVerticalScrollIndicator={false}
    >
      {/* ── GREETING BANNER ─────────────────────────────────── */}
      <View style={styles.banner}>
        <View style={styles.bannerTop}>
          <View>
            <Text style={styles.bannerEmoji}>{greetEmoji}</Text>
            <Text style={styles.bannerGreeting}>{greeting}</Text>
            <Text style={styles.bannerSub}>Let's make today count</Text>
          </View>
          <View style={styles.streakBadge}>
            <Text style={styles.streakFire}>🔥</Text>
            <Text style={styles.streakNum}>{streak}</Text>
            <Text style={styles.streakLabel}>day streak</Text>
          </View>
        </View>
        <View style={styles.bannerProgressRow}>
          <Text style={styles.bannerProgressLabel}>Habits today</Text>
          <Text style={[styles.bannerProgressPct, { color: C }]}>{habitDone}/{habits.length}</Text>
        </View>
        <ProgressBar progress={habitPct} color={C} height={5} />
      </View>

      {/* ── TODAY'S SCHEDULE ─────────────────────────────────── */}
      <Card title="Today's Schedule" badge={`${schedPct}%`} badgeColor={C} accentColor={C}>
        {tasks.length === 0 ? (
          <Text style={styles.emptyText}>No tasks — set up your schedule in the Schedule tab</Text>
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
        {totalTasks > 0 && <View style={{ marginTop: 12 }}><ProgressBar progress={schedPct} color={C} height={5} /></View>}
      </Card>

      {/* ── DAILY HABITS ─────────────────────────────────────── */}
      <Card title="Daily Habits" badge={`${habitPct}%`} badgeColor={Colors.green} accentColor={Colors.green}>
        <View style={styles.habitGrid}>
          {habits.map(h => {
            const done = !!habitData[h];
            return (
              <TouchableOpacity
                key={h}
                style={[styles.habitChip, done && { backgroundColor: Colors.green + '20', borderColor: Colors.green + '60' }]}
                onPress={() => toggleHabit(h)}
              >
                <View style={[styles.habitCheck, done && { backgroundColor: Colors.green, borderColor: Colors.green }]}>
                  {done && <Text style={styles.habitCheckMark}>✓</Text>}
                </View>
                <Text style={[styles.habitChipText, done && { color: Colors.green }]}>{h}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Card>

      {/* ── QUICK TRACKING ───────────────────────────────────── */}
      <Card title="Quick Tracking" accentColor={Colors.cyan}>
        <View style={styles.trackerGrid}>
          <View style={[styles.trackerBox, { borderColor: Colors.cyan + '40', backgroundColor: Colors.cyanBg }]}>
            <Text style={styles.trackerBoxIcon}>💧</Text>
            <Text style={[styles.trackerBoxVal, { color: Colors.cyan }]}>{water}</Text>
            <Text style={styles.trackerBoxLabel}>glasses</Text>
            <View style={styles.trackerBtns}>
              <TouchableOpacity style={[styles.trackerBtn, { backgroundColor: Colors.surface }]} onPress={() => adjustWater(-1)}>
                <Text style={styles.trackerBtnTxt}>−</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.trackerBtn, { backgroundColor: Colors.cyan + '30' }]} onPress={() => adjustWater(1)}>
                <Text style={[styles.trackerBtnTxt, { color: Colors.cyan }]}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.trackerBox, { borderColor: (cigs > 0 ? Colors.red : Colors.green) + '40', backgroundColor: cigs > 0 ? Colors.redBg : Colors.greenBg }]}>
            <Text style={styles.trackerBoxIcon}>🚬</Text>
            <Text style={[styles.trackerBoxVal, { color: cigs > 0 ? Colors.red : Colors.green }]}>{cigs}</Text>
            <Text style={styles.trackerBoxLabel}>{cigTimer || 'clean today'}</Text>
            <View style={styles.trackerBtns}>
              <TouchableOpacity style={[styles.trackerBtn, { backgroundColor: Colors.surface }]} onPress={() => adjustCigs(-1)}>
                <Text style={styles.trackerBtnTxt}>−</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.trackerBtn, { backgroundColor: Colors.red + '30' }]} onPress={() => adjustCigs(1)}>
                <Text style={[styles.trackerBtnTxt, { color: Colors.red }]}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.trackerBox, { borderColor: Colors.orange + '40', backgroundColor: Colors.orangeBg }]}>
            <Text style={styles.trackerBoxIcon}>🍅</Text>
            <Text style={[styles.trackerBoxVal, { color: Colors.orange }]}>{pomodoroCount}</Text>
            <Text style={styles.trackerBoxLabel}>sessions</Text>
            <TouchableOpacity style={[styles.trackerBtn, { backgroundColor: Colors.orange + '30', paddingHorizontal: 16, marginTop: 4 }]} onPress={() => router.push('/timer')}>
              <Text style={[styles.trackerBtnTxt, { color: Colors.orange, fontSize: 10 }]}>START</Text>
            </TouchableOpacity>
          </View>
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

      {/* ── WEEKLY GOALS ─────────────────────────────────────── */}
      {stats && (
        <Card title="Weekly Goals" accentColor={C}>
          <View style={styles.goalGrid}>
            {goalItems.map(g => {
              const pct = g.invert
                ? (g.target > 0 ? clamp((1 - g.actual / g.target) * 100, 0, 100) : 100)
                : (g.target > 0 ? clamp((g.actual / g.target) * 100, 0, 100) : 0);
              const display = Number.isInteger(g.actual) ? String(g.actual) : g.actual.toFixed(1);
              const over = !g.invert && pct >= 100;
              return (
                <View key={g.label} style={[styles.goalItem, { borderColor: g.color + '30' }]}>
                  <Text style={styles.goalIcon}>{g.icon}</Text>
                  <Text style={[styles.goalVal, { color: g.color }]}>{display}</Text>
                  <Text style={styles.goalLabel}>{g.label}</Text>
                  <View style={{ marginTop: 8 }}><ProgressBar progress={pct} color={g.color} height={4} /></View>
                  <Text style={styles.goalTarget}>{over ? '✓ Done!' : `${g.invert ? 'limit' : 'target'}: ${g.target}`}</Text>
                </View>
              );
            })}
          </View>
        </Card>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* ── ANALYTICS SECTION ────────────────────────────────── */}
      {/* ══════════════════════════════════════════════════════ */}
      <View style={styles.sectionDivider}>
        <View style={styles.sectionLine} />
        <Text style={styles.sectionLabel}>📊  Analytics</Text>
        <View style={styles.sectionLine} />
      </View>

      {/* Month Nav */}
      <Card accentColor={AC}>
        <View style={styles.monthNav}>
          <TouchableOpacity style={styles.navBtn} onPress={prevMonth}>
            <Text style={[styles.navArrow, { color: AC }]}>‹</Text>
          </TouchableOpacity>
          <View style={styles.monthCenter}>
            <Text style={styles.monthLabel}>{monthLabel}</Text>
            {analyticsLoading && <ActivityIndicator color={AC} size="small" style={{ marginTop: 4 }} />}
          </View>
          <TouchableOpacity style={styles.navBtn} onPress={nextMonth}>
            <Text style={[styles.navArrow, { color: AC }]}>›</Text>
          </TouchableOpacity>
        </View>
      </Card>

      {/* Monthly Summary */}
      <Card title="Monthly Summary" accentColor={AC}>
        <View style={styles.statsGrid}>
          {summaryItems.map((item, i) => (
            <View key={i} style={[styles.statItem, { borderColor: item.color + '30' }]}>
              <Text style={styles.statIcon}>{item.icon}</Text>
              <Text style={[styles.statVal, { color: item.color }]}>{item.val}</Text>
              <Text style={styles.statLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
      </Card>

      {/* Habit Heatmap */}
      <Card title="Habit Heatmap" accentColor={Colors.green}>
        <View style={styles.weekRow}>
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <View key={i} style={styles.dayHeaderCell}>
              <Text style={styles.dayHeaderTxt}>{d}</Text>
            </View>
          ))}
        </View>
        {Array.from({ length: cells.length / 7 }, (_, row) => (
          <View key={row} style={styles.weekRow}>
            {cells.slice(row * 7, row * 7 + 7).map((ds, col) => {
              if (!ds) return <View key={col} style={styles.heatCell} />;
              const d = dayData.find(x => x.date === ds);
              return (
                <View key={col} style={[styles.heatCell, { backgroundColor: heatBg(d, ds) }]}>
                  <Text style={[styles.heatDay, { color: heatTc(d, ds) }]}>{new Date(ds + 'T12:00').getDate()}</Text>
                  {d && d.habitPct > 0 && <Text style={[styles.heatPct, { color: heatTc(d, ds) }]}>{d.habitPct}%</Text>}
                </View>
              );
            })}
          </View>
        ))}
        <View style={styles.heatLegend}>
          {[
            { text: Colors.green, label: '80%+' },
            { text: Colors.yellow, label: '50–79%' },
            { text: Colors.orange, label: '<50%' },
            { text: Colors.red, label: '0%' },
          ].map((l, i) => (
            <View key={i} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: l.text }]} />
              <Text style={[styles.legendLabel, { color: l.text }]}>{l.label}</Text>
            </View>
          ))}
        </View>
      </Card>

      {/* Charts */}
      {habitChart.length >= 3 && (
        <Card title="Daily Habit Completion" accentColor={Colors.green}>
          <LineChart
            data={{ labels: habitChart.map(d => d.date.slice(8)), datasets: [{ data: habitChart.map(d => d.habitPct), color: () => Colors.green, strokeWidth: 2 }] }}
            width={SW} height={160} chartConfig={makeChartCfg('rgba(34,197,94,1)')} bezier style={{ borderRadius: 8, overflow: 'hidden' }}
          />
        </Card>
      )}

      {sleepChart.length >= 3 && (
        <Card title="Sleep Trend" accentColor={Colors.purple}>
          <LineChart
            data={{ labels: sleepChart.map(d => d.date.slice(8)), datasets: [{ data: sleepChart.map(d => d.sleepH), color: () => Colors.purple, strokeWidth: 2 }] }}
            width={SW} height={160} chartConfig={makeChartCfg('rgba(167,139,250,1)')} bezier style={{ borderRadius: 8, overflow: 'hidden' }}
          />
        </Card>
      )}

      {wChart.length >= 2 && (
        <Card title="Weight Trend" accentColor={Colors.accentLight}>
          <LineChart
            data={{ labels: wChart.map(w => w.date.slice(8)), datasets: [{ data: wChart.map(w => w.value), color: () => Colors.accentLight, strokeWidth: 2 }] }}
            width={SW} height={160} chartConfig={makeChartCfg('rgba(165,180,252,1)')} bezier style={{ borderRadius: 8, overflow: 'hidden' }}
          />
        </Card>
      )}

      {/* Insights */}
      <Card title="Insights" accentColor={AC}>
        {goodSleepHabit !== null && badSleepHabit !== null && (
          <View style={styles.insightRow}>
            <View style={[styles.insightIconBox, { backgroundColor: Colors.purpleBg }]}><Text style={{ fontSize: 20 }}>😴</Text></View>
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Sleep → Habits Correlation</Text>
              <Text style={styles.insightBody}>
                7h+ sleep: <Text style={{ color: Colors.green, fontWeight: '700' }}>{goodSleepHabit}% habits</Text>
                {'  vs  '}
                <Text style={{ color: Colors.orange, fontWeight: '700' }}>{badSleepHabit}%</Text> on poor sleep.
                {goodSleepHabit > badSleepHabit ? '  More sleep = better habits! 💡' : ''}
              </Text>
            </View>
          </View>
        )}
        {bestDay && (
          <View style={styles.insightRow}>
            <View style={[styles.insightIconBox, { backgroundColor: Colors.yellowBg }]}><Text style={{ fontSize: 20 }}>🏆</Text></View>
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Best Day This Month</Text>
              <Text style={styles.insightBody}>
                {bestDay.date} — <Text style={{ color: Colors.green, fontWeight: '700' }}>{bestDay.habitPct}% habits</Text>
                {bestDay.gym ? ', gym ✓' : ''}
                {bestDay.sleepH > 0 ? `, ${bestDay.sleepH.toFixed(1)}h sleep` : ''}
              </Text>
            </View>
          </View>
        )}
        {gymDays > 0 && (
          <View style={styles.insightRow}>
            <View style={[styles.insightIconBox, { backgroundColor: Colors.greenBg }]}><Text style={{ fontSize: 20 }}>💪</Text></View>
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Workout Frequency</Text>
              <Text style={styles.insightBody}>
                <Text style={{ color: Colors.green, fontWeight: '700' }}>{gymDays} gym days</Text> this month
                {' '}({dayData.length > 0 ? (gymDays / dayData.length * 100).toFixed(0) : 0}% of days tracked)
              </Text>
            </View>
          </View>
        )}
        {totalStudy > 0 && (
          <View style={styles.insightRow}>
            <View style={[styles.insightIconBox, { backgroundColor: Colors.orangeBg }]}><Text style={{ fontSize: 20 }}>📚</Text></View>
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Study Pace</Text>
              <Text style={styles.insightBody}>
                <Text style={{ color: Colors.orange, fontWeight: '700' }}>{totalStudy.toFixed(1)}h</Text> this month
                {'  ·  '}avg {dayData.length > 0 ? (totalStudy / dayData.length).toFixed(1) : 0}h/day
              </Text>
            </View>
          </View>
        )}
        {dayData.length === 0 && !analyticsLoading && (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 28, marginBottom: 8 }}>📊</Text>
            <Text style={styles.emptyText}>No data for this month yet.</Text>
          </View>
        )}
      </Card>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: 14, paddingTop: 8 },

  // Banner
  banner: { backgroundColor: Colors.card, borderRadius: 20, padding: 20, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: TAB_COLORS.index },
  bannerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  bannerEmoji: { fontSize: 26, marginBottom: 4 },
  bannerGreeting: { color: Colors.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  bannerSub: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  streakBadge: { backgroundColor: Colors.orange + '15', borderWidth: 1, borderColor: Colors.orange + '40', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, alignItems: 'center' },
  streakFire: { fontSize: 22 },
  streakNum: { color: Colors.orange, fontSize: 22, fontWeight: '800', lineHeight: 26 },
  streakLabel: { color: Colors.orange + 'aa', fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  bannerProgressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  bannerProgressLabel: { color: Colors.textMuted, fontSize: 11, fontWeight: '600' },
  bannerProgressPct: { fontSize: 11, fontWeight: '800' },

  // Schedule
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

  // Habits
  habitGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  habitChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
  habitCheck: { width: 18, height: 18, borderRadius: 5, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  habitCheckMark: { color: '#fff', fontSize: 10, fontWeight: '800' },
  habitChipText: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600' },

  // Trackers
  trackerGrid: { flexDirection: 'row', gap: 10 },
  trackerBox: { flex: 1, backgroundColor: Colors.surface, borderRadius: 16, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  trackerBoxIcon: { fontSize: 22, marginBottom: 4 },
  trackerBoxVal: { fontSize: 26, fontWeight: '800', lineHeight: 30 },
  trackerBoxLabel: { color: Colors.textMuted, fontSize: 9, fontWeight: '600', marginTop: 2, marginBottom: 8, textAlign: 'center' },
  trackerBtns: { flexDirection: 'row', gap: 6 },
  trackerBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  trackerBtnTxt: { color: Colors.textSecondary, fontSize: 14, fontWeight: '800' },

  // Backlog
  backlogItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, backgroundColor: Colors.surface, borderRadius: 12, paddingHorizontal: 12, marginBottom: 6 },
  backlogDot: { width: 8, height: 8, borderRadius: 4 },
  backlogName: { color: Colors.text, fontSize: 13, fontWeight: '600' },
  backlogDate: { color: Colors.textMuted, fontSize: 10, marginTop: 1 },
  backlogCat: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },

  // Goals
  goalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  goalItem: { width: '47%', backgroundColor: Colors.surface, borderRadius: 16, padding: 14, borderWidth: 1 },
  goalIcon: { fontSize: 18, marginBottom: 4 },
  goalVal: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  goalLabel: { color: Colors.textMuted, fontSize: 10, marginBottom: 4, fontWeight: '600' },
  goalTarget: { color: Colors.textMuted, fontSize: 9, marginTop: 6, fontWeight: '600' },

  // Section divider
  sectionDivider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 8 },
  sectionLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  sectionLabel: { color: Colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },

  // Analytics: month nav
  monthNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  navBtn: { padding: 4 },
  navArrow: { fontSize: 32, fontWeight: '300' },
  monthCenter: { alignItems: 'center' },
  monthLabel: { color: Colors.text, fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },

  // Analytics: summary grid
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statItem: { width: '22%', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 4, borderWidth: 1 },
  statIcon: { fontSize: 16, marginBottom: 4 },
  statVal: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  statLabel: { color: Colors.textMuted, fontSize: 8, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 3, textAlign: 'center' },

  // Heatmap
  weekRow: { flexDirection: 'row', marginBottom: 3 },
  dayHeaderCell: { flex: 1, alignItems: 'center', paddingBottom: 4 },
  dayHeaderTxt: { color: Colors.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  heatCell: { flex: 1, aspectRatio: 1, margin: 2, borderRadius: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface },
  heatDay: { fontSize: 9, fontWeight: '700' },
  heatPct: { fontSize: 6, marginTop: 1, fontWeight: '600' },
  heatLegend: { flexDirection: 'row', justifyContent: 'center', gap: 14, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 9, fontWeight: '700' },

  // Insights
  insightRow: { flexDirection: 'row', gap: 12, backgroundColor: Colors.surface, borderRadius: 14, padding: 14, marginBottom: 8 },
  insightIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  insightContent: { flex: 1 },
  insightTitle: { color: Colors.text, fontSize: 13, fontWeight: '800', letterSpacing: -0.3, marginBottom: 4 },
  insightBody: { color: Colors.textSecondary, fontSize: 12, lineHeight: 19 },
  emptyState: { alignItems: 'center', paddingVertical: 20 },
});
