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
