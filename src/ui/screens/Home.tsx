import { EXAM_MIN_SKILLS } from '../../core/exam/build'
import { GRAPH } from '../../core/graph'
import type { World } from '../../core/session/world'
import { dayKey, daysBetween } from '../../core/time/day'
import { Meter, Streak } from '../components/Meter'
import { countOf, formatPercent } from '../format'
import { dueCount, frontier, masteredCount } from '../selectors'
import { useAtlas } from '../store'

/** A calm nudge after a gap, or a fresh-start note on Mondays and the first of the month. */
function Banner({ daysAway, freshStart }: { daysAway: number; freshStart: boolean }) {
  if (daysAway >= 2) {
    return (
      <p className="rounded-card border border-line bg-surface px-4 py-3 text-sm text-muted">
        {countOf(daysAway, 'day')} away from Atlas. Five minutes today and you are back in rhythm.
      </p>
    )
  }
  if (freshStart) {
    return (
      <p className="rounded-card border border-line bg-surface px-4 py-3 text-sm text-muted">
        A new week — a good moment to set the pace.
      </p>
    )
  }
  return null
}

/** The mock exam: an unfinished paper first, then the last result. */
function ExamCard({ world, go }: { world: World; go: (screen: 'exam') => void }) {
  const exam = world.exam
  const last = world.examHistory[world.examHistory.length - 1]
  const ready = masteredCount(world) >= EXAM_MIN_SKILLS
  if (!ready && !exam && !last) return null
  const label = exam === null ? 'Mock exam' : exam.finishedAt === null ? 'Back to the exam' : 'See the results'
  const tone = exam && exam.finishedAt === null ? 'border-warn text-warn' : 'border-line text-muted hover:border-accent'
  return (
    <section className="space-y-2">
      <button type="button" onClick={() => go('exam')} className={`w-full py-3 rounded-card border ${tone}`}>
        {label}
      </button>
      {last && (
        <p className="text-xs text-muted text-center">
          Last paper: {last.correct} of {last.total} · {formatPercent(last.total === 0 ? 0 : last.correct / last.total)}
        </p>
      )}
    </section>
  )
}

export function Home({ go }: { go: (screen: 'run' | 'map' | 'settings' | 'exam' | 'mistakes') => void }) {
  const { world, forecast, beginRun, lastActiveDay } = useAtlas()
  if (!world || !forecast) return null

  const now = new Date()
  const due = dueCount(world, now)
  const next = frontier(world, 3)
  const inProgress = world.run !== null && world.run.phase !== 'summary'
  const daysAway = lastActiveDay !== null ? daysBetween(lastActiveDay, dayKey(now)) : 0
  const freshStart = now.getDay() === 1 || now.getDate() === 1

  const start = async (short: boolean) => {
    await beginRun(short)
    go('run')
  }

  return (
    <div className="mx-auto max-w-2xl p-5 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl">Atlas</h1>
        <Streak days={world.streak.current} freezes={world.streak.freezes} />
      </header>

      <Banner daysAway={daysAway} freshStart={freshStart} />

      <section className="rounded-card bg-surface border border-line p-5 space-y-4">
        <Meter label="Exam forecast" value={forecast.exam} markerAt={0.45} />
        <Meter label="Foundations" value={forecast.base} tone="good" />
        <p className="text-sm text-muted">
          Today: {world.day.xp} / {world.settings.dailyGoalXp} XP · {countOf(due, 'skill')} to review
        </p>
      </section>

      <div className="space-y-3">
        <button
          type="button"
          onClick={() => start(false)}
          className="w-full py-4 rounded-card bg-accent text-bg text-lg font-medium hover:opacity-90"
        >
          {inProgress ? 'Continue the run' : 'Start the run'}
        </button>
        {!inProgress && (
          <button
            type="button"
            onClick={() => start(true)}
            className="w-full py-3 rounded-card border border-line text-muted hover:border-accent"
          >
            Short version · 5 minutes
          </button>
        )}
      </div>

      <ExamCard world={world} go={go} />

      <section className="space-y-2">
        <h2 className="text-sm text-muted">Next on the map</h2>
        {next.length === 0 && <p className="text-muted text-sm">Everything open is mastered — take a look at the map.</p>}
        {next.map((id) => (
          <div key={id} className="rounded-xl border border-line bg-surface px-4 py-3">
            {GRAPH.node(id).title}
          </div>
        ))}
      </section>

      <nav className="flex gap-4 text-sm">
        <button type="button" className="underline text-muted" onClick={() => go('map')}>
          Skill map
        </button>
        <button type="button" className="underline text-muted" onClick={() => go('settings')}>
          Settings
        </button>
        {world.mistakes.length > 0 && (
          <button type="button" className="underline text-warn" onClick={() => go('mistakes')}>
            Mistakes · {world.mistakes.length}
          </button>
        )}
      </nav>
    </div>
  )
}
