import { useEffect, useState, type ReactNode } from 'react'
import type { UserAnswer } from '../../core/checker/check'
import { answerToLatex } from '../../core/checker/reference'
import { GRAPH } from '../../core/graph'
import { getTemplate } from '../../core/templates/registry'
import { AnswerInput, emptyAnswer } from '../components/AnswerInput'
import { ModeBadge } from '../components/Meter'
import { RichText, Tex } from '../components/Tex'
import { useAtlas } from '../store'

const card = 'rounded-card bg-surface border border-line p-5 space-y-4'
const primary = 'px-5 py-3 rounded-xl bg-accent text-bg font-medium hover:opacity-90 disabled:opacity-50'
const ghost = 'px-4 py-3 rounded-xl border border-line text-muted hover:border-accent disabled:opacity-40'

function PauseBar({ go, left }: { go: (screen: 'home') => void; left?: ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <div>{left}</div>
      <button type="button" className="text-sm text-muted underline" onClick={() => go('home')}>
        Пауза
      </button>
    </div>
  )
}

function Steps({ steps }: { steps: readonly { ru: string; tex?: string }[] }) {
  return (
    <ol className="space-y-3">
      {steps.map((step, i) => (
        <li key={i} className="border-l-2 border-line pl-4">
          <RichText text={step.ru} />
          {step.tex && <Tex tex={step.tex} display />}
        </li>
      ))}
    </ol>
  )
}

export function Run({ go }: { go: (screen: 'home') => void }) {
  const { world, task, problem, result, events, hintsUsed, submit, revealAnswer, useHint, acknowledge, advance, decideJump, oneMore } = useAtlas()
  const [answer, setAnswer] = useState<UserAnswer>({ kind: 'latex', latex: '' })
  const [showRu, setShowRu] = useState(false)

  useEffect(() => {
    if (problem) setAnswer(emptyAnswer(problem.answer))
    setShowRu(false)
  }, [problem])

  if (!world || !task) return <div className="p-6 text-muted">Загрузка…</div>

  if (task.type === 'summary') {
    const since = world.run?.startedAt ?? 0
    const mastered = Object.values(world.progress).filter((p) => p.masteredAt !== null && p.masteredAt >= since).length
    return (
      <div className="mx-auto max-w-2xl p-5 space-y-5">
        <h2 className="text-xl">Забег окончен</h2>
        <div className={card}>
          <p>Освоено навыков за забег: {mastered}</p>
          <p>
            XP сегодня: {world.day.xp} / {world.settings.dailyGoalXp}
          </p>
          <p>Серия: {world.streak.current} дн.</p>
        </div>
        <div className="flex gap-3">
          <button type="button" className={primary} onClick={() => oneMore()}>
            Ещё навык
          </button>
          <button type="button" className={ghost} onClick={() => go('home')}>
            На главную
          </button>
        </div>
      </div>
    )
  }

  if (task.type === 'jump-offer') {
    return (
      <div className="mx-auto max-w-2xl p-5 space-y-5">
        <PauseBar go={go} />
        <div className={card}>
          <h2 className="text-xl">Прыжок вперёд?</h2>
          <p className="text-muted">
            Три темы подряд ты закрыл с первого раза. Можно сразу проверить «{GRAPH.node(task.target).title.ru}»: решишь две задачи — всё,
            что ведёт к этой теме, зачтётся.
          </p>
          <div className="flex gap-3">
            <button type="button" className={primary} onClick={() => decideJump(true)}>
              Прыгаем
            </button>
            <button type="button" className={ghost} onClick={() => decideJump(false)}>
              Лучше по порядку
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (task.type === 'theory') {
    return (
      <div className="mx-auto max-w-2xl p-5 space-y-5">
        <PauseBar go={go} left={<h2 className="text-xl">{GRAPH.node(task.skillId).title.ru}</h2>} />
        <div className={card}>
          {getTemplate(task.skillId)
            .theory.split('\n')
            .map((line, i) => (
              <p key={i} className="leading-relaxed">
                <RichText text={line} />
              </p>
            ))}
        </div>
        <button type="button" className={primary} onClick={() => acknowledge()}>
          Понятно
        </button>
      </div>
    )
  }

  if (task.type === 'worked' && problem) {
    return (
      <div className="mx-auto max-w-2xl p-5 space-y-5">
        <PauseBar go={go} left={<h2 className="text-xl">Разбор примера</h2>} />
        <div className={card}>
          <p className="text-lg">
            <RichText text={problem.statement.ru} />
          </p>
          <Steps steps={problem.solution} />
          <p className="text-muted">
            Ответ: <Tex tex={answerToLatex(problem.answer)} />
          </p>
        </div>
        <button type="button" className={primary} onClick={() => acknowledge()}>
          Теперь сам
        </button>
      </div>
    )
  }

  if (task.type !== 'problem' || !problem) return null
  const graded = result !== null && result.status !== 'malformed'

  return (
    <div className="mx-auto max-w-2xl p-5 space-y-5">
      <PauseBar go={go} left={<ModeBadge mode={task.mode} tier={task.tier} />} />

      <div className={card}>
        <div className="flex items-start justify-between gap-3">
          <p className="text-lg leading-relaxed">
            <RichText text={showRu ? problem.statement.ru : problem.statement.en} />
          </p>
          <button type="button" className="text-xs text-muted border border-line rounded-lg px-2 py-1" onClick={() => setShowRu(!showRu)}>
            {showRu ? 'EN' : 'RU'}
          </button>
        </div>

        <AnswerInput spec={problem.answer} answer={answer} onChange={setAnswer} onSubmit={() => submit(answer)} disabled={graded} />
        {problem.inputHint && !graded && <p className="text-xs text-muted">{problem.inputHint}</p>}

        {!graded && (
          <div className="flex flex-wrap gap-3">
            <button type="button" className={primary} onClick={() => submit(answer)}>
              Проверить
            </button>
            <button type="button" className={ghost} onClick={() => useHint()} disabled={hintsUsed >= problem.hints.length}>
              Подсказка
            </button>
            <button type="button" className={ghost} onClick={() => revealAnswer()}>
              Показать ответ
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
          <details className="border-t border-line pt-3" open={result?.status === 'incorrect'}>
            <summary className="cursor-pointer text-muted">Разбор</summary>
            <div className="mt-3">
              <Steps steps={problem.solution} />
            </div>
          </details>
        )}
      </div>

      {events.includes('mastered') && <p className="text-good">Навык освоен ⚡</p>}
      {events.includes('repair-failed') && <p className="text-warn">Возвращаемся к основе — починим и пойдём дальше</p>}

      {graded && (
        <button type="button" className={primary} onClick={() => advance()}>
          Дальше
        </button>
      )}
    </div>
  )
}
