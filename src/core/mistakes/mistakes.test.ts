import { describe, expect, it } from 'vitest'
import { buildGraph } from '../graph/graph'
import type { SkillNode } from '../graph/nodes'
import { startProgress, type SkillProgress } from '../learner/progress'
import { createRng } from '../random/rng'
import { newCard } from '../scheduler/fsrs'
import { nextTask } from '../session/next'
import { openApp, startRun } from '../session/start'
import { submitAttempt, type AttemptInput } from '../session/submit'
import { initialWorld, type EngineCtx, type World } from '../session/world'
import { applyResult, FIXES_TO_CLOSE, markServed, mistakeFor, MISTAKE_LIMIT, recordFix, recordMistake } from './log'
import type { Mistake } from './types'

const answered = (over: Partial<Parameters<typeof applyResult>[1]> = {}) => ({
  skillId: 'a',
  seed: 11,
  tier: 2 as const,
  correct: false,
  clean: false,
  wasMastered: true,
  ...over,
})

describe('the log', () => {
  it('files a miss on a mastered skill and keeps the problem that was missed', () => {
    const log = applyResult([], answered(), 1000)
    expect(log).toEqual([{ skillId: 'a', seed: 11, tier: 2, at: 1000, fixed: 0, served: false }])
  })

  it('ignores a miss on a skill that is still being learned', () => {
    expect(applyResult([], answered({ wasMastered: false }), 1000)).toEqual([])
  })

  it('a repeat miss replaces the entry and starts its progress over', () => {
    const first = applyResult([], answered(), 1000)
    const fixed = recordFix(first, 'a')
    const again = applyResult(fixed, answered({ seed: 22 }), 2000)
    expect(again).toEqual([{ skillId: 'a', seed: 22, tier: 2, at: 2000, fixed: 0, served: false }])
  })

  it('closes an entry after two clean answers, and not on a hinted one', () => {
    const log = applyResult([], answered(), 1000)
    const hinted = applyResult(log, answered({ correct: true, clean: false }), 2000)
    expect(hinted).toHaveLength(1)
    const once = applyResult(hinted, answered({ correct: true, clean: true }), 3000)
    expect(once[0].fixed).toBe(1)
    expect(applyResult(once, answered({ correct: true, clean: true }), 4000)).toEqual([])
    expect(FIXES_TO_CLOSE).toBe(2)
  })

  it('keeps the newest entries first and forgets the oldest', () => {
    const many = Array.from({ length: MISTAKE_LIMIT + 5 }).reduce<Mistake[]>(
      (log, _, i) => recordMistake(log, { skillId: `s${i}`, seed: i, tier: 2 }, i),
      [],
    )
    expect(many).toHaveLength(MISTAKE_LIMIT)
    expect(many[0].skillId).toBe(`s${MISTAKE_LIMIT + 4}`)
  })

  it('marks an entry served without touching the others', () => {
    const log = [...recordMistake([], { skillId: 'a', seed: 1, tier: 2 }, 0), ...recordMistake([], { skillId: 'b', seed: 2, tier: 2 }, 0)]
    const served = markServed(log, 'a')
    expect(mistakeFor(served, 'a')?.served).toBe(true)
    expect(mistakeFor(served, 'b')?.served).toBe(false)
  })
})

const node = (id: string, prereqs: string[] = []): SkillNode => ({ id, week: 0, prereqs, title: id, highYield: false })
const GRAPH = buildGraph([node('a'), node('b', ['a'])])
const NOW = new Date(2026, 8, 21, 10, 0)
const ctxAt = (now = NOW, seed = 5): EngineCtx => ({
  graph: GRAPH,
  hasTemplate: () => true,
  expectedSeconds: () => 60,
  now,
  rng: createRng(seed),
})
const RIGHT: AttemptInput = { correct: true, hintsUsed: 0, seconds: 40 }
const WRONG: AttemptInput = { correct: false, hintsUsed: 0, seconds: 40 }

function mastered(id: string, now: Date): SkillProgress {
  return { ...startProgress(id, 0), phase: 'mastered', masteredAt: 0, card: newCard('good', new Date(now.getTime() - 5 * 86_400_000), 120) }
}

const withSkill = (now: Date): World => ({ ...initialWorld(now), progress: { a: mastered('a', now) } })

/** Answers whatever is on screen and returns the world afterwards. */
function answer(world: World, input: AttemptInput, now: Date) {
  const { world: shown, task } = nextTask(world, ctxAt(now))
  if (task.type !== 'problem') throw new Error(`expected a problem, got ${task.type}`)
  return { ...submitAttempt(shown, input, ctxAt(now)), task }
}

describe('a mistake in a run', () => {
  const missed = (): { world: World; seed: number } => {
    const started = startRun(withSkill(NOW), ctxAt())
    const first = answer(started, WRONG, NOW)
    return { world: first.world, seed: first.task.seed }
  }

  it('is filed with the problem that was missed', () => {
    const { world, seed } = missed()
    expect(world.mistakes).toMatchObject([{ skillId: 'a', seed, fixed: 0, served: false }])
  })

  it('comes back as the very same problem at the start of the next run, once', () => {
    const { world, seed } = missed()
    const tomorrow = new Date(NOW.getTime() + 86_400_000)
    const next = startRun(openApp(world, tomorrow), ctxAt(tomorrow))
    const { world: shown, task } = nextTask(next, ctxAt(tomorrow))
    expect(task).toMatchObject({ type: 'problem', skillId: 'a', seed, fromMistake: true })
    expect(mistakeFor(shown.mistakes, 'a')?.served).toBe(true)

    const later = new Date(tomorrow.getTime() + 86_400_000)
    const after = submitAttempt(shown, RIGHT, ctxAt(tomorrow)).world
    const third = startRun(openApp(after, later), ctxAt(later, 99))
    const fresh = nextTask(third, ctxAt(later, 99)).task
    expect(fresh).toMatchObject({ skillId: 'a', fromMistake: true })
    expect(fresh.type === 'problem' && fresh.seed).not.toBe(seed)
  })

  it('leads the warm-up even when the skill is not due yet', () => {
    const { world } = missed()
    const soon = new Date(NOW.getTime() + 3_600_000)
    const run = startRun(openApp({ ...world, run: null }, soon), ctxAt(soon))
    expect(run.run?.warmupQueue).toEqual(['a'])
  })

  it('closes after two clean answers and stops coming back', () => {
    const { world } = missed()
    let w = world
    let day = NOW
    for (let i = 0; i < 2; i += 1) {
      day = new Date(day.getTime() + 86_400_000)
      w = startRun(openApp(w, day), ctxAt(day))
      w = answer(w, RIGHT, day).world
    }
    expect(w.mistakes).toEqual([])
  })
})
