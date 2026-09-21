import { linear } from '../../math/latex'
import { polyFromRoots, polyToLatex, type Poly } from '../../math/poly'
import { gcd } from '../../math/rational'
import type { Rng } from '../../random/rng'
import type { Problem, SolutionStep, SkillTemplate } from '../types'

const theory = [
  'To factor an expression means to write it as a product.',
  '1. Factor out the common factor: $6x^2 - 9x = 3x(2x - 3)$.',
  '2. Difference of squares: $a^2 - b^2 = (a - b)(a + b)$.',
  '3. Trinomial: $x^2 + bx + c = (x - x_1)(x - x_2)$, where $x_1 + x_2 = -b$ and $x_1 x_2 = c$.',
  'Check by expanding the brackets back. Enter the answer as a product, e.g. (x-2)(x+3).',
].join('\n')

const HINTS = ['Is there a common factor in all the terms?', 'For $x^2 + bx + c$, find two numbers whose sum is $-b$ and whose product is $c$.']
const INPUT_HINT = 'Write the product, e.g. 3x(x-2) or (x-1)(x+4)'

const bracket = (a: number, b: number): string => `\\left(${linear(a, b)}\\right)`

function build(poly: Poly, value: string, solution: readonly SolutionStep[]): Problem {
  const expanded = polyToLatex(poly)
  return {
    statement: `Factor completely: $${expanded}$`,
    answer: { kind: 'expression', value, variables: ['x'], form: 'factored' },
    solution,
    hints: HINTS,
    inputHint: INPUT_HINT,
  }
}

function tier1(rng: Rng): Problem {
  const k = rng.int(2, 6)
  const p = rng.intExcept(-7, 7, [0])
  if (rng.chance(0.6)) {
    const poly = [0, k * p, k]
    const value = `${k}x${bracket(1, p)}`
    return build(poly, value, [{ text: `The common factor is $${k}x$:`, tex: `${polyToLatex(poly)} = ${value}` }])
  }
  const poly = [k * p, k]
  const value = `${k}${bracket(1, p)}`
  return build(poly, value, [{ text: `The common factor is $${k}$:`, tex: `${polyToLatex(poly)} = ${value}` }])
}

function tier2(rng: Rng): Problem {
  const r1 = rng.intExcept(-8, 8, [0])
  const r2 = rng.intExcept(-8, 8, [0, r1])
  const poly = polyFromRoots(1, [r1, r2])
  const value = `${bracket(1, -r1)}${bracket(1, -r2)}`
  return build(poly, value, [
    { text: `Find two numbers with sum $${r1 + r2}$ and product $${r1 * r2}$: these are $${r1}$ and $${r2}$.` },
    { text: 'So:', tex: `${polyToLatex(poly)} = ${value}` },
  ])
}

function tier3(rng: Rng): Problem {
  if (rng.chance(0.5)) {
    const a = rng.int(1, 5)
    const b = rng.intExcept(1, 9, [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((n) => gcd(n, a) !== 1))
    const poly = [-b * b, 0, a * a]
    const value = `${bracket(a, -b)}${bracket(a, b)}`
    return build(poly, value, [
      { text: `Difference of squares: $${polyToLatex(poly)} = (${linear(a, 0)})^2 - ${b}^2$.` },
      { text: 'Using the formula $a^2 - b^2 = (a-b)(a+b)$:', tex: value },
    ])
  }
  const k = rng.pick([2, 3, 5])
  const r1 = rng.intExcept(-6, 6, [0])
  const r2 = rng.intExcept(-6, 6, [0, r1])
  const poly = polyFromRoots(k, [r1, r2])
  const inner = polyFromRoots(1, [r1, r2])
  const value = `${k}${bracket(1, -r1)}${bracket(1, -r2)}`
  return build(poly, value, [
    { text: `Factor out the common factor $${k}$:`, tex: `${k}\\left(${polyToLatex(inner)}\\right)` },
    { text: `Numbers with sum $${r1 + r2}$ and product $${r1 * r2}$ are $${r1}$ and $${r2}$:`, tex: value },
  ])
}

export const template: SkillTemplate = {
  skillId: 'factor',
  theory,
  expectedSeconds: { 1: 45, 2: 90, 3: 120 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
