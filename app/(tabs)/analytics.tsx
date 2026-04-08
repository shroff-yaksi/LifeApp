import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { LineChart } from 'react-native-chart-kit';
import { Colors, DEFAULT_HABITS, TAB_COLORS } from '../../src/constants/theme';
import { TODAY, getDayType } from '../../src/utils/helpers';
import { getData } from '../../src/utils/storage';
import { Card } from '../../src/components/Card';

const C = TAB_COLORS.analytics; // purple
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
      const dt = getDayType(ds);
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

  const allDays = getDaysOfMonth(year, month);
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7;
  const cells: (string | null)[] = [...Array(firstDow).fill(null), ...allDays];
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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Month Nav */}
      <Card accentColor={C}>
        <View style={styles.monthNav}>
          <TouchableOpacity style={styles.navBtn} onPress={prevMonth}>
            <Text style={[styles.navArrow, { color: C }]}>‹</Text>
          </TouchableOpacity>
          <View style={styles.monthCenter}>
            <Text style={styles.monthLabel}>{monthLabel}</Text>
            {loading && <ActivityIndicator color={C} size="small" style={{ marginTop: 4 }} />}
          </View>
          <TouchableOpacity style={styles.navBtn} onPress={nextMonth}>
            <Text style={[styles.navArrow, { color: C }]}>›</Text>
          </TouchableOpacity>
        </View>
      </Card>

      {/* Monthly Summary */}
      <Card title="Monthly Summary" accentColor={C}>
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
            { color: Colors.greenBg, label: '80%+', text: Colors.green },
            { color: Colors.yellowBg, label: '50–79%', text: Colors.yellow },
            { color: Colors.orangeBg, label: '<50%', text: Colors.orange },
            { color: Colors.redBg, label: '0%', text: Colors.red },
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
            width={SW} height={160}
            chartConfig={makeChartCfg('rgba(34,197,94,1)')}
            bezier style={{ borderRadius: 8, overflow: 'hidden' }}
          />
        </Card>
      )}

      {sleepChart.length >= 3 && (
        <Card title="Sleep Trend" accentColor={Colors.purple}>
          <LineChart
            data={{ labels: sleepChart.map(d => d.date.slice(8)), datasets: [{ data: sleepChart.map(d => d.sleepH), color: () => Colors.purple, strokeWidth: 2 }] }}
            width={SW} height={160}
            chartConfig={makeChartCfg('rgba(167,139,250,1)')}
            bezier style={{ borderRadius: 8, overflow: 'hidden' }}
          />
        </Card>
      )}

      {wChart.length >= 2 && (
        <Card title="Weight Trend" accentColor={Colors.accentLight}>
          <LineChart
            data={{ labels: wChart.map(w => w.date.slice(8)), datasets: [{ data: wChart.map(w => w.value), color: () => Colors.accentLight, strokeWidth: 2 }] }}
            width={SW} height={160}
            chartConfig={makeChartCfg('rgba(165,180,252,1)')}
            bezier style={{ borderRadius: 8, overflow: 'hidden' }}
          />
        </Card>
      )}

      {/* Insights */}
      <Card title="Insights" accentColor={C}>
        {goodSleepHabit !== null && badSleepHabit !== null && (
          <View style={styles.insightRow}>
            <View style={[styles.insightIconBox, { backgroundColor: Colors.purpleBg }]}>
              <Text style={{ fontSize: 20 }}>😴</Text>
            </View>
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
            <View style={[styles.insightIconBox, { backgroundColor: Colors.yellowBg }]}>
              <Text style={{ fontSize: 20 }}>🏆</Text>
            </View>
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
            <View style={[styles.insightIconBox, { backgroundColor: Colors.greenBg }]}>
              <Text style={{ fontSize: 20 }}>💪</Text>
            </View>
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
            <View style={[styles.insightIconBox, { backgroundColor: Colors.orangeBg }]}>
              <Text style={{ fontSize: 20 }}>📚</Text>
            </View>
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Study Pace</Text>
              <Text style={styles.insightBody}>
                <Text style={{ color: Colors.orange, fontWeight: '700' }}>{totalStudy.toFixed(1)}h</Text> this month
                {' '}·  avg {dayData.length > 0 ? (totalStudy / dayData.length).toFixed(1) : 0}h/day
              </Text>
            </View>
          </View>
        )}
        {dayData.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 28, marginBottom: 8 }}>📊</Text>
            <Text style={styles.emptyText}>No data for this month yet.</Text>
            <Text style={styles.emptySubtext}>Start tracking to see insights!</Text>
          </View>
        )}
      </Card>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: 14, paddingTop: 8 },
  monthNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  navBtn: { padding: 4 },
  navArrow: { fontSize: 32, fontWeight: '300' },
  monthCenter: { alignItems: 'center' },
  monthLabel: { color: Colors.text, fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statItem: {
    width: '22%',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderWidth: 1,
  },
  statIcon: { fontSize: 16, marginBottom: 4 },
  statVal: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  statLabel: { color: Colors.textMuted, fontSize: 8, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 3, textAlign: 'center' },
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
  insightRow: { flexDirection: 'row', gap: 12, backgroundColor: Colors.surface, borderRadius: 14, padding: 14, marginBottom: 8 },
  insightIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  insightContent: { flex: 1 },
  insightTitle: { color: Colors.text, fontSize: 13, fontWeight: '800', letterSpacing: -0.3, marginBottom: 4 },
  insightBody: { color: Colors.textSecondary, fontSize: 12, lineHeight: 19 },
  emptyState: { alignItems: 'center', paddingVertical: 20 },
  emptyText: { color: Colors.textMuted, fontSize: 14, fontWeight: '600' },
  emptySubtext: { color: Colors.textMuted, fontSize: 12, marginTop: 4 },
});
