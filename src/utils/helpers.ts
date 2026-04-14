const localDateStr = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const TODAY = () => localDateStr(new Date());

export const NOW_MINUTES = () => {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
};

export const timeToMin = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

export const formatTime12 = (t: string) => {
  let [h, m] = t.split(':').map(Number);
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, '0')} ${ap}`;
};

export const getDayType = (date: string | Date): 'weekday' | 'saturday' | 'sunday' => {
  const d = (date instanceof Date ? date : new Date(date + 'T00:00:00')).getDay();
  return d === 0 ? 'sunday' : d === 6 ? 'saturday' : 'weekday';
};

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export const dateStr = (d: Date) => localDateStr(d);

export const addDays = (ds: string, n: number) => {
  const d = new Date(ds + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return dateStr(d);
};

export const getWeekStart = (ds: string) => {
  const d = new Date(ds + 'T00:00:00');
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return dateStr(d);
};

export const getDayOfWeek = (ds: string) => new Date(ds + 'T00:00:00').getDay();

export const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};
