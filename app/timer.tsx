import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Svg, { Circle } from 'react-native-svg';
import { Colors } from '../src/constants/theme';
import { getData, setData } from '../src/utils/storage';
import { TODAY } from '../src/utils/helpers';

const W = Dimensions.get('window').width;
const R = 110;
const CIRCUM = 2 * Math.PI * R;
const DURATIONS = { work: 25 * 60, short: 5 * 60, long: 15 * 60 } as const;
type Mode = keyof typeof DURATIONS;

const MODE_LABELS: Record<Mode, string> = { work: '🎯 Focus', short: '☕ Break', long: '🛋 Long Break' };
const MODE_COLORS: Record<Mode, string> = { work: Colors.accent, short: Colors.green, long: Colors.purple };

export default function TimerScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('work');
  const [seconds, setSeconds] = useState(DURATIONS.work);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const modeRef = useRef<Mode>('work');
  const sessionsRef = useRef(0);

  modeRef.current = mode;
  sessionsRef.current = sessions;

  useEffect(() => {
    getData<number>('pomodoro_' + TODAY(), 0).then(n => { setSessions(n); sessionsRef.current = n; });
  }, []);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          clearInterval(id);
          setRunning(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          if (modeRef.current === 'work') {
            const n = sessionsRef.current + 1;
            setSessions(n);
            sessionsRef.current = n;
            setData('pomodoro_' + TODAY(), n);
            Alert.alert('🎉 Session Done!', `${n} pomodoro${n > 1 ? 's' : ''} today.\nTake a well-earned break!`);
          } else {
            Alert.alert('Break Over!', 'Ready to focus again?');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  const switchMode = (m: Mode) => {
    setRunning(false);
    setMode(m);
    setSeconds(DURATIONS[m]);
  };

  const toggleTimer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (seconds === 0) setSeconds(DURATIONS[mode]);
    setRunning(r => !r);
  };

  const resetTimer = () => { setRunning(false); setSeconds(DURATIONS[mode]); };

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  const color = MODE_COLORS[mode];
  const cx = (W - 40) / 2;
  const strokeOffset = CIRCUM * (1 - seconds / DURATIONS[mode]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Text style={styles.closeTxt}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Focus Timer</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Mode Selector */}
      <View style={styles.modeRow}>
        {(Object.keys(DURATIONS) as Mode[]).map(m => (
          <TouchableOpacity
            key={m}
            style={[styles.modeBtn, mode === m && { borderColor: MODE_COLORS[m], backgroundColor: MODE_COLORS[m] + '22' }]}
            onPress={() => switchMode(m)}
          >
            <Text style={[styles.modeDur, mode === m && { color: MODE_COLORS[m] }]}>
              {m === 'work' ? '25' : m === 'short' ? '5' : '15'} min
            </Text>
            <Text style={[styles.modeLbl, mode === m && { color: MODE_COLORS[m] }]}>
              {m === 'work' ? 'Focus' : m === 'short' ? 'Short' : 'Long'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* SVG Ring */}
      <View style={styles.ringWrap}>
        <Svg width={W - 40} height={W - 40} viewBox={`0 0 ${W - 40} ${W - 40}`}>
          <Circle cx={cx} cy={cx} r={R} fill="none" stroke={Colors.border} strokeWidth={14} />
          <Circle
            cx={cx} cy={cx} r={R}
            fill="none" stroke={color} strokeWidth={14}
            strokeDasharray={CIRCUM}
            strokeDashoffset={strokeOffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${cx} ${cx})`}
          />
        </Svg>
        <View style={styles.timerOverlay}>
          <Text style={styles.modeEmoji}>{MODE_LABELS[mode].split(' ')[0]}</Text>
          <Text style={[styles.timerDisplay, { color }]}>{mm}:{ss}</Text>
          <Text style={styles.sessionsLabel}>{sessions} sessions today</Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={resetTimer}>
          <Text style={styles.secondaryBtnTxt}>↺</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.mainBtn, { backgroundColor: color }]} onPress={toggleTimer}>
          <Text style={styles.mainBtnTxt}>{running ? '⏸' : seconds === 0 ? '↺' : '▶'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => switchMode(mode === 'work' ? 'short' : 'work')}
        >
          <Text style={styles.secondaryBtnTxt}>⇄</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.statusText, { color: color + 'aa' }]}>
        {running
          ? (mode === 'work' ? 'Stay focused...' : 'Enjoy your break!')
          : seconds === 0 ? 'Session complete!' : 'Ready to start'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, alignItems: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    width: '100%', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16,
  },
  closeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  closeTxt: { color: Colors.textSecondary, fontSize: 20 },
  title: { color: Colors.text, fontSize: 18, fontWeight: '700' },
  modeRow: { flexDirection: 'row', gap: 12, marginBottom: 24, paddingHorizontal: 20, width: '100%' },
  modeBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 10,
    borderRadius: 12, borderWidth: 1, borderColor: Colors.border,
  },
  modeDur: { color: Colors.text, fontSize: 15, fontWeight: '700' },
  modeLbl: { color: Colors.textMuted, fontSize: 10, marginTop: 2 },
  ringWrap: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  timerOverlay: { position: 'absolute', alignItems: 'center' },
  modeEmoji: { fontSize: 30, marginBottom: 4 },
  timerDisplay: { fontSize: 62, fontWeight: '800', letterSpacing: 2 },
  sessionsLabel: { color: Colors.textMuted, fontSize: 13, marginTop: 6 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 28, marginTop: 32 },
  mainBtn: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  mainBtnTxt: { fontSize: 30 },
  secondaryBtn: {
    width: 52, height: 52, borderRadius: 26,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.card,
  },
  secondaryBtnTxt: { color: Colors.text, fontSize: 22 },
  statusText: { marginTop: 20, fontSize: 14, fontStyle: 'italic' },
});
