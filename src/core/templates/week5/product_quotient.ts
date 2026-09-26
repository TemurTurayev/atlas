import { joinTerms, linear } from '../../math/latex'
import { polyEval, polyToLatex, trim, type Poly } from '../../math/poly'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  "Product rule: if $y=u(x)v(x)$, then $y'=u'v+uv'$ — differentiate one factor at a time, keep the other one as it is, then add.",
  "Quotient rule: if $y=\\dfrac{u(x)}{v(x)}$, then $y'=\\dfrac{u'v-uv'}{v^{2}}$ — note the minus sign and the squared denominator.",
  'Before applying either rule, name $u$ and $v$ explicitly and differentiate each one on its own; only then assemble the formula.',
  'A product of three factors is handled the same way: differentiate one factor at a time (replacing it with its own derivative) and keep the other two unchanged, then add all the results.',
  'If a factor cancels or the expression simplifies first, differentiating the simplified form is far less work than grinding through the rule on the original.',
  "Common mistakes: dropping the minus sign in the quotient rule; forgetting to square the denominator; writing $(uv)'=u'v'$.",
].join('\n')

const HINTS_PRODUCT = [
  'Name the two factors u and v, and differentiate each one on its own first.',
  "Assemble with the product rule: $y'=u'v+uv'$ — the derivative of the first factor times the second, plus the first factor times the derivative of the second.",
]
const HINTS_QUOTIENT = [
  'Name the numerator u and the denominator v, and differentiate each one on its own first.',
  "Assemble with the quotient rule: $y'=\\dfrac{u'v-uv'}{v^{2}}$ — mind the minus sign and the square on the denominator.",
]
const HINTS_THREE = [
  'Differentiate one factor at a time, replacing it with its own derivative, and keep the other two factors unchanged.',
  'Add the three results: (derivative of factor 1)(factor 2)(factor 3) + (factor 1)(derivative of factor 2)(factor 3) + (factor 1)(factor 2)(derivative of factor 3).',
]
const HINTS_SIMPLIFY = [
  'Look at the numerator and the denominator — do they share a common factor?',
  'Factor the numerator, cancel the common factor with the denominator, and differentiate the simplified expression instead.',
]
const HINTS_POINT = [
  'Differentiate first with the rule that fits, then substitute the point at the very end.',
  'Keep the formula in terms of x until the last step; substituting too early is a common source of errors.',
]
const INPUT_HINT_EXPR = 'Enter an expression in x, e.g. 2x*e^x + 3'
const INPUT_HINT_NUMBER = 'A single number; it may be negative'

/** What a builder hands back: the Problem itself, plus a numeric evaluator of the ORIGINAL function
 *  (built from raw pieces, not from the derivative logic) so tests can check the answer independently
 *  with a central difference. `avoid` lists points where that raw function is not actually defined
 *  even though the reference answer (after simplifying) is. */
interface Built {
  readonly problem: Problem
  readonly f: (x: number) => number
  readonly avoid?: readonly number[]
  /** Set only when the answer is the derivative evaluated at one specific point. */
  readonly x0?: number
}

/** Ascending coefficients of the derivative: d/dx sum c_k x^k = sum (k+1) c_{k+1} x^k. */
function polyDerivative(p: Poly): Poly {
  return p.slice(1).map((c, i) => c * (i + 1))
}

const isConstantPoly = (p: Poly): boolean => trim(p).length === 1

/** A degree-`n` polynomial with every coefficient nonzero, so it reads as a genuine polynomial. */
function densePoly(rng: Rng, n: number, range: number): Poly {
  const coeffs = Array.from({ length: n }, () => rng.intExcept(-range, range, [0]))
  const lead = rng.intExcept(-range, range, [0])
  return [...coeffs, lead]
}

interface Piece {
  readonly poly: Poly
  readonly latex: string
  readonly prime: Poly
  readonly primeLatex: string
}

function piece(rng: Rng, n: number, range: number): Piece {
  const poly = densePoly(rng, n, range)
  const prime = polyDerivative(poly)
  return { poly, latex: polyToLatex(poly), prime, primeLatex: polyToLatex(prime) }
}

/** A quadratic $x^{2}+bx+c$ with negative discriminant, so it is never zero for real x. */
function noRealRootQuadratic(rng: Rng): Piece {
  const b = rng.int(-3, 3)
  const minC = Math.floor((b * b) / 4) + 1
  const c = minC + rng.int(0, 3)
  const poly: Poly = [c, b, 1]
  const prime = polyDerivative(poly)
  return { poly, latex: polyToLatex(poly), prime, primeLatex: polyToLatex(prime) }
}

const wrapFactor = (p: Poly, latex: string): string => (isConstantPoly(p) ? latex : `\\left(${latex}\\right)`)

/** Juxtaposed product, with a bare constant factor placed first: 2, (x-3) -> "2(x-3)". */
function times(aPoly: Poly, aLatex: string, bPoly: Poly, bLatex: string): string {
  if (isConstantPoly(bPoly) && !isConstantPoly(aPoly)) return `${bLatex}${wrapFactor(aPoly, aLatex)}`
  return `${wrapFactor(aPoly, aLatex)}${wrapFactor(bPoly, bLatex)}`
}

function nameStep(uLatex: string, vLatex: string): { text: string; tex: string } {
  return { text: 'Name the two factors $u$ and $v$:', tex: `u=${uLatex}, \\quad v=${vLatex}` }
}

function primeStep(uPrimeLatex: string, vPrimeLatex: string): { text: string; tex: string } {
  return { text: 'Differentiate each one separately:', tex: `u'=${uPrimeLatex}, \\quad v'=${vPrimeLatex}` }
}

// ---------- tier 1: product rule ----------

function productPolyPoly(rng: Rng): Built {
  const u = piece(rng, rng.pick([1, 2] as const), 5)
  const v = piece(rng, 1, 5)
  const fLatex = times(u.poly, u.latex, v.poly, v.latex)
  const value = `${times(u.prime, u.primeLatex, v.poly, v.latex)}+${times(u.poly, u.latex, v.prime, v.primeLatex)}`
  return {
    problem: {
      statement: `Differentiate: $y = ${fLatex}$.`,
      answer: { kind: 'expression', value, variables: ['x'] },
      solution: [
        nameStep(u.latex, v.latex),
        primeStep(u.primeLatex, v.primeLatex),
        { text: "Assemble the product rule $y'=u'v+uv'$:", tex: `y' = ${value}` },
      ],
      hints: HINTS_PRODUCT,
      inputHint: INPUT_HINT_EXPR,
    },
    f: (x) => polyEval(u.poly, x) * polyEval(v.poly, x),
  }
}

function productPolyExp(rng: Rng): Built {
  const u = piece(rng, rng.pick([1, 2] as const), 5)
  const fLatex = `${wrapFactor(u.poly, u.latex)}e^{x}`
  const value = `${wrapFactor(u.prime, u.primeLatex)}e^{x}+${wrapFactor(u.poly, u.latex)}e^{x}`
  return {
    problem: {
      statement: `Differentiate: $y = ${fLatex}$.`,
      answer: { kind: 'expression', value, variables: ['x'] },
      solution: [
        nameStep(u.latex, 'e^{x}'),
        { text: 'Differentiate each one separately — the derivative of $e^{x}$ is itself:', tex: `u'=${u.primeLatex}, \\quad v'=e^{x}` },
        { text: "Assemble the product rule $y'=u'v+uv'$:", tex: `y' = ${value}` },
      ],
      hints: HINTS_PRODUCT,
      inputHint: INPUT_HINT_EXPR,
    },
    f: (x) => polyEval(u.poly, x) * Math.exp(x),
  }
}

function build1(rng: Rng): Built {
  return rng.chance(0.5) ? productPolyPoly(rng) : productPolyExp(rng)
}

// ---------- tier 2: quotient rule ----------

function build2(rng: Rng): Built {
  const u = piece(rng, 1, 5)
  const v = noRealRootQuadratic(rng)
  const fLatex = `\\dfrac{${u.latex}}{${v.latex}}`
  const numerator = `${times(u.prime, u.primeLatex, v.poly, v.latex)} - ${times(u.poly, u.latex, v.prime, v.primeLatex)}`
  const value = `\\dfrac{${numerator}}{\\left(${v.latex}\\right)^{2}}`
  return {
    problem: {
      statement: `Differentiate: $y = ${fLatex}$.`,
      answer: { kind: 'expression', value, variables: ['x'] },
      solution: [
        nameStep(u.latex, v.latex),
        primeStep(u.primeLatex, v.primeLatex),
        { text: "Assemble the quotient rule $y'=\\dfrac{u'v-uv'}{v^{2}}$:", tex: `y' = ${value}` },
      ],
      hints: HINTS_QUOTIENT,
      inputHint: INPUT_HINT_EXPR,
    },
    f: (x) => polyEval(u.poly, x) / polyEval(v.poly, x),
  }
}

// ---------- tier 3: point evaluation, three factors, or a quotient that simplifies ----------

function pointEval(rng: Rng): Built {
  const u = piece(rng, rng.pick([1, 2] as const), 4)
  const v = piece(rng, 1, 4)
  const x0 = rng.intExcept(-2, 2, [0])
  const fLatex = times(u.poly, u.latex, v.poly, v.latex)
  const uAt = polyEval(u.poly, x0)
  const vAt = polyEval(v.poly, x0)
  const uPrimeAt = polyEval(u.prime, x0)
  const vPrimeAt = polyEval(v.prime, x0)
  const value = uPrimeAt * vAt + uAt * vPrimeAt
  return {
    problem: {
      statement: `Given $y = ${fLatex}$, find $y'(${x0})$.`,
      answer: { kind: 'number', value: String(value) },
      solution: [
        nameStep(u.latex, v.latex),
        primeStep(u.primeLatex, v.primeLatex),
        { text: `Evaluate all four pieces at $x=${x0}$:`, tex: `u(${x0})=${uAt}, \\ v(${x0})=${vAt}, \\ u'(${x0})=${uPrimeAt}, \\ v'(${x0})=${vPrimeAt}` },
        { text: "Assemble $y'=u'v+uv'$ at that point:", tex: `y'(${x0}) = ${uPrimeAt}\\cdot ${vAt} + ${uAt}\\cdot ${vPrimeAt} = ${value}` },
      ],
      hints: HINTS_POINT,
      inputHint: INPUT_HINT_NUMBER,
    },
    f: (x) => polyEval(u.poly, x) * polyEval(v.poly, x),
    x0,
  }
}

function threeFactors(rng: Rng): Built {
  const roots = new Set<number>()
  while (roots.size < 3) roots.add(rng.intExcept(-5, 5, [...roots]))
  const [a, b, c] = [...roots]
  const fa = linear(1, -a)
  const fb = linear(1, -b)
  const fc = linear(1, -c)
  const fLatex = `\\left(${fa}\\right)\\left(${fb}\\right)\\left(${fc}\\right)`
  const term1 = `\\left(${fb}\\right)\\left(${fc}\\right)`
  const term2 = `\\left(${fa}\\right)\\left(${fc}\\right)`
  const term3 = `\\left(${fa}\\right)\\left(${fb}\\right)`
  const value = `${term1}+${term2}+${term3}`
  return {
    problem: {
      statement: `Differentiate: $y = ${fLatex}$.`,
      answer: { kind: 'expression', value, variables: ['x'] },
      solution: [
        { text: 'For a product of three factors, differentiate one factor at a time (each linear factor has derivative $1$), keeping the other two unchanged, then add the three results.' },
        { text: 'The three terms are:', tex: `${term1}, \\quad ${term2}, \\quad ${term3}` },
        { text: 'Add them up:', tex: `y' = ${value}` },
      ],
      hints: HINTS_THREE,
      inputHint: INPUT_HINT_EXPR,
    },
    f: (x) => (x - a) * (x - b) * (x - c),
  }
}

function quotientSimplifies(rng: Rng): Built {
  const k = rng.intExcept(-4, 4, [0])
  const k2 = k * k
  const numLatex = joinTerms(['x^{3}', String(-(k ** 3))])
  const fLatex = `\\dfrac{${numLatex}}{${linear(1, -k)}}`
  const simplified: Poly = [k2, k, 1]
  const simplifiedLatex = polyToLatex(simplified)
  const value = polyToLatex(polyDerivative(simplified))
  return {
    problem: {
      statement: `Differentiate: $y = ${fLatex}$.`,
      answer: { kind: 'expression', value, variables: ['x'] },
      solution: [
        { text: 'The numerator is a difference of cubes: $a^{3}-b^{3}=(a-b)(a^{2}+ab+b^{2})$. Here it factors as:', tex: `${numLatex} = \\left(${linear(1, -k)}\\right)\\left(${simplifiedLatex}\\right)` },
        { text: 'Cancel the common factor before differentiating — the quotient rule is unnecessary here:', tex: `y = ${simplifiedLatex}` },
        { text: 'Differentiate the simplified expression:', tex: `y' = ${value}` },
      ],
      hints: HINTS_SIMPLIFY,
      inputHint: INPUT_HINT_EXPR,
    },
    f: (x) => (x ** 3 - k ** 3) / (x - k),
    avoid: [k],
  }
}

function build3(rng: Rng): Built {
  const branch = rng.pick(['point', 'three', 'quotient'] as const)
  if (branch === 'point') return pointEval(rng)
  if (branch === 'three') return threeFactors(rng)
  return quotientSimplifies(rng)
}

export const template: SkillTemplate = {
  skillId: 'product_quotient',
  theory,
  expectedSeconds: { 1: 70, 2: 100, 3: 135 },
  generate: (rng, tier) => (tier === 1 ? build1(rng) : tier === 2 ? build2(rng) : build3(rng)).problem,
}

export { build1, build2, build3 }
export type { Built }
