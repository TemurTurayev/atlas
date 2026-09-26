import { useState } from 'react'
import { EXAM_WEEKS, GRAPH } from '../../core/graph'
import { hasTemplate } from '../../core/templates/registry'
import { TheoryCard } from '../components/TheoryCard'
import { weekTitle } from '../format'
import { skillStatus, type SkillStatus } from '../selectors'
import { useAtlas } from '../store'

const TONE: Readonly<Record<SkillStatus, string>> = {
  mastered: 'border-good text-good',
  learning: 'border-accent text-accent',
  available: 'border-line text-ink',
  locked: 'border-line/50 text-muted/60',
  soon: 'border-line/40 text-muted/40',
}

interface Props {
  readonly go: (screen: 'home') => void
  /** Opens targeted practice for one skill. */
  readonly onPractice: (skillId: string) => void
}

export function MapScreen({ go, onPractice }: Props) {
  const world = useAtlas((state) => state.world)
  const [open, setOpen] = useState<string | null>(null)
  if (!world) return null

  return (
    <div className="mx-auto max-w-3xl p-5 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl">Skill map</h1>
        <button type="button" className="text-sm text-muted underline" onClick={() => go('home')}>
          Back
        </button>
      </div>

      {[0, ...EXAM_WEEKS].map((week) => (
        <section key={week} className="space-y-2">
          <h2 className="text-sm text-muted">{weekTitle(week)}</h2>
          <div className="flex flex-wrap gap-2">
            {[...GRAPH.nodes.values()]
              .filter((n) => n.week === week)
              .map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => setOpen(open === n.id ? null : n.id)}
                  className={`px-3 py-2 rounded-xl border bg-surface text-sm ${TONE[skillStatus(world, n.id)]}`}
                >
                  {n.title}
                </button>
              ))}
          </div>
          {open !== null && GRAPH.node(open).week === week && (
            <div className="rounded-card border border-line bg-surface p-4 space-y-2">
              <h3 className="text-base">{GRAPH.node(open).title}</h3>
              {hasTemplate(open) ? (
                <TheoryCard skillId={open} compact />
              ) : (
                <p className="text-sm text-muted">Problems for this topic are coming in a later stage.</p>
              )}
              {hasTemplate(open) && (
                <button
                  type="button"
                  className="mt-2 px-4 py-2 rounded-xl border border-accent text-accent text-sm hover:bg-raised"
                  onClick={() => onPractice(open)}
                >
                  Practice
                </button>
              )}
            </div>
          )}
        </section>
      ))}
    </div>
  )
}
