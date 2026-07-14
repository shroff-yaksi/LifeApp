import { getData, setData } from './storage';
import { uid } from './helpers';

/**
 * Schema migration runner.
 *
 * Storage was informal/unversioned through v1.1. This runner introduces a single
 * global `schemaVersion` key and an ordered list of migrations so that new releases
 * can reshape on-device data safely, before v1.2+ starts adding keys aggressively.
 *
 * Model:
 *  - All pre-migration (v1.1) data is, by definition, schema v1 (BASELINE_VERSION).
 *  - A device with no `schemaVersion` key is treated as v1 — its data already matches
 *    the v1 shape, so nothing runs; we just stamp it.
 *  - Each migration bumps the schema by one `to` step and MUST be idempotent (safe to
 *    re-run) and must never throw on already-migrated data.
 *  - On a migration failure we stop and leave `schemaVersion` at the last version that
 *    fully applied, so the failed step retries on the next launch (fail-safe, no data
 *    half-written into a "done" state).
 */

export const SCHEMA_VERSION_KEY = 'schemaVersion';

/** All pre-migration (v1.1) data is schema v1. */
const BASELINE_VERSION = 1;

/** The schema version the current code expects. Bump when adding a migration. */
export const CURRENT_SCHEMA_VERSION = 2;

type Migration = {
  /** The schema version this migration produces. */
  to: number;
  /** Idempotent transform from version `to - 1` to `to`. */
  run: () => Promise<void>;
};

/**
 * v2 — 7-day schedule templates. Copies the old day-type templates
 * (schedule_weekday / _saturday / _sunday) into per-weekday keys
 * (schedule_mon … schedule_sun). Old keys are left intact (readable one release).
 * Idempotent: a target key that already holds data is never overwritten, so a
 * re-run can't clobber edits made after the first migration.
 */
async function migrateToSevenDayTemplates(): Promise<void> {
  const weekday = await getData<any[]>('schedule_weekday', []);
  const saturday = await getData<any[]>('schedule_saturday', []);
  const sunday = await getData<any[]>('schedule_sunday', []);

  const seed = async (key: string, src: any[]) => {
    const existing = await getData<any[] | null>(key, null);
    if (existing !== null) return; // already populated — don't clobber
    await setData(key, src.map(t => ({ ...t, id: uid() }))); // fresh ids per template
  };

  await seed('schedule_mon', weekday);
  await seed('schedule_tue', weekday);
  await seed('schedule_wed', weekday);
  await seed('schedule_thu', weekday);
  await seed('schedule_fri', weekday);
  await seed('schedule_sat', saturday);
  await seed('schedule_sun', sunday);
}

/** Ordered by `to` ascending. */
const MIGRATIONS: Migration[] = [
  { to: 2, run: migrateToSevenDayTemplates },
];

export async function runMigrations(): Promise<number> {
  const stored = await getData<number | null>(SCHEMA_VERSION_KEY, null);
  const from = stored ?? BASELINE_VERSION;

  let applied = from;
  for (const m of [...MIGRATIONS].sort((a, b) => a.to - b.to)) {
    if (m.to > from && m.to <= CURRENT_SCHEMA_VERSION) {
      await m.run(); // if this throws, we stop; schemaVersion stays at `applied`
      applied = m.to;
    }
  }

  if (applied !== stored) {
    await setData(SCHEMA_VERSION_KEY, applied);
  }
  return applied;
}
