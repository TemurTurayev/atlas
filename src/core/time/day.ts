const MS_PER_DAY = 86_400_000

const pad = (n: number): string => String(n).padStart(2, '0')

/** Local calendar day key, e.g. "2026-09-19". */
export function dayKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function keyToUtcMs(key: string): number {
  const [year, month, day] = key.split('-').map(Number)
  return Date.UTC(year, month - 1, day)
}

/** Whole days from `from` to `to` (positive when `to` is later). */
export function daysBetween(from: string, to: string): number {
  return Math.round((keyToUtcMs(to) - keyToUtcMs(from)) / MS_PER_DAY)
}

export function addDays(key: string, days: number): string {
  const d = new Date(keyToUtcMs(key) + days * MS_PER_DAY)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

/** Last millisecond of the local day containing `date`. */
export function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
}
