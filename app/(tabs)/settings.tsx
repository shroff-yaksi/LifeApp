import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch, Alert, Share } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Colors, DEFAULT_REMINDER_SETTINGS, DEFAULT_GOALS, DEFAULT_HABITS } from '../../src/constants/theme';
import { getData, setData, exportAllData, getAllKeys, removeData } from '../../src/utils/storage';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { FormField } from '../../src/components/FormField';
import { ModalSheet } from '../../src/components/ModalSheet';
import { scheduleAllReminders, cancelAllReminders, sendTestNotification } from '../../src/utils/notifications';

export default function SettingsScreen() {
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [reminderSettings, setReminderSettings] = useState<any>(DEFAULT_REMINDER_SETTINGS);
  const [goals, setGoals] = useState<any>(DEFAULT_GOALS);
  const [habits, setHabits] = useState<string[]>(DEFAULT_HABITS);
  const [newHabit, setNewHabit] = useState('');

  const [goalModal, setGoalModal] = useState(false);
  const [habitModal, setHabitModal] = useState(false);
  const [notifModal, setNotifModal] = useState(false);
  const [goalEdits, setGoalEdits] = useState<Record<string, string>>({});
  const [notifEdits, setNotifEdits] = useState<Record<string, string>>({});

  const loadData = useCallback(async () => {
    setNotifEnabled(await getData<boolean>('notificationsEnabled', false));
    setReminderSettings(await getData('reminderSettings', DEFAULT_REMINDER_SETTINGS));
    setGoals(await getData('goals', DEFAULT_GOALS));
    setHabits(await getData<string[]>('habits', DEFAULT_HABITS));
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const toggleNotifications = async (val: boolean) => {
    setNotifEnabled(val);
    await setData('notificationsEnabled', val);
    if (val) {
      const ok = await scheduleAllReminders();
      if (!ok) {
        setNotifEnabled(false);
        await setData('notificationsEnabled', false);
        Alert.alert('Permission Denied', 'Please enable notifications in iPhone Settings → LifeOS → Notifications.');
      } else {
        Alert.alert('Reminders Scheduled', 'Your daily water, journal, sleep & skincare reminders are active!');
      }
    } else {
      await cancelAllReminders();
    }
  };

  const saveGoals = async () => {
    const updated: Record<string, number> = { ...goals };
    Object.entries(goalEdits).forEach(([k, v]) => { const n = parseFloat(v); if (!isNaN(n)) updated[k] = n; });
    await setData('goals', updated);
    setGoals(updated);
    setGoalModal(false);
  };

  const saveNotifSettings = async () => {
    const updated: Record<string, any> = { ...reminderSettings };
    Object.entries(notifEdits).forEach(([k, v]) => {
      const n = Number(v);
      updated[k] = isNaN(n) || v.includes(':') ? v : n;
    });
    await setData('reminderSettings', updated);
    setReminderSettings(updated);
    if (notifEnabled) { await cancelAllReminders(); await scheduleAllReminders(); }
    setNotifModal(false);
    Alert.alert('Saved', notifEnabled ? 'Reminders have been rescheduled.' : 'Settings saved.');
  };

  const addHabit = async () => {
    const h = newHabit.trim();
    if (!h || habits.includes(h)) return;
    const updated = [...habits, h];
    setHabits(updated);
    await setData('habits', updated);
    setNewHabit('');
  };

  const removeHabit = (h: string) => {
    Alert.alert('Remove Habit', `Remove "${h}"?`, [
      { text: 'Cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        const updated = habits.filter(x => x !== h);
        setHabits(updated);
        await setData('habits', updated);
      }},
    ]);
  };

  const exportData = async () => {
    try {
      const data = await exportAllData();
      const json = JSON.stringify(data, null, 2);
      await Share.share({ message: json, title: 'LifeOS Data Export' });
    } catch {
      Alert.alert('Error', 'Could not export data.');
    }
  };

  const clearAllData = () => {
    Alert.alert(
      '⚠️ Delete All Data',
      'This permanently deletes ALL your LifeOS data. This cannot be undone.',
      [
        { text: 'Cancel' },
        { text: 'Delete Everything', style: 'destructive', onPress: async () => {
          const keys = await getAllKeys();
          for (const k of keys) await removeData(k);
          Alert.alert('Cleared', 'All data has been deleted.');
          loadData();
        }},
      ]
    );
  };

  const GOAL_FIELDS = [
    { key: 'weeklyGym', label: 'Gym sessions / week', color: Colors.green, placeholder: '5' },
    { key: 'weeklyStudyHours', label: 'Study hours / week', color: Colors.orange, placeholder: '10' },
    { key: 'weeklyCigLimit', label: 'Cigarette limit / week', color: Colors.red, placeholder: '5' },
    { key: 'weeklyWater', label: 'Water glasses / week', color: Colors.accentLight, placeholder: '56' },
    { key: 'weeklySleepAvg', label: 'Average sleep (hours)', color: Colors.purple, placeholder: '7.25' },
    { key: 'weeklySkillHours', label: 'Skill hours / week', color: Colors.yellow, placeholder: '8' },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Notifications */}
      <Card title="Notifications">
        <View style={styles.settingRow}>
          <View style={styles.settingTextCol}>
            <Text style={styles.settingLabel}>Daily Reminders</Text>
            <Text style={styles.settingDesc}>Water, journal, sleep & skincare</Text>
          </View>
          <Switch
            value={notifEnabled}
            onValueChange={toggleNotifications}
            trackColor={{ false: Colors.border, true: Colors.accentGlow }}
            thumbColor={notifEnabled ? Colors.accent : Colors.textMuted}
          />
        </View>
        <View style={styles.btnRow}>
          <Button
            title="Configure Times" size="sm" variant="outline"
            onPress={() => { setNotifEdits(Object.fromEntries(Object.entries(reminderSettings).map(([k, v]) => [k, String(v)]))); setNotifModal(true); }}
          />
          {notifEnabled && (
            <Button title="Send Test" size="sm" variant="ghost" onPress={sendTestNotification} />
          )}
        </View>
      </Card>

      {/* Goals */}
      <Card
        title="Weekly Goals"
        headerRight={
          <Button
            title="Edit" size="sm" variant="outline"
            onPress={() => { setGoalEdits(Object.fromEntries(Object.entries(goals).map(([k, v]) => [k, String(v)]))); setGoalModal(true); }}
          />
        }
      >
        {GOAL_FIELDS.map(g => (
          <View key={g.key} style={styles.goalRow}>
            <Text style={styles.goalLabel}>{g.label}</Text>
            <Text style={[styles.goalVal, { color: g.color }]}>{goals[g.key]}</Text>
          </View>
        ))}
      </Card>

      {/* Habits */}
      <Card title="Daily Habits" headerRight={<Button title="+ Add" size="sm" onPress={() => { setNewHabit(''); setHabitModal(true); }} />}>
        {habits.map(h => (
          <TouchableOpacity key={h} style={styles.habitRow} onLongPress={() => removeHabit(h)}>
            <Text style={styles.habitText}>{h}</Text>
            <Text style={styles.habitHint}>hold to remove</Text>
          </TouchableOpacity>
        ))}
      </Card>

      {/* Data */}
      <Card title="Data Management">
        <Text style={styles.dataHint}>Export all your data as a JSON backup, or clear everything to start fresh.</Text>
        <Button title="📤  Export All Data (JSON)" variant="outline" style={{ marginBottom: 10 }} onPress={exportData} />
        <Button title="🗑️  Clear All Data" variant="danger" onPress={clearAllData} />
      </Card>

      {/* About */}
      <Card title="About LifeOS">
        <Text style={styles.aboutVersion}>Version 1.0.0</Text>
        <Text style={styles.aboutDesc}>
          Your personal life operating system. All data is stored locally on your device — nothing leaves your phone.
        </Text>
        <Text style={styles.aboutDesc}>Built with Expo · React Native · AsyncStorage</Text>
      </Card>

      {/* Goals Modal */}
      <ModalSheet visible={goalModal} onClose={() => setGoalModal(false)} title="Edit Weekly Goals">
        {GOAL_FIELDS.map(g => (
          <FormField
            key={g.key} label={g.label}
            value={goalEdits[g.key] || ''}
            onChangeText={v => setGoalEdits(p => ({ ...p, [g.key]: v }))}
            keyboardType="decimal-pad" placeholder={g.placeholder}
          />
        ))}
        <View style={styles.modalBtns}>
          <Button title="Cancel" variant="outline" onPress={() => setGoalModal(false)} />
          <Button title="Save" onPress={saveGoals} />
        </View>
      </ModalSheet>

      {/* Add Habit Modal */}
      <ModalSheet visible={habitModal} onClose={() => setHabitModal(false)} title="Add Habit">
        <FormField label="Habit Name" value={newHabit} onChangeText={setNewHabit} placeholder="e.g. Meditation, Cold Shower..." />
        <View style={styles.modalBtns}>
          <Button title="Cancel" variant="outline" onPress={() => setHabitModal(false)} />
          <Button title="Add" onPress={() => { addHabit(); setHabitModal(false); }} />
        </View>
      </ModalSheet>

      {/* Notification Settings Modal */}
      <ModalSheet visible={notifModal} onClose={() => setNotifModal(false)} title="Reminder Settings">
        <FormField label="Water interval (minutes)" value={notifEdits['waterIntervalMins'] || ''} onChangeText={v => setNotifEdits(p => ({ ...p, waterIntervalMins: v }))} keyboardType="number-pad" placeholder="90" />
        <FormField label="Water start (HH:MM)" value={notifEdits['waterStart'] || ''} onChangeText={v => setNotifEdits(p => ({ ...p, waterStart: v }))} placeholder="09:00" />
        <FormField label="Water end (HH:MM)" value={notifEdits['waterEnd'] || ''} onChangeText={v => setNotifEdits(p => ({ ...p, waterEnd: v }))} placeholder="22:00" />
        <FormField label="Journal reminder (HH:MM)" value={notifEdits['journalTime'] || ''} onChangeText={v => setNotifEdits(p => ({ ...p, journalTime: v }))} placeholder="22:45" />
        <FormField label="Sleep wind-down (HH:MM)" value={notifEdits['sleepReminder'] || ''} onChangeText={v => setNotifEdits(p => ({ ...p, sleepReminder: v }))} placeholder="23:00" />
        <FormField label="Skincare reminder (HH:MM)" value={notifEdits['skincareTime'] || ''} onChangeText={v => setNotifEdits(p => ({ ...p, skincareTime: v }))} placeholder="07:00" />
        <View style={styles.modalBtns}>
          <Button title="Cancel" variant="outline" onPress={() => setNotifModal(false)} />
          <Button title="Save" onPress={saveNotifSettings} />
        </View>
      </ModalSheet>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: 14, paddingTop: 8 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  settingTextCol: { flex: 1, marginRight: 12 },
  settingLabel: { color: Colors.text, fontSize: 15, fontWeight: '700', letterSpacing: -0.3 },
  settingDesc: { color: Colors.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 3 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  goalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 14, padding: 12, marginBottom: 4 },
  goalLabel: { color: Colors.textSecondary, fontSize: 14 },
  goalVal: { fontSize: 16, fontWeight: '800' },
  habitRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 14, padding: 12, marginBottom: 4 },
  habitText: { color: Colors.text, fontSize: 14, fontWeight: '600' },
  habitHint: { color: Colors.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  dataHint: { color: Colors.textSecondary, fontSize: 13, marginBottom: 14, lineHeight: 18 },
  aboutVersion: { color: Colors.text, fontSize: 15, fontWeight: '700', letterSpacing: -0.3, marginBottom: 8 },
  aboutDesc: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20, marginBottom: 4 },
  modalBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10, marginBottom: 20 },
});
