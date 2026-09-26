import { degree, polyAdd, polyMul, polyScale, polyToLatex, trim, type Poly } from '../../math/poly'
import type { Rng } from '../../random/rng'
import type { Problem, SolutionStep, SkillTemplate } from '../types'

const theory = [
  'Polynomial long division works like long division of numbers, but with monomials.',
  'At each step: divide the leading term of the remainder by the leading term of the divisor, multiply the result by the whole divisor, and subtract from the remainder.',
  'Stop when the degree of the remainder is less than the degree of the divisor: $P(x) = D(x)\\cdot Q(x) + R(x)$, $\\deg R < \\deg D$.',
  'If $R(x) = 0$, the division is exact, and $Q(x)$ is the quotient you want.',
  'If $R(x) \\ne 0$, the fraction splits as $\\frac{P(x)}{D(x)} = Q(x) + \\frac{R(x)}{D(x)}$, where $Q(x)$ is the polynomial part.',
  'Common mistakes: forgetting the sign when subtracting; skipping a monomial with a zero coefficient.',
].join('\n')

const HINTS = [
  'Divide the leading term of the dividend by the leading term of the divisor — this gives the first term of the quotient.',
  'Multiply this term by the whole divisor and subtract the result from the dividend; repeat for the new remainder.',
  'Stop dividing as soon as the degree of the remainder is less than the degree of the divisor.',
]
const INPUT_HINT_EXACT = 'Enter the quotient as a polynomial, e.g. x+2 or x^2-3x+1'
const INPUT_HINT_PART = 'Enter only the polynomial part S(x), without the remainder, e.g. x+2'

interface DivisionResult {
  readonly quotient: Poly
  readonly remainder: Poly
  readonly steps: readonly SolutionStep[]
}

function monomial(coef: number, shift: number): Poly {
  const arr = new Array(shift + 1).fill(0)
  arr[shift] = coef
  return arr
}

const isZeroPoly = (p: Poly): boolean => p.length === 1 && p[0] === 0

/** Long division P(x) = D(x)*Q(x) + R(x), recording the walk-through as it goes. */
function longDivide(dividend: Poly, divisor: Poly): DivisionResult {
  const dvsr = trim(divisor)
  const divDeg = degree(dvsr)
  const lead = dvsr[divDeg]
  let rem = trim(dividend)
  const quotDeg = Math.max(degree(rem) - divDeg, 0)
  const quotient = new Array(quotDeg + 1).fill(0)
  const steps: SolutionStep[] = []
  while (degree(rem) >= divDeg && !isZeroPoly(rem)) {
    const remDeg = degree(rem)
    const shift = remDeg - divDeg
    const coef = rem[remDeg] / lead
    quotient[shift] = coef
    const term = monomial(coef, shift)
    const subtractPoly = polyMul(term, dvsr)
    const next = trim(polyAdd(rem, polyScale(subtractPoly, -1)))
    const termLatex = coef < 0 ? `\\left(${polyToLatex(term)}\\right)` : polyToLatex(term)
    steps.push({
      text: `Divide the leading terms: $${polyToLatex(monomial(rem[remDeg], remDeg))} \\div ${polyToLatex(monomial(lead, divDeg))} = ${polyToLatex(term)}$. Multiply by the divisor and subtract:`,
      tex: `${polyToLatex(rem)} - ${termLatex}\\left(${polyToLatex(dvsr)}\\right) = ${polyToLatex(next)}`,
    })
    rem = next
  }
  return { quotient: trim(quotient), remainder: rem, steps }
}

function build(dividend: Poly, divisor: Poly): Problem {
  const result = longDivide(dividend, divisor)
  const p = polyToLatex(dividend)
  const d = polyToLatex(divisor)
  const quotientLatex = polyToLatex(result.quotient)
  const exact = isZeroPoly(result.remainder)
  const statement = exact
    ? `Divide $${p}$ by $${d}$ and give the quotient.`
    : `Divide $${p}$ by $${d}$. Write $\\frac{${p}}{${d}} = S(x) + \\frac{R(x)}{${d}}$ and give the polynomial part $S(x)$.`
  const finalStep: SolutionStep = exact
    ? { text: 'The remainder is zero — the division is exact. Quotient:', tex: `Q(x) = ${quotientLatex}` }
    : {
        text: 'The degree of the remainder is less than the degree of the divisor — division stops here. Polynomial part:',
        tex: `\\frac{${p}}{${d}} = \\underbrace{${quotientLatex}}_{S(x)} + \\frac{${polyToLatex(result.remainder)}}{${d}}`,
      }
  return {
    statement,
    answer: { kind: 'expression', value: quotientLatex, variables: ['x'] },
    solution: [{ text: 'Divide by long division, starting from the leading terms:' }, ...result.steps, finalStep],
    hints: HINTS,
    inputHint: exact ? INPUT_HINT_EXACT : INPUT_HINT_PART,
  }
}

/** Quadratic (deg 2) dividend, exact division by a monic linear divisor: linear quotient. */
function tier1(rng: Rng): Problem {
  const r = rng.intExcept(-6, 6, [0])
  const s = rng.intExcept(-6, 6, [0])
  const quotient: Poly = [s, 1]
  const divisor: Poly = [-r, 1]
  return build(polyMul(quotient, divisor), divisor)
}

/** Cubic (deg 3) dividend, exact division by a monic linear divisor: quadratic quotient. */
function tier2(rng: Rng): Problem {
  const r = rng.intExcept(-5, 5, [0])
  const p = rng.int(-5, 5)
  const q = rng.intExcept(-5, 5, [0])
  const quotient: Poly = [q, p, 1]
  const divisor: Poly = [-r, 1]
  return build(polyMul(quotient, divisor), divisor)
}

/** Cubic dividend divided by a monic quadratic divisor: linear quotient plus a nonzero constant remainder. */
function tier3(rng: Rng): Problem {
  const k = rng.int(1, 4)
  const b = rng.intExcept(-5, 5, [0])
  const c = rng.intExcept(-5, 5, [0])
  const quotient: Poly = [b, 1]
  const divisor: Poly = [k, 0, 1]
  const dividend = polyAdd(polyMul(quotient, divisor), [c])
  return build(dividend, divisor)
}

export const template: SkillTemplate = {
  skillId: 'poly_division',
  theory,
  expectedSeconds: { 1: 60, 2: 120, 3: 190 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
