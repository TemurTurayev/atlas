import { describe, expect, it } from 'vitest'
import { buildGraph } from '../graph/graph'
import type { SkillNode } from '../graph/nodes'
import { startProgress, type SkillProgress } from '../learner/progress'
import { createRng } from '../random/rng'
import { newCard, retrievability } from '../scheduler/fsrs'
import { initialWorld, type EngineCtx, type World } from '../session/world'
import type { Problem } from '../templates/types'
import { buildExam, EXAM_MAX_QUESTIONS, EXAM_MINUTES, examMinutes, examReady } from './build'
import { finishExam } from './finish'
import { examSummary, gradeExam, isAnswered } from './grade'
import { clearExam, examExpired, examRemainingMs, saveExamProgress } from './state'

const node = (id: string): SkillNode => ({
  id,
  week: 0,
  prereqs: [],
  title: id,
  highYield: false,
})
const ids = Array.from({ length: 12 }, (_, i) => `s${i}`)
const GRAPH = buildGraph(ids.map(node))
const NOW = new Date(2026, 8, 21, 10, 0)
const ctxAt = (now = NOW, seed = 7): EngineCtx => ({
  graph: GRAPH,
  hasTemplate: () => true,
  expectedSeconds: () => 120,
  now,
  rng: createRng(seed),
})

function mastered(world: World, count: number, now = NOW): World {
  const progress = Object.fromEntries(
    ids.slice(0, count).map((id): [string, SkillProgress] => [
      id,
      {
        ...startProgress(id, 0),
        phase: 'mastered',
        masteredAt: 0,
        card: newCard('good', now, 120),
      },
    ]),
  )
  return { ...world, progress }
}

const world10 = mastered(initialWorld(NOW), 10)
const started = (world = world10, ctx = ctxAt()): World => ({
  ...world,
  exam: buildExam(world, ctx),
})

const numberProblem = (value: string): Problem => ({
  statement: 'x',
  answer: { kind: 'number', value },
  solution: [{ text: 'step' }],
  hints: [],
})

describe('building the paper', () => {
  it('needs a floor of mastered skills before it is offered', () => {
    expect(examReady(mastered(initialWorld(NOW), 7), ctxAt())).toBe(false)
    expect(examReady(world10, ctxAt())).toBe(true)
  })

  it('asks about every mastered skill once, at exam tiers', () => {
    const exam = buildExam(world10, ctxAt())
    expect(exam.questions).toHaveLength(10)
    expect(new Set(exam.questions.map((q) => q.skillId)).size).toBe(10)
    expect(exam.questions.every((q) => q.tier === 2 || q.tier === 3)).toBe(true)
    expect(exam.questions.every((q) => Number.isInteger(q.seed))).toBe(true)
  })

  it('leaves unmastered skills out', () => {
    const half = mastered(initialWorld(NOW), 9)
    const withLesson = {
      ...half,
      progress: {
        ...half.progress,
        s3: { ...half.progress.s3, phase: 'lesson' as const },
      },
    }
    expect(buildExam(withLesson, ctxAt()).questions.map((q) => q.skillId)).not.toContain('s3')
  })

  it('never exceeds the hour or the question cap', () => {
    const many = mastered({ ...initialWorld(NOW), progress: {} }, 12)
    const wide = buildGraph(Array.from({ length: 40 }, (_, i) => node(`s${i}`)))
    const ctx: EngineCtx = {
      ...ctxAt(),
      graph: wide,
      expectedSeconds: () => 30,
    }
    const exam = buildExam(many, ctx)
    expect(exam.questions.length).toBeLessThanOrEqual(EXAM_MAX_QUESTIONS)
    expect(exam.minutes).toBeLessThanOrEqual(EXAM_MINUTES)
    expect(exam.minutes).toBeGreaterThanOrEqual(10)
  })

  it('scales the clock to the paper, in five-minute steps', () => {
    expect(examMinutes(300)).toBe(10)
    expect(examMinutes(1200)).toBe(30)
    expect(examMinutes(2000)).toBe(50)
    expect(examMinutes(2400)).toBe(EXAM_MINUTES)
    expect(examMinutes(10_000)).toBe(EXAM_MINUTES)
  })

  it('refuses to build a paper with nothing mastered', () => {
    expect(() => buildExam(initialWorld(NOW), ctxAt())).toThrow(/nothing is mastered/)
  })
})

describe('the clock', () => {
  it('counts down and expires exactly at the deadline', () => {
    const exam = buildExam(world10, ctxAt())
    const half = new Date(NOW.getTime() + (exam.minutes * 60_000) / 2)
    expect(examRemainingMs(exam, half)).toBe((exam.minutes * 60_000) / 2)
    expect(examExpired(exam, half)).toBe(false)
    expect(examExpired(exam, new Date(NOW.getTime() + exam.minutes * 60_000))).toBe(true)
  })

  it('a handed-in paper never expires', () => {
    const exam = {
      ...buildExam(world10, ctxAt()),
      finishedAt: NOW.getTime(),
      graded: [],
    }
    expect(examExpired(exam, new Date(NOW.getTime() + 10 * 3_600_000))).toBe(false)
  })
})

describe('grading', () => {
  it('counts a blank field as unanswered', () => {
    expect(isAnswered(undefined)).toBe(false)
    expect(isAnswered({ kind: 'latex', latex: '  ' })).toBe(false)
    expect(isAnswered({ kind: 'choice', id: '' })).toBe(false)
    expect(isAnswered({ kind: 'latex', latex: '4' })).toBe(true)
  })

  it('marks right, wrong and blank answers', () => {
    const problems = [numberProblem('4'), numberProblem('7'), numberProblem('9')]
    const graded = gradeExam(problems, {
      0: { kind: 'latex', latex: '4' },
      1: { kind: 'latex', latex: '8' },
    })
    expect(graded).toEqual([true, false, false])
  })

  it('applies the 45 % pass mark', () => {
    expect(examSummary([true, true, false, false])).toMatchObject({
      correct: 2,
      total: 4,
      passed: true,
    })
    expect(examSummary([true, false, false, false, false])).toMatchObject({
      share: 0.2,
      passed: false,
    })
  })
})

describe('handing the paper in', () => {
  const graded = (exam: World['exam'], correct: number): boolean[] => (exam?.questions ?? []).map((_, i) => i < correct)

  it('schedules every tested skill: a miss comes back, a hit waits', () => {
    const w = started()
    const verdicts = graded(w.exam, 5)
    const after = finishExam(w, ctxAt(), verdicts)
    const missed = w.exam!.questions[9].skillId
    const hit = w.exam!.questions[0].skillId
    expect(new Date(after.progress[missed].card!.due).getTime()).toBeLessThan(new Date(after.progress[hit].card!.due).getTime())
    expect(after.progress[missed].card!.stability).toBeLessThan(after.progress[hit].card!.stability)
    const later = new Date(NOW.getTime() + 3 * 86_400_000)
    expect(retrievability(after.progress[missed].card!, later)).toBeLessThan(retrievability(after.progress[hit].card!, later))
  })

  it('banks the work: xp for correct answers, the day counted, the streak advanced', () => {
    const after = finishExam(started(), ctxAt(), graded(started().exam, 6))
    expect(after.day.graded).toBe(10)
    expect(after.day.correct).toBe(6)
    expect(after.day.xp).toBe(12)
    expect(after.day.counted).toBe(true)
    expect(after.streak.current).toBe(1)
  })

  it('files the result and marks the paper handed in', () => {
    const after = finishExam(started(), ctxAt(), graded(started().exam, 6))
    expect(after.exam?.finishedAt).toBe(NOW.getTime())
    expect(after.exam?.graded).toHaveLength(10)
    expect(after.examHistory).toHaveLength(1)
    expect(after.examHistory[0]).toMatchObject({
      correct: 6,
      total: 10,
      date: '2026-09-21',
    })
  })

  it('keeps only the last ten results', () => {
    let w = started()
    for (let i = 0; i < 12; i += 1) {
      w = {
        ...finishExam(w, ctxAt(), graded(w.exam, 5)),
        exam: buildExam(w, ctxAt()),
      }
    }
    expect(w.examHistory).toHaveLength(10)
  })

  it('cannot be handed in twice or with the wrong number of verdicts', () => {
    const w = started()
    const after = finishExam(w, ctxAt(), graded(w.exam, 5))
    expect(finishExam(after, ctxAt(), graded(after.exam, 10))).toBe(after)
    expect(() => finishExam(w, ctxAt(), [true])).toThrow(/one verdict per question/)
    expect(() => finishExam(world10, ctxAt(), [])).toThrow(/no exam in progress/)
  })
})

describe('keeping the paper', () => {
  it('stores answers and the current question, clamped to the paper', () => {
    const w = started()
    const saved = saveExamProgress(w, { 0: { kind: 'latex', latex: 'x' } }, 99)
    expect(saved.exam?.index).toBe(w.exam!.questions.length - 1)
    expect(saved.exam?.answers[0]).toEqual({ kind: 'latex', latex: 'x' })
    expect(saveExamProgress(w, {}, -3).exam?.index).toBe(0)
  })

  it('never edits a handed-in paper, and can be cleared away', () => {
    const w = started()
    const after = finishExam(
      w,
      ctxAt(),
      w.exam!.questions.map(() => true),
    )
    expect(saveExamProgress(after, { 0: { kind: 'latex', latex: 'x' } }, 1)).toBe(after)
    expect(clearExam(after).exam).toBeNull()
  })
})
