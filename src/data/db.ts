import Dexie, { type Table } from 'dexie'
import type { SkillProgress } from '../core/learner/progress'
import type { DayStats } from '../core/session/world'

export interface AttemptLog {
  readonly id?: number
  readonly skillId: string
  readonly seed: number
  readonly tier: number
  readonly mode: string
  readonly correct: boolean
  readonly hintsUsed: number
  readonly seconds: number
  /** What the learner typed (LaTeX or a short description). */
  readonly answer: string
  readonly at: number
}

export interface KvRow {
  readonly key: string
  readonly value: unknown
}

export class AtlasDb extends Dexie {
  declare progress: Table<SkillProgress, string>
  declare attempts: Table<AttemptLog, number>
  declare kv: Table<KvRow, string>
  declare days: Table<DayStats, string>

  constructor(name = 'atlas') {
    super(name)
    this.version(1).stores({
      progress: 'skillId, phase',
      attempts: '++id, skillId, at',
      kv: 'key',
      days: 'date',
    })
  }
}
