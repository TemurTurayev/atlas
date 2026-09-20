import { computeForecast } from '../forecast/forecast'
import type { SkillGraph } from '../graph'
import type { SkillProgress } from '../learner/progress'
import type { Rng } from '../random/rng'
import { retrievability } from '../scheduler/fsrs'
import type { EngineCtx, World } from '../session/world'
import type { Tier } from '../templates/types'
import type { ExamQuestion, ExamState } from './types'

/** The real paper: 60 minutes, pass at 45 %. */
export const EXAM_MINUTES = 60
export const EXAM_PASS_MARK = 0.45
/** Below this many mastered skills a mock exam tests too little to mean anything. */
export const EXAM_MIN_SKILLS = 8
export const EXAM_MAX_QUESTIONS = 20
export const EXAM_HISTORY_LIMIT = 10

/** A quarter of the time is left for reading and checking, as on paper. */
const TIME_BUDGET = EXAM_MINUTES * 60 * 0.75

export function examPool(world: World, ctx: EngineCtx): SkillProgress[] {
  return Object.values(world.progress).filter((p) => p.phase === 'mastered' && ctx.hasTemplate(p.skillId))
}

export function examReady(world: World, ctx: EngineCtx): boolean {
  return examPool(world, ctx).length >= EXAM_MIN_SKILLS
}

/** Exam tier: the hardest level only for skills that have held for a while. */
const tierFor = (p: SkillProgress): Tier => (p.card && p.card.stability > 10 ? 3 : 2)

/** Weakest and highest-yield skills first, with enough noise that two papers differ. */
function priority(graph: SkillGraph, p: SkillProgress, now: Date, rng: Rng): number {
  const weight = graph.node(p.skillId).highYield ? 2 : 1
  const gap = 1.1 - (p.card ? retrievability(p.card, now) : 1)
  return weight * gap * (0.75 + 0.5 * rng.next())
}

/** Half again the expected solving time, rounded up to five minutes, never past the real hour. */
export function examMinutes(expectedSeconds: number): number {
  return Math.min(EXAM_MINUTES, Math.max(10, Math.ceil((expectedSeconds * 1.5) / 300) * 5))
}

export function buildExam(world: World, ctx: EngineCtx): ExamState {
  const pool = examPool(world, ctx)
  if (pool.length === 0) throw new Error('buildExam: nothing is mastered yet')
  const ranked = pool
    .map((p) => ({ p, score: priority(ctx.graph, p, ctx.now, ctx.rng) }))
    .sort((a, b) => b.score - a.score)
    .map((x) => x.p)

  const chosen: { readonly skillId: string; readonly tier: Tier }[] = []
  let seconds = 0
  for (const p of ranked) {
    if (chosen.length >= EXAM_MAX_QUESTIONS) break
    const tier = tierFor(p)
    const cost = ctx.expectedSeconds(p.skillId, tier)
    if (chosen.length > 0 && seconds + cost > TIME_BUDGET) break
    chosen.push({ skillId: p.skillId, tier })
    seconds += cost
  }

  const questions: ExamQuestion[] = ctx.rng.shuffle(chosen).map((c) => ({ ...c, seed: ctx.rng.seed() }))
  return {
    startedAt: ctx.now.getTime(),
    minutes: examMinutes(seconds),
    questions,
    answers: {},
    index: 0,
    forecastAtStart: computeForecast(ctx.graph, world.progress, ctx.now).exam,
    finishedAt: null,
    graded: null,
  }
}
