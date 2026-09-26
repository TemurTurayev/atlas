import { rat, ratToLatex } from '../../math/rational'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  "The equation $y' = ky$ with $y(0) = y_0$ has solution $y(t) = y_0e^{kt}$ (found earlier by separation of variables): $k>0$ gives growth, $k<0$ gives decay.",
  'Two measurements pin down $k$: if $y(t_1) = y_1$, then $e^{kt_1} = y_1/y_0$, so $k = \\dfrac{1}{t_1}\\ln\\dfrac{y_1}{y_0}$.',
  'Half-life and doubling time both come from setting the factor $e^{kt}$ equal to $\\tfrac12$ or $2$: $t_{1/2} = \\dfrac{\\ln 2}{|k|}$, in either direction.',
  'One model, many settings: drug elimination and radioactive decay are $k<0$; bacterial growth and the early, unchecked phase of an epidemic are $k>0$ — only the sign and size of $k$ change.',
  'In a word problem, convert every time to the same unit before dividing by a half-life or doubling time, then apply the exact factor $2^{n}$ rather than a rounded decimal.',
  'Common mistakes: mixing time units (hours vs. days) before dividing; treating $k$ as a percentage rather than a rate; rounding $\\ln 2$ to a decimal when an exact answer is expected.',
].join('\n')

/** m/d in lowest terms, sign pulled out front: (-3, 4) -> "-\frac{3}{4}", (2, 2) -> "1". */
function fracLatex(num: number, den: number): string {
  const sign = num < 0 ? '-' : ''
  const value = rat(Math.abs(num), den)
  return `${sign}${ratToLatex(value)}`
}

const HINTS_AMOUNT = [
  "Recall the solution of $y'=ky$ with $y(0)=y_0$: it is $y(t)=y_0e^{kt}$.",
  'Multiply $k$ by $t$ first — the product is a clean integer — then raise $e$ to that power.',
]

function amountAtTime(rng: Rng): Problem {
  const A = rng.int(2, 20) * 5
  const d = rng.int(2, 6)
  const m = rng.intExcept(-3, 3, [0])
  const p = rng.int(1, 2)
  const t = d * p
  const E = m * p
  const kLatex = fracLatex(m, d)
  const valueLatex = `${A}e^{${E}}`
  return {
    statement: `A quantity satisfies $y' = ky$ with $y(0) = ${A}$ and $k = ${kLatex}$ per hour. Find $y(${t})$.`,
    answer: { kind: 'number', value: valueLatex },
    solution: [
      { text: 'The solution of this equation is:', tex: `y(t) = ${A}e^{kt}` },
      { text: `Multiply $k$ by $t=${t}$ first — the exponent should come out clean:`, tex: `kt = ${kLatex}\\cdot ${t} = ${E}` },
      { text: 'Substitute back:', tex: `y(${t}) = ${valueLatex}` },
    ],
    hints: HINTS_AMOUNT,
    inputHint: 'Exact answer with e in it, such as 12e^3; do not round to a decimal.',
  }
}

const HINTS_FIND_K = [
  'Substitute both measurements into $y(t)=y_0e^{kt}$ and divide to eliminate $y_0$.',
  'Take the natural logarithm of both sides, then divide by $t_1$.',
]

function findK(rng: Rng): Problem {
  const A = rng.int(2, 20)
  const R = rng.pick([2, 3, 4, 5])
  const t1 = rng.int(2, 8)
  const growth = rng.chance(0.5)
  const y0 = growth ? A : A * R
  const y1 = growth ? A * R : A
  const ratioLatex = growth ? `\\ln ${R}` : `-\\ln ${R}`
  const value = growth ? `\\frac{\\ln ${R}}{${t1}}` : `-\\frac{\\ln ${R}}{${t1}}`
  return {
    statement: `A quantity satisfies $y' = ky$. It starts at $y(0) = ${y0}$ and equals $${y1}$ at $t = ${t1}$. Find $k$.`,
    answer: { kind: 'number', value },
    solution: [
      { text: 'Substitute both measurements into the solution $y(t)=y_0e^{kt}$:', tex: `${y0}e^{k\\cdot ${t1}} = ${y1}` },
      { text: 'Divide by $y_0$ and take the natural logarithm of both sides:', tex: `k\\cdot ${t1} = \\ln\\frac{${y1}}{${y0}} = ${ratioLatex}` },
      { text: 'Solve for $k$:', tex: `k = ${value}` },
    ],
    hints: HINTS_FIND_K,
    inputHint: 'Exact answer using ln, such as (ln 5)/3 or -(ln 5)/3; do not round to a decimal.',
  }
}

function tier1(rng: Rng): Problem {
  return rng.chance(0.5) ? amountAtTime(rng) : findK(rng)
}

const HINTS_K_TO_HALFLIFE = [
  'The half-life is the time for $e^{kt}$ to equal $\\tfrac12$: $t_{1/2}=\\dfrac{\\ln 2}{|k|}$.',
  'Dividing by $|k|=\\dfrac1n$ is the same as multiplying by $n$.',
]

function kToHalfLife(rng: Rng): Problem {
  const n = rng.int(2, 9)
  return {
    statement: `A radioactive sample decays according to $y' = ky$ with $k = -\\dfrac{1}{${n}}$ per year. Find its half-life, in years.`,
    answer: { kind: 'number', value: `${n}\\ln 2` },
    solution: [
      { text: 'The half-life satisfies $e^{-|k|t_{1/2}} = \\tfrac12$, so:', tex: `t_{1/2} = \\frac{\\ln 2}{|k|}` },
      { text: `Here $|k| = \\frac{1}{${n}}$, so dividing by it multiplies by ${n}$:`, tex: `t_{1/2} = ${n}\\ln 2` },
    ],
    hints: HINTS_K_TO_HALFLIFE,
    inputHint: 'Exact answer such as 5 ln 2; do not round to a decimal.',
  }
}

const HINTS_HALFLIFE_TO_K = [
  'Solve $t_{1/2}=\\dfrac{\\ln 2}{|k|}$ for $|k|$, then attach the sign for decay.',
  'Decay means $k$ is negative: $k=-\\dfrac{\\ln 2}{t_{1/2}}$.',
]

function halfLifeToK(rng: Rng): Problem {
  const h = rng.int(2, 12)
  return {
    statement: `A drug is eliminated with a half-life of ${h} hours. Find the rate constant $k$ in $y' = ky$ (in units of 1/hour).`,
    answer: { kind: 'number', value: `-\\frac{\\ln 2}{${h}}` },
    solution: [
      { text: 'Solve the half-life relation for $|k|$:', tex: `t_{1/2} = \\frac{\\ln 2}{|k|} \\ \\Longrightarrow\\ |k| = \\frac{\\ln 2}{t_{1/2}}` },
      { text: `Decay means $k$ is negative, and $t_{1/2}=${h}$:`, tex: `k = -\\frac{\\ln 2}{${h}}` },
    ],
    hints: HINTS_HALFLIFE_TO_K,
    inputHint: 'Exact answer such as -(ln 2)/6; do not round to a decimal.',
  }
}

const HINTS_K_TO_DOUBLING = [
  'The doubling time is the time for $e^{kt}$ to equal $2$: $t_{\\text{double}}=\\dfrac{\\ln 2}{k}$.',
  'Dividing by $k=\\dfrac1n$ is the same as multiplying by $n$.',
]

function kToDoubling(rng: Rng): Problem {
  const n = rng.int(2, 9)
  return {
    statement: `A bacterial colony grows according to $y' = ky$ with $k = \\dfrac{1}{${n}}$ per hour. Find its doubling time, in hours.`,
    answer: { kind: 'number', value: `${n}\\ln 2` },
    solution: [
      { text: 'The doubling time satisfies $e^{kt_{\\text{double}}} = 2$, so:', tex: `t_{\\text{double}} = \\frac{\\ln 2}{k}` },
      { text: `Here $k = \\frac{1}{${n}}$, so dividing by it multiplies by ${n}$:`, tex: `t_{\\text{double}} = ${n}\\ln 2` },
    ],
    hints: HINTS_K_TO_DOUBLING,
    inputHint: 'Exact answer such as 4 ln 2; do not round to a decimal.',
  }
}

const HINTS_DOUBLING_TO_K = [
  'Solve $t_{\\text{double}}=\\dfrac{\\ln 2}{k}$ for $k$.',
  'Growth means $k$ is positive: $k=\\dfrac{\\ln 2}{t_{\\text{double}}}$.',
]

function doublingToK(rng: Rng): Problem {
  const d = rng.int(2, 12)
  return {
    statement: `A population doubles every ${d} days. Find the rate constant $k$ in $y' = ky$ (in units of 1/day).`,
    answer: { kind: 'number', value: `\\frac{\\ln 2}{${d}}` },
    solution: [
      { text: 'Solve the doubling relation for $k$:', tex: `t_{\\text{double}} = \\frac{\\ln 2}{k} \\ \\Longrightarrow\\ k = \\frac{\\ln 2}{t_{\\text{double}}}` },
      { text: `Growth means $k$ is positive, and $t_{\\text{double}}=${d}$:`, tex: `k = \\frac{\\ln 2}{${d}}` },
    ],
    hints: HINTS_DOUBLING_TO_K,
    inputHint: 'Exact answer such as (ln 2)/6; do not round to a decimal.',
  }
}

const TIER2_BUILDERS: readonly ((rng: Rng) => Problem)[] = [kToHalfLife, halfLifeToK, kToDoubling, doublingToK]

function tier2(rng: Rng): Problem {
  return rng.pick(TIER2_BUILDERS)(rng)
}

interface UnitCase {
  readonly period: number
  readonly days: number
  readonly n: number
}

/** period (hours) * n === 24 * days, so converting days to hours divides out evenly. */
const UNIT_CASES: readonly UnitCase[] = [
  { period: 24, days: 1, n: 1 },
  { period: 12, days: 1, n: 2 },
  { period: 8, days: 1, n: 3 },
  { period: 6, days: 1, n: 4 },
  { period: 24, days: 2, n: 2 },
  { period: 12, days: 2, n: 4 },
]

const HINTS_UNIT_CONVERT = [
  'Convert the elapsed time to the same unit as the given period (hours) before dividing.',
  'Divide the elapsed time in hours by the period to get a whole number of periods, then apply the factor for that many periods.',
]

function doseAfterDays(rng: Rng): Problem {
  const { period, days, n } = rng.pick(UNIT_CASES)
  const base = rng.int(2, 20)
  const C0 = base * 2 ** n
  const dayWord = days > 1 ? 'days' : 'day'
  return {
    statement: `A drug has a half-life of ${period} hours. A patient takes a dose of ${C0} mg. How many mg remain after ${days} ${dayWord}?`,
    answer: { kind: 'number', value: String(base) },
    solution: [
      { text: `Convert ${days} ${dayWord} to hours:`, tex: `${days}\\cdot 24 = ${days * 24}\\text{ h}` },
      { text: 'Divide by the half-life to get the number of half-lives:', tex: `\\frac{${days * 24}}{${period}} = ${n}` },
      { text: 'Halve the dose that many times:', tex: `\\frac{${C0}}{2^{${n}}} = ${base}` },
    ],
    hints: HINTS_UNIT_CONVERT,
    inputHint: 'A whole number of mg.',
  }
}

const HINTS_THRESHOLD = [
  'Write the target fraction as a power of $\\tfrac12$ to count the half-lives needed.',
  'Multiply the number of half-lives by the length of one half-life to get the elapsed time.',
]

function thresholdTime(rng: Rng): Problem {
  const h = rng.int(2, 12)
  const n = rng.int(2, 5)
  const R = 2 ** n
  return {
    statement: `A drug is eliminated with a half-life of ${h} hours. How many hours does it take for the concentration to drop to $\\frac{1}{${R}}$ of its initial value?`,
    answer: { kind: 'number', value: String(n * h) },
    solution: [
      { text: 'Write the target fraction as a power of $\\tfrac12$:', tex: `\\frac{1}{${R}} = \\left(\\frac12\\right)^{${n}}` },
      { text: `So ${n} half-lives must pass; multiply by the half-life:`, tex: `${n}\\cdot ${h} = ${n * h}` },
    ],
    hints: HINTS_THRESHOLD,
    inputHint: 'A whole number of hours.',
  }
}

const HINTS_EPIDEMIC = [
  'Convert the elapsed time to the same unit as the doubling time (hours) before dividing.',
  'Divide the elapsed time in hours by the doubling time to get a whole number of doublings, then double that many times.',
]

function epidemicAfterDays(rng: Rng): Problem {
  const { period, days, n } = rng.pick(UNIT_CASES)
  const P0 = rng.int(2, 20)
  const value = P0 * 2 ** n
  const dayWord = days > 1 ? 'days' : 'day'
  return {
    statement: `In the early, unchecked phase of an outbreak, the number of cases doubles every ${period} hours. It starts at ${P0} cases. How many cases are there after ${days} ${dayWord}?`,
    answer: { kind: 'number', value: String(value) },
    solution: [
      { text: `Convert ${days} ${dayWord} to hours:`, tex: `${days}\\cdot 24 = ${days * 24}\\text{ h}` },
      { text: 'Divide by the doubling time to get the number of doublings:', tex: `\\frac{${days * 24}}{${period}} = ${n}` },
      { text: 'Double that many times:', tex: `${P0}\\cdot 2^{${n}} = ${value}` },
    ],
    hints: HINTS_EPIDEMIC,
    inputHint: 'A whole number of cases.',
  }
}

function tier3(rng: Rng): Problem {
  return rng.pick([doseAfterDays, thresholdTime, epidemicAfterDays])(rng)
}

export const template: SkillTemplate = {
  skillId: 'exp_model',
  theory,
  expectedSeconds: { 1: 60, 2: 75, 3: 150 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
