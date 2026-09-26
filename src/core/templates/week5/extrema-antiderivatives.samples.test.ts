import { describe, expect, it } from 'vitest'
import { evalReal, parseLatex, type Expr } from '../../checker/ce'
import { createRng } from '../../random/rng'
import { getTemplate } from '../registry'

const SEEDS = 30

function numberValue(latex: string): number {
  const expr = parseLatex(latex)
  const v = expr && evalReal(expr)
  if (v === null || v === undefined) throw new Error(`cannot evaluate "${latex}"`)
  return v
}

function mustParse(latex: string, context: string): Expr {
  const expr = parseLatex(latex)
  if (!expr) throw new Error(`could not parse "${latex}" (${context})`)
  return expr
}

/** Central-difference derivative of a single-variable expression at x. */
function numericDerivative(expr: Expr, x: number, h = 1e-3): number {
  const plus = evalReal(expr, { x: x + h })
  const minus = evalReal(expr, { x: x - h })
  if (plus === null || minus === null) throw new Error(`numericDerivative: undefined near x=${x}`)
  return (plus - minus) / (2 * h)
}

/** Central-difference second derivative of a single-variable expression at x. */
function numericSecondDerivative(expr: Expr, x: number, h = 1e-2): number {
  const plus = evalReal(expr, { x: x + h })
  const mid = evalReal(expr, { x })
  const minus = evalReal(expr, { x: x - h })
  if (plus === null || mid === null || minus === null) throw new Error(`numericSecondDerivative: undefined near x=${x}`)
  return (plus - 2 * mid + minus) / (h * h)
}

/** Plain trapezoidal rule; used to check a claimed F(target) against b + integral of f from a to target. */
function integrateNumerically(f: (x: number) => number, from: number, to: number, steps = 4000): number {
  const h = (to - from) / steps
  let sum = 0.5 * (f(from) + f(to))
  for (let i = 1; i < steps; i += 1) sum += f(from + i * h)
  return sum * h
}

/** The "$f(x) = ...$" formula that every extrema_1d statement carries. */
function extractFunction(statement: string): string {
  const match = statement.match(/f\(x\) = ([^$]+)\$/)
  if (!match) throw new Error(`no f(x) found in: ${statement}`)
  return match[1]
}

// A handful of non-integer, non-zero sample points — safe for the plain polynomials used by
// extrema_1d and by antiderivatives tiers 1 and 3, which have no domain restriction.
const POLY_SAMPLE_POINTS = [-2.7, -1.3, 0.6, 1.4, 2.8]

describe('extrema_1d', () => {
  it('tier 1: every claimed critical point makes the numerical derivative of f vanish', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('extrema_1d').generate(createRng(seed), 1)
      if (p.answer.kind !== 'numberSet') throw new Error(`seed ${seed}: expected a numberSet answer`)
      expect(p.answer.values.length, `seed ${seed}`).toBeGreaterThan(0)
      const f = mustParse(extractFunction(p.statement), `seed ${seed}`)
      for (const raw of p.answer.values) {
        const x = numberValue(raw)
        expect(Math.abs(numericDerivative(f, x)), `seed ${seed}, x=${x}`).toBeLessThan(0.05)
      }
    }
  })

  it('tier 2: the classification matches the sign of f\'\', and the interval maximum matches a dense scan', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('extrema_1d').generate(createRng(seed), 2)
      const f = mustParse(extractFunction(p.statement), `seed ${seed}`)

      if (p.answer.kind === 'choice') {
        const match = p.statement.match(/x = (-?\d+)\$ is a critical point/)
        if (!match) throw new Error(`seed ${seed}: no stated critical point in: ${p.statement}`)
        const x = Number(match[1])
        const secondDeriv = numericSecondDerivative(f, x)
        const expected = secondDeriv < 0 ? 'local maximum' : 'local minimum'
        expect(Math.abs(secondDeriv), `seed ${seed}: f'' should be clearly nonzero`).toBeGreaterThan(0.1)
        expect(p.answer.correctId, `seed ${seed}`).toBe(expected)
      } else if (p.answer.kind === 'number') {
        const match = p.statement.match(/\[(-?\d+), (-?\d+)\]/)
        if (!match) throw new Error(`seed ${seed}: no interval in: ${p.statement}`)
        const lo = Number(match[1])
        const hi = Number(match[2])
        const steps = 4000
        let scanMax = -Infinity
        for (let i = 0; i <= steps; i += 1) {
          const x = lo + ((hi - lo) * i) / steps
          const v = evalReal(f, { x })
          if (v !== null) scanMax = Math.max(scanMax, v)
        }
        expect(scanMax, `seed ${seed}`).toBeGreaterThan(-Infinity)
        expect(Number(p.answer.value), `seed ${seed}`).toBeCloseTo(scanMax, 0)
      } else {
        throw new Error(`seed ${seed}: expected a choice or number answer`)
      }
    }
  })

  it('tier 3: the optimum independently satisfies the calculus test (dense scan, or C\'=0)', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('extrema_1d').generate(createRng(seed), 3)
      if (p.answer.kind !== 'number') throw new Error(`seed ${seed}: expected a number answer`)
      const perimeterMatch = p.statement.match(/using (\d+) metres/)
      const doseMatch = p.statement.match(/C\(d\) = (-?\d+)d \+ \\dfrac\{(-?\d+)\}\{d\}/)

      if (perimeterMatch) {
        const perimeter = Number(perimeterMatch[1])
        const steps = 4000
        let scanMax = -Infinity
        for (let i = 1; i < steps; i += 1) {
          const x = (perimeter / 2) * (i / steps)
          scanMax = Math.max(scanMax, x * (perimeter / 2 - x))
        }
        expect(Number(p.answer.value), `seed ${seed}`).toBeCloseTo(scanMax, 0)
      } else if (doseMatch) {
        const aCoef = Number(doseMatch[1])
        const bCoef = Number(doseMatch[2])
        const d0 = Number(p.answer.value)
        const cost = (d: number): number => aCoef * d + bCoef / d
        const h = 1e-4
        const derivative = (cost(d0 + h) - cost(d0 - h)) / (2 * h)
        expect(Math.abs(derivative), `seed ${seed}: C'(d0) should vanish`).toBeLessThan(0.01)
        expect(cost(d0), `seed ${seed}: d0 should beat nearby doses`).toBeLessThan(cost(d0 + 0.5))
        expect(cost(d0), `seed ${seed}: d0 should beat nearby doses`).toBeLessThan(cost(Math.max(0.1, d0 - 0.5)))
      } else {
        throw new Error(`seed ${seed}: unrecognised tier-3 statement: ${p.statement}`)
      }
    }
  })
})

describe('antiderivatives', () => {
  it('tier 1: the stated antiderivative differentiates back to the integrand', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('antiderivatives').generate(createRng(seed), 1)
      if (p.answer.kind !== 'expression') throw new Error(`seed ${seed}: expected an expression answer`)
      expect(p.answer.upToConstant, `seed ${seed}`).toBe(true)
      const match = p.statement.match(/\\int \\left\(([\s\S]+?)\\right\) dx\$/)
      if (!match) throw new Error(`seed ${seed}: could not find the integrand in: ${p.statement}`)
      const f = mustParse(match[1], `seed ${seed}: integrand`)
      const bigF = mustParse(p.answer.value, `seed ${seed}: antiderivative`)
      for (const x of POLY_SAMPLE_POINTS) {
        const derivative = numericDerivative(bigF, x)
        const fx = evalReal(f, { x })
        if (fx === null) continue
        expect(derivative, `seed ${seed}, x=${x}`).toBeCloseTo(fx, 2)
      }
    }
  })

  it('tier 2: the standard antiderivative differentiates back to the integrand, inside its domain', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('antiderivatives').generate(createRng(seed), 2)
      if (p.answer.kind !== 'expression') throw new Error(`seed ${seed}: expected an expression answer`)
      expect(p.answer.upToConstant, `seed ${seed}`).toBe(true)
      const match = p.statement.match(/\\int ([\s\S]+?)\\,dx\$/)
      if (!match) throw new Error(`seed ${seed}: could not find the integrand in: ${p.statement}`)
      const f = mustParse(match[1], `seed ${seed}: integrand`)
      const bigF = mustParse(p.answer.value, `seed ${seed}: antiderivative`)
      const [lo, hi] = p.answer.domain?.x ?? [-3, 3]
      for (const t of [0.2, 0.4, 0.6, 0.8]) {
        const x = lo + t * (hi - lo)
        const derivative = numericDerivative(bigF, x)
        const fx = evalReal(f, { x })
        if (fx === null) continue
        expect(derivative, `seed ${seed}, x=${x}`).toBeCloseTo(fx, 2)
      }
    }
  })

  it('tier 3: the pinned antiderivative satisfies both F\'=f and the given condition', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('antiderivatives').generate(createRng(seed), 3)
      const fMatch = p.statement.match(/F'\(x\) = ([\s\S]+?)\$ and/)
      const conditionMatch = p.statement.match(/F\((-?\d+)\) = (-?\d+)/)
      if (!fMatch || !conditionMatch) throw new Error(`seed ${seed}: could not parse the condition from: ${p.statement}`)
      const f = mustParse(fMatch[1], `seed ${seed}: integrand`)
      const a = Number(conditionMatch[1])
      const b = Number(conditionMatch[2])

      if (p.answer.kind === 'expression') {
        expect(p.answer.upToConstant, `seed ${seed}`).not.toBe(true)
        const bigF = mustParse(p.answer.value, `seed ${seed}: antiderivative`)
        for (const x of POLY_SAMPLE_POINTS) {
          const derivative = numericDerivative(bigF, x)
          const fx = evalReal(f, { x })
          if (fx === null) continue
          expect(derivative, `seed ${seed}, x=${x}`).toBeCloseTo(fx, 2)
        }
        const atA = evalReal(bigF, { x: a })
        if (atA === null) throw new Error(`seed ${seed}: F(${a}) is undefined`)
        expect(atA, `seed ${seed}: F(${a}) should equal ${b}`).toBeCloseTo(b, 6)
      } else if (p.answer.kind === 'number') {
        const pointMatch = p.statement.match(/Find \$F\((-?\d+)\)\$/)
        if (!pointMatch) throw new Error(`seed ${seed}: could not find the evaluation point in: ${p.statement}`)
        const target = Number(pointMatch[1])
        const integral = integrateNumerically((x) => evalReal(f, { x }) ?? 0, a, target)
        const expected = b + integral
        expect(Number(p.answer.value), `seed ${seed}`).toBeCloseTo(expected, 2)
      } else {
        throw new Error(`seed ${seed}: expected an expression or number answer`)
      }
    }
  })
})
