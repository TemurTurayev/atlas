import { describe, expect, it } from 'vitest'
import { evalReal, parseLatex } from '../../checker/ce'
import { createRng } from '../../random/rng'
import { build1 as chainBuild1, build2 as chainBuild2, build3 as chainBuild3, type Built as ChainBuilt } from './chain_rule'
import { build1 as pqBuild1, build2 as pqBuild2, build3 as pqBuild3, type Built as PqBuilt } from './product_quotient'

const SEEDS = 30

/** Central difference: an independent numerical estimate of f'(x), built without using any of the
 *  derivative-rule logic under test. */
function centralDiff(f: (x: number) => number, x: number, h = 1e-4): number {
  return (f(x + h) - f(x - h)) / (2 * h)
}

const closeEnough = (a: number, b: number, tol = 5e-3): boolean => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b))

// Fractions deliberately avoid landing near an integer, so a test point never lands on an "avoid"
// point (poles, roots, etc. in this file are always at integers).
const FRACTIONS = [0.12, 0.27, 0.41, 0.58, 0.73, 0.88]

function samplePoints(range: readonly [number, number], avoid: readonly number[] = []): number[] {
  const [lo, hi] = range
  return FRACTIONS.map((t) => lo + t * (hi - lo)).filter((x) => avoid.every((a) => Math.abs(x - a) > 0.15))
}

function numberValue(latex: string): number {
  const expr = parseLatex(latex)
  const v = expr && evalReal(expr)
  if (v === null || v === undefined) throw new Error(`cannot evaluate ${latex}`)
  return v
}

/** Checks an `expression`-kind answer: the stated derivative must match a central difference of the
 *  raw, independently-evaluated function at several points inside its valid domain. */
function checkExpressionAnswer(built: PqBuilt | ChainBuilt, label: string): void {
  const { problem, f } = built
  const avoid = 'avoid' in built ? (built.avoid ?? []) : []
  if (problem.answer.kind !== 'expression') throw new Error(`${label}: expected an expression answer`)
  const domain = problem.answer.domain?.x ?? [-3, 3]
  const stated = parseLatex(problem.answer.value)
  if (!stated) throw new Error(`${label}: unparsable reference "${problem.answer.value}"`)
  const points = samplePoints(domain, avoid)
  expect(points.length, `${label}: not enough sample points left after avoiding singularities`).toBeGreaterThan(2)
  for (const x of points) {
    const numeric = centralDiff(f, x)
    const stateAt = evalReal(stated, { x })
    expect(stateAt, `${label} at x=${x}: reference did not evaluate`).not.toBeNull()
    expect(closeEnough(numeric, stateAt as number), `${label} at x=${x}: central diff ${numeric} vs stated ${stateAt}`).toBe(true)
  }
}

/** Checks a `number`-kind answer (derivative evaluated at one point) the same way. */
function checkNumberAnswer(built: PqBuilt | ChainBuilt, label: string): void {
  const { problem, f, x0 } = built
  if (problem.answer.kind !== 'number') throw new Error(`${label}: expected a number answer`)
  if (x0 === undefined) throw new Error(`${label}: point-evaluation branch did not report x0`)
  const numeric = centralDiff(f, x0)
  const stated = numberValue(problem.answer.value)
  expect(closeEnough(numeric, stated), `${label}: central diff ${numeric} vs stated ${stated}`).toBe(true)
}

function checkBuilt(built: PqBuilt | ChainBuilt, label: string): void {
  if (built.problem.answer.kind === 'number') checkNumberAnswer(built, label)
  else checkExpressionAnswer(built, label)
}

describe('product_quotient: reference derivative matches a numerical derivative', () => {
  it('tier 1: product rule', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) checkBuilt(pqBuild1(createRng(seed)), `seed ${seed}`)
  })

  it('tier 2: quotient rule', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) checkBuilt(pqBuild2(createRng(seed)), `seed ${seed}`)
  })

  it('tier 3: point evaluation, three factors, or a simplifying quotient', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) checkBuilt(pqBuild3(createRng(seed)), `seed ${seed}`)
  })
})

describe('chain_rule: reference derivative matches a numerical derivative', () => {
  it('tier 1: outer power of a linear or quadratic inner function', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) checkBuilt(chainBuild1(createRng(seed)), `seed ${seed}`)
  })

  it('tier 2: exponential, logarithm, or sine of a linear inner function', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) checkBuilt(chainBuild2(createRng(seed)), `seed ${seed}`)
  })

  it('tier 3: nested chain rule, chain inside a product, or evaluated at a point', () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) checkBuilt(chainBuild3(createRng(seed)), `seed ${seed}`)
  })
})
