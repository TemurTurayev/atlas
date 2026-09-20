import { addDays, daysBetween } from '../time/day'

export interface StreakState {
  readonly current: number
  readonly best: number
  readonly freezes: number
  /** Last day that counted (or was covered by a freeze). */
  readonly lastDay: string | null
}

export const MAX_FREEZES = 2
export const INITIAL_STREAK: StreakState = { current: 0, best: 0, freezes: 1, lastDay: null }

/** Marks `day` as done. Every 7th day in a row earns a freeze (max 2). */
export function countDay(s: StreakState, day: string): StreakState {
  if (s.lastDay === day) return s
  const current = s.current + 1
  const earned = current % 7 === 0 ? 1 : 0
  return { current, best: Math.max(s.best, current), freezes: Math.min(MAX_FREEZES, s.freezes + earned), lastDay: day }
}

/** Applied when the app opens: missed days consume freezes, otherwise the streak resets. */
export function rollover(s: StreakState, today: string): StreakState {
  if (s.lastDay === null) return s
  const missed = daysBetween(s.lastDay, today) - 1
  if (missed <= 0) return s
  if (missed <= s.freezes) return { ...s, freezes: s.freezes - missed, lastDay: addDays(today, -1) }
  return s.current === 0 ? s : { ...s, current: 0 }
}
