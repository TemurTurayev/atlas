import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'Exponential function: $f(t)=A\\cdot b^{t/k}$, where $A$ is the initial value and $b$ is the growth/decay factor per period of length $k$.',
  "A special base is Euler's number $e\\approx 2.718$: $f(t)=A e^{kt}$; growth when $k>0$, decay when $k<0$ (for example, drug elimination from the body).",
  'If the period is called "doubling time" or "half-life", substitute $b=2$, and divide the elapsed time by the period length to get the number of periods $n$.',
  'Common mistake: adding percentages or periods instead of multiplying growth factors; $b^{n}$ is multiplication, not addition.',
].join('\n')

const HINTS_FORMULA = [
  'Divide the exponent $t/k$ to get a whole number of periods.',
  'Raise the base to this power and multiply by the initial value $A$.',
]
const HINTS_PERIOD = [
  'Divide the elapsed time by the length of one period to get the number of periods $n$.',
  'Multiply (for growth) or divide (for decay) the initial value by $2^{n}$.',
]
const HINTS_CLEARANCE = [
  'Substitute the given values of $t$ and $k$ into the exponent.',
  'Compute $e^{-kt}$ and multiply by $C_0$; round the answer to two decimal places.',
]

function tier1(rng: Rng): Problem {
  const A = rng.int(2, 20) * 10
  const b = rng.pick([2, 3, 5])
  const k = rng.int(2, 5)
  const m = rng.int(1, 4)
  const t = k * m
  const value = A * b ** m
  const formula = `${A}\\cdot ${b}^{t/${k}}`
  return {
    statement: `A population is modeled by $N(t) = ${formula}$. Find $N(${t})$.`,
    answer: { kind: 'number', value: String(value) },
    solution: [
      { text: `Substitute $t=${t}$: the exponent equals $t/${k}=${m}$.`, tex: `N(${t}) = ${A}\\cdot ${b}^{${t}/${k}} = ${A}\\cdot ${b}^{${m}}` },
      { text: 'Compute the power and multiply:', tex: `${A}\\cdot ${b ** m} = ${value}` },
    ],
    hints: HINTS_FORMULA,
  }
}

function halfLife(rng: Rng): Problem {
  const n = rng.int(1, 4)
  const h = rng.pick([2, 3, 4, 5, 6, 8])
  const R = rng.int(2, 20)
  const M0 = R * 2 ** n
  const t = n * h
  return {
    statement: `A radioactive isotope has a half-life of $${h}$ hours. A sample starts at $${M0}$ g. Find the remaining mass after $${t}$ hours.`,
    answer: { kind: 'number', value: String(R) },
    solution: [
      { text: `In $${t}$ hours, $\\frac{${t}}{${h}}=${n}$ half-lives pass.` },
      { text: 'Each period, the mass is halved:', tex: `${M0} \\div 2^{${n}} = ${R}` },
    ],
    hints: HINTS_PERIOD,
  }
}

function doubling(rng: Rng): Problem {
  const n = rng.int(1, 4)
  const d = rng.pick([2, 3, 4, 5, 6])
  const P0 = rng.int(2, 20)
  const t = n * d
  const value = P0 * 2 ** n
  return {
    statement: `A bacteria colony doubles every $${d}$ hours. It starts with $${P0}$ cells. Find the population after $${t}$ hours.`,
    answer: { kind: 'number', value: String(value) },
    solution: [
      { text: `In $${t}$ hours, $\\frac{${t}}{${d}}=${n}$ doubling periods pass.` },
      { text: 'Each period, the population doubles:', tex: `${P0} \\cdot 2^{${n}} = ${value}` },
    ],
    hints: HINTS_PERIOD,
  }
}

function tier2(rng: Rng): Problem {
  return rng.chance(0.5) ? halfLife(rng) : doubling(rng)
}

/** integer/10 as a trimmed decimal string, exact since the denominator is 10: 21 -> "2.1", 30 -> "3". */
function tenths(value: number): string {
  const s = (value / 10).toFixed(1)
  return s.endsWith('.0') ? s.slice(0, -2) : s
}

function tier3(rng: Rng): Problem {
  const C0 = rng.int(2, 20) * 10
  const kTenths = rng.int(1, 6)
  const t = rng.int(2, 9)
  const kLatex = tenths(kTenths)
  const expLatex = tenths(kTenths * t)
  const value = `${C0}e^{-${expLatex}}`
  const numeric = C0 * Math.exp((-kTenths * t) / 10)
  return {
    statement: `A drug concentration follows $C(t) = C_0 e^{-kt}$ with $C_0=${C0}$ mg/L and $k=${kLatex}$ per hour. Find $C(${t})$, in mg/L (round to 2 decimal places).`,
    answer: { kind: 'number', value },
    solution: [
      { text: `Substitute $C_0=${C0}$, $k=${kLatex}$, $t=${t}$:`, tex: `C(${t}) = ${C0} e^{-${kLatex}\\cdot ${t}} = ${C0} e^{-${expLatex}}` },
      { text: 'Compute with a calculator:', tex: `\\approx ${numeric.toFixed(2)}` },
    ],
    hints: HINTS_CLEARANCE,
    inputHint: 'The answer is a decimal number, e.g. 12.34 (round to two decimal places)',
  }
}

export const template: SkillTemplate = {
  skillId: 'exp_fn',
  theory,
  expectedSeconds: { 1: 45, 2: 90, 3: 130 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
