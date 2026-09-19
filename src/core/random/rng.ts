export interface Rng {
  /** Float in [0, 1). */
  next(): number
  /** Integer in [min, max], inclusive. */
  int(min: number, max: number): number
  /** Integer in [min, max] that is not in `excluded`. */
  intExcept(min: number, max: number, excluded: readonly number[]): number
  pick<T>(items: readonly T[]): T
  /** New shuffled array; the input is not modified. */
  shuffle<T>(items: readonly T[]): T[]
  chance(probability: number): boolean
  /** Fresh unsigned 32-bit seed. */
  seed(): number
}

/** Deterministic PRNG (mulberry32): the same seed always yields the same sequence. */
export function createRng(seed: number): Rng {
  let state = seed >>> 0

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  const int = (min: number, max: number): number => {
    if (!Number.isInteger(min) || !Number.isInteger(max) || max < min) {
      throw new Error(`rng.int: invalid range [${min}, ${max}]`)
    }
    return min + Math.floor(next() * (max - min + 1))
  }

  return {
    next,
    int,
    intExcept(min, max, excluded) {
      for (let i = 0; i < 1000; i += 1) {
        const value = int(min, max)
        if (!excluded.includes(value)) return value
      }
      throw new Error(`rng.intExcept: nothing in [${min}, ${max}] outside [${excluded.join(', ')}]`)
    },
    pick<T>(items: readonly T[]): T {
      if (items.length === 0) throw new Error('rng.pick: empty list')
      return items[int(0, items.length - 1)]
    },
    shuffle<T>(items: readonly T[]): T[] {
      const copy = [...items]
      for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = int(0, i)
        const tmp = copy[i]
        copy[i] = copy[j]
        copy[j] = tmp
      }
      return copy
    },
    chance: (probability) => next() < probability,
    seed: () => Math.floor(next() * 4294967296) >>> 0,
  }
}
