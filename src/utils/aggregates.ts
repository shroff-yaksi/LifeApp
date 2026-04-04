import { getData } from './storage';
import { TODAY, addDays, getDayType } from './helpers';
import { DEFAULT_HABITS } from '../constants/theme';

export type WeeklyStats = {
  habitPct: number;
  gymCount: number;
  studyHours: number;
  totalCigs: number;
  totalWater: number;
  avgSleep: number;
  skillHours: number;
  journalDays: number;
};

export async function getWeeklyAggregates(weekStart: string): Promise<WeeklyStats> {
  let habitTotal = 0, habitDone = 0, gymCount = 0, studyHours = 0, totalCigs = 0, totalWater = 0;
  let sleepTotal = 0, sleepDays = 0, skillHours = 0, journalDays = 0;
  const habits = await getData<string[]>('habits', DEFAULT_HABITS);

  for (let i = 0; i < 7; i++) {
    const ds = addDays(weekStart, i);
    if (ds > TODAY()) break;

    const hd = await getData<Record<string, boolean>>('habitData_' + ds, {});
    habits.forEach(h => { habitTotal++; if (hd[h]) habitDone++; });

    const dt = getDayType(ds);
    const tasks = await getData<any[]>('schedule_' + dt, []);
    const comp = await getData<Record<string, any>>('scheduleCompletion_' + ds, {});
    tasks.filter((t: any) => t.category === 'fitness').forEach((t: any) => { if (comp[t.id]) gymCount++; });

    const logs = await getData<any[]>('studyLogs', []);
    studyHours += logs.filter((l: any) => l.date === ds).reduce((s: number, l: any) => s + l.hours, 0);

    totalCigs += (await getData<any[]>('cigLog_' + ds, [])).length;
    totalWater += await getData<number>('water_' + ds, 0);

    const sleepLog = await getData<any[]>('sleepLog', []);
    const sleepEntry = sleepLog.find((s: any) => s.date === ds);
    if (sleepEntry) { sleepTotal += sleepEntry.hours; sleepDays++; }

    const sLogs = await getData<any[]>('skillLogs', []);
    skillHours += sLogs.filter((l: any) => l.date === ds).reduce((s: number, l: any) => s + l.hours, 0);

    const je = await getData<any>('journal_' + ds, null);
    if (je && (je.well || je.improve || je.learned || je.free)) journalDays++;
  }

  return {
    habitPct: habitTotal ? Math.round((habitDone / habitTotal) * 100) : 0,
    gymCount, studyHours, totalCigs, totalWater,
    avgSleep: sleepDays ? sleepTotal / sleepDays : 0,
    skillHours, journalDays,
  };
}

export async function getBacklogItems(): Promise<any[]> {
  const items: any[] = [];
  for (let i = 1; i <= 7; i++) {
    const ds = addDays(TODAY(), -i);
    const dt = getDayType(ds);
    const tasks = await getData<any[]>('schedule_' + dt, []);
    const comp = await getData<Record<string, any>>('scheduleCompletion_' + ds, {});
    tasks.forEach(t => {
      if (!comp[t.id] && t.category !== 'sleep' && t.category !== 'meal') {
        items.push({ date: ds, name: t.name, taskId: t.id, category: t.category });
      }
    });
  }
  return items;
}
