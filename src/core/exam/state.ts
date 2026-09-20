import type { UserAnswer } from '../checker/check'
import type { World } from '../session/world'
import type { ExamState } from './types'

export const examDeadline = (exam: ExamState): number => exam.startedAt + exam.minutes * 60_000

export const examRemainingMs = (exam: ExamState, now: Date): number => Math.max(0, examDeadline(exam) - now.getTime())

export const examExpired = (exam: ExamState, now: Date): boolean => exam.finishedAt === null && now.getTime() >= examDeadline(exam)

/** Stores the paper's answers and the question on screen; a handed-in paper is never touched. */
export function saveExamProgress(world: World, answers: Readonly<Record<number, UserAnswer>>, index: number): World {
  const exam = world.exam
  if (!exam || exam.finishedAt !== null) return world
  const clamped = Math.min(Math.max(0, index), Math.max(0, exam.questions.length - 1))
  return { ...world, exam: { ...exam, answers, index: clamped } }
}

export const clearExam = (world: World): World => ({ ...world, exam: null })
