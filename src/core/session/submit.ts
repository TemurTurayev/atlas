import { jumpCredits } from '../learner/jump'
import { applyResult } from '../mistakes/log'
import { onExpressFailed, onExpressPassed, onJumpFailed, onJumpSucceeded, recordResult } from '../learner/meta'
import { applyLearning, creditImplicit, toRepairLesson, type LearnerEvent, type SkillProgress } from '../learner/progress'
import { repairCandidates } from '../learner/repair'
import { gradeFor, newCard, reviewCard, reviewedToday } from '../scheduler/fsrs'
import { countDay } from '../streak/streak'
import type { Tier } from '../templates/types'
import {
  DAY_COUNT_THRESHOLD, daysToExam, masteredSet, requireRun, withProgress, withRun, type EngineCtx, type ProblemTask, type World,
} from './world'

export interface AttemptInput {
  readonly correct: boolean
  readonly hintsUsed: number
  readonly seconds: number
}

export type EngineEvent =
  | Exclude<LearnerEvent, 'repair-needed'>
  | 'correct' | 'incorrect' | 'repair-queued' | 'repair-failed' | 'jump-succeeded' | 'jump-failed' | 'day-counted' | 'twin-queued'

export interface SubmitResult {
  readonly world: World
  readonly events: readonly EngineEvent[]
  readonly xp: number
}

export interface EngineUpdate {
  readonly world: World
  readonly events: readonly EngineEvent[]
}

type Handled = EngineUpdate

const forward = (events: readonly LearnerEvent[]): EngineEvent[] =>
  events.filter((e): e is Exclude<LearnerEvent, 'repair-needed'> => e !== 'repair-needed')

/** XP ≈ minutes of focused work: full for a clean answer, half with hints, nothing when wrong. */
export function xpFor(input: AttemptInput, expectedSeconds: number): number {
  if (!input.correct) return 0
  const full = Math.max(1, Math.round(expectedSeconds / 60))
  return input.hintsUsed > 0 ? Math.max(1, Math.floor(full / 2)) : full
}

function requireProgress(world: World, skillId: string): SkillProgress {
  const p = world.progress[skillId]
  if (!p) throw new Error(`No progress for ${skillId}`)
  return p
}

/** Adds graded answers to today's totals and counts the day once the threshold is crossed. */
export function recordAnswers(world: World, outcomes: readonly boolean[], xp: number): EngineUpdate {
  const day = {
    ...world.day,
    xp: world.day.xp + xp,
    graded: world.day.graded + outcomes.length,
    correct: world.day.correct + outcomes.filter(Boolean).length,
  }
  const reaches = !day.counted && day.graded >= DAY_COUNT_THRESHOLD
  return {
    world: {
      ...world,
      day: reaches ? { ...day, counted: true } : day,
      streak: reaches ? countDay(world.streak, day.date) : world.streak,
      meta: outcomes.reduce((meta, correct) => recordResult(meta, correct), world.meta),
    },
    events: reaches ? ['day-counted'] : [],
  }
}

const recordStats = (world: World, input: AttemptInput, xp: number): Handled => recordAnswers(world, [input.correct], xp)

function handleExpress(world: World, task: ProblemTask, input: AttemptInput, ctx: EngineCtx): Handled {
  const update = applyLearning(requireProgress(world, task.skillId), input, task.tier, ctx.now.getTime())
  const events = forward(update.events)
  if (update.events.includes('mastered')) {
    const grade = input.seconds <= 0.6 * ctx.expectedSeconds(task.skillId, task.tier) ? 'easy' : 'good'
    const card = newCard(grade, ctx.now, daysToExam(world, ctx.now))
    return { world: { ...withProgress(world, { ...update.progress, card }), meta: onExpressPassed(world.meta) }, events }
  }
  if (update.events.includes('express-failed')) {
    const run = requireRun(world)
    const next = withRun(withProgress(world, update.progress), { ...run, lessonsStarted: [...run.lessonsStarted, task.skillId] })
    return { world: { ...next, meta: onExpressFailed(world.meta) }, events }
  }
  return { world: withProgress(world, update.progress), events }
}

function handleLesson(world: World, task: ProblemTask, input: AttemptInput, ctx: EngineCtx): Handled {
  const update = applyLearning(requireProgress(world, task.skillId), input, task.tier, ctx.now.getTime())
  const progress = update.events.includes('mastered')
    ? { ...update.progress, card: newCard('good', ctx.now, daysToExam(world, ctx.now)) }
    : update.progress
  const next = withProgress(world, progress)
  if (!update.events.includes('repair-needed')) return { world: next, events: forward(update.events) }
  const queue = repairCandidates(ctx.graph, task.skillId, next.progress, ctx.now)
  const events: EngineEvent[] = [...forward(update.events), ...(queue.length > 0 ? (['repair-queued'] as const) : [])]
  return { world: withRun(next, { ...requireRun(next), repairQueue: queue }), events }
}

function reviewed(world: World, skillId: string, input: AttemptInput, tier: Tier, ctx: EngineCtx): SkillProgress {
  const p = requireProgress(world, skillId)
  if (!p.card || reviewedToday(p.card, ctx.now)) return p
  const grade = gradeFor(input, ctx.expectedSeconds(skillId, tier))
  return { ...p, card: reviewCard(p.card, grade, ctx.now, daysToExam(world, ctx.now)) }
}

function handleReview(world: World, task: ProblemTask, input: AttemptInput, ctx: EngineCtx): Handled {
  const next = withProgress(world, reviewed(world, task.skillId, input, task.tier, ctx))
  const run = requireRun(next)
  const counted = task.twin
    ? run
    : task.mode === 'review'
      ? { ...run, warmupIndex: run.warmupIndex + 1 }
      : { ...run, mixDone: run.mixDone + 1 }
  if (input.correct) return { world: withRun(next, { ...counted, twin: null }), events: [] }
  if (!task.twin) {
    return { world: withRun(next, { ...counted, twin: { skillId: task.skillId, tier: task.tier, mode: task.mode } }), events: ['twin-queued'] }
  }
  const queue = repairCandidates(ctx.graph, task.skillId, next.progress, ctx.now)
  return { world: withRun(next, { ...counted, twin: null, repairQueue: queue }), events: queue.length > 0 ? ['repair-queued'] : [] }
}

function handleRepair(world: World, task: ProblemTask, input: AttemptInput, ctx: EngineCtx): Handled {
  const checked = reviewed(world, task.skillId, input, task.tier, ctx)
  const run = requireRun(world)
  if (input.correct) return { world: withRun(withProgress(world, checked), { ...run, repairQueue: run.repairQueue.slice(1) }), events: [] }
  const reopened = withProgress(world, toRepairLesson(checked))
  return { world: withRun(reopened, { ...run, repairQueue: [], activeSkill: null }), events: ['repair-failed'] }
}

function handleJump(world: World, input: AttemptInput, ctx: EngineCtx): Handled {
  const run = requireRun(world)
  const jump = run.jump
  if (!jump) throw new Error('handleJump: no active jump')
  if (!input.correct) return { world: { ...withRun(world, { ...run, jump: null }), meta: onJumpFailed(world.meta) }, events: ['jump-failed'] }
  if (jump.correct + 1 < 2) return { world: withRun(world, { ...run, jump: { ...jump, correct: jump.correct + 1 } }), events: [] }
  const now = ctx.now.getTime()
  const days = daysToExam(world, ctx.now)
  const credited = jumpCredits(ctx.graph, jump.target, masteredSet(world), ctx.hasTemplate)
  const progress = credited.reduce<Record<string, SkillProgress>>(
    (acc, id) => ({ ...acc, [id]: { ...creditImplicit(world.progress[id], id, now), card: newCard('hard', ctx.now, days) } }),
    { ...world.progress },
  )
  return { world: { ...world, progress, run: { ...run, jump: null }, meta: onJumpSucceeded(world.meta) }, events: ['jump-succeeded', 'mastered'] }
}

function handleMode(world: World, task: ProblemTask, input: AttemptInput, ctx: EngineCtx): Handled {
  switch (task.mode) {
    case 'express':
      return handleExpress(world, task, input, ctx)
    case 'lesson':
      return handleLesson(world, task, input, ctx)
    case 'review':
    case 'mix':
      return handleReview(world, task, input, ctx)
    case 'repair':
      return handleRepair(world, task, input, ctx)
    case 'jump':
      return handleJump(world, input, ctx)
  }
}

/** Records a graded answer to the current problem and updates everything it affects. */
export function submitAttempt(world: World, input: AttemptInput, ctx: EngineCtx): SubmitResult {
  const current = requireRun(world).current
  if (!current || current.type !== 'problem') throw new Error('submitAttempt: current task is not a problem')
  const xp = xpFor(input, ctx.expectedSeconds(current.skillId, current.tier))
  const stats = recordStats(world, input, xp)
  const cleared = withRun(stats.world, { ...requireRun(stats.world), current: null, lastSkill: current.skillId })
  const handled = handleMode(cleared, current, input, ctx)
  const mistakes = applyResult(
    world.mistakes,
    {
      skillId: current.skillId,
      seed: current.seed,
      tier: current.tier,
      correct: input.correct,
      clean: input.correct && input.hintsUsed === 0,
      wasMastered: world.progress[current.skillId]?.phase === 'mastered',
    },
    ctx.now.getTime(),
  )
  const outcome: EngineEvent = input.correct ? 'correct' : 'incorrect'
  return { world: { ...handled.world, mistakes }, events: [outcome, ...stats.events, ...handled.events], xp }
}
