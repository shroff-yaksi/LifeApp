import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Svg, { Circle } from 'react-native-svg';
import { Colors } from '../src/constants/theme';
import { getData, setData, removeData } from '../src/utils/storage';
import { TODAY } from '../src/utils/helpers';

const W = Dimensions.get('window').width;
const R = 110;
const CIRCUM = 2 * Math.PI * R;
const DURATIONS = { work: 25 * 60, short: 5 * 60, long: 15 * 60 } as const;
type Mode = keyof typeof DURATIONS;

const MODE_CONFIG: Record<Mode, { label: string; emoji: string; color: string; subColor: string }> = {
  work:  { label: 'Focus',       emoji: '🎯', color: Colors.accent,  subColor: Colors.accentLight },
  short: { label: 'Short Break', emoji: '☕', color: Colors.green,   subColor: Colors.green },
  long:  { label: 'Long Break',  emoji: '🛋️', color: Colors.purple, subColor: Colors.purple },
};

const TIMER_STATE_KEY = 'timerState';

export default function TimerScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('work');
  const [seconds, setSeconds] = useState(DURATIONS.work);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const modeRef = useRef<Mode>('work');
  const secondsRef = useRef(DURATIONS.work);
  const sessionsRef = useRef(0);

  modeRef.current = mode;
  secondsRef.current = seconds;
  sessionsRef.current = sessions;

  // Load sessions count and restore timer state on mount
  useEffect(() => {
    const restore = async () => {
      const n = await getData<number>('pomodoro_' + TODAY(), 0);
      setSessions(n);
      sessionsRef.current = n;

      // Restore saved timer state
      const saved = await getData<{ startedAt: number; totalDuration: number; mode: Mode } | null>(TIMER_STATE_KEY, null);
      if (saved) {
        const elapsed = Math.floor((Date.now() - saved.startedAt) / 1000);
        const remaining = saved.totalDuration - elapsed;
        if (remaining > 0) {
          setMode(saved.mode);
          setSeconds(remaining);
          setRunning(true); // auto-resume if timer was running
        } else {
          await removeData(TIMER_STATE_KEY);
        }
      }
    };
    restore();
  }, []);

  // Countdown ticker
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          clearInterval(id);
          setRunning(false);
          removeData(TIMER_STATE_KEY);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          if (modeRef.current === 'work') {
            const n = sessionsRef.current + 1;
            setSessions(n);
            sessionsRef.current = n;
            setData('pomodoro_' + TODAY(), n);
            Alert.alert('🎉 Session Complete!', `${n} pomodoro${n > 1 ? 's' : ''} today!\nTake a well-earned break.`);
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
    removeData(TIMER_STATE_KEY);
    setMode(m);
    setSeconds(DURATIONS[m]);
  };

  const toggleTimer = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (seconds === 0) {
      setSeconds(DURATIONS[mode]);
      setRunning(true);
      await setData(TIMER_STATE_KEY, { startedAt: Date.now(), totalDuration: DURATIONS[mode], mode });
    } else if (!running) {
      setRunning(true);
      // Save state so we can restore if app is closed
      const remaining = secondsRef.current;
      await setData(TIMER_STATE_KEY, { startedAt: Date.now() - (DURATIONS[mode] - remaining) * 1000, totalDuration: DURATIONS[mode], mode });
    } else {
      setRunning(false);
      await removeData(TIMER_STATE_KEY);
    }
  };

  const resetTimer = async () => {
    setRunning(false);
    setSeconds(DURATIONS[mode]);
    await removeData(TIMER_STATE_KEY);
  };

  const cfg = MODE_CONFIG[mode];
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  const cx = (W - 40) / 2;
  const progress = seconds / DURATIONS[mode];
  const strokeOffset = CIRCUM * (1 - progress);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Text style={styles.closeTxt}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Focus Timer</Text>
        <View style={[styles.sessionBadge, { backgroundColor: Colors.accentBg }]}>
          <Text style={[styles.sessionTxt, { color: Colors.accentLight }]}>{sessions} today</Text>
        </View>
      </View>

      {/* Mode Selector */}
      <View style={styles.modeRow}>
        {(Object.keys(DURATIONS) as Mode[]).map(m => {
          const mc = MODE_CONFIG[m];
          const active = mode === m;
          return (
            <TouchableOpacity
              key={m}
              style={[styles.modeBtn, active && { borderColor: mc.color, backgroundColor: mc.color + '20' }]}
              onPress={() => switchMode(m)}
            >
              <Text style={{ fontSize: 16 }}>{mc.emoji}</Text>
              <Text style={[styles.modeDur, active && { color: mc.color }]}>
                {m === 'work' ? '25' : m === 'short' ? '5' : '15'} min
              </Text>
              <Text style={[styles.modeLbl, active && { color: mc.color }]}>{mc.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* SVG Ring */}
      <View style={styles.ringWrap}>
        <Svg width={W - 40} height={W - 40} viewBox={`0 0 ${W - 40} ${W - 40}`}>
          {/* Background track */}
          <Circle cx={cx} cy={cx} r={R} fill="none" stroke={Colors.surfaceHighest} strokeWidth={16} />
          {/* Progress arc */}
          <Circle
            cx={cx} cy={cx} r={R}
            fill="none"
            stroke={cfg.color}
            strokeWidth={16}
            strokeDasharray={CIRCUM}
            strokeDashoffset={strokeOffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${cx} ${cx})`}
          />
        </Svg>
        <View style={styles.timerOverlay}>
          <Text style={styles.modeEmoji}>{cfg.emoji}</Text>
          <Text style={[styles.timerDisplay, { color: cfg.color }]}>{mm}:{ss}</Text>
          <Text style={styles.modeName}>{cfg.label}</Text>
          <Text style={styles.sessionsLabel}>
            {running ? (mode === 'work' ? 'Stay focused...' : 'Enjoy your break!') : seconds === 0 ? 'Session complete! 🎉' : 'Tap ▶ to start'}
          </Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={resetTimer}>
          <Text style={styles.secondaryBtnTxt}>↺</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.mainBtn, { backgroundColor: cfg.color }]}
          onPress={toggleTimer}
        >
          <Text style={styles.mainBtnTxt}>
            {running ? '⏸' : seconds === 0 ? '↺' : '▶'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => switchMode(mode === 'work' ? 'short' : 'work')}
        >
          <Text style={styles.secondaryBtnTxt}>⇄</Text>
        </TouchableOpacity>
      </View>

      {/* Session dots */}
      {sessions > 0 && (
        <View style={styles.sessionDots}>
          {Array.from({ length: Math.min(sessions, 8) }).map((_, i) => (
            <View key={i} style={[styles.dot, { backgroundColor: Colors.accent }]} />
          ))}
          {sessions > 8 && <Text style={[styles.sessionMore, { color: Colors.accentLight }]}>+{sessions - 8}</Text>}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center' },
  closeTxt: { color: Colors.textSecondary, fontSize: 16, fontWeight: '700' },
  title: { color: Colors.text, fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  sessionBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 },
  sessionTxt: { fontSize: 12, fontWeight: '700' },
  modeRow: { flexDirection: 'row', gap: 10, marginBottom: 20, paddingHorizontal: 20, width: '100%' },
  modeBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    gap: 2,
  },
  modeDur: { color: Colors.text, fontSize: 14, fontWeight: '800' },
  modeLbl: { color: Colors.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 0.3 },
  ringWrap: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  timerOverlay: { position: 'absolute', alignItems: 'center' },
  modeEmoji: { fontSize: 32, marginBottom: 6 },
  timerDisplay: { fontSize: 64, fontWeight: '800', letterSpacing: 3 },
  modeName: { color: Colors.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 4 },
  sessionsLabel: { color: Colors.textMuted, fontSize: 12, marginTop: 8, textAlign: 'center', fontStyle: 'italic' },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 28, marginTop: 28 },
  mainBtn: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center' },
  mainBtnTxt: { fontSize: 32 },
  secondaryBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
  },
  secondaryBtnTxt: { color: Colors.text, fontSize: 22 },
  sessionDots: { flexDirection: 'row', gap: 6, marginTop: 28, alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  sessionMore: { fontSize: 13, fontWeight: '800' },
});
