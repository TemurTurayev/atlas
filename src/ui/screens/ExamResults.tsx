import { useMemo, useState } from 'react'
import type { UserAnswer } from '../../core/checker/check'
import { answerToLatex, userAnswerLatex } from '../../core/checker/reference'
import { EXAM_PASS_MARK } from '../../core/exam/build'
import { examSummary } from '../../core/exam/grade'
import type { ExamQuestion, ExamState } from '../../core/exam/types'
import { GRAPH } from '../../core/graph'
import { generateProblem } from '../../core/templates/registry'
import type { Problem } from '../../core/templates/types'
import { Meter } from '../components/Meter'
import { Solution } from '../components/Solution'
import { RichText, Tex } from '../components/Tex'
import { formatPercent } from '../format'

const card = 'rounded-card bg-surface border border-line p-5 space-y-4'
const primary = 'px-5 py-3 rounded-xl bg-accent text-bg font-medium hover:opacity-90'
const ghost = 'px-4 py-3 rounded-xl border border-line text-muted hover:border-accent'

function AnswerView({ answer, problem }: { answer: UserAnswer | undefined; problem: Problem }) {
  if (!answer) return <span className="text-muted">left blank</span>
  const latex = userAnswerLatex(answer, problem.answer)
  if (latex.trim() === '') return <span className="text-muted">empty</span>
  return answer.kind === 'choice' ? <RichText text={latex} /> : <Tex tex={latex} />
}

function Review({
  n,
  question,
  problem,
  ok,
  answer,
}: {
  n: number
  question: ExamQuestion
  problem: Problem
  ok: boolean
  answer?: UserAnswer
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-card border border-line bg-surface p-4 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted">
          {n}. {GRAPH.node(question.skillId).title}
        </p>
        <span className={ok ? 'text-good' : 'text-bad'}>{ok ? '✓' : '✗'}</span>
      </div>
      <p className="leading-relaxed">
        <RichText text={problem.statement} />
      </p>
      <p className="text-sm text-muted">
        Your answer: <AnswerView answer={answer} problem={problem} />
      </p>
      {!ok && (
        <p className="text-sm text-muted">
          Correct answer: <Tex tex={answerToLatex(problem.answer)} />
        </p>
      )}
      {open ? (
        <Solution problem={problem} />
      ) : (
        <button type="button" className="text-sm text-accent underline" onClick={() => setOpen(true)}>
          Show the solution
        </button>
      )}
    </div>
  )
}

interface Props {
  readonly exam: ExamState
  readonly forecastNow: number
  readonly onClose: () => void
  readonly onRetry: () => void
}

export function ExamResults({ exam, forecastNow, onClose, onRetry }: Props) {
  const graded = exam.graded ?? []
  const summary = examSummary(graded)
  const problems = useMemo(() => exam.questions.map((q) => generateProblem(q.skillId, q.seed, q.tier)), [exam.questions])
  // A paper handed in by the clock can be opened much later; never report more than it allowed.
  const minutesUsed = Math.min(exam.minutes, Math.max(1, Math.round(((exam.finishedAt ?? exam.startedAt) - exam.startedAt) / 60_000)))
  const delta = (forecastNow - exam.forecastAtStart) * 100
  const missed = exam.questions.filter((_, i) => !graded[i]).map((q) => GRAPH.node(q.skillId).title)
  // While only school foundations are mastered the exam forecast is still zero; saying so helps nobody.
  const showForecast = forecastNow > 0 || Math.abs(delta) >= 0.05

  return (
    <div className="mx-auto max-w-2xl p-5 space-y-5">
      <h1 className="text-xl">Paper marked</h1>

      <div className={card}>
        <p className="text-3xl">
          {summary.correct} of {summary.total}
          <span className="text-muted text-xl"> · {formatPercent(summary.share)}</span>
        </p>
        <Meter label="Score" value={summary.share} markerAt={EXAM_PASS_MARK} tone={summary.passed ? 'good' : 'accent'} />
        <p className={summary.passed ? 'text-good' : 'text-warn'}>
          {summary.passed ? 'Above the 45 % pass mark' : 'Short of the 45 % pass mark — on the real exam this is a resit'}
        </p>
        <p className="text-sm text-muted">
          {minutesUsed} of {exam.minutes} minutes used
          {showForecast && (
            <>
              {' '}
              · exam forecast {formatPercent(forecastNow)} ({delta >= 0 ? '+' : ''}
              {delta.toFixed(1)} points)
            </>
          )}
        </p>
        {missed.length > 0 && <p className="text-sm text-muted">Coming back in the next few days: {missed.join(', ')}</p>}
      </div>

      <div className="flex gap-3">
        <button type="button" className={primary} onClick={onClose}>
          Close
        </button>
        <button type="button" className={ghost} onClick={onRetry}>
          Another paper
        </button>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm text-muted">Review</h2>
        {exam.questions.map((question, i) => (
          <Review key={i} n={i + 1} question={question} problem={problems[i]} ok={graded[i] === true} answer={exam.answers[i]} />
        ))}
      </div>
    </div>
  )
}
