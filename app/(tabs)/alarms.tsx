import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch,
  Alert, RefreshControl, TextInput,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { useFocusEffect } from 'expo-router';
import { Colors, TAB_COLORS } from '../../src/constants/theme';
import { getData, setData } from '../../src/utils/storage';
import { uid } from '../../src/utils/helpers';
import { requestPermissions, scheduleAlarmNotif, cancelAlarmNotifs } from '../../src/utils/notifications';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { ModalSheet } from '../../src/components/ModalSheet';
import { FormField } from '../../src/components/FormField';

const C = TAB_COLORS.settings;

// Expo weekday: 1=Sun, 2=Mon, 3=Tue, 4=Wed, 5=Thu, 6=Fri, 7=Sat
const DAYS = [
  { label: 'Su', value: 1 },
  { label: 'Mo', value: 2 },
  { label: 'Tu', value: 3 },
  { label: 'We', value: 4 },
  { label: 'Th', value: 5 },
  { label: 'Fr', value: 6 },
  { label: 'Sa', value: 7 },
];

export type Alarm = {
  id: string;
  label: string;
  timeH: number;       // 0–23
  timeM: number;       // 0–59
  days: number[];      // Expo weekdays; empty = one-time
  enabled: boolean;
  musicService: 'spotify' | 'apple_music' | 'none';
  musicUri: string;    // spotify:track/playlist:ID  or  music://...
  musicLabel: string;
  notifIds: string[];
};

function to12(h: number): string {
  const ampm = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(h12).padStart(2, '0')} ${ampm}`;
}

function formatTime(h: number, m: number): string {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function parseDaysSummary(days: number[]): string {
  if (days.length === 0) return 'Once';
  if (days.length === 7) return 'Every day';
  if (days.length === 5 && [2, 3, 4, 5, 6].every(d => days.includes(d))) return 'Weekdays';
  if (days.length === 2 && [1, 7].every(d => days.includes(d))) return 'Weekends';
  return days.map(d => DAYS.find(x => x.value === d)?.label).filter(Boolean).join(' ');
}

function parseSpotifyUri(input: string): string {
  const t = input.trim();
  if (t.startsWith('spotify:')) return t;
  const m = t.match(/open\.spotify\.com\/(track|playlist|album|artist)\/([A-Za-z0-9]+)/);
  if (m) return `spotify:${m[1]}:${m[2]}`;
  return t;
}

function parseAppleMusicUri(input: string): string {
  const t = input.trim();
  if (t.startsWith('music://')) return t;
  return t.replace(/^https:\/\/music\.apple\.com/, 'music://music.apple.com');
}

const BLANK_ALARM: Omit<Alarm, 'id' | 'notifIds'> = {
  label: '',
  timeH: 7,
  timeM: 0,
  days: [2, 3, 4, 5, 6], // weekdays
  enabled: false,
  musicService: 'none',
  musicUri: '',
  musicLabel: '',
};

export default function AlarmsScreen() {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Alarm | null>(null);

  // Form state
  const [fLabel, setFLabel] = useState('');
  const [fHour, setFHour] = useState('07');
  const [fMin, setFMin] = useState('00');
  const [fDays, setFDays] = useState<number[]>([2, 3, 4, 5, 6]);
  const [fService, setFService] = useState<Alarm['musicService']>('none');
  const [fUri, setFUri] = useState('');
  const [fMusicLabel, setFMusicLabel] = useState('');

  const loadData = useCallback(async () => {
    setAlarms(await getData<Alarm[]>('alarms', []));
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true); await loadData(); setRefreshing(false);
  }, [loadData]);

  const openAdd = () => {
    setEditing(null);
    setFLabel(''); setFHour('07'); setFMin('00');
    setFDays([2, 3, 4, 5, 6]); setFService('none');
    setFUri(''); setFMusicLabel('');
    setModal(true);
  };

  const openEdit = (alarm: Alarm) => {
    setEditing(alarm);
    setFLabel(alarm.label);
    setFHour(String(alarm.timeH).padStart(2, '0'));
    setFMin(String(alarm.timeM).padStart(2, '0'));
    setFDays([...alarm.days]);
    setFService(alarm.musicService);
    setFUri(alarm.musicUri);
    setFMusicLabel(alarm.musicLabel);
    setModal(true);
  };

  const toggleDay = (d: number) => {
    setFDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  };

  const applyMusicUri = (): string => {
    if (fService === 'spotify') return parseSpotifyUri(fUri);
    if (fService === 'apple_music') return parseAppleMusicUri(fUri);
    return '';
  };

  const saveAlarm = async () => {
    const h = parseInt(fHour, 10);
    const m = parseInt(fMin, 10);
    if (isNaN(h) || h < 0 || h > 23 || isNaN(m) || m < 0 || m > 59) {
      Alert.alert('Invalid Time', 'Enter a valid 24h time (HH: 00-23, MM: 00-59).');
      return;
    }
    if (fService !== 'none' && !fUri.trim()) {
      Alert.alert('Missing Link', 'Paste a Spotify or Apple Music link.');
      return;
    }

    const granted = await requestPermissions();
    if (!granted) {
      Alert.alert('Permission Required', 'Allow notifications so alarms can fire.');
      return;
    }

    const musicUri = applyMusicUri();
    const base: Omit<Alarm, 'id' | 'notifIds'> = {
      label: fLabel.trim() || 'Alarm',
      timeH: h, timeM: m,
      days: [...fDays].sort(),
      enabled: true,
      musicService: fService,
      musicUri,
      musicLabel: fMusicLabel.trim(),
    };

    const all = [...alarms];
    if (editing) {
      // Cancel old notifications
      await cancelAlarmNotifs(editing.notifIds);
      const idx = all.findIndex(a => a.id === editing.id);
      const updated: Alarm = { ...base, id: editing.id, notifIds: [] };
      const notifIds = await scheduleAlarmNotif(updated);
      updated.notifIds = notifIds;
      all[idx] = updated;
    } else {
      const alarm: Alarm = { ...base, id: uid(), notifIds: [] };
      const notifIds = await scheduleAlarmNotif(alarm);
      alarm.notifIds = notifIds;
      all.push(alarm);
    }

    await setData('alarms', all);
    setAlarms(all);
    setModal(false);
  };

  const toggleEnabled = async (alarm: Alarm) => {
    const all = [...alarms];
    const idx = all.findIndex(a => a.id === alarm.id);
    if (alarm.enabled) {
      await cancelAlarmNotifs(alarm.notifIds);
      all[idx] = { ...alarm, enabled: false, notifIds: [] };
    } else {
      const granted = await requestPermissions();
      if (!granted) { Alert.alert('Permission Required', 'Allow notifications so alarms can fire.'); return; }
      const notifIds = await scheduleAlarmNotif(alarm);
      all[idx] = { ...alarm, enabled: true, notifIds };
    }
    await setData('alarms', all);
    setAlarms(all);
  };

  const deleteAlarm = (alarm: Alarm) => {
    Alert.alert('Delete Alarm?', `"${alarm.label}" will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await cancelAlarmNotifs(alarm.notifIds);
          const updated = alarms.filter(a => a.id !== alarm.id);
          await setData('alarms', updated);
          setAlarms(updated);
        },
      },
    ]);
  };

  const serviceLabel = (s: Alarm['musicService']) =>
    s === 'spotify' ? '🎵 Spotify' : s === 'apple_music' ? '🎵 Apple Music' : null;

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C} />}
    >
      {/* Info banner */}
      <View style={styles.infoBanner}>
        <Text style={styles.infoIcon}>ℹ️</Text>
        <Text style={styles.infoText}>
          Alarm rings as a notification. Tap the notification to instantly open your chosen Spotify or Apple Music track.
        </Text>
      </View>

      {alarms.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>⏰</Text>
          <Text style={styles.emptyTitle}>No alarms set</Text>
          <Text style={styles.emptyDesc}>Tap + Add to create your first alarm</Text>
        </View>
      )}

      {alarms.map(alarm => (
        <TouchableOpacity key={alarm.id} onPress={() => openEdit(alarm)} onLongPress={() => deleteAlarm(alarm)} activeOpacity={0.85}>
          <View style={[styles.alarmCard, !alarm.enabled && styles.alarmCardDisabled]}>
            <View style={styles.alarmLeft}>
              <View style={styles.alarmTimeRow}>
                <Text style={[styles.alarmTime, !alarm.enabled && { color: Colors.textMuted }]}>
                  {formatTime(alarm.timeH, alarm.timeM)}
                </Text>
                <Text style={[styles.alarmAmPm, !alarm.enabled && { color: Colors.textMuted }]}>
                  {to12(alarm.timeH).split(' ')[1]}
                </Text>
              </View>
              <Text style={[styles.alarmLabel, !alarm.enabled && { color: Colors.textMuted }]}>
                {alarm.label}
              </Text>
              <View style={styles.alarmMeta}>
                <Text style={styles.alarmDays}>{parseDaysSummary(alarm.days)}</Text>
                {serviceLabel(alarm.musicService) && (
                  <>
                    <Text style={styles.alarmMetaDot}>·</Text>
                    <Text style={styles.alarmMusic}>
                      {serviceLabel(alarm.musicService)}
                      {alarm.musicLabel ? `  ${alarm.musicLabel}` : ''}
                    </Text>
                  </>
                )}
              </View>
            </View>
            <Switch
              value={alarm.enabled}
              onValueChange={() => toggleEnabled(alarm)}
              trackColor={{ false: Colors.surfaceHighest, true: C + '60' }}
              thumbColor={alarm.enabled ? C : Colors.textMuted}
            />
          </View>
        </TouchableOpacity>
      ))}

      {alarms.length > 0 && (
        <Text style={styles.hint}>Long-press an alarm to delete it</Text>
      )}

      <View style={{ height: 30 }} />

      {/* Add / Edit Modal */}
      <ModalSheet
        visible={modal}
        onClose={() => setModal(false)}
        title={editing ? 'Edit Alarm' : 'New Alarm'}
        accentColor={C}
      >
        <FormField label="Label" value={fLabel} onChangeText={setFLabel} placeholder="Wake Up, Nap, Wind Down…" />

        {/* Time */}
        <View style={styles.timeRow}>
          <View style={styles.timeBox}>
            <TouchableOpacity onPress={() => setFHour(h => { const n = (parseInt(h) + 1) % 24; return String(n).padStart(2, '0'); })} style={styles.timeArrow}>
              <Text style={styles.timeArrowTxt}>▲</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.timeInput}
              value={fHour}
              onChangeText={v => setFHour(v.replace(/[^0-9]/g, '').slice(0, 2))}
              keyboardType="number-pad"
              maxLength={2}
              selectTextOnFocus
            />
            <TouchableOpacity onPress={() => setFHour(h => { const n = (parseInt(h) - 1 + 24) % 24; return String(n).padStart(2, '0'); })} style={styles.timeArrow}>
              <Text style={styles.timeArrowTxt}>▼</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.timeSep}>:</Text>
          <View style={styles.timeBox}>
            <TouchableOpacity onPress={() => setFMin(m => { const n = (parseInt(m) + 1) % 60; return String(n).padStart(2, '0'); })} style={styles.timeArrow}>
              <Text style={styles.timeArrowTxt}>▲</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.timeInput}
              value={fMin}
              onChangeText={v => setFMin(v.replace(/[^0-9]/g, '').slice(0, 2))}
              keyboardType="number-pad"
              maxLength={2}
              selectTextOnFocus
            />
            <TouchableOpacity onPress={() => setFMin(m => { const n = (parseInt(m) - 1 + 60) % 60; return String(n).padStart(2, '0'); })} style={styles.timeArrow}>
              <Text style={styles.timeArrowTxt}>▼</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.timeAmPm}>{parseInt(fHour, 10) < 12 ? 'AM' : 'PM'}</Text>
        </View>

        {/* Days */}
        <Text style={styles.sectionLabel}>REPEAT</Text>
        <View style={styles.daysRow}>
          {DAYS.map(d => (
            <TouchableOpacity
              key={d.value}
              style={[styles.dayChip, fDays.includes(d.value) && { backgroundColor: C + '25', borderColor: C }]}
              onPress={() => toggleDay(d.value)}
            >
              <Text style={[styles.dayChipTxt, fDays.includes(d.value) && { color: C }]}>{d.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.dayShortcuts}>
          <TouchableOpacity style={styles.shortcut} onPress={() => setFDays([1, 2, 3, 4, 5, 6, 7])}>
            <Text style={styles.shortcutTxt}>Every day</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shortcut} onPress={() => setFDays([2, 3, 4, 5, 6])}>
            <Text style={styles.shortcutTxt}>Weekdays</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shortcut} onPress={() => setFDays([1, 7])}>
            <Text style={styles.shortcutTxt}>Weekends</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shortcut} onPress={() => setFDays([])}>
            <Text style={styles.shortcutTxt}>Once</Text>
          </TouchableOpacity>
        </View>

        {/* Music Service */}
        <Text style={styles.sectionLabel}>MUSIC  (optional)</Text>
        <View style={styles.serviceRow}>
          {(['none', 'spotify', 'apple_music'] as const).map(s => (
            <TouchableOpacity
              key={s}
              style={[styles.serviceBtn, fService === s && { borderColor: C, backgroundColor: C + '18' }]}
              onPress={() => setFService(s)}
            >
              <Text style={styles.serviceBtnIcon}>
                {s === 'spotify' ? '🟢' : s === 'apple_music' ? '🎵' : '🔕'}
              </Text>
              <Text style={[styles.serviceBtnTxt, fService === s && { color: C }]}>
                {s === 'none' ? 'None' : s === 'spotify' ? 'Spotify' : 'Apple Music'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {fService !== 'none' && (
          <>
            <FormField
              label={fService === 'spotify' ? 'Spotify link or URI' : 'Apple Music link'}
              value={fUri}
              onChangeText={setFUri}
              placeholder={fService === 'spotify'
                ? 'https://open.spotify.com/playlist/…'
                : 'https://music.apple.com/…'}
            />
            <Text style={styles.uriHint}>
              {fService === 'spotify'
                ? 'Paste any Spotify link — it converts automatically to a URI'
                : 'Paste any Apple Music link'}
            </Text>
            <FormField
              label="Track / Playlist name (shown on alarm)"
              value={fMusicLabel}
              onChangeText={setFMusicLabel}
              placeholder="Morning Vibes"
            />
          </>
        )}

        <View style={styles.modalBtns}>
          <Button title="Cancel" variant="outline" onPress={() => setModal(false)} />
          <Button title={editing ? 'Update Alarm' : 'Save Alarm'} onPress={saveAlarm} color={C} />
        </View>
      </ModalSheet>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, paddingHorizontal: 14, paddingTop: 8 },

  infoBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: Colors.accentBg, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.accentGlow, marginBottom: 14,
  },
  infoIcon: { fontSize: 16, lineHeight: 20 },
  infoText: { flex: 1, color: Colors.textSecondary, fontSize: 12, lineHeight: 18 },

  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { color: Colors.text, fontSize: 18, fontWeight: '700', marginBottom: 6 },
  emptyDesc: { color: Colors.textMuted, fontSize: 13 },

  alarmCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.card, borderRadius: 18, padding: 18,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 10,
  },
  alarmCardDisabled: { opacity: 0.5 },
  alarmLeft: { flex: 1, marginRight: 12 },
  alarmTimeRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 3 },
  alarmTime: { color: Colors.text, fontSize: 40, fontWeight: '800', letterSpacing: -1.5 },
  alarmAmPm: { color: Colors.textSecondary, fontSize: 14, fontWeight: '600' },
  alarmLabel: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 4 },
  alarmMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  alarmDays: { color: Colors.textMuted, fontSize: 11, fontWeight: '600' },
  alarmMetaDot: { color: Colors.textMuted, fontSize: 11 },
  alarmMusic: { color: Colors.textMuted, fontSize: 11 },

  hint: { textAlign: 'center', color: Colors.textMuted, fontSize: 10, marginTop: 4 },

  // Time picker
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginVertical: 16 },
  timeBox: { alignItems: 'center', gap: 4 },
  timeArrow: { paddingHorizontal: 16, paddingVertical: 6 },
  timeArrowTxt: { color: Colors.textSecondary, fontSize: 14 },
  timeInput: {
    width: 72, height: 56, borderRadius: 14,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    textAlign: 'center', color: Colors.text, fontSize: 28, fontWeight: '800',
  },
  timeSep: { color: Colors.text, fontSize: 32, fontWeight: '800', marginBottom: 4 },
  timeAmPm: { color: Colors.textMuted, fontSize: 14, fontWeight: '700', marginLeft: 4, alignSelf: 'center' },

  sectionLabel: {
    color: Colors.textMuted, fontSize: 9, fontWeight: '800',
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10, marginTop: 4,
  },
  daysRow: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  dayChip: {
    flex: 1, paddingVertical: 9, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  dayChipTxt: { color: Colors.textMuted, fontSize: 11, fontWeight: '700' },
  dayShortcuts: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 16 },
  shortcut: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    backgroundColor: Colors.surfaceHigh, borderWidth: 1, borderColor: Colors.border,
  },
  shortcutTxt: { color: Colors.textSecondary, fontSize: 11, fontWeight: '600' },

  serviceRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  serviceBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface,
    alignItems: 'center', gap: 4,
  },
  serviceBtnIcon: { fontSize: 20 },
  serviceBtnTxt: { color: Colors.textSecondary, fontSize: 11, fontWeight: '700' },

  uriHint: { color: Colors.textMuted, fontSize: 10, marginTop: -8, marginBottom: 12, lineHeight: 15 },

  modalBtns: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10, marginBottom: 20 },
});
