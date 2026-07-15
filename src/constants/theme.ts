export const Colors = {
  // Surface hierarchy — true OLED blacks
  bg: '#090909',
  sidebarBg: '#050505',
  card: '#111111',
  cardHover: '#161616',
  surface: '#161616',
  surfaceHigh: '#1c1c1c',
  surfaceHighest: '#242424',

  // Ghost borders — barely-there
  border: 'rgba(255,255,255,0.06)',
  borderHover: 'rgba(255,255,255,0.10)',

  // Typography — neutral (no purple tint)
  text: '#ededed',
  textSecondary: '#999999',
  textMuted: '#4d4d4d',

  // Primary accent — brand indigo (the ONE hue this whole app is built on)
  accent: '#5E6AD2',
  accentLight: '#8b95e0',
  accentGlow: 'rgba(94,106,210,0.12)',
  accentBg: 'rgba(94,106,210,0.08)',
  accentChipBg: 'rgba(94,106,210,0.15)', // redesign v1 accent capsule/pill fill (mockup .now/.mtag)

  // Redesign v1 — 1px inner top-highlight for quiet depth (mockup --hi, no drop shadows)
  innerHighlight: 'rgba(255,255,255,0.045)',

  // ── Monochrome indigo tint ramp (single hue ≈232°, dim → bright) ─────────────
  // Use these for ORDERED scales (mood, completion %) so intensity reads as
  // LIGHTNESS, never as a different hue. ramp1 = lowest/worst, ramp5 = best.
  ramp1: '#5b6191', // muted, dim  (lowest state)
  ramp2: '#5E6AD2', // = brand accent
  ramp3: '#7b85dd',
  ramp4: '#98a1e8',
  ramp5: '#b6bcf2', // bright      (best state)

  // ── Decorative palette — MONOCHROME ──────────────────────────────────────────
  // Former multi-hue semantic tokens, now collapsed onto the indigo ramp so
  // category dots / chart series read as one deliberate tint scale, not a rainbow.
  // NOTE: these are decorative only. `red` is the SINGLE functional feedback hue,
  // reserved for destructive / over-limit / negative states.
  green: '#8b95e0', // "positive / done" — bright indigo
  greenBg: 'rgba(139,149,224,0.08)',
  red: '#d95f5f', // ← the one restrained functional red (destructive / over-limit)
  redBg: 'rgba(217,95,95,0.08)',
  orange: '#6E79D6',
  orangeBg: 'rgba(110,121,214,0.08)',
  purple: '#98a1e8',
  purpleBg: 'rgba(152,161,232,0.08)',
  pink: '#b0b7ee',
  pinkBg: 'rgba(176,183,238,0.08)',
  yellow: '#c3c8f2',
  yellowBg: 'rgba(195,200,242,0.08)',
  cyan: '#7b85dd',
  cyanBg: 'rgba(123,133,221,0.08)',
  teal: '#5E6AD2',
  tealBg: 'rgba(94,106,210,0.08)',
};

// Redesign v1 — hero card gradient (mockup .hero: linear-gradient(165deg,#15151b,#0f0f12)).
// Structured for react-native-svg <LinearGradient>: `angle` in CSS degrees, `colors` top→bottom stops.
export const heroGradient = {
  angle: 165,
  colors: ['#15151b', '#0f0f12'] as const,
};

// Corner-radius scale (redesign v1). lg=20 matches the mockup .card radius.
export const radius = {
  sm: 12,
  md: 16,
  lg: 20,
  pill: 999,
} as const;

// Per-tab palette. MONOCHROME: every tab now shares the single brand-indigo
// palette — tabs are differentiated by iconography, weight and lightness, NOT by
// hue. Kept as a per-key map so existing call sites (TAB_PALETTE.fitness, etc.)
// keep working; they all resolve to the same indigo.
export type TabPalette = {
  accent: string;  // main color
  text:   string;  // lighter, for labels/values
  bg:     string;  // subtle background (8%)
  bgMid:  string;  // mid background (16%)
  border: string;  // subtle border (20%)
};

const INDIGO_PALETTE: TabPalette = {
  accent: '#5E6AD2',
  text:   '#8b95e0',
  bg:     'rgba(94,106,210,0.08)',
  bgMid:  'rgba(94,106,210,0.16)',
  border: 'rgba(94,106,210,0.22)',
};

export const TAB_PALETTE: Record<string, TabPalette> = {
  index:    INDIGO_PALETTE,
  tasks:    INDIGO_PALETTE,
  fitness:  INDIGO_PALETTE,
  learning: INDIGO_PALETTE,
  growth:   INDIGO_PALETTE,
  skills:   INDIGO_PALETTE,
  settings: INDIGO_PALETTE,
};

// Per-tab signature color — MONOCHROME: all tabs are the one brand indigo.
export const TAB_COLORS: Record<string, string> = {
  index:     '#5E6AD2',
  tasks:     '#5E6AD2',
  fitness:   '#5E6AD2',
  learning:  '#5E6AD2',
  skills:    '#5E6AD2',
  growth:    '#5E6AD2',
  journal:   '#5E6AD2',
  finance:   '#5E6AD2',
  analytics: '#5E6AD2',
  settings:  '#5E6AD2',
};

// Category colors — MONOCHROME indigo tint scale (dim → bright), NOT a rainbow.
// Dots/timeline blocks read as one deliberate tint family.
export const CATEGORY_COLORS: Record<string, string> = {
  fitness:  '#8b95e0',
  work:     '#5E6AD2',
  learning: '#6E79D6',
  personal: '#98a1e8',
  meal:     '#7b85dd',
  sleep:    '#aab2ec',
  date:     '#b0b7ee',
  skill:    '#c3c8f2',
};

export const LEARNING_ROTATION: Record<number, string[]> = {
  1: [],
  2: [],
  3: [],
  4: [],
  5: [],
};

export const SKILL_LIST: string[] = [];

export const DEFAULT_HABITS = ['Exercise', 'Hydrate', 'Read', 'Sleep 8h', 'Walk'];

export const DEFAULT_MEAL_TIMINGS = { breakfast: '09:00', lunch: '13:00', snack: '17:00', dinner: '20:30' };

export const DEFAULT_GOALS = {
  weeklyGym: 5,
  weeklyStudyHours: 10,
  weeklyCigLimit: 0,
  weeklyWater: 56,
  weeklySleepAvg: 7.25,
  weeklySkillHours: 8,
  weeklyGymHours: 5,
  weeklyWalkHours: 7,
  weeklySwimHours: 3,
  weeklyJournalDays: 7,
  weeklyMindfulDays: 7,
};

export const DEFAULT_REMINDER_SETTINGS = {
  gymTime:        '06:30',  // morning gym push
  skincareTime:   '07:00',  // morning skincare
  breakfastTime:  '09:00',  // breakfast check-in
  lunchTime:      '13:00',  // lunch check-in
  snackTime:      '16:30',  // afternoon snack
  dinnerTime:     '19:30',  // dinner check-in
  habitsCheckTime:'20:00',  // evening habits nudge
  dailyLogTime:   '21:00',  // daily log / what did you do
  readingTime:    '22:00',  // put phone down, read
  journalTime:    '22:45',  // journal prompt
  sleepReminder:  '23:00',  // wind-down
};
