import { describe, expect, it } from 'vitest'
import { evalReal, parseLatex } from '../../checker/ce'
import { createRng } from '../../random/rng'
import { getTemplate } from '../registry'

const SEEDS = 40

/** Pulls the two equations out of a `\begin{cases} EQ1 \\ EQ2 \end{cases}` block in the statement. */
function extractCases(statement: string): readonly [string, string] {
  const start = statement.indexOf('\\begin{cases}')
  const end = statement.indexOf('\\end{cases}')
  if (start < 0 || end < 0) throw new Error(`no cases block in: ${statement}`)
  const block = statement.slice(start + '\\begin{cases}'.length, end)
  const parts = block.split('\\\\').map((s) => s.trim())
  if (parts.length !== 2) throw new Error(`expected 2 equations, got ${parts.length}: ${block}`)
  return [parts[0], parts[1]]
}

/** Parses "AxByEqual" of the form produced by eqLatex: e.g. "2x-3y=5", "-x+y=-2". */
function parseNumericEq(eq: string): readonly [number, number, number] {
  const m = eq.match(/^(-?\d*)x([+-]\d*)y = (-?\d+)$/)
  if (!m) throw new Error(`cannot parse numeric equation: ${eq}`)
  const a = m[1] === '' ? 1 : m[1] === '-' ? -1 : Number(m[1])
  const bSign = m[2][0] === '-' ? -1 : 1
  const bRest = m[2].slice(1)
  const b = bRest === '' ? bSign : bSign * Number(bRest)
  const c = Number(m[3])
  return [a, b, c]
}

/** Parses the parameterized second equation of tier 3: e.g. "3x+ky=7", "-3x+ky=7". */
function parseParamEq(eq: string): readonly [number, number] {
  const m = eq.match(/^(-?\d*)x\+ky = (-?\d+)$/)
  if (!m) throw new Error(`cannot parse parameterized equation: ${eq}`)
  const a = m[1] === '' ? 1 : m[1] === '-' ? -1 : Number(m[1])
  const c = Number(m[2])
  return [a, c]
}

describe('linsys_geometry tier 1: classification matches an independent determinant test', () => {
  it('the marked option always matches D, Dx, Dy computed from the extracted coefficients', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('linsys_geometry').generate(createRng(seed), 1)
      if (p.answer.kind !== 'choice') throw new Error('expected choice')
      const answer = p.answer
      const [eq1, eq2] = extractCases(p.statement)
      const [a1, b1, c1] = parseNumericEq(eq1)
      const [a2, b2, c2] = parseNumericEq(eq2)

      const D = a1 * b2 - a2 * b1
      let expected: 'one' | 'none' | 'infinite'
      if (D !== 0) {
        expected = 'one'
      } else {
        const Dx = c1 * b2 - c2 * b1
        const Dy = a1 * c2 - a2 * c1
        expected = Dx === 0 && Dy === 0 ? 'infinite' : 'none'
      }
      expect(answer.correctId, `seed ${seed}: ${eq1} | ${eq2}`).toBe(expected)

      const correctOption = answer.options.find((o) => o.id === answer.correctId)
      if (!correctOption) throw new Error('no marked option')
      const expectedLabel = { one: 'Exactly one solution', none: 'No solution', infinite: 'Infinitely many solutions' }[expected]
      expect(correctOption.label, `seed ${seed}`).toBe(expectedLabel)
    }
  })

  it('produces all three cases across seeds', () => {
    const seen = new Set<string>()
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('linsys_geometry').generate(createRng(seed), 1)
      if (p.answer.kind !== 'choice') throw new Error('expected choice')
      seen.add(p.answer.correctId)
    }
    expect(seen).toEqual(new Set(['one', 'none', 'infinite']))
  })
})

describe('linsys_geometry tier 2: the stated (x, y) solves both extracted equations', () => {
  it('substituting the answer back into both equations holds exactly', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('linsys_geometry').generate(createRng(seed), 2)
      if (p.answer.kind !== 'vector') throw new Error('expected vector')
      const [eq1, eq2] = extractCases(p.statement)
      const [a1, b1, c1] = parseNumericEq(eq1)
      const [a2, b2, c2] = parseNumericEq(eq2)
      const x = Number(p.answer.components[0])
      const y = Number(p.answer.components[1])

      expect(a1 * x + b1 * y, `seed ${seed} eq1`).toBe(c1)
      expect(a2 * x + b2 * y, `seed ${seed} eq2`).toBe(c2)

      // Sanity: the two rows must actually be independent (a genuinely unique intersection).
      expect(a1 * b2 - a2 * b1, `seed ${seed}: degenerate rows`).not.toBe(0)
    }
  })
})

describe('linsys_geometry tier 3: the claimed k really makes the system degenerate', () => {
  it('D(k) = 0 at the claimed k, and Dy correctly predicts none vs. infinite', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('linsys_geometry').generate(createRng(seed), 3)
      if (p.answer.kind !== 'number') throw new Error('expected number')
      const [eq1, eq2] = extractCases(p.statement)
      const [a1, b1, c1] = parseNumericEq(eq1)
      const [a2, c2] = parseParamEq(eq2)

      const kExpr = parseLatex(p.answer.value)
      if (!kExpr) throw new Error(`cannot parse k: ${p.answer.value}`)
      const k = evalReal(kExpr)
      if (k === null) throw new Error(`cannot evaluate k: ${p.answer.value}`)

      const D = a1 * k - a2 * b1
      expect(Math.abs(D), `seed ${seed}: D(k) should vanish at the claimed k`).toBeLessThan(1e-9)

      const Dy = a1 * c2 - a2 * c1
      const wantsInfinite = p.statement.includes('infinitely many solutions')
      const wantsNone = p.statement.includes('no solution')
      expect(wantsInfinite !== wantsNone, `seed ${seed}: exactly one outcome should be asked for`).toBe(true)
      if (wantsInfinite) {
        expect(Dy, `seed ${seed}: infinite case needs Dy = 0`).toBe(0)
      } else {
        expect(Dy, `seed ${seed}: none case needs Dy != 0`).not.toBe(0)
      }
    }
  })
})
