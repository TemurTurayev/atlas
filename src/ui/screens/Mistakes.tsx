import { FIXES_TO_CLOSE } from '../../core/mistakes/log'
import type { Mistake } from '../../core/mistakes/types'
import { GRAPH } from '../../core/graph'
import { dayKey, daysBetween } from '../../core/time/day'
import { plural } from '../format'
import { useAtlas } from '../store'

const card = 'rounded-card bg-surface border border-line p-4 space-y-2'

function whenLabel(at: number, now: Date): string {
  const days = daysBetween(dayKey(new Date(at)), dayKey(now))
  if (days <= 0) return 'сегодня'
  if (days === 1) return 'вчера'
  return `${days} ${plural(days, 'день', 'дня', 'дней')} назад`
}

function Row({ mistake, now, onPractice }: { mistake: Mistake; now: Date; onPractice: (skillId: string) => void }) {
  const left = FIXES_TO_CLOSE - mistake.fixed
  return (
    <div className={card}>
      <div className="flex items-start justify-between gap-3">
        <p>{GRAPH.node(mistake.skillId).title.ru}</p>
        <span className="text-xs text-muted whitespace-nowrap">{whenLabel(mistake.at, now)}</span>
      </div>
      <p className="text-sm text-muted">
        {mistake.served
          ? `Осталось ${left} ${plural(left, 'чистый ответ', 'чистых ответа', 'чистых ответов')}, чтобы закрыть`
          : 'Эта задача вернётся в начале следующего забега'}
      </p>
      <button type="button" className="text-sm text-accent underline" onClick={() => onPractice(mistake.skillId)}>
        Потренировать сейчас
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
        <h1 className="text-xl">Работа над ошибками</h1>
        <button type="button" className="text-sm text-muted underline" onClick={() => go('home')}>
          Назад
        </button>
      </div>

      {mistakes.length === 0 ? (
        <p className="text-muted">Пока чисто. Всё, что не получалось, уже исправлено.</p>
      ) : (
        <>
          <p className="text-sm text-muted">
            Забег начинается с этих тем: сначала возвращается та самая задача, потом похожие. Два чистых ответа — и тема уходит из списка.
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
