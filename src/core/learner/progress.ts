import type { Card } from '../scheduler/fsrs'
import type { Tier } from '../templates/types'

export type Phase = 'express' | 'lesson' | 'mastered'
export type LessonStep = 'theory' | 'worked' | 'faded' | 'practice'

export interface SkillProgress {
  readonly skillId: string
  readonly phase: Phase
  /** Clean answers so far in the express check (0–2). */
  readonly expressCorrect: number
  readonly lessonStep: LessonStep
  /** Practice tier inside a lesson. */
  readonly tier: Tier
  readonly streakAtTier: number
  readonly wrongStreakT1: number
  /** Last ≤ 4 T2 results (true = correct without hints). */
  readonly t2Recent: readonly boolean[]
  /** Mastered via a jump, never practised directly. */
  readonly implicit: boolean
  /** Reopened because a prerequisite check failed. */
  readonly repair: boolean
  readonly startedAt: number
  readonly masteredAt: number | null
  readonly card: Card | null
}

export type LearnerEvent = 'express-passed' | 'express-failed' | 'tier-up' | 'tier-down' | 'mastered' | 'repair-needed'

export interface Graded {
  readonly correct: boolean
  readonly hintsUsed: number
}

export interface LearningUpdate {
  readonly progress: SkillProgress
  readonly events: readonly LearnerEvent[]
}

const STEPS: readonly LessonStep[] = ['theory', 'worked', 'faded', 'practice']

export function startProgress(skillId: string, now: number): SkillProgress {
  return {
    skillId, phase: 'express', expressCorrect: 0, lessonStep: 'theory', tier: 1, streakAtTier: 0, wrongStreakT1: 0,
    t2Recent: [], implicit: false, repair: false, startedAt: now, masteredAt: null, card: null,
  }
}

const isClean = (g: Graded): boolean => g.correct && g.hintsUsed === 0
const master = (p: SkillProgress, now: number): SkillProgress => ({ ...p, phase: 'mastered', repair: false, masteredAt: now })

function applyExpress(p: SkillProgress, g: Graded, now: number): LearningUpdate {
  if (!isClean(g)) {
    return {
      progress: { ...p, phase: 'lesson', lessonStep: 'theory', tier: 1, streakAtTier: 0, wrongStreakT1: 0, t2Recent: [] },
      events: ['express-failed'],
    }
  }
  const expressCorrect = p.expressCorrect + 1
  if (expressCorrect >= 2) return { progress: master({ ...p, expressCorrect }, now), events: ['express-passed', 'mastered'] }
  return { progress: { ...p, expressCorrect }, events: [] }
}

function applyTier1(p: SkillProgress, g: Graded): LearningUpdate {
  if (g.correct) {
    const streak = p.streakAtTier + 1
    if (streak >= 2) return { progress: { ...p, tier: 2, streakAtTier: 0, wrongStreakT1: 0 }, events: ['tier-up'] }
    return { progress: { ...p, streakAtTier: streak, wrongStreakT1: 0 }, events: [] }
  }
  const misses = p.wrongStreakT1 + 1
  if (misses >= 2) return { progress: { ...p, streakAtTier: 0, wrongStreakT1: 0 }, events: ['repair-needed'] }
  return { progress: { ...p, streakAtTier: 0, wrongStreakT1: misses }, events: [] }
}

function applyTier2(p: SkillProgress, g: Graded, now: number): LearningUpdate {
  const t2Recent = [...p.t2Recent, isClean(g)].slice(-4)
  if (t2Recent.filter(Boolean).length >= 3) return { progress: master({ ...p, t2Recent }, now), events: ['mastered'] }
  if (!g.correct) return { progress: { ...p, t2Recent, tier: 1, streakAtTier: 0 }, events: ['tier-down'] }
  return { progress: { ...p, t2Recent }, events: [] }
}

/** Applies one graded answer given while the skill is in express or lesson phase. */
export function applyLearning(p: SkillProgress, g: Graded, tier: Tier, now: number): LearningUpdate {
  if (p.phase === 'express') return applyExpress(p, g, now)
  if (p.phase !== 'lesson') return { progress: p, events: [] }
  const base: SkillProgress = p.lessonStep === 'faded' ? { ...p, lessonStep: 'practice' } : p
  return tier >= 2 ? applyTier2(base, g, now) : applyTier1(base, g)
}

export function advanceLessonStep(p: SkillProgress): SkillProgress {
  const index = STEPS.indexOf(p.lessonStep)
  return { ...p, lessonStep: STEPS[Math.min(index + 1, STEPS.length - 1)] }
}

/** Mastered through a jump. The engine attaches the FSRS card. */
export function creditImplicit(p: SkillProgress | undefined, skillId: string, now: number): SkillProgress {
  return { ...(p ?? startProgress(skillId, now)), phase: 'mastered', implicit: true, repair: false, masteredAt: now }
}

/** A mastered skill whose check failed goes back to a lesson, flagged as repair. */
export function toRepairLesson(p: SkillProgress): SkillProgress {
  return {
    ...p, phase: 'lesson', repair: true, lessonStep: 'theory', tier: 1, streakAtTier: 0, wrongStreakT1: 0, t2Recent: [], masteredAt: null,
  }
}
