import { describe, expect, it } from 'vitest'
import { buildGraph } from '../graph/graph'
import type { SkillNode } from '../graph/nodes'
import { startProgress, type SkillProgress } from '../learner/progress'
import { createRng } from '../random/rng'
import { newCard, type Card } from '../scheduler/fsrs'
import { acknowledgeStep, answerJumpOffer, nextTask } from './next'
import { continueRun, openApp, startRun } from './start'
import { submitAttempt, xpFor, type AttemptInput } from './submit'
import { initialWorld, type EngineCtx, type Task, type World } from './world'

const node = (id: string, prereqs: string[] = []): SkillNode => ({ id, week: 0, prereqs, title: { en: id, ru: id }, highYield: false })
// ladder: a, b, g, c, d, e, f
const GRAPH = buildGraph([node('a'), node('b', ['a']), node('c', ['b']), node('d', ['c']), node('e', ['d']), node('f', ['e']), node('g', ['a'])])
const NOW = new Date(2026, 8, 21, 10, 0)
const ctxAt = (now = NOW): EngineCtx => ({ graph: GRAPH, hasTemplate: () => true, expectedSeconds: () => 60, now, rng: createRng(1) })

const RIGHT: AttemptInput = { correct: true, hintsUsed: 0, seconds: 40 }
const FAST: AttemptInput = { correct: true, hintsUsed: 0, seconds: 10 }
const WRONG: AttemptInput = { correct: false, hintsUsed: 0, seconds: 40 }

const begin = (world: World = initialWorld(NOW), ctx = ctxAt()): World => startRun(world, ctx)
const peek = (world: World): { world: World; task: Task } => nextTask(world, ctxAt())

function answer(world: World, input: AttemptInput) {
  const { world: shown, task } = nextTask(world, ctxAt())
  if (task.type !== 'problem') throw new Error(`expected a problem, got ${task.type}`)
  return { ...submitAttempt(shown, input, ctxAt()), task }
}

function passExpress(world: World, skills: number): World {
  let w = world
  for (let i = 0; i < skills * 2; i += 1) w = answer(w, RIGHT).world
  return w
}

function finishLesson(world: World, skillId: string): World {
  let w = world
  for (let i = 0; i < 20 && w.progress[skillId]?.phase !== 'mastered'; i += 1) {
    const { world: shown, task } = peek(w)
    w = task.type === 'theory' || task.type === 'worked' ? acknowledgeStep(shown) : submitAttempt(shown, RIGHT, ctxAt()).world
  }
  return w
}

const masteredWith = (id: string, card: Card): SkillProgress => ({ ...startProgress(id, 0), phase: 'mastered', masteredAt: 0, card })

describe('run start', () => {
  it('starts a fresh learner in the new phase with a mid quota', () => {
    const w = begin()
    expect(w.run).toMatchObject({ phase: 'new', lessonQuota: 2, warmupQueue: [] })
    expect(startRun(w, ctxAt())).toBe(w)
  })

  it('nextTask is idempotent until the task is answered', () => {
    const first = peek(begin())
    expect(peek(first.world).task).toEqual(first.task)
  })

  it('openApp rolls the day over and drops a stale run', () => {
    const yesterday = new Date(2026, 8, 20, 22)
    const opened = openApp(begin(initialWorld(yesterday), ctxAt(yesterday)), NOW)
    expect(opened.day.date).toBe('2026-09-21')
    expect(opened.run).toBeNull()
  })
})

describe('express from the base', () => {
  it('masters the first skill on 2/2 and moves up the ladder', () => {
    const first = peek(begin())
    expect(first.task).toMatchObject({ type: 'problem', skillId: 'a', mode: 'express', tier: 2 })
    const one = answer(begin(), RIGHT)
    expect(one.events).toEqual(['correct'])
    const two = answer(one.world, RIGHT)
    expect(two.events).toEqual(['correct', 'express-passed', 'mastered'])
    expect(two.world.progress.a.phase).toBe('mastered')
    expect(two.world.progress.a.card).not.toBeNull()
    expect(two.world.meta.expressStreak).toBe(1)
    expect(peek(two.world).task).toMatchObject({ skillId: 'b', mode: 'express' })
  })

  it('fast express answers earn an Easy first interval', () => {
    const w = answer(answer(begin(), FAST).world, FAST).world
    expect(w.progress.a.card?.scheduled_days).toBeGreaterThan(5)
  })
})

describe('lesson fallback', () => {
  it('runs theory → worked → faded → T1 → T2 → mastered', () => {
    const fail = answer(begin(), WRONG)
    expect(fail.events).toEqual(['incorrect', 'express-failed'])
    expect(fail.world.run?.lessonsStarted).toEqual(['a'])
    expect(peek(fail.world).task).toEqual({ type: 'theory', skillId: 'a' })
    let w = acknowledgeStep(peek(fail.world).world)
    expect(peek(w).task).toMatchObject({ type: 'worked', skillId: 'a' })
    w = acknowledgeStep(peek(w).world)
    expect(peek(w).task).toMatchObject({ type: 'problem', mode: 'lesson', tier: 1, faded: true })
    let r = answer(w, RIGHT)
    r = answer(r.world, RIGHT)
    expect(r.events).toContain('tier-up')
    expect(peek(r.world).task).toMatchObject({ mode: 'lesson', tier: 2, faded: false })
    r = answer(answer(answer(r.world, RIGHT).world, RIGHT).world, RIGHT)
    expect(r.events).toContain('mastered')
    expect(r.world.progress.a.phase).toBe('mastered')
  })

  it('two T1 misses queue a prerequisite check; a pass resumes the lesson', () => {
    const base = { ...initialWorld(NOW), progress: { a: masteredWith('a', newCard('good', NOW, 120)) } }
    const fail = answer(begin(base), WRONG)
    expect(fail.task).toMatchObject({ skillId: 'b', mode: 'express' })
    let w = acknowledgeStep(peek(fail.world).world)
    w = acknowledgeStep(peek(w).world)
    let r = answer(w, WRONG)
    r = answer(r.world, WRONG)
    expect(r.events).toEqual(['incorrect', 'repair-queued'])
    expect(peek(r.world).task).toMatchObject({ skillId: 'a', mode: 'repair', tier: 2 })
    r = answer(r.world, RIGHT)
    expect(r.world.run?.repairQueue).toEqual([])
    expect(peek(r.world).task).toMatchObject({ skillId: 'b', mode: 'lesson', tier: 1 })
  })
})

describe('jumps', () => {
  it('offers a jump after three express passes and credits the whole path', () => {
    const w = passExpress(begin(), 3)
    expect(Object.keys(w.progress).sort()).toEqual(['a', 'b', 'g'])
    const offer = peek(w)
    expect(offer.task).toEqual({ type: 'jump-offer', target: 'f' })
    const jumping = answerJumpOffer(offer.world, true)
    expect(peek(jumping).task).toMatchObject({ skillId: 'f', mode: 'jump', tier: 2 })
    const done = answer(answer(jumping, RIGHT).world, RIGHT)
    expect(done.events).toEqual(['correct', 'jump-succeeded', 'mastered'])
    ;['c', 'd', 'e', 'f'].forEach((id) => expect(done.world.progress[id]).toMatchObject({ phase: 'mastered', implicit: true }))
    expect(done.world.meta).toMatchObject({ jumpStride: 8, expressStreak: 0 })
  })

  it('a declined jump continues with the next skill', () => {
    const w = answerJumpOffer(peek(passExpress(begin(), 3)).world, false)
    expect(w.run?.jumpDeclined).toBe(true)
    expect(peek(w).task).toMatchObject({ skillId: 'c', mode: 'express' })
  })

  it('a failed jump costs nothing but resets the stride', () => {
    const r = answer(answerJumpOffer(peek(passExpress(begin(), 3)).world, true), WRONG)
    expect(r.events).toEqual(['incorrect', 'jump-failed'])
    expect(r.world.meta.jumpStride).toBe(4)
    expect(r.world.progress.f).toBeUndefined()
    expect(peek(r.world).task).toMatchObject({ skillId: 'c', mode: 'express' })
  })
})

describe('mix and summary', () => {
  it('moves to mix once the lesson quota is used, then to the summary; continue adds one lesson', () => {
    const low = { ...initialWorld(NOW), meta: { ...initialWorld(NOW).meta, recent: [false, false, false, false, false] } }
    let w = begin(low)
    expect(w.run?.lessonQuota).toBe(1)
    w = finishLesson(answer(w, WRONG).world, 'a')
    const mix = peek(w)
    expect(mix.task).toMatchObject({ type: 'problem', mode: 'mix', skillId: 'a' })
    w = submitAttempt(mix.world, RIGHT, ctxAt()).world
    const summary = peek(w)
    expect(summary.task).toEqual({ type: 'summary' })
    const more = continueRun(summary.world)
    expect(more.run).toMatchObject({ phase: 'new', lessonQuota: 2 })
    expect(peek(more).task).toMatchObject({ skillId: 'b', mode: 'express' })
  })
})

describe('warmup, twins and repair', () => {
  it('reviews due skills first; a double miss checks prerequisites; a failed check reopens them', () => {
    const world: World = {
      ...initialWorld(NOW),
      progress: {
        a: masteredWith('a', newCard('good', new Date(2026, 8, 10), 120)),
        b: masteredWith('b', newCard('good', new Date(2026, 7, 1), 120)),
      },
    }
    const w = begin(world)
    expect(w.run).toMatchObject({ phase: 'warmup', warmupQueue: ['b', 'a'] })
    let r = answer(w, WRONG)
    expect(r.task).toMatchObject({ skillId: 'b', mode: 'review' })
    expect(r.events).toEqual(['incorrect', 'twin-queued'])
    expect(r.world.progress.b.card?.lapses).toBe(1)
    expect(peek(r.world).task).toMatchObject({ skillId: 'b', twin: true })
    r = answer(r.world, WRONG)
    expect(r.events).toEqual(['incorrect', 'repair-queued'])
    expect(r.world.progress.b.card?.lapses).toBe(1)
    expect(peek(r.world).task).toMatchObject({ skillId: 'a', mode: 'repair' })
    r = answer(r.world, WRONG)
    expect(r.events).toEqual(['incorrect', 'repair-failed'])
    expect(r.world.progress.a).toMatchObject({ phase: 'lesson', repair: true })
    expect(peek(r.world).task).toEqual({ type: 'theory', skillId: 'a' })
  })
})

describe('stats', () => {
  it('counts the day after five graded answers', () => {
    let w = begin()
    let events: readonly string[] = []
    for (let i = 0; i < 5; i += 1) {
      const r = answer(w, RIGHT)
      w = r.world
      events = r.events
    }
    expect(events).toContain('day-counted')
    expect(w.day).toMatchObject({ graded: 5, correct: 5, counted: true })
    expect(w.streak.current).toBe(1)
  })

  it('awards XP by expected minutes, halved with hints', () => {
    expect(xpFor(RIGHT, 60)).toBe(1)
    expect(xpFor(RIGHT, 180)).toBe(3)
    expect(xpFor({ ...RIGHT, hintsUsed: 1 }, 180)).toBe(1)
    expect(xpFor(WRONG, 180)).toBe(0)
  })

  it('guards against out-of-order calls', () => {
    expect(() => submitAttempt(begin(), RIGHT, ctxAt())).toThrow()
    expect(() => acknowledgeStep(peek(begin()).world)).toThrow()
    expect(() => answerJumpOffer(peek(begin()).world, true)).toThrow()
    expect(() => nextTask(initialWorld(NOW), ctxAt())).toThrow()
  })
})
