import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'The n-th root: $\\sqrt[n]{a^{n}}=a$ for $a\\geq0$; $\\sqrt{a}$ is $\\sqrt[2]{a}$.',
  'A fractional exponent is a root: $a^{\\frac{m}{n}} = \\sqrt[n]{a^{m}} = \\left(\\sqrt[n]{a}\\right)^{m}$.',
  'Product of roots: $\\sqrt{a}\\cdot\\sqrt{b}=\\sqrt{ab}$; $\\left(\\sqrt{a}\\right)^{2}=a$.',
  'Rationalizing a root in the denominator: $\\dfrac{1}{\\sqrt{a}}=\\dfrac{\\sqrt{a}}{a}$.',
  'Common mistakes: assuming $\\sqrt{a+b}=\\sqrt{a}+\\sqrt{b}$ (this is false); confusing $\\sqrt[3]{a}$ with $\\sqrt{a}$.',
].join('\n')

const HINTS_BASIC = ['Find a number that, raised to the required power, gives the number under the root.', 'Check: raise your candidate answer back to that power.']
const HINTS_FRAC = ['A fractional exponent $\\frac{m}{n}$ means: take the $n$-th root, then raise to the power $m$ (or the other order).', 'First find $\\sqrt[n]{a}$ — it should be an integer.']
const HINTS_T3 = ['Try combining the roots under one radical: $\\sqrt{a}\\cdot\\sqrt{b}=\\sqrt{ab}$.', 'Look for a perfect square inside, or use $\\left(\\sqrt{a}\\right)^{2}=a$.']
const INPUT_HINT = 'The answer is a number; a root is fine, e.g. sqrt(3)/3'

function build(equation: string, value: string, solution: Problem['solution'], hints: readonly string[]): Problem {
  return {
    statement: `Evaluate: $${equation}$`,
    answer: { kind: 'number', value },
    solution,
    hints,
    inputHint: INPUT_HINT,
  }
}

function tier1(rng: Rng): Problem {
  if (rng.chance(0.5)) {
    const n = rng.int(2, 12)
    return build(`\\sqrt{${n * n}}`, String(n), [{ text: `Find a number whose square is $${n * n}$, since $${n}^{2} = ${n * n}$:`, tex: `\\sqrt{${n * n}} = ${n}` }], HINTS_BASIC)
  }
  const n = rng.int(2, 6)
  return build(`\\sqrt[3]{${n ** 3}}`, String(n), [{ text: `Find a number whose cube is $${n ** 3}$, since $${n}^{3} = ${n ** 3}$:`, tex: `\\sqrt[3]{${n ** 3}} = ${n}` }], HINTS_BASIC)
}

function tier2(rng: Rng): Problem {
  const d = rng.pick([3, 4])
  const k = rng.int(2, 5)
  const base = k ** d
  const m = rng.int(1, d - 1)
  const value = k ** m
  const equation = `${base}^{\\frac{${m}}{${d}}}`
  return build(equation, String(value), [
    { text: `The exponent $\\frac{${m}}{${d}}$ means: take the $${d}$-th root, then raise to the power $${m}$:`, tex: `${base}^{\\frac{${m}}{${d}}} = \\left(\\sqrt[${d}]{${base}}\\right)^{${m}}` },
    { text: `The $${d}$-th root of $${base}$ is $${k}$, since $${k}^{${d}} = ${base}$:`, tex: `\\sqrt[${d}]{${base}} = ${k}` },
    { text: 'Raise to the power:', tex: `${k}^{${m}} = ${value}` },
  ], HINTS_FRAC)
}

function rootsProduct(rng: Rng): Problem {
  const c = rng.int(2, 9)
  const m = rng.int(2, 6)
  const a = c * c * m
  const b = m
  const value = c * m
  return build(`\\sqrt{${a}} \\cdot \\sqrt{${b}}`, String(value), [
    { text: 'Combine under one radical:', tex: `\\sqrt{${a}} \\cdot \\sqrt{${b}} = \\sqrt{${a} \\cdot ${b}} = \\sqrt{${a * b}}` },
    { text: `The radicand is the perfect square $${value}^{2}$:`, tex: `\\sqrt{${a * b}} = \\sqrt{${value}^{2}} = ${value}` },
  ], HINTS_T3)
}

function rootPower(rng: Rng): Problem {
  const n = rng.int(2, 9)
  const value = n * n
  return build(`\\left(\\sqrt{${n}}\\right)^{4}`, String(value), [
    { text: 'Split the fourth power into the square of a square:', tex: `\\left(\\sqrt{${n}}\\right)^{4} = \\left(\\left(\\sqrt{${n}}\\right)^{2}\\right)^{2} = ${n}^{2}` },
    { text: 'Compute:', tex: `${n}^{2} = ${value}` },
  ], HINTS_T3)
}

function rationalizeDenominator(rng: Rng): Problem {
  const n = rng.pick([2, 3, 5, 6, 7, 8, 10, 11, 12, 13])
  const value = `\\frac{\\sqrt{${n}}}{${n}}`
  return build(`\\frac{1}{\\sqrt{${n}}}`, value, [
    { text: `Multiply numerator and denominator by $\\sqrt{${n}}$:`, tex: `\\frac{1}{\\sqrt{${n}}} = \\frac{1\\cdot\\sqrt{${n}}}{\\sqrt{${n}}\\cdot\\sqrt{${n}}} = \\frac{\\sqrt{${n}}}{${n}}` },
  ], HINTS_T3)
}

function tier3(rng: Rng): Problem {
  const roll = rng.next()
  if (roll < 0.34) return rootsProduct(rng)
  if (roll < 0.67) return rootPower(rng)
  return rationalizeDenominator(rng)
}

export const template: SkillTemplate = {
  skillId: 'roots',
  theory,
  expectedSeconds: { 1: 30, 2: 75, 3: 120 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
