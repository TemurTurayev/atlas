import { FIXES_TO_CLOSE } from '../../core/mistakes/log'
import type { Mistake } from '../../core/mistakes/types'
import { GRAPH } from '../../core/graph'
import { dayKey, daysBetween } from '../../core/time/day'
import { countOf } from '../format'
import { useAtlas } from '../store'

const card = 'rounded-card bg-surface border border-line p-4 space-y-2'

function whenLabel(at: number, now: Date): string {
  const days = daysBetween(dayKey(new Date(at)), dayKey(now))
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  return `${countOf(days, 'day')} ago`
}

function Row({ mistake, now, onPractice }: { mistake: Mistake; now: Date; onPractice: (skillId: string) => void }) {
  const left = FIXES_TO_CLOSE - mistake.fixed
  return (
    <div className={card}>
      <div className="flex items-start justify-between gap-3">
        <p>{GRAPH.node(mistake.skillId).title}</p>
        <span className="text-xs text-muted whitespace-nowrap">{whenLabel(mistake.at, now)}</span>
      </div>
      <p className="text-sm text-muted">
        {mistake.served
          ? `${countOf(left, 'clean answer')} left to close this one`
          : 'This very problem comes back at the start of the next run'}
      </p>
      <button type="button" className="text-sm text-accent underline" onClick={() => onPractice(mistake.skillId)}>
        Practice it now
      </button>
    </div>
  )
}

/** The error log. It only matters because the engine serves these back by itself. */
export function Mistakes({ go, onPractice }: { go: (screen: 'home') => void; onPractice: (skillId: string) => void }) {
  const world = useAtlas((state) => state.world)
  if (!world) return null
  const now = new Date()
  const mistakes = world.mistakes

  return (
    <div className="mx-auto max-w-2xl p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl">Fixing mistakes</h1>
        <button type="button" className="text-sm text-muted underline" onClick={() => go('home')}>
          Back
        </button>
      </div>

      {mistakes.length === 0 ? (
        <p className="text-muted">All clear. Everything that went wrong has been fixed.</p>
      ) : (
        <>
          <p className="text-sm text-muted">
            Your run starts with these: first the very problem you missed, then fresh ones of the same kind. Two clean answers and a
            topic leaves the list.
          </p>
          <div className="space-y-3">
            {mistakes.map((mistake) => (
              <Row key={mistake.skillId} mistake={mistake} now={now} onPractice={onPractice} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
