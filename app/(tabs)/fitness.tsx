import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Dimensions } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { LineChart } from 'react-native-chart-kit';
import { Colors, DEFAULT_MEAL_TIMINGS } from '../../src/constants/theme';
import { TODAY, formatTime12, timeToMin, uid } from '../../src/utils/helpers';
import { getData, setData } from '../../src/utils/storage';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { ModalSheet } from '../../src/components/ModalSheet';
import { FormField } from '../../src/components/FormField';

const screenW = Dimensions.get('window').width - 48;
const chartCfg = {
  backgroundGradientFrom: Colors.card, backgroundGradientTo: Colors.card,
  color: (op = 1) => `rgba(167,139,250,${op})`,
  labelColor: () => Colors.textMuted, decimalPlaces: 1,
  propsForBackgroundLines: { stroke: 'rgba(255,255,255,0.04)' },
  propsForLabels: { fontSize: 10 },
};

export default function FitnessScreen() {
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
    setWeightLog(await getData('weightLog', []));
    setSleepLog(await getData('sleepLog', []));
    setTargetWeightVal(await getData('targetWeight', ''));
    setTargetSleepVal(await getData('targetSleep', 7.25));
    const m = await getData<Record<string, Record<string, string>>>('meals', {});
    setMeals(m[TODAY()] || {});
    setCigCount((await getData<any[]>('cigLog_' + TODAY(), [])).length);
    setDeviations(await getData('dietDeviations', []));
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const saveWeight = async () => {
    const v = parseFloat(wValue); if (!v) return;
    const w = [...weightLog, { date: wDate, value: v, id: uid() }].sort((a, b) => b.date.localeCompare(a.date));
    setWeightLog(w); await setData('weightLog', w); setWeightModal(false);
  };

  const saveSleep = async () => {
    if (!sBedtime || !sWaketime) return;
    let h = (timeToMin(sWaketime) - timeToMin(sBedtime)) / 60; if (h < 0) h += 24;
    const l = [...sleepLog, { date: sDate, bedtime: sBedtime, waketime: sWaketime, hours: h, id: uid() }].sort((a, b) => b.date.localeCompare(a.date));
    setSleepLog(l); await setData('sleepLog', l); setSleepModal(false);
  };

  const saveMealItem = async (type: string, val: string) => {
    const m = { ...meals, [type]: val }; setMeals(m);
    const all = await getData<any>('meals', {}); all[TODAY()] = m; await setData('meals', all);
  };

  const saveDev = async () => {
    if (!devDesc.trim()) return;
    const now = new Date();
    const log = [{ id: uid(), type: devType, desc: devDesc.trim(), date: TODAY(), time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`, notes: devNotes.trim(), ts: Date.now() }, ...deviations];
    setDeviations(log); await setData('dietDeviations', log); setDevModal(false); setDevDesc(''); setDevNotes('');
  };

  const deleteDev = async (id: string) => {
    const log = deviations.filter(d => d.id !== id); setDeviations(log); await setData('dietDeviations', log);
  };

  const weightData = weightLog.length >= 2 ? (() => {
    const sorted = [...weightLog].sort((a, b) => a.date.localeCompare(b.date)).slice(-14);
    return { labels: sorted.map(w => w.date.slice(8)), datasets: [{ data: sorted.map(w => w.value), color: () => Colors.purple, strokeWidth: 2 }] };
  })() : null;

  const sleepData = sleepLog.length >= 2 ? (() => {
    const sorted = [...sleepLog].sort((a, b) => a.date.localeCompare(b.date)).slice(-14);
    return { labels: sorted.map(s => s.date.slice(8)), datasets: [{ data: sorted.map(s => s.hours), color: () => Colors.purple, strokeWidth: 2 }] };
  })() : null;

  const currentWeight = weightLog.length ? weightLog[0].value : '-';
  const weightChange = weightLog.length > 1 ? (weightLog[0].value - weightLog[1].value).toFixed(1) : '-';
  const lastSleep = sleepLog.length ? sleepLog[0].hours.toFixed(1) : '-';
  const avg7Sleep = sleepLog.length ? (sleepLog.slice(0, 7).reduce((a: number, b: any) => a + b.hours, 0) / Math.min(7, sleepLog.length)).toFixed(1) : '0';

  const devTypes = ['alcohol', 'extra-snack', 'off-diet', 'junk-food', 'sugary-drink', 'other'];
  const devLabels: Record<string, string> = { 'alcohol': '🍷 Alcohol', 'extra-snack': '🍪 Extra Snack', 'off-diet': '🍕 Off-Diet', 'junk-food': '🍔 Junk Food', 'sugary-drink': '🥤 Sugary Drink', 'other': '📝 Other' };
  const devColors: Record<string, string> = { 'alcohol': Colors.purple, 'extra-snack': Colors.orange, 'off-diet': Colors.red, 'junk-food': Colors.red, 'sugary-drink': Colors.cyan, 'other': Colors.textMuted };

  return (
    <ScrollView style={styles.container}>
      <Card title="Fitness Stats">
        <View style={styles.statsRow}>
          <View style={styles.statBox}><Text style={styles.statVal}>{currentWeight}</Text><Text style={styles.statLabel}>CURRENT (kg)</Text></View>
          <View style={styles.statBox}><Text style={[styles.statVal, { color: Colors.textSecondary }]}>{targetWeight || '-'}</Text><Text style={styles.statLabel}>TARGET</Text></View>
          <View style={styles.statBox}><Text style={[styles.statVal, { color: Colors.orange }]}>{weightChange}</Text><Text style={styles.statLabel}>CHANGE</Text></View>
        </View>
        <View style={[styles.statsRow, { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: Colors.border }]}>
          <View style={styles.statBox}><Text style={[styles.statVal, { color: Colors.purple }]}>{lastSleep}</Text><Text style={styles.statLabel}>LAST (h)</Text></View>
          <View style={styles.statBox}><Text style={[styles.statVal, { color: Colors.textSecondary }]}>{targetSleep}</Text><Text style={styles.statLabel}>TARGET</Text></View>
          <View style={styles.statBox}><Text style={[styles.statVal, { color: Colors.accentLight }]}>{avg7Sleep}</Text><Text style={styles.statLabel}>7-DAY AVG</Text></View>
        </View>
        <View style={styles.btnRow}>
          <Button title="Log Weight" size="sm" variant="outline" onPress={() => { setWDate(TODAY()); setWValue(''); setWeightModal(true); }} />
          <Button title="Log Sleep" size="sm" variant="outline" onPress={() => { setSDate(TODAY()); setSBedtime(''); setSWaketime(''); setSleepModal(true); }} />
        </View>
      </Card>

      <Card title="Today's Meals">
        {['breakfast', 'lunch', 'snack', 'dinner'].map(type => (
          <View key={type} style={styles.mealSlot}>
            <Text style={styles.mealLabel}>{type.toUpperCase()}</Text>
            <TextInput style={styles.mealInput} value={meals[type] || ''} placeholder="Log food..." placeholderTextColor={Colors.textMuted} onChangeText={(val) => saveMealItem(type, val)} />
          </View>
        ))}
      </Card>

      <Card title="Diet Deviations" headerRight={<Button title="+ Log" size="sm" onPress={() => setDevModal(true)} />}>
        {deviations.length === 0 ? (
          <Text style={{ color: Colors.green, fontSize: 13 }}>Clean record!</Text>
        ) : deviations.slice(0, 15).map(d => (
          <TouchableOpacity key={d.id} style={styles.devEntry} onLongPress={() => deleteDev(d.id)}>
            <Text style={{ fontSize: 18 }}>{(devLabels[d.type] || '📝').split(' ')[0]}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.devTitle}>{d.desc}</Text>
              <Text style={styles.devMeta}>{d.date} {d.time ? formatTime12(d.time) : ''}{d.notes ? ' · ' + d.notes : ''}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </Card>

      {weightData && <Card title="Weight Trend"><LineChart data={weightData} width={screenW} height={180} chartConfig={chartCfg} bezier style={{ borderRadius: 12 }} /></Card>}
      {sleepData && <Card title="Sleep Trends"><LineChart data={sleepData} width={screenW} height={180} chartConfig={chartCfg} bezier style={{ borderRadius: 12 }} /></Card>}

      <Card title="Cigarettes Today"><Text style={[styles.statVal, { color: Colors.red, fontSize: 28, textAlign: 'center', paddingVertical: 10 }]}>{cigCount}</Text></Card>

      <ModalSheet visible={weightModal} onClose={() => setWeightModal(false)} title="Log Weight">
        <FormField label="Date" value={wDate} onChangeText={setWDate} placeholder="YYYY-MM-DD" />
        <FormField label="Weight (kg)" value={wValue} onChangeText={setWValue} placeholder="65.0" keyboardType="decimal-pad" />
        <View style={styles.modalActions}><Button title="Cancel" variant="outline" onPress={() => setWeightModal(false)} /><Button title="Save" onPress={saveWeight} /></View>
      </ModalSheet>

      <ModalSheet visible={sleepModal} onClose={() => setSleepModal(false)} title="Log Sleep">
        <FormField label="Date" value={sDate} onChangeText={setSDate} placeholder="YYYY-MM-DD" />
        <FormField label="Bedtime (HH:MM)" value={sBedtime} onChangeText={setSBedtime} placeholder="23:15" />
        <FormField label="Wake Time (HH:MM)" value={sWaketime} onChangeText={setSWaketime} placeholder="06:30" />
        <View style={styles.modalActions}><Button title="Cancel" variant="outline" onPress={() => setSleepModal(false)} /><Button title="Save" onPress={saveSleep} /></View>
      </ModalSheet>

      <ModalSheet visible={devModal} onClose={() => setDevModal(false)} title="Log Diet Deviation">
        <FormField label="Type">
          <View style={styles.catGrid}>
            {devTypes.map(t => (
              <TouchableOpacity key={t} style={[styles.catBtn, devType === t && { borderColor: devColors[t], backgroundColor: (devColors[t] || '#fff') + '20' }]} onPress={() => setDevType(t)}>
                <Text style={[styles.catBtnText, { color: devColors[t] }]}>{devLabels[t]}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </FormField>
        <FormField label="What did you have?" value={devDesc} onChangeText={setDevDesc} placeholder="e.g. 2 beers, pizza slice..." />
        <FormField label="Notes" value={devNotes} onChangeText={setDevNotes} placeholder="Context, how you felt..." />
        <View style={styles.modalActions}><Button title="Cancel" variant="outline" onPress={() => setDevModal(false)} /><Button title="Log It" onPress={saveDev} /></View>
      </ModalSheet>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: 14, paddingTop: 8 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statBox: { alignItems: 'center' },
  statVal: { color: Colors.text, fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  statLabel: { color: Colors.textMuted, fontSize: 8, fontWeight: '700', marginTop: 4, letterSpacing: 1, textTransform: 'uppercase' as const },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  mealSlot: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12, marginBottom: 4 },
  mealLabel: { color: Colors.textMuted, fontSize: 9, fontWeight: '700', width: 70, textTransform: 'uppercase' as const, letterSpacing: 0.8 },
  mealInput: { flex: 1, color: Colors.text, fontSize: 14, backgroundColor: Colors.surface, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  devEntry: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12, marginBottom: 4 },
  devTitle: { color: Colors.text, fontSize: 14, fontWeight: '600' },
  devMeta: { color: Colors.textMuted, fontSize: 10, marginTop: 2 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap' as const, gap: 8 },
  catBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: Colors.border },
  catBtnText: { fontSize: 12, fontWeight: '600' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10, marginBottom: 20 },
});
