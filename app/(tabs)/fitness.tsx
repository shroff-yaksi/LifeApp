import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, RefreshControl, LayoutChangeEvent } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Colors, TAB_COLORS, TAB_PALETTE, radius } from '../../src/constants/theme';
import { TODAY, addDays, formatTime12, timeToMin, uid } from '../../src/utils/helpers';
import { getData, setData } from '../../src/utils/storage';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { ModalSheet } from '../../src/components/ModalSheet';
import { FormField } from '../../src/components/FormField';
import { TimeField } from '../../src/components/TimeField';
import { AreaChart } from '../../src/components/AreaChart';

const C = TAB_COLORS.fitness; // green
const P = TAB_PALETTE.fitness;

type ActivityLog = { gymHours: number; walkHours: number; swimHours: number; journalled: boolean; mindful: boolean };
const DEFAULT_ACTIVITY: ActivityLog = { gymHours: 0, walkHours: 0, swimHours: 0, journalled: false, mindful: false };

// Weight / Sleep trend card — SVG AreaChart with a current-value header and a
// delta pill, self-measuring its width so the smooth curve fills the card.
function TrendCard({ title, accent, values, current, delta, unit, lowerIsBetter }: {
  title: string; accent: string; values: number[]; current: number; delta: number | null; unit: string; lowerIsBetter?: boolean;
}) {
  const [w, setW] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const good = delta === null ? true : (lowerIsBetter ? delta <= 0 : delta >= 0);
  const dColor = delta === null || delta === 0 ? Colors.textMuted : good ? Colors.green : Colors.red;
  return (
    <Card title={title} accentColor={accent}>
      <View style={styles.trendHead}>
        <View>
          <Text style={[styles.trendVal, { color: accent }]}>
            {current.toFixed(1)}<Text style={styles.trendUnit}> {unit}</Text>
          </Text>
          <Text style={styles.trendCaption}>{values.length}-day trend · {lo.toFixed(1)}–{hi.toFixed(1)}</Text>
        </View>
        {delta !== null && (
          <View style={[styles.deltaPill, { backgroundColor: dColor + '18' }]}>
            <Text style={[styles.deltaTxt, { color: dColor }]}>
              {delta === 0 ? '±' : delta > 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.chartWrap} onLayout={onLayout}>
        {w > 0 && <AreaChart data={values} width={w} height={112} color={accent} strokeWidth={2.4} />}
      </View>
    </Card>
  );
}

export default function FitnessScreen() {
  const [logDate, setLogDate] = useState(TODAY());
  const [activity, setActivity] = useState<ActivityLog>(DEFAULT_ACTIVITY);
  const [weightLog, setWeightLog] = useState<any[]>([]);
  const [sleepLog, setSleepLog] = useState<any[]>([]);
  const [targetWeight, setTargetWeightVal] = useState('');
  const [targetSleep, setTargetSleepVal] = useState(7.25);
  const [meals, setMeals] = useState<Record<string, string>>({});
  const [cigCount, setCigCount] = useState(0);
  const [deviations, setDeviations] = useState<any[]>([]);
  const [weightModal, setWeightModal] = useState(false);
  const [sleepModal, setSleepModal] = useState(false);
  const [devModal, setDevModal] = useState(false);
  const [wDate, setWDate] = useState(TODAY());
  const [wValue, setWValue] = useState('');
  const [sDate, setSDate] = useState(TODAY());
  const [sBedtime, setSBedtime] = useState('');
  const [sWaketime, setSWaketime] = useState('');
  const [devType, setDevType] = useState('alcohol');
  const [devDesc, setDevDesc] = useState('');
  const [devNotes, setDevNotes] = useState('');
  const [manageModal, setManageModal] = useState(false);

  const loadGlobal = useCallback(async () => {
    setWeightLog(await getData('weightLog', []));
    setSleepLog(await getData('sleepLog', []));
    setTargetWeightVal(await getData('targetWeight', ''));
    setTargetSleepVal(await getData('targetSleep', 7.25));
    setDeviations(await getData('dietDeviations', []));
  }, []);

  const loadForDate = useCallback(async (date: string) => {
    setActivity(await getData<ActivityLog>('activityLog_' + date, DEFAULT_ACTIVITY));
    const m = await getData<Record<string, Record<string, string>>>('meals', {});
    setMeals(m[date] || {});
    setCigCount((await getData<any[]>('cigLog_' + date, [])).length);
  }, []);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => { setRefreshing(true); await Promise.all([loadGlobal(), loadForDate(logDate)]); setRefreshing(false); }, [loadGlobal, loadForDate, logDate]);

  useFocusEffect(useCallback(() => { loadGlobal(); loadForDate(logDate); }, [loadGlobal, loadForDate, logDate]));
  useEffect(() => { loadForDate(logDate); }, [logDate, loadForDate]);

  const adjustHours = async (key: keyof ActivityLog, delta: number) => {
    const current = (activity[key] as number) || 0;
    const newVal = Math.max(0, Math.round((current + delta) * 2) / 2);
    const updated = { ...activity, [key]: newVal };
    setActivity(updated);
    await setData('activityLog_' + logDate, updated);
  };

  const toggleBool = async (key: keyof ActivityLog) => {
    const updated = { ...activity, [key]: !activity[key] };
    setActivity(updated);
    await setData('activityLog_' + logDate, updated);
  };

  const saveWeight = async () => {
    const v = parseFloat(wValue);
    if (!v || v <= 0) { Alert.alert('Invalid', 'Enter a valid weight.'); return; }
    const w = [...weightLog, { date: wDate, value: v, id: uid() }].sort((a, b) => b.date.localeCompare(a.date));
    setWeightLog(w); await setData('weightLog', w); setWeightModal(false);
  };

  const saveSleep = async () => {
    if (!sBedtime || !sWaketime) { Alert.alert('Missing', 'Enter both bedtime and wake time.'); return; }
    let h = (timeToMin(sWaketime) - timeToMin(sBedtime)) / 60; if (h < 0) h += 24;
    const l = [...sleepLog, { date: sDate, bedtime: sBedtime, waketime: sWaketime, hours: h, id: uid() }].sort((a, b) => b.date.localeCompare(a.date));
    setSleepLog(l); await setData('sleepLog', l); setSleepModal(false);
  };

  const saveMealItem = async (type: string, val: string) => {
    const m = { ...meals, [type]: val }; setMeals(m);
    const all = await getData<any>('meals', {}); all[logDate] = m; await setData('meals', all);
  };

  const saveDev = async () => {
    if (!devDesc.trim()) { Alert.alert('Missing', 'Describe what you had.'); return; }
    const now = new Date();
    const log = [{ id: uid(), type: devType, desc: devDesc.trim(), date: TODAY(), time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`, notes: devNotes.trim(), ts: Date.now() }, ...deviations];
    setDeviations(log); await setData('dietDeviations', log); setDevModal(false); setDevDesc(''); setDevNotes('');
  };

  const deleteDev = (id: string) => {
    Alert.alert('Remove Entry?', 'Delete this diet deviation log?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          const log = deviations.filter(d => d.id !== id);
          setDeviations(log); await setData('dietDeviations', log);
        },
      },
    ]);
  };

  const weightSeries = weightLog.length >= 2
    ? [...weightLog].sort((a, b) => a.date.localeCompare(b.date)).slice(-14).map(w => w.value)
    : null;
  const sleepSeries = sleepLog.length >= 2
    ? [...sleepLog].sort((a, b) => a.date.localeCompare(b.date)).slice(-14).map(s => s.hours)
    : null;

  const currentWeight = weightLog.length ? weightLog[0].value : null;
  const weightChange = weightLog.length > 1 ? (weightLog[0].value - weightLog[1].value) : null;
  const lastSleep = sleepLog.length ? sleepLog[0].hours : null;
  const avg7Sleep = sleepLog.length
    ? (sleepLog.slice(0, 7).reduce((a: number, b: any) => a + b.hours, 0) / Math.min(7, sleepLog.length))
    : null;
  const sleepDelta = lastSleep !== null && avg7Sleep !== null ? lastSleep - avg7Sleep : null;

  const devTypes = ['alcohol', 'extra-snack', 'off-diet', 'junk-food', 'sugary-drink', 'other'];
  const devLabels: Record<string, string> = { 'alcohol': '🍷 Alcohol', 'extra-snack': '🍪 Extra Snack', 'off-diet': '🍕 Off-Diet', 'junk-food': '🍔 Junk Food', 'sugary-drink': '🥤 Sugary Drink', 'other': '📝 Other' };
  const devColors: Record<string, string> = { 'alcohol': Colors.purple, 'extra-snack': Colors.orange, 'off-diet': Colors.red, 'junk-food': Colors.red, 'sugary-drink': Colors.cyan, 'other': Colors.textMuted };
  const mealEmojis: Record<string, string> = { breakfast: '🌅', lunch: '☀️', snack: '🍎', dinner: '🌙' };

  const prevDay = () => setLogDate(d => addDays(d, -1));
  const nextDay = () => { if (logDate < TODAY()) setLogDate(d => addDays(d, 1)); };
  const dateLabel = logDate === TODAY() ? 'Today' : new Date(logDate + 'T12:00').toLocaleDateString('default', { weekday: 'short', month: 'short', day: 'numeric' });

  const hourItems = [
    { key: 'gymHours' as keyof ActivityLog, label: 'Gym', emoji: '💪', color: C },
    { key: 'walkHours' as keyof ActivityLog, label: 'Walking', emoji: '🚶', color: Colors.teal },
    { key: 'swimHours' as keyof ActivityLog, label: 'Swimming', emoji: '🏊', color: Colors.cyan },
  ];
  const boolItems = [
    { key: 'journalled' as keyof ActivityLog, label: 'Journalling', emoji: '📓', color: Colors.pink },
    { key: 'mindful' as keyof ActivityLog, label: 'Mindfulness', emoji: '🧘', color: Colors.purple },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C} />}>
      {/* Date Navigator */}
      <View style={styles.dateNav}>
        <View style={styles.hairline} pointerEvents="none" />
        <TouchableOpacity style={styles.dateNavBtn} onPress={prevDay} activeOpacity={0.7}>
          <Text style={styles.dateNavArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.dateNavLabel}>{dateLabel}</Text>
        <TouchableOpacity style={[styles.dateNavBtn, logDate >= TODAY() && { opacity: 0.3 }]} onPress={nextDay} disabled={logDate >= TODAY()} activeOpacity={0.7}>
          <Text style={styles.dateNavArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Daily Activity */}
      <Card title="Today's Activity" accentColor={C}>
        {hourItems.map(item => {
          const val = (activity[item.key] as number) || 0;
          return (
            <View key={item.key} style={styles.actRow}>
              <View style={[styles.actIcon, { backgroundColor: val > 0 ? item.color + '1f' : Colors.surface }]}>
                <Text style={styles.actEmoji}>{item.emoji}</Text>
              </View>
              <Text style={styles.actLabel}>{item.label}</Text>
              <View style={styles.actStepper}>
                <TouchableOpacity style={styles.stepBtn} onPress={() => adjustHours(item.key, -0.5)} activeOpacity={0.7}>
                  <Text style={styles.stepBtnTxt}>−</Text>
                </TouchableOpacity>
                <Text style={[styles.actHours, { color: val > 0 ? item.color : Colors.textMuted }]}>{val.toFixed(1)}h</Text>
                <TouchableOpacity style={[styles.stepBtn, { backgroundColor: item.color + '22', borderColor: item.color + '3a' }]} onPress={() => adjustHours(item.key, 0.5)} activeOpacity={0.7}>
                  <Text style={[styles.stepBtnTxt, { color: item.color }]}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
        <View style={styles.actDivider} />
        {boolItems.map(item => {
          const done = activity[item.key] as boolean;
          return (
            <TouchableOpacity key={item.key} style={styles.actRow} onPress={() => toggleBool(item.key)} activeOpacity={0.7}>
              <View style={[styles.actIcon, { backgroundColor: done ? item.color + '1f' : Colors.surface }]}>
                <Text style={styles.actEmoji}>{item.emoji}</Text>
              </View>
              <Text style={[styles.actLabel, done && { color: item.color }]}>{item.label}</Text>
              <View style={[styles.actCheck, done && { backgroundColor: item.color, borderColor: item.color }]}>
                {done && <Text style={styles.actCheckMark}>✓</Text>}
              </View>
            </TouchableOpacity>
          );
        })}
      </Card>

      {/* Body Stats — display only */}
      <Card title="Body Stats" accentColor={C}>
        <View style={styles.statsGrid}>
          <View style={[styles.statBox, { borderColor: P.border, backgroundColor: P.bg }]}>
            <View style={styles.hairline} pointerEvents="none" />
            <Text style={styles.statBoxLabel}>WEIGHT</Text>
            <Text style={[styles.statBoxVal, { color: C }]}>{currentWeight ?? '–'}</Text>
            <Text style={styles.statBoxSub}>{weightChange !== null ? `${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)} kg` : 'kg'}</Text>
          </View>
          <View style={[styles.statBox, { borderColor: Colors.border, backgroundColor: Colors.surface }]}>
            <View style={styles.hairline} pointerEvents="none" />
            <Text style={styles.statBoxLabel}>TARGET</Text>
            <Text style={[styles.statBoxVal, { color: Colors.textSecondary }]}>{targetWeight || '–'}</Text>
            <Text style={styles.statBoxSub}>kg goal</Text>
          </View>
          <View style={[styles.statBox, { borderColor: P.border, backgroundColor: P.bg }]}>
            <View style={styles.hairline} pointerEvents="none" />
            <Text style={styles.statBoxLabel}>SLEEP</Text>
            <Text style={[styles.statBoxVal, { color: P.text }]}>{lastSleep !== null ? lastSleep.toFixed(1) : '–'}</Text>
            <Text style={styles.statBoxSub}>last night</Text>
          </View>
          <View style={[styles.statBox, { borderColor: P.border, backgroundColor: P.bgMid }]}>
            <View style={styles.hairline} pointerEvents="none" />
            <Text style={styles.statBoxLabel}>AVG 7D</Text>
            <Text style={[styles.statBoxVal, { color: C }]}>{avg7Sleep !== null ? avg7Sleep.toFixed(1) : '–'}</Text>
            <Text style={styles.statBoxSub}>sleep hrs</Text>
          </View>
        </View>
      </Card>

      {/* Weight & Sleep trends — SVG AreaChart */}
      {weightSeries && (
        <TrendCard title="Weight Trend" accent={C} values={weightSeries} current={currentWeight!} delta={weightChange} unit="kg" lowerIsBetter />
      )}
      {sleepSeries && (
        <TrendCard title="Sleep Trend" accent={P.text} values={sleepSeries} current={lastSleep!} delta={sleepDelta} unit="hrs" />
      )}

      {/* Today's Meals */}
      <Card title="Today's Meals" accentColor={C}>
        {(['breakfast', 'lunch', 'snack', 'dinner'] as const).map(type => {
          const filled = !!(meals[type] || '').trim();
          return (
            <View key={type} style={styles.mealSlot}>
              <View style={[styles.mealIcon, { backgroundColor: filled ? P.bg : Colors.surface, borderColor: filled ? P.border : Colors.border }]}>
                <Text style={styles.mealEmoji}>{mealEmojis[type]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.mealLabel}>{type}</Text>
                <TextInput
                  style={styles.mealInput}
                  value={meals[type] || ''}
                  placeholder="What did you eat?"
                  placeholderTextColor={Colors.textMuted}
                  onChangeText={(val) => saveMealItem(type, val)}
                />
              </View>
            </View>
          );
        })}
      </Card>

      {/* Diet Deviations */}
      <Card
        title="Diet Deviations"
        accentColor={Colors.red}
        headerRight={<Button title="+ Log" size="sm" color={Colors.red} onPress={() => setDevModal(true)} />}
      >
        {deviations.length === 0 ? (
          <View style={styles.cleanRecord}>
            <Text style={styles.cleanIcon}>✅</Text>
            <View>
              <Text style={styles.cleanText}>Clean record</Text>
              <Text style={styles.cleanSub}>No deviations logged</Text>
            </View>
          </View>
        ) : deviations.slice(0, 15).map(d => (
          <TouchableOpacity key={d.id} style={styles.devEntry} onLongPress={() => deleteDev(d.id)} activeOpacity={0.7}>
            <View style={[styles.devIcon, { backgroundColor: (devColors[d.type] || Colors.textMuted) + '20' }]}>
              <Text style={{ fontSize: 16 }}>{(devLabels[d.type] || '📝').split(' ')[0]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.devTitle}>{d.desc}</Text>
              <Text style={styles.devMeta}>{d.date}  {d.time ? formatTime12(d.time) : ''}{d.notes ? '  · ' + d.notes : ''}</Text>
            </View>
            <TouchableOpacity onPress={() => deleteDev(d.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={{ color: Colors.textMuted, fontSize: 14 }}>✕</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
        {deviations.length > 0 && <Text style={styles.devHint}>Long-press to delete</Text>}
      </Card>

      {/* Cigarettes */}
      <Card title="Cigarettes Today" accentColor={cigCount > 0 ? Colors.red : Colors.green}>
        <View style={styles.cigRow}>
          <View style={[styles.cigBadge, { backgroundColor: (cigCount > 0 ? Colors.red : Colors.green) + '15', borderColor: (cigCount > 0 ? Colors.red : Colors.green) + '40' }]}>
            <View style={styles.hairline} pointerEvents="none" />
            <Text style={[styles.cigCount, { color: cigCount > 0 ? Colors.red : Colors.green }]}>{cigCount}</Text>
            <Text style={styles.cigLabel}>{cigCount === 0 ? 'clean today 🎉' : cigCount === 1 ? 'cigarette' : 'cigarettes'}</Text>
          </View>
        </View>
      </Card>

      {/* Manage Button */}
      <TouchableOpacity style={styles.manageBtn} onPress={() => setManageModal(true)} activeOpacity={0.7}>
        <Text style={styles.manageBtnIcon}>⚙️</Text>
        <Text style={styles.manageBtnText}>Manage</Text>
      </TouchableOpacity>

      {/* Manage Modal */}
      <ModalSheet visible={manageModal} onClose={() => setManageModal(false)} title="Manage Fitness" accentColor={C}>
        <Text style={styles.manageSection}>Log Data</Text>
        <View style={styles.manageActions}>
          <TouchableOpacity style={[styles.manageAction, { borderColor: P.border, backgroundColor: P.bg }]} onPress={() => { setManageModal(false); setWDate(TODAY()); setWValue(''); setWeightModal(true); }}>
            <Text style={styles.manageActionIcon}>⚖️</Text>
            <Text style={[styles.manageActionLabel, { color: C }]}>Log Weight</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.manageAction, { borderColor: P.border, backgroundColor: P.bg }]} onPress={() => { setManageModal(false); setSDate(TODAY()); setSBedtime('23:00'); setSWaketime('07:00'); setSleepModal(true); }}>
            <Text style={styles.manageActionIcon}>😴</Text>
            <Text style={[styles.manageActionLabel, { color: P.text }]}>Log Sleep</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.manageAction, { borderColor: Colors.red + '30', backgroundColor: Colors.redBg }]} onPress={() => { setManageModal(false); setDevModal(true); }}>
            <Text style={styles.manageActionIcon}>⚠️</Text>
            <Text style={[styles.manageActionLabel, { color: Colors.red }]}>Log Deviation</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.modalActions}>
          <Button title="Done" onPress={() => setManageModal(false)} color={C} />
        </View>
      </ModalSheet>

      {/* Log Weight Modal */}
      <ModalSheet visible={weightModal} onClose={() => setWeightModal(false)} title="Log Weight" accentColor={Colors.purple}>
        <FormField label="Date" value={wDate} onChangeText={setWDate} placeholder="YYYY-MM-DD" />
        <FormField label="Weight (kg)" value={wValue} onChangeText={setWValue} placeholder="65.0" keyboardType="decimal-pad" />
        <View style={styles.modalActions}>
          <Button title="Cancel" variant="outline" onPress={() => setWeightModal(false)} />
          <Button title="Save" onPress={saveWeight} color={Colors.purple} />
        </View>
      </ModalSheet>

      {/* Log Sleep Modal */}
      <ModalSheet visible={sleepModal} onClose={() => setSleepModal(false)} title="Log Sleep" accentColor={Colors.cyan}>
        <FormField label="Date" value={sDate} onChangeText={setSDate} placeholder="YYYY-MM-DD" />
        <TimeField label="Bedtime" value={sBedtime || '23:00'} onChange={setSBedtime} accentColor={Colors.cyan} />
        <TimeField label="Wake Time" value={sWaketime || '07:00'} onChange={setSWaketime} accentColor={Colors.cyan} />
        <View style={styles.modalActions}>
          <Button title="Cancel" variant="outline" onPress={() => setSleepModal(false)} />
          <Button title="Save" onPress={saveSleep} color={Colors.cyan} />
        </View>
      </ModalSheet>

      {/* Log Deviation Modal */}
      <ModalSheet visible={devModal} onClose={() => setDevModal(false)} title="Log Diet Deviation" accentColor={Colors.red}>
        <FormField label="Type">
          <View style={styles.catGrid}>
            {devTypes.map(t => {
              const col = devColors[t];
              return (
                <TouchableOpacity
                  key={t}
                  style={[styles.catBtn, devType === t && { borderColor: col, backgroundColor: col + '20' }]}
                  onPress={() => setDevType(t)}
                >
                  <Text style={[styles.catBtnText, { color: devType === t ? col : Colors.textSecondary }]}>{devLabels[t]}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </FormField>
        <FormField label="What did you have?" value={devDesc} onChangeText={setDevDesc} placeholder="e.g. 2 beers, pizza slice..." />
        <FormField label="Notes (optional)" value={devNotes} onChangeText={setDevNotes} placeholder="Context, how you felt..." />
        <View style={styles.modalActions}>
          <Button title="Cancel" variant="outline" onPress={() => setDevModal(false)} />
          <Button title="Log It" onPress={saveDev} color={Colors.red} />
        </View>
      </ModalSheet>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: 14, paddingTop: 8 },
  hairline: { position: 'absolute', top: 0, left: 1, right: 1, height: 1, backgroundColor: Colors.innerHighlight, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg },

  dateNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.card, borderRadius: radius.md, paddingVertical: 10, paddingHorizontal: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  dateNavBtn: { width: 36, height: 36, borderRadius: radius.sm, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  dateNavArrow: { color: Colors.text, fontSize: 24, fontWeight: '500', lineHeight: 28 },
  dateNavLabel: { color: Colors.text, fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },

  actRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, gap: 12 },
  actIcon: { width: 36, height: 36, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  actEmoji: { fontSize: 18 },
  actLabel: { flex: 1, color: Colors.textSecondary, fontSize: 14, fontWeight: '600' },
  actStepper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepBtn: { width: 32, height: 32, borderRadius: radius.sm, backgroundColor: Colors.surfaceHigh, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  stepBtnTxt: { color: Colors.textSecondary, fontSize: 18, fontWeight: '700', lineHeight: 22 },
  actHours: { fontSize: 16, fontWeight: '800', minWidth: 42, textAlign: 'center', letterSpacing: -0.3 },
  actCheck: { width: 30, height: 30, borderRadius: radius.sm, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  actCheckMark: { color: Colors.bg, fontSize: 15, fontWeight: '800' },
  actDivider: { height: 1, backgroundColor: Colors.border, marginVertical: 8 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statBox: { width: '47.5%', flexGrow: 1, borderRadius: radius.md, padding: 14, borderWidth: 1, alignItems: 'center', overflow: 'hidden' },
  statBoxLabel: { color: Colors.textMuted, fontSize: 8, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' as const, marginBottom: 6 },
  statBoxVal: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  statBoxSub: { color: Colors.textMuted, fontSize: 10, marginTop: 2, fontWeight: '600' },

  trendHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 },
  trendVal: { fontSize: 30, fontWeight: '800', letterSpacing: -0.8 },
  trendUnit: { fontSize: 13, fontWeight: '700', color: Colors.textMuted, letterSpacing: 0 },
  trendCaption: { color: Colors.textMuted, fontSize: 10.5, fontWeight: '600', marginTop: 2 },
  deltaPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  deltaTxt: { fontSize: 12, fontWeight: '800', letterSpacing: -0.2 },
  chartWrap: { width: '100%', height: 112, marginTop: 2 },

  mealSlot: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7, gap: 12 },
  mealIcon: { width: 38, height: 38, borderRadius: radius.sm, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  mealEmoji: { fontSize: 18 },
  mealLabel: { color: Colors.textMuted, fontSize: 9, fontWeight: '800', textTransform: 'uppercase' as const, letterSpacing: 0.6, marginBottom: 3 },
  mealInput: { color: Colors.text, fontSize: 13, backgroundColor: Colors.surface, borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: Colors.border },

  cleanRecord: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  cleanIcon: { fontSize: 24 },
  cleanText: { color: Colors.green, fontSize: 14, fontWeight: '700' },
  cleanSub: { color: Colors.textMuted, fontSize: 11, marginTop: 1, fontWeight: '500' },
  devEntry: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9 },
  devIcon: { width: 38, height: 38, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  devTitle: { color: Colors.text, fontSize: 13, fontWeight: '600' },
  devMeta: { color: Colors.textMuted, fontSize: 10, marginTop: 2 },
  devHint: { color: Colors.textMuted, fontSize: 9, textAlign: 'center', marginTop: 8, fontWeight: '600' },

  cigRow: { alignItems: 'center', paddingVertical: 6 },
  cigBadge: { paddingHorizontal: 40, paddingVertical: 18, borderRadius: radius.lg, borderWidth: 1, alignItems: 'center', overflow: 'hidden' },
  cigCount: { fontSize: 44, fontWeight: '800', letterSpacing: -1.5 },
  cigLabel: { color: Colors.textMuted, fontSize: 12, marginTop: 4, fontWeight: '600' },

  catGrid: { flexDirection: 'row', flexWrap: 'wrap' as const, gap: 8 },
  catBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.sm, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surfaceHigh },
  catBtnText: { fontSize: 12, fontWeight: '600' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10, marginBottom: 20 },

  manageBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.surface, borderRadius: radius.md, paddingVertical: 14, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  manageBtnIcon: { fontSize: 18 },
  manageBtnText: { color: Colors.textSecondary, fontSize: 14, fontWeight: '700' },
  manageSection: { color: Colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 12, marginTop: 4 },
  manageActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  manageAction: { flex: 1, minWidth: '28%', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: radius.md, paddingVertical: 16, borderWidth: 1, gap: 6 },
  manageActionIcon: { fontSize: 24 },
  manageActionLabel: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
});
