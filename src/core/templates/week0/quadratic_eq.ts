import { linear, paren } from '../../math/latex'
import { polyFromRoots, polyMul, polyToLatex, type Poly } from '../../math/poly'
import { gcd, rat, ratToLatex } from '../../math/rational'
import type { Rng } from '../../random/rng'
import type { Problem, SolutionStep, SkillTemplate } from '../types'

const theory = [
  'A quadratic equation: $ax^2 + bx + c = 0$.',
  'The discriminant: $D = b^2 - 4ac$.',
  '$D > 0$ gives two roots $x_{1,2} = \\frac{-b \\pm \\sqrt{D}}{2a}$; $D = 0$ gives one repeated root $x = -\\frac{b}{2a}$; $D < 0$ means there are no real roots.',
  'If $c = 0$, factor out $x$. Solve $x^4 + px^2 + q = 0$ using the substitution $z = x^2$.',
  'Common mistakes: dropping the minus sign in $-b$; dividing only $\\sqrt{D}$ by $2a$.',
].join('\n')

const HINTS = ['Compute the discriminant $D = b^2 - 4ac$.', 'Substitute into the formula $x_{1,2} = \\frac{-b \\pm \\sqrt{D}}{2a}$.']
const INPUT_HINT = 'Roots separated by commas: 2, -3. If there are no roots, write none'

const coprimeTo = (rng: Rng, a: number): number =>
  rng.intExcept(-9, 9, Array.from({ length: 19 }, (_, i) => i - 9).filter((n) => gcd(n, a) !== 1))

/** Discriminant walk-through for integer a, b, c whose discriminant is a perfect square or negative. */
export function quadraticSteps(a: number, b: number, c: number): SolutionStep[] {
  const d = b * b - 4 * a * c
  const dStep: SolutionStep = { text: 'Discriminant:', tex: `D = ${paren(b)}^2 - 4 \\cdot ${paren(a)} \\cdot ${paren(c)} = ${d}` }
  if (d < 0) return [dStep, { text: '$D < 0$, so there are no real roots.', tex: '\\emptyset' }]
  if (d === 0) {
    return [dStep, { text: '$D = 0$: one repeated root:', tex: `x = \\frac{${-b}}{${2 * a}} = ${ratToLatex(rat(-b, 2 * a))}` }]
  }
  const s = Math.round(Math.sqrt(d))
  return [
    dStep,
    { text: 'Two roots:', tex: `x_{1,2} = \\frac{${-b} \\pm ${s}}{${2 * a}}` },
    { text: 'Result:', tex: `x_1 = ${ratToLatex(rat(-b + s, 2 * a))}, \\quad x_2 = ${ratToLatex(rat(-b - s, 2 * a))}` },
  ]
}

function build(
  poly: Poly,
  values: readonly string[],
  solution: readonly SolutionStep[],
  alternative?: Problem['alternative'],
): Problem {
  const f = polyToLatex(poly)
  return {
    statement: `Determine the real zeros of $f(x) = ${f}$.`,
    answer: { kind: 'numberSet', values },
    solution,
    hints: HINTS,
    inputHint: INPUT_HINT,
    ...(alternative ? { alternative } : {}),
  }
}

/** Vieta's formulas: for x² + bx + c the roots sum to −b and multiply to c. */
function vietaAlternative(poly: Poly, r1: number, r2: number): Problem['alternative'] {
  return {
    title: "Alternative method: Vieta's formulas (finding roots by inspection)",
    steps: [
      { text: 'For a monic $x^2+bx+c$, the sum of the roots is $-b$ and the product is $c$.' },
      { text: `Find two numbers with sum $${r1 + r2}$ and product $${r1 * r2}$:`, tex: `x_1 = ${r1}, \\quad x_2 = ${r2}` },
      { text: 'Check by expanding the parentheses:', tex: `\\left(${linear(1, -r1)}\\right)\\left(${linear(1, -r2)}\\right) = ${polyToLatex(poly)}` },
    ],
  }
}

function tier1(rng: Rng): Problem {
  const r1 = rng.int(-7, 7)
  const r2 = rng.intExcept(-7, 7, [r1])
  const poly = polyFromRoots(1, [r1, r2])
  return build(poly, [String(r1), String(r2)], quadraticSteps(1, poly[1], poly[0]), vietaAlternative(poly, r1, r2))
}

function tier2(rng: Rng): Problem {
  const roll = rng.next()
  if (roll < 0.6) {
    const a = rng.int(2, 5)
    const r1 = rng.int(-5, 5)
    const m = coprimeTo(rng, a)
    const poly = polyMul([-r1, 1], [-m, a])
    return build(poly, [String(r1), ratToLatex(rat(m, a))], quadraticSteps(poly[2], poly[1], poly[0]))
  }
  if (roll < 0.8) {
    const k = rng.int(1, 3)
    const m = coprimeTo(rng, k)
    const poly = polyMul([-m, k], [-m, k])
    return build(poly, [ratToLatex(rat(m, k))], quadraticSteps(poly[2], poly[1], poly[0]))
  }
  const a = rng.int(1, 4)
  const b = rng.int(-6, 6)
  const c = Math.floor((b * b) / (4 * a)) + rng.int(1, 5)
  return build([c, b, a], [], quadraticSteps(a, b, c))
}

function biquadratic(rng: Rng): Problem {
  const [p, q] = rng.shuffle([1, 2, 3, 4]).slice(0, 2)
  const poly = [p * p * q * q, 0, -(p * p + q * q), 0, 1]
  return build(poly, [String(p), String(-p), String(q), String(-q)], [
    { text: 'Substitute $z = x^2$:', tex: `${polyToLatex([p * p * q * q, -(p * p + q * q), 1], 'z')} = 0` },
    { text: 'Roots in $z$ (both positive):', tex: `z_1 = ${p * p}, \\quad z_2 = ${q * q}` },
    { text: 'Back-substitute $x = \\pm\\sqrt{z}$:', tex: `x = \\pm ${p}, \\quad x = \\pm ${q}` },
  ])
}

function biquadraticOneBranch(rng: Rng): Problem {
  const p = rng.int(1, 4)
  const q = rng.int(1, 3)
  const poly = [-p * p * q * q, 0, q * q - p * p, 0, 1]
  return build(poly, [String(p), String(-p)], [
    { text: 'Substitute $z = x^2$:', tex: `${polyToLatex([-p * p * q * q, q * q - p * p, 1], 'z')} = 0` },
    { text: 'Roots in $z$:', tex: `z_1 = ${p * p}, \\quad z_2 = ${-q * q}` },
    { text: '$z_2 < 0$ gives no real $x$; from $z_1$:', tex: `x = \\pm ${p}` },
  ])
}

function cubicWithZero(rng: Rng): Problem {
  const a = rng.pick([1, 2, -1])
  const r1 = rng.intExcept(-5, 5, [0])
  const r2 = rng.intExcept(-5, 5, [0, r1])
  const quad = polyFromRoots(a, [r1, r2])
  return build(polyMul(quad, [0, 1]), ['0', String(r1), String(r2)], [
    { text: 'Factor out $x$:', tex: `x\\left(${polyToLatex(quad)}\\right) = 0` },
    { text: 'One root is $x = 0$; the rest come from the quadratic equation:', tex: `${polyToLatex(quad)} = 0` },
    ...quadraticSteps(quad[2], quad[1], quad[0]),
  ])
}

function tier3(rng: Rng): Problem {
  const roll = rng.next()
  if (roll < 0.35) return biquadratic(rng)
  if (roll < 0.55) return biquadraticOneBranch(rng)
  return cubicWithZero(rng)
}

export const template: SkillTemplate = {
  skillId: 'quadratic_eq',
  theory,
  expectedSeconds: { 1: 60, 2: 120, 3: 200 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
