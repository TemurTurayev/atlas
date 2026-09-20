import type { Tier } from '../templates/types'
import type { Mistake } from './types'

/** Older entries fall off the list; the recent ones are the ones worth working on. */
export const MISTAKE_LIMIT = 40
/** Two clean answers on the skill close the entry. */
export const FIXES_TO_CLOSE = 2

export const mistakeFor = (mistakes: readonly Mistake[], skillId: string): Mistake | undefined =>
  mistakes.find((m) => m.skillId === skillId)

/** Files a miss. A repeat miss on the same skill refreshes the entry and resets its progress. */
export function recordMistake(mistakes: readonly Mistake[], miss: { skillId: string; seed: number; tier: Tier }, at: number): Mistake[] {
  const entry: Mistake = { skillId: miss.skillId, seed: miss.seed, tier: miss.tier, at, fixed: 0, served: false }
  return [entry, ...mistakes.filter((m) => m.skillId !== miss.skillId)].slice(0, MISTAKE_LIMIT)
}

/** A clean answer on the skill: two of them close the entry. */
export function recordFix(mistakes: readonly Mistake[], skillId: string): Mistake[] {
  return mistakes.flatMap((m) => {
    if (m.skillId !== skillId) return [m]
    const fixed = m.fixed + 1
    return fixed >= FIXES_TO_CLOSE ? [] : [{ ...m, fixed }]
  })
}

/** The missed problem is offered back once; after that the skill returns with fresh problems. */
export function markServed(mistakes: readonly Mistake[], skillId: string): Mistake[] {
  return mistakes.map((m) => (m.skillId === skillId ? { ...m, served: true } : m))
}

export interface GradedAnswer {
  readonly skillId: string
  readonly seed: number
  readonly tier: Tier
  readonly correct: boolean
  /** Correct without hints — only a clean answer closes an entry. */
  readonly clean: boolean
  /** Whether the skill counted as mastered before this answer. */
  readonly wasMastered: boolean
}

/** Applies one graded answer to the log. Only skills that were already mastered are filed. */
export function applyResult(mistakes: readonly Mistake[], result: GradedAnswer, at: number): Mistake[] {
  if (result.correct) return result.clean ? recordFix(mistakes, result.skillId) : [...mistakes]
  if (!result.wasMastered) return [...mistakes]
  return recordMistake(mistakes, result, at)
}
