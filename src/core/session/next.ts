import { jumpAllowed } from '../learner/meta'
import { markServed, mistakeFor } from '../mistakes/log'
import { pickJumpTarget } from '../learner/jump'
import { advanceLessonStep, startProgress, type SkillProgress } from '../learner/progress'
import type { Tier } from '../templates/types'
import {
  MIX_TARGET, SHORT_MIX_TARGET, masteredSet, requireRun, withProgress, withRun, type EngineCtx, type Mode, type RunState, type Task, type World,
} from './world'

type Step = { readonly kind: 'task'; readonly world: World; readonly task: Task } | { readonly kind: 'transition'; readonly world: World }

const show = (world: World, task: Task): Step => ({ kind: 'task', world, task })
const move = (world: World): Step => ({ kind: 'transition', world })

function problem(
  ctx: EngineCtx,
  skillId: string,
  tier: Tier,
  mode: Mode,
  opts: { faded?: boolean; twin?: boolean; fromMistake?: boolean } = {},
): Task {
  return {
    type: 'problem',
    skillId,
    seed: ctx.rng.seed(),
    tier,
    mode,
    faded: opts.faded ?? false,
    twin: opts.twin ?? false,
    fromMistake: opts.fromMistake ?? false,
  }
}

function decideWarmup(world: World, run: RunState, ctx: EngineCtx): Step {
  if (run.warmupIndex >= run.warmupQueue.length) return move(withRun(world, { ...run, phase: 'new' }))
  const skillId = run.warmupQueue[run.warmupIndex]
  const p = world.progress[skillId]
  if (!p || p.phase !== 'mastered') return move(withRun(world, { ...run, warmupIndex: run.warmupIndex + 1 }))
  const missed = mistakeFor(world.mistakes, skillId)
  if (missed && !missed.served) {
    // The very problem that was missed comes back once; a catalogue of mistakes that never
    // returns is what makes ordinary error logs useless.
    const task: Task = { type: 'problem', skillId, seed: missed.seed, tier: missed.tier, mode: 'review', faded: false, twin: false, fromMistake: true }
    return show({ ...world, mistakes: markServed(world.mistakes, skillId) }, task)
  }
  const tier: Tier = p.card && p.card.stability > 14 ? 3 : 2
  return show(world, problem(ctx, skillId, tier, 'review', { fromMistake: missed !== undefined }))
}

function activeSkillStep(world: World, p: SkillProgress, ctx: EngineCtx): Step {
  if (p.phase === 'express') return show(world, problem(ctx, p.skillId, 2, 'express'))
  switch (p.lessonStep) {
    case 'theory':
      return show(world, { type: 'theory', skillId: p.skillId })
    case 'worked':
      return show(world, { type: 'worked', skillId: p.skillId, seed: ctx.rng.seed() })
    case 'faded':
      return show(world, problem(ctx, p.skillId, 1, 'lesson', { faded: true }))
    case 'practice':
      return show(world, problem(ctx, p.skillId, p.tier, 'lesson'))
  }
}

function pickNextSkill(world: World, run: RunState, ctx: EngineCtx, mastered: ReadonlySet<string>): string | null {
  const ready = (id: string) => ctx.hasTemplate(id) && ctx.graph.node(id).prereqs.every((p) => mastered.has(p))
  const byLadder = (a: string, b: string) => (ctx.graph.ladderIndex.get(a) ?? 0) - (ctx.graph.ladderIndex.get(b) ?? 0)
  const open = Object.values(world.progress).filter((p) => p.phase !== 'mastered' && ready(p.skillId))
  const repairs = open.filter((p) => p.repair).map((p) => p.skillId).sort(byLadder)
  if (repairs.length > 0) return repairs[0]
  const inRun = open.filter((p) => p.phase === 'express' || run.lessonsStarted.includes(p.skillId)).map((p) => p.skillId).sort(byLadder)
  if (inRun.length > 0) return inRun[0]
  if (run.lessonsStarted.length >= run.lessonQuota) return null
  const resumable = open.map((p) => p.skillId).sort(byLadder)
  if (resumable.length > 0) return resumable[0]
  return ctx.graph.ladder.find((id) => !world.progress[id] && ready(id)) ?? null
}

function decideNew(world: World, run: RunState, ctx: EngineCtx): Step {
  if (run.short && !run.activeSkill) return move(withRun(world, { ...run, phase: 'mix' }))
  if (run.activeSkill) {
    const p = world.progress[run.activeSkill]
    if (!p || p.phase === 'mastered') return move(withRun(world, { ...run, activeSkill: null }))
    return activeSkillStep(world, p, ctx)
  }
  const mastered = masteredSet(world)
  if (jumpAllowed(world.meta) && !run.jumpDeclined) {
    const target = pickJumpTarget(ctx.graph, mastered, world.meta.jumpStride, ctx.hasTemplate)
    if (target) return show(world, { type: 'jump-offer', target })
  }
  const next = pickNextSkill(world, run, ctx, mastered)
  if (!next) return move(withRun(world, { ...run, phase: 'mix' }))
  const progress = world.progress[next] ?? startProgress(next, ctx.now.getTime())
  const lessonsStarted =
    progress.phase === 'lesson' && !run.lessonsStarted.includes(next) ? [...run.lessonsStarted, next] : run.lessonsStarted
  return move(withRun(withProgress(world, progress), { ...run, activeSkill: next, lessonsStarted }))
}

function decideMix(world: World, run: RunState, ctx: EngineCtx): Step {
  const pool = Object.values(world.progress).filter((p) => p.phase === 'mastered' && ctx.hasTemplate(p.skillId))
  const target = Math.min(run.short ? SHORT_MIX_TARGET : MIX_TARGET, pool.length)
  if (run.mixDone >= target) return move(withRun(world, { ...run, phase: 'summary' }))
  const recent = [...pool].sort((a, b) => (b.masteredAt ?? 0) - (a.masteredAt ?? 0)).slice(0, 6).map((p) => p.skillId)
  const older = ctx.rng.shuffle(pool.map((p) => p.skillId).filter((id) => !recent.includes(id))).slice(0, 3)
  const all = [...recent, ...older]
  const candidates = all.filter((id) => id !== run.lastSkill)
  return show(world, problem(ctx, ctx.rng.pick(candidates.length > 0 ? candidates : all), 2, 'mix'))
}

function decide(world: World, ctx: EngineCtx): Step {
  const run = requireRun(world)
  if (run.twin) return show(world, problem(ctx, run.twin.skillId, run.twin.tier, run.twin.mode, { twin: true }))
  if (run.repairQueue.length > 0) return show(world, problem(ctx, run.repairQueue[0], 2, 'repair'))
  if (run.jump) return show(world, problem(ctx, run.jump.target, 2, 'jump'))
  switch (run.phase) {
    case 'warmup':
      return decideWarmup(world, run, ctx)
    case 'new':
      return decideNew(world, run, ctx)
    case 'mix':
      return decideMix(world, run, ctx)
    case 'summary':
      return show(world, { type: 'summary' })
  }
}

/** The task to show now. Idempotent: returns the stored current task until it is answered. */
export function nextTask(world: World, ctx: EngineCtx): { readonly world: World; readonly task: Task } {
  const run = requireRun(world)
  if (run.current) return { world, task: run.current }
  let state = world
  for (let guard = 0; guard < 50; guard += 1) {
    const step = decide(state, ctx)
    if (step.kind === 'task') return { world: withRun(step.world, { ...requireRun(step.world), current: step.task }), task: step.task }
    state = step.world
  }
  throw new Error('nextTask: no task after 50 transitions')
}

/** Accept or decline the pending jump offer. */
export function answerJumpOffer(world: World, accept: boolean): World {
  const run = requireRun(world)
  const current = run.current
  if (!current || current.type !== 'jump-offer') throw new Error('answerJumpOffer: no pending jump offer')
  return withRun(world, accept ? { ...run, current: null, jump: { target: current.target, correct: 0 } } : { ...run, current: null, jumpDeclined: true })
}

/** The learner finished reading a theory card or a worked example. */
export function acknowledgeStep(world: World): World {
  const run = requireRun(world)
  const current = run.current
  if (!current || (current.type !== 'theory' && current.type !== 'worked')) throw new Error('acknowledgeStep: current task is not a lesson step')
  const p = world.progress[current.skillId]
  if (!p) throw new Error(`acknowledgeStep: no progress for ${current.skillId}`)
  return withRun(withProgress(world, advanceLessonStep(p)), { ...run, current: null })
}
