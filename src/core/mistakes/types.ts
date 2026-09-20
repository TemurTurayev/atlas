import type { Tier } from '../templates/types'

/** A miss on a skill that was already mastered, kept until it is fixed. */
export interface Mistake {
  readonly skillId: string
  /** The problem that was missed, so the very same one can come back once. */
  readonly seed: number
  readonly tier: Tier
  readonly at: number
  /** Clean answers on this skill since the miss; the entry clears at two. */
  readonly fixed: number
  /** True once the original problem has been served back. */
  readonly served: boolean
}
