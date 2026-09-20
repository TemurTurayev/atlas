import type { UserAnswer } from '../checker/check'
import type { Tier } from '../templates/types'

export interface ExamQuestion {
  readonly skillId: string
  readonly seed: number
  readonly tier: Tier
}

/** A mock exam: a fixed paper, a running clock, no feedback until it is handed in. */
export interface ExamState {
  readonly startedAt: number
  readonly minutes: number
  readonly questions: readonly ExamQuestion[]
  /** Typed answers by question index. A missing entry means the question was left blank. */
  readonly answers: Readonly<Record<number, UserAnswer>>
  /** The question on screen. */
  readonly index: number
  readonly forecastAtStart: number
  readonly finishedAt: number | null
  /** One verdict per question, set when the paper is handed in. */
  readonly graded: readonly boolean[] | null
}

export interface ExamRecord {
  readonly date: string
  readonly at: number
  readonly correct: number
  readonly total: number
  readonly minutes: number
}
