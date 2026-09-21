import { useEffect, useState, type ReactNode } from 'react'
import type { UserAnswer } from '../../core/checker/check'
import { answerToLatex } from '../../core/checker/reference'
import { GRAPH } from '../../core/graph'
import { getTemplate } from '../../core/templates/registry'
import { AnswerInput, emptyAnswer } from '../components/AnswerInput'
import { ModeBadge } from '../components/Meter'
import { Solution } from '../components/Solution'
import { RichText, Tex } from '../components/Tex'
import { countOf, formatPercent } from '../format'
import { useAtlas } from '../store'

const card = 'rounded-card bg-surface border border-line p-5 space-y-4'
const primary = 'px-5 py-3 rounded-xl bg-accent text-bg font-medium hover:opacity-90 disabled:opacity-50'
const ghost = 'px-4 py-3 rounded-xl border border-line text-muted hover:border-accent disabled:opacity-40'

function PauseBar({ go, left }: { go: (screen: 'home') => void; left?: ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <div>{left}</div>
      <button type="button" className="text-sm text-muted underline" onClick={() => go('home')}>
        Pause
      </button>
    </div>
  )
}

export function Run({ go }: { go: (screen: 'home') => void }) {
  const {
    world, task, problem, result, events, hintsUsed, revealed, forecast, mixPrediction, mixResults,
    submit, revealAnswer, useHint, acknowledge, advance, decideJump, oneMore, setMixPrediction,
  } = useAtlas()
  const [answer, setAnswer] = useState<UserAnswer>({ kind: 'latex', latex: '' })
  const [showSolution, setShowSolution] = useState(false)

  useEffect(() => {
    if (problem) setAnswer(emptyAnswer(problem.answer))
    setShowSolution(false)
  }, [problem])

  if (!world || !task) return <div className="p-6 text-muted">Loading…</div>

  if (task.type === 'summary') {
    const since = world.run?.startedAt ?? 0
    const mastered = Object.values(world.progress).filter((p) => p.masteredAt !== null && p.masteredAt >= since).length
    return (
      <div className="mx-auto max-w-2xl p-5 space-y-5">
        <h2 className="text-xl">Run complete</h2>
        <div className={card}>
          <p>Skills mastered this run: {mastered}</p>
          <p>
            XP today: {world.day.xp} / {world.settings.dailyGoalXp}
          </p>
          <p>Streak: {countOf(world.streak.current, 'day')}</p>
          {forecast && world.run && (
            <p>
              Exam forecast: {formatPercent(forecast.exam)}{' '}
              <span className="text-muted">
                ({forecast.exam >= world.run.forecastAtStart ? '+' : ''}
                {((forecast.exam - world.run.forecastAtStart) * 100).toFixed(1)} points this run)
              </span>
            </p>
          )}
          {mixPrediction !== null && mixResults.total > 0 && (
            <p>
              Mixed block: you predicted {mixPrediction}, you got {mixResults.correct} of {mixResults.total}
              {mixPrediction === mixResults.correct ? ' — you read yourself exactly right' : ''}
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <button type="button" className={primary} onClick={() => oneMore()}>
            One more skill
          </button>
          <button type="button" className={ghost} onClick={() => go('home')}>
            Home
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
          <h2 className="text-xl">Jump ahead?</h2>
          <p className="text-muted">
            Three topics in a row on the first try. You can go straight to “{GRAPH.node(task.target).title}”: solve two problems and
            everything leading up to it counts as done.
          </p>
          <div className="flex gap-3">
            <button type="button" className={primary} onClick={() => decideJump(true)}>
              Let's jump
            </button>
            <button type="button" className={ghost} onClick={() => decideJump(false)}>
              Keep the order
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (task.type === 'theory') {
    return (
      <div className="mx-auto max-w-2xl p-5 space-y-5">
        <PauseBar go={go} left={<h2 className="text-xl">{GRAPH.node(task.skillId).title}</h2>} />
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
          Got it
        </button>
      </div>
    )
  }

  if (task.type === 'worked' && problem) {
    return (
      <div className="mx-auto max-w-2xl p-5 space-y-5">
        <PauseBar go={go} left={<h2 className="text-xl">Worked example</h2>} />
        <div className={card}>
          <p className="text-lg">
            <RichText text={problem.statement} />
          </p>
          <Solution problem={problem} />
          <p className="text-muted">
            Answer: <Tex tex={answerToLatex(problem.answer)} />
          </p>
        </div>
        <button type="button" className={primary} onClick={() => acknowledge()}>
          Your turn
        </button>
      </div>
    )
  }

  if (task.type !== 'problem' || !problem) return null
  const graded = result !== null && result.status !== 'malformed'
  const run = world.run
  const masteredCount = Object.values(world.progress).filter((p) => p.phase === 'mastered').length
  const mixTarget = Math.min(run?.short === true ? 3 : 5, masteredCount)

  if (task.mode === 'mix' && run?.mixDone === 0 && mixPrediction === null && mixTarget > 0) {
    return (
      <div className="mx-auto max-w-2xl p-5 space-y-5">
        <PauseBar go={go} />
        <div className={card}>
          <h2 className="text-xl">How many will you get right?</h2>
          <p className="text-muted">
            Next come {mixTarget} problems mixed from what you have learned. Call it before you start — it trains the feel for what you
            really know versus what only looks familiar.
          </p>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: mixTarget + 1 }, (_, n) => (
              <button
                key={n}
                type="button"
                className="px-4 py-3 rounded-xl border border-line hover:border-accent"
                onClick={() => setMixPrediction(n)}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const onPaper = world.settings.paperNudge && (task.tier === 3 || problem.solution.length >= 4)

  return (
    <div className="mx-auto max-w-2xl p-5 space-y-5">
      <PauseBar go={go} left={<ModeBadge mode={task.fromMistake === true ? 'mistake' : task.mode} tier={task.tier} />} />

      <div className={card}>
        <div className="flex items-start justify-between gap-3">
          <p className="text-lg leading-relaxed">
            <RichText text={problem.statement} />
          </p>
        </div>

        <AnswerInput spec={problem.answer} answer={answer} onChange={setAnswer} onSubmit={() => submit(answer)} disabled={graded} />
        {problem.inputHint && !graded && <p className="text-xs text-muted">{problem.inputHint}</p>}
        {onPaper && !graded && <p className="text-xs text-warn">Work it out on paper, then type the answer — the exam will be the same.</p>}

        {!graded && (
          <div className="flex flex-wrap gap-3">
            <button type="button" className={primary} onClick={() => submit(answer)}>
              Check
            </button>
            <button type="button" className={ghost} onClick={() => useHint()} disabled={hintsUsed >= problem.hints.length}>
              Hint
            </button>
            <button
              type="button"
              className={ghost}
              onClick={() => {
                setShowSolution(true)
                void revealAnswer()
              }}
            >
              Show the solution
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
        {result?.status === 'correct' && <p className="text-good text-lg">Correct{result.note ? ` · ${result.note}` : ''}</p>}
        {result?.status === 'incorrect' && (
          <div className="space-y-2">
            <p className="text-bad text-lg">
              {revealed ? 'Solution shown' : `Not quite${result.diagnosis ? ` · ${result.diagnosis}` : ''}`}
            </p>
            <p className="text-muted">
              Correct answer: <Tex tex={answerToLatex(problem.answer)} />
            </p>
            <p className="text-xs text-muted">Counted as unsolved — a similar problem will come back.</p>
          </div>
        )}

        {graded && (
          <div className="border-t border-line pt-3 space-y-3">
            {showSolution || result?.status === 'incorrect' ? (
              <Solution problem={problem} />
            ) : (
              <button type="button" className="text-sm text-accent underline" onClick={() => setShowSolution(true)}>
                Show the solution
              </button>
            )}
          </div>
        )}
      </div>

      {events.includes('mastered') && <p className="text-good">Skill mastered ⚡</p>}
      {events.includes('repair-failed') && <p className="text-warn">Back to the foundation — we fix it and move on</p>}

      {graded && (
        <button type="button" className={primary} onClick={() => advance()}>
          Next
        </button>
      )}
    </div>
  )
}
