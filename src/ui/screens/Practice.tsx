import { useMemo, useState } from 'react'
import type { UserAnswer } from '../../core/checker/check'
import { checkAnswer } from '../../core/checker/check'
import type { CheckResult } from '../../core/checker/result'
import { answerToLatex } from '../../core/checker/reference'
import { GRAPH } from '../../core/graph'
import { generateProblem } from '../../core/templates/registry'
import { TIERS, type Tier } from '../../core/templates/types'
import { AnswerInput, emptyAnswer } from '../components/AnswerInput'
import { Solution } from '../components/Solution'
import { RichText, Tex } from '../components/Tex'

const card = 'rounded-card bg-surface border border-line p-5 space-y-4'
const primary = 'px-5 py-3 rounded-xl bg-accent text-bg font-medium hover:opacity-90 disabled:opacity-50'
const ghost = 'px-4 py-3 rounded-xl border border-line text-muted hover:border-accent disabled:opacity-40'

const TIER_LABEL: Readonly<Record<Tier, string>> = { 1: 'Разогрев', 2: 'Стандарт', 3: 'Экзамен' }

const freshSeed = (): number => Math.floor(Math.random() * 0xffffffff) >>> 0

/** Targeted practice of one skill. Nothing here changes mastery, XP or the review schedule. */
export function Practice({ skillId, go }: { skillId: string; go: (screen: 'map') => void }) {
  const [tier, setTier] = useState<Tier>(2)
  const [seed, setSeed] = useState(freshSeed)
  const [answer, setAnswer] = useState<UserAnswer | null>(null)
  const [result, setResult] = useState<CheckResult | null>(null)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [showRu, setShowRu] = useState(false)
  const [stats, setStats] = useState({ solved: 0, total: 0 })
  const [showSolution, setShowSolution] = useState(false)

  const problem = useMemo(() => generateProblem(skillId, seed, tier), [skillId, seed, tier])
  const current = answer ?? emptyAnswer(problem.answer)
  const graded = result !== null && result.status !== 'malformed'

  const nextProblem = (nextTier: Tier = tier) => {
    setTier(nextTier)
    setSeed(freshSeed())
    setAnswer(null)
    setResult(null)
    setHintsUsed(0)
    setShowRu(false)
    setShowSolution(false)
  }

  const check = () => {
    if (graded) return
    const outcome = checkAnswer(problem.answer, current)
    setResult(outcome)
    if (outcome.status !== 'malformed') {
      setStats((s) => ({ solved: s.solved + (outcome.status === 'correct' ? 1 : 0), total: s.total + 1 }))
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-5 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl">{GRAPH.node(skillId).title.ru}</h1>
        <button type="button" className="text-sm text-muted underline" onClick={() => go('map')}>
          К карте
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {TIERS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => nextProblem(t)}
            className={`px-3 py-2 rounded-xl border text-sm ${t === tier ? 'border-accent text-accent' : 'border-line text-muted'}`}
          >
            {TIER_LABEL[t]}
          </button>
        ))}
        <span className="ml-auto text-sm text-muted self-center">
          {stats.total > 0 ? `${stats.solved} из ${stats.total}` : 'тренировка'}
        </span>
      </div>

      <div className={card}>
        <div className="flex items-start justify-between gap-3">
          <p className="text-lg leading-relaxed">
            <RichText text={showRu ? problem.statement.ru : problem.statement.en} />
          </p>
          <button type="button" className="text-xs text-muted border border-line rounded-lg px-2 py-1" onClick={() => setShowRu(!showRu)}>
            {showRu ? 'EN' : 'RU'}
          </button>
        </div>

        <AnswerInput spec={problem.answer} answer={current} onChange={setAnswer} onSubmit={check} disabled={graded} />
        {problem.inputHint && !graded && <p className="text-xs text-muted">{problem.inputHint}</p>}

        {!graded && (
          <div className="flex flex-wrap gap-3">
            <button type="button" className={primary} onClick={check}>
              Проверить
            </button>
            <button type="button" className={ghost} onClick={() => setHintsUsed(hintsUsed + 1)} disabled={hintsUsed >= problem.hints.length}>
              Подсказка
            </button>
            <button
              type="button"
              className={ghost}
              onClick={() => {
                setResult({ status: 'incorrect' })
                setStats((st) => ({ ...st, total: st.total + 1 }))
              }}
            >
              Показать решение
            </button>
          </div>
        )}

        {hintsUsed > 0 && !graded && (
          <div className="space-y-2">
            {problem.hints.slice(0, hintsUsed).map((hint, i) => (
              <p key={i} className="text-sm text-warn">
                <RichText text={hint} />
              </p>
            ))}
          </div>
        )}

        {result?.status === 'malformed' && <p className="text-warn">{result.message}</p>}
        {result?.status === 'correct' && <p className="text-good text-lg">Верно{result.note ? ` · ${result.note}` : ''}</p>}
        {result?.status === 'incorrect' && (
          <div className="space-y-2">
            <p className="text-bad text-lg">Не сходится{result.diagnosis ? ` · ${result.diagnosis}` : ''}</p>
            <p className="text-muted">
              Правильный ответ: <Tex tex={answerToLatex(problem.answer)} />
            </p>
          </div>
        )}

        {graded && (
          <div className="border-t border-line pt-3 space-y-3">
            {showSolution || result?.status === 'incorrect' ? (
              <Solution problem={problem} />
            ) : (
              <button type="button" className="text-sm text-accent underline" onClick={() => setShowSolution(true)}>
                Показать решение
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <button type="button" className={primary} onClick={() => nextProblem()}>
          {graded ? 'Следующая' : 'Другая задача'}
        </button>
        <p className="text-xs text-muted text-right">Это тренировка: прогресс и расписание повторений не меняются</p>
      </div>
    </div>
  )
}
