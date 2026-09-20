import { GRAPH } from '../../core/graph'
import { Meter, Streak } from '../components/Meter'
import { plural } from '../format'
import { dueCount, frontier } from '../selectors'
import { useAtlas } from '../store'

export function Home({ go }: { go: (screen: 'run' | 'map' | 'settings') => void }) {
  const { world, forecast, beginRun } = useAtlas()
  if (!world || !forecast) return null
  const due = dueCount(world, new Date())
  const next = frontier(world, 3)
  const inProgress = world.run !== null && world.run.phase !== 'summary'

  return (
    <div className="mx-auto max-w-2xl p-5 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl">Атлас</h1>
        <Streak days={world.streak.current} freezes={world.streak.freezes} />
      </header>

      <section className="rounded-card bg-surface border border-line p-5 space-y-4">
        <Meter label="Экзамен — прогноз" value={forecast.exam} markerAt={0.45} />
        <Meter label="База" value={forecast.base} tone="good" />
        <p className="text-sm text-muted">
          Сегодня: {world.day.xp} / {world.settings.dailyGoalXp} XP · повторить {due} {plural(due, 'навык', 'навыка', 'навыков')}
        </p>
      </section>

      <button
        type="button"
        onClick={async () => {
          await beginRun()
          go('run')
        }}
        className="w-full py-4 rounded-card bg-accent text-bg text-lg font-medium hover:opacity-90"
      >
        {inProgress ? 'Продолжить забег' : 'Начать забег'}
      </button>

      <section className="space-y-2">
        <h2 className="text-sm text-muted">Дальше по карте</h2>
        {next.length === 0 && <p className="text-muted text-sm">Всё доступное освоено — загляни на карту.</p>}
        {next.map((id) => (
          <div key={id} className="rounded-xl border border-line bg-surface px-4 py-3">
            {GRAPH.node(id).title.ru}
          </div>
        ))}
      </section>

      <nav className="flex gap-4 text-sm">
        <button type="button" className="underline text-muted" onClick={() => go('map')}>
          Карта навыков
        </button>
        <button type="button" className="underline text-muted" onClick={() => go('settings')}>
          Настройки
        </button>
      </nav>
    </div>
  )
}
