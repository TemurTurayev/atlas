import { formatPercent } from '../format'

export function Meter({ label, value, markerAt, tone = 'accent' }: { label: string; value: number; markerAt?: number; tone?: 'accent' | 'good' }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm text-muted">
        <span>{label}</span>
        <span className="text-ink">{formatPercent(value)}</span>
      </div>
      <div className="relative h-2 rounded-full bg-line">
        <div className={`h-2 rounded-full ${tone === 'good' ? 'bg-good' : 'bg-accent'}`} style={{ width: `${Math.min(100, value * 100)}%` }} />
        {markerAt !== undefined && <div className="absolute -top-1 h-4 w-0.5 bg-ink/70" style={{ left: `${markerAt * 100}%` }} />}
      </div>
    </div>
  )
}

const MODE_LABEL: Readonly<Record<string, string>> = {
  express: 'Express check',
  lesson: 'Lesson',
  review: 'Review',
  mix: 'Mixed',
  jump: 'Jump',
  repair: 'Repair',
  mistake: 'Fixing a mistake',
}

export function ModeBadge({ mode, tier }: { mode: string; tier?: number }) {
  return (
    <span className="text-xs px-2 py-1 rounded-lg bg-raised border border-line text-muted">
      {MODE_LABEL[mode] ?? mode}
      {tier ? ` · level ${tier}` : ''}
    </span>
  )
}

export function Streak({ days, freezes }: { days: number; freezes: number }) {
  return (
    <span className="text-sm text-warn" title={`freezes: ${freezes}`}>
      🔥 {days}
    </span>
  )
}
