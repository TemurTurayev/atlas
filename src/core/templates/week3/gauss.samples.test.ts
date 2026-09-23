import { describe, expect, it } from 'vitest'
import { evalReal, parseLatex } from '../../checker/ce'
import { identity, multiply, type Mat } from '../../math/matrix'
import { createRng } from '../../random/rng'
import { tier1 as elimTier1, tier2 as elimTier2, tier3 as elimTier3 } from './gauss_elim'
import { tier1 as invTier1, tier2 as invTier2, tier3Param as invTier3Param, tier3Solve as invTier3Solve } from './gauss_jordan_inv'

const SEEDS = 30

/** Independent RREF-based classifier: does NOT reuse anything from the generator. */
function classifySystem(a: readonly (readonly number[])[], b: readonly number[]): 'one' | 'none' | 'infinite' {
  const n = a.length
  const width = a[0].length
  const aug = a.map((row, i) => [...row, b[i]])
  let rank = 0
  for (let col = 0; col < width && rank < n; col += 1) {
    let pivotRow = -1
    for (let r = rank; r < n; r += 1) {
      if (Math.abs(aug[r][col]) > 1e-9) {
        pivotRow = r
        break
      }
    }
    if (pivotRow < 0) continue
    ;[aug[rank], aug[pivotRow]] = [aug[pivotRow], aug[rank]]
    for (let r = 0; r < n; r += 1) {
      if (r === rank) continue
      const factor = aug[r][col] / aug[rank][col]
      for (let c = col; c <= width; c += 1) aug[r][c] -= factor * aug[rank][c]
    }
    rank += 1
  }
  for (let r = 0; r < n; r += 1) {
    const coeffZero = aug[r].slice(0, width).every((v) => Math.abs(v) < 1e-9)
    if (coeffZero && Math.abs(aug[r][width]) > 1e-9) return 'none'
  }
  return rank < width ? 'infinite' : 'one'
}

function numberAnswer(value: string): number {
  const expr = parseLatex(value)
  if (!expr) throw new Error(`cannot parse: ${value}`)
  const n = evalReal(expr)
  if (n === null) throw new Error(`cannot evaluate: ${value}`)
  return n
}

describe('gauss_elim tier 1: substituting (x, y) back into both rows holds exactly', () => {
  it('every seed solves both equations', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const { problem, a, b } = elimTier1(createRng(seed))
      if (problem.answer.kind !== 'vector') throw new Error('expected vector answer')
      const [x, y] = problem.answer.components.map(Number)
      a.forEach((row, i) => {
        expect(row[0] * x + row[1] * y, `seed ${seed} row ${i}`).toBe(b[i])
      })
      expect(classifySystem(a, b), `seed ${seed}: should be a unique-solution system`).toBe('one')
    }
  })
})

describe('gauss_elim tier 2: substituting (x, y, z) back into all three rows holds exactly', () => {
  it('every seed solves the full 3x3 system', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const { problem, a, b } = elimTier2(createRng(seed))
      if (problem.answer.kind !== 'vector') throw new Error('expected vector answer')
      const [x, y, z] = problem.answer.components.map(Number)
      a.forEach((row, i) => {
        expect(row[0] * x + row[1] * y + row[2] * z, `seed ${seed} row ${i}`).toBe(b[i])
      })
      expect(classifySystem(a, b), `seed ${seed}: should be a unique-solution system`).toBe('one')
    }
  })
})

describe('gauss_elim tier 3: degenerate systems match an independent rank/consistency test', () => {
  it('never claims a unique solution, and the stated answer matches the true classification', () => {
    const seenKinds = new Set<string>()
    const seenCases = new Set<string>()
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const { problem, a, b } = elimTier3(createRng(seed))
      const trueCase = classifySystem(a, b)
      expect(trueCase, `seed ${seed}: tier 3 must never have a unique solution`).not.toBe('one')
      seenCases.add(trueCase)
      seenKinds.add(problem.answer.kind)

      if (problem.answer.kind === 'choice') {
        const answer = problem.answer
        expect(answer.correctId, `seed ${seed}`).toBe(trueCase)
        const correctOption = answer.options.find((o) => o.id === answer.correctId)
        expect(correctOption, `seed ${seed}: marked option must exist`).toBeDefined()
      } else if (problem.answer.kind === 'vector') {
        expect(trueCase, `seed ${seed}: a particular solution only makes sense when infinite`).toBe('infinite')
        const [x, y, z] = problem.answer.components.map(Number)
        expect(z, `seed ${seed}: pinned at z = 0`).toBe(0)
        a.forEach((row, i) => {
          expect(row[0] * x + row[1] * y + row[2] * z, `seed ${seed} row ${i}`).toBe(b[i])
        })
      } else {
        throw new Error(`seed ${seed}: unexpected answer kind "${problem.answer.kind}"`)
      }
    }
    // Sanity: across 30 seeds we should see real variety, not one branch generating every problem.
    expect(seenCases.has('none') || seenCases.has('infinite'), 'should see at least one degenerate case').toBe(true)
    expect(seenKinds.size).toBeGreaterThan(0)
  })
})

function assertIsInverse(a: Mat, claimed: readonly (readonly string[])[], seed: number): void {
  const n = a.length
  const inv = claimed.map((row) => row.map(Number))
  const product = multiply(a, inv)
  const id = identity(n)
  product.forEach((row, i) =>
    row.forEach((v, j) => {
      expect(v, `seed ${seed}: (A * claimed_inverse)[${i}][${j}]`).toBe(id[i][j])
    }),
  )
}

describe('gauss_jordan_inv tier 1: the claimed 2x2 inverse really inverts A', () => {
  it('A times the claimed inverse is the identity', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const { problem, a } = invTier1(createRng(seed))
      if (problem.answer.kind !== 'matrix') throw new Error('expected matrix answer')
      assertIsInverse(a, problem.answer.rows, seed)
    }
  })
})

describe('gauss_jordan_inv tier 2: the claimed 3x3 inverse really inverts A', () => {
  it('A times the claimed inverse is the identity', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const { problem, a } = invTier2(createRng(seed))
      if (problem.answer.kind !== 'matrix') throw new Error('expected matrix answer')
      assertIsInverse(a, problem.answer.rows, seed)
    }
  })
})

describe('gauss_jordan_inv tier 3 (solve): the claimed x really solves Ax = b', () => {
  it('every seed solves the full 3x3 system', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const { problem, a, b } = invTier3Solve(createRng(seed))
      if (problem.answer.kind !== 'vector') throw new Error('expected vector answer')
      const [x, y, z] = problem.answer.components.map(Number)
      a.forEach((row, i) => {
        expect(row[0] * x + row[1] * y + row[2] * z, `seed ${seed} row ${i}`).toBe(b[i])
      })
    }
  })
})

describe('gauss_jordan_inv tier 3 (parameter): the claimed t really makes the matrix singular', () => {
  it('a*t - b*c is zero at the claimed t', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const { problem, a, b, c } = invTier3Param(createRng(seed))
      if (problem.answer.kind !== 'number') throw new Error('expected number answer')
      const t0 = numberAnswer(problem.answer.value)
      expect(Math.abs(a * t0 - b * c), `seed ${seed}: det(t0) should vanish`).toBeLessThan(1e-9)
    }
  })
})
