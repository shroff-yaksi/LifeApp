import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { BarChart } from 'react-native-chart-kit';
import { Colors, SKILL_LIST } from '../../src/constants/theme';
import { TODAY, addDays, getWeekStart, uid } from '../../src/utils/helpers';
import { getData, setData } from '../../src/utils/storage';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { ProgressBar } from '../../src/components/ProgressBar';
import { ModalSheet } from '../../src/components/ModalSheet';
import { FormField } from '../../src/components/FormField';

const screenW = Dimensions.get('window').width - 48;
type SkillLog = { id: string; skill: string; hours: number; notes: string; date: string; createdAt: string };
type Assessment = { id: string; skill: string; level: number; date: string };

export default function SkillsScreen() {
  const [logs, setLogs] = useState<SkillLog[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [practiceModal, setPracticeModal] = useState(false);
  const [assessModal, setAssessModal] = useState(false);
  const [selSkill, setSelSkill] = useState(SKILL_LIST[0]);
  const [hours, setHours] = useState('');
  const [notes, setNotes] = useState('');
  const [ratings, setRatings] = useState<Record<string, number>>({});

  const loadData = useCallback(async () => {
    setLogs(await getData('skillLogs', []));
    const a = await getData<Assessment[]>('skillAssessments', []);
    setAssessments(a);
    const latest: Record<string, number> = {};
    a.forEach(x => { if (!latest[x.skill]) latest[x.skill] = x.level; });
    setRatings(Object.fromEntries(SKILL_LIST.map(s => [s, latest[s] || 5])));
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const savePractice = async () => {
    const h = parseFloat(hours); if (!h || h <= 0) return;
    const updated = [...logs, { id: uid(), skill: selSkill, hours: h, notes, date: TODAY(), createdAt: new Date().toISOString() }];
    setLogs(updated); await setData('skillLogs', updated); setPracticeModal(false); setHours(''); setNotes('');
  };

  const saveAssessment = async () => {
    const newEntries = SKILL_LIST.map(s => ({ id: uid(), skill: s, level: ratings[s] || 5, date: TODAY() }));
    const updated = [...assessments, ...newEntries];
    setAssessments(updated); await setData('skillAssessments', updated); setAssessModal(false);
  };

  const weekStart = getWeekStart(TODAY());
  const weeklyChart = (() => {
    const labels: string[] = [], values: number[] = [];
    for (let w = 3; w >= 0; w--) {
      let total = 0;
      for (let d = 0; d < 7; d++) total += logs.filter(l => l.date === addDays(TODAY(), -(w * 7 + d))).reduce((s, l) => s + l.hours, 0);
      labels.push(w === 0 ? 'This Wk' : `W-${w}`);
      values.push(total);
    }
    return { labels, datasets: [{ data: values.length ? values : [0] }] };
  })();

  const latestAssess: Record<string, Assessment> = {};
  assessments.forEach(a => { if (!latestAssess[a.skill] || a.date > latestAssess[a.skill].date) latestAssess[a.skill] = a; });
  const recentLogs = [...logs].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 20);

  return (
    <ScrollView style={styles.container}>
      <Card title="Skill Practice" headerRight={<Button title="+ Log" size="sm" onPress={() => setPracticeModal(true)} />}>
        {SKILL_LIST.map(skill => {
          const totalHrs = logs.filter(l => l.skill === skill).reduce((s, l) => s + l.hours, 0);
          const thisWeek = logs.filter(l => l.skill === skill && l.date >= weekStart).reduce((s, l) => s + l.hours, 0);
          return (
            <View key={skill} style={styles.skillRow}>
              <View style={{ flex: 1 }}><Text style={styles.skillName}>{skill}</Text><Text style={styles.skillWeek}>This week: {thisWeek.toFixed(1)}h</Text></View>
              <View style={{ alignItems: 'flex-end' }}><Text style={styles.skillTotal}>{totalHrs.toFixed(1)}h</Text><Text style={styles.skillTotalLabel}>Total</Text></View>
            </View>
          );
        })}
      </Card>

      <Card title="Skill Assessment" headerRight={<Button title="Rate" size="sm" variant="outline" onPress={() => setAssessModal(true)} />}>
        {SKILL_LIST.map(skill => {
          const level = latestAssess[skill]?.level || 0;
          return (
            <View key={skill} style={styles.assessItem}>
              <View style={styles.assessHeader}><Text style={styles.assessName}>{skill}</Text><Text style={styles.assessLevel}>{level || '-'}/10</Text></View>
              <ProgressBar progress={level * 10} color={Colors.yellow} height={5} />
            </View>
          );
        })}
      </Card>

      <Card title="Practice Log">
        {recentLogs.length === 0 ? <Text style={styles.emptyText}>No practice yet.</Text> : recentLogs.map(l => (
          <View key={l.id} style={styles.logEntry}>
            <View style={{ flex: 1 }}><Text style={styles.logSkill}>{l.skill} <Text style={styles.logDate}>{l.date}</Text></Text>{l.notes ? <Text style={styles.logNotes}>{l.notes}</Text> : null}</View>
            <Text style={styles.logHours}>{l.hours}h</Text>
          </View>
        ))}
      </Card>

      <Card title="Weekly Skill Hours">
        <BarChart data={weeklyChart} width={screenW} height={180} yAxisLabel="" yAxisSuffix="h" chartConfig={{ backgroundGradientFrom: '#1c1b1d', backgroundGradientTo: '#1c1b1d', color: () => Colors.yellow, labelColor: () => Colors.textMuted, decimalPlaces: 1, propsForBackgroundLines: { stroke: 'rgba(255,255,255,0.04)' } }} style={{ borderRadius: 12 }} />
      </Card>

      <ModalSheet visible={practiceModal} onClose={() => setPracticeModal(false)} title="Log Skill Practice">
        <FormField label="Skill">
          <View style={styles.catGrid}>
            {SKILL_LIST.map(s => (
              <TouchableOpacity key={s} style={[styles.catBtn, selSkill === s && { borderColor: Colors.yellow, backgroundColor: Colors.yellowBg }]} onPress={() => setSelSkill(s)}>
                <Text style={[styles.catBtnText, selSkill === s && { color: Colors.yellow }]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </FormField>
        <FormField label="Hours" value={hours} onChangeText={setHours} placeholder="2.0" keyboardType="decimal-pad" />
        <FormField label="What did you practice?" value={notes} onChangeText={setNotes} placeholder="Scales, song, choreography..." />
        <View style={styles.modalActions}><Button title="Cancel" variant="outline" onPress={() => setPracticeModal(false)} /><Button title="Save" onPress={savePractice} /></View>
      </ModalSheet>

      <ModalSheet visible={assessModal} onClose={() => setAssessModal(false)} title="Skill Assessment">
        <Text style={styles.assessInstruction}>Rate your current level (1-10)</Text>
        {SKILL_LIST.map(skill => (
          <View key={skill} style={styles.ratingRow}>
            <Text style={styles.ratingLabel}>{skill}</Text>
            <View style={styles.ratingBtns}>
              {[1,2,3,4,5,6,7,8,9,10].map(n => (
                <TouchableOpacity key={n} style={[styles.ratingBtn, (ratings[skill] || 5) >= n && { backgroundColor: Colors.yellow + '40' }]} onPress={() => setRatings({ ...ratings, [skill]: n })}>
                  <Text style={[styles.ratingBtnText, (ratings[skill] || 5) >= n && { color: Colors.yellow }]}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
        <View style={styles.modalActions}><Button title="Cancel" variant="outline" onPress={() => setAssessModal(false)} /><Button title="Save" onPress={saveAssessment} /></View>
      </ModalSheet>
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: 14, paddingTop: 8 },
  skillRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderLeftWidth: 3, borderLeftColor: Colors.yellow, borderRadius: 14, padding: 12, paddingLeft: 12, marginBottom: 6 },
  skillName: { color: Colors.text, fontSize: 15, fontWeight: '800', letterSpacing: -0.3 },
  skillWeek: { color: Colors.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 3 },
  skillTotal: { color: Colors.yellow, fontSize: 20, fontWeight: '800' },
  skillTotalLabel: { color: Colors.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  assessItem: { backgroundColor: Colors.surface, borderRadius: 14, padding: 12, marginBottom: 6 },
  assessHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  assessName: { color: Colors.text, fontSize: 13, fontWeight: '700' },
  assessLevel: { color: Colors.yellow, fontSize: 13, fontWeight: '700' },
  emptyText: { color: Colors.textMuted, fontSize: 13 },
  logEntry: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 14, padding: 12, marginBottom: 6 },
  logSkill: { color: Colors.text, fontSize: 14, fontWeight: '700' },
  logDate: { color: Colors.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  logNotes: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  logHours: { color: Colors.yellow, fontSize: 15, fontWeight: '800' },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: Colors.surfaceHighest },
  catBtnText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10, marginBottom: 20 },
  assessInstruction: { color: Colors.textSecondary, fontSize: 13, marginBottom: 16 },
  ratingRow: { backgroundColor: Colors.surface, borderRadius: 14, padding: 12, marginBottom: 6 },
  ratingLabel: { color: Colors.text, fontSize: 14, fontWeight: '700', letterSpacing: -0.3, marginBottom: 8 },
  ratingBtns: { flexDirection: 'row', gap: 4 },
  ratingBtn: { width: 28, height: 28, borderRadius: 6, backgroundColor: Colors.surfaceHighest, alignItems: 'center', justifyContent: 'center' },
  ratingBtnText: { color: Colors.textMuted, fontSize: 11, fontWeight: '700' },
});
