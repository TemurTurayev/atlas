import type { SkillGraph } from '../graph/graph'
import { INITIAL_META, type LearnerMeta } from '../learner/meta'
import type { SkillProgress } from '../learner/progress'
import type { Rng } from '../random/rng'
import { INITIAL_STREAK, type StreakState } from '../streak/streak'
import type { Tier } from '../templates/types'
import { dayKey, daysBetween } from '../time/day'

export type Mode = 'express' | 'lesson' | 'review' | 'mix' | 'jump' | 'repair'

export type Task =
  | { readonly type: 'theory'; readonly skillId: string }
  | { readonly type: 'worked'; readonly skillId: string; readonly seed: number }
  | {
      readonly type: 'problem'
      readonly skillId: string
      readonly seed: number
      readonly tier: Tier
      readonly mode: Mode
      readonly faded: boolean
      readonly twin: boolean
    }
  | { readonly type: 'jump-offer'; readonly target: string }
  | { readonly type: 'summary' }

export type ProblemTask = Extract<Task, { readonly type: 'problem' }>
export type RunPhase = 'warmup' | 'new' | 'mix' | 'summary'

export interface RunState {
  readonly date: string
  readonly startedAt: number
  readonly forecastAtStart: number
  readonly phase: RunPhase
  readonly warmupQueue: readonly string[]
  readonly warmupIndex: number
  readonly activeSkill: string | null
  /** Skills that entered a lesson during this run (counts against the quota). */
  readonly lessonsStarted: readonly string[]
  readonly lessonQuota: number
  readonly repairQueue: readonly string[]
  readonly jump: { readonly target: string; readonly correct: number } | null
  readonly jumpDeclined: boolean
  readonly twin: { readonly skillId: string; readonly tier: Tier; readonly mode: Mode } | null
  readonly mixDone: number
  readonly lastSkill: string | null
  /** The task currently on screen. */
  readonly current: Task | null
}

export interface DayStats {
  readonly date: string
  readonly xp: number
  readonly graded: number
  readonly correct: number
  readonly counted: boolean
}

export interface Settings {
  readonly examDate: string
  readonly dailyGoalXp: number
  readonly sound: boolean
}

export interface World {
  readonly progress: Readonly<Record<string, SkillProgress>>
  readonly meta: LearnerMeta
  readonly streak: StreakState
  readonly day: DayStats
  readonly run: RunState | null
  readonly settings: Settings
}

export interface EngineCtx {
  readonly graph: SkillGraph
  readonly hasTemplate: (skillId: string) => boolean
  readonly expectedSeconds: (skillId: string, tier: Tier) => number
  readonly now: Date
  readonly rng: Rng
}

export const DEFAULT_SETTINGS: Settings = { examDate: '2027-01-29', dailyGoalXp: 40, sound: true }
export const WARMUP_LIMIT = 8
export const MIX_TARGET = 5
export const DAY_COUNT_THRESHOLD = 5

export const emptyDay = (date: string): DayStats => ({ date, xp: 0, graded: 0, correct: 0, counted: false })

export function initialWorld(now: Date): World {
  return { progress: {}, meta: INITIAL_META, streak: INITIAL_STREAK, day: emptyDay(dayKey(now)), run: null, settings: DEFAULT_SETTINGS }
}

export function requireRun(world: World): RunState {
  if (!world.run) throw new Error('No active run — call startRun first')
  return world.run
}

export const withRun = (world: World, run: RunState): World => ({ ...world, run })
export const withProgress = (world: World, p: SkillProgress): World => ({ ...world, progress: { ...world.progress, [p.skillId]: p } })

export function masteredSet(world: World): Set<string> {
  return new Set(Object.values(world.progress).filter((p) => p.phase === 'mastered').map((p) => p.skillId))
}

export function daysToExam(world: World, now: Date): number {
  return Math.max(1, daysBetween(dayKey(now), world.settings.examDate))
}
