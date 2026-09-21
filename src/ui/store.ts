import { create } from 'zustand'
import { checkAnswer, type CheckResult, type UserAnswer } from '../core/checker/check'
import { buildExam } from '../core/exam/build'
import { finishExam } from '../core/exam/finish'
import { examSummary, gradeExam } from '../core/exam/grade'
import { clearExam, saveExamProgress } from '../core/exam/state'
import type { ExamState } from '../core/exam/types'
import { computeForecast, type Forecast } from '../core/forecast/forecast'
import { GRAPH } from '../core/graph'
import { createRng } from '../core/random/rng'
import { acknowledgeStep, answerJumpOffer, nextTask } from '../core/session/next'
import { continueRun, openApp, startRun } from '../core/session/start'
import { submitAttempt, type AttemptInput, type EngineEvent } from '../core/session/submit'
import type { EngineCtx, Task, World } from '../core/session/world'
import { expectedSeconds, generateProblem, hasTemplate } from '../core/templates/registry'
import type { Problem } from '../core/templates/types'
import { AtlasDb } from '../data/db'
import { loadWorld, logAttempt, saveWorld } from '../data/repo'
import { play } from './sound'

const db = new AtlasDb()
let persisted: World | null = null
/** The clock and the button can both fire at once; a paper is handed in once. */
let handingIn = false

const ctx = (): EngineCtx => ({
  graph: GRAPH,
  hasTemplate,
  expectedSeconds,
  now: new Date(),
  rng: createRng((Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0),
})

async function persist(world: World): Promise<void> {
  await saveWorld(db, persisted, world)
  persisted = world
}

const describeAnswer = (answer: UserAnswer): string =>
  answer.kind === 'latex' ? answer.latex : answer.kind === 'choice' ? answer.id : JSON.stringify(answer.parts)

/** Grades the whole paper, schedules every tested skill and files the result. */
async function handIn(
  world: World,
  exam: ExamState,
  answers: Record<number, UserAnswer>,
  apply: (patch: Partial<AtlasState>) => void,
): Promise<void> {
  const problems = exam.questions.map((q) => generateProblem(q.skillId, q.seed, q.tier))
  const graded = gradeExam(problems, answers)
  const next = finishExam(saveExamProgress(world, answers, exam.index), ctx(), graded)
  await persist(next)
  const at = Date.now()
  const seconds = Math.round((at - exam.startedAt) / 1000 / Math.max(1, exam.questions.length))
  await Promise.all(
    exam.questions.map((q, i) =>
      logAttempt(db, {
        skillId: q.skillId,
        seed: q.seed,
        tier: q.tier,
        mode: 'exam',
        correct: graded[i],
        hintsUsed: 0,
        seconds,
        answer: answers[i] ? describeAnswer(answers[i]) : '(left blank)',
        at,
      }),
    ),
  )
  play(examSummary(graded).passed ? 'mastered' : 'incorrect', world.settings.sound)
  apply({ world: next, forecast: computeForecast(GRAPH, next.progress, new Date()), lastActiveDay: next.day.date })
}

export interface AtlasState {
  ready: boolean
  world: World | null
  task: Task | null
  problem: Problem | null
  result: CheckResult | null
  events: readonly EngineEvent[]
  hintsUsed: number
  /** True when the learner asked for the solution instead of answering. */
  revealed: boolean
  shownAt: number
  forecast: Forecast | null
  /** Last day with at least one graded answer — drives the "come back" message. */
  lastActiveDay: string | null
  /** How many of the mixed block the learner predicted they would get right. */
  mixPrediction: number | null
  mixResults: { correct: number; total: number }
  /** Working copy of the exam answers; written back to the world on every move between questions. */
  examAnswers: Record<number, UserAnswer>
  init: () => Promise<void>
  beginRun: (short?: boolean) => Promise<void>
  advance: () => Promise<void>
  submit: (answer: UserAnswer) => Promise<void>
  revealAnswer: () => Promise<void>
  useHint: () => void
  setMixPrediction: (value: number) => void
  acknowledge: () => Promise<void>
  decideJump: (accept: boolean) => Promise<void>
  oneMore: () => Promise<void>
  startExam: () => Promise<void>
  setExamAnswer: (index: number, answer: UserAnswer) => void
  goExamQuestion: (index: number) => Promise<void>
  handInExam: () => Promise<void>
  closeExam: () => Promise<void>
  updateSettings: (patch: Partial<World['settings']>) => Promise<void>
  replaceWorld: (world: World) => Promise<void>
}

export const useAtlas = create<AtlasState>((set, get) => ({
  ready: false,
  world: null,
  task: null,
  problem: null,
  result: null,
  events: [],
  hintsUsed: 0,
  revealed: false,
  shownAt: 0,
  forecast: null,
  lastActiveDay: null,
  mixPrediction: null,
  mixResults: { correct: 0, total: 0 },
  examAnswers: {},

  async init() {
    const world = await loadWorld(db, new Date())
    persisted = world
    const days = await db.days.toArray()
    const active = days.filter((d) => d.graded > 0).map((d) => d.date).sort()
    set({
      world,
      ready: true,
      forecast: computeForecast(GRAPH, world.progress, new Date()),
      lastActiveDay: active.length > 0 ? active[active.length - 1] : null,
      examAnswers: { ...(world.exam?.answers ?? {}) },
    })
  },

  async beginRun(short = false) {
    const world = get().world
    if (!world) return
    const started = startRun(openApp(world, new Date()), ctx(), { short })
    await persist(started)
    set({ world: started, mixPrediction: null, mixResults: { correct: 0, total: 0 } })
    await get().advance()
  },

  async advance() {
    const world = get().world
    if (!world?.run) return
    const { world: shown, task } = nextTask(world, ctx())
    await persist(shown)
    const problem =
      task.type === 'problem'
        ? generateProblem(task.skillId, task.seed, task.tier)
        : task.type === 'worked'
          ? generateProblem(task.skillId, task.seed, 1)
          : null
    set({ world: shown, task, problem, result: null, events: [], hintsUsed: 0, revealed: false, shownAt: Date.now() })
  },

  async submit(answer) {
    const { world, task, problem, hintsUsed, shownAt } = get()
    if (!world || !problem || task?.type !== 'problem') return
    const result = checkAnswer(problem.answer, answer)
    if (result.status === 'malformed') {
      set({ result })
      return
    }
    const input: AttemptInput = { correct: result.status === 'correct', hintsUsed, seconds: (Date.now() - shownAt) / 1000 }
    const outcome = submitAttempt(world, input, ctx())
    await persist(outcome.world)
    await logAttempt(db, {
      skillId: task.skillId,
      seed: task.seed,
      tier: task.tier,
      mode: task.mode,
      correct: input.correct,
      hintsUsed,
      seconds: Math.round(input.seconds),
      answer: describeAnswer(answer),
      at: Date.now(),
    })
    play(outcome.events.includes('mastered') ? 'mastered' : input.correct ? 'correct' : 'incorrect', world.settings.sound)
    if (task.mode === 'mix' && !task.twin) {
      const mix = get().mixResults
      set({ mixResults: { correct: mix.correct + (input.correct ? 1 : 0), total: mix.total + 1 } })
    }
    set({ lastActiveDay: outcome.world.day.date })
    set({ world: outcome.world, result, events: outcome.events, forecast: computeForecast(GRAPH, outcome.world.progress, new Date()) })
  },

  async revealAnswer() {
    const { world, task, shownAt, hintsUsed, revealed } = get()
    if (!world || task?.type !== 'problem' || revealed) return
    const seconds = (Date.now() - shownAt) / 1000
    const outcome = submitAttempt(world, { correct: false, hintsUsed, seconds }, ctx())
    await persist(outcome.world)
    await logAttempt(db, {
      skillId: task.skillId,
      seed: task.seed,
      tier: task.tier,
      mode: task.mode,
      correct: false,
      hintsUsed,
      seconds: Math.round(seconds),
      answer: '(solution shown)',
      at: Date.now(),
    })
    play('incorrect', world.settings.sound)
    if (task.mode === 'mix' && !task.twin) {
      const mix = get().mixResults
      set({ mixResults: { ...mix, total: mix.total + 1 } })
    }
    set({ world: outcome.world, result: { status: 'incorrect' }, events: outcome.events, revealed: true, lastActiveDay: outcome.world.day.date })
  },

  useHint() {
    set({ hintsUsed: get().hintsUsed + 1 })
  },

  setMixPrediction(value) {
    set({ mixPrediction: value })
  },

  async acknowledge() {
    const world = get().world
    if (!world) return
    const next = acknowledgeStep(world)
    await persist(next)
    set({ world: next })
    await get().advance()
  },

  async decideJump(accept) {
    const world = get().world
    if (!world) return
    const next = answerJumpOffer(world, accept)
    await persist(next)
    set({ world: next })
    await get().advance()
  },

  async oneMore() {
    const world = get().world
    if (!world) return
    const next = continueRun(world)
    await persist(next)
    set({ world: next })
    await get().advance()
  },

  async startExam() {
    const world = get().world
    if (!world) return
    const opened = openApp(world, new Date())
    const next: World = { ...opened, exam: buildExam(opened, ctx()) }
    await persist(next)
    set({ world: next, examAnswers: {} })
  },

  setExamAnswer(index, answer) {
    set({ examAnswers: { ...get().examAnswers, [index]: answer } })
  },

  async goExamQuestion(index) {
    const { world, examAnswers } = get()
    if (!world?.exam || world.exam.finishedAt !== null) return
    const next = saveExamProgress(world, examAnswers, index)
    await persist(next)
    set({ world: next })
  },

  async handInExam() {
    const { world, examAnswers } = get()
    const exam = world?.exam
    if (!world || !exam || exam.finishedAt !== null || handingIn) return
    handingIn = true
    try {
      await handIn(world, exam, examAnswers, set)
    } finally {
      handingIn = false
    }
  },

  async closeExam() {
    const world = get().world
    if (!world) return
    const next = clearExam(world)
    await persist(next)
    set({ world: next, examAnswers: {} })
  },

  async updateSettings(patch) {
    const world = get().world
    if (!world) return
    const next: World = { ...world, settings: { ...world.settings, ...patch } }
    await persist(next)
    set({ world: next })
  },

  async replaceWorld(world) {
    persisted = null
    await persist(world)
    set({ world, task: null, problem: null, result: null, forecast: computeForecast(GRAPH, world.progress, new Date()) })
  },
}))

export { db }
