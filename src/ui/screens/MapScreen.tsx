import { useState } from 'react'
import { EXAM_WEEKS, GRAPH } from '../../core/graph'
import { getTemplate, hasTemplate } from '../../core/templates/registry'
import { RichText } from '../components/Tex'
import { skillStatus, type SkillStatus } from '../selectors'
import { useAtlas } from '../store'

const TONE: Readonly<Record<SkillStatus, string>> = {
  mastered: 'border-good text-good',
  learning: 'border-accent text-accent',
  available: 'border-line text-ink',
  locked: 'border-line/50 text-muted/60',
  soon: 'border-line/40 text-muted/40',
}

const WEEK_TITLE: Readonly<Record<number, string>> = {
  0: 'База (школьная алгебра)',
  1: 'Неделя 1 — множества и функции',
  2: 'Неделя 2 — векторы',
  3: 'Неделя 3 — матрицы',
  4: 'Неделя 4 — собственные значения',
  5: 'Неделя 5 — производные и интегралы',
  6: 'Неделя 6 — функции многих переменных',
  7: 'Неделя 7 — дифференциальные уравнения',
  9: 'Неделя 9 — вероятность и статистика',
  10: 'Неделя 10 — выводная статистика',
  12: 'Неделя 12 — координаты и комплексные числа',
  13: 'Неделя 13 — механика',
  14: 'Неделя 14 — термодинамика',
}

export function MapScreen({ go }: { go: (screen: 'home') => void }) {
  const world = useAtlas((state) => state.world)
  const [open, setOpen] = useState<string | null>(null)
  if (!world) return null

  return (
    <div className="mx-auto max-w-3xl p-5 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl">Карта навыков</h1>
        <button type="button" className="text-sm text-muted underline" onClick={() => go('home')}>
          Назад
        </button>
      </div>

      {[0, ...EXAM_WEEKS].map((week) => (
        <section key={week} className="space-y-2">
          <h2 className="text-sm text-muted">{WEEK_TITLE[week] ?? `Неделя ${week}`}</h2>
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
                  {n.title.ru}
                </button>
              ))}
          </div>
          {open !== null && GRAPH.node(open).week === week && (
            <div className="rounded-card border border-line bg-surface p-4 space-y-2">
              <h3 className="text-base">{GRAPH.node(open).title.ru}</h3>
              <p className="text-xs text-muted">{GRAPH.node(open).title.en}</p>
              {hasTemplate(open) ? (
                getTemplate(open)
                  .theory.split('\n')
                  .map((line, i) => (
                    <p key={i} className="text-sm leading-relaxed">
                      <RichText text={line} />
                    </p>
                  ))
              ) : (
                <p className="text-sm text-muted">Задачи по этой теме появятся на следующем этапе.</p>
              )}
            </div>
          )}
        </section>
      ))}
    </div>
  )
}
