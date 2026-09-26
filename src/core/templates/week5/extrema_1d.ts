import { coefPrefix, linear } from '../../math/latex'
import { polyEval, polyToLatex, type Poly } from '../../math/poly'
import type { Rng } from '../../random/rng'
import type { ChoiceOption, Problem, SkillTemplate } from '../types'

const theory = [
  'At a local maximum or minimum of a differentiable function the tangent is horizontal, so the derivative is zero there: these points are the critical points, $f\'(x)=0$.',
  'The second derivative test classifies a critical point $c$: $f\'\'(c) < 0$ gives a local maximum, $f\'\'(c) > 0$ gives a local minimum; $f\'\'(c) = 0$ tells you nothing.',
  'On a closed interval $[a,b]$, the largest (or smallest) value of $f$ occurs either at a critical point inside the interval or at one of the two endpoints $a$ and $b$ — always check both.',
  'For an optimisation word problem, write the quantity to optimise as a function of a single variable, using any given constraint to eliminate the others, then apply the same derivative test.',
  'A critical point is not automatically an extremum: confirm it with the sign of $f\'\'$, or with a sign change of $f\'$ on either side, before calling it a maximum or a minimum.',
  'Common mistakes: forgetting to check the endpoints of a closed interval; treating every root of $f\'$ as an extremum without confirming it with $f\'\'$ or a sign chart.',
].join('\n')

const HINTS_CRITICAL = [
  "Differentiate $f$ term by term with the power rule, then set the result equal to $0$.",
  "Factor the resulting polynomial (or use the quadratic formula) — every root of $f'$ is a critical point of $f$.",
]
const HINTS_CLASSIFY = [
  'A critical point is a local maximum where the function turns from rising to falling, and a local minimum where it turns from falling to rising.',
  "Compute $f''$ at that point: a negative value means a local maximum, a positive value means a local minimum.",
]
const HINTS_INTERVAL = [
  'On a closed interval, the maximum can only occur at a critical point inside it or at one of the two endpoints.',
  'Evaluate $f$ at every critical point in the interval and at both endpoints, then compare — the largest value wins.',
]
const HINTS_OPT_AREA = [
  'Express the area as a function of one side length, using the perimeter to eliminate the other side.',
  'Differentiate, set the derivative to $0$, and check that the second derivative confirms a maximum.',
]
const HINTS_OPT_COST = [
  'Differentiate the cost with respect to the dose; a term like $\\frac{k}{d}$ differentiates like $kd^{-1}$.',
  'Set the derivative to $0$ and solve for the positive dose, then use the second derivative to confirm it is a minimum.',
]

const INPUT_HINT_SET = 'Critical points separated by commas, e.g. -1, 2'
const INPUT_HINT_NUMBER = 'A single number; it may be negative'

/** Term-by-term derivative of an ascending-coefficient polynomial: d/dx (c_k x^k) = k c_k x^{k-1}. */
function polyDeriv(p: Poly): Poly {
  return p.slice(1).map((c, i) => c * (i + 1))
}

/** "\left(x-r\right)", the bracket factor for a root r. */
const bracket = (r: number): string => `\\left(${linear(1, -r)}\\right)`

/**
 * A cubic f = a x^3 + b x^2 + c x + d whose derivative is exactly 3a(x-r1)(x-r2), for any integers
 * r1, r2 — the leading coefficient a is always ±2, which clears the /2 that solving for b would
 * otherwise introduce.
 */
function cubicFromRoots(rng: Rng, r1: number, r2: number): { readonly poly: Poly; readonly lead3a: number } {
  const h = rng.pick([1, -1])
  const a = 2 * h
  const b = -3 * h * (r1 + r2)
  const c = 6 * h * r1 * r2
  const d = rng.int(-5, 5)
  return { poly: [d, c, b, a], lead3a: 3 * a }
}

/**
 * A quartic f = a x^4 + b x^3 + c x^2 + d x + e whose derivative is exactly 4a(x-r1)(x-r2)(x-r3),
 * for any integers r1, r2, r3 — the leading coefficient a is always ±3, clearing the /3 in b.
 */
function quarticFromRoots(rng: Rng, r1: number, r2: number, r3: number): { readonly poly: Poly; readonly lead4a: number } {
  const h = rng.pick([1, -1])
  const a = 3 * h
  const s1 = r1 + r2 + r3
  const s2 = r1 * r2 + r1 * r3 + r2 * r3
  const s3 = r1 * r2 * r3
  const b = -4 * h * s1
  const c = 6 * h * s2
  const d = -12 * h * s3
  const e = rng.int(-5, 5)
  return { poly: [e, d, c, b, a], lead4a: 4 * a }
}

function tier1(rng: Rng): Problem {
  if (rng.chance(0.5)) {
    const r1 = rng.int(-5, 5)
    const r2 = rng.intExcept(-5, 5, [r1])
    const { poly, lead3a } = cubicFromRoots(rng, r1, r2)
    const roots = [r1, r2].sort((x, y) => x - y)
    const factored = `${coefPrefix(lead3a)}${bracket(roots[0])}${bracket(roots[1])}`
    return {
      statement: `Find all critical points of $f(x) = ${polyToLatex(poly)}$ (the $x$-values where $f'(x) = 0$).`,
      answer: { kind: 'numberSet', values: roots.map(String) },
      solution: [
        { text: 'Differentiate using the power rule:', tex: `f'(x) = ${polyToLatex(polyDeriv(poly))}` },
        { text: 'Factor the derivative:', tex: `f'(x) = ${factored}` },
        { text: 'Set each factor to zero:', tex: `x = ${roots[0]}, \\quad x = ${roots[1]}` },
      ],
      hints: HINTS_CRITICAL,
      inputHint: INPUT_HINT_SET,
    }
  }
  const r1 = rng.int(-4, 4)
  const r2 = rng.intExcept(-4, 4, [r1])
  const r3 = rng.intExcept(-4, 4, [r1, r2])
  const { poly, lead4a } = quarticFromRoots(rng, r1, r2, r3)
  const roots = [r1, r2, r3].sort((x, y) => x - y)
  const factored = `${coefPrefix(lead4a)}${bracket(roots[0])}${bracket(roots[1])}${bracket(roots[2])}`
  return {
    statement: `Find all critical points of $f(x) = ${polyToLatex(poly)}$ (the $x$-values where $f'(x) = 0$).`,
    answer: { kind: 'numberSet', values: roots.map(String) },
    solution: [
      { text: 'Differentiate using the power rule:', tex: `f'(x) = ${polyToLatex(polyDeriv(poly))}` },
      { text: 'Factor the derivative:', tex: `f'(x) = ${factored}` },
      { text: 'Set each factor to zero:', tex: `x = ${roots[0]}, \\quad x = ${roots[1]}, \\quad x = ${roots[2]}` },
    ],
    hints: HINTS_CRITICAL,
    inputHint: INPUT_HINT_SET,
  }
}

const CLASSIFY_LABELS: readonly string[] = ['local maximum', 'local minimum', 'cannot tell without more information']

/**
 * f''(r1) and f''(r2) always have opposite, nonzero signs at the two distinct roots of the
 * quadratic f' — so the classification below is always well defined, and the third choice
 * ("cannot tell") is always a genuine, if plausible-sounding, wrong answer.
 */
function classifyCriticalPoint(rng: Rng): Problem {
  const r1 = rng.int(-4, 4)
  const r2 = rng.intExcept(-4, 4, [r1])
  const { poly } = cubicFromRoots(rng, r1, r2)
  const [, , b, a] = poly
  const chosen = rng.pick([r1, r2])
  const secondDeriv = 6 * a * chosen + 2 * b
  const classification = secondDeriv < 0 ? 'local maximum' : 'local minimum'
  const options: ChoiceOption[] = rng.shuffle(CLASSIFY_LABELS.map((label) => ({ id: label, label })))
  const signWord = secondDeriv < 0 ? '< 0' : '> 0'

  return {
    statement: `The point $x = ${chosen}$ is a critical point of $f(x) = ${polyToLatex(poly)}$. Is it a local maximum or a local minimum?`,
    answer: { kind: 'choice', options, correctId: classification },
    solution: [
      {
        text: 'Differentiate twice:',
        tex: `f'(x) = ${polyToLatex(polyDeriv(poly))}, \\qquad f''(x) = ${polyToLatex(polyDeriv(polyDeriv(poly)))}`,
      },
      { text: `Evaluate the second derivative at $x = ${chosen}$:`, tex: `f''(${chosen}) = ${secondDeriv}` },
      { text: `Since $f''(${chosen}) ${signWord}$, this critical point is a ${classification}.` },
    ],
    hints: HINTS_CLASSIFY,
  }
}

function intervalMaximum(rng: Rng): Problem {
  const r1 = rng.int(-3, 3)
  const r2 = rng.intExcept(-3, 3, [r1])
  const { poly } = cubicFromRoots(rng, r1, r2)
  const lo = Math.min(r1, r2)
  const hi = Math.max(r1, r2)
  const p = lo - rng.int(1, 2)
  const q = hi + rng.int(1, 2)
  const candidates = [p, lo, hi, q]
  const values = candidates.map((x) => polyEval(poly, x))
  const maxValue = Math.max(...values)
  const evalList = candidates.map((x, i) => `f(${x}) = ${values[i]}`).join(', \\quad ')

  return {
    statement: `Find the maximum value of $f(x) = ${polyToLatex(poly)}$ on the closed interval $[${p}, ${q}]$.`,
    answer: { kind: 'number', value: String(maxValue) },
    solution: [
      {
        text: 'Differentiate and find the critical points inside the interval:',
        tex: `f'(x) = ${polyToLatex(polyDeriv(poly))} = 0 \\;\\Longrightarrow\\; x = ${lo}, \\; x = ${hi}`,
      },
      { text: 'Evaluate $f$ at both critical points and at both endpoints of the interval:', tex: evalList },
      { text: `The largest of these values is the maximum on $[${p}, ${q}]$:`, tex: `${maxValue}` },
    ],
    hints: HINTS_INTERVAL,
    inputHint: INPUT_HINT_NUMBER,
  }
}

function tier2(rng: Rng): Problem {
  return rng.chance(0.5) ? classifyCriticalPoint(rng) : intervalMaximum(rng)
}

/** Among rectangles with a fixed perimeter, the square encloses the largest area. */
function rectangleArea(rng: Rng): Problem {
  const k = rng.int(3, 12)
  const perimeter = 4 * k
  const halfPerimeter = perimeter / 2
  const maxArea = k * k
  return {
    statement: `A rectangular garden is enclosed using ${perimeter} metres of fencing on all four sides. What is the largest possible area, in square metres?`,
    answer: { kind: 'number', value: String(maxArea) },
    solution: [
      { text: 'Let one side be $x$; since the perimeter is fixed, the adjacent side is:', tex: `y = ${halfPerimeter} - x` },
      {
        text: 'Write the area as a function of $x$ alone, then differentiate and set the result to zero:',
        tex: `A(x) = x\\left(${halfPerimeter} - x\\right), \\qquad A'(x) = ${halfPerimeter} - 2x = 0 \\;\\Longrightarrow\\; x = ${k}`,
      },
      {
        text: `The second derivative $A''(x) = -2$ is negative, confirming a maximum; the other side is also ${k} (a square). The maximum area is:`,
        tex: `A(${k}) = ${k}\\cdot ${k} = ${maxArea}`,
      },
    ],
    hints: HINTS_OPT_AREA,
    inputHint: INPUT_HINT_NUMBER,
  }
}

/** Minimising $C(d) = ad + b/d$ for $d>0$ is a classic reciprocal-term optimisation. */
function minimizingDose(rng: Rng): Problem {
  const d0 = rng.int(2, 8)
  const aCoef = rng.int(1, 5)
  const bCoef = aCoef * d0 * d0
  return {
    statement: `The cost of administering a dose $d$ (in mg) of a drug is $C(d) = ${aCoef}d + \\dfrac{${bCoef}}{d}$ dollars, for $d > 0$. Find the dose that minimises the cost.`,
    answer: { kind: 'number', value: String(d0) },
    solution: [
      { text: 'Write the second term as a power of $d$, then differentiate:', tex: `C(d) = ${aCoef}d + ${bCoef}d^{-1}, \\qquad C'(d) = ${aCoef} - ${bCoef}d^{-2}` },
      { text: 'Set the derivative to zero and solve for the positive dose:', tex: `${aCoef} = \\frac{${bCoef}}{d^{2}} \\;\\Longrightarrow\\; d^{2} = ${d0 * d0} \\;\\Longrightarrow\\; d = ${d0}` },
      { text: `The second derivative $C''(d) = \\dfrac{2\\cdot ${bCoef}}{d^{3}}$ is positive for $d>0$, confirming a minimum at $d = ${d0}$.` },
    ],
    hints: HINTS_OPT_COST,
    inputHint: INPUT_HINT_NUMBER,
  }
}

function tier3(rng: Rng): Problem {
  return rng.chance(0.5) ? rectangleArea(rng) : minimizingDose(rng)
}

export const template: SkillTemplate = {
  skillId: 'extrema_1d',
  theory,
  expectedSeconds: { 1: 90, 2: 120, 3: 170 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
