import { checkAnswer, type UserAnswer } from '../checker/check'
import type { Problem } from '../templates/types'
import { EXAM_PASS_MARK } from './build'

export interface ExamSummary {
  readonly correct: number
  readonly total: number
  /** Share of correct answers, 0–1. */
  readonly share: number
  readonly passed: boolean
}

/** An empty field is not an answer: it must not count as an attempt. */
export function isAnswered(answer: UserAnswer | undefined): boolean {
  if (!answer) return false
  if (answer.kind === 'latex') return answer.latex.trim() !== ''
  if (answer.kind === 'choice') return answer.id !== ''
  return true
}

/** Grades the whole paper at once. Blank and malformed answers are wrong, as on the real exam. */
export function gradeExam(problems: readonly Problem[], answers: Readonly<Record<number, UserAnswer>>): boolean[] {
  return problems.map((problem, i) => {
    const answer = answers[i]
    return isAnswered(answer) && answer !== undefined && checkAnswer(problem.answer, answer).status === 'correct'
  })
}

export function examSummary(graded: readonly boolean[]): ExamSummary {
  const correct = graded.filter(Boolean).length
  const share = graded.length === 0 ? 0 : correct / graded.length
  return {
    correct,
    total: graded.length,
    share,
    passed: share >= EXAM_PASS_MARK,
  }
}
