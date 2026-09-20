import { computeForecast } from '../forecast/forecast'
import { lessonQuota, momentum } from '../learner/meta'
import { isDue, retrievability } from '../scheduler/fsrs'
import { rollover } from '../streak/streak'
import { dayKey } from '../time/day'
import { emptyDay, requireRun, WARMUP_LIMIT, withRun, type EngineCtx, type RunState, type World } from './world'

/** Call when the app opens: rolls the day over, applies streak freezes, drops yesterday's run. */
export function openApp(world: World, now: Date): World {
  const today = dayKey(now)
  const day = world.day.date === today ? world.day : emptyDay(today)
  const run = world.run && world.run.date === today ? world.run : null
  return { ...world, day, run, streak: rollover(world.streak, today) }
}

/** Mastered skills due today, lowest recall first. */
export function dueSkills(world: World, ctx: EngineCtx): string[] {
  return Object.values(world.progress)
    .flatMap((p) =>
      p.phase === 'mastered' && p.card && ctx.hasTemplate(p.skillId) && isDue(p.card, ctx.now)
        ? [{ id: p.skillId, r: retrievability(p.card, ctx.now) }]
        : [],
    )
    .sort((a, b) => a.r - b.r)
    .map((x) => x.id)
}

/** Starts today's run, or keeps the unfinished one. */
export function startRun(world: World, ctx: EngineCtx): World {
  const today = dayKey(ctx.now)
  if (world.run && world.run.date === today && world.run.phase !== 'summary') return world
  const warmupQueue = dueSkills(world, ctx).slice(0, WARMUP_LIMIT)
  const run: RunState = {
    date: today,
    startedAt: ctx.now.getTime(),
    forecastAtStart: computeForecast(ctx.graph, world.progress, ctx.now).exam,
    phase: warmupQueue.length > 0 ? 'warmup' : 'new',
    warmupQueue,
    warmupIndex: 0,
    activeSkill: null,
    lessonsStarted: [],
    lessonQuota: lessonQuota(momentum(world.meta)),
    repairQueue: [],
    jump: null,
    jumpDeclined: false,
    twin: null,
    mixDone: 0,
    lastSkill: null,
    current: null,
  }
  return { ...world, run }
}

/** From the summary screen: one more lesson, then another mix. */
export function continueRun(world: World): World {
  const run = requireRun(world)
  if (run.phase !== 'summary') return world
  return withRun(world, { ...run, phase: 'new', lessonQuota: run.lessonsStarted.length + 1, mixDone: 0, jumpDeclined: false, current: null })
}
