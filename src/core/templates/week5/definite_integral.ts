import { coefPrefix } from '../../math/latex'
import { polyEval, polyFromRoots, polyToLatex, type Poly } from '../../math/poly'
import { rat, ratToLatex, sub } from '../../math/rational'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  "The Fundamental Theorem of Calculus: if $F'(x)=f(x)$, then $\\int_a^b f(x)\\,dx = F(b)-F(a)$ for any antiderivative $F$ — the constant of integration always cancels.",
  'A definite integral is a *signed* area: wherever the graph dips below the $x$-axis, that part counts negatively.',
  'To find the actual (unsigned) area between a curve and the $x$-axis, split the interval at every point where $f$ crosses zero, integrate each piece separately, and add the absolute values.',
  'The area between two curves $y=g(x)$ on top and $y=f(x)$ on the bottom, over $[a,b]$, is $\\int_a^b\\big(g(x)-f(x)\\big)\\,dx$.',
  'A few standard antiderivatives are worth memorizing: $\\int e^{x}dx=e^{x}$, $\\int \\sin(x)dx=-\\cos(x)$, $\\int \\frac{1}{x}dx=\\ln x$ for $x>0$.',
  'Common mistakes: reporting a negative number as an "area"; forgetting to split the integral at a sign change before adding up an area; mixing up which curve is on top.',
].join('\n')

const HINTS_FTC = [
  'Find an antiderivative $P(x)$ using the power rule: raise each exponent by one and divide by the new exponent.',
  'Evaluate $P$ at the upper limit, evaluate it at the lower limit, and subtract the second value from the first.',
]

const HINTS_SIGN = [
  'Find where the function is zero first — the graph changes sign there.',
  'For the area, split the integral at that zero and add the absolute value of each piece; for the plain integral, just evaluate the antiderivative at the two limits and subtract.',
]

const HINTS_CURVES = [
  'Find where the two curves intersect by setting the two expressions equal to each other.',
  'Integrate (top curve) minus (bottom curve) between the two intersection points.',
]

const HINTS_STANDARD = [
  'Recall the antiderivative of this function, then apply the fundamental theorem of calculus.',
  'Evaluate the antiderivative at the upper limit and subtract its value at the lower limit; do not round.',
]

const INPUT_HINT_WHOLE = 'A whole number; it may be negative'
const INPUT_HINT_CLOSED = 'A number; it may be a fraction, or a multiple of e or of a natural logarithm'

/** Antiderivative F built directly with integer coefficients, so F(b) − F(a) is always a whole number. */
function tier1(rng: Rng): Problem {
  const d = rng.pick([1, 2])
  const A: number[] = []
  for (let j = 1; j <= d + 1; j += 1) A.push(rng.intExcept(-3, 3, [0]))
  const F: Poly = [0, ...A]
  const p: Poly = A.map((a, i) => (i + 1) * a) // p_k = (k+1) * A_{k+1}, i.e. p = F'

  const lo = rng.int(-2, 1)
  const gap = rng.int(1, 2)
  const hi = lo + gap

  const Fa = polyEval(F, lo)
  const Fb = polyEval(F, hi)
  const value = Fb - Fa

  const pLatex = polyToLatex(p)
  const FLatex = polyToLatex(F)

  return {
    statement: `Evaluate: $\\displaystyle\\int_{${lo}}^{${hi}} \\left(${pLatex}\\right)\\,dx$.`,
    answer: { kind: 'number', value: String(value) },
    solution: [
      { text: 'By the fundamental theorem of calculus, first find an antiderivative $P(x)$ using the power rule:', tex: `P(x) = ${FLatex}` },
      { text: 'Evaluate $P$ at the upper and lower limits:', tex: `P(${hi}) = ${Fb}, \\qquad P(${lo}) = ${Fa}` },
      { text: 'Subtract:', tex: `\\int_{${lo}}^{${hi}} \\left(${pLatex}\\right)\\,dx = ${Fb} - \\left(${Fa}\\right) = ${value}` },
    ],
    hints: HINTS_FTC,
    inputHint: INPUT_HINT_WHOLE,
  }
}

/** A line f(x) = k(x − r) with an even k, so every antiderivative value below is a whole number. */
function tier2(rng: Rng): Problem {
  const k = rng.pick([-4, -2, 2, 4])
  const r = rng.int(-2, 2)
  const leftLen = rng.int(1, 3)
  const rightLen = rng.int(1, 3)
  const lo = r - leftLen
  const hi = r + rightLen

  const p: Poly = [-k * r, k] // f(x) = kx - kr
  const F: Poly = [0, -k * r, k / 2] // antiderivative, k even so k/2 is an integer

  const Fa = polyEval(F, lo)
  const Fr = polyEval(F, r)
  const Fb = polyEval(F, hi)
  const leftPiece = Fr - Fa
  const rightPiece = Fb - Fr
  const totalArea = Math.abs(leftPiece) + Math.abs(rightPiece)
  const signedTotal = Fb - Fa

  const fLatex = polyToLatex(p)
  const askArea = rng.chance(0.5)

  const statement = askArea
    ? `Let $f(x) = ${fLatex}$. On the interval $[${lo}, ${hi}]$, part of the graph lies below the $x$-axis. Find the total area enclosed between the curve and the $x$-axis on this interval (count the part below the axis as positive area too).`
    : `Let $f(x) = ${fLatex}$. On the interval $[${lo}, ${hi}]$, part of the graph lies below the $x$-axis. Find the value of $\\int_{${lo}}^{${hi}} f(x)\\,dx$ (the signed integral, not the total area).`

  const solution = askArea
    ? [
        { text: 'Find where the line crosses the $x$-axis by solving $f(x)=0$:', tex: `${fLatex} = 0 \\quad\\Longrightarrow\\quad x = ${r}` },
        { text: 'An antiderivative is:', tex: `F(x) = ${polyToLatex(F)}` },
        {
          text: `The curve is on opposite sides of the axis on $[${lo}, ${r}]$ and $[${r}, ${hi}]$, so integrate each piece separately and take absolute values:`,
          tex: `\\left|F(${r})-F(${lo})\\right| + \\left|F(${hi})-F(${r})\\right| = \\left|${Fr}-\\left(${Fa}\\right)\\right| + \\left|${Fb}-\\left(${Fr}\\right)\\right| = ${Math.abs(leftPiece)} + ${Math.abs(rightPiece)} = ${totalArea}`,
        },
      ]
    : [
        { text: 'Find where the line crosses the $x$-axis by solving $f(x)=0$ (useful to picture the sign, even though the signed integral does not need splitting):', tex: `${fLatex} = 0 \\quad\\Longrightarrow\\quad x = ${r}` },
        { text: 'An antiderivative is:', tex: `F(x) = ${polyToLatex(F)}` },
        { text: 'Evaluate the antiderivative directly at the two limits and subtract:', tex: `F(${hi}) - F(${lo}) = ${Fb} - \\left(${Fa}\\right) = ${signedTotal}` },
      ]

  return {
    statement,
    answer: { kind: 'number', value: String(askArea ? totalArea : signedTotal) },
    solution,
    hints: HINTS_SIGN,
    inputHint: INPUT_HINT_WHOLE,
  }
}

/** (c, gap) pairs for which c·gap³/6 — the area between a line and a tangent parabola — is a clean fraction or whole number. */
const CURVE_PAIRS: readonly (readonly [c: number, gap: number])[] = [
  [1, 1],
  [2, 1],
  [3, 1],
  [6, 1],
  [1, 2],
  [3, 2],
  [1, 3],
  [2, 3],
]

function curvesBetween(rng: Rng): Problem {
  const [c, gap] = rng.pick(CURVE_PAIRS)
  const h = rng.int(-3, 3)
  const p1 = h
  const p2 = h + gap

  const fCoefs = polyFromRoots(c, [h, h]) // f(x) = c(x-h)^2
  const gCoefs: Poly = [-c * gap * h, c * gap] // g(x) = c*gap*(x-h) = c*gap*x - c*gap*h
  const fLatex = polyToLatex(fCoefs)
  const gLatex = polyToLatex(gCoefs)

  const term1 = rat(c * gap ** 3, 2)
  const term2 = rat(c * gap ** 3, 3)
  const area = sub(term1, term2)

  return {
    statement: `Let $f(x) = ${fLatex}$ and $g(x) = ${gLatex}$. Find the area of the region enclosed between the two curves.`,
    answer: { kind: 'number', value: ratToLatex(area) },
    solution: [
      {
        text: 'Set the two expressions equal to find where the curves meet:',
        tex: `${fLatex} - \\left(${gLatex}\\right) = ${c}\\left(x-${p1}\\right)\\left(x-${p2}\\right) = 0 \\quad\\Longrightarrow\\quad x = ${p1} \\text{ or } x = ${p2}`,
      },
      { text: `Since $f$ is an upward-opening parabola, it dips below the line between the two intersection points, so $g(x)$ is on top there.` },
      {
        text: `Substitute $u=x-${p1}$, so the difference $g(x)-f(x)$ becomes $${c * gap}u-${c}u^{2}$ for $u$ running from $0$ to $${gap}$:`,
        tex: `\\int_0^{${gap}}\\left(${c * gap}u-${c}u^{2}\\right)du = \\left[\\frac{${c * gap}}{2}u^{2}-\\frac{${c}}{3}u^{3}\\right]_0^{${gap}}`,
      },
      {
        text: 'Substitute the upper limit and simplify:',
        tex: `= \\frac{${c * gap}}{2}\\cdot ${gap}^{2} - \\frac{${c}}{3}\\cdot ${gap}^{3} = ${ratToLatex(term1)} - ${ratToLatex(term2)} = ${ratToLatex(area)}`,
      },
    ],
    hints: HINTS_CURVES,
    inputHint: INPUT_HINT_CLOSED,
  }
}

function standardFunction(rng: Rng): Problem {
  const kind = rng.pick(['exp', 'sin', 'recip'] as const)
  const A = rng.intExcept(-4, 4, [0])

  if (kind === 'exp') {
    const U = rng.pick([1, 2, 3])
    const fLatex = `${coefPrefix(A)}e^{x}`
    const value = `${coefPrefix(A)}\\left(e^{${U}}-1\\right)`
    return {
      statement: `Evaluate: $\\displaystyle\\int_{0}^{${U}} ${fLatex}\\,dx$.`,
      answer: { kind: 'number', value },
      solution: [
        { text: 'The exponential is its own antiderivative:', tex: `\\int ${fLatex}\\,dx = ${fLatex}` },
        { text: 'Evaluate at the two limits and subtract (recall $e^{0}=1$):', tex: `${coefPrefix(A)}e^{${U}} - ${coefPrefix(A)}e^{0} = ${value}` },
      ],
      hints: HINTS_STANDARD,
      inputHint: INPUT_HINT_CLOSED,
    }
  }

  if (kind === 'sin') {
    const fLatex = `${coefPrefix(A)}\\sin(x)`
    const value = String(2 * A)
    return {
      statement: `Evaluate: $\\displaystyle\\int_{0}^{\\pi} ${fLatex}\\,dx$.`,
      answer: { kind: 'number', value },
      solution: [
        { text: 'An antiderivative of $\\sin(x)$ is $-\\cos(x)$:', tex: `\\int ${fLatex}\\,dx = ${coefPrefix(-A)}\\cos(x)` },
        { text: 'Evaluate at the two limits and subtract (recall $\\cos(\\pi)=-1$, $\\cos(0)=1$):', tex: `${coefPrefix(-A)}\\cos(\\pi) - \\left(${coefPrefix(-A)}\\cos(0)\\right) = ${A} - \\left(${-A}\\right) = ${value}` },
      ],
      hints: HINTS_STANDARD,
      inputHint: INPUT_HINT_WHOLE,
    }
  }

  const fLatex = `\\frac{${A}}{x}`
  const value = `${coefPrefix(A)}\\ln\\left(2\\right)`
  return {
    statement: `Evaluate: $\\displaystyle\\int_{1}^{2} ${fLatex}\\,dx$.`,
    answer: { kind: 'number', value },
    solution: [
      { text: 'An antiderivative of $\\frac{1}{x}$ is $\\ln x$ (the interval is entirely positive, so no absolute value is needed):', tex: `\\int ${fLatex}\\,dx = ${A}\\ln x` },
      { text: 'Evaluate at the two limits and subtract (recall $\\ln 1=0$):', tex: `${A}\\ln(2) - ${A}\\ln(1) = ${value}` },
    ],
    hints: HINTS_STANDARD,
    inputHint: INPUT_HINT_CLOSED,
  }
}

function tier3(rng: Rng): Problem {
  return rng.chance(0.5) ? curvesBetween(rng) : standardFunction(rng)
}

export const template: SkillTemplate = {
  skillId: 'definite_integral',
  theory,
  expectedSeconds: { 1: 70, 2: 110, 3: 150 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
