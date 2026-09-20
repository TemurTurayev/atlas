import type { SkillProgress } from '../learner/progress'
import { reviewCard } from '../scheduler/fsrs'
import { recordAnswers } from '../session/submit'
import { daysToExam, type EngineCtx, type World } from '../session/world'
import { dayKey } from '../time/day'
import { EXAM_HISTORY_LIMIT } from './build'
import { examSummary } from './grade'
import type { ExamRecord, ExamState } from './types'

function reviewed(world: World, exam: ExamState, graded: readonly boolean[], ctx: EngineCtx): Record<string, SkillProgress> {
  const days = daysToExam(world, ctx.now)
  // An exam answer is the strongest evidence we have about a skill, so it counts even when the
  // skill was already reviewed earlier today — unlike an ordinary review, which is skipped.
  return exam.questions.reduce<Record<string, SkillProgress>>(
    (acc, q, i) => {
      const p = acc[q.skillId]
      if (!p?.card) return acc
      return {
        ...acc,
        [q.skillId]: {
          ...p,
          card: reviewCard(p.card, graded[i] ? 'good' : 'again', ctx.now, days),
        },
      }
    },
    { ...world.progress },
  )
}

/** Hands the paper in: schedules every tested skill, banks the day's work, files the result. */
export function finishExam(world: World, ctx: EngineCtx, graded: readonly boolean[]): World {
  const exam = world.exam
  if (!exam) throw new Error('finishExam: no exam in progress')
  if (exam.finishedAt !== null) return world
  if (graded.length !== exam.questions.length) throw new Error('finishExam: expected one verdict per question')

  const progress = reviewed(world, exam, graded, ctx)
  const xp = exam.questions.reduce(
    (sum, q, i) => sum + (graded[i] ? Math.max(1, Math.round(ctx.expectedSeconds(q.skillId, q.tier) / 60)) : 0),
    0,
  )
  const counted = recordAnswers({ ...world, progress }, graded, xp)
  const summary = examSummary(graded)
  const record: ExamRecord = {
    date: dayKey(ctx.now),
    at: ctx.now.getTime(),
    correct: summary.correct,
    total: summary.total,
    minutes: exam.minutes,
  }
  return {
    ...counted.world,
    exam: { ...exam, finishedAt: ctx.now.getTime(), graded },
    examHistory: [...world.examHistory, record].slice(-EXAM_HISTORY_LIMIT),
  }
}
