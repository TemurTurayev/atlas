import { describe, expect, it } from 'vitest'
import { evalReal, parseLatex } from '../../checker/ce'
import { exactClose } from '../../checker/compare'
import { apply, multiply, transpose, type Mat } from '../../math/matrix'
import { normSquared, type Vec } from '../../math/vector'
import { createRng } from '../../random/rng'
import { getTemplate } from '../registry'
import { buildLineFitCase, buildNormalEquationsCase, buildPredictCase, buildResidualCase } from './least_squares'
import { buildRidgeMatrixCase, buildRidgeSolveCase } from './regularization'

const SEEDS = 30

function numberValue(latex: string): number {
  const expr = parseLatex(latex)
  const v = expr && evalReal(expr)
  if (v === null || v === undefined) throw new Error(`cannot evaluate "${latex}"`)
  return v
}

const vectorValues = (components: readonly string[]): number[] => components.map(numberValue)
const matrixValues = (rows: readonly (readonly string[])[]): number[][] => rows.map((row) => row.map(numberValue))

const sameVector = (a: readonly number[], b: readonly number[]): boolean =>
  a.length === b.length && a.every((x, i) => exactClose(x, b[i]))

const sameMatrix = (a: Mat, b: Mat): boolean =>
  a.length === b.length && a.every((row, i) => row.length === b[i].length && row.every((x, j) => exactClose(x, b[i][j])))

/** Solves a 2x2 system Mx=rhs by Cramer's rule — a different code path than the adjugate/determinant
 *  division the templates use, so this genuinely double-checks their arithmetic rather than repeating it. */
function solve2x2FromScratch(m: Mat, rhs: Vec): [number, number] {
  const [[m11, m12], [m21, m22]] = m
  const [r1, r2] = rhs
  const det = m11 * m22 - m12 * m21
  if (det === 0) throw new Error('solve2x2FromScratch: singular matrix')
  const x = (r1 * m22 - r2 * m12) / det
  const y = (m11 * r2 - m21 * r1) / det
  return [x, y]
}

describe('least_squares', () => {
  it('tier 1: stated A^T A or A^T b matches the recovered design matrix (and vector)', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const { a, b, wantMatrix } = buildNormalEquationsCase(createRng(seed))
      const p = getTemplate('least_squares').generate(createRng(seed), 1)
      const at = transpose(a)

      if (wantMatrix) {
        if (p.answer.kind !== 'matrix') throw new Error('expected matrix answer')
        expect(sameMatrix(multiply(at, a), matrixValues(p.answer.rows)), `seed ${seed}`).toBe(true)
      } else {
        if (p.answer.kind !== 'vector') throw new Error('expected vector answer')
        expect(sameVector(apply(at, b), vectorValues(p.answer.components)), `seed ${seed}`).toBe(true)
      }
    }
  })

  it('tier 2: the stated (intercept, slope) solves the normal equations built from the three stated points', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const { x, y } = buildLineFitCase(createRng(seed))
      const p = getTemplate('least_squares').generate(createRng(seed), 2)
      if (p.answer.kind !== 'vector') throw new Error('expected vector answer')
      const [a, b] = vectorValues(p.answer.components)

      // Recompute A^T A and A^T b from scratch from the (x, y) data embedded in the problem.
      const design: Mat = x.map((xi) => [1, xi])
      const at = transpose(design)
      const normalMat = multiply(at, design)
      const rhs = apply(at, y)

      // Solve the 2x2 system independently (Cramer's rule, not the template's adjugate/det approach).
      const [aSolved, bSolved] = solve2x2FromScratch(normalMat, rhs)
      expect(exactClose(a, aSolved), `seed ${seed}: intercept`).toBe(true)
      expect(exactClose(b, bSolved), `seed ${seed}: slope`).toBe(true)

      // And directly verify the normal equations hold for the stated coefficients.
      const residualOfNormalEq = apply(normalMat, [a, b]).map((v, i) => v - rhs[i])
      residualOfNormalEq.forEach((r, i) => expect(exactClose(r, 0), `seed ${seed}: normal equation row ${i}`).toBe(true))
    }
  })

  it('tier 3: stated number matches an independently recomputed prediction or residual', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const rng = createRng(seed)
      const isPredict = rng.chance(0.5)
      const p = getTemplate('least_squares').generate(createRng(seed), 3)
      if (p.answer.kind !== 'number') throw new Error('expected number answer')
      const stated = numberValue(p.answer.value)

      if (isPredict) {
        const { a, b, x0 } = buildPredictCase(rng)
        expect(exactClose(stated, a + b * x0), `seed ${seed}: prediction`).toBe(true)
      } else {
        const { a, b, xi, r } = buildResidualCase(rng)
        const predicted = a + b * xi
        const yi = predicted + r
        expect(exactClose(stated, yi - predicted), `seed ${seed}: residual`).toBe(true)
      }
    }
  })
})

describe('regularization', () => {
  it('tier 1: stated matrix equals A^T A plus lambda I for the recovered design matrix', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const { a, lambda } = buildRidgeMatrixCase(createRng(seed))
      const p = getTemplate('regularization').generate(createRng(seed), 1)
      if (p.answer.kind !== 'matrix') throw new Error('expected matrix answer')

      const at = transpose(a)
      const normalMat = multiply(at, a)
      const expected = normalMat.map((row, i) => row.map((v, j) => (i === j ? v + lambda : v)))
      expect(sameMatrix(expected, matrixValues(p.answer.rows)), `seed ${seed}`).toBe(true)
    }
  })

  it('tier 2: the stated ridge solution satisfies (A^T A + lambda I) x = A^T b, solved from scratch', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const { a, b, lambda } = buildRidgeSolveCase(createRng(seed))
      const p = getTemplate('regularization').generate(createRng(seed), 2)
      if (p.answer.kind !== 'vector') throw new Error('expected vector answer')
      const stated = vectorValues(p.answer.components)

      const at = transpose(a)
      const normalMat = multiply(at, a)
      const ridgeMat = normalMat.map((row, i) => row.map((v, j) => (i === j ? v + lambda : v)))
      const rhs = apply(at, b)

      const solved = solve2x2FromScratch(ridgeMat, rhs)
      expect(sameVector(stated, solved), `seed ${seed}`).toBe(true)

      const residualOfPenalisedEq = apply(ridgeMat, stated).map((v, i) => v - rhs[i])
      residualOfPenalisedEq.forEach((r, i) => expect(exactClose(r, 0), `seed ${seed}: penalised equation row ${i}`).toBe(true))
    }
  })

  it('tier 3: the stated shrink equals ||plain||^2 - ||ridge||^2 for the same design matrix and data', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const { a, b, xhat } = buildRidgeSolveCase(createRng(seed))
      const p = getTemplate('regularization').generate(createRng(seed), 3)
      if (p.answer.kind !== 'number') throw new Error('expected number answer')
      const stated = numberValue(p.answer.value)

      // Plain least squares reduces to an ordinary solve for a square, invertible design matrix.
      const plainSolved = solve2x2FromScratch(a, b)
      // Cross-check against the normal equations too, from scratch.
      const at = transpose(a)
      const normalMat = multiply(at, a)
      const rhs = apply(at, b)
      const plainViaNormalEq = solve2x2FromScratch(normalMat, rhs)
      expect(sameVector(plainSolved, plainViaNormalEq), `seed ${seed}: plain solution agrees both ways`).toBe(true)

      const shrink = normSquared(plainSolved) - normSquared(xhat)
      expect(exactClose(stated, shrink), `seed ${seed}`).toBe(true)
      expect(stated, `seed ${seed}: ridge is strictly shorter here`).toBeGreaterThan(0)
    }
  })
})
