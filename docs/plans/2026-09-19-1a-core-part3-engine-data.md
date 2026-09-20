# Atlas 1A — Core, part 3: scheduler, learner, streak, forecast, session engine, persistence

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The adaptive brain of Atlas: per-skill spaced repetition (FSRS), the skill state machine (express → lesson → mastered, tiers, repair, jump, momentum), streak, exam forecast, the daily-run engine that decides the next task, and IndexedDB persistence.

**Architecture:** Everything is pure functions over an immutable `World` value. The engine never imports templates directly — an injected `EngineCtx` supplies `hasTemplate`, `expectedSeconds`, the clock and an RNG, which keeps it unit-testable on tiny fake graphs. Persistence (Dexie) stores `World` pieces and is the only async code.

**Tech Stack:** TypeScript, ts-fsrs 5.4.2 (exact), Dexie 4.4, fake-indexeddb (tests), Vitest.

**Prerequisites:** part 1 committed; part 2 Task 5 done (`src/core/templates/types.ts` exports `Tier`). Parts 2 and 3 touch disjoint files.

**Conventions:** work in `/Users/temur/Desktop/Claude/atlas`; do not commit; touch only listed files; no `console.log`; never mutate inputs; functions < 50 lines.

**Verified ts-fsrs 5.4.2 behaviour** (spike): with `enable_short_term: false`, a new card rated Again/Hard/Good/Easy is scheduled 1/2/3/8 days out; successive Goods go 3 → 14 → capped by `maximum_interval` (observed cap+1 once due to rounding). API: `fsrs(generatorParameters({...}))`, `createEmptyCard(now)`, `f.next(card, now, Rating.Good).card`, `f.get_retrievability(card, now, false)` → number. `Card` has `due: Date`, `stability`, `scheduled_days`, `reps`, `lapses`, `state`, `last_review?: Date`.

Spec reference: `docs/specs/2026-09-19-atlas-design.md` §4–§5 (loop, adaptive progression).

---

### Task 10: FSRS scheduler wrapper

**Files:**
- Create: `src/core/scheduler/fsrs.ts`, `src/core/scheduler/fsrs.test.ts`

- [ ] **Step 1: Write the failing test** — `src/core/scheduler/fsrs.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { gradeFor, isDue, maxIntervalFor, newCard, retrievability, reviewCard, reviewedToday } from './fsrs'

const NOW = new Date(2026, 8, 20, 10, 0)
const daysLater = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000)

describe('fsrs wrapper', () => {
  it('caps intervals at 21 days and at a third of the time left', () => {
    expect(maxIntervalFor(130)).toBe(21)
    expect(maxIntervalFor(30)).toBe(10)
    expect(maxIntervalFor(0)).toBe(1)
  })

  it('creates a fresh Good card a few days out, fully recalled now', () => {
    const card = newCard('good', NOW, 130)
    expect(card.scheduled_days).toBeGreaterThanOrEqual(2)
    expect(card.scheduled_days).toBeLessThanOrEqual(4)
    expect(retrievability(card, NOW)).toBeCloseTo(1, 2)
    expect(isDue(card, NOW)).toBe(false)
    expect(isDue(card, card.due)).toBe(true)
    expect(reviewedToday(card, NOW)).toBe(true)
    expect(reviewedToday(card, daysLater(NOW, 1))).toBe(false)
  })

  it('orders first intervals hard < good < easy', () => {
    const [hard, good, easy] = (['hard', 'good', 'easy'] as const).map((g) => newCard(g, NOW, 130).scheduled_days)
    expect(hard).toBeLessThan(good)
    expect(good).toBeLessThan(easy)
  })

  it('decays retrievability over time', () => {
    const card = newCard('good', NOW, 130)
    expect(retrievability(card, daysLater(NOW, 10))).toBeLessThan(0.9)
  })

  it('records lapses on Again and respects the cap', () => {
    const card = newCard('good', NOW, 130)
    expect(reviewCard(card, 'again', card.due, 130).lapses).toBe(1)
    expect(newCard('easy', NOW, 9).scheduled_days).toBeLessThanOrEqual(maxIntervalFor(9) + 1)
  })

  it('grades attempts', () => {
    expect(gradeFor({ correct: false, hintsUsed: 0, seconds: 10 }, 60)).toBe('again')
    expect(gradeFor({ correct: true, hintsUsed: 1, seconds: 10 }, 60)).toBe('hard')
    expect(gradeFor({ correct: true, hintsUsed: 0, seconds: 30 }, 60)).toBe('easy')
    expect(gradeFor({ correct: true, hintsUsed: 0, seconds: 50 }, 60)).toBe('good')
  })
})
```

- [ ] **Step 2: Run to see it fail**

Run: `npx vitest run src/core/scheduler`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement** — `src/core/scheduler/fsrs.ts`:

```ts
import { createEmptyCard, fsrs, generatorParameters, Rating, type Card, type Grade } from 'ts-fsrs'
import { dayKey, endOfDay } from '../time/day'

export type { Card } from 'ts-fsrs'
export type GradeName = 'again' | 'hard' | 'good' | 'easy'

const RATING: Readonly<Record<GradeName, Grade>> = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy,
}

/** Review gaps are capped at 21 days and at a third of the days left before the exam. */
export function maxIntervalFor(daysToExam: number): number {
  return Math.min(21, Math.max(1, Math.floor(daysToExam / 3)))
}

const schedulerFor = (daysToExam: number) =>
  fsrs(
    generatorParameters({
      request_retention: 0.9,
      maximum_interval: maxIntervalFor(daysToExam),
      enable_fuzz: false,
      enable_short_term: false,
    }),
  )

const reader = fsrs(generatorParameters({ enable_fuzz: false, enable_short_term: false }))

export function newCard(grade: GradeName, now: Date, daysToExam: number): Card {
  return schedulerFor(daysToExam).next(createEmptyCard(now), now, RATING[grade]).card
}

export function reviewCard(card: Card, grade: GradeName, now: Date, daysToExam: number): Card {
  return schedulerFor(daysToExam).next(card, now, RATING[grade]).card
}

/** Probability of recalling the skill right now, clamped to [0, 1]. */
export function retrievability(card: Card, now: Date): number {
  const r = reader.get_retrievability(card, now, false)
  return Number.isFinite(r) ? Math.min(1, Math.max(0, r)) : 0
}

export function isDue(card: Card, now: Date): boolean {
  return new Date(card.due).getTime() <= endOfDay(now).getTime()
}

export function reviewedToday(card: Card, now: Date): boolean {
  if (!card.last_review) return false
  return dayKey(new Date(card.last_review)) === dayKey(now)
}

export interface GradeInput {
  readonly correct: boolean
  readonly hintsUsed: number
  readonly seconds: number
}

export function gradeFor(input: GradeInput, expectedSeconds: number): GradeName {
  if (!input.correct) return 'again'
  if (input.hintsUsed > 0) return 'hard'
  return input.seconds <= 0.6 * expectedSeconds ? 'easy' : 'good'
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/core/scheduler && npm run typecheck`
Expected: PASS.

---

### Task 11: Learner — skill progress, meta, jump, repair

**Files:**
- Create: `src/core/learner/progress.ts`, `src/core/learner/meta.ts`, `src/core/learner/jump.ts`, `src/core/learner/repair.ts`, `src/core/learner/learner.test.ts`

- [ ] **Step 1: Write the failing test** — `src/core/learner/learner.test.ts`:

```ts
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
```

- [ ] **Step 2: Run to see it fail**

Run: `npx vitest run src/core/learner`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement** — `src/core/learner/progress.ts`:

```ts
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
```

`src/core/learner/meta.ts`:
```ts
export interface LearnerMeta {
  /** Consecutive express passes since the last express failure or jump. */
  readonly expressStreak: number
  /** How far (in ladder positions) the next jump may look ahead. */
  readonly jumpStride: number
  /** Last ≤ 20 graded results. */
  readonly recent: readonly boolean[]
}

export type Momentum = 'high' | 'mid' | 'low'

export const INITIAL_META: LearnerMeta = { expressStreak: 0, jumpStride: 4, recent: [] }

export const recordResult = (m: LearnerMeta, correct: boolean): LearnerMeta => ({ ...m, recent: [...m.recent, correct].slice(-20) })
export const onExpressPassed = (m: LearnerMeta): LearnerMeta => ({ ...m, expressStreak: m.expressStreak + 1 })
export const onExpressFailed = (m: LearnerMeta): LearnerMeta => ({ ...m, expressStreak: 0 })
export const onJumpSucceeded = (m: LearnerMeta): LearnerMeta => ({ ...m, expressStreak: 0, jumpStride: Math.min(12, m.jumpStride * 2) })
export const onJumpFailed = (m: LearnerMeta): LearnerMeta => ({ ...m, expressStreak: 0, jumpStride: 4 })

export function momentum(m: LearnerMeta): Momentum {
  if (m.recent.length < 5) return 'mid'
  const accuracy = m.recent.filter(Boolean).length / m.recent.length
  if (accuracy >= 0.9) return 'high'
  return accuracy >= 0.7 ? 'mid' : 'low'
}

/** New lessons allowed per run. Express passes are free. */
export function lessonQuota(level: Momentum): number {
  if (level === 'high') return 3
  return level === 'mid' ? 2 : 1
}

export const jumpAllowed = (m: LearnerMeta): boolean => m.expressStreak >= 3 && momentum(m) !== 'low'
```

`src/core/learner/jump.ts`:
```ts
import type { SkillGraph } from '../graph/graph'

/** Unmastered candidate within `stride` ladder steps after the first unmastered skill that skips the most. */
export function pickJumpTarget(
  graph: SkillGraph,
  mastered: ReadonlySet<string>,
  stride: number,
  hasTemplate: (id: string) => boolean,
): string | null {
  const first = graph.ladder.findIndex((id) => !mastered.has(id))
  if (first < 0) return null
  let best: { readonly id: string; readonly score: number } | null = null
  const last = Math.min(first + stride, graph.ladder.length - 1)
  for (let i = first + 1; i <= last; i += 1) {
    const id = graph.ladder[i]
    if (mastered.has(id) || !hasTemplate(id)) continue
    const score = [...graph.ancestors(id)].filter((a) => !mastered.has(a)).length
    if (score > 0 && (!best || score >= best.score)) best = { id, score }
  }
  return best?.id ?? null
}

/** Skills credited by a successful jump: the target plus its unmastered ancestors, in ladder order. */
export function jumpCredits(
  graph: SkillGraph,
  target: string,
  mastered: ReadonlySet<string>,
  hasTemplate: (id: string) => boolean,
): string[] {
  return [...graph.ancestors(target), target]
    .filter((id) => !mastered.has(id) && hasTemplate(id))
    .sort((a, b) => (graph.ladderIndex.get(a) ?? 0) - (graph.ladderIndex.get(b) ?? 0))
}
```

`src/core/learner/repair.ts`:
```ts
import type { SkillGraph } from '../graph/graph'
import { retrievability } from '../scheduler/fsrs'
import type { SkillProgress } from './progress'

/** Direct mastered prerequisites to re-check: implicit ones first, then the weakest by recall. */
export function repairCandidates(
  graph: SkillGraph,
  skillId: string,
  progress: Readonly<Record<string, SkillProgress>>,
  now: Date,
  limit = 2,
): string[] {
  return graph
    .node(skillId)
    .prereqs.flatMap((id) => {
      const p = progress[id]
      return p && p.phase === 'mastered' ? [{ id, implicit: p.implicit, r: p.card ? retrievability(p.card, now) : 0 }] : []
    })
    .sort((a, b) => Number(b.implicit) - Number(a.implicit) || a.r - b.r)
    .slice(0, limit)
    .map((c) => c.id)
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/core/learner && npm run typecheck`
Expected: PASS.

---

### Task 12: Streak and forecast

**Files:**
- Create: `src/core/streak/streak.ts`, `src/core/forecast/forecast.ts`, `src/core/streak/streak.test.ts`, `src/core/forecast/forecast.test.ts`

- [ ] **Step 1: Write failing tests** — `src/core/streak/streak.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { countDay, INITIAL_STREAK, rollover } from './streak'

describe('streak', () => {
  it('counts each day once and tracks the best', () => {
    const one = countDay(INITIAL_STREAK, '2026-09-20')
    expect(countDay(one, '2026-09-20')).toBe(one)
    const two = countDay(one, '2026-09-21')
    expect(two).toMatchObject({ current: 2, best: 2, lastDay: '2026-09-21' })
  })

  it('earns a freeze every 7 days, up to 2', () => {
    let s = { ...INITIAL_STREAK, freezes: 0 }
    for (let d = 1; d <= 21; d += 1) s = countDay(s, `2026-10-${String(d).padStart(2, '0')}`)
    expect(s.current).toBe(21)
    expect(s.freezes).toBe(2)
  })

  it('rolls over: consecutive days are untouched', () => {
    const s = countDay(INITIAL_STREAK, '2026-09-20')
    expect(rollover(s, '2026-09-21')).toBe(s)
    expect(rollover(INITIAL_STREAK, '2026-09-21')).toBe(INITIAL_STREAK)
  })

  it('spends freezes on missed days and keeps the streak', () => {
    const s = { current: 5, best: 5, freezes: 1, lastDay: '2026-09-20' }
    const r = rollover(s, '2026-09-22')
    expect(r).toMatchObject({ current: 5, freezes: 0, lastDay: '2026-09-21' })
    expect(rollover(r, '2026-09-22')).toBe(r)
    expect(countDay(r, '2026-09-22').current).toBe(6)
  })

  it('resets when there are not enough freezes', () => {
    const s = { current: 5, best: 5, freezes: 1, lastDay: '2026-09-20' }
    expect(rollover(s, '2026-09-24')).toMatchObject({ current: 0, best: 5, freezes: 1 })
  })
})
```

`src/core/forecast/forecast.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { GRAPH } from '../graph'
import { startProgress, type SkillProgress } from '../learner/progress'
import { newCard } from '../scheduler/fsrs'
import { computeForecast } from './forecast'

const NOW = new Date(2026, 8, 20, 10)
const mastered = (id: string, withCard = true): SkillProgress => ({
  ...startProgress(id, 0), phase: 'mastered', card: withCard ? newCard('good', NOW, 100) : null,
})
const masterWeek = (week: number): Record<string, SkillProgress> =>
  Object.fromEntries([...GRAPH.nodes.values()].filter((n) => n.week === week).map((n) => [n.id, mastered(n.id)]))

describe('computeForecast', () => {
  it('is zero with no progress', () => {
    expect(computeForecast(GRAPH, {}, NOW)).toMatchObject({ exam: 0, base: 0 })
  })

  it('a fully recalled exam week contributes 1/12', () => {
    const f = computeForecast(GRAPH, masterWeek(1), NOW)
    expect(f.perWeek[1]).toBeCloseTo(1, 2)
    expect(f.exam).toBeCloseTo(1 / 12, 2)
  })

  it('weights high-yield skills double within a week', () => {
    const f = computeForecast(GRAPH, { set_ops: mastered('set_ops') }, NOW)
    expect(f.perWeek[1]).toBeCloseTo(2 / 19, 3)
  })

  it('computes the base from week 0 (card-less mastery counts as 1)', () => {
    const base = Object.fromEntries(['int_neg', 'order_ops', 'fractions'].map((id) => [id, mastered(id, false)]))
    expect(computeForecast(GRAPH, base, NOW).base).toBeCloseTo(3 / 24, 5)
  })

  it('ignores skills that are not mastered', () => {
    expect(computeForecast(GRAPH, { set_ops: startProgress('set_ops', 0) }, NOW).exam).toBe(0)
  })
})
```

- [ ] **Step 2: Run to see them fail**

Run: `npx vitest run src/core/streak src/core/forecast`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement** — `src/core/streak/streak.ts`:

```ts
import { addDays, daysBetween } from '../time/day'

export interface StreakState {
  readonly current: number
  readonly best: number
  readonly freezes: number
  /** Last day that counted (or was covered by a freeze). */
  readonly lastDay: string | null
}

export const MAX_FREEZES = 2
export const INITIAL_STREAK: StreakState = { current: 0, best: 0, freezes: 1, lastDay: null }

/** Marks `day` as done. Every 7th day in a row earns a freeze (max 2). */
export function countDay(s: StreakState, day: string): StreakState {
  if (s.lastDay === day) return s
  const current = s.current + 1
  const earned = current % 7 === 0 ? 1 : 0
  return { current, best: Math.max(s.best, current), freezes: Math.min(MAX_FREEZES, s.freezes + earned), lastDay: day }
}

/** Applied when the app opens: missed days consume freezes, otherwise the streak resets. */
export function rollover(s: StreakState, today: string): StreakState {
  if (s.lastDay === null) return s
  const missed = daysBetween(s.lastDay, today) - 1
  if (missed <= 0) return s
  if (missed <= s.freezes) return { ...s, freezes: s.freezes - missed, lastDay: addDays(today, -1) }
  return s.current === 0 ? s : { ...s, current: 0 }
}
```

`src/core/forecast/forecast.ts`:
```ts
import { EXAM_WEEKS, type SkillGraph } from '../graph'
import type { SkillProgress } from '../learner/progress'
import { retrievability } from '../scheduler/fsrs'

export interface Forecast {
  /** Predicted share of exam content recalled, 0–1 (pass mark 0.45). */
  readonly exam: number
  /** Recall-weighted share of week-0 foundations, 0–1. */
  readonly base: number
  readonly perWeek: Readonly<Record<number, number>>
}

function recall(p: SkillProgress | undefined, now: Date): number {
  if (!p || p.phase !== 'mastered') return 0
  return p.card ? retrievability(p.card, now) : 1
}

function weekScore(
  graph: SkillGraph,
  progress: Readonly<Record<string, SkillProgress>>,
  week: number,
  now: Date,
  weighHighYield: boolean,
): number {
  const nodes = [...graph.nodes.values()].filter((n) => n.week === week)
  if (nodes.length === 0) return 0
  const weight = (highYield: boolean): number => (weighHighYield && highYield ? 2 : 1)
  const total = nodes.reduce((sum, n) => sum + weight(n.highYield), 0)
  return nodes.reduce((sum, n) => sum + weight(n.highYield) * recall(progress[n.id], now), 0) / total
}

export function computeForecast(graph: SkillGraph, progress: Readonly<Record<string, SkillProgress>>, now: Date): Forecast {
  const perWeek = Object.fromEntries(EXAM_WEEKS.map((w) => [w, weekScore(graph, progress, w, now, true)]))
  const exam = EXAM_WEEKS.reduce((sum, w) => sum + perWeek[w], 0) / EXAM_WEEKS.length
  return { exam, base: weekScore(graph, progress, 0, now, false), perWeek }
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/core/streak src/core/forecast && npm run typecheck`
Expected: PASS.

---

### Task 13: Session engine (daily run)

**Files:**
- Create: `src/core/session/world.ts`, `src/core/session/start.ts`, `src/core/session/next.ts`, `src/core/session/submit.ts`, `src/core/session/engine.test.ts`

**Behaviour summary** (spec §4.2, §5): a run moves through `warmup` (due reviews, lowest recall first, ≤ 8) → `new` (express checks from the base upward; a failed express becomes a lesson and uses lesson quota; after 3 express passes a jump is offered) → `mix` (≤ 5 interleaved problems from mastered skills) → `summary`. Overrides, in priority order: pending twin (after a wrong review/mix answer), repair queue (prerequisite checks), active jump. `run.current` stores the task being shown, so `nextTask` is idempotent and survives reloads.

- [ ] **Step 1: Write the failing test** — `src/core/session/engine.test.ts`:

```ts
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
```

- [ ] **Step 2: Run to see it fail**

Run: `npx vitest run src/core/session`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement `src/core/session/world.ts`**

```ts
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
```

- [ ] **Step 4: Implement `src/core/session/start.ts`**

```ts
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
```

- [ ] **Step 5: Implement `src/core/session/next.ts`**

```ts
import { jumpAllowed } from '../learner/meta'
import { pickJumpTarget } from '../learner/jump'
import { advanceLessonStep, startProgress, type SkillProgress } from '../learner/progress'
import type { Tier } from '../templates/types'
import {
  MIX_TARGET, masteredSet, requireRun, withProgress, withRun, type EngineCtx, type Mode, type RunState, type Task, type World,
} from './world'

type Step = { readonly kind: 'task'; readonly world: World; readonly task: Task } | { readonly kind: 'transition'; readonly world: World }

const show = (world: World, task: Task): Step => ({ kind: 'task', world, task })
const move = (world: World): Step => ({ kind: 'transition', world })

function problem(ctx: EngineCtx, skillId: string, tier: Tier, mode: Mode, opts: { faded?: boolean; twin?: boolean } = {}): Task {
  return { type: 'problem', skillId, seed: ctx.rng.seed(), tier, mode, faded: opts.faded ?? false, twin: opts.twin ?? false }
}

function decideWarmup(world: World, run: RunState, ctx: EngineCtx): Step {
  if (run.warmupIndex >= run.warmupQueue.length) return move(withRun(world, { ...run, phase: 'new' }))
  const skillId = run.warmupQueue[run.warmupIndex]
  const p = world.progress[skillId]
  if (!p || p.phase !== 'mastered') return move(withRun(world, { ...run, warmupIndex: run.warmupIndex + 1 }))
  const tier: Tier = p.card && p.card.stability > 14 ? 3 : 2
  return show(world, problem(ctx, skillId, tier, 'review'))
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
  if (run.mixDone >= Math.min(MIX_TARGET, pool.length)) return move(withRun(world, { ...run, phase: 'summary' }))
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
```

- [ ] **Step 6: Implement `src/core/session/submit.ts`**

```ts
import { jumpCredits } from '../learner/jump'
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

interface Handled {
  readonly world: World
  readonly events: readonly EngineEvent[]
}

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

function recordStats(world: World, input: AttemptInput, xp: number): Handled {
  const day = { ...world.day, xp: world.day.xp + xp, graded: world.day.graded + 1, correct: world.day.correct + (input.correct ? 1 : 0) }
  const reaches = !day.counted && day.graded >= DAY_COUNT_THRESHOLD
  return {
    world: {
      ...world,
      day: reaches ? { ...day, counted: true } : day,
      streak: reaches ? countDay(world.streak, day.date) : world.streak,
      meta: recordResult(world.meta, input.correct),
    },
    events: reaches ? ['day-counted'] : [],
  }
}

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
  const outcome: EngineEvent = input.correct ? 'correct' : 'incorrect'
  return { world: handled.world, events: [outcome, ...stats.events, ...handled.events], xp }
}
```

- [ ] **Step 7: Run tests**

Run: `npx vitest run src/core/session && npm run typecheck`
Expected: PASS. If a scenario test fails, first re-derive the expected sequence by hand from the behaviour summary; fix the engine if it disagrees with the spec, fix the test only if the test's expectation contradicts the spec — and report which.

---

### Task 14: Persistence (Dexie)

**Files:**
- Create: `src/data/db.ts`, `src/data/repo.ts`, `src/data/repo.test.ts`

- [ ] **Step 1: Write the failing test** — `src/data/repo.test.ts`:

```ts
import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { startProgress } from '../core/learner/progress'
import { newCard } from '../core/scheduler/fsrs'
import { initialWorld, type World } from '../core/session/world'
import { AtlasDb } from './db'
import { exportAll, importAll, loadWorld, logAttempt, saveWorld } from './repo'

const NOW = new Date(2026, 8, 21, 10)
let db: AtlasDb

beforeEach(() => {
  db = new AtlasDb(`atlas-test-${Math.random().toString(36).slice(2)}`)
})

afterEach(async () => {
  await db.delete()
})

const worldWithSkill = (): World => ({
  ...initialWorld(NOW),
  progress: { a: { ...startProgress('a', 1), phase: 'mastered', masteredAt: 2, card: newCard('good', NOW, 100) } },
  meta: { expressStreak: 2, jumpStride: 8, recent: [true, false] },
})

describe('repo', () => {
  it('loads defaults from an empty database', async () => {
    const w = await loadWorld(db, NOW)
    expect(w.progress).toEqual({})
    expect(w.settings.examDate).toBe('2027-01-29')
    expect(w.day.date).toBe('2026-09-21')
  })

  it('round-trips progress (with Date fields) and key-value state', async () => {
    const world = worldWithSkill()
    await saveWorld(db, null, world)
    const loaded = await loadWorld(db, NOW)
    expect(loaded.progress.a.card?.due).toBeInstanceOf(Date)
    expect(loaded.progress.a.card?.due.getTime()).toBe(world.progress.a.card?.due.getTime())
    expect(loaded.meta).toEqual(world.meta)
  })

  it('writes only changed progress rows', async () => {
    const first = worldWithSkill()
    await saveWorld(db, null, first)
    const b = startProgress('b', 3)
    const second: World = { ...first, progress: { ...first.progress, b } }
    const spy = vi.spyOn(db.progress, 'bulkPut')
    await saveWorld(db, first, second)
    expect(spy).toHaveBeenCalledWith([b])
  })

  it('logs attempts', async () => {
    await logAttempt(db, { skillId: 'a', seed: 1, tier: 2, mode: 'express', correct: true, hintsUsed: 0, seconds: 12, answer: '2', at: 5 })
    expect(await db.attempts.count()).toBe(1)
  })

  it('exports and re-imports everything, reviving dates', async () => {
    await saveWorld(db, null, worldWithSkill())
    await logAttempt(db, { skillId: 'a', seed: 1, tier: 2, mode: 'express', correct: true, hintsUsed: 0, seconds: 12, answer: '2', at: 5 })
    const json = await exportAll(db, NOW)
    const other = new AtlasDb(`atlas-import-${Math.random().toString(36).slice(2)}`)
    await importAll(other, json)
    const loaded = await loadWorld(other, NOW)
    expect(loaded.progress.a.card?.due).toBeInstanceOf(Date)
    expect(await other.attempts.count()).toBe(1)
    await other.delete()
  })

  it('rejects files that are not Atlas backups', async () => {
    await expect(importAll(db, '{"app":"other"}')).rejects.toThrow(/резервной копии/)
    await expect(importAll(db, 'not json')).rejects.toThrow()
  })
})
```

- [ ] **Step 2: Run to see it fail**

Run: `npx vitest run src/data`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement** — `src/data/db.ts`:

```ts
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
```

`src/data/repo.ts`:
```ts
import { INITIAL_META } from '../core/learner/meta'
import type { SkillProgress } from '../core/learner/progress'
import { openApp } from '../core/session/start'
import { DEFAULT_SETTINGS, emptyDay, type DayStats, type World } from '../core/session/world'
import { INITIAL_STREAK } from '../core/streak/streak'
import { dayKey } from '../core/time/day'
import type { AtlasDb, AttemptLog, KvRow } from './db'

const KV_KEYS = ['meta', 'streak', 'day', 'run', 'settings'] as const

export interface ExportFile {
  readonly app: 'atlas'
  readonly version: 1
  readonly exportedAt: string
  readonly progress: readonly SkillProgress[]
  readonly kv: readonly KvRow[]
  readonly days: readonly DayStats[]
  readonly attempts: readonly AttemptLog[]
}

export async function loadWorld(db: AtlasDb, now: Date): Promise<World> {
  const [rows, kvRows] = await Promise.all([db.progress.toArray(), db.kv.bulkGet([...KV_KEYS])])
  const kv = Object.fromEntries(KV_KEYS.map((k, i) => [k, kvRows[i]?.value]))
  const world: World = {
    progress: Object.fromEntries(rows.map((p) => [p.skillId, p])),
    meta: (kv.meta as World['meta'] | undefined) ?? INITIAL_META,
    streak: (kv.streak as World['streak'] | undefined) ?? INITIAL_STREAK,
    day: (kv.day as World['day'] | undefined) ?? emptyDay(dayKey(now)),
    run: (kv.run as World['run'] | undefined) ?? null,
    settings: { ...DEFAULT_SETTINGS, ...((kv.settings as Partial<World['settings']> | undefined) ?? {}) },
  }
  return openApp(world, now)
}

/** Persists what changed between `prev` and `next` (reference comparison). */
export async function saveWorld(db: AtlasDb, prev: World | null, next: World): Promise<void> {
  const changed = Object.values(next.progress).filter((p) => prev?.progress[p.skillId] !== p)
  const kvChanged: KvRow[] = KV_KEYS.filter((k) => !prev || prev[k] !== next[k]).map((k) => ({ key: k, value: next[k] }))
  await db.transaction('rw', [db.progress, db.kv, db.days], async () => {
    if (changed.length > 0) await db.progress.bulkPut(changed)
    if (kvChanged.length > 0) await db.kv.bulkPut(kvChanged)
    if (!prev || prev.day !== next.day) await db.days.put(next.day)
  })
}

export async function logAttempt(db: AtlasDb, log: AttemptLog): Promise<void> {
  await db.attempts.add(log)
}

export async function exportAll(db: AtlasDb, now: Date): Promise<string> {
  const [progress, kv, days, attempts] = await Promise.all([db.progress.toArray(), db.kv.toArray(), db.days.toArray(), db.attempts.toArray()])
  const file: ExportFile = { app: 'atlas', version: 1, exportedAt: now.toISOString(), progress, kv, days, attempts }
  return JSON.stringify(file)
}

const DATE_FIELDS: ReadonlySet<string> = new Set(['due', 'last_review'])
const reviveDates = (key: string, value: unknown): unknown => (DATE_FIELDS.has(key) && typeof value === 'string' ? new Date(value) : value)

function parseBackup(json: string): ExportFile {
  const parsed = JSON.parse(json, reviveDates) as Partial<ExportFile>
  const ok = parsed.app === 'atlas' && parsed.version === 1 && Array.isArray(parsed.progress) && Array.isArray(parsed.kv)
  if (!ok) throw new Error('Это не файл резервной копии Атласа')
  return { ...parsed, days: parsed.days ?? [], attempts: parsed.attempts ?? [] } as ExportFile
}

/** Replaces all local data with a backup file produced by `exportAll`. */
export async function importAll(db: AtlasDb, json: string): Promise<void> {
  const backup = parseBackup(json)
  await db.transaction('rw', [db.progress, db.kv, db.days, db.attempts], async () => {
    await Promise.all([db.progress.clear(), db.kv.clear(), db.days.clear(), db.attempts.clear()])
    await db.progress.bulkAdd([...backup.progress])
    await db.kv.bulkAdd([...backup.kv])
    await db.days.bulkAdd([...backup.days])
    await db.attempts.bulkAdd([...backup.attempts])
  })
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/data && npm run typecheck`
Expected: PASS. If Dexie's `transaction` overload typing rejects the table array, pass tables as separate arguments (`db.transaction('rw', db.progress, db.kv, db.days, async () => …)`).

---

### Task 15: 1A verification

- [ ] **Step 1:** Run: `npm run coverage`
Expected: all tests pass; thresholds met (lines/functions/statements ≥ 80 %, branches ≥ 75 %) for `src/core/**` and `src/data/**`.

- [ ] **Step 2:** Run: `npm run typecheck && npx vite build`
Expected: exit 0.

- [ ] **Step 3:** Run: `grep -rn "console.log" src || true`
Expected: no matches.
