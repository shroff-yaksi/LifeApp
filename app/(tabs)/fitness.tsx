import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Dimensions, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { LineChart } from 'react-native-chart-kit';
import { Colors, DEFAULT_MEAL_TIMINGS, TAB_COLORS } from '../../src/constants/theme';
import { TODAY, formatTime12, timeToMin, uid } from '../../src/utils/helpers';
import { getData, setData } from '../../src/utils/storage';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { ModalSheet } from '../../src/components/ModalSheet';
import { FormField } from '../../src/components/FormField';

const C = TAB_COLORS.fitness; // green
const screenW = Dimensions.get('window').width - 48;

const chartCfg = (color: string, hex: string) => ({
  backgroundGradientFrom: Colors.surface,
  backgroundGradientTo: Colors.surface,
  color: (op = 1) => hex.replace(')', `,${op})`).replace('rgb', 'rgba'),
  labelColor: () => Colors.textMuted,
  decimalPlaces: 1,
  propsForBackgroundLines: { stroke: 'rgba(255,255,255,0.04)' },
  propsForLabels: { fontSize: 10 },
});

type ActivityLog = { gymHours: number; walkHours: number; swimHours: number; journalled: boolean; mindful: boolean };
const DEFAULT_ACTIVITY: ActivityLog = { gymHours: 0, walkHours: 0, swimHours: 0, journalled: false, mindful: false };

export default function FitnessScreen() {
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

  const loadData = useCallback(async () => {
    setActivity(await getData<ActivityLog>('activityLog_' + TODAY(), DEFAULT_ACTIVITY));
    setWeightLog(await getData('weightLog', []));
    setSleepLog(await getData('sleepLog', []));
    setTargetWeightVal(await getData('targetWeight', ''));
    setTargetSleepVal(await getData('targetSleep', 7.25));
    const m = await getData<Record<string, Record<string, string>>>('meals', {});
    setMeals(m[TODAY()] || {});
    setCigCount((await getData<any[]>('cigLog_' + TODAY(), [])).length);
    setDeviations(await getData('dietDeviations', []));
  }, []);

  const adjustHours = async (key: keyof ActivityLog, delta: number) => {
    const current = (activity[key] as number) || 0;
    const newVal = Math.max(0, Math.round((current + delta) * 2) / 2);
    const updated = { ...activity, [key]: newVal };
    setActivity(updated);
    await setData('activityLog_' + TODAY(), updated);
  };

  const toggleBool = async (key: keyof ActivityLog) => {
    const updated = { ...activity, [key]: !activity[key] };
    setActivity(updated);
    await setData('activityLog_' + TODAY(), updated);
  };

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

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
    const all = await getData<any>('meals', {}); all[TODAY()] = m; await setData('meals', all);
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

  const weightData = weightLog.length >= 2 ? (() => {
    const sorted = [...weightLog].sort((a, b) => a.date.localeCompare(b.date)).slice(-14);
    return { labels: sorted.map(w => w.date.slice(8)), datasets: [{ data: sorted.map(w => w.value), color: () => Colors.purple, strokeWidth: 2 }] };
  })() : null;

  const sleepData = sleepLog.length >= 2 ? (() => {
    const sorted = [...sleepLog].sort((a, b) => a.date.localeCompare(b.date)).slice(-14);
    return { labels: sorted.map(s => s.date.slice(8)), datasets: [{ data: sorted.map(s => s.hours), color: () => Colors.cyan, strokeWidth: 2 }] };
  })() : null;

  const currentWeight = weightLog.length ? weightLog[0].value : null;
  const weightChange = weightLog.length > 1 ? (weightLog[0].value - weightLog[1].value) : null;
  const lastSleep = sleepLog.length ? sleepLog[0].hours : null;
  const avg7Sleep = sleepLog.length
    ? (sleepLog.slice(0, 7).reduce((a: number, b: any) => a + b.hours, 0) / Math.min(7, sleepLog.length))
    : null;

  const devTypes = ['alcohol', 'extra-snack', 'off-diet', 'junk-food', 'sugary-drink', 'other'];
  const devLabels: Record<string, string> = { 'alcohol': '🍷 Alcohol', 'extra-snack': '🍪 Extra Snack', 'off-diet': '🍕 Off-Diet', 'junk-food': '🍔 Junk Food', 'sugary-drink': '🥤 Sugary Drink', 'other': '📝 Other' };
  const devColors: Record<string, string> = { 'alcohol': Colors.purple, 'extra-snack': Colors.orange, 'off-diet': Colors.red, 'junk-food': Colors.red, 'sugary-drink': Colors.cyan, 'other': Colors.textMuted };
  const mealEmojis: Record<string, string> = { breakfast: '🌅', lunch: '☀️', snack: '🍎', dinner: '🌙' };

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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Daily Activity Checklist */}
      <Card title="Today's Activity" accentColor={C}>
        {hourItems.map(item => (
          <View key={item.key} style={styles.actRow}>
            <Text style={styles.actEmoji}>{item.emoji}</Text>
            <Text style={styles.actLabel}>{item.label}</Text>
            <View style={styles.actStepper}>
              <TouchableOpacity style={styles.stepBtn} onPress={() => adjustHours(item.key, -0.5)}>
                <Text style={styles.stepBtnTxt}>−</Text>
              </TouchableOpacity>
              <Text style={[styles.actHours, { color: (activity[item.key] as number) > 0 ? item.color : Colors.textMuted }]}>
                {((activity[item.key] as number) || 0).toFixed(1)}h
              </Text>
              <TouchableOpacity style={[styles.stepBtn, { backgroundColor: item.color + '25' }]} onPress={() => adjustHours(item.key, 0.5)}>
                <Text style={[styles.stepBtnTxt, { color: item.color }]}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        <View style={styles.actDivider} />
        {boolItems.map(item => {
          const done = activity[item.key] as boolean;
          return (
            <TouchableOpacity key={item.key} style={styles.actRow} onPress={() => toggleBool(item.key)} activeOpacity={0.7}>
              <Text style={styles.actEmoji}>{item.emoji}</Text>
              <Text style={[styles.actLabel, done && { color: item.color }]}>{item.label}</Text>
              <View style={[styles.actCheck, done && { backgroundColor: item.color, borderColor: item.color }]}>
                {done && <Text style={styles.actCheckMark}>✓</Text>}
              </View>
            </TouchableOpacity>
          );
        })}
      </Card>

      {/* Stats Banner */}
      <Card title="Body Stats" accentColor={C}>
        <View style={styles.statsGrid}>
          <View style={[styles.statBox, { borderColor: Colors.purple + '40', backgroundColor: Colors.purpleBg }]}>
            <Text style={styles.statBoxLabel}>WEIGHT</Text>
            <Text style={[styles.statBoxVal, { color: Colors.purple }]}>{currentWeight ?? '–'}</Text>
            <Text style={styles.statBoxSub}>
              {weightChange !== null ? `${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)} kg` : 'kg'}
            </Text>
          </View>
          <View style={[styles.statBox, { borderColor: Colors.textMuted + '40', backgroundColor: Colors.surface }]}>
            <Text style={styles.statBoxLabel}>TARGET</Text>
            <Text style={[styles.statBoxVal, { color: Colors.textSecondary }]}>{targetWeight || '–'}</Text>
            <Text style={styles.statBoxSub}>kg goal</Text>
          </View>
          <View style={[styles.statBox, { borderColor: Colors.cyan + '40', backgroundColor: Colors.cyanBg }]}>
            <Text style={styles.statBoxLabel}>SLEEP</Text>
            <Text style={[styles.statBoxVal, { color: Colors.cyan }]}>{lastSleep !== null ? lastSleep.toFixed(1) : '–'}</Text>
            <Text style={styles.statBoxSub}>last night</Text>
          </View>
          <View style={[styles.statBox, { borderColor: Colors.accentLight + '40', backgroundColor: Colors.accentBg }]}>
            <Text style={styles.statBoxLabel}>AVG 7D</Text>
            <Text style={[styles.statBoxVal, { color: Colors.accentLight }]}>{avg7Sleep !== null ? avg7Sleep.toFixed(1) : '–'}</Text>
            <Text style={styles.statBoxSub}>sleep hrs</Text>
          </View>
        </View>
        <View style={styles.btnRow}>
          <Button title="⚖️ Log Weight" size="sm" variant="outline" color={Colors.purple} onPress={() => { setWDate(TODAY()); setWValue(''); setWeightModal(true); }} />
          <Button title="😴 Log Sleep" size="sm" variant="outline" color={Colors.cyan} onPress={() => { setSDate(TODAY()); setSBedtime(''); setSWaketime(''); setSleepModal(true); }} />
        </View>
      </Card>

      {/* Today's Meals */}
      <Card title="Today's Meals" accentColor={Colors.orange}>
        {(['breakfast', 'lunch', 'snack', 'dinner'] as const).map(type => (
          <View key={type} style={styles.mealSlot}>
            <Text style={styles.mealEmoji}>{mealEmojis[type]}</Text>
            <Text style={styles.mealLabel}>{type}</Text>
            <TextInput
              style={styles.mealInput}
              value={meals[type] || ''}
              placeholder="What did you eat?"
              placeholderTextColor={Colors.textMuted}
              onChangeText={(val) => saveMealItem(type, val)}
            />
          </View>
        ))}
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
            <Text style={styles.cleanText}>Clean record!</Text>
          </View>
        ) : deviations.slice(0, 15).map(d => (
          <TouchableOpacity key={d.id} style={styles.devEntry} onLongPress={() => deleteDev(d.id)}>
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
            <Text style={[styles.cigCount, { color: cigCount > 0 ? Colors.red : Colors.green }]}>{cigCount}</Text>
            <Text style={styles.cigLabel}>{cigCount === 0 ? 'clean today 🎉' : cigCount === 1 ? 'cigarette' : 'cigarettes'}</Text>
          </View>
        </View>
      </Card>

      {/* Charts */}
      {weightData && (
        <Card title="Weight Trend" accentColor={Colors.purple}>
          <LineChart data={weightData} width={screenW} height={180}
            chartConfig={chartCfg(Colors.purple, 'rgba(167,139,250,1)')} bezier style={{ borderRadius: 12, overflow: 'hidden' }} />
        </Card>
      )}
      {sleepData && (
        <Card title="Sleep Trend" accentColor={Colors.cyan}>
          <LineChart data={sleepData} width={screenW} height={180}
            chartConfig={chartCfg(Colors.cyan, 'rgba(34,211,238,1)')} bezier style={{ borderRadius: 12, overflow: 'hidden' }} />
        </Card>
      )}

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
        <FormField label="Bedtime (HH:MM)" value={sBedtime} onChangeText={setSBedtime} placeholder="23:15" keyboardType="numbers-and-punctuation" />
        <FormField label="Wake Time (HH:MM)" value={sWaketime} onChangeText={setSWaketime} placeholder="06:30" keyboardType="numbers-and-punctuation" />
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
  actRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, gap: 10 },
  actEmoji: { fontSize: 20, width: 28, textAlign: 'center' },
  actLabel: { flex: 1, color: Colors.textSecondary, fontSize: 14, fontWeight: '600' },
  actStepper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: Colors.surfaceHigh, alignItems: 'center', justifyContent: 'center' },
  stepBtnTxt: { color: Colors.textSecondary, fontSize: 18, fontWeight: '700', lineHeight: 22 },
  actHours: { fontSize: 16, fontWeight: '800', minWidth: 42, textAlign: 'center', letterSpacing: -0.3 },
  actCheck: { width: 28, height: 28, borderRadius: 8, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  actCheckMark: { color: Colors.bg, fontSize: 14, fontWeight: '800' },
  actDivider: { height: 1, backgroundColor: Colors.border, marginVertical: 6 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  statBox: {
    width: '47%',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  statBoxLabel: { color: Colors.textMuted, fontSize: 8, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' as const, marginBottom: 6 },
  statBoxVal: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  statBoxSub: { color: Colors.textMuted, fontSize: 10, marginTop: 2 },
  btnRow: { flexDirection: 'row', gap: 10 },
  mealSlot: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10, marginBottom: 2 },
  mealEmoji: { fontSize: 18, width: 28, textAlign: 'center' },
  mealLabel: { color: Colors.textMuted, fontSize: 10, fontWeight: '700', width: 64, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  mealInput: { flex: 1, color: Colors.text, fontSize: 13, backgroundColor: Colors.surface, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 },
  cleanRecord: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  cleanIcon: { fontSize: 20 },
  cleanText: { color: Colors.green, fontSize: 14, fontWeight: '700' },
  devEntry: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, marginBottom: 4 },
  devIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  devTitle: { color: Colors.text, fontSize: 13, fontWeight: '600' },
  devMeta: { color: Colors.textMuted, fontSize: 10, marginTop: 2 },
  devHint: { color: Colors.textMuted, fontSize: 9, textAlign: 'center', marginTop: 8, fontWeight: '600' },
  cigRow: { alignItems: 'center', paddingVertical: 8 },
  cigBadge: { paddingHorizontal: 32, paddingVertical: 16, borderRadius: 16, borderWidth: 1, alignItems: 'center' },
  cigCount: { fontSize: 40, fontWeight: '800', letterSpacing: -1 },
  cigLabel: { color: Colors.textMuted, fontSize: 12, marginTop: 4 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap' as const, gap: 8 },
  catBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surfaceHigh },
  catBtnText: { fontSize: 12, fontWeight: '600' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10, marginBottom: 20 },
});
