import { describe, expect, it } from 'vitest'
import { evalReal, parseLatex } from '../../checker/ce'
import { det2, det3 } from '../../math/matrix'
import { createRng } from '../../random/rng'
import { getTemplate } from '../registry'

const SEEDS = 40

function evaluateLatex(latex: string): number {
  const expr = parseLatex(latex)
  const value = expr && evalReal(expr)
  if (value === null || value === undefined) throw new Error(`cannot evaluate "${latex}"`)
  return value
}

/** Pulls the rows of a `\begin{pmatrix} ... \end{pmatrix}` block out of a statement. */
function extractPmatrix(statement: string): string[][] {
  const start = statement.indexOf('\\begin{pmatrix}')
  const end = statement.indexOf('\\end{pmatrix}')
  if (start < 0 || end < 0) throw new Error(`no pmatrix in: ${statement}`)
  const block = statement.slice(start + '\\begin{pmatrix}'.length, end).trim()
  return block.split('\\\\').map((row) => row.trim().split('&').map((c) => c.trim()))
}

/** Pulls the rows of an augmented `\begin{array}{...|c} ... \end{array}` block out of a statement. */
function extractAugmented(statement: string): string[][] {
  const beginIdx = statement.indexOf('\\begin{array}')
  if (beginIdx < 0) throw new Error(`no augmented array in: ${statement}`)
  const specStart = beginIdx + '\\begin{array}'.length
  const specEnd = statement.indexOf('}', specStart)
  const end = statement.indexOf('\\end{array}')
  if (specEnd < 0 || end < 0) throw new Error(`malformed augmented array in: ${statement}`)
  const block = statement.slice(specEnd + 1, end).trim()
  return block.split('\\\\').map((row) => row.trim().split('&').map((c) => c.trim()))
}

/** A cell is either a plain integer, or the template's own "k", "k+N", "k-N" format. */
function evalKCell(cell: string, k: number): number {
  const m = cell.match(/^k([+-]\d+)?$/)
  if (!m) return Number(cell)
  const offset = m[1] ? Number(m[1]) : 0
  return k + offset
}

/** Rank via independent floating-point Gaussian elimination with partial pivoting. */
function independentRank(input: readonly (readonly number[])[]): number {
  const rows = input.map((r) => [...r])
  const m = rows.length
  const n = m === 0 ? 0 : rows[0].length
  const EPS = 1e-9
  let rank = 0
  for (let col = 0; col < n && rank < m; col += 1) {
    let pivot = -1
    for (let r = rank; r < m; r += 1) {
      if (Math.abs(rows[r][col]) > EPS) {
        pivot = r
        break
      }
    }
    if (pivot === -1) continue
    ;[rows[rank], rows[pivot]] = [rows[pivot], rows[rank]]
    for (let r = 0; r < m; r += 1) {
      if (r === rank) continue
      const factor = rows[r][col] / rows[rank][col]
      if (Math.abs(factor) < EPS) continue
      for (let c = col; c < n; c += 1) rows[r][c] -= factor * rows[rank][c]
    }
    rank += 1
  }
  return rank
}

describe('solvability tier 1: rank matches an independently computed row reduction', () => {
  it('the stated rank equals the rank found by independent Gaussian elimination', () => {
    const seenRanks = new Set<number>()
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('solvability').generate(createRng(seed), 1)
      if (p.answer.kind !== 'number') throw new Error('expected a number answer')
      const rows = extractPmatrix(p.statement).map((row) => row.map(Number))
      const rank = independentRank(rows)
      expect(rank, `seed ${seed}: ${p.statement}`).toBe(Number(p.answer.value))
      seenRanks.add(rank)
    }
    expect(seenRanks, 'both a rank-1 and a rank-2 case should appear').toEqual(new Set([1, 2]))
  })
})

describe('solvability tier 2: det(A) really vanishes once the claimed k is substituted', () => {
  it('substituting k into the matrix makes its determinant zero', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('solvability').generate(createRng(seed), 2)
      if (p.answer.kind !== 'number') throw new Error('expected a number answer')
      const k = evaluateLatex(p.answer.value)
      const cells = extractPmatrix(p.statement)
      const numeric = cells.map((row) => row.map((c) => (c === 'k' ? k : Number(c))))
      const det = numeric.length === 2 ? det2(numeric) : det3(numeric)
      expect(Math.abs(det), `seed ${seed}: ${p.statement}`).toBeLessThan(1e-6)
    }
  })

  it('produces both the 2x2 and the 3x3 case across seeds', () => {
    const sizes = new Set<number>()
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('solvability').generate(createRng(seed), 2)
      sizes.add(extractPmatrix(p.statement).length)
    }
    expect(sizes).toEqual(new Set([2, 3]))
  })
})

describe('solvability tier 3: classification matches an independent rank comparison', () => {
  it('the marked option matches rank(A) vs. rank([A|b]) computed independently', () => {
    const seen = new Set<string>()
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('solvability').generate(createRng(seed), 3)
      if (p.answer.kind !== 'choice') throw new Error('expected a choice answer')
      const answer = p.answer
      const km = p.statement.match(/k\s*=\s*(-?\d+)/)
      if (!km) throw new Error(`no k value found in: ${p.statement}`)
      const k = Number(km[1])

      const augmented = extractAugmented(p.statement).map((row) => row.map((c) => evalKCell(c, k)))
      const coefficients = augmented.map((row) => row.slice(0, 3))
      const coeffRank = independentRank(coefficients)
      const augRank = independentRank(augmented)

      const expected: 'one' | 'none' | 'infinite' = coeffRank === 3 ? 'one' : coeffRank === augRank ? 'infinite' : 'none'
      expect(answer.correctId, `seed ${seed}: ${p.statement}`).toBe(expected)
      seen.add(answer.correctId)

      const correctOption = answer.options.find((o) => o.id === answer.correctId)
      if (!correctOption) throw new Error('no marked option found among the choices')
      const expectedLabel = { one: 'Exactly one solution', none: 'No solution', infinite: 'Infinitely many solutions' }[expected]
      expect(correctOption.label, `seed ${seed}`).toBe(expectedLabel)
    }
    expect(seen, 'all three outcomes should appear across seeds').toEqual(new Set(['one', 'none', 'infinite']))
  })
})
