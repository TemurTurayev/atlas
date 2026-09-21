import { useEffect, useMemo, useState } from 'react'
import { EXAM_MIN_SKILLS, EXAM_MINUTES } from '../../core/exam/build'
import { isAnswered } from '../../core/exam/grade'
import type { ExamState } from '../../core/exam/types'
import { generateProblem } from '../../core/templates/registry'
import { AnswerInput, emptyAnswer } from '../components/AnswerInput'
import { ExamClock, useExamClock } from '../components/ExamClock'
import { RichText } from '../components/Tex'
import { countOf } from '../format'
import { masteredCount } from '../selectors'
import { useAtlas } from '../store'
import { ExamResults } from './ExamResults'

const card = 'rounded-card bg-surface border border-line p-5 space-y-4'
const primary = 'px-5 py-3 rounded-xl bg-accent text-bg font-medium hover:opacity-90 disabled:opacity-50'
const ghost = 'px-4 py-3 rounded-xl border border-line text-muted hover:border-accent disabled:opacity-40'

function Intro({ ready, missing, onStart, go }: { ready: boolean; missing: number; onStart: () => void; go: (s: 'home') => void }) {
  return (
    <div className="mx-auto max-w-2xl p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl">Mock exam</h1>
        <button type="button" className="text-sm text-muted underline" onClick={() => go('home')}>
          Back
        </button>
      </div>
      <div className={card}>
        <p className="leading-relaxed">
          Everything you have mastered, mixed, up to {EXAM_MINUTES} minutes, clock in plain sight. No hints, no solutions — the paper is
          marked as a whole once you hand it in.
        </p>
        <p className="text-muted text-sm">
          Work on paper and type only the answer. You can move back and forth between problems; anything left blank counts as wrong.
        </p>
        <p className="text-muted text-sm">The pass mark is 45 %, as on the real exam. The result feeds the forecast and your review schedule.</p>
      </div>
      {ready ? (
        <button type="button" className={primary} onClick={onStart}>
          Start the exam
        </button>
      ) : (
        <p className="text-warn text-sm">
          Opens once you have mastered {EXAM_MIN_SKILLS} skills — {countOf(missing, 'skill')} to go.
        </p>
      )}
    </div>
  )
}

function Paper({ exam, remainingMs, go }: { exam: ExamState; remainingMs: number; go: (s: 'home') => void }) {
  const { examAnswers, setExamAnswer, goExamQuestion, handInExam } = useAtlas()
  const [confirming, setConfirming] = useState(false)
  const problems = useMemo(() => exam.questions.map((q) => generateProblem(q.skillId, q.seed, q.tier)), [exam.questions])

  const index = Math.min(exam.index, exam.questions.length - 1)
  const problem = problems[index]
  const answered = exam.questions.filter((_, i) => isAnswered(examAnswers[i])).length
  const blank = exam.questions.length - answered

  const move = (to: number) => {
    setConfirming(false)
    void goExamQuestion(to)
  }

  const handIn = () => {
    if (blank > 0 && !confirming) {
      setConfirming(true)
      return
    }
    void handInExam()
  }

  return (
    <div className="mx-auto max-w-2xl p-5 space-y-5">
      <header className="flex items-center justify-between gap-3">
        <span className="text-xs px-2 py-1 rounded-lg bg-raised border border-line text-muted">Exam</span>
        <ExamClock remainingMs={remainingMs} />
        <button type="button" className="text-sm text-muted underline" onClick={() => go('home')}>
          Leave
        </button>
      </header>

      <div className="flex flex-wrap gap-1.5">
        {exam.questions.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => move(i)}
            aria-label={`problem ${i + 1}`}
            className={`h-8 w-8 rounded-lg border text-xs ${
              i === index
                ? 'border-accent text-accent'
                : isAnswered(examAnswers[i])
                  ? 'border-line bg-raised text-ink font-medium'
                  : 'border-line text-muted opacity-60'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <div className={card}>
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm text-muted">
            Problem {index + 1} of {exam.questions.length}
          </p>
        </div>
        <p className="text-lg leading-relaxed">
          <RichText text={problem.statement} />
        </p>
        <AnswerInput
          spec={problem.answer}
          answer={examAnswers[index] ?? emptyAnswer(problem.answer)}
          onChange={(answer) => setExamAnswer(index, answer)}
          onSubmit={() => move(Math.min(index + 1, exam.questions.length - 1))}
          disabled={false}
        />
        {problem.inputHint && <p className="text-xs text-muted">{problem.inputHint}</p>}
      </div>

      <div className="flex items-center justify-between gap-3">
        <button type="button" className={ghost} disabled={index === 0} onClick={() => move(index - 1)}>
          Back
        </button>
        <span className="text-sm text-muted">
          {answered} of {exam.questions.length} answered
        </span>
        <button type="button" className={ghost} disabled={index >= exam.questions.length - 1} onClick={() => move(index + 1)}>
          Next
        </button>
      </div>

      <div className={card}>
        {confirming && blank > 0 && (
          <p className="text-warn text-sm">
            {countOf(blank, 'problem')} still blank — they count as wrong. Press again to hand the paper in.
          </p>
        )}
        <button type="button" className={primary} onClick={handIn}>
          Hand it in
        </button>
      </div>
    </div>
  )
}

export function Exam({ go }: { go: (screen: 'home') => void }) {
  const { world, forecast, startExam, handInExam, closeExam } = useAtlas()
  const exam = world?.exam ?? null
  const remainingMs = useExamClock(exam)
  const outOfTime = exam !== null && exam.finishedAt === null && remainingMs <= 0

  useEffect(() => {
    if (outOfTime) void handInExam()
  }, [outOfTime, handInExam])

  if (!world) return null
  if (!exam) {
    const mastered = masteredCount(world)
    return (
      <Intro
        ready={mastered >= EXAM_MIN_SKILLS}
        missing={Math.max(0, EXAM_MIN_SKILLS - mastered)}
        onStart={() => void startExam()}
        go={go}
      />
    )
  }
  if (exam.finishedAt !== null) {
    return (
      <ExamResults
        exam={exam}
        forecastNow={forecast?.exam ?? 0}
        onClose={() => {
          void closeExam()
          go('home')
        }}
        onRetry={() => void startExam()}
      />
    )
  }
  return <Paper exam={exam} remainingMs={remainingMs} go={go} />
}
