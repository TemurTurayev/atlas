import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  "The logistic equation $y' = ry\\left(1-\\dfrac{y}{K}\\right)$ models growth that slows as $y$ approaches a carrying capacity $K$: for $y \\ll K$ it behaves like plain exponential growth $y'\\approx ry$, while $y'\\to 0$ as $y\\to K$.",
  'The growth rate $y\'$ is largest not at the start, but halfway to the ceiling, at $y=K/2$; there, $y\' = \\dfrac{rK}{4}$ — the steepest point of the S-shaped curve.',
  'With initial condition $y(0)=y_0$, the solution is $y(t) = \\dfrac{K}{1+\\left(\\dfrac{K}{y_0}-1\\right)e^{-rt}}$, an S-curve rising from $y_0$ toward $K$.',
  "This models a population approaching a resource limit, or an epidemic's later phase once the pool of susceptible people starts to run out — contrast with the unlimited growth of $y'=ky$.",
  'As $t\\to\\infty$, $e^{-rt}\\to 0$ and $y(t)\\to K$ from whatever positive starting value $y_0$ it began at.',
  'Common mistakes: assuming growth is fastest at $t=0$; forgetting the $\\left(\\dfrac{K}{y_0}-1\\right)$ term when writing the solution; plugging $y=K$ into $y\'=ry(1-y/K)$ and expecting anything but zero.',
].join('\n')

/** Greatest common divisor of two integers (either may be negative or zero). */
function gcd(a: number, b: number): number {
  let x = Math.abs(a)
  let y = Math.abs(b)
  while (y !== 0) {
    const next = x % y
    x = y
    y = next
  }
  return x
}

/** Reduces num/den to lowest terms with a positive denominator. */
function reduceFrac(num: number, den: number): readonly [number, number] {
  const sign = den < 0 ? -1 : 1
  const n = sign * num
  const d = sign * den
  const g = gcd(n, d) || 1
  return [n / g, d / g]
}

/** num/den reduced to lowest terms, as a plain integer when it divides evenly, sign pulled out front. */
function fracOrInt(num: number, den: number): string {
  const [n, d] = reduceFrac(num, den)
  if (d === 1) return String(n)
  return n < 0 ? `-\\frac{${-n}}{${d}}` : `\\frac{${n}}{${d}}`
}

const HINTS_READ_PARAMS = [
  "Compare the equation with the standard form $y'=ry\\left(1-\\dfrac{y}{K}\\right)$.",
  'The number that $y$ is divided by inside the parentheses is $K$; the coefficient multiplying the whole right-hand side is $r$.',
]

function readParams(rng: Rng): Problem {
  const K = rng.int(2, 20) * 50
  const n = rng.pick([2, 3, 4, 5, 8, 10])
  const rLatex = `\\frac{1}{${n}}`
  const askK = rng.chance(0.5)
  return {
    statement: `A population follows the logistic model $y' = ${rLatex}y\\left(1-\\dfrac{y}{${K}}\\right)$. What is its ${askK ? 'carrying capacity $K$' : 'intrinsic growth rate $r$'}?`,
    answer: { kind: 'number', value: askK ? String(K) : rLatex },
    solution: [
      { text: 'Compare with the standard form of the logistic equation:', tex: `y' = ry\\left(1-\\frac{y}{K}\\right)` },
      {
        text: askK ? 'The number that divides $y$ inside the parentheses is the carrying capacity:' : 'The coefficient multiplying the whole right-hand side is the intrinsic rate:',
        tex: askK ? `K = ${K}` : `r = ${rLatex}`,
      },
    ],
    hints: HINTS_READ_PARAMS,
    inputHint: askK ? 'A whole number.' : 'A simple fraction, such as 1/6.',
  }
}

const HINTS_EVAL_RATE = [
  "Substitute the given $y$ into $y'=ry\\left(1-\\dfrac{y}{K}\\right)$ and simplify $1-\\dfrac{y}{K}$ first.",
  'Multiply $r$, $y$, and the simplified bracket together, keeping everything as fractions.',
]

function evalRate(rng: Rng): Problem {
  const K = rng.int(2, 10) * 40
  const p = rng.pick([1, 2, 3])
  const y = (K * p) / 4
  const n = rng.pick([2, 3, 4, 5])
  const rLatex = `\\frac{1}{${n}}`
  const complementNum = 4 - p
  const numerator = K * p * complementNum
  const denominator = 16 * n
  const valueLatex = fracOrInt(numerator, denominator)
  return {
    statement: `For the model $y' = ${rLatex}y\\left(1-\\dfrac{y}{${K}}\\right)$, find $y'$ when $y=${y}$.`,
    answer: { kind: 'number', value: valueLatex },
    solution: [
      { text: `Simplify the bracket at $y=${y}$:`, tex: `1-\\frac{${y}}{${K}} = \\frac{${complementNum}}{4}` },
      { text: 'Multiply everything together:', tex: `y' = ${rLatex}\\cdot ${y}\\cdot\\frac{${complementNum}}{4} = ${valueLatex}` },
    ],
    hints: HINTS_EVAL_RATE,
    inputHint: 'An exact number; it may be a fraction.',
  }
}

function tier1(rng: Rng): Problem {
  return rng.chance(0.5) ? readParams(rng) : evalRate(rng)
}

const HINTS_MAX_Y = [
  "The growth rate $y'(y)=ry\\left(1-\\dfrac{y}{K}\\right)$ is a downward parabola in $y$, zero at $y=0$ and $y=K$.",
  'A downward parabola peaks at the midpoint of its two roots: $y=K/2$.',
]

const HINTS_MAX_RATE = [
  "The growth rate is largest at $y=K/2$; substitute this into $y'=ry\\left(1-\\dfrac{y}{K}\\right)$.",
  'At $y=K/2$, the bracket $1-\\dfrac{y}{K}$ equals $\\dfrac12$, so the maximum rate is $\\dfrac{rK}{4}$.',
]

function tier2(rng: Rng): Problem {
  const K = rng.int(2, 20) * 10
  const n = rng.pick([2, 3, 4, 5, 8])
  const rLatex = `\\frac{1}{${n}}`
  const askY = rng.chance(0.5)
  if (askY) {
    const value = K / 2
    return {
      statement: `A population follows the logistic model $y' = ${rLatex}y\\left(1-\\dfrac{y}{${K}}\\right)$. At what population $y$ is the growth rate $y'$ largest?`,
      answer: { kind: 'number', value: String(value) },
      solution: [
        {
          text: 'The growth rate is zero at $y=0$ and at $y=K$, and it is a downward parabola in $y$ in between, so it peaks at the midpoint:',
          tex: `y = \\frac{0+${K}}{2} = ${value}`,
        },
        { text: 'The fastest growth happens halfway to the ceiling, not at the start — that is the whole point of the S-shaped curve.' },
      ],
      hints: HINTS_MAX_Y,
      inputHint: 'A whole number.',
    }
  }
  const value = fracOrInt(K, 4 * n)
  return {
    statement: `A population follows the logistic model $y' = ${rLatex}y\\left(1-\\dfrac{y}{${K}}\\right)$. What is the largest value $y'$ ever reaches?`,
    answer: { kind: 'number', value },
    solution: [
      { text: 'The growth rate is largest at $y=K/2$, where the bracket $1-y/K$ equals $\\tfrac12$:', tex: `y'_{\\max} = ${rLatex}\\cdot\\frac{${K}}{2}\\cdot\\frac12` },
      { text: 'Simplify:', tex: `y'_{\\max} = \\frac{${K}}{4\\cdot ${n}} = ${value}` },
    ],
    hints: HINTS_MAX_RATE,
    inputHint: 'An exact number; it may be a fraction.',
  }
}

const HINTS_FORWARD = [
  'Write the logistic solution with the initial condition, then compute $K/y_0-1$.',
  'Since the exponent $rt$ is given as $\\ln m$, $e^{-rt}=1/m$ exactly — substitute that in rather than a decimal.',
]

function forwardEval(rng: Rng): Problem {
  const y0 = rng.int(1, 9) * 10
  const M = rng.pick([2, 3, 4, 5])
  const K = y0 * M
  const A = M - 1
  const m = rng.pick([2, 3, 4, 5])
  const t = rng.int(2, 8)
  const valueLatex = fracOrInt(K * m, m + A)
  return {
    statement: `A population grows logistically toward a carrying capacity of $K=${K}$, starting at $y(0)=${y0}$, with intrinsic rate $r=\\dfrac{\\ln ${m}}{${t}}$ per day. Find the population after ${t} days.`,
    answer: { kind: 'number', value: valueLatex },
    solution: [
      {
        text: 'Write the logistic solution with the initial condition, and simplify the constant it carries:',
        tex: `y(t) = \\frac{K}{1+\\left(\\frac{K}{y_0}-1\\right)e^{-rt}}, \\qquad \\frac{K}{y_0}-1 = \\frac{${K}}{${y0}}-1 = ${A}`,
      },
      { text: `Since $rt=\\ln ${m}$, the exponential is exactly $e^{-rt}=\\dfrac{1}{${m}}$:`, tex: `y(${t}) = \\frac{${K}}{1+${A}\\cdot\\frac{1}{${m}}}` },
      { text: 'Simplify the fraction:', tex: `y(${t}) = \\frac{${K}\\cdot ${m}}{${m}+${A}} = ${valueLatex}` },
    ],
    hints: HINTS_FORWARD,
    inputHint: 'An exact number; it may be a fraction.',
  }
}

const HINTS_BACKWARD = [
  'Set the logistic formula equal to the target population and solve for $e^{-rt}$.',
  'Once $e^{-rt}=1/m$ for a whole number $m$, take the natural logarithm: $rt=\\ln m$.',
]

/** (j, l) with l = j + 1, so the target is j/l of K and the algebra always reduces to a unit fraction. */
const TARGET_FRACTIONS = [
  { j: 1, l: 2 },
  { j: 3, l: 4 },
] as const

function backwardTime(rng: Rng): Problem {
  const y0 = rng.int(1, 4) * 20
  const M = rng.pick([3, 4, 5, 6])
  const K = y0 * M
  const A = M - 1
  const { j, l } = rng.pick(TARGET_FRACTIONS)
  const yTarget = (K * j) / l
  const m = j * A
  const n = rng.pick([2, 3, 4, 5, 6])
  const value = `${n}\\ln ${m}`
  return {
    statement: `A population grows logistically with carrying capacity $K=${K}$, starts at $y(0)=${y0}$, and has intrinsic rate $r=\\dfrac{1}{${n}}$ per day. After how many days does the population reach ${yTarget} (that is, $\\dfrac{${j}}{${l}}$ of the carrying capacity)?`,
    answer: { kind: 'number', value },
    solution: [
      { text: 'First find $A=\\dfrac{K}{y_0}-1$:', tex: `A = \\frac{${K}}{${y0}}-1 = ${A}` },
      {
        text: `The target $${yTarget}$ is $\\dfrac{${j}}{${l}}$ of $K$, so $\\dfrac{K}{y_{\\text{target}}}=\\dfrac{${l}}{${j}}$:`,
        tex: `1+${A}e^{-rt} = \\frac{${l}}{${j}}`,
      },
      {
        text: 'Solve for the exponential:',
        tex: `${A}e^{-rt} = \\frac{${l}}{${j}}-1 = \\frac{1}{${j}} \\quad\\Longrightarrow\\quad e^{-rt} = \\frac{1}{${j}\\cdot ${A}} = \\frac{1}{${m}}`,
      },
      { text: `So $rt=\\ln ${m}$; since $r=\\dfrac1{${n}}$, multiply through by ${n}$:`, tex: `t = ${value}` },
    ],
    hints: HINTS_BACKWARD,
    inputHint: 'Exact answer using ln, such as 4 ln 6; do not round to a decimal.',
  }
}

function tier3(rng: Rng): Problem {
  return rng.chance(0.5) ? forwardEval(rng) : backwardTime(rng)
}

export const template: SkillTemplate = {
  skillId: 'logistic_model',
  theory,
  expectedSeconds: { 1: 70, 2: 90, 3: 160 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
