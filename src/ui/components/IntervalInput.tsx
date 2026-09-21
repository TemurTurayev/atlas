import type { IntervalPart } from '../../core/templates/types'

interface Props {
  readonly parts: readonly IntervalPart[]
  readonly onChange: (parts: readonly IntervalPart[]) => void
  readonly disabled?: boolean
}

const NEW_PART: IntervalPart = { lo: '0', hi: '1', loClosed: false, hiClosed: false }
const button = 'px-3 py-2 rounded-lg border border-line bg-raised hover:border-accent disabled:opacity-50'
const field = 'w-24 px-2 py-2 rounded-lg border border-line bg-raised text-center'

export function IntervalInput({ parts, onChange, disabled = false }: Props) {
  const patch = (index: number, next: Partial<IntervalPart>) => onChange(parts.map((p, i) => (i === index ? { ...p, ...next } : p)))

  return (
    <div className="space-y-3">
      {parts.map((part, index) => (
        <div key={index} className="flex flex-wrap items-center gap-2">
          <button type="button" className={button} disabled={disabled || part.lo === null} onClick={() => patch(index, { loClosed: !part.loClosed })}>
            {part.lo !== null && part.loClosed ? '[' : '('}
          </button>
          {part.lo === null ? (
            <span className="text-muted w-24 text-center">−∞</span>
          ) : (
            <input className={field} value={part.lo} disabled={disabled} onChange={(e) => patch(index, { lo: e.target.value })} aria-label="left endpoint" />
          )}
          <button type="button" className={button} disabled={disabled} onClick={() => patch(index, { lo: part.lo === null ? '0' : null })}>
            −∞
          </button>
          <span className="text-muted">;</span>
          {part.hi === null ? (
            <span className="text-muted w-24 text-center">+∞</span>
          ) : (
            <input className={field} value={part.hi} disabled={disabled} onChange={(e) => patch(index, { hi: e.target.value })} aria-label="right endpoint" />
          )}
          <button type="button" className={button} disabled={disabled} onClick={() => patch(index, { hi: part.hi === null ? '1' : null })}>
            +∞
          </button>
          <button type="button" className={button} disabled={disabled || part.hi === null} onClick={() => patch(index, { hiClosed: !part.hiClosed })}>
            {part.hi !== null && part.hiClosed ? ']' : ')'}
          </button>
          {parts.length > 1 && (
            <button type="button" className={button} disabled={disabled} onClick={() => onChange(parts.filter((_, i) => i !== index))} aria-label="remove interval">
              ✕
            </button>
          )}
        </div>
      ))}
      <div className="flex gap-2">
        <button type="button" className={button} disabled={disabled} onClick={() => onChange([...parts, NEW_PART])}>
          + ∪ interval
        </button>
        <button type="button" className={button} disabled={disabled} onClick={() => onChange([])}>
          ∅ empty
        </button>
      </div>
      {parts.length === 0 && <p className="text-muted text-sm">Answer: the empty set</p>}
    </div>
  )
}
