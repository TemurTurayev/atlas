import { linear } from '../../math/latex'
import { polyMul, polyToLatex, type Poly } from '../../math/poly'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'Algebraic fraction: a ratio of polynomials $\\dfrac{P(x)}{Q(x)}$.',
  'The domain excludes values of $x$ that make the denominator zero.',
  'To simplify a fraction, factor the numerator and denominator and cancel the common factors.',
  'To add fractions with different denominators, rewrite them over a common denominator.',
  'Common mistake: canceling individual terms instead of common factors.',
].join('\n')

const HINTS = [
  'Factor the numerator and denominator before canceling.',
  'When adding or subtracting fractions, rewrite them over a common denominator.',
]
const INPUT_HINT = 'Enter the fraction using /, e.g. (x-1)/x'
const DOMAIN = { x: [1.5, 4] as const }

function tier1(rng: Rng): Problem {
  const b = rng.intExcept(-30, 30, [0])
  const numerator: Poly = [-(b * b), 0, 1]
  const statement = `\\frac{${polyToLatex(numerator)}}{${linear(1, b)}}`
  return {
    statement: `Simplify: $${statement}$`,
    answer: { kind: 'expression', value: linear(1, -b), variables: ['x'], domain: DOMAIN },
    solution: [
      { text: 'Factor the numerator as a difference of squares:', tex: `${polyToLatex(numerator)} = ${linear(1, -b)}\\left(${linear(1, b)}\\right)` },
      { text: 'Cancel the common factor:', tex: `\\frac{${linear(1, -b)}\\left(${linear(1, b)}\\right)}{${linear(1, b)}} = ${linear(1, -b)}` },
    ],
    hints: HINTS,
    inputHint: INPUT_HINT,
  }
}

function tier2(rng: Rng): Problem {
  const b = rng.intExcept(-30, 30, [0])
  const numerator: Poly = [-(b * b), 0, 1]
  const denominator: Poly = [0, b, 1]
  const statement = `\\frac{${polyToLatex(numerator)}}{${polyToLatex(denominator)}}`
  const answer = `\\frac{${linear(1, -b)}}{x}`
  return {
    statement: `Simplify: $${statement}$`,
    answer: { kind: 'expression', value: answer, variables: ['x'], domain: DOMAIN },
    solution: [
      { text: 'Factor the numerator and denominator:', tex: `\\frac{\\left(${linear(1, -b)}\\right)\\left(${linear(1, b)}\\right)}{x\\left(${linear(1, b)}\\right)}` },
      { text: 'Cancel the common factor:', tex: answer },
    ],
    hints: HINTS,
    inputHint: INPUT_HINT,
  }
}

function tier3(rng: Rng): Problem {
  const pool = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  const [p, q] = rng.shuffle(pool).slice(0, 2)
  const lo = Math.min(p, q)
  const hi = Math.max(p, q)
  const denominator = polyMul([lo, 1], [hi, 1])
  const sum = rng.chance(0.5)
  const statement = `\\frac{1}{${linear(1, lo)}} ${sum ? '+' : '-'} \\frac{1}{${linear(1, hi)}}`
  const numerator: Poly = sum ? [lo + hi, 2] : [hi - lo]
  const value = `\\frac{${polyToLatex(numerator)}}{${polyToLatex(denominator)}}`
  return {
    statement: `Combine into a single fraction: $${statement}$`,
    answer: { kind: 'expression', value, variables: ['x'], domain: DOMAIN },
    solution: [
      { text: 'The common denominator is the product of both:', tex: `${linear(1, lo)}\\cdot ${linear(1, hi)} = ${polyToLatex(denominator)}` },
      {
        text: sum ? 'Rewrite each fraction over the common denominator and add the numerators:' : 'Rewrite each fraction over the common denominator and subtract the numerators:',
        tex: value,
      },
    ],
    hints: HINTS,
    inputHint: INPUT_HINT,
  }
}

export const template: SkillTemplate = {
  skillId: 'alg_fractions',
  theory,
  expectedSeconds: { 1: 50, 2: 90, 3: 150 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
