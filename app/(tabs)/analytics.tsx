import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { Colors, DEFAULT_HABITS, TAB_COLORS, heroGradient, radius } from '../../src/constants/theme';
import { TODAY, getDayKey } from '../../src/utils/helpers';
import { getData } from '../../src/utils/storage';
import { Card } from '../../src/components/Card';
import { AreaChart } from '../../src/components/AreaChart';
import { RingStack } from '../../src/components/RingStack';
import { ProgressBar } from '../../src/components/ProgressBar';

const C = TAB_COLORS.analytics; // purple
const CHART_W = Dimensions.get('window').width - 60; // window − container(14·2) − card(16·2)

const pct = (n: number, d: number) => (d > 0 ? Math.min(100, Math.round((n / d) * 100)) : 0);
const dLabel = (ds: string) => new Date(ds + 'T12:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

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

type Metric = { label: string; value: string; barPct: number; color: string };

// ── Month hero — headline habit ring + rate mini-metrics (mimics TodayHero). ──
function MonthHero({ label, loading, onPrev, onNext, avg, metrics }: {
  label: string; loading: boolean; onPrev: () => void; onNext: () => void; avg: number; metrics: Metric[];
}) {
  return (
    <View style={styles.hero}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="monthHeroBg" x1="0" y1="0" x2="0.35" y2="1">
            <Stop offset="0" stopColor={heroGradient.colors[0]} />
            <Stop offset="1" stopColor={heroGradient.colors[1]} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#monthHeroBg)" />
      </Svg>
      <View style={[styles.heroGlow, { backgroundColor: C }]} pointerEvents="none" />
      <View style={styles.hairline} />

      <View style={styles.heroHead}>
        <TouchableOpacity style={styles.navBtn} onPress={onPrev} hitSlop={8}>
          <Text style={[styles.navArrow, { color: C }]}>‹</Text>
        </TouchableOpacity>
        <View style={styles.heroTitleWrap}>
          <Text style={styles.heroKicker}>Monthly overview</Text>
          <Text style={styles.heroMonth}>{label}</Text>
        </View>
        <TouchableOpacity style={styles.navBtn} onPress={onNext} hitSlop={8}>
          <Text style={[styles.navArrow, { color: C }]}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.heroBody}>
        <RingStack size={92} rings={[{ pct: avg, color: C, width: 8 }]}>
          {loading
            ? <ActivityIndicator color={C} size="small" />
            : <>
                <Text style={styles.ringVal}>{avg}%</Text>
                <Text style={styles.ringSub}>habits</Text>
              </>}
        </RingStack>

        <View style={styles.heroMetrics}>
          {metrics.map(m => (
            <View key={m.label} style={styles.metric}>
              <Text style={styles.mLabel}>{m.label}</Text>
              <Text style={styles.mVal}>{m.value}</Text>
              <View style={styles.mBar}><ProgressBar progress={m.barPct} color={m.color} height={5} /></View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// ── Insight — icon tile + title + rich body line. ──
function Insight({ icon, bg, title, children }: { icon: string; bg: string; title: string; children: React.ReactNode }) {
  return (
    <View style={styles.insightRow}>
      <View style={[styles.insightIconBox, { backgroundColor: bg }]}><Text style={styles.insightEmoji}>{icon}</Text></View>
      <View style={styles.insightContent}>
        <Text style={styles.insightTitle}>{title}</Text>
        <Text style={styles.insightBody}>{children}</Text>
      </View>
    </View>
  );
}

// ── Trend — SVG area chart with latest/avg headline + delta pill + date axis. ──
function Trend({ values, labels, color, unit }: { values: number[]; labels: string[]; color: string; unit: string }) {
  const latest = values[values.length - 1];
  const first = values[0];
  const avg = values.reduce((s, v) => s + v, 0) / values.length;
  const delta = latest - first;
  const up = delta >= 0;
  const dColor = Math.abs(delta) < 0.05 ? Colors.textMuted : up ? Colors.green : Colors.red;
  return (
    <View>
      <View style={styles.trendHead}>
        <View>
          <Text style={[styles.trendVal, { color }]}>{latest.toFixed(unit === 'h' ? 1 : 0)}{unit}</Text>
          <Text style={styles.trendCap}>latest · avg {avg.toFixed(1)}{unit}</Text>
        </View>
        <View style={[styles.deltaPill, { backgroundColor: dColor + '18' }]}>
          <Text style={[styles.deltaTxt, { color: dColor }]}>{up ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}{unit}</Text>
        </View>
      </View>
      <AreaChart data={values} width={CHART_W} height={118} color={color} strokeWidth={2.6} />
      <View style={styles.trendAxis}>
        <Text style={styles.axisTxt}>{labels[0]}</Text>
        <Text style={styles.axisTxt}>{labels[labels.length - 1]}</Text>
      </View>
    </View>
  );
}

export default function AnalyticsScreen() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [dayData, setDayData] = useState<DayData[]>([]);
  const [weightLog, setWeightLog] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadMonth = useCallback(async (y: number, m: number) => {
    setLoading(true);
    const allDays = getDaysOfMonth(y, m);
    const today = TODAY();
    const habits = await getData<string[]>('habits', DEFAULT_HABITS);
    const sleepLog = await getData<any[]>('sleepLog', []);
    const studyLogs = await getData<any[]>('studyLogs', []);
    const skillLogs = await getData<any[]>('skillLogs', []);
    const wLog = await getData<any[]>('weightLog', []);
    setWeightLog([...wLog].sort((a, b) => a.date.localeCompare(b.date)));

    const data: DayData[] = [];
    for (const ds of allDays) {
      if (ds > today) break;
      const hd = await getData<Record<string, boolean>>('habitData_' + ds, {});
      const done = habits.filter(h => hd[h]).length;
      const habitPct = habits.length ? Math.round((done / habits.length) * 100) : 0;
      const sleepEntry = sleepLog.find(s => s.date === ds);
      const dt = getDayKey(ds);
      const tasks = await getData<any[]>('schedule_' + dt, []);
      const comp = await getData<Record<string, any>>('scheduleCompletion_' + ds, {});
      const gym = tasks.some(t => t.category === 'fitness' && comp[t.id]);
      const studyH = studyLogs.filter(l => l.date === ds).reduce((s: number, l: any) => s + l.hours, 0);
      const skillH = skillLogs.filter(l => l.date === ds).reduce((s: number, l: any) => s + l.hours, 0);
      const cigs = (await getData<any[]>('cigLog_' + ds, [])).length;
      const water = await getData<number>('water_' + ds, 0);
      data.push({ date: ds, habitPct, sleepH: sleepEntry?.hours || 0, studyH, skillH, cigs, water, gym });
    }
    setDayData(data);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { loadMonth(year, month); }, [year, month, loadMonth]));

  const prevMonth = () => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); };
  const nextMonth = () => {
    const n = new Date();
    if (year === n.getFullYear() && month === n.getMonth()) return;
    if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1);
  };

  const monthLabel = new Date(year, month, 1).toLocaleString('default', { month: 'long', year: 'numeric' });

  const tracked = dayData.length;
  const avgHabitPct = tracked ? Math.round(dayData.reduce((s, d) => s + d.habitPct, 0) / tracked) : 0;
  const gymDays = dayData.filter(d => d.gym).length;
  const totalStudy = dayData.reduce((s, d) => s + d.studyH, 0);
  const totalSkill = dayData.reduce((s, d) => s + d.skillH, 0);
  const totalWater = dayData.reduce((s, d) => s + d.water, 0);
  const sleepDays = dayData.filter(d => d.sleepH > 0);
  const avgSleep = sleepDays.length ? sleepDays.reduce((s, d) => s + d.sleepH, 0) / sleepDays.length : 0;
  const totalCigs = dayData.reduce((s, d) => s + d.cigs, 0);
  const studyDays = dayData.filter(d => d.studyH > 0).length;
  const skillDays = dayData.filter(d => d.skillH > 0).length;
  const goodNights = dayData.filter(d => d.sleepH >= 7).length;

  const goodSleepDays = dayData.filter(d => d.sleepH >= 7);
  const badSleepDays = dayData.filter(d => d.sleepH > 0 && d.sleepH < 7);
  const goodSleepHabit = goodSleepDays.length ? Math.round(goodSleepDays.reduce((s, d) => s + d.habitPct, 0) / goodSleepDays.length) : null;
  const badSleepHabit = badSleepDays.length ? Math.round(badSleepDays.reduce((s, d) => s + d.habitPct, 0) / badSleepDays.length) : null;
  const bestDay = dayData.reduce<DayData | null>((best, d) => d.habitPct > (best?.habitPct || 0) ? d : best, null);

  const heroMetrics: Metric[] = [
    { label: 'Gym', value: `${gymDays}/${tracked}d`, barPct: pct(gymDays, tracked), color: Colors.green },
    { label: 'Sleep 7h+', value: `${goodNights}/${sleepDays.length}`, barPct: pct(goodNights, sleepDays.length), color: Colors.purple },
    { label: 'Study', value: `${totalStudy.toFixed(1)}h`, barPct: pct(studyDays, tracked), color: Colors.orange },
    { label: 'Skills', value: `${totalSkill.toFixed(1)}h`, barPct: pct(skillDays, tracked), color: Colors.pink },
  ];

  const statTiles = [
    { val: `${gymDays}`, label: 'Gym Days', color: Colors.green, icon: '💪' },
    { val: `${totalStudy.toFixed(1)}h`, label: 'Study', color: Colors.orange, icon: '📚' },
    { val: `${totalSkill.toFixed(1)}h`, label: 'Skills', color: Colors.pink, icon: '🎸' },
    { val: `${avgSleep.toFixed(1)}h`, label: 'Avg Sleep', color: Colors.purple, icon: '😴' },
    { val: `${totalWater}`, label: 'Water', color: Colors.cyan, icon: '💧' },
    { val: `${totalCigs}`, label: 'Cigarettes', color: Colors.red, icon: '🚬' },
  ];

  const allDays = getDaysOfMonth(year, month);
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7;
  const cells: (string | null)[] = [...Array(firstDow).fill(null), ...allDays];
  while (cells.length % 7 !== 0) cells.push(null);

  // Completion reads as INTENSITY of the one indigo hue (lightness/opacity), not
  // a red→green rainbow. Empty (0%) is a calm neutral — red is reserved for
  // genuinely destructive / over-limit states elsewhere.
  const heatBg = (d: DayData | undefined, ds: string) => {
    if (ds > TODAY()) return Colors.bg;
    if (!d || d.habitPct === 0) return Colors.surface;
    if (d.habitPct < 50) return 'rgba(94,106,210,0.10)';
    if (d.habitPct < 80) return 'rgba(94,106,210,0.20)';
    return 'rgba(94,106,210,0.34)';
  };
  const heatTc = (d: DayData | undefined, ds: string) => {
    if (ds > TODAY() || !d || d.habitPct === 0) return Colors.textMuted;
    if (d.habitPct < 50) return Colors.ramp3;
    if (d.habitPct < 80) return Colors.ramp4;
    return Colors.ramp5;
  };

  const sleepChart = dayData.filter(d => d.sleepH > 0).slice(-14);
  const habitChart = dayData.slice(-14);
  const wChart = weightLog.filter(w => w.date.slice(0, 7) === `${year}-${String(month + 1).padStart(2, '0')}`);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <MonthHero label={monthLabel} loading={loading} onPrev={prevMonth} onNext={nextMonth} avg={avgHabitPct} metrics={heroMetrics} />

      {/* Monthly totals */}
      <Card title="Monthly Summary" accentColor={C}>
        <View style={styles.statsGrid}>
          {statTiles.map((item, i) => (
            <View key={i} style={styles.statItem}>
              <View style={styles.hairline} />
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
            <View key={i} style={styles.dayHeaderCell}><Text style={styles.dayHeaderTxt}>{d}</Text></View>
          ))}
        </View>
        {Array.from({ length: cells.length / 7 }, (_, row) => (
          <View key={row} style={styles.weekRow}>
            {cells.slice(row * 7, row * 7 + 7).map((ds, col) => {
              if (!ds) return <View key={col} style={[styles.heatCell, { backgroundColor: 'transparent' }]} />;
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
            { label: '80%+', text: Colors.ramp5 },
            { label: '50–79%', text: Colors.ramp4 },
            { label: '<50%', text: Colors.ramp3 },
            { label: '0%', text: Colors.textMuted },
          ].map((l, i) => (
            <View key={i} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: l.text }]} />
              <Text style={styles.legendLabel}>{l.label}</Text>
            </View>
          ))}
        </View>
      </Card>

      {/* Trends — SVG area charts */}
      {habitChart.length >= 3 && (
        <Card title="Daily Habit Completion" accentColor={Colors.green}>
          <Trend values={habitChart.map(d => d.habitPct)} labels={habitChart.map(d => dLabel(d.date))} color={Colors.green} unit="%" />
        </Card>
      )}

      {sleepChart.length >= 3 && (
        <Card title="Sleep Trend" accentColor={Colors.purple}>
          <Trend values={sleepChart.map(d => d.sleepH)} labels={sleepChart.map(d => dLabel(d.date))} color={Colors.purple} unit="h" />
        </Card>
      )}

      {wChart.length >= 2 && (
        <Card title="Weight Trend" accentColor={Colors.accentLight}>
          <Trend values={wChart.map(w => w.value)} labels={wChart.map(w => dLabel(w.date))} color={Colors.accentLight} unit="" />
        </Card>
      )}

      {/* Insights */}
      <Card title="Insights" accentColor={C}>
        {goodSleepHabit !== null && badSleepHabit !== null && (
          <Insight icon="😴" bg={Colors.purpleBg} title="Sleep → Habits Correlation">
            7h+ sleep: <Text style={{ color: Colors.green, fontWeight: '700' }}>{goodSleepHabit}% habits</Text>
            {'  vs  '}
            <Text style={{ color: Colors.orange, fontWeight: '700' }}>{badSleepHabit}%</Text> on poor sleep.
            {goodSleepHabit > badSleepHabit ? '  More sleep = better habits.' : ''}
          </Insight>
        )}
        {bestDay && (
          <Insight icon="🏆" bg={Colors.yellowBg} title="Best Day This Month">
            {dLabel(bestDay.date)} — <Text style={{ color: Colors.green, fontWeight: '700' }}>{bestDay.habitPct}% habits</Text>
            {bestDay.gym ? ', gym ✓' : ''}
            {bestDay.sleepH > 0 ? `, ${bestDay.sleepH.toFixed(1)}h sleep` : ''}
          </Insight>
        )}
        {gymDays > 0 && (
          <Insight icon="💪" bg={Colors.greenBg} title="Workout Frequency">
            <Text style={{ color: Colors.green, fontWeight: '700' }}>{gymDays} gym days</Text> this month
            {' '}({pct(gymDays, tracked)}% of days tracked)
          </Insight>
        )}
        {totalStudy > 0 && (
          <Insight icon="📚" bg={Colors.orangeBg} title="Study Pace">
            <Text style={{ color: Colors.orange, fontWeight: '700' }}>{totalStudy.toFixed(1)}h</Text> this month
            {' '}·  avg {tracked > 0 ? (totalStudy / tracked).toFixed(1) : 0}h/day
          </Insight>
        )}
        {tracked === 0 && !loading && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📊</Text>
            <Text style={styles.emptyText}>No data for this month yet.</Text>
            <Text style={styles.emptySubtext}>Start tracking to see insights.</Text>
          </View>
        )}
      </Card>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: 14, paddingTop: 8 },

  // Hero
  hero: {
    backgroundColor: Colors.card, borderColor: Colors.border, borderWidth: 1,
    borderRadius: radius.lg, padding: 16, marginBottom: 12, marginTop: 6,
    overflow: 'hidden', position: 'relative',
  },
  heroGlow: { position: 'absolute', top: -60, right: -40, width: 180, height: 180, borderRadius: 90, opacity: 0.13 },
  hairline: { position: 'absolute', top: 0, left: 14, right: 14, height: 1, backgroundColor: Colors.innerHighlight },
  heroHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroTitleWrap: { alignItems: 'center' },
  heroKicker: { color: Colors.textSecondary, fontSize: 11, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  heroMonth: { color: Colors.text, fontSize: 20, fontWeight: '800', letterSpacing: -0.4, marginTop: 3 },
  navBtn: { paddingHorizontal: 6, paddingVertical: 2 },
  navArrow: { fontSize: 30, fontWeight: '500' },
  heroBody: { flexDirection: 'row', gap: 18, alignItems: 'center', marginTop: 16 },
  ringVal: { color: Colors.text, fontSize: 21, fontWeight: '800', lineHeight: 24 },
  ringSub: { color: Colors.textMuted, fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  heroMetrics: { flex: 1, gap: 9 },
  metric: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  mLabel: { color: Colors.textSecondary, fontSize: 12.5, fontWeight: '500', flex: 1 },
  mVal: { color: Colors.text, fontSize: 12.5, fontWeight: '700' },
  mBar: { width: 54 },

  // Stat tiles
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 9 },
  statItem: {
    width: '31.5%', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: radius.md,
    paddingVertical: 14, paddingHorizontal: 4, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  statIcon: { fontSize: 17, marginBottom: 5 },
  statVal: { fontSize: 18, fontWeight: '800', letterSpacing: -0.4 },
  statLabel: { color: Colors.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 4, textAlign: 'center' },

  // Heatmap
  weekRow: { flexDirection: 'row', marginBottom: 4 },
  dayHeaderCell: { flex: 1, alignItems: 'center', paddingBottom: 4 },
  dayHeaderTxt: { color: Colors.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  heatCell: { flex: 1, aspectRatio: 1, marginHorizontal: 2, borderRadius: radius.sm - 4, alignItems: 'center', justifyContent: 'center' },
  heatDay: { fontSize: 10, fontWeight: '700' },
  heatPct: { fontSize: 6.5, marginTop: 1, fontWeight: '700' },
  heatLegend: { flexDirection: 'row', justifyContent: 'center', gap: 14, marginTop: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 9, fontWeight: '700', color: Colors.textSecondary },

  // Trend charts
  trendHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 },
  trendVal: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  trendCap: { color: Colors.textMuted, fontSize: 10.5, fontWeight: '600', marginTop: 2 },
  deltaPill: { borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 4 },
  deltaTxt: { fontSize: 11, fontWeight: '800', letterSpacing: 0.2 },
  trendAxis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  axisTxt: { color: Colors.textMuted, fontSize: 9.5, fontWeight: '600' },

  // Insights
  insightRow: { flexDirection: 'row', gap: 12, backgroundColor: Colors.surface, borderRadius: radius.md, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  insightIconBox: { width: 44, height: 44, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  insightEmoji: { fontSize: 20 },
  insightContent: { flex: 1 },
  insightTitle: { color: Colors.text, fontSize: 13, fontWeight: '800', letterSpacing: -0.3, marginBottom: 4 },
  insightBody: { color: Colors.textSecondary, fontSize: 12, lineHeight: 19 },
  emptyState: { alignItems: 'center', paddingVertical: 20 },
  emptyEmoji: { fontSize: 28, marginBottom: 8 },
  emptyText: { color: Colors.textMuted, fontSize: 14, fontWeight: '600' },
  emptySubtext: { color: Colors.textMuted, fontSize: 12, marginTop: 4 },
});
