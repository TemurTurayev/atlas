import { create } from 'zustand'
import { checkAnswer, type CheckResult, type UserAnswer } from '../core/checker/check'
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

export interface AtlasState {
  ready: boolean
  world: World | null
  task: Task | null
  problem: Problem | null
  result: CheckResult | null
  events: readonly EngineEvent[]
  hintsUsed: number
  shownAt: number
  forecast: Forecast | null
  init: () => Promise<void>
  beginRun: () => Promise<void>
  advance: () => Promise<void>
  submit: (answer: UserAnswer) => Promise<void>
  revealAnswer: () => Promise<void>
  useHint: () => void
  acknowledge: () => Promise<void>
  decideJump: (accept: boolean) => Promise<void>
  oneMore: () => Promise<void>
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
  shownAt: 0,
  forecast: null,

  async init() {
    const world = await loadWorld(db, new Date())
    persisted = world
    set({ world, ready: true, forecast: computeForecast(GRAPH, world.progress, new Date()) })
  },

  async beginRun() {
    const world = get().world
    if (!world) return
    const started = startRun(openApp(world, new Date()), ctx())
    await persist(started)
    set({ world: started })
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
    set({ world: shown, task, problem, result: null, events: [], hintsUsed: 0, shownAt: Date.now() })
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
    set({ world: outcome.world, result, events: outcome.events, forecast: computeForecast(GRAPH, outcome.world.progress, new Date()) })
  },

  async revealAnswer() {
    const { world, task, shownAt, hintsUsed } = get()
    if (!world || task?.type !== 'problem') return
    const outcome = submitAttempt(world, { correct: false, hintsUsed, seconds: (Date.now() - shownAt) / 1000 }, ctx())
    await persist(outcome.world)
    set({ world: outcome.world, result: { status: 'incorrect' }, events: outcome.events })
  },

  useHint() {
    set({ hintsUsed: get().hintsUsed + 1 })
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
