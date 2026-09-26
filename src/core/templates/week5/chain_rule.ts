import { coefPrefix, joinTerms, linear, paren } from '../../math/latex'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  "Chain rule: if $y=f(g(x))$, then $y'=f'(g(x))\\cdot g'(x)$ — differentiate the outer function, leave the inner one untouched inside it, then multiply by the derivative of the inner function.",
  'Outer power: $\\left(g(x)\\right)^{n}$ has derivative $n\\left(g(x)\\right)^{n-1}g\'(x)$.',
  "Outer exponential: $e^{g(x)}$ has derivative $e^{g(x)}g'(x)$ — the exponential reproduces itself.",
  "Outer logarithm: $\\ln(g(x))$ has derivative $\\dfrac{g'(x)}{g(x)}$, defined only where $g(x)>0$.",
  "Outer sine: $\\sin(g(x))$ has derivative $\\cos(g(x))g'(x)$.",
  "Common mistakes: forgetting to multiply by $g'(x)$; differentiating the inner function instead of the outer one.",
].join('\n')

const HINTS_POWER = [
  'Identify the inner function g(x) first, and treat it as a single block.',
  "Bring the exponent down as a coefficient, lower it by one for the power that remains, then multiply by the derivative of the inner function g'(x).",
]
const HINTS_EXP = [
  'Identify the inner function g(x) — the exponential itself does not change under differentiation.',
  "The derivative of e^g(x) is e^g(x) times g'(x); do not forget that last factor.",
]
const HINTS_LN = [
  'The natural logarithm needs a positive argument — that is why the domain is restricted here.',
  "The derivative of ln(g(x)) is g'(x) divided by g(x).",
]
const HINTS_SIN = [
  'Identify the inner function g(x) first, and treat it as a single block.',
  "The derivative of sin(g(x)) is cos(g(x)) times g'(x); do not forget that last factor.",
]
const HINTS_NESTED = [
  'Work from the outside in: differentiate the outermost layer first, leaving everything inside it alone, then repeat for the next layer in.',
  'Multiply the derivatives of all the layers together — nothing simplifies away by itself.',
]
const HINTS_PRODUCT_CHAIN = [
  'This is a product of two pieces — name them u and v before doing anything else.',
  'One of the two pieces needs the chain rule to differentiate; the other is simple.',
]
const HINTS_POINT = [
  'Differentiate first, in terms of x, using the chain rule.',
  'Substitute the point only after the derivative formula is complete.',
]
const INPUT_HINT_EXPR = 'Enter an expression in x, e.g. 3(2x-1)^2'
const INPUT_HINT_NUMBER = 'A single number; it may be negative'

interface Built {
  readonly problem: Problem
  readonly f: (x: number) => number
  /** Set only when the answer is the derivative evaluated at one specific point. */
  readonly x0?: number
}

/** g(x)^n, or just g(x) itself when n === 1, always parenthesised. */
const powerTerm = (innerLatex: string, exponent: number): string => (exponent === 1 ? `\\left(${innerLatex}\\right)` : `\\left(${innerLatex}\\right)^{${exponent}}`)

// ---------- tier 1: outer power of a linear or quadratic inner function ----------

function powerOfLinear(rng: Rng): Built {
  const a = rng.intExcept(-4, 4, [0])
  const b = rng.int(-6, 6)
  const n = rng.pick([2, 3, 4] as const)
  const gLatex = linear(a, b)
  const value = `${coefPrefix(n * a)}${powerTerm(gLatex, n - 1)}`
  return {
    problem: {
      statement: `Differentiate: $y = ${powerTerm(gLatex, n)}$.`,
      answer: { kind: 'expression', value, variables: ['x'] },
      solution: [
        { text: 'The outer function is a power, and the inner function is:', tex: `g(x) = ${gLatex}` },
        { text: 'Differentiate the outer power, leaving the inner function inside it, then multiply by the derivative of the inner function:', tex: `y' = ${n}${powerTerm(gLatex, n - 1)}\\cdot g'(x), \\qquad g'(x) = ${a}` },
        { text: 'Multiply through:', tex: `y' = ${value}` },
      ],
      hints: HINTS_POWER,
      inputHint: INPUT_HINT_EXPR,
    },
    f: (x) => (a * x + b) ** n,
  }
}

function powerOfQuadratic(rng: Rng): Built {
  const c = rng.intExcept(-6, 6, [0])
  const n = rng.pick([2, 3] as const)
  const gLatex = `x^{2}${c >= 0 ? '+' : ''}${c}`
  const coeff = 2 * n
  const value = `${coeff}x${powerTerm(gLatex, n - 1)}`
  return {
    problem: {
      statement: `Differentiate: $y = ${powerTerm(gLatex, n)}$.`,
      answer: { kind: 'expression', value, variables: ['x'] },
      solution: [
        { text: 'The outer function is a power, and the inner function is:', tex: `g(x) = ${gLatex}` },
        { text: 'Differentiate the outer power, leaving the inner function inside it, then multiply by the derivative of the inner function:', tex: `y' = ${n}${powerTerm(gLatex, n - 1)}\\cdot g'(x), \\qquad g'(x) = 2x` },
        { text: 'Multiply through:', tex: `y' = ${value}` },
      ],
      hints: HINTS_POWER,
      inputHint: INPUT_HINT_EXPR,
    },
    f: (x) => (x * x + c) ** n,
  }
}

function build1(rng: Rng): Built {
  return rng.chance(0.5) ? powerOfLinear(rng) : powerOfQuadratic(rng)
}

// ---------- tier 2: e^g(x), ln(g(x)), or sin(g(x)) for a linear inner function ----------

function expOfLinear(rng: Rng): Built {
  const a = rng.intExcept(-4, 4, [0])
  const b = rng.int(-6, 6)
  const gLatex = linear(a, b)
  const value = `${coefPrefix(a)}e^{${gLatex}}`
  return {
    problem: {
      statement: `Differentiate: $y = e^{${gLatex}}$.`,
      answer: { kind: 'expression', value, variables: ['x'] },
      solution: [
        { text: 'The inner function is:', tex: `g(x) = ${gLatex}` },
        { text: "The derivative of $e^{g(x)}$ is $e^{g(x)}$ times the derivative of the inner function:", tex: `y' = e^{${gLatex}}\\cdot g'(x), \\qquad g'(x) = ${a}` },
        { text: 'Multiply through:', tex: `y' = ${value}` },
      ],
      hints: HINTS_EXP,
      inputHint: INPUT_HINT_EXPR,
    },
    f: (x) => Math.exp(a * x + b),
  }
}

/** A safe sampling interval where a*x+b stays strictly positive (with margin), so ln(a*x+b) is defined. */
function positiveDomain(a: number, b: number): readonly [number, number] {
  const root = -b / a
  if (a > 0) {
    const lo = Math.ceil(root) + 1
    return [lo, lo + 4]
  }
  const hi = Math.floor(root) - 1
  return [hi - 4, hi]
}

function lnOfLinear(rng: Rng): Built {
  const a = rng.intExcept(-3, 3, [0])
  const b = rng.int(-6, 6)
  const gLatex = linear(a, b)
  const domain = positiveDomain(a, b)
  const value = `\\dfrac{${a}}{${gLatex}}`
  return {
    problem: {
      statement: `Differentiate: $y = \\ln\\left(${gLatex}\\right)$.`,
      answer: { kind: 'expression', value, variables: ['x'], domain: { x: domain } },
      solution: [
        { text: 'The inner function is:', tex: `g(x) = ${gLatex}` },
        { text: "The derivative of $\\ln(g(x))$ is $\\dfrac{g'(x)}{g(x)}$:", tex: `y' = \\dfrac{g'(x)}{${gLatex}}, \\qquad g'(x) = ${a}` },
        { text: 'So:', tex: `y' = ${value}` },
      ],
      hints: HINTS_LN,
      inputHint: INPUT_HINT_EXPR,
    },
    f: (x) => Math.log(a * x + b),
  }
}

function sinOfLinear(rng: Rng): Built {
  const a = rng.intExcept(-4, 4, [0])
  const b = rng.int(-6, 6)
  const gLatex = linear(a, b)
  const value = `${coefPrefix(a)}\\cos\\left(${gLatex}\\right)`
  return {
    problem: {
      statement: `Differentiate: $y = \\sin\\left(${gLatex}\\right)$.`,
      answer: { kind: 'expression', value, variables: ['x'] },
      solution: [
        { text: 'The inner function is:', tex: `g(x) = ${gLatex}` },
        { text: "The derivative of $\\sin(g(x))$ is $\\cos(g(x))$ times the derivative of the inner function:", tex: `y' = \\cos\\left(${gLatex}\\right)\\cdot g'(x), \\qquad g'(x) = ${a}` },
        { text: 'Multiply through:', tex: `y' = ${value}` },
      ],
      hints: HINTS_SIN,
      inputHint: INPUT_HINT_EXPR,
    },
    f: (x) => Math.sin(a * x + b),
  }
}

function build2(rng: Rng): Built {
  const branch = rng.pick(['exp', 'ln', 'sin'] as const)
  if (branch === 'exp') return expOfLinear(rng)
  if (branch === 'ln') return lnOfLinear(rng)
  return sinOfLinear(rng)
}

// ---------- tier 3: chain inside chain, chain inside product, or evaluated at a point ----------

/** e^{(g(x))^2} for a linear inner g — a chain rule nested inside another chain rule. */
function nestedChain(rng: Rng): Built {
  const a = rng.intExcept(-3, 3, [0])
  const b = rng.int(-3, 3)
  const gLatex = linear(a, b)
  const hLatex = powerTerm(gLatex, 2)
  const middleCoeff = `${coefPrefix(2 * a)}${powerTerm(gLatex, 1)}`
  const value = `e^{${hLatex}}\\cdot ${paren(middleCoeff)}`
  return {
    problem: {
      statement: `Differentiate: $y = e^{${hLatex}}$.`,
      answer: { kind: 'expression', value, variables: ['x'] },
      solution: [
        { text: 'There are two layers here. Name the innermost function and the middle layer:', tex: `g(x) = ${gLatex}, \\qquad h(x) = \\left(g(x)\\right)^{2}` },
        { text: 'Differentiate the middle layer with the chain rule (a power of g):', tex: `h'(x) = 2g(x)g'(x) = ${middleCoeff}, \\qquad g'(x) = ${a}` },
        { text: "Differentiate the outer exponential and multiply by $h'(x)$:", tex: `y' = e^{h(x)}\\cdot h'(x) = ${value}` },
      ],
      hints: HINTS_NESTED,
      inputHint: INPUT_HINT_EXPR,
    },
    f: (x) => Math.exp((a * x + b) ** 2),
  }
}

/** y = x * e^{g(x)}, a chain rule nested inside a product rule. */
function chainInProduct(rng: Rng): Built {
  const a = rng.intExcept(-3, 3, [0])
  const b = rng.int(-3, 3)
  const gLatex = linear(a, b)
  const vPrimeLatex = `${coefPrefix(a)}e^{${gLatex}}`
  const value = joinTerms([`e^{${gLatex}}`, `${coefPrefix(a)}xe^{${gLatex}}`])
  return {
    problem: {
      statement: `Differentiate: $y = xe^{${gLatex}}$.`,
      answer: { kind: 'expression', value, variables: ['x'] },
      solution: [
        { text: 'This is a product of x and a composition. Name the two factors:', tex: `u=x, \\quad v=e^{${gLatex}}` },
        { text: "Differentiate v with the chain rule — the inner function is g(x):", tex: `g(x) = ${gLatex}, \\qquad v' = e^{${gLatex}}\\cdot g'(x) = ${vPrimeLatex}` },
        { text: "Assemble the product rule $y'=u'v+uv'$:", tex: `y' = ${value}` },
      ],
      hints: HINTS_PRODUCT_CHAIN,
      inputHint: INPUT_HINT_EXPR,
    },
    f: (x) => x * Math.exp(a * x + b),
  }
}

/** y = (g(x))^n evaluated at a point, all integers so the result is always a whole number. */
function pointEval(rng: Rng): Built {
  const a = rng.intExcept(-3, 3, [0])
  const b = rng.intExcept(-3, 3, [0])
  const n = rng.pick([2, 3] as const)
  const x0 = rng.intExcept(-2, 2, [0])
  const gLatex = linear(a, b)
  const gAt = a * x0 + b
  const value = n * a * gAt ** (n - 1)
  return {
    problem: {
      statement: `Given $y = ${powerTerm(gLatex, n)}$, find $y'(${x0})$.`,
      answer: { kind: 'number', value: String(value) },
      solution: [
        { text: 'Name the inner function and its derivative:', tex: `g(x) = ${gLatex}, \\quad g'(x) = ${a}` },
        { text: 'Write the derivative using the chain rule:', tex: `y'(x) = ${n}\\left(g(x)\\right)^{${n - 1}}g'(x)` },
        { text: `Evaluate the inner function at $x=${x0}$, then substitute:`, tex: `g(${x0}) = ${gAt} \\quad\\Longrightarrow\\quad y'(${x0}) = ${n}\\left(${paren(gAt)}\\right)^{${n - 1}}\\cdot ${paren(a)} = ${value}` },
      ],
      hints: HINTS_POINT,
      inputHint: INPUT_HINT_NUMBER,
    },
    f: (x) => (a * x + b) ** n,
    x0,
  }
}

function build3(rng: Rng): Built {
  const branch = rng.pick(['nested', 'product', 'point'] as const)
  if (branch === 'nested') return nestedChain(rng)
  if (branch === 'product') return chainInProduct(rng)
  return pointEval(rng)
}

export const template: SkillTemplate = {
  skillId: 'chain_rule',
  theory,
  expectedSeconds: { 1: 60, 2: 90, 3: 130 },
  generate: (rng, tier) => (tier === 1 ? build1(rng) : tier === 2 ? build2(rng) : build3(rng)).problem,
}

export { build1, build2, build3 }
export type { Built }
