import { describe, expect, it } from 'vitest'
import { evalReal, parseLatex } from '../../checker/ce'
import { parallel } from '../../math/vector'
import { createRng } from '../../random/rng'
import { getTemplate } from '../registry'

const SEEDS = 30

/** Numeric value of a LaTeX expression with variables substituted. */
function evaluate(latex: string, vars: Readonly<Record<string, number>>): number {
  const e = parseLatex(latex)
  const v = e && evalReal(e, vars)
  if (v === null || v === undefined) throw new Error(`cannot evaluate "${latex}" at ${JSON.stringify(vars)}`)
  return v
}

/** Central-difference partials of f at a point — independent of any symbolic differentiation rule. */
function numericGradient(latex: string, point: Readonly<Record<string, number>>, varNames: readonly string[], h = 1e-4): number[] {
  return varNames.map((name) => {
    const plus = { ...point, [name]: point[name] + h }
    const minus = { ...point, [name]: point[name] - h }
    return (evaluate(latex, plus) - evaluate(latex, minus)) / (2 * h)
  })
}

function requireMatch(text: string, re: RegExp): RegExpMatchArray {
  const m = text.match(re)
  if (!m) throw new Error(`pattern ${re} did not match: ${text}`)
  return m
}

/** The LaTeX right after "f(x,y) = " or "f(x,y,z) = " up to the next "$" — the function every problem states. */
function extractF(statement: string): string {
  return requireMatch(statement, /f\(x,\s*y(?:,\s*z)?\) = (.+?)\$/)[1]
}

/** The comma-separated numbers inside "the point $(...)$". */
function extractPoint(statement: string): number[] {
  const inner = requireMatch(statement, /the point \$\(([^)]+)\)\$/)[1]
  return inner.split(',').map((s) => Number(s.trim()))
}

const varNamesFor = (point: readonly number[]): readonly string[] => (point.length === 3 ? ['x', 'y', 'z'] : ['x', 'y'])

/** The numeric gradient of the function and point embedded in a generated problem's statement. */
function numericGradientOf(statement: string): number[] {
  const fLatex = extractF(statement)
  const point = extractPoint(statement)
  const vars = varNamesFor(point)
  const pointObj = Object.fromEntries(vars.map((name, i) => [name, point[i]]))
  return numericGradient(fLatex, pointObj, vars)
}

describe('gradient', () => {
  it('tier 1: the claimed gradient matches a central-difference approximation at the stated point', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('gradient').generate(createRng(seed), 1)
      if (p.answer.kind !== 'vector') throw new Error('expected vector answer')
      const expected = numericGradientOf(p.statement)
      const stated = p.answer.components.map(Number)
      expect(stated.length, `seed ${seed}`).toBe(expected.length)
      expected.forEach((e, i) => expect(stated[i], `seed ${seed}: component ${i}`).toBeCloseTo(e, 3))
    }
  })

  it('tier 2: the claimed gradient (chain rule or three-variable) matches a central-difference approximation', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('gradient').generate(createRng(seed), 2)
      if (p.answer.kind !== 'vector') throw new Error('expected vector answer')
      const expected = numericGradientOf(p.statement)
      const stated = p.answer.components.map(Number)
      expect(stated.length, `seed ${seed}`).toBe(expected.length)
      expected.forEach((e, i) => expect(stated[i], `seed ${seed}: component ${i}`).toBeCloseTo(e, 3))
    }
  })

  it('tier 3: the direction of steepest ascent is parallel to the numeric gradient, and the rate equals its length', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('gradient').generate(createRng(seed), 3)
      const expected = numericGradientOf(p.statement)

      if (p.answer.kind === 'vector') {
        const stated = p.answer.components.map(Number)
        expect(parallel(stated, expected), `seed ${seed}: direction should be parallel to ∇f`).toBe(true)
      } else if (p.answer.kind === 'number') {
        const stated = Number(p.answer.value)
        const expectedNorm = Math.sqrt(expected.reduce((sum, v) => sum + v * v, 0))
        expect(stated, `seed ${seed}: rate should equal ||∇f||`).toBeCloseTo(expectedNorm, 3)
      } else {
        throw new Error('expected vector or number answer')
      }
    }
  })
})
