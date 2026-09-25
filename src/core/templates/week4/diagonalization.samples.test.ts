import { describe, expect, it } from 'vitest'
import { apply, det2, multiply, type Mat } from '../../math/matrix'
import { createRng } from '../../random/rng'
import { template } from './diagonalization'

const SEEDS = 30

/** A raised to a whole power >= 1, by repeated multiplication (never via eigendecomposition). */
function matPow(a: Mat, n: number): number[][] {
  let result: number[][] = a.map((row) => [...row])
  for (let k = 1; k < n; k += 1) result = multiply(result, a)
  return result
}

/** Extracts the integer n from "... A^{n} ..." (or "A^{n}\vec v ...") appearing in the statement. */
function extractPower(statement: string): number {
  const match = statement.match(/\^\{(\d+)\}/)
  if (!match) throw new Error(`could not find a power in: ${statement}`)
  return Number(match[1])
}

/** Extracts "$A = \begin{pmatrix} a & b \\ c & d \end{pmatrix}$" style entries into a 2x2 number matrix. */
function extractMatrixAfter(statement: string, marker: string): Mat {
  const idx = statement.indexOf(marker)
  if (idx === -1) throw new Error(`marker "${marker}" not found in: ${statement}`)
  const rest = statement.slice(idx)
  const match = rest.match(/\\begin\{pmatrix\}([^]*?)\\end\{pmatrix\}/)
  if (!match) throw new Error(`no matrix after "${marker}" in: ${statement}`)
  const rows = match[1].split('\\\\').map((row) =>
    row
      .trim()
      .split('&')
      .map((cell) => Number(cell.trim())),
  )
  return rows
}

function asNumberGrid(rows: readonly (readonly string[])[]): number[][] {
  return rows.map((row) => row.map((cell) => Number(cell)))
}

describe('diagonalization tier 1: eigenvalues survive reconstruction', () => {
  for (let seed = 1; seed <= SEEDS; seed += 1) {
    it(`seed ${seed}`, () => {
      const p = template.generate(createRng(seed), 1)
      expect(p.answer.kind).toBe('matrix')
      if (p.answer.kind !== 'matrix') return

      const a = extractMatrixAfter(p.statement, 'A =')
      const d = asNumberGrid(p.answer.rows)
      const [lo, hi] = [d[0][0], d[1][1]]

      // D must be diagonal, ascending, matching the statement's ordering rule.
      expect(d[0][1]).toBe(0)
      expect(d[1][0]).toBe(0)
      expect(lo).toBeLessThan(hi)

      // Independently confirm lo, hi are the actual eigenvalues of A: they are exactly
      // the roots of lambda^2 - trace*lambda + det = 0 (trace/det are similarity invariants).
      const trace = a[0][0] + a[1][1]
      const detA = det2(a)
      expect(lo + hi).toBe(trace)
      expect(lo * hi).toBe(detA)

      // And confirm each is an actual eigenvalue by finding a nonzero eigenvector via
      // (A - lambda I), independent of how the generator built A.
      for (const lambda of [lo, hi]) {
        const shifted: Mat = [
          [a[0][0] - lambda, a[0][1]],
          [a[1][0], a[1][1] - lambda],
        ]
        // A singular shifted matrix (det 0) means lambda is a genuine eigenvalue.
        expect(det2(shifted)).toBe(0)
        // Find a nonzero vector in its kernel and check A v = lambda v.
        const v = Math.abs(shifted[0][0]) + Math.abs(shifted[0][1]) > 0 ? [shifted[0][1], -shifted[0][0]] : [shifted[1][1], -shifted[1][0]]
        expect(v[0] !== 0 || v[1] !== 0).toBe(true)
        const av = apply(a, v)
        expect(av[0]).toBe(lambda * v[0])
        expect(av[1]).toBe(lambda * v[1])
      }
    })
  }
})

describe('diagonalization tier 2: A^n reconstructed from P and D by repeated multiplication', () => {
  for (let seed = 1; seed <= SEEDS; seed += 1) {
    it(`seed ${seed}`, () => {
      const p = template.generate(createRng(seed), 2)
      expect(p.answer.kind).toBe('matrix')
      if (p.answer.kind !== 'matrix') return

      const pMat = extractMatrixAfter(p.statement, 'P =')
      const dMat = extractMatrixAfter(p.statement, 'D =')
      const n = extractPower(p.statement)

      // Reconstruct A = P D P^{-1} independently, using the adjugate/determinant formula.
      const detP = det2(pMat)
      expect(Math.abs(detP)).toBe(1)
      const adjP: Mat = [
        [pMat[1][1], -pMat[0][1]],
        [-pMat[1][0], pMat[0][0]],
      ]
      const pInv = adjP.map((row) => row.map((x) => x / detP))
      const a = multiply(multiply(pMat, dMat), pInv)

      // Raise A to the n-th power by repeated multiplication (the "slow way").
      const expected = matPow(a, n)
      const actual = asNumberGrid(p.answer.rows)
      expect(actual).toEqual(expected)

      // Cross-check: P D^n P^{-1} (the "fast way") must agree with the slow way too.
      const dn: Mat = dMat.map((row, i) => row.map((x, j) => (i === j ? x ** n : x)))
      const viaEigen = multiply(multiply(pMat, dn), pInv)
      expect(viaEigen).toEqual(expected)
    })
  }
})

describe('diagonalization tier 3: A^n v via the eigenbasis shortcut matches direct scaling', () => {
  for (let seed = 1; seed <= SEEDS; seed += 1) {
    it(`seed ${seed}`, () => {
      const p = template.generate(createRng(seed), 3)
      expect(p.answer.kind).toBe('vector')
      if (p.answer.kind !== 'vector') return

      const statement = p.statement
      const v1Match = statement.match(/\\vec v_1 = \\begin\{pmatrix\} (-?\d+) \\\\ (-?\d+) \\end\{pmatrix\}/)
      const v2Match = statement.match(/\\vec v_2 = \\begin\{pmatrix\} (-?\d+) \\\\ (-?\d+) \\end\{pmatrix\}/)
      const lambda1Match = statement.match(/\\lambda_1 = (-?\d+)/)
      const lambda2Match = statement.match(/\\lambda_2 = (-?\d+)/)
      if (!v1Match || !v2Match || !lambda1Match || !lambda2Match) {
        throw new Error(`could not parse eigenpairs from: ${statement}`)
      }

      const v1 = [Number(v1Match[1]), Number(v1Match[2])]
      const v2 = [Number(v2Match[1]), Number(v2Match[2])]
      const lambda1 = Number(lambda1Match[1])
      const lambda2 = Number(lambda2Match[1])
      const n = extractPower(statement)

      // Extract c1, c2 from "$\vec v = c1\vec v_1 (+/-) c2\vec v_2$".
      const comboMatch = statement.match(/\\vec v = (-?\d*)\\vec v_1 (\+|-) (\d*)\\vec v_2\$/)
      if (!comboMatch) throw new Error(`could not parse the combination from: ${statement}`)
      const c1 = comboMatch[1] === '' ? 1 : comboMatch[1] === '-' ? -1 : Number(comboMatch[1])
      const sign = comboMatch[2] === '-' ? -1 : 1
      const c2mag = comboMatch[3] === '' ? 1 : Number(comboMatch[3])
      const c2 = sign * c2mag

      // Build A independently from its two eigenpairs via A = P D P^{-1} (does not reuse
      // any generator internals), then multiply A^n by v directly ("the slow way").
      const pMat: Mat = [
        [v1[0], v2[0]],
        [v1[1], v2[1]],
      ]
      const detP = det2(pMat)
      expect(detP).not.toBe(0)
      const adjP: Mat = [
        [pMat[1][1], -pMat[0][1]],
        [-pMat[1][0], pMat[0][0]],
      ]
      const pInv = adjP.map((row) => row.map((x) => x / detP))
      const dMat: Mat = [
        [lambda1, 0],
        [0, lambda2],
      ]
      const a = multiply(multiply(pMat, dMat), pInv)

      const v = [c1 * v1[0] + c2 * v2[0], c1 * v1[1] + c2 * v2[1]]
      const an = matPow(a, n)
      const expected = apply(an, v)

      const actual = p.answer.components.map(Number)
      expect(actual[0]).toBeCloseTo(expected[0], 6)
      expect(actual[1]).toBeCloseTo(expected[1], 6)
    })
  }
})
