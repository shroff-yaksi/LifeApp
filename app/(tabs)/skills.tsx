import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Dimensions, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { BarChart } from 'react-native-chart-kit';
import { Colors, SKILL_LIST as DEFAULT_SKILL_LIST, TAB_COLORS } from '../../src/constants/theme';
import { TODAY, addDays, getWeekStart, uid } from '../../src/utils/helpers';
import { getData, setData } from '../../src/utils/storage';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { ProgressBar } from '../../src/components/ProgressBar';
import { ModalSheet } from '../../src/components/ModalSheet';
import { FormField } from '../../src/components/FormField';

const C = TAB_COLORS.skills; // yellow
const screenW = Dimensions.get('window').width - 48;

type SkillLog = { id: string; skill: string; hours: number; notes: string; date: string; createdAt: string };
type Assessment = { id: string; skill: string; level: number; date: string };

const SKILL_EMOJIS: Record<string, string> = {
  Guitar: '🎸', Kathak: '💃', Cooking: '🍳', Sports: '⚽',
};
function getSkillEmoji(skill: string): string {
  return SKILL_EMOJIS[skill] || '⭐';
}

export default function SkillsScreen() {
  const [logDate, setLogDate] = useState(TODAY());
  const [skillList, setSkillList] = useState<string[]>(DEFAULT_SKILL_LIST);
  const [logs, setLogs] = useState<SkillLog[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [practiceModal, setPracticeModal] = useState(false);
  const [assessModal, setAssessModal] = useState(false);
  const [selSkill, setSelSkill] = useState('');
  const [hours, setHours] = useState('');
  const [notes, setNotes] = useState('');
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [newSkill, setNewSkill] = useState('');

  const loadData = useCallback(async () => {
    const skills = await getData<string[]>('customSkillList', DEFAULT_SKILL_LIST);
    setSkillList(skills);
    setLogs(await getData('skillLogs', []));
    const a = await getData<Assessment[]>('skillAssessments', []);
    setAssessments(a);
    const latest: Record<string, number> = {};
    a.forEach(x => { if (!latest[x.skill]) latest[x.skill] = x.level; });
    const ratingMap: Record<string, number> = {};
    skills.forEach(s => { ratingMap[s] = latest[s] || 5; });
    setRatings(ratingMap);
    if (!selSkill && skills.length) setSelSkill(skills[0]);
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const adjustSkill = async (skill: string, delta: number) => {
    const current = [...logs];
    const idx = current.findIndex(l => l.skill === skill && l.date === logDate);
    const currentHours = idx >= 0 ? current[idx].hours : 0;
    const newHours = Math.max(0, Math.round((currentHours + delta) * 2) / 2);
    if (idx >= 0) {
      if (newHours === 0) current.splice(idx, 1);
      else current[idx] = { ...current[idx], hours: newHours };
    } else if (newHours > 0) {
      current.push({ id: uid(), skill, hours: newHours, notes: '', date: logDate, createdAt: new Date().toISOString() });
    }
    setLogs(current);
    await setData('skillLogs', current);
  };

  const prevDay = () => setLogDate(d => addDays(d, -1));
  const nextDay = () => { if (logDate < TODAY()) setLogDate(d => addDays(d, 1)); };
  const dateLabel = logDate === TODAY() ? 'Today' : new Date(logDate + 'T12:00').toLocaleDateString('default', { weekday: 'short', month: 'short', day: 'numeric' });

  const savePractice = async () => {
    const h = parseFloat(hours);
    if (!selSkill) { Alert.alert('Select Skill', 'Please select a skill.'); return; }
    if (!h || h <= 0) { Alert.alert('Invalid Hours', 'Enter a positive number of hours.'); return; }
    const updated = [...logs, { id: uid(), skill: selSkill, hours: h, notes, date: TODAY(), createdAt: new Date().toISOString() }];
    setLogs(updated); await setData('skillLogs', updated); setPracticeModal(false); setHours(''); setNotes('');
  };

  const saveAssessment = async () => {
    const newEntries = skillList.map(s => ({ id: uid(), skill: s, level: ratings[s] || 5, date: TODAY() }));
    const updated = [...assessments, ...newEntries];
    setAssessments(updated); await setData('skillAssessments', updated); setAssessModal(false);
  };

  const addSkill = async () => {
    const s = newSkill.trim();
    if (!s) return;
    if (skillList.includes(s)) { Alert.alert('Exists', 'This skill is already in your list.'); return; }
    const updated = [...skillList, s];
    setSkillList(updated);
    setRatings(r => ({ ...r, [s]: 5 }));
    await setData('customSkillList', updated);
    setNewSkill('');
  };

  const removeSkill = (skill: string) => {
    Alert.alert('Remove Skill', `Remove "${skill}" from your skill list?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          const updated = skillList.filter(s => s !== skill);
          setSkillList(updated);
          await setData('customSkillList', updated);
        },
      },
    ]);
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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Date Navigator */}
      <View style={styles.dateNav}>
        <TouchableOpacity style={styles.dateNavBtn} onPress={prevDay}>
          <Text style={styles.dateNavArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.dateNavLabel}>{dateLabel}</Text>
        <TouchableOpacity style={[styles.dateNavBtn, logDate >= TODAY() && { opacity: 0.3 }]} onPress={nextDay} disabled={logDate >= TODAY()}>
          <Text style={styles.dateNavArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Skill Practice Overview */}
      <Card
        title="Today's Practice"
        accentColor={C}
        headerRight={<Button title="+ Notes" size="sm" variant="outline" color={C} onPress={() => { if (skillList.length) setSelSkill(skillList[0]); setPracticeModal(true); }} />}
      >
        {skillList.length === 0 ? (
          <Text style={styles.emptyText}>No skills yet. Add skills below.</Text>
        ) : skillList.map(skill => {
          const todayH = logs.filter(l => l.skill === skill && l.date === logDate).reduce((s, l) => s + l.hours, 0);
          const totalHrs = logs.filter(l => l.skill === skill).reduce((s, l) => s + l.hours, 0);
          const thisWeek = logs.filter(l => l.skill === skill && l.date >= weekStart).reduce((s, l) => s + l.hours, 0);
          return (
            <View key={skill} style={styles.skillRow}>
              <View style={[styles.skillIcon, { backgroundColor: C + '20' }]}>
                <Text style={{ fontSize: 20 }}>{getSkillEmoji(skill)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.skillName}>{skill}</Text>
                <Text style={styles.skillWeek}>Week: {thisWeek.toFixed(1)}h  ·  Total: {totalHrs.toFixed(1)}h</Text>
              </View>
              <View style={styles.actStepper}>
                <TouchableOpacity style={styles.stepBtn} onPress={() => adjustSkill(skill, -0.5)}>
                  <Text style={styles.stepBtnTxt}>−</Text>
                </TouchableOpacity>
                <Text style={[styles.actHours, { color: todayH > 0 ? C : Colors.textMuted }]}>
                  {todayH.toFixed(1)}h
                </Text>
                <TouchableOpacity style={[styles.stepBtn, { backgroundColor: C + '25' }]} onPress={() => adjustSkill(skill, 0.5)}>
                  <Text style={[styles.stepBtnTxt, { color: C }]}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </Card>

      {/* Skill Assessment */}
      <Card
        title="Skill Assessment"
        accentColor={C}
        headerRight={<Button title="Rate Now" size="sm" variant="outline" color={C} onPress={() => setAssessModal(true)} />}
      >
        {skillList.map(skill => {
          const level = latestAssess[skill]?.level || 0;
          return (
            <View key={skill} style={styles.assessItem}>
              <View style={styles.assessHeader}>
                <Text style={{ fontSize: 16, marginRight: 8 }}>{getSkillEmoji(skill)}</Text>
                <Text style={styles.assessName}>{skill}</Text>
                <Text style={[styles.assessLevel, { color: C }]}>{level || '–'}/10</Text>
              </View>
              <ProgressBar progress={level * 10} color={C} height={5} />
            </View>
          );
        })}
      </Card>

      {/* Manage Skills */}
      <Card title="Manage Skills" accentColor={Colors.accentLight}>
        <View style={styles.addRow}>
          <TextInput
            style={styles.addInput}
            value={newSkill}
            onChangeText={setNewSkill}
            placeholder="Add new skill..."
            placeholderTextColor={Colors.textMuted}
            onSubmitEditing={addSkill}
            returnKeyType="done"
          />
          <Button title="+ Add" size="sm" color={C} onPress={addSkill} />
        </View>
        {skillList.map(s => (
          <View key={s} style={styles.skillItem}>
            <Text style={{ fontSize: 16, marginRight: 8 }}>{getSkillEmoji(s)}</Text>
            <Text style={styles.skillItemName}>{s}</Text>
            <TouchableOpacity onPress={() => removeSkill(s)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={{ color: Colors.red, fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
      </Card>

      {/* Practice Log */}
      <Card title="Practice Log" accentColor={Colors.green}>
        {recentLogs.length === 0 ? (
          <Text style={styles.emptyText}>No practice logged yet.</Text>
        ) : recentLogs.map(l => (
          <View key={l.id} style={styles.logEntry}>
            <View style={[styles.logIcon, { backgroundColor: C + '20' }]}>
              <Text style={{ fontSize: 16 }}>{getSkillEmoji(l.skill)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.logSkill}>{l.skill}</Text>
              {l.notes ? <Text style={styles.logNotes}>{l.notes}</Text> : null}
              <Text style={styles.logDate}>{l.date}</Text>
            </View>
            <Text style={[styles.logHours, { color: C }]}>{l.hours}h</Text>
          </View>
        ))}
      </Card>

      {/* Weekly Chart */}
      <Card title="Weekly Skill Hours" accentColor={C}>
        <BarChart
          data={weeklyChart}
          width={screenW}
          height={180}
          yAxisLabel=""
          yAxisSuffix="h"
          chartConfig={{
            backgroundGradientFrom: Colors.surface,
            backgroundGradientTo: Colors.surface,
            color: (op = 1) => `rgba(251,191,36,${op})`,
            labelColor: () => Colors.textMuted,
            decimalPlaces: 1,
            propsForBackgroundLines: { stroke: 'rgba(255,255,255,0.04)' },
          }}
          style={{ borderRadius: 12, overflow: 'hidden' }}
        />
      </Card>

      {/* Log Practice Modal */}
      <ModalSheet visible={practiceModal} onClose={() => setPracticeModal(false)} title="Log Skill Practice" accentColor={C}>
        <FormField label="Skill">
          <View style={styles.catGrid}>
            {skillList.map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.catBtn, selSkill === s && { borderColor: C, backgroundColor: C + '20' }]}
                onPress={() => setSelSkill(s)}
              >
                <Text style={[styles.catBtnText, selSkill === s && { color: C }]}>{getSkillEmoji(s)} {s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </FormField>
        <FormField label="Hours" value={hours} onChangeText={setHours} placeholder="2.0" keyboardType="decimal-pad" />
        <FormField label="What did you practice?" value={notes} onChangeText={setNotes} placeholder="Scales, song, choreography..." />
        <View style={styles.modalActions}>
          <Button title="Cancel" variant="outline" onPress={() => setPracticeModal(false)} />
          <Button title="Save" onPress={savePractice} color={C} />
        </View>
      </ModalSheet>

      {/* Assessment Modal */}
      <ModalSheet visible={assessModal} onClose={() => setAssessModal(false)} title="Skill Self-Assessment" accentColor={C}>
        <Text style={styles.assessInstruction}>Rate your current level from 1 (beginner) to 10 (expert)</Text>
        {skillList.map(skill => (
          <View key={skill} style={styles.ratingRow}>
            <Text style={styles.ratingLabel}>{getSkillEmoji(skill)} {skill}</Text>
            <View style={styles.ratingBtns}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => {
                const active = (ratings[skill] || 5) >= n;
                return (
                  <TouchableOpacity
                    key={n}
                    style={[styles.ratingBtn, active && { backgroundColor: C + '30', borderColor: C + '60' }]}
                    onPress={() => setRatings({ ...ratings, [skill]: n })}
                  >
                    <Text style={[styles.ratingBtnText, active && { color: C }]}>{n}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
        <View style={styles.modalActions}>
          <Button title="Cancel" variant="outline" onPress={() => setAssessModal(false)} />
          <Button title="Save Assessment" onPress={saveAssessment} color={C} />
        </View>
      </ModalSheet>
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: 14, paddingTop: 8 },
  dateNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.card, borderRadius: 16, paddingVertical: 10, paddingHorizontal: 16, marginBottom: 12 },
  dateNavBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  dateNavArrow: { color: Colors.text, fontSize: 24, fontWeight: '300', lineHeight: 28 },
  dateNavLabel: { color: Colors.text, fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  actStepper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: Colors.surfaceHigh, alignItems: 'center', justifyContent: 'center' },
  stepBtnTxt: { color: Colors.textSecondary, fontSize: 18, fontWeight: '700', lineHeight: 22 },
  actHours: { fontSize: 16, fontWeight: '800', minWidth: 42, textAlign: 'center', letterSpacing: -0.3 },
  emptyText: { color: Colors.textMuted, fontSize: 13, textAlign: 'center', paddingVertical: 8 },
  skillRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 14, padding: 12, marginBottom: 8, gap: 10 },
  skillIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  skillName: { color: Colors.text, fontSize: 14, fontWeight: '800', letterSpacing: -0.3 },
  skillWeek: { color: Colors.textMuted, fontSize: 10, fontWeight: '600', marginTop: 2 },
  skillTotal: { fontSize: 20, fontWeight: '800' },
  skillTotalLabel: { color: Colors.textMuted, fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  assessItem: { backgroundColor: Colors.surface, borderRadius: 14, padding: 12, marginBottom: 8 },
  assessHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  assessName: { color: Colors.text, fontSize: 13, fontWeight: '700', flex: 1 },
  assessLevel: { fontSize: 13, fontWeight: '800' },
  addRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  addInput: { flex: 1, backgroundColor: Colors.surface, borderRadius: 12, color: Colors.text, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, borderWidth: 1, borderColor: Colors.border },
  skillItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 12, padding: 12, marginBottom: 6 },
  skillItemName: { color: Colors.text, fontSize: 14, fontWeight: '600', flex: 1 },
  logEntry: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 14, padding: 12, marginBottom: 6, gap: 10 },
  logIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  logSkill: { color: Colors.text, fontSize: 13, fontWeight: '700' },
  logNotes: { color: Colors.textSecondary, fontSize: 12, marginTop: 1 },
  logDate: { color: Colors.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 0.5, marginTop: 2 },
  logHours: { fontSize: 16, fontWeight: '800' },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: Colors.surfaceHigh, borderWidth: 1, borderColor: Colors.border },
  catBtnText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10, marginBottom: 20 },
  assessInstruction: { color: Colors.textSecondary, fontSize: 12, marginBottom: 16, lineHeight: 18 },
  ratingRow: { backgroundColor: Colors.surface, borderRadius: 14, padding: 12, marginBottom: 8 },
  ratingLabel: { color: Colors.text, fontSize: 14, fontWeight: '700', marginBottom: 10 },
  ratingBtns: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  ratingBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: Colors.surfaceHighest, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'transparent' },
  ratingBtnText: { color: Colors.textMuted, fontSize: 11, fontWeight: '700' },
});
