import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch, Alert, Share, TextInput } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Colors, DEFAULT_REMINDER_SETTINGS, DEFAULT_GOALS, DEFAULT_HABITS, TAB_COLORS } from '../../src/constants/theme';
import { getData, setData, exportAllData, getAllKeys, removeData, importAllData } from '../../src/utils/storage';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { FormField } from '../../src/components/FormField';
import { ModalSheet } from '../../src/components/ModalSheet';
import { scheduleAllReminders, cancelAllReminders, sendTestNotification, requestPermissions } from '../../src/utils/notifications';

const C = TAB_COLORS.settings;

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
        Alert.alert('Permission Denied', 'Please enable notifications in Settings → LifeOS → Notifications.');
      } else {
        Alert.alert('Reminders Active', 'Water, journal, sleep & skincare reminders are scheduled!');
      }
    } else {
      await cancelAllReminders();
    }
  };

  const handleTestNotification = async () => {
    // Check permission before sending test
    const granted = await requestPermissions();
    if (!granted) {
      Alert.alert('Permission Required', 'Enable notifications first to send a test.');
      return;
    }
    await sendTestNotification();
  };

  const saveGoals = async () => {
    const updated: Record<string, number> = { ...goals };
    Object.entries(goalEdits).forEach(([k, v]) => {
      const n = parseFloat(v);
      if (!isNaN(n) && n >= 0) updated[k] = n;
    });
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
    Alert.alert('Saved', notifEnabled ? 'Reminders rescheduled.' : 'Settings saved.');
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
    Alert.alert('Remove Habit', `Remove "${h}" from your daily habits?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          const updated = habits.filter(x => x !== h);
          setHabits(updated);
          await setData('habits', updated);
        },
      },
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

  const importData = () => {
    Alert.alert(
      'Import Data',
      'Paste your exported JSON data. This will merge with existing data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Share / Files',
          onPress: () => Alert.alert(
            'How to Import',
            '1. Export your data first (creates a JSON file)\n2. Open the JSON in a text editor\n3. Copy the content\n4. Use a data restoration app or contact support.\n\nNote: Full import UI is coming in a future update.',
          ),
        },
      ],
    );
  };

  const clearAllData = () => {
    Alert.alert(
      '⚠️ Delete All Data',
      'This permanently deletes ALL your LifeOS data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything', style: 'destructive', onPress: () => {
            Alert.alert('Are you absolutely sure?', 'There is no recovery from this action.', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Yes, Delete All', style: 'destructive', onPress: async () => {
                  const keys = await getAllKeys();
                  for (const k of keys) await removeData(k);
                  Alert.alert('Cleared', 'All data has been deleted.');
                  loadData();
                },
              },
            ]);
          },
        },
      ],
    );
  };

  const GOAL_FIELDS = [
    { key: 'weeklyGymHours', label: '💪 Gym hours / week', color: Colors.green, placeholder: '5' },
    { key: 'weeklyWalkHours', label: '🚶 Walking hours / week', color: Colors.teal, placeholder: '7' },
    { key: 'weeklySwimHours', label: '🏊 Swimming hours / week', color: Colors.cyan, placeholder: '3' },
    { key: 'weeklyJournalDays', label: '📓 Journalling days / week', color: Colors.pink, placeholder: '7' },
    { key: 'weeklyMindfulDays', label: '🧘 Mindfulness days / week', color: Colors.purple, placeholder: '7' },
    { key: 'weeklyStudyHours', label: '📚 Study hours / week', color: Colors.orange, placeholder: '10' },
    { key: 'weeklyCigLimit', label: '🚬 Cigarette limit / week', color: Colors.red, placeholder: '5' },
    { key: 'weeklyWater', label: '💧 Water glasses / week', color: Colors.cyan, placeholder: '56' },
    { key: 'weeklySleepAvg', label: '😴 Average sleep (hours)', color: Colors.purple, placeholder: '7.25' },
    { key: 'weeklySkillHours', label: '🎸 Skill hours / week', color: Colors.yellow, placeholder: '8' },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Notifications */}
      <Card title="Notifications" accentColor={Colors.accentLight}>
        <View style={styles.settingRow}>
          <View style={styles.settingTextCol}>
            <Text style={styles.settingLabel}>Daily Reminders</Text>
            <Text style={styles.settingDesc}>Water · Sleep · Skincare</Text>
          </View>
          <Switch
            value={notifEnabled}
            onValueChange={toggleNotifications}
            trackColor={{ false: Colors.surfaceHighest, true: Colors.accentGlow }}
            thumbColor={notifEnabled ? Colors.accent : Colors.textMuted}
          />
        </View>
        <View style={styles.btnRow}>
          <Button
            title="⏰ Configure Times"
            size="sm"
            variant="outline"
            color={Colors.accentLight}
            onPress={() => {
              setNotifEdits(Object.fromEntries(Object.entries(reminderSettings).map(([k, v]) => [k, String(v)])));
              setNotifModal(true);
            }}
          />
          <Button
            title="🔔 Send Test"
            size="sm"
            variant="ghost"
            color={Colors.accentLight}
            onPress={handleTestNotification}
          />
        </View>
      </Card>

      {/* Weekly Goals */}
      <Card
        title="Weekly Goals"
        accentColor={Colors.green}
        headerRight={
          <Button
            title="Edit"
            size="sm"
            variant="outline"
            color={Colors.green}
            onPress={() => {
              setGoalEdits(Object.fromEntries(Object.entries(goals).map(([k, v]) => [k, String(v)])));
              setGoalModal(true);
            }}
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
      <Card
        title="Daily Habits"
        accentColor={Colors.cyan}
        headerRight={
          <Button
            title="+ Add"
            size="sm"
            color={Colors.cyan}
            onPress={() => { setNewHabit(''); setHabitModal(true); }}
          />
        }
      >
        {habits.map(h => (
          <View key={h} style={styles.habitRow}>
            <View style={[styles.habitDot, { backgroundColor: Colors.cyan }]} />
            <Text style={styles.habitText}>{h}</Text>
            <TouchableOpacity onPress={() => removeHabit(h)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={{ color: Colors.red, fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
      </Card>

      {/* Data Management */}
      <Card title="Data Management" accentColor={Colors.orange}>
        <Text style={styles.dataHint}>
          Export your data as JSON for backup. Keep this safe — it's the only copy!
        </Text>
        <View style={styles.dataButtons}>
          <Button title="📤  Export Data" variant="outline" color={Colors.orange} style={{ flex: 1 }} onPress={exportData} />
          <Button title="📥  Import" variant="outline" color={Colors.accentLight} style={{ flex: 1 }} onPress={importData} />
        </View>
        <View style={{ marginTop: 10 }}>
          <Button title="🗑️  Clear All Data" variant="danger" onPress={clearAllData} />
        </View>
      </Card>

      {/* About */}
      <Card title="About LifeOS" accentColor={Colors.purple}>
        <View style={styles.aboutRow}>
          <Text style={{ fontSize: 36 }}>⚡</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.aboutVersion}>LifeOS  ·  v1.0.0</Text>
            <Text style={styles.aboutDesc}>
              Your personal life operating system. All data is stored locally on your device — nothing leaves your phone.
            </Text>
            <Text style={styles.aboutTech}>React Native · Expo · AsyncStorage</Text>
          </View>
        </View>
      </Card>

      {/* Goals Modal */}
      <ModalSheet visible={goalModal} onClose={() => setGoalModal(false)} title="Edit Weekly Goals" accentColor={Colors.green}>
        {GOAL_FIELDS.map(g => (
          <FormField
            key={g.key}
            label={g.label}
            value={goalEdits[g.key] || ''}
            onChangeText={v => setGoalEdits(p => ({ ...p, [g.key]: v }))}
            keyboardType="decimal-pad"
            placeholder={g.placeholder}
          />
        ))}
        <View style={styles.modalBtns}>
          <Button title="Cancel" variant="outline" onPress={() => setGoalModal(false)} />
          <Button title="Save Goals" onPress={saveGoals} color={Colors.green} />
        </View>
      </ModalSheet>

      {/* Add Habit Modal */}
      <ModalSheet visible={habitModal} onClose={() => setHabitModal(false)} title="Add Habit" accentColor={Colors.cyan}>
        <FormField label="Habit Name" value={newHabit} onChangeText={setNewHabit} placeholder="e.g. Meditation, Cold Shower..." />
        <View style={styles.modalBtns}>
          <Button title="Cancel" variant="outline" onPress={() => setHabitModal(false)} />
          <Button title="Add Habit" onPress={() => { addHabit(); setHabitModal(false); }} color={Colors.cyan} />
        </View>
      </ModalSheet>

      {/* Notification Settings Modal */}
      <ModalSheet visible={notifModal} onClose={() => setNotifModal(false)} title="Reminder Settings" accentColor={Colors.accentLight}>
        <FormField label="💧 Water interval (minutes)" value={notifEdits['waterIntervalMins'] || ''} onChangeText={v => setNotifEdits(p => ({ ...p, waterIntervalMins: v }))} keyboardType="number-pad" placeholder="90" />
        <FormField label="💧 Water start (HH:MM)" value={notifEdits['waterStart'] || ''} onChangeText={v => setNotifEdits(p => ({ ...p, waterStart: v }))} placeholder="09:00" />
        <FormField label="💧 Water end (HH:MM)" value={notifEdits['waterEnd'] || ''} onChangeText={v => setNotifEdits(p => ({ ...p, waterEnd: v }))} placeholder="22:00" />
        <FormField label="😴 Sleep wind-down (HH:MM)" value={notifEdits['sleepReminder'] || ''} onChangeText={v => setNotifEdits(p => ({ ...p, sleepReminder: v }))} placeholder="23:00" />
        <FormField label="✨ Skincare reminder (HH:MM)" value={notifEdits['skincareTime'] || ''} onChangeText={v => setNotifEdits(p => ({ ...p, skincareTime: v }))} placeholder="07:00" />
        <View style={styles.modalBtns}>
          <Button title="Cancel" variant="outline" onPress={() => setNotifModal(false)} />
          <Button title="Save" onPress={saveNotifSettings} color={Colors.accentLight} />
        </View>
      </ModalSheet>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: 14, paddingTop: 8 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4, marginBottom: 12 },
  settingTextCol: { flex: 1, marginRight: 12 },
  settingLabel: { color: Colors.text, fontSize: 15, fontWeight: '700', letterSpacing: -0.3 },
  settingDesc: { color: Colors.textMuted, fontSize: 10, fontWeight: '600', marginTop: 3, letterSpacing: 0.3 },
  btnRow: { flexDirection: 'row', gap: 10 },
  goalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 12, padding: 12, marginBottom: 6 },
  goalLabel: { color: Colors.textSecondary, fontSize: 13 },
  goalVal: { fontSize: 16, fontWeight: '800' },
  habitRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 12, padding: 12, marginBottom: 6, gap: 10 },
  habitDot: { width: 8, height: 8, borderRadius: 4 },
  habitText: { color: Colors.text, fontSize: 14, fontWeight: '600', flex: 1 },
  dataHint: { color: Colors.textSecondary, fontSize: 12, marginBottom: 14, lineHeight: 18 },
  dataButtons: { flexDirection: 'row', gap: 10 },
  aboutRow: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  aboutVersion: { color: Colors.text, fontSize: 15, fontWeight: '800', letterSpacing: -0.3, marginBottom: 8 },
  aboutDesc: { color: Colors.textSecondary, fontSize: 13, lineHeight: 20, marginBottom: 8 },
  aboutTech: { color: Colors.textMuted, fontSize: 11, fontWeight: '600' },
  modalBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10, marginBottom: 20 },
});
