import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { LineChart } from 'react-native-chart-kit';
import { Colors, DEFAULT_HABITS } from '../../src/constants/theme';
import { TODAY, getDayType } from '../../src/utils/helpers';
import { getData } from '../../src/utils/storage';
import { Card } from '../../src/components/Card';

const SW = Dimensions.get('window').width - 48;

const chartCfg = (color: string) => ({
  backgroundGradientFrom: '#1c1b1d', backgroundGradientTo: '#1c1b1d',
  color: (op = 1) => color.replace(')', `,${op})`).replace('rgb', 'rgba'),
  labelColor: () => Colors.textMuted, decimalPlaces: 1,
  propsForBackgroundLines: { stroke: 'rgba(255,255,255,0.04)' },
  propsForLabels: { fontSize: 9 },
});

function getDaysOfMonth(y: number, m: number): string[] {
  const days: string[] = [];
  const d = new Date(y, m, 1);
  while (d.getMonth() === m) { days.push(d.toISOString().slice(0, 10)); d.setDate(d.getDate() + 1); }
  return days;
}

type DayData = {
  date: string; habitPct: number; sleepH: number;
  studyH: number; skillH: number; cigs: number; water: number;
  gym: boolean; journaled: boolean;
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
      const je = await getData<any>('journal_' + ds, null);
      const journaled = !!(je && (je.well || je.free));
      data.push({ date: ds, habitPct, sleepH: sleepEntry?.hours || 0, studyH, skillH, cigs, water, gym, journaled });
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

  // Aggregates
  const avgHabitPct = dayData.length ? Math.round(dayData.reduce((s, d) => s + d.habitPct, 0) / dayData.length) : 0;
  const gymDays = dayData.filter(d => d.gym).length;
  const totalStudy = dayData.reduce((s, d) => s + d.studyH, 0);
  const totalSkill = dayData.reduce((s, d) => s + d.skillH, 0);
  const sleepDays = dayData.filter(d => d.sleepH > 0);
  const avgSleep = sleepDays.length ? sleepDays.reduce((s, d) => s + d.sleepH, 0) / sleepDays.length : 0;
  const totalCigs = dayData.reduce((s, d) => s + d.cigs, 0);
  const journalDays = dayData.filter(d => d.journaled).length;

  // Insights
  const goodSleepDays = dayData.filter(d => d.sleepH >= 7);
  const badSleepDays = dayData.filter(d => d.sleepH > 0 && d.sleepH < 7);
  const goodSleepHabit = goodSleepDays.length ? Math.round(goodSleepDays.reduce((s, d) => s + d.habitPct, 0) / goodSleepDays.length) : null;
  const badSleepHabit = badSleepDays.length ? Math.round(badSleepDays.reduce((s, d) => s + d.habitPct, 0) / badSleepDays.length) : null;
  const bestDay = dayData.reduce<DayData | null>((best, d) => d.habitPct > (best?.habitPct || 0) ? d : best, null);

  // Heatmap calendar
  const allDays = getDaysOfMonth(year, month);
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7; // Mon=0
  const cells: (string | null)[] = [...Array(firstDow).fill(null), ...allDays];
  while (cells.length % 7 !== 0) cells.push(null);

  const heatBg = (d: DayData | undefined, ds: string) => {
    if (ds > TODAY()) return Colors.surface;
    if (!d) return Colors.surface;
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

  // Sleep chart (last 14 days with data in this month)
  const sleepChart = dayData.filter(d => d.sleepH > 0).slice(-14);
  const habitChart = dayData.slice(-14);

  // Weight chart (filter to this month)
  const wChart = weightLog.filter(w => w.date.slice(0, 7) === `${year}-${String(month + 1).padStart(2, '0')}`);

  return (
    <ScrollView style={styles.container}>
      {/* Month nav */}
      <View style={styles.monthNav}>
        <TouchableOpacity style={styles.navBtn} onPress={prevMonth}><Text style={styles.navArrow}>‹</Text></TouchableOpacity>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <TouchableOpacity style={styles.navBtn} onPress={nextMonth}><Text style={styles.navArrow}>›</Text></TouchableOpacity>
      </View>

      {loading && <ActivityIndicator color={Colors.accent} style={{ marginVertical: 20 }} />}

      {/* Monthly Summary */}
      <Card title="Monthly Summary">
        <View style={styles.statsGrid}>
          {[
            { val: `${avgHabitPct}%`, label: 'Avg Habits', color: Colors.green },
            { val: `${gymDays}`, label: 'Gym Days', color: Colors.green },
            { val: `${totalStudy.toFixed(1)}h`, label: 'Study', color: Colors.orange },
            { val: `${avgSleep.toFixed(1)}h`, label: 'Avg Sleep', color: Colors.purple },
            { val: `${totalCigs}`, label: 'Cigarettes', color: Colors.red },
            { val: `${totalSkill.toFixed(1)}h`, label: 'Skills', color: Colors.yellow },
            { val: `${journalDays}`, label: 'Journal Days', color: Colors.accentLight },
            { val: `${dayData.length}`, label: 'Days Tracked', color: Colors.textSecondary },
          ].map((item, i) => (
            <View key={i} style={styles.statItem}>
              <Text style={[styles.statVal, { color: item.color }]}>{item.val}</Text>
              <Text style={styles.statLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
      </Card>

      {/* Habit Heatmap */}
      <Card title="Habit Heatmap">
        <View style={styles.weekRow}>
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <View key={i} style={styles.dayHeaderCell}><Text style={styles.dayHeaderTxt}>{d}</Text></View>
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
                  {d && <Text style={[styles.heatPct, { color: heatTc(d, ds) }]}>{d.habitPct}%</Text>}
                </View>
              );
            })}
          </View>
        ))}
      </Card>

      {/* Charts */}
      {habitChart.length >= 3 && (
        <Card title="Daily Habit Completion">
          <LineChart
            data={{ labels: habitChart.map(d => d.date.slice(8)), datasets: [{ data: habitChart.map(d => d.habitPct), color: () => Colors.green, strokeWidth: 2 }] }}
            width={SW} height={160}
            chartConfig={{ backgroundGradientFrom: '#1c1b1d', backgroundGradientTo: '#1c1b1d', color: (op = 1) => `rgba(34,197,94,${op})`, labelColor: () => Colors.textMuted, decimalPlaces: 0, propsForBackgroundLines: { stroke: 'rgba(255,255,255,0.04)' }, propsForLabels: { fontSize: 9 } }}
            bezier style={{ borderRadius: 8 }}
          />
        </Card>
      )}

      {sleepChart.length >= 3 && (
        <Card title="Sleep Trend">
          <LineChart
            data={{ labels: sleepChart.map(d => d.date.slice(8)), datasets: [{ data: sleepChart.map(d => d.sleepH), color: () => Colors.purple, strokeWidth: 2 }] }}
            width={SW} height={160}
            chartConfig={{ backgroundGradientFrom: '#1c1b1d', backgroundGradientTo: '#1c1b1d', color: (op = 1) => `rgba(167,139,250,${op})`, labelColor: () => Colors.textMuted, decimalPlaces: 1, propsForBackgroundLines: { stroke: 'rgba(255,255,255,0.04)' }, propsForLabels: { fontSize: 9 } }}
            bezier style={{ borderRadius: 8 }}
          />
        </Card>
      )}

      {wChart.length >= 2 && (
        <Card title="Weight Trend">
          <LineChart
            data={{ labels: wChart.map(w => w.date.slice(8)), datasets: [{ data: wChart.map(w => w.value), color: () => Colors.accentLight, strokeWidth: 2 }] }}
            width={SW} height={160}
            chartConfig={{ backgroundGradientFrom: '#1c1b1d', backgroundGradientTo: '#1c1b1d', color: (op = 1) => `rgba(129,140,248,${op})`, labelColor: () => Colors.textMuted, decimalPlaces: 1, propsForBackgroundLines: { stroke: 'rgba(255,255,255,0.04)' }, propsForLabels: { fontSize: 9 } }}
            bezier style={{ borderRadius: 8 }}
          />
        </Card>
      )}

      {/* Insights */}
      <Card title="Insights">
        {goodSleepHabit !== null && badSleepHabit !== null && (
          <View style={styles.insightRow}>
            <Text style={styles.insightIcon}>😴</Text>
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Sleep → Habits Correlation</Text>
              <Text style={styles.insightBody}>
                On 7h+ sleep nights: <Text style={{ color: Colors.green }}>{goodSleepHabit}% habits</Text>
                {' '}vs <Text style={{ color: Colors.orange }}>{badSleepHabit}%</Text> on poor sleep.
                {goodSleepHabit > badSleepHabit ? ' More sleep = better habits! 💡' : ''}
              </Text>
            </View>
          </View>
        )}
        {bestDay && (
          <View style={styles.insightRow}>
            <Text style={styles.insightIcon}>🏆</Text>
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Best Day This Month</Text>
              <Text style={styles.insightBody}>
                {bestDay.date} — {bestDay.habitPct}% habits
                {bestDay.gym ? ', gym ✓' : ''}{bestDay.journaled ? ', journaled ✓' : ''}
                {bestDay.sleepH > 0 ? `, ${bestDay.sleepH.toFixed(1)}h sleep` : ''}
              </Text>
            </View>
          </View>
        )}
        {gymDays > 0 && (
          <View style={styles.insightRow}>
            <Text style={styles.insightIcon}>💪</Text>
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Workout Frequency</Text>
              <Text style={styles.insightBody}>
                {gymDays} gym days this month ({dayData.length > 0 ? (gymDays / dayData.length * 100).toFixed(0) : 0}% of days tracked)
              </Text>
            </View>
          </View>
        )}
        {totalStudy > 0 && (
          <View style={styles.insightRow}>
            <Text style={styles.insightIcon}>📚</Text>
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Study Pace</Text>
              <Text style={styles.insightBody}>
                {totalStudy.toFixed(1)}h this month · avg {dayData.length > 0 ? (totalStudy / dayData.length).toFixed(1) : 0}h/day
              </Text>
            </View>
          </View>
        )}
        {dayData.length === 0 && !loading && (
          <Text style={styles.emptyText}>No data for this month yet. Start tracking to see insights!</Text>
        )}
      </Card>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: 14, paddingTop: 8 },
  monthNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingHorizontal: 4 },
  navBtn: { padding: 8 },
  navArrow: { color: Colors.text, fontSize: 28, fontWeight: '300' },
  monthLabel: { color: Colors.text, fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statItem: { width: '23%', alignItems: 'center', backgroundColor: Colors.surfaceHighest, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 4 },
  statVal: { fontSize: 18, fontWeight: '800' },
  statLabel: { color: Colors.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginTop: 3, textAlign: 'center' },
  weekRow: { flexDirection: 'row', marginBottom: 3 },
  dayHeaderCell: { flex: 1, alignItems: 'center', paddingBottom: 4 },
  dayHeaderTxt: { color: Colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  heatCell: { flex: 1, aspectRatio: 1, margin: 1.5, borderRadius: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface },
  heatDay: { fontSize: 9, fontWeight: '600' },
  heatPct: { fontSize: 7, marginTop: 1 },
  insightRow: { flexDirection: 'row', gap: 12, backgroundColor: Colors.surface, borderRadius: 14, padding: 12, marginBottom: 6 },
  insightIcon: { fontSize: 22 },
  insightContent: { flex: 1 },
  insightTitle: { color: Colors.text, fontSize: 13, fontWeight: '700', letterSpacing: -0.3, marginBottom: 3 },
  insightBody: { color: Colors.textSecondary, fontSize: 12, lineHeight: 18 },
  emptyText: { color: Colors.textMuted, fontSize: 13, fontStyle: 'italic', lineHeight: 20 },
});
