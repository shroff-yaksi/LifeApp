import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Dimensions } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { BarChart } from 'react-native-chart-kit';
import { Colors, LEARNING_ROTATION } from '../../src/constants/theme';
import { TODAY, addDays, getDayOfWeek, uid } from '../../src/utils/helpers';
import { getData, setData } from '../../src/utils/storage';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { ProgressBar } from '../../src/components/ProgressBar';
import { ModalSheet } from '../../src/components/ModalSheet';
import { FormField } from '../../src/components/FormField';

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

  const saveLog = async () => {
    const h = parseFloat(hours); if (!selDomain || !h || h <= 0) return;
    const domain = domains.find(d => d.id === selDomain);
    const updated = [...logs, { id: uid(), domainId: selDomain, domainName: domain?.name || '', hours: h, topic, date: TODAY(), createdAt: new Date().toISOString() }];
    setLogs(updated); await setData('studyLogs', updated); setModalOpen(false); setHours(''); setTopic('');
  };

  const addDomainFn = async () => {
    if (!newDomain.trim()) return;
    const updated = [...domains, { id: uid(), name: newDomain.trim() }];
    setDomains(updated); await setData('learningDomains', updated); setNewDomain('');
  };

  const deleteDomain = async (id: string) => {
    const updated = domains.filter(d => d.id !== id);
    setDomains(updated); await setData('learningDomains', updated);
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

  return (
    <ScrollView style={styles.container}>
      <Card title="Today's Rotation" headerRight={<Button title="+ Log Hours" size="sm" onPress={() => { setSelDomain(domains[0]?.id || ''); setModalOpen(true); }} />}>
        {rotation ? rotation.map((name, i) => (
          <View key={i} style={styles.rotCard}><Text style={styles.rotTitle}>{name}</Text><Text style={styles.rotTime}>Block {i + 1}: {i === 0 ? '9:00 - 9:40 PM' : '9:40 - 10:20 PM'}</Text></View>
        )) : <Text style={styles.rotWeekend}>{dow === 6 ? 'Saturday: Focus on Skills!' : 'Sunday: Research Work (1:30 - 3:30 PM)'}</Text>}
      </Card>

      <Card title="Study Progress">
        {domains.map(d => {
          const th = logs.filter(l => l.domainId === d.id).reduce((s, l) => s + l.hours, 0);
          return (
            <View key={d.id} style={styles.progressItem}>
              <View style={styles.progressHeader}><Text style={styles.progressName}>{d.name}</Text><Text style={styles.progressHours}>{th.toFixed(1)} hrs</Text></View>
              <ProgressBar progress={Math.min(100, (th / 50) * 100)} color={Colors.orange} height={5} />
            </View>
          );
        })}
      </Card>

      <Card title="Recent Study Log">
        {recentLogs.length === 0 ? <Text style={styles.emptyText}>No logs yet.</Text> : recentLogs.map(l => (
          <View key={l.id} style={styles.logEntry}>
            <View style={{ flex: 1 }}><Text style={styles.logCourse}>{l.domainName} <Text style={styles.logDate}>{l.date}</Text></Text>{l.topic ? <Text style={styles.logTopic}>{l.topic}</Text> : null}</View>
            <Text style={styles.logHours}>{l.hours}h</Text>
          </View>
        ))}
      </Card>

      <Card title="Manage Courses">
        <View style={styles.addRow}>
          <TextInput style={styles.addInput} value={newDomain} onChangeText={setNewDomain} placeholder="New course..." placeholderTextColor={Colors.textMuted} />
          <Button title="+ Add" size="sm" onPress={addDomainFn} />
        </View>
        {domains.map(d => (
          <View key={d.id} style={styles.courseItem}><Text style={styles.courseName}>{d.name}</Text><TouchableOpacity onPress={() => deleteDomain(d.id)}><Text style={{ color: Colors.red, fontSize: 16 }}>✕</Text></TouchableOpacity></View>
        ))}
      </Card>

      <Card title="Weekly Study Hours">
        <BarChart data={weeklyData} width={screenW} height={180} yAxisLabel="" yAxisSuffix="h" chartConfig={{ backgroundGradientFrom: '#1c1b1d', backgroundGradientTo: '#1c1b1d', color: () => Colors.orange, labelColor: () => Colors.textMuted, decimalPlaces: 1, propsForBackgroundLines: { stroke: 'rgba(255,255,255,0.04)' } }} style={{ borderRadius: 12 }} />
      </Card>

      <ModalSheet visible={modalOpen} onClose={() => setModalOpen(false)} title="Log Study Hours">
        <FormField label="Course">
          <View style={styles.catGrid}>
            {domains.map(d => (
              <TouchableOpacity key={d.id} style={[styles.catBtn, selDomain === d.id && { borderColor: Colors.orange, backgroundColor: Colors.orangeBg }]} onPress={() => setSelDomain(d.id)}>
                <Text style={[styles.catBtnText, selDomain === d.id && { color: Colors.orange }]}>{d.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </FormField>
        <FormField label="Hours" value={hours} onChangeText={setHours} placeholder="1.5" keyboardType="decimal-pad" />
        <FormField label="Topic / Notes" value={topic} onChangeText={setTopic} placeholder="What did you study?" />
        <View style={styles.modalActions}><Button title="Cancel" variant="outline" onPress={() => setModalOpen(false)} /><Button title="Save" onPress={saveLog} /></View>
      </ModalSheet>
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: 14, paddingTop: 8 },
  rotCard: { backgroundColor: Colors.surface, borderLeftWidth: 3, borderLeftColor: Colors.orange, borderRadius: 14, padding: 14, marginBottom: 8 },
  rotTitle: { color: Colors.text, fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  rotTime: { color: Colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 3 },
  rotWeekend: { color: Colors.textSecondary, fontSize: 14, fontStyle: 'italic' },
  progressItem: { backgroundColor: Colors.surface, borderRadius: 14, padding: 12, marginBottom: 8 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressName: { color: Colors.text, fontSize: 13, fontWeight: '700' },
  progressHours: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  emptyText: { color: Colors.textMuted, fontSize: 13 },
  logEntry: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 14, padding: 12, marginBottom: 6 },
  logCourse: { color: Colors.text, fontSize: 14, fontWeight: '700' },
  logDate: { color: Colors.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  logTopic: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  logHours: { color: Colors.orange, fontSize: 15, fontWeight: '800' },
  addRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  addInput: { flex: 1, backgroundColor: Colors.bg, borderRadius: 10, color: Colors.text, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14 },
  courseItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 14, padding: 12, marginBottom: 6 },
  courseName: { color: Colors.text, fontSize: 14, fontWeight: '600' },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: Colors.surfaceHighest },
  catBtnText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10, marginBottom: 20 },
});
