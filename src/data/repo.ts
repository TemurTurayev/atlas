import { INITIAL_META } from '../core/learner/meta'
import type { SkillProgress } from '../core/learner/progress'
import { openApp } from '../core/session/start'
import { DEFAULT_SETTINGS, emptyDay, type DayStats, type World } from '../core/session/world'
import { INITIAL_STREAK } from '../core/streak/streak'
import { dayKey } from '../core/time/day'
import type { AtlasDb, AttemptLog, KvRow } from './db'

const KV_KEYS = ['meta', 'streak', 'day', 'run', 'settings'] as const

export interface ExportFile {
  readonly app: 'atlas'
  readonly version: 1
  readonly exportedAt: string
  readonly progress: readonly SkillProgress[]
  readonly kv: readonly KvRow[]
  readonly days: readonly DayStats[]
  readonly attempts: readonly AttemptLog[]
}

export async function loadWorld(db: AtlasDb, now: Date): Promise<World> {
  const [rows, kvRows] = await Promise.all([db.progress.toArray(), db.kv.bulkGet([...KV_KEYS])])
  const kv = Object.fromEntries(KV_KEYS.map((k, i) => [k, kvRows[i]?.value]))
  const world: World = {
    progress: Object.fromEntries(rows.map((p) => [p.skillId, p])),
    meta: (kv.meta as World['meta'] | undefined) ?? INITIAL_META,
    streak: (kv.streak as World['streak'] | undefined) ?? INITIAL_STREAK,
    day: (kv.day as World['day'] | undefined) ?? emptyDay(dayKey(now)),
    run: (kv.run as World['run'] | undefined) ?? null,
    settings: { ...DEFAULT_SETTINGS, ...((kv.settings as Partial<World['settings']> | undefined) ?? {}) },
  }
  return openApp(world, now)
}

/** Persists what changed between `prev` and `next` (reference comparison). */
export async function saveWorld(db: AtlasDb, prev: World | null, next: World): Promise<void> {
  const changed = Object.values(next.progress).filter((p) => prev?.progress[p.skillId] !== p)
  const kvChanged: KvRow[] = KV_KEYS.filter((k) => !prev || prev[k] !== next[k]).map((k) => ({ key: k, value: next[k] }))
  await db.transaction('rw', [db.progress, db.kv, db.days], async () => {
    if (changed.length > 0) await db.progress.bulkPut(changed)
    if (kvChanged.length > 0) await db.kv.bulkPut(kvChanged)
    if (!prev || prev.day !== next.day) await db.days.put(next.day)
  })
}

export async function logAttempt(db: AtlasDb, log: AttemptLog): Promise<void> {
  await db.attempts.add(log)
}

export async function exportAll(db: AtlasDb, now: Date): Promise<string> {
  const [progress, kv, days, attempts] = await Promise.all([db.progress.toArray(), db.kv.toArray(), db.days.toArray(), db.attempts.toArray()])
  const file: ExportFile = { app: 'atlas', version: 1, exportedAt: now.toISOString(), progress, kv, days, attempts }
  return JSON.stringify(file)
}

const DATE_FIELDS: ReadonlySet<string> = new Set(['due', 'last_review'])
const reviveDates = (key: string, value: unknown): unknown => (DATE_FIELDS.has(key) && typeof value === 'string' ? new Date(value) : value)

function parseBackup(json: string): ExportFile {
  const parsed = JSON.parse(json, reviveDates) as Partial<ExportFile>
  const ok = parsed.app === 'atlas' && parsed.version === 1 && Array.isArray(parsed.progress) && Array.isArray(parsed.kv)
  if (!ok) throw new Error('Это не файл резервной копии Атласа')
  return { ...parsed, days: parsed.days ?? [], attempts: parsed.attempts ?? [] } as ExportFile
}

/** Replaces all local data with a backup file produced by `exportAll`. */
export async function importAll(db: AtlasDb, json: string): Promise<void> {
  const backup = parseBackup(json)
  await db.transaction('rw', [db.progress, db.kv, db.days, db.attempts], async () => {
    await Promise.all([db.progress.clear(), db.kv.clear(), db.days.clear(), db.attempts.clear()])
    await db.progress.bulkAdd([...backup.progress])
    await db.kv.bulkAdd([...backup.kv])
    await db.days.bulkAdd([...backup.days])
    await db.attempts.bulkAdd([...backup.attempts])
  })
}
