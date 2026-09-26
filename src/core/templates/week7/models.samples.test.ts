import { describe, expect, it } from 'vitest'
import { evalReal, parseLatex } from '../../checker/ce'
import { createRng } from '../../random/rng'
import { getTemplate } from '../registry'

const SEEDS = 30

/** Numeric value of a LaTeX answer, however it is written (fraction, ln, e, ...). */
function numberValue(latex: string): number {
  const expr = parseLatex(latex)
  const v = expr && evalReal(expr)
  if (v === null || v === undefined) throw new Error(`cannot evaluate "${latex}"`)
  return v
}

function matchOrThrow(statement: string, re: RegExp): RegExpMatchArray {
  const m = statement.match(re)
  if (!m) throw new Error(`statement did not match ${re}: ${statement}`)
  return m
}

/** RK4 step for the logistic equation y' = r*y*(1 - y/K), integrated from t=0 to t=T. */
function integrateLogistic(y0: number, r: number, K: number, T: number, steps = 4000): number {
  const deriv = (y: number): number => r * y * (1 - y / K)
  const h = T / steps
  let y = y0
  for (let i = 0; i < steps; i += 1) {
    const k1 = deriv(y)
    const k2 = deriv(y + (h / 2) * k1)
    const k3 = deriv(y + (h / 2) * k2)
    const k4 = deriv(y + h * k3)
    y += (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4)
  }
  return y
}

describe('exp_model', () => {
  it('tier 1: amount at a time (e^{kt}) or k from two measurements, checked by plain arithmetic', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('exp_model').generate(createRng(seed), 1)
      if (p.answer.kind !== 'number') throw new Error(`seed ${seed}: expected a number answer`)

      if (/Find \$k\$/.test(p.statement)) {
        const m = matchOrThrow(p.statement, /y\(0\) = (\d+)\$ and equals \$(\d+)\$ at \$t = (\d+)\$/)
        const [, y0Raw, y1Raw, t1Raw] = m
        const y0 = Number(y0Raw)
        const y1 = Number(y1Raw)
        const t1 = Number(t1Raw)
        const expected = Math.log(y1 / y0) / t1
        expect(numberValue(p.answer.value), `seed ${seed}`).toBeCloseTo(expected, 9)
      } else {
        const m = matchOrThrow(p.statement, /y\(0\) = (\d+)\$ and \$k = ([^$]+)\$ per hour\. Find \$y\((-?\d+)\)\$/)
        const [, aRaw, kLatex, tRaw] = m
        const A = Number(aRaw)
        const k = numberValue(kLatex)
        const t = Number(tRaw)
        const expected = A * Math.exp(k * t)
        expect(numberValue(p.answer.value), `seed ${seed}`).toBeCloseTo(expected, 6)
      }
    }
  })

  it('tier 2: half-life / doubling time in both directions, checked against ln(2)', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('exp_model').generate(createRng(seed), 2)
      if (p.answer.kind !== 'number') throw new Error(`seed ${seed}: expected a number answer`)
      const value = numberValue(p.answer.value)

      if (/Find its half-life/.test(p.statement)) {
        const [, nRaw] = matchOrThrow(p.statement, /k = -\\dfrac\{1\}\{(\d+)\}\$ per year/)
        expect(value, `seed ${seed}`).toBeCloseTo(Number(nRaw) * Math.log(2), 9)
      } else if (/Find the rate constant \$k\$.*1\/hour/.test(p.statement)) {
        const [, hRaw] = matchOrThrow(p.statement, /half-life of (\d+) hours\. Find the rate constant/)
        expect(value, `seed ${seed}`).toBeCloseTo(-Math.log(2) / Number(hRaw), 9)
      } else if (/Find its doubling time/.test(p.statement)) {
        const [, nRaw] = matchOrThrow(p.statement, /k = \\dfrac\{1\}\{(\d+)\}\$ per hour/)
        expect(value, `seed ${seed}`).toBeCloseTo(Number(nRaw) * Math.log(2), 9)
      } else if (/Find the rate constant \$k\$.*1\/day/.test(p.statement)) {
        const [, dRaw] = matchOrThrow(p.statement, /doubles every (\d+) days\. Find the rate constant/)
        expect(value, `seed ${seed}`).toBeCloseTo(Math.log(2) / Number(dRaw), 9)
      } else {
        throw new Error(`seed ${seed}: unrecognised tier-2 statement: ${p.statement}`)
      }
    }
  })

  it('tier 3: two-step word problems, checked by plain arithmetic', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('exp_model').generate(createRng(seed), 3)
      if (p.answer.kind !== 'number') throw new Error(`seed ${seed}: expected a number answer`)
      const value = Number(p.answer.value)

      if (/How many mg remain/.test(p.statement)) {
        const [, periodRaw, c0Raw, daysRaw] = matchOrThrow(
          p.statement,
          /half-life of (\d+) hours\. A patient takes a dose of (\d+) mg\. How many mg remain after (\d+) days?/,
        )
        const period = Number(periodRaw)
        const C0 = Number(c0Raw)
        const days = Number(daysRaw)
        const n = (days * 24) / period
        expect(Number.isInteger(n), `seed ${seed}: expected a whole number of half-lives`).toBe(true)
        expect(value, `seed ${seed}`).toBeCloseTo(C0 / 2 ** n, 9)
      } else if (/drop to/.test(p.statement)) {
        const [, hRaw, rRaw] = matchOrThrow(p.statement, /half-life of (\d+) hours\. How many hours does it take for the concentration to drop to \$\\frac\{1\}\{(\d+)\}\$/)
        const h = Number(hRaw)
        const R = Number(rRaw)
        const n = Math.log2(R)
        expect(Number.isInteger(n), `seed ${seed}: expected R to be a power of two`).toBe(true)
        expect(value, `seed ${seed}`).toBeCloseTo(n * h, 9)
      } else if (/unchecked phase of an outbreak/.test(p.statement)) {
        const [, periodRaw, p0Raw, daysRaw] = matchOrThrow(
          p.statement,
          /doubles every (\d+) hours\. It starts at (\d+) cases\. How many cases are there after (\d+) days?/,
        )
        const period = Number(periodRaw)
        const P0 = Number(p0Raw)
        const days = Number(daysRaw)
        const n = (days * 24) / period
        expect(Number.isInteger(n), `seed ${seed}: expected a whole number of doublings`).toBe(true)
        expect(value, `seed ${seed}`).toBeCloseTo(P0 * 2 ** n, 9)
      } else {
        throw new Error(`seed ${seed}: unrecognised tier-3 statement: ${p.statement}`)
      }
    }
  })
})

describe('logistic_model', () => {
  it('tier 1: reading K/r off the equation, or evaluating y\' at a given y, checked by plain arithmetic', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('logistic_model').generate(createRng(seed), 1)
      if (p.answer.kind !== 'number') throw new Error(`seed ${seed}: expected a number answer`)
      const value = numberValue(p.answer.value)

      if (/What is its/.test(p.statement)) {
        const [, nRaw, kRaw, which] = matchOrThrow(
          p.statement,
          /y' = \\frac\{1\}\{(\d+)\}y\\left\(1-\\dfrac\{y\}\{(\d+)\}\\right\)\$\. What is its (carrying capacity|intrinsic growth rate)/,
        )
        const n = Number(nRaw)
        const K = Number(kRaw)
        const expected = which === 'carrying capacity' ? K : 1 / n
        expect(value, `seed ${seed}`).toBeCloseTo(expected, 9)
      } else {
        const [, nRaw, kRaw, yRaw] = matchOrThrow(
          p.statement,
          /y' = \\frac\{1\}\{(\d+)\}y\\left\(1-\\dfrac\{y\}\{(\d+)\}\\right\)\$, find \$y'\$ when \$y=(\d+(?:\.\d+)?)\$/,
        )
        const n = Number(nRaw)
        const K = Number(kRaw)
        const y = Number(yRaw)
        const expected = (1 / n) * y * (1 - y / K)
        expect(value, `seed ${seed}`).toBeCloseTo(expected, 6)
      }
    }
  })

  it('tier 2: fastest growth is at y=K/2, and the largest rate there is rK/4', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('logistic_model').generate(createRng(seed), 2)
      if (p.answer.kind !== 'number') throw new Error(`seed ${seed}: expected a number answer`)
      const value = numberValue(p.answer.value)
      const [, nRaw, kRaw] = matchOrThrow(p.statement, /y' = \\frac\{1\}\{(\d+)\}y\\left\(1-\\dfrac\{y\}\{(\d+)\}\\right\)\$\. (?:At what population|What is the largest value)/)
      const n = Number(nRaw)
      const K = Number(kRaw)

      if (/At what population/.test(p.statement)) {
        expect(value, `seed ${seed}`).toBeCloseTo(K / 2, 9)
      } else if (/What is the largest value/.test(p.statement)) {
        const r = 1 / n
        expect(value, `seed ${seed}`).toBeCloseTo((r * K) / 4, 9)
      } else {
        throw new Error(`seed ${seed}: unrecognised tier-2 statement: ${p.statement}`)
      }
    }
  })

  it('tier 3: the logistic solution, verified by numerically integrating y\' = ry(1-y/K)', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('logistic_model').generate(createRng(seed), 3)
      if (p.answer.kind !== 'number') throw new Error(`seed ${seed}: expected a number answer`)
      const value = numberValue(p.answer.value)

      if (/Find the population after/.test(p.statement)) {
        const m = matchOrThrow(
          p.statement,
          /carrying capacity of \$K=(\d+)\$, starting at \$y\(0\)=(\d+)\$, with intrinsic rate \$r=\\dfrac\{\\ln (\d+)\}\{(\d+)\}\$ per day\. Find the population after (\d+) days\./,
        )
        const [, kRaw, y0Raw, mRaw, tDenomRaw, tDaysRaw] = m
        const K = Number(kRaw)
        const y0 = Number(y0Raw)
        const mVal = Number(mRaw)
        const tDenom = Number(tDenomRaw)
        const tDays = Number(tDaysRaw)
        expect(tDenom, `seed ${seed}: the two elapsed times must match`).toBe(tDays)
        const r = Math.log(mVal) / tDenom
        const simulated = integrateLogistic(y0, r, K, tDays)
        expect(value, `seed ${seed}`).toBeCloseTo(simulated, 2)
      } else if (/After how many days/.test(p.statement)) {
        const m = matchOrThrow(
          p.statement,
          /carrying capacity \$K=(\d+)\$, starts at \$y\(0\)=(\d+)\$, and has intrinsic rate \$r=\\dfrac\{1\}\{(\d+)\}\$ per day\. After how many days does the population reach (\d+) /,
        )
        const [, kRaw, y0Raw, nRaw, targetRaw] = m
        const K = Number(kRaw)
        const y0 = Number(y0Raw)
        const n = Number(nRaw)
        const target = Number(targetRaw)
        const r = 1 / n
        const claimedT = value
        const simulated = integrateLogistic(y0, r, K, claimedT)
        expect(simulated, `seed ${seed}`).toBeCloseTo(target, 1)
      } else {
        throw new Error(`seed ${seed}: unrecognised tier-3 statement: ${p.statement}`)
      }
    }
  })
})
