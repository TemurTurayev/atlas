import { describe, expect, it } from 'vitest'
import { evalReal, parseLatex } from '../../checker/ce'
import { exactClose } from '../../checker/compare'
import { apply, det2, multiply, transpose, type Mat } from '../../math/matrix'
import { createRng } from '../../random/rng'
import { getTemplate } from '../registry'
import { buildNonsingular2x2, buildSingularCase } from './det_2x2'
import { buildMatVec, buildMultPair, buildNoncommutingPair, buildRectPair } from './matrix_mult'

const SEEDS = 30

function numberValue(latex: string): number {
  const expr = parseLatex(latex)
  const v = expr && evalReal(expr)
  if (v === null || v === undefined) throw new Error(`cannot evaluate ${latex}`)
  return v
}

function matrixValues(rows: readonly (readonly string[])[]): number[][] {
  return rows.map((row) => row.map(numberValue))
}

function sameMatrix(a: Mat, b: Mat): boolean {
  return a.length === b.length && a.every((row, i) => row.length === b[i].length && row.every((x, j) => exactClose(x, b[i][j])))
}

describe('matrix_mult', () => {
  it('tier 1: stated product equals A times B for the recovered matrices', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const { a, b } = buildMultPair(createRng(seed))
      const p = getTemplate('matrix_mult').generate(createRng(seed), 1)
      if (p.answer.kind !== 'matrix') throw new Error('expected matrix answer')
      expect(sameMatrix(multiply(a, b), matrixValues(p.answer.rows)), `seed ${seed}`).toBe(true)
    }
  })

  it('tier 2: stated vector equals A times v for the recovered matrix and vector', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const { a, v } = buildMatVec(createRng(seed))
      const p = getTemplate('matrix_mult').generate(createRng(seed), 2)
      if (p.answer.kind !== 'vector') throw new Error('expected vector answer')
      const expected = apply(a, v)
      p.answer.components.forEach((c, i) => expect(exactClose(numberValue(c), expected[i]), `seed ${seed} component ${i}`).toBe(true))
    }
  })

  it('tier 3: stated matrix is BA (or (AB)^T); when BA is asked, AB genuinely differs from it', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const rng = createRng(seed)
      const isBa = rng.chance(0.5)
      const p = getTemplate('matrix_mult').generate(createRng(seed), 3)
      if (p.answer.kind !== 'matrix') throw new Error('expected matrix answer')
      const stated = matrixValues(p.answer.rows)
      if (isBa) {
        const { a, b } = buildNoncommutingPair(rng)
        const ab = multiply(a, b)
        const ba = multiply(b, a)
        expect(sameMatrix(ba, stated), `seed ${seed}`).toBe(true)
        expect(sameMatrix(ab, ba), `seed ${seed}: AB should differ from BA`).toBe(false)
      } else {
        const { a, b } = buildRectPair(rng)
        const value = transpose(multiply(a, b))
        expect(sameMatrix(value, stated), `seed ${seed}`).toBe(true)
      }
    }
  })
})

describe('det_2x2', () => {
  it('tier 1: stated determinant equals ad-bc for the recovered (nonsingular) matrix', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const a = buildNonsingular2x2(createRng(seed))
      const p = getTemplate('det_2x2').generate(createRng(seed), 1)
      if (p.answer.kind !== 'number') throw new Error('expected number answer')
      expect(det2(a), `seed ${seed}`).not.toBe(0)
      expect(exactClose(det2(a), numberValue(p.answer.value)), `seed ${seed}`).toBe(true)
    }
  })

  it('tier 2: substituting the stated answer for t makes the matrix exactly singular', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const { cells, unknownPos } = buildSingularCase(createRng(seed))
      const p = getTemplate('det_2x2').generate(createRng(seed), 2)
      if (p.answer.kind !== 'number') throw new Error('expected number answer')
      const answer = numberValue(p.answer.value)
      expect(exactClose(cells[unknownPos], answer), `seed ${seed}`).toBe(true)

      const at = (pos: 0 | 1 | 2 | 3): number => (pos === unknownPos ? answer : cells[pos])
      const matrix: Mat = [
        [at(0), at(1)],
        [at(2), at(3)],
      ]
      expect(exactClose(det2(matrix), 0), `seed ${seed}: matrix is not singular`).toBe(true)

      const givenPositions = ([0, 1, 2, 3] as const).filter((i) => i !== unknownPos)
      givenPositions.forEach((i) => expect(cells[i], `seed ${seed} cell ${i} should not be zero`).not.toBe(0))
    }
  })

  it('tier 3: stated determinant matches the scaling or product property for the recovered matrices', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const rng = createRng(seed)
      const isScale = rng.chance(0.5)
      const p = getTemplate('det_2x2').generate(createRng(seed), 3)
      if (p.answer.kind !== 'number') throw new Error('expected number answer')
      const answer = numberValue(p.answer.value)
      if (isScale) {
        const a = buildNonsingular2x2(rng)
        const k = rng.intExcept(-4, 4, [0, 1])
        expect(exactClose(k * k * det2(a), answer), `seed ${seed}`).toBe(true)
      } else {
        const a = buildNonsingular2x2(rng)
        const b = buildNonsingular2x2(rng)
        expect(exactClose(det2(a) * det2(b), answer), `seed ${seed}`).toBe(true)
      }
    }
  })
})
