import { linear } from '../../math/latex'
import { polyToLatex, type Poly } from '../../math/poly'
import { rat, ratToLatex } from '../../math/rational'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'The limit of a function as $x\\to a$ is the value that $f(x)$ approaches as $x$ approaches $a$, without necessarily reaching it.',
  'Indeterminate form $\\frac{0}{0}$: factor the numerator and denominator and cancel the common factor, only then substitute the point.',
  'The limit of a rational function as $x\\to\\infty$, when the numerator and denominator have equal degree, is the ratio of the leading coefficients.',
  'If there is a radical in the numerator or denominator, multiply the fraction by the conjugate expression to remove the indeterminate form $\\frac00$.',
  'Common mistake: substituting the point right away without noticing the indeterminate form $\\frac00$, and concluding that the limit does not exist.',
].join('\n')

function tier1(rng: Rng): Problem {
  const c = rng.intExcept(-25, 25, [0])
  const c2 = c * c
  const value = 2 * c
  const factorMinus = linear(1, -c)
  const factorPlus = linear(1, c)
  return {
    statement: `Find $\\displaystyle\\lim_{x\\to ${c}}\\frac{x^{2}-${c2}}{${factorMinus}}$.`,
    answer: { kind: 'number', value: String(value) },
    solution: [
      { text: 'The numerator is a difference of squares; factor it:', tex: `x^{2}-${c2} = \\left(${factorMinus}\\right)\\left(${factorPlus}\\right)` },
      { text: `Cancel the common factor $${factorMinus}$ with the denominator and substitute $x=${c}$:`, tex: `\\lim_{x\\to ${c}} \\left(${factorPlus}\\right) = ${value}` },
    ],
    hints: [
      'The numerator is a difference of squares; factor it into two factors.',
      'One of the factors will cancel with the denominator; after canceling, substitute the limit point.',
    ],
  }
}

function tier2(rng: Rng): Problem {
  const a = rng.intExcept(-10, 10, [0])
  const f = rng.intExcept(-10, 10, [0])
  const b = rng.int(-10, 10)
  const e = rng.int(-15, 15)
  const g = rng.int(-10, 10)
  const h = rng.int(-15, 15)
  const numerator: Poly = [e, b, a]
  const denominator: Poly = [h, g, f]
  const numLatex = polyToLatex(numerator)
  const denLatex = polyToLatex(denominator)
  const value = ratToLatex(rat(a, f))
  return {
    statement: `Find $\\displaystyle\\lim_{x\\to\\infty}\\frac{${numLatex}}{${denLatex}}$.`,
    answer: { kind: 'number', value },
    solution: [
      {
        text: 'The numerator and denominator have equal degree — as $x\\to\\infty$ the limit is determined only by the leading coefficients:',
        tex: `\\lim_{x\\to\\infty}\\frac{${numLatex}}{${denLatex}} = \\frac{${a}}{${f}}`,
      },
      { text: 'Compute the ratio of the leading coefficients:', tex: `\\frac{${a}}{${f}} = ${value}` },
    ],
    hints: [
      'Divide the numerator and denominator by $x$ raised to the highest power that appears.',
      'All terms of the form $\\frac{k}{x^{n}}$ tend to zero; only the leading coefficients remain.',
    ],
  }
}

function tier3(rng: Rng): Problem {
  const c = rng.int(2, 40)
  const c2 = c * c
  const value = ratToLatex(rat(1, 2 * c))
  return {
    statement: `Find $\\displaystyle\\lim_{x\\to ${c2}}\\frac{\\sqrt{x}-${c}}{x-${c2}}$.`,
    answer: { kind: 'number', value },
    solution: [
      {
        text: `Multiply the numerator and denominator by the conjugate expression $\\sqrt{x}+${c}$:`,
        tex: `\\frac{\\sqrt{x}-${c}}{x-${c2}}\\cdot\\frac{\\sqrt{x}+${c}}{\\sqrt{x}+${c}} = \\frac{x-${c2}}{\\left(x-${c2}\\right)\\left(\\sqrt{x}+${c}\\right)}`,
      },
      { text: `Cancel the common factor $x-${c2}$:`, tex: `= \\frac{1}{\\sqrt{x}+${c}}` },
      { text: `Substitute $x=${c2}$:`, tex: `\\frac{1}{\\sqrt{${c2}}+${c}} = \\frac{1}{${2 * c}} = ${value}` },
    ],
    hints: [
      'Multiply the numerator and denominator by the conjugate expression to remove the radical.',
      'After canceling the common factor, substitute the limit point directly.',
    ],
  }
}

export const template: SkillTemplate = {
  skillId: 'limits',
  theory,
  expectedSeconds: { 1: 60, 2: 90, 3: 150 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
