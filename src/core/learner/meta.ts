export interface LearnerMeta {
  /** Consecutive express passes since the last express failure or jump. */
  readonly expressStreak: number
  /** How far (in ladder positions) the next jump may look ahead. */
  readonly jumpStride: number
  /** Last ≤ 20 graded results. */
  readonly recent: readonly boolean[]
}

export type Momentum = 'high' | 'mid' | 'low'

export const INITIAL_META: LearnerMeta = { expressStreak: 0, jumpStride: 4, recent: [] }

export const recordResult = (m: LearnerMeta, correct: boolean): LearnerMeta => ({ ...m, recent: [...m.recent, correct].slice(-20) })
export const onExpressPassed = (m: LearnerMeta): LearnerMeta => ({ ...m, expressStreak: m.expressStreak + 1 })
export const onExpressFailed = (m: LearnerMeta): LearnerMeta => ({ ...m, expressStreak: 0 })
export const onJumpSucceeded = (m: LearnerMeta): LearnerMeta => ({ ...m, expressStreak: 0, jumpStride: Math.min(12, m.jumpStride * 2) })
export const onJumpFailed = (m: LearnerMeta): LearnerMeta => ({ ...m, expressStreak: 0, jumpStride: 4 })

export function momentum(m: LearnerMeta): Momentum {
  if (m.recent.length < 5) return 'mid'
  const accuracy = m.recent.filter(Boolean).length / m.recent.length
  if (accuracy >= 0.9) return 'high'
  return accuracy >= 0.7 ? 'mid' : 'low'
}

/** New lessons allowed per run. Express passes are free. */
export function lessonQuota(level: Momentum): number {
  if (level === 'high') return 3
  return level === 'mid' ? 2 : 1
}

export const jumpAllowed = (m: LearnerMeta): boolean => m.expressStreak >= 3 && momentum(m) !== 'low'
