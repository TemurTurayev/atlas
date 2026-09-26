import { describe, expect, it } from 'vitest'
import { evalReal, parseLatex } from '../../checker/ce'
import { createRng } from '../../random/rng'
import { getTemplate } from '../registry'
import { mathSegments } from '../testing'
import { TIERS, type Problem } from '../types'

// Answers recomputed from the statement alone: equations are classified by reading their terms,
// and candidate solutions are checked by differentiating them numerically.

const SEEDS = 30
const H = 1e-5
const T_PROBES = [0.3, 0.8, 1.4]

type Fn = (vars: Record<string, number>) => number

function compile(latex: string): Fn {
  const expr = parseLatex(latex)
  if (!expr) throw new Error(`cannot parse "${latex}"`)
  return (vars) => {
    const v = evalReal(expr, vars)
    if (v === null) throw new Error(`cannot evaluate "${latex}" at ${JSON.stringify(vars)}`)
    return v
  }
}

const numberOf = (latex: string): number => compile(latex)({})
const derivative = (y: (t: number) => number, t: number): number => (y(t + H) - y(t - H)) / (2 * H)

interface OdeTraits {
  readonly order: number
  readonly linear: boolean
  readonly autonomous: boolean
}

/** Reads order, linearity and autonomy straight off the written equation. */
function traits(eq: string): OdeTraits {
  const primes = [...eq.matchAll(/y('+)/g)].map((m) => m[1].length)
  // Nonlinear: y or a derivative raised to a power, or two of them multiplied together.
  const nonlinear = /y'*\^/.test(eq) || /y'*\\,y'/.test(eq) || /y'*\s*y'/.test(eq)
  return { order: Math.max(0, ...primes), linear: !nonlinear, autonomous: !/t/.test(eq) }
}

const ORDER_WORD: Readonly<Record<string, number>> = { first: 1, second: 2, third: 3 }

/** "y' = RHS" as a function of y and t. */
function rhsOf(ode: string): Fn {
  const m = ode.match(/^y' = (.+)$/)
  if (!m) throw new Error(`not of the form y' = …: ${ode}`)
  return compile(m[1].replace(/\\,/g, ''))
}

/** Checks that y(t) solves y' = rhs(y, t) at a few times. */
function expectSolves(y: (t: number) => number, rhs: Fn, times: readonly number[], label: string): void {
  times.forEach((t) => expect(derivative(y, t), `${label} at t=${t}`).toBeCloseTo(rhs({ y: y(t), t }), 3))
}

function run(skillId: string, check: (p: Problem, label: string) => void): void {
  it.each(TIERS)('tier %i: every answer matches an independent recomputation', (tier) => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate(skillId).generate(createRng(seed), tier)
      check(p, `seed ${seed}: ${p.statement}`)
    }
  })
}

describe('ode_classify', () => {
  run('ode_classify', (p, label) => {
    const s = p.statement
    if (p.answer.kind === 'number') {
      expect(Number(p.answer.value), label).toBe(traits(mathSegments(s)[0]).order)
    } else if (p.answer.kind === 'choice' && /^Classify/.test(s)) {
      const t = traits(mathSegments(s)[0])
      expect(p.answer.correctId, label).toBe(`${t.linear ? 'lin' : 'nonlin'}-${t.autonomous ? 'auto' : 'nonauto'}`)
    } else if (p.answer.kind === 'choice') {
      const m = s.match(/is (first|second|third) order, (linear|nonlinear), (autonomous|not autonomous)\?/)
      if (!m) throw new Error(`unrecognised statement: ${s}`)
      const wanted: OdeTraits = { order: ORDER_WORD[m[1]], linear: m[2] === 'linear', autonomous: m[3] === 'autonomous' }
      const fits = (label: string): boolean => {
        const t = traits(mathSegments(label)[0])
        return t.order === wanted.order && t.linear === wanted.linear && t.autonomous === wanted.autonomous
      }
      // Exactly one option has all three properties, and it is the one marked correct.
      const matching = p.answer.options.filter((o) => fits(o.label)).map((o) => o.id)
      expect(matching, label).toEqual([p.answer.correctId])
    } else {
      throw new Error(`unrecognised statement: ${s}`)
    }
  })
})

describe('ode_verify_ivp', () => {
  run('ode_verify_ivp', (p, label) => {
    const s = p.statement
    const [family, ode] = mathSegments(s)
    const y = compile(family.replace(/^y\(t\) = /, '').replace(/\\,/g, ''))
    const rhs = rhsOf(ode)
    if (p.answer.kind === 'choice') {
      const solves = T_PROBES.every((t) => Math.abs(derivative((u) => y({ t: u }), t) - rhs({ y: y({ t }), t })) < 1e-4)
      expect(p.answer.correctId, label).toBe(solves ? 'yes' : 'no')
      return
    }
    if (p.answer.kind !== 'number') throw new Error(`${label}: unexpected answer kind ${p.answer.kind}`)
    // y(0) is affine in C: solve for the C that meets the initial value.
    const y0 = Number(s.match(/y\(0\) = (-?\d+)\$/)?.[1])
    const base = y({ t: 0, C: 0 })
    const slope = y({ t: 0, C: 1 }) - base
    const c = (y0 - base) / slope
    expectSolves((t) => y({ t, C: c }), rhs, T_PROBES, `${label} (family solves the equation)`)
    const later = s.match(/find \$y\((-?\d+)\)\$/)
    const expected = later ? y({ t: Number(later[1]), C: c }) : c
    expect(numberOf(p.answer.value), label).toBeCloseTo(expected, 6)
  })
})

describe('separation', () => {
  run('separation', (p, label) => {
    const s = p.statement
    const segs = mathSegments(s)
    const rhs = rhsOf(segs[0])
    const initial = s.match(/y\((-?\d+)\) = (-?\d+)\$/)
    if (!initial) throw new Error(`unrecognised statement: ${s}`)
    const [t0, y0] = [Number(initial[1]), Number(initial[2])]
    if (p.answer.kind === 'expression') {
      const y = compile(p.answer.value)
      // An equation posed for t > 0 is only checked there, whatever domain the answer declares for sampling.
      const [lo, hi] = /t>0/.test(s) ? [0.5, 2.5] : (p.answer.domain?.t ?? [-1.5, 1.5])
      const times = [0.2, 0.5, 0.8].map((k) => lo + k * (hi - lo))
      expect(y({ t: t0 }), `${label} (initial value)`).toBeCloseTo(y0, 6)
      expectSolves((t) => y({ t }), rhs, times, label)
      return
    }
    if (p.answer.kind !== 'number') throw new Error(`${label}: unexpected answer kind ${p.answer.kind}`)
    const value = numberOf(p.answer.value)
    // Integrate the equation numerically (RK4) from the initial value — no closed form needed.
    const solveTo = (target: number): number => {
      const steps = 4000
      const h = (target - t0) / steps
      let [t, y] = [t0, y0]
      for (let i = 0; i < steps; i += 1) {
        const k1 = rhs({ y, t })
        const k2 = rhs({ y: y + (h / 2) * k1, t: t + h / 2 })
        const k3 = rhs({ y: y + (h / 2) * k2, t: t + h / 2 })
        const k4 = rhs({ y: y + h * k3, t: t + h })
        y += (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4)
        t += h
      }
      return y
    }
    const at = s.match(/Find \$y\((-?\d+)\)\$/)
    if (at) {
      const expected = solveTo(Number(at[1]))
      expect(Math.abs(value - expected) / Math.max(1, Math.abs(expected)), label).toBeLessThan(1e-6)
      return
    }
    const target = segs.find((seg) => seg.startsWith('y(t) = '))
    if (!target) throw new Error(`unrecognised statement: ${s}`)
    // "At what time does y(t) = Y": integrating to the answer must land on Y.
    const y = numberOf(target.slice('y(t) = '.length))
    const reached = solveTo(value)
    expect(Math.abs(reached - y) / Math.max(1e-9, Math.abs(y)), label).toBeLessThan(1e-6)
  })
})
