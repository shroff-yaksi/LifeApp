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

  // Primary accent — Linear blue-purple
  accent: '#5E6AD2',
  accentLight: '#8b95e0',
  accentGlow: 'rgba(94,106,210,0.12)',
  accentBg: 'rgba(94,106,210,0.08)',

  // Semantic palette — muted, desaturated
  green: '#3aa870',
  greenBg: 'rgba(58,168,112,0.08)',
  red: '#d95f5f',
  redBg: 'rgba(217,95,95,0.08)',
  orange: '#c4783a',
  orangeBg: 'rgba(196,120,58,0.08)',
  purple: '#9580d1',
  purpleBg: 'rgba(149,128,209,0.08)',
  pink: '#b06090',
  pinkBg: 'rgba(176,96,144,0.08)',
  yellow: '#b8952a',
  yellowBg: 'rgba(184,149,42,0.08)',
  cyan: '#2aabba',
  cyanBg: 'rgba(42,171,186,0.08)',
  teal: '#2b9e8f',
  tealBg: 'rgba(43,158,143,0.08)',
};

// Per-tab full palette — accent + 4 hues for monochromatic detailing
export type TabPalette = {
  accent: string;  // main color
  text:   string;  // lighter, for labels/values
  bg:     string;  // subtle background (8%)
  bgMid:  string;  // mid background (16%)
  border: string;  // subtle border (20%)
};

export const TAB_PALETTE: Record<string, TabPalette> = {
  index: {
    accent: '#5E6AD2',
    text:   '#8b95e0',
    bg:     'rgba(94,106,210,0.08)',
    bgMid:  'rgba(94,106,210,0.16)',
    border: 'rgba(94,106,210,0.22)',
  },
  tasks: {
    accent: '#4E8DB8',
    text:   '#7ab0d0',
    bg:     'rgba(78,141,184,0.08)',
    bgMid:  'rgba(78,141,184,0.16)',
    border: 'rgba(78,141,184,0.22)',
  },
  fitness: {
    accent: '#3aa870',
    text:   '#6dc49a',
    bg:     'rgba(58,168,112,0.08)',
    bgMid:  'rgba(58,168,112,0.16)',
    border: 'rgba(58,168,112,0.22)',
  },
  learning: {
    accent: '#c4783a',
    text:   '#d99a6a',
    bg:     'rgba(196,120,58,0.08)',
    bgMid:  'rgba(196,120,58,0.16)',
    border: 'rgba(196,120,58,0.22)',
  },
  skills: {
    accent: '#b06090',
    text:   '#cc8fb0',
    bg:     'rgba(176,96,144,0.08)',
    bgMid:  'rgba(176,96,144,0.16)',
    border: 'rgba(176,96,144,0.22)',
  },
  settings: {
    accent: '#606060',
    text:   '#909090',
    bg:     'rgba(96,96,96,0.08)',
    bgMid:  'rgba(96,96,96,0.16)',
    border: 'rgba(96,96,96,0.22)',
  },
};

// Per-tab signature colors — muted, professional
export const TAB_COLORS: Record<string, string> = {
  index:     '#5E6AD2', // Linear indigo
  tasks:     '#4E8DB8', // muted blue
  fitness:   '#3aa870', // muted green
  learning:  '#c4783a', // muted orange
  skills:    '#b06090', // muted pink
  journal:   '#9580d1', // muted purple
  finance:   '#2b9e8f', // muted teal
  analytics: '#9580d1', // muted purple
  settings:  '#606060', // neutral grey
};

export const CATEGORY_COLORS: Record<string, string> = {
  fitness: '#3aa870',
  work: '#5E6AD2',
  learning: '#c4783a',
  personal: '#b06090',
  meal: '#2aabba',
  sleep: '#9580d1',
  date: '#b06090',
  skill: '#b8952a',
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
