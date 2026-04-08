import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Dimensions, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { BarChart } from 'react-native-chart-kit';
import { Colors, LEARNING_ROTATION, TAB_COLORS } from '../../src/constants/theme';
import { TODAY, addDays, getDayOfWeek, uid } from '../../src/utils/helpers';
import { getData, setData } from '../../src/utils/storage';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { ProgressBar } from '../../src/components/ProgressBar';
import { ModalSheet } from '../../src/components/ModalSheet';
import { FormField } from '../../src/components/FormField';

const C = TAB_COLORS.learning; // orange
const screenW = Dimensions.get('window').width - 48;

type Domain = { id: string; name: string };
type StudyLog = { id: string; domainId: string; domainName: string; hours: number; topic: string; date: string; createdAt: string };

export default function LearningScreen() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [logs, setLogs] = useState<StudyLog[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selDomain, setSelDomain] = useState('');
  const [hours, setHours] = useState('');
  const [topic, setTopic] = useState('');
  const [newDomain, setNewDomain] = useState('');

  const defaultDomains = [
    { id: 'ld1', name: 'Stock Market' }, { id: 'ld2', name: 'Forex' },
    { id: 'ld3', name: 'Quantitative Finance' }, { id: 'ld4', name: 'Artificial Intelligence' },
    { id: 'ld5', name: 'Research Work' },
  ];

  const loadData = useCallback(async () => {
    setDomains(await getData('learningDomains', defaultDomains));
    setLogs(await getData('studyLogs', []));
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const dow = getDayOfWeek(TODAY());
  const rotation = dow >= 1 && dow <= 5 ? LEARNING_ROTATION[dow] : null;

  const adjustStudy = async (domainId: string, domainName: string, delta: number) => {
    const current = [...logs];
    const idx = current.findIndex(l => l.domainId === domainId && l.date === TODAY());
    const currentHours = idx >= 0 ? current[idx].hours : 0;
    const newHours = Math.max(0, Math.round((currentHours + delta) * 2) / 2);
    if (idx >= 0) {
      if (newHours === 0) current.splice(idx, 1);
      else current[idx] = { ...current[idx], hours: newHours };
    } else if (newHours > 0) {
      current.push({ id: uid(), domainId, domainName, hours: newHours, topic: '', date: TODAY(), createdAt: new Date().toISOString() });
    }
    setLogs(current);
    await setData('studyLogs', current);
  };

  const saveLog = async () => {
    const h = parseFloat(hours);
    if (!selDomain) { Alert.alert('Select Course', 'Please select a course first.'); return; }
    if (!h || h <= 0) { Alert.alert('Invalid Hours', 'Enter a positive number of hours.'); return; }
    const domain = domains.find(d => d.id === selDomain);
    // Add as a separate detailed log entry (doesn't merge with stepper)
    const updated = [...logs, { id: uid(), domainId: selDomain, domainName: domain?.name || '', hours: h, topic, date: TODAY(), createdAt: new Date().toISOString() }];
    setLogs(updated);
    await setData('studyLogs', updated);
    setModalOpen(false); setHours(''); setTopic('');
  };

  const addDomainFn = async () => {
    if (!newDomain.trim()) return;
    const updated = [...domains, { id: uid(), name: newDomain.trim() }];
    setDomains(updated); await setData('learningDomains', updated); setNewDomain('');
  };

  const deleteDomain = (id: string, name: string) => {
    Alert.alert('Remove Course', `Remove "${name}" from your course list?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          const updated = domains.filter(d => d.id !== id);
          setDomains(updated); await setData('learningDomains', updated);
        },
      },
    ]);
  };

  const weeklyData = (() => {
    const labels: string[] = [], values: number[] = [];
    for (let w = 3; w >= 0; w--) {
      let total = 0;
      for (let d = 0; d < 7; d++) total += logs.filter(l => l.date === addDays(TODAY(), -(w * 7 + d))).reduce((s, l) => s + l.hours, 0);
      labels.push(w === 0 ? 'This Wk' : `W-${w}`);
      values.push(total);
    }
    return { labels, datasets: [{ data: values.length ? values : [0] }] };
  })();

  const recentLogs = [...logs].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 20);
  const dayNames = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Today's Study Hours */}
      <Card
        title="Today's Study"
        accentColor={C}
        headerRight={
          <Button title="+ Notes" size="sm" variant="outline" color={C}
            onPress={() => { setSelDomain(domains[0]?.id || ''); setModalOpen(true); }} />
        }
      >
        {domains.map(d => {
          const todayH = logs.filter(l => l.domainId === d.id && l.date === TODAY()).reduce((s, l) => s + l.hours, 0);
          return (
            <View key={d.id} style={styles.actRow}>
              <Text style={styles.actLabel}>{d.name}</Text>
              <View style={styles.actStepper}>
                <TouchableOpacity style={styles.stepBtn} onPress={() => adjustStudy(d.id, d.name, -0.5)}>
                  <Text style={styles.stepBtnTxt}>−</Text>
                </TouchableOpacity>
                <Text style={[styles.actHours, { color: todayH > 0 ? C : Colors.textMuted }]}>
                  {todayH.toFixed(1)}h
                </Text>
                <TouchableOpacity style={[styles.stepBtn, { backgroundColor: C + '25' }]} onPress={() => adjustStudy(d.id, d.name, 0.5)}>
                  <Text style={[styles.stepBtnTxt, { color: C }]}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
        {domains.length === 0 && <Text style={styles.emptyText}>Add courses below to start tracking.</Text>}
      </Card>

      {/* Today's Rotation */}
      <Card
        title="Today's Rotation"
        accentColor={C}
      >
        {rotation ? (
          <>
            <Text style={styles.dayLabel}>{dow >= 1 && dow <= 7 ? dayNames[dow] : ''}</Text>
            {rotation.map((name, i) => (
              <View key={i} style={[styles.rotCard, { borderLeftColor: i === 0 ? C : Colors.accentLight }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rotTitle}>{name}</Text>
                  <Text style={styles.rotTime}>Block {i + 1}  ·  {i === 0 ? '9:00–9:40 PM' : '9:40–10:20 PM'}</Text>
                </View>
                <View style={[styles.blockBadge, { backgroundColor: (i === 0 ? C : Colors.accentLight) + '20' }]}>
                  <Text style={[styles.blockBadgeTxt, { color: i === 0 ? C : Colors.accentLight }]}>B{i + 1}</Text>
                </View>
              </View>
            ))}
          </>
        ) : (
          <View style={styles.weekendBanner}>
            <Text style={{ fontSize: 30 }}>{dow === 6 ? '🎯' : '🔬'}</Text>
            <Text style={styles.weekendText}>{dow === 6 ? 'Saturday: Focus on Skills!' : 'Sunday: Research Work (1:30–3:30 PM)'}</Text>
          </View>
        )}
      </Card>

      {/* Study Progress */}
      <Card title="Study Progress" accentColor={C}>
        {domains.length === 0 ? (
          <Text style={styles.emptyText}>No courses yet. Add courses below.</Text>
        ) : domains.map(d => {
          const th = logs.filter(l => l.domainId === d.id).reduce((s, l) => s + l.hours, 0);
          const pct = Math.min(100, (th / 50) * 100);
          return (
            <View key={d.id} style={styles.progressItem}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressName}>{d.name}</Text>
                <Text style={[styles.progressHours, { color: C }]}>{th.toFixed(1)} hrs</Text>
              </View>
              <ProgressBar progress={pct} color={C} height={5} />
            </View>
          );
        })}
      </Card>

      {/* Manage Courses */}
      <Card title="Manage Courses" accentColor={Colors.accentLight}>
        <View style={styles.addRow}>
          <TextInput
            style={styles.addInput}
            value={newDomain}
            onChangeText={setNewDomain}
            placeholder="New course name..."
            placeholderTextColor={Colors.textMuted}
            onSubmitEditing={addDomainFn}
            returnKeyType="done"
          />
          <Button title="+ Add" size="sm" color={C} onPress={addDomainFn} />
        </View>
        {domains.map(d => (
          <View key={d.id} style={styles.courseItem}>
            <View style={[styles.courseDot, { backgroundColor: C }]} />
            <Text style={styles.courseName}>{d.name}</Text>
            <TouchableOpacity onPress={() => deleteDomain(d.id, d.name)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={{ color: Colors.red, fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
      </Card>

      {/* Recent Logs */}
      <Card title="Recent Study Log" accentColor={Colors.green}>
        {recentLogs.length === 0 ? (
          <Text style={styles.emptyText}>No logs yet. Start studying and log your hours!</Text>
        ) : recentLogs.map(l => (
          <View key={l.id} style={styles.logEntry}>
            <View style={[styles.logIconBox, { backgroundColor: C + '20' }]}>
              <Text style={{ fontSize: 16 }}>📖</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.logCourse}>{l.domainName}</Text>
              {l.topic ? <Text style={styles.logTopic}>{l.topic}</Text> : null}
              <Text style={styles.logDate}>{l.date}</Text>
            </View>
            <Text style={[styles.logHours, { color: C }]}>{l.hours}h</Text>
          </View>
        ))}
      </Card>

      {/* Weekly Chart */}
      <Card title="Weekly Study Hours" accentColor={C}>
        <BarChart
          data={weeklyData}
          width={screenW}
          height={180}
          yAxisLabel=""
          yAxisSuffix="h"
          chartConfig={{
            backgroundGradientFrom: Colors.surface,
            backgroundGradientTo: Colors.surface,
            color: (op = 1) => `rgba(251,146,60,${op})`,
            labelColor: () => Colors.textMuted,
            decimalPlaces: 1,
            propsForBackgroundLines: { stroke: 'rgba(255,255,255,0.04)' },
          }}
          style={{ borderRadius: 12, overflow: 'hidden' }}
        />
      </Card>

      {/* Log Hours Modal */}
      <ModalSheet visible={modalOpen} onClose={() => setModalOpen(false)} title="Log Study Hours" accentColor={C}>
        <FormField label="Course">
          <View style={styles.catGrid}>
            {domains.map(d => (
              <TouchableOpacity
                key={d.id}
                style={[styles.catBtn, selDomain === d.id && { borderColor: C, backgroundColor: C + '20' }]}
                onPress={() => setSelDomain(d.id)}
              >
                <Text style={[styles.catBtnText, selDomain === d.id && { color: C }]}>{d.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </FormField>
        <FormField label="Hours" value={hours} onChangeText={setHours} placeholder="1.5" keyboardType="decimal-pad" />
        <FormField label="Topic / Notes" value={topic} onChangeText={setTopic} placeholder="What did you study?" />
        <View style={styles.modalActions}>
          <Button title="Cancel" variant="outline" onPress={() => setModalOpen(false)} />
          <Button title="Save" onPress={saveLog} color={C} />
        </View>
      </ModalSheet>
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: 14, paddingTop: 8 },
  actRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, gap: 10 },
  actLabel: { flex: 1, color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  actStepper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: Colors.surfaceHigh, alignItems: 'center', justifyContent: 'center' },
  stepBtnTxt: { color: Colors.textSecondary, fontSize: 18, fontWeight: '700', lineHeight: 22 },
  actHours: { fontSize: 16, fontWeight: '800', minWidth: 42, textAlign: 'center', letterSpacing: -0.3 },
  dayLabel: { color: Colors.textMuted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  rotCard: {
    backgroundColor: Colors.surface,
    borderLeftWidth: 3,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rotTitle: { color: Colors.text, fontSize: 15, fontWeight: '800', letterSpacing: -0.3 },
  rotTime: { color: Colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginTop: 3 },
  blockBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  blockBadgeTxt: { fontSize: 13, fontWeight: '800' },
  weekendBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  weekendText: { color: Colors.textSecondary, fontSize: 14, fontWeight: '600', flex: 1 },
  progressItem: { backgroundColor: Colors.surface, borderRadius: 14, padding: 12, marginBottom: 8 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressName: { color: Colors.text, fontSize: 13, fontWeight: '700' },
  progressHours: { fontSize: 13, fontWeight: '700' },
  emptyText: { color: Colors.textMuted, fontSize: 13, textAlign: 'center', paddingVertical: 8 },
  addRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  addInput: { flex: 1, backgroundColor: Colors.surface, borderRadius: 12, color: Colors.text, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, borderWidth: 1, borderColor: Colors.border },
  courseItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 12, padding: 12, marginBottom: 6, gap: 10 },
  courseDot: { width: 8, height: 8, borderRadius: 4 },
  courseName: { color: Colors.text, fontSize: 14, fontWeight: '600', flex: 1 },
  logEntry: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 14, padding: 12, marginBottom: 6, gap: 10 },
  logIconBox: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  logCourse: { color: Colors.text, fontSize: 13, fontWeight: '700' },
  logTopic: { color: Colors.textSecondary, fontSize: 12, marginTop: 1 },
  logDate: { color: Colors.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 0.5, marginTop: 2 },
  logHours: { fontSize: 16, fontWeight: '800' },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, backgroundColor: Colors.surfaceHigh, borderWidth: 1, borderColor: Colors.border },
  catBtnText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10, marginBottom: 20 },
});
