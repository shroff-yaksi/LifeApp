export const Colors = {
  // Surface hierarchy
  bg: '#0f0f11',
  sidebarBg: '#0a0a0c',
  card: '#18181b',
  cardHover: '#1e1e22',
  surface: '#1e1e22',
  surfaceHigh: '#252529',
  surfaceHighest: '#2f2f35',

  // Ghost borders
  border: 'rgba(255,255,255,0.07)',
  borderHover: 'rgba(255,255,255,0.14)',

  // Typography
  text: '#f1eef5',
  textSecondary: '#c4c0d8',
  textMuted: '#8a8898',

  // Primary accent — Indigo/Lavender
  accent: '#6366f1',
  accentLight: '#a5b4fc',
  accentGlow: 'rgba(99,102,241,0.25)',
  accentBg: 'rgba(99,102,241,0.12)',

  // Semantic palette — more vibrant
  green: '#22c55e',
  greenBg: 'rgba(34,197,94,0.12)',
  red: '#f87171',
  redBg: 'rgba(248,113,113,0.12)',
  orange: '#fb923c',
  orangeBg: 'rgba(251,146,60,0.12)',
  purple: '#a78bfa',
  purpleBg: 'rgba(167,139,250,0.12)',
  pink: '#f472b6',
  pinkBg: 'rgba(244,114,182,0.12)',
  yellow: '#fbbf24',
  yellowBg: 'rgba(251,191,36,0.12)',
  cyan: '#22d3ee',
  cyanBg: 'rgba(34,211,238,0.12)',
  teal: '#2dd4bf',
  tealBg: 'rgba(45,212,191,0.12)',
};

// Per-tab signature colors
export const TAB_COLORS: Record<string, string> = {
  index:     '#6366f1', // indigo
  schedule:  '#22d3ee', // cyan
  fitness:   '#22c55e', // green
  learning:  '#fb923c', // orange
  skills:    '#fbbf24', // yellow
  journal:   '#f472b6', // pink
  finance:   '#2dd4bf', // teal
  analytics: '#a78bfa', // purple
  settings:  '#94a3b8', // slate
};

export const CATEGORY_COLORS: Record<string, string> = {
  fitness: '#22c55e',
  work: '#6366f1',
  learning: '#fb923c',
  personal: '#f472b6',
  meal: '#22d3ee',
  sleep: '#a78bfa',
  date: '#f472b6',
  skill: '#fbbf24',
};

export const LEARNING_ROTATION: Record<number, string[]> = {
  1: ['Stock Market', 'Forex'],
  2: ['Quantitative Finance', 'Artificial Intelligence'],
  3: ['Research Work', 'Stock Market'],
  4: ['Forex', 'Quantitative Finance'],
  5: ['Artificial Intelligence', 'Research Work'],
};

export const SKILL_LIST = ['Guitar', 'Kathak', 'Cooking', 'Sports'];

export const DEFAULT_HABITS = ['Gym', 'Walking', 'Swimming', 'Reading', 'Healthy Diet', 'Skincare', 'Journalling'];

export const DEFAULT_MEAL_TIMINGS = { breakfast: '09:00', lunch: '13:00', snack: '17:00', dinner: '20:30' };

export const DEFAULT_GOALS = {
  weeklyGym: 5,
  weeklyStudyHours: 10,
  weeklyCigLimit: 5,
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
  waterIntervalMins: 90,
  waterStart: '09:00',
  waterEnd: '22:00',
  journalTime: '22:45',
  sleepReminder: '23:00',
  skincareTime: '07:00',
  nightlyRoutineTime: '23:00',
  preActivityMinutes: 15,
};
