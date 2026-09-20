import { useEffect, useMemo, useState } from 'react'
import { EXAM_MIN_SKILLS, EXAM_MINUTES } from '../../core/exam/build'
import { isAnswered } from '../../core/exam/grade'
import type { ExamState } from '../../core/exam/types'
import { generateProblem } from '../../core/templates/registry'
import { AnswerInput, emptyAnswer } from '../components/AnswerInput'
import { ExamClock, useExamClock } from '../components/ExamClock'
import { RichText } from '../components/Tex'
import { plural } from '../format'
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
        <h1 className="text-xl">Пробный экзамен</h1>
        <button type="button" className="text-sm text-muted underline" onClick={() => go('home')}>
          Назад
        </button>
      </div>
      <div className={card}>
        <p className="leading-relaxed">
          Всё освоенное вперемешку, до {EXAM_MINUTES} минут, таймер на виду. Подсказок нет, решения не показываются — работа проверяется
          целиком, когда ты её сдашь.
        </p>
        <p className="text-muted text-sm">
          Считай на бумаге, в поле вводи только ответ. Между задачами можно ходить вперёд и назад, пропущенные засчитываются как неверные.
        </p>
        <p className="text-muted text-sm">Порог — 45 %, как на настоящем экзамене. Результат идёт в прогноз и в расписание повторений.</p>
      </div>
      {ready ? (
        <button type="button" className={primary} onClick={onStart}>
          Начать экзамен
        </button>
      ) : (
        <p className="text-warn text-sm">
          Откроется, когда освоишь {EXAM_MIN_SKILLS} навыков — осталось {missing} {plural(missing, 'навык', 'навыка', 'навыков')}.
        </p>
      )}
    </div>
  )
}

function Paper({ exam, remainingMs, go }: { exam: ExamState; remainingMs: number; go: (s: 'home') => void }) {
  const { examAnswers, setExamAnswer, goExamQuestion, handInExam } = useAtlas()
  const [showRu, setShowRu] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const problems = useMemo(() => exam.questions.map((q) => generateProblem(q.skillId, q.seed, q.tier)), [exam.questions])

  const index = Math.min(exam.index, exam.questions.length - 1)
  const problem = problems[index]
  const answered = exam.questions.filter((_, i) => isAnswered(examAnswers[i])).length
  const blank = exam.questions.length - answered

  const move = (to: number) => {
    setShowRu(false)
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
        <span className="text-xs px-2 py-1 rounded-lg bg-raised border border-line text-muted">Экзамен</span>
        <ExamClock remainingMs={remainingMs} />
        <button type="button" className="text-sm text-muted underline" onClick={() => go('home')}>
          Выйти
        </button>
      </header>

      <div className="flex flex-wrap gap-1.5">
        {exam.questions.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => move(i)}
            aria-label={`задача ${i + 1}`}
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
            Задача {index + 1} из {exam.questions.length}
          </p>
          <button type="button" className="text-xs text-muted border border-line rounded-lg px-2 py-1" onClick={() => setShowRu(!showRu)}>
            {showRu ? 'EN' : 'RU'}
          </button>
        </div>
        <p className="text-lg leading-relaxed">
          <RichText text={showRu ? problem.statement.ru : problem.statement.en} />
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
          Назад
        </button>
        <span className="text-sm text-muted">
          отвечено {answered} из {exam.questions.length}
        </span>
        <button type="button" className={ghost} disabled={index >= exam.questions.length - 1} onClick={() => move(index + 1)}>
          Дальше
        </button>
      </div>

      <div className={card}>
        {confirming && blank > 0 && (
          <p className="text-warn text-sm">
            {blank} {plural(blank, 'задача', 'задачи', 'задач')} без ответа — они пойдут в минус. Нажми ещё раз, чтобы сдать.
          </p>
        )}
        <button type="button" className={primary} onClick={handIn}>
          Сдать работу
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
