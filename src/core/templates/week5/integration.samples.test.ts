import { describe, expect, it } from 'vitest'
import { evalReal, parseLatex, type Expr } from '../../checker/ce'
import { createRng } from '../../random/rng'
import { getTemplate } from '../registry'

const SEEDS = 25

/** Relative-tolerance closeness for numbers produced by finite-difference calculus, not exact arithmetic. */
function expectClose(actual: number, expected: number, label: string): void {
  const ok = Math.abs(actual - expected) <= 0.01 * Math.max(Math.abs(expected), 1) + 1e-4
  expect(ok, `${label}: expected ${expected}, got ${actual}`).toBe(true)
}

function mustParse(latex: string): Expr {
  const expr = parseLatex(latex)
  if (!expr) throw new Error(`could not parse "${latex}"`)
  return expr
}

function evalAt(expr: Expr, x: number): number {
  const v = evalReal(expr, { x })
  if (v === null) throw new Error(`expression undefined at x=${x}`)
  return v
}

function numberValue(latex: string): number {
  return evalAt(mustParse(latex), 0) // constant, "x" never appears
}

/** Central-difference derivative of a parsed expression at x. */
function derivativeAt(expr: Expr, x: number, h = 1e-4): number {
  return (evalAt(expr, x + h) - evalAt(expr, x - h)) / (2 * h)
}

/** Composite Simpson's rule for f over [a, b] with n (even) subintervals. */
function simpson(f: (x: number) => number, a: number, b: number, n = 800): number {
  const steps = n % 2 === 0 ? n : n + 1
  const h = (b - a) / steps
  let total = f(a) + f(b)
  for (let i = 1; i < steps; i += 1) {
    const x = a + i * h
    total += f(x) * (i % 2 === 0 ? 2 : 4)
  }
  return (total * h) / 3
}

/** Bisection root-finder: scans [from, to] for sign changes of f and refines each one. */
function findRoots(f: (x: number) => number, from: number, to: number, steps = 6000): number[] {
  const roots: number[] = []
  // An irrational-ish step avoids landing exactly on an integer root, where prev*cur would be
  // exactly 0 (not negative) and a sign change could be missed entirely.
  const dx = (to - from) / (steps + 0.37)
  let prevX = from
  let prev = f(prevX)
  for (let i = 1; i <= steps; i += 1) {
    const x = from + i * dx
    const cur = f(x)
    if (cur === 0) {
      roots.push(x)
    } else if (prev * cur < 0) {
      let lo = prevX
      let hi = x
      for (let iter = 0; iter < 60; iter += 1) {
        const mid = (lo + hi) / 2
        if (f(lo) * f(mid) <= 0) hi = mid
        else lo = mid
      }
      roots.push((lo + hi) / 2)
    }
    prevX = x
    prev = cur
  }
  return roots
}

/** Verifies a claimed antiderivative (an ExpressionSpec's `value`, without "+ C") differentiates back to `integrandLatex`. */
function checkAntiderivative(answerValue: string, integrandLatex: string, points: readonly number[], label: string): void {
  const answer = mustParse(answerValue)
  const integrand = mustParse(integrandLatex)
  for (const x of points) {
    expectClose(derivativeAt(answer, x), evalAt(integrand, x), `${label}, x=${x}`)
  }
}

/** Verifies a stated definite-integral value against Simpson's rule applied to the integrand, from scratch. */
function checkDefiniteIntegral(statedLatex: string, integrandLatex: string, lo: number, hi: number, label: string): void {
  const integrand = mustParse(integrandLatex)
  const stated = numberValue(statedLatex)
  const numeric = simpson((x) => evalAt(integrand, x), lo, hi)
  expectClose(stated, numeric, label)
}

const boundValue = (raw: string): number => evalAt(mustParse(raw), 0)

/** Pulls "\int INTEGRAND\,dx" (no limits) out of a statement. */
function extractIndefinite(statement: string): string {
  const m = statement.match(/\\int ([\s\S]+?)\\,dx/)
  if (!m) throw new Error(`no indefinite integral found in: ${statement}`)
  return m[1]
}

/** Reads a "{...}" group starting at `openIdx` (which must hold "{"), respecting nested braces
 *  (a bound like "e^{2}" contains its own brace pair, so a non-nested regex would cut it short). */
function readBraced(s: string, openIdx: number): { content: string; end: number } {
  let depth = 0
  for (let i = openIdx; i < s.length; i += 1) {
    if (s[i] === '{') depth += 1
    else if (s[i] === '}') {
      depth -= 1
      if (depth === 0) return { content: s.slice(openIdx + 1, i), end: i + 1 }
    }
  }
  throw new Error(`unbalanced braces from index ${openIdx} in: ${s}`)
}

/** Pulls "\int_{lo}^{hi} INTEGRAND\,dx" out of a statement, tolerating braces nested inside lo/hi. */
function extractDefinite(statement: string): { lo: number; hi: number; integrand: string } {
  const marker = '\\int_{'
  const start = statement.indexOf(marker)
  if (start === -1) throw new Error(`no definite integral found in: ${statement}`)
  const lo = readBraced(statement, start + marker.length - 1)
  if (statement[lo.end] !== '^' || statement[lo.end + 1] !== '{') throw new Error(`expected "^{" after lower bound in: ${statement}`)
  const hi = readBraced(statement, lo.end + 1)
  if (statement[hi.end] !== ' ') throw new Error(`expected a space after the bounds in: ${statement}`)
  const dxIdx = statement.indexOf('\\,dx', hi.end)
  if (dxIdx === -1) throw new Error(`no "\\,dx" found in: ${statement}`)
  return { lo: boundValue(lo.content), hi: boundValue(hi.content), integrand: statement.slice(hi.end + 1, dxIdx) }
}

const extractFofX = (statement: string): string => {
  const m = statement.match(/f\(x\) = ([^$]+)\$/)
  if (!m) throw new Error(`no f(x) found in: ${statement}`)
  return m[1]
}

const extractGofX = (statement: string): string => {
  const m = statement.match(/g\(x\) = ([^$]+)\$/)
  if (!m) throw new Error(`no g(x) found in: ${statement}`)
  return m[1]
}

const extractInterval = (statement: string): [number, number] => {
  const m = statement.match(/\[(-?\d+), (-?\d+)\]/)
  if (!m) throw new Error(`no interval found in: ${statement}`)
  return [Number(m[1]), Number(m[2])]
}

// Sample points safe for every tier1/tier2 subtype of substitution and by_parts (all defined for every real x).
const FULL_DOMAIN_POINTS = [-2.4, -1.3, 0.6, 1.7, 2.5]
// Sample points safe when the answer may involve ln(x) (by_parts tier2), which needs x > 0.
const POSITIVE_POINTS = [0.5, 1.1, 1.8, 2.6]

describe('definite_integral', () => {
  it('tier 1: the stated value matches Simpson integration of the shown polynomial', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('definite_integral').generate(createRng(seed), 1)
      if (p.answer.kind !== 'number') throw new Error('expected number answer')
      const { lo, hi, integrand } = extractDefinite(p.statement)
      checkDefiniteIntegral(p.answer.value, integrand, lo, hi, `seed ${seed}`)
    }
  })

  it('tier 2: the stated area or signed integral matches Simpson integration of the shown line', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('definite_integral').generate(createRng(seed), 2)
      if (p.answer.kind !== 'number') throw new Error('expected number answer')
      const fLatex = extractFofX(p.statement)
      const [lo, hi] = extractInterval(p.statement)
      const f = mustParse(fLatex)
      const askArea = p.statement.includes('total area enclosed')
      const numeric = askArea ? simpson((x) => Math.abs(evalAt(f, x)), lo, hi) : simpson((x) => evalAt(f, x), lo, hi)
      expectClose(numberValue(p.answer.value), numeric, `seed ${seed} (${askArea ? 'area' : 'signed'})`)
    }
  })

  it('tier 3: area-between-curves and standard-function variants both check out, and both occur', () => {
    let sawCurves = false
    let sawStandard = false
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('definite_integral').generate(createRng(seed), 3)
      if (p.answer.kind !== 'number') throw new Error('expected number answer')

      if (p.statement.includes('enclosed between the two curves')) {
        sawCurves = true
        const f = mustParse(extractFofX(p.statement))
        const g = mustParse(extractGofX(p.statement))
        const diff = (x: number): number => evalAt(g, x) - evalAt(f, x)
        const roots = findRoots(diff, -30, 30)
        expect(roots.length, `seed ${seed}: exactly two intersections`).toBe(2)
        const [a, b] = [Math.min(...roots), Math.max(...roots)]
        const numeric = simpson((x) => Math.abs(diff(x)), a, b)
        expectClose(numberValue(p.answer.value), numeric, `seed ${seed} (curves)`)
      } else {
        sawStandard = true
        const { lo, hi, integrand } = extractDefinite(p.statement)
        checkDefiniteIntegral(p.answer.value, integrand, lo, hi, `seed ${seed} (standard)`)
      }
    }
    expect(sawCurves, 'the area-between-curves variant appears').toBe(true)
    expect(sawStandard, 'the standard-function variant appears').toBe(true)
  })
})

describe('substitution', () => {
  it('tier 1: the stated antiderivative differentiates back to the shown integrand', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('substitution').generate(createRng(seed), 1)
      if (p.answer.kind !== 'expression') throw new Error('expected expression answer')
      const integrand = extractIndefinite(p.statement)
      checkAntiderivative(p.answer.value, integrand, FULL_DOMAIN_POINTS, `seed ${seed}`)
    }
  })

  it('tier 2: the stated antiderivative differentiates back to the shown integrand', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('substitution').generate(createRng(seed), 2)
      if (p.answer.kind !== 'expression') throw new Error('expected expression answer')
      const integrand = extractIndefinite(p.statement)
      checkAntiderivative(p.answer.value, integrand, FULL_DOMAIN_POINTS, `seed ${seed}`)
    }
  })

  it('tier 3: the stated value matches Simpson integration of the shown integrand', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('substitution').generate(createRng(seed), 3)
      if (p.answer.kind !== 'number') throw new Error('expected number answer')
      const { lo, hi, integrand } = extractDefinite(p.statement)
      checkDefiniteIntegral(p.answer.value, integrand, lo, hi, `seed ${seed}`)
    }
  })
})

describe('by_parts', () => {
  it('tier 1: the stated antiderivative differentiates back to the shown integrand', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('by_parts').generate(createRng(seed), 1)
      if (p.answer.kind !== 'expression') throw new Error('expected expression answer')
      const integrand = extractIndefinite(p.statement)
      checkAntiderivative(p.answer.value, integrand, FULL_DOMAIN_POINTS, `seed ${seed}`)
    }
  })

  it('tier 2: the stated antiderivative differentiates back to the shown integrand', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('by_parts').generate(createRng(seed), 2)
      if (p.answer.kind !== 'expression') throw new Error('expected expression answer')
      const integrand = extractIndefinite(p.statement)
      // Positive-only points are safe for both the ln(x) subtype (domain x>0) and the x^2 e^{ax} subtype.
      checkAntiderivative(p.answer.value, integrand, POSITIVE_POINTS, `seed ${seed}`)
    }
  })

  it('tier 3: the stated value matches Simpson integration of the shown integrand', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const p = getTemplate('by_parts').generate(createRng(seed), 3)
      if (p.answer.kind !== 'number') throw new Error('expected number answer')
      const { lo, hi, integrand } = extractDefinite(p.statement)
      checkDefiniteIntegral(p.answer.value, integrand, lo, hi, `seed ${seed}`)
    }
  })
})
