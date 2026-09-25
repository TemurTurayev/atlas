import { describe, expect, it } from 'vitest'
import { evalReal, parseLatex } from '../../checker/ce'
import { apply, det3, type Mat } from '../../math/matrix'
import { createRng } from '../../random/rng'
import { getTemplate } from '../registry'

const SEEDS = 30

function numberValue(latex: string): number {
  const expr = parseLatex(latex)
  const v = expr && evalReal(expr)
  if (v === null || v === undefined) throw new Error(`cannot evaluate "${latex}"`)
  return v
}

/** Every `\begin{pmatrix}...\end{pmatrix}` block in a statement, parsed into a grid of numbers, in order of appearance. */
function extractAllPmatrices(text: string): number[][][] {
  const blocks = [...text.matchAll(/\\begin\{pmatrix\}([\s\S]*?)\\end\{pmatrix\}/g)].map((m) => m[1])
  return blocks.map((inner) =>
    inner
      .split('\\\\')
      .map((row) => row.trim())
      .filter((row) => row.length > 0)
      .map((row) => row.split('&').map((cell) => Number(cell.trim()))),
  )
}

function extractOnePmatrix(text: string): Mat {
  const found = extractAllPmatrices(text)
  if (found.length === 0) throw new Error(`no matrix found in: ${text}`)
  return found[0]
}

/** The eigenvalue λ stated in a problem (given as data, not asked for), e.g. "\lambda = -3". */
function extractLambda(statement: string): number {
  const match = statement.match(/\\lambda = (-?\d+)/)
  if (!match) throw new Error(`no stated eigenvalue in: ${statement}`)
  return Number(match[1])
}

/** det(A - λI) for a 2×2 matrix, at a numeric λ — recomputed independently of the template. */
function det2AtLambda(a: Mat, lambda: number): number {
  return (a[0][0] - lambda) * (a[1][1] - lambda) - a[0][1] * a[1][0]
}

/** det(A - λI) for a 3×3 matrix, at a numeric λ — recomputed independently of the template. */
function det3AtLambda(a: Mat, lambda: number): number {
  const shifted = a.map((row, i) => row.map((x, j) => (i === j ? x - lambda : x)))
  return det3(shifted)
}

/** Rank of a 3×3 integer matrix via its minors — exact integer arithmetic, no floating point. */
function rank3(m: Mat): number {
  if (det3(m) !== 0) return 3
  for (let r1 = 0; r1 < 3; r1 += 1) {
    for (let r2 = r1 + 1; r2 < 3; r2 += 1) {
      for (let c1 = 0; c1 < 3; c1 += 1) {
        for (let c2 = c1 + 1; c2 < 3; c2 += 1) {
          if (m[r1][c1] * m[r2][c2] - m[r1][c2] * m[r2][c1] !== 0) return 2
        }
      }
    }
  }
  return m.some((row) => row.some((x) => x !== 0)) ? 1 : 0
}

describe('char_poly', () => {
  it('tier 1: the stated polynomial equals det(A - λI) for the matrix shown', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('char_poly').generate(createRng(seed), 1)
      if (p.answer.kind !== 'expression') throw new Error('expected an expression answer')
      const a = extractOnePmatrix(p.statement)
      expect(a.length, `seed ${seed}: a 2x2 matrix`).toBe(2)
      const expr = parseLatex(p.answer.value)
      if (!expr) throw new Error(`seed ${seed}: could not parse "${p.answer.value}"`)
      for (const lambda of [-3, -1.5, 0, 2, 4.25]) {
        const claimed = evalReal(expr, { lambda })
        if (claimed === null) throw new Error(`seed ${seed}: could not evaluate at lambda=${lambda}`)
        expect(claimed, `seed ${seed}, lambda=${lambda}`).toBeCloseTo(det2AtLambda(a, lambda), 9)
      }
    }
  })

  it('tier 2: every stated eigenvalue is a root of det(A - λI)', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('char_poly').generate(createRng(seed), 2)
      if (p.answer.kind !== 'numberSet') throw new Error('expected a numberSet answer')
      const a = extractOnePmatrix(p.statement)
      expect(a.length, `seed ${seed}: a 2x2 matrix`).toBe(2)
      expect(p.answer.values.length, `seed ${seed}: at least one eigenvalue`).toBeGreaterThan(0)
      for (const raw of p.answer.values) {
        const lambda = numberValue(raw)
        expect(det2AtLambda(a, lambda), `seed ${seed}: lambda=${lambda}`).toBeCloseTo(0, 9)
      }
    }
  })

  it('tier 3: every stated eigenvalue is a root of det(A - λI), and both constructions occur', () => {
    let sawTriangular = false
    let sawBlock = false
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('char_poly').generate(createRng(seed), 3)
      if (p.answer.kind !== 'numberSet') throw new Error('expected a numberSet answer')
      const a = extractOnePmatrix(p.statement)
      expect(a.length, `seed ${seed}: a 3x3 matrix`).toBe(3)
      expect(p.answer.values.length, `seed ${seed}: at least one eigenvalue`).toBeGreaterThan(0)
      for (const raw of p.answer.values) {
        const lambda = numberValue(raw)
        expect(det3AtLambda(a, lambda), `seed ${seed}: lambda=${lambda}`).toBeCloseTo(0, 9)
      }
      const text = p.solution.map((s) => s.text).join(' ')
      if (text.includes('block triangular')) sawBlock = true
      else if (text.includes('is triangular')) sawTriangular = true
    }
    expect(sawTriangular, 'the plain triangular construction appears').toBe(true)
    expect(sawBlock, 'the block-triangular construction appears').toBe(true)
  })
})

describe('eigenvectors', () => {
  it('tier 1: the stated eigenvector, multiplied by A, comes back scaled by λ', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('eigenvectors').generate(createRng(seed), 1)
      if (p.answer.kind !== 'vector') throw new Error('expected a vector answer')
      expect(p.answer.upToScale, `seed ${seed}: upToScale`).toBe(true)
      const a = extractOnePmatrix(p.statement)
      expect(a.length, `seed ${seed}: a 2x2 matrix`).toBe(2)
      const lambda = extractLambda(p.statement)
      const v = p.answer.components.map(numberValue)
      expect(v.some((x) => x !== 0), `seed ${seed}: nonzero vector`).toBe(true)
      const av = apply(a, v)
      v.forEach((x, i) => expect(av[i], `seed ${seed}, component ${i}`).toBeCloseTo(lambda * x, 9))
    }
  })

  it('tier 2: the stated eigenvector, multiplied by A, comes back scaled by λ', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('eigenvectors').generate(createRng(seed), 2)
      if (p.answer.kind !== 'vector') throw new Error('expected a vector answer')
      expect(p.answer.upToScale, `seed ${seed}: upToScale`).toBe(true)
      const a = extractOnePmatrix(p.statement)
      expect(a.length, `seed ${seed}: a 3x3 matrix`).toBe(3)
      const lambda = extractLambda(p.statement)
      const v = p.answer.components.map(numberValue)
      expect(v.some((x) => x !== 0), `seed ${seed}: nonzero vector`).toBe(true)
      const av = apply(a, v)
      v.forEach((x, i) => expect(av[i], `seed ${seed}, component ${i}`).toBeCloseTo(lambda * x, 9))
    }
  })

  it('tier 3: the stated dimension equals the nullity of A - λI, and both cases occur', () => {
    let sawDim1 = false
    let sawDim2 = false
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('eigenvectors').generate(createRng(seed), 3)
      if (p.answer.kind !== 'number') throw new Error('expected a number answer')
      const a = extractOnePmatrix(p.statement)
      expect(a.length, `seed ${seed}: a 3x3 matrix`).toBe(3)
      const lambda = extractLambda(p.statement)
      const m: Mat = a.map((row, i) => row.map((x, j) => (i === j ? x - lambda : x)))
      const nullity = 3 - rank3(m)
      const claimed = Number(p.answer.value)
      expect(claimed, `seed ${seed}`).toBe(nullity)
      if (claimed === 1) sawDim1 = true
      if (claimed === 2) sawDim2 = true
    }
    expect(sawDim1, 'the 1-dimensional eigenspace case appears').toBe(true)
    expect(sawDim2, 'the 2-dimensional eigenspace case appears').toBe(true)
  })
})
