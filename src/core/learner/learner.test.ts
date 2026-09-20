import { describe, expect, it } from 'vitest'
import { buildGraph } from '../graph/graph'
import type { SkillNode } from '../graph/nodes'
import { newCard } from '../scheduler/fsrs'
import { jumpCredits, pickJumpTarget } from './jump'
import {
  INITIAL_META, jumpAllowed, lessonQuota, momentum, onExpressFailed, onExpressPassed, onJumpFailed, onJumpSucceeded, recordResult,
} from './meta'
import { advanceLessonStep, applyLearning, creditImplicit, startProgress, toRepairLesson, type SkillProgress } from './progress'
import { repairCandidates } from './repair'

const node = (id: string, prereqs: string[] = []): SkillNode => ({ id, week: 0, prereqs, title: { en: id, ru: id }, highYield: false })
const CHAIN = buildGraph([node('a'), node('b', ['a']), node('c', ['b']), node('d', ['c']), node('e', ['d']), node('f', ['e'])])
const clean = { correct: true, hintsUsed: 0 }
const hinted = { correct: true, hintsUsed: 1 }
const wrong = { correct: false, hintsUsed: 0 }

describe('express check', () => {
  it('masters after two clean answers', () => {
    const one = applyLearning(startProgress('a', 0), clean, 2, 10)
    expect(one.events).toEqual([])
    const two = applyLearning(one.progress, clean, 2, 20)
    expect(two.events).toEqual(['express-passed', 'mastered'])
    expect(two.progress).toMatchObject({ phase: 'mastered', masteredAt: 20 })
  })
  it.each([[wrong], [hinted]])('drops into a lesson on %o', (g) => {
    const r = applyLearning(startProgress('a', 0), g, 2, 10)
    expect(r.events).toEqual(['express-failed'])
    expect(r.progress).toMatchObject({ phase: 'lesson', lessonStep: 'theory', tier: 1 })
  })
})

describe('lesson', () => {
  const lesson = (over: Partial<SkillProgress> = {}): SkillProgress => ({
    ...startProgress('a', 0), phase: 'lesson', lessonStep: 'practice', ...over,
  })

  it('walks theory → worked → faded → practice', () => {
    const steps = [lesson({ lessonStep: 'theory' })]
    for (let i = 0; i < 4; i += 1) steps.push(advanceLessonStep(steps[steps.length - 1]))
    expect(steps.map((s) => s.lessonStep)).toEqual(['theory', 'worked', 'faded', 'practice', 'practice'])
  })

  it('a faded answer moves the lesson to practice', () => {
    expect(applyLearning(lesson({ lessonStep: 'faded' }), clean, 1, 0).progress.lessonStep).toBe('practice')
  })

  it('tiers up after two correct at T1 (hints allowed)', () => {
    const one = applyLearning(lesson(), hinted, 1, 0)
    const two = applyLearning(one.progress, clean, 1, 0)
    expect(two.events).toEqual(['tier-up'])
    expect(two.progress.tier).toBe(2)
  })

  it('asks for repair after two misses at T1', () => {
    const one = applyLearning(lesson(), wrong, 1, 0)
    expect(one.events).toEqual([])
    const two = applyLearning(one.progress, wrong, 1, 0)
    expect(two.events).toEqual(['repair-needed'])
    expect(two.progress.wrongStreakT1).toBe(0)
  })

  it('masters with 3 of the last 4 clean at T2', () => {
    let p = lesson({ tier: 2 })
    p = applyLearning(p, clean, 2, 0).progress
    p = applyLearning(p, hinted, 2, 0).progress
    expect(p.tier).toBe(2)
    p = applyLearning(p, clean, 2, 0).progress
    const last = applyLearning(p, clean, 2, 99)
    expect(last.events).toEqual(['mastered'])
    expect(last.progress).toMatchObject({ phase: 'mastered', masteredAt: 99, repair: false })
  })

  it('drops back to T1 on a T2 miss', () => {
    const r = applyLearning(lesson({ tier: 2 }), wrong, 2, 0)
    expect(r.events).toEqual(['tier-down'])
    expect(r.progress.tier).toBe(1)
    expect(r.progress.t2Recent).toEqual([false])
  })

  it('keeps only the last 4 T2 results', () => {
    let p = lesson({ tier: 2, t2Recent: [false, false, false] })
    p = applyLearning(p, hinted, 2, 0).progress
    p = applyLearning(p, hinted, 2, 0).progress
    expect(p.t2Recent).toHaveLength(4)
  })

  it('ignores graded answers once mastered', () => {
    const m = { ...startProgress('a', 0), phase: 'mastered' as const }
    expect(applyLearning(m, wrong, 2, 0)).toEqual({ progress: m, events: [] })
  })

  it('credits implicitly and reopens as a repair lesson', () => {
    const credited = creditImplicit(undefined, 'x', 5)
    expect(credited).toMatchObject({ skillId: 'x', phase: 'mastered', implicit: true, masteredAt: 5 })
    expect(toRepairLesson(credited)).toMatchObject({ phase: 'lesson', repair: true, lessonStep: 'theory', tier: 1, masteredAt: null })
  })
})

describe('meta', () => {
  it('keeps the last 20 results and measures momentum', () => {
    let m = INITIAL_META
    expect(momentum(m)).toBe('mid')
    for (let i = 0; i < 25; i += 1) m = recordResult(m, true)
    expect(m.recent).toHaveLength(20)
    expect(momentum(m)).toBe('high')
    for (let i = 0; i < 8; i += 1) m = recordResult(m, false)
    expect(momentum(m)).toBe('low')
    expect([lessonQuota('high'), lessonQuota('mid'), lessonQuota('low')]).toEqual([3, 2, 1])
  })

  it('allows a jump after three express passes unless momentum is low', () => {
    let m = INITIAL_META
    for (let i = 0; i < 3; i += 1) m = onExpressPassed(m)
    expect(jumpAllowed(m)).toBe(true)
    expect(jumpAllowed(onExpressFailed(m))).toBe(false)
    expect(jumpAllowed({ ...m, recent: [false, false, false, false, false] })).toBe(false)
  })

  it('doubles the stride on success (max 12) and resets it on failure', () => {
    const once = onJumpSucceeded(INITIAL_META)
    expect(once.jumpStride).toBe(8)
    expect(onJumpSucceeded(once).jumpStride).toBe(12)
    expect(onJumpSucceeded(onJumpSucceeded(once)).jumpStride).toBe(12)
    expect(onJumpFailed(once)).toMatchObject({ jumpStride: 4, expressStreak: 0 })
  })
})

describe('jump', () => {
  it('targets the candidate with the most unmastered ancestors', () => {
    expect(pickJumpTarget(CHAIN, new Set(['a']), 4, () => true)).toBe('f')
    expect(pickJumpTarget(CHAIN, new Set(['a']), 2, () => true)).toBe('d')
    expect(pickJumpTarget(CHAIN, new Set(['a']), 4, (id) => id !== 'f')).toBe('e')
  })
  it('returns null when nothing is worth jumping to', () => {
    expect(pickJumpTarget(CHAIN, new Set(['a', 'b', 'c', 'd', 'e', 'f']), 4, () => true)).toBeNull()
    expect(pickJumpTarget(CHAIN, new Set(['a', 'b', 'c', 'd']), 4, () => true)).toBeNull()
  })
  it('credits the target and its unmastered ancestors in ladder order', () => {
    expect(jumpCredits(CHAIN, 'f', new Set(['a', 'b']), () => true)).toEqual(['c', 'd', 'e', 'f'])
    expect(jumpCredits(CHAIN, 'f', new Set(['a', 'b']), (id) => id !== 'd')).toEqual(['c', 'e', 'f'])
  })
})

describe('repair candidates', () => {
  it('prefers implicit prerequisites, then the weakest', () => {
    const graph = buildGraph([node('p1'), node('p2'), node('p3'), node('x', ['p1', 'p2', 'p3'])])
    const now = new Date(2026, 8, 20)
    const mastered = (id: string, card: SkillProgress['card'], implicit = false): SkillProgress => ({
      ...startProgress(id, 0), phase: 'mastered', card, implicit,
    })
    const progress = {
      p1: mastered('p1', newCard('good', now, 100)),
      p2: mastered('p2', newCard('good', new Date(2026, 7, 1), 100)),
      p3: mastered('p3', newCard('good', now, 100), true),
    }
    expect(repairCandidates(graph, 'x', progress, now)).toEqual(['p3', 'p2'])
    expect(repairCandidates(graph, 'x', { p1: startProgress('p1', 0) }, now)).toEqual([])
  })
})
