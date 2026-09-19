import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { createRng } from './rng'

describe('createRng', () => {
  it('is deterministic for a seed', () => {
    const a = createRng(42)
    const b = createRng(42)
    const seqA = Array.from({ length: 5 }, () => a.next())
    const seqB = Array.from({ length: 5 }, () => b.next())
    expect(seqA).toEqual(seqB)
    expect(createRng(43).next()).not.toBe(seqA[0])
  })

  it('int stays inside the inclusive range', () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer({ min: -50, max: 50 }), fc.integer({ min: 0, max: 30 }), (seed, min, span) => {
        const rng = createRng(seed)
        for (let i = 0; i < 50; i += 1) {
          const v = rng.int(min, min + span)
          if (v < min || v > min + span || !Number.isInteger(v)) return false
        }
        return true
      }),
    )
  })

  it('int reaches both ends of a small range', () => {
    const rng = createRng(7)
    const seen = new Set(Array.from({ length: 400 }, () => rng.int(1, 3)))
    expect([...seen].sort()).toEqual([1, 2, 3])
  })

  it('intExcept never returns an excluded value', () => {
    const rng = createRng(1)
    for (let i = 0; i < 500; i += 1) expect([0, 1, -1]).not.toContain(rng.intExcept(-3, 3, [0, 1, -1]))
  })

  it('shuffle returns a permutation without mutating the input', () => {
    const input = [1, 2, 3, 4, 5] as const
    const out = createRng(9).shuffle(input)
    expect([...out].sort()).toEqual([1, 2, 3, 4, 5])
    expect(input).toEqual([1, 2, 3, 4, 5])
  })

  it('rejects invalid input', () => {
    const rng = createRng(1)
    expect(() => rng.int(3, 1)).toThrow()
    expect(() => rng.pick([])).toThrow()
    expect(() => rng.intExcept(0, 0, [0])).toThrow()
  })

  it('seed produces 32-bit unsigned integers', () => {
    const rng = createRng(5)
    for (let i = 0; i < 100; i += 1) {
      const s = rng.seed()
      expect(Number.isInteger(s) && s >= 0 && s < 2 ** 32).toBe(true)
    }
  })
})
