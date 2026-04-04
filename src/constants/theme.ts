export const Colors = {
  // Surface hierarchy — Obsidian Life Protocol
  bg: '#131315',               // surface / base
  sidebarBg: '#0e0e10',        // surface-container-lowest
  card: '#1c1b1d',             // surface-container-low
  cardHover: '#201f22',        // surface-container
  surface: '#201f22',          // surface-container
  surfaceHigh: '#2a2a2c',      // surface-container-high
  surfaceHighest: '#353437',   // surface-container-highest

  // Ghost borders (suggestion only, not dividers)
  border: 'rgba(70,69,84,0.2)',
  borderHover: 'rgba(70,69,84,0.4)',

  // Typography
  text: '#e5e1e4',             // on-surface
  textSecondary: '#c7c4d7',    // on-surface-variant
  textMuted: '#908fa0',        // outline

  // Primary accent — Indigo/Lavender
  accent: '#6366f1',           // indigo-500
  accentLight: '#c0c1ff',      // primary lavender
  accentGlow: 'rgba(99,102,241,0.2)',
  accentBg: 'rgba(99,102,241,0.1)',

  // Semantic palette
  green: '#4ade80',
  greenBg: 'rgba(74,222,128,0.08)',
  red: '#ffb4ab',              // error token
  redBg: 'rgba(255,180,171,0.08)',
  orange: '#ffb783',           // tertiary
  orangeBg: 'rgba(255,183,131,0.08)',
  purple: '#c0c1ff',
  purpleBg: 'rgba(192,193,255,0.08)',
  pink: '#f472b6',
  pinkBg: 'rgba(244,114,182,0.08)',
  yellow: '#facc15',
  yellowBg: 'rgba(250,204,21,0.08)',
  cyan: '#22d3ee',
  cyanBg: 'rgba(34,211,238,0.08)',
};

export const CATEGORY_COLORS: Record<string, string> = {
  fitness: '#4ade80',
  work: '#6366f1',
  learning: '#ffb783',
  personal: '#f472b6',
  meal: '#22d3ee',
  sleep: '#c0c1ff',
  date: '#f472b6',
  skill: '#facc15',
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
