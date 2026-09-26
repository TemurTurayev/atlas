import type { Rng } from '../../random/rng'
import type { ChoiceOption, Problem, SkillTemplate } from '../types'

const theory = [
  'The SIR model splits a population of size $N$ into three compartments: Susceptible ($S$), Infected ($I$), and Recovered ($R$), with $S+I+R=N$ constant over time.',
  'The basic reproduction number $R_{0}=\\beta/\\gamma$ counts the new infections one infected person causes in an otherwise fully susceptible population, where $\\beta$ is the transmission rate and $\\gamma$ is the recovery rate.',
  'The number of infected people grows exactly when $R_{0}\\cdot\\dfrac{S}{N} > 1$, and shrinks when this product is below $1$ — as $S$ falls, the epidemic eventually turns around on its own.',
  'The herd-immunity threshold $1-\\dfrac{1}{R_{0}}$ is the fraction of the population that must be immune to keep $R_{0}\\cdot S/N \\le 1$ from the start, preventing an outbreak from growing at all.',
  'The epidemic peaks — new infections stop growing — exactly when the susceptible fraction falls to $S/N = 1/R_{0}$, after which $I$ begins to decline even though susceptibles remain.',
  'Common mistakes: comparing $R_{0}$ alone to $1$ instead of $R_{0}\\cdot S/N$ once part of the population is no longer susceptible; confusing the herd-immunity threshold $1-1/R_{0}$ with the peak condition $1/R_{0}$, which are complementary fractions.',
].join('\n')

const HINTS_R0 = [
  'The basic reproduction number is the transmission rate divided by the recovery rate.',
  'Compute $R_{0} = \\beta/\\gamma$ directly from the two given rates.',
]
const HINTS_COMPARTMENTS = [
  'The three compartments always add up to the total population: $S+I+R=N$.',
  'Solve for the missing compartment by subtracting the other two from $N$.',
]
const HINTS_GROWTH = [
  'First compute $R_{0}=\\beta/\\gamma$, then compare $R_{0}\\cdot S/N$ with $1$.',
  'Equivalently, compare $S$ directly with the threshold $N/R_{0} = N\\gamma/\\beta$.',
]
const HINTS_THRESHOLD = [
  'The herd-immunity threshold is $1-1/R_{0}$; the peak condition is the complementary fraction $1/R_{0}$.',
  'Substitute the given $R_{0}$ and simplify the fraction — do not round it to a decimal.',
]

const INPUT_HINT_NUMBER = 'A single number; a fraction like 2/3 is fine'

function clean(x: number): string {
  const rounded = Math.round(x * 1000) / 1000
  return Object.is(rounded, -0) ? '0' : String(rounded)
}

const GAMMA_CHOICES = [0.1, 0.2, 0.25, 0.5]

function reproductionNumber(rng: Rng): Problem {
  const gamma = rng.pick(GAMMA_CHOICES)
  const r0 = rng.int(2, 12)
  const beta = clean(gamma * r0)

  return {
    statement: `In an SIR model the transmission rate is $\\beta = ${beta}$ per day and the recovery rate is $\\gamma = ${clean(gamma)}$ per day. Find the basic reproduction number $R_{0} = \\beta/\\gamma$.`,
    answer: { kind: 'number', value: String(r0) },
    solution: [{ text: 'Divide the transmission rate by the recovery rate:', tex: `R_{0} = \\frac{\\beta}{\\gamma} = \\frac{${beta}}{${clean(gamma)}} = ${r0}` }],
    hints: HINTS_R0,
    inputHint: INPUT_HINT_NUMBER,
  }
}

function compartmentReading(rng: Rng): Problem {
  const n = rng.int(2, 20) * 100
  const s = rng.int(1, n - 2)
  const r = rng.int(0, n - s - 1)
  const infected = n - s - r

  return {
    statement: `An SIR model tracks a population of $N = ${n}$ people. Right now there are $S = ${s}$ susceptible and $R = ${r}$ recovered individuals. How many people are currently infected?`,
    answer: { kind: 'number', value: String(infected) },
    solution: [{ text: 'The three compartments always add up to the total population:', tex: `I = N - S - R = ${n} - ${s} - ${r} = ${infected}` }],
    hints: HINTS_COMPARTMENTS,
    inputHint: INPUT_HINT_NUMBER,
  }
}

function tier1(rng: Rng): Problem {
  return rng.chance(0.5) ? reproductionNumber(rng) : compartmentReading(rng)
}

const GROWTH_LABELS = ['the epidemic is growing', 'the epidemic is dying out', 'cannot tell from this information']

function tier2(rng: Rng): Problem {
  const r0 = rng.int(2, 10)
  const threshold = rng.int(30, 150)
  const n = threshold * r0
  const gamma = rng.pick(GAMMA_CHOICES)
  const beta = clean(gamma * r0)
  const isGrowing = rng.chance(0.5)
  const margin = rng.int(5, 20)
  const s = isGrowing ? threshold + margin : threshold - margin
  const correctId = isGrowing ? GROWTH_LABELS[0] : GROWTH_LABELS[1]
  const options: ChoiceOption[] = rng.shuffle(GROWTH_LABELS.map((label) => ({ id: label, label })))

  return {
    statement: `In an SIR model with transmission rate $\\beta = ${beta}$ per day, recovery rate $\\gamma = ${clean(gamma)}$ per day, and total population $N = ${n}$, there are currently $S = ${s}$ susceptible individuals. Is the number of infected people currently growing or shrinking?`,
    answer: { kind: 'choice', options, correctId },
    solution: [
      { text: 'Compute the basic reproduction number:', tex: `R_{0} = \\frac{\\beta}{\\gamma} = \\frac{${beta}}{${clean(gamma)}} = ${r0}` },
      {
        text: 'Infections grow exactly when $R_{0}\\cdot S/N > 1$, i.e. when $S$ exceeds the threshold $N/R_{0}$:',
        tex: `\\frac{N}{R_{0}} = \\frac{${n}}{${r0}} = ${threshold}, \\qquad S = ${s} \\;\\; ${isGrowing ? '>' : '<'} \\;\\; ${threshold}`,
      },
      { text: `Since $S$ is ${isGrowing ? 'above' : 'below'} the threshold, ${correctId}.` },
    ],
    hints: HINTS_GROWTH,
  }
}

interface ThresholdEntry {
  readonly r0Display: string
  readonly herdFracLatex: string
  readonly herdPercent: string
  readonly peakFracLatex: string
  readonly peakPercent: string
}

const THRESHOLD_TABLE: readonly ThresholdEntry[] = [
  { r0Display: '2', herdFracLatex: '\\frac{1}{2}', herdPercent: '50', peakFracLatex: '\\frac{1}{2}', peakPercent: '50' },
  { r0Display: '3', herdFracLatex: '\\frac{2}{3}', herdPercent: '66.7', peakFracLatex: '\\frac{1}{3}', peakPercent: '33.3' },
  { r0Display: '4', herdFracLatex: '\\frac{3}{4}', herdPercent: '75', peakFracLatex: '\\frac{1}{4}', peakPercent: '25' },
  { r0Display: '5', herdFracLatex: '\\frac{4}{5}', herdPercent: '80', peakFracLatex: '\\frac{1}{5}', peakPercent: '20' },
  { r0Display: '6', herdFracLatex: '\\frac{5}{6}', herdPercent: '83.3', peakFracLatex: '\\frac{1}{6}', peakPercent: '16.7' },
  { r0Display: '7', herdFracLatex: '\\frac{6}{7}', herdPercent: '85.7', peakFracLatex: '\\frac{1}{7}', peakPercent: '14.3' },
  { r0Display: '8', herdFracLatex: '\\frac{7}{8}', herdPercent: '87.5', peakFracLatex: '\\frac{1}{8}', peakPercent: '12.5' },
  { r0Display: '9', herdFracLatex: '\\frac{8}{9}', herdPercent: '88.9', peakFracLatex: '\\frac{1}{9}', peakPercent: '11.1' },
  { r0Display: '10', herdFracLatex: '\\frac{9}{10}', herdPercent: '90', peakFracLatex: '\\frac{1}{10}', peakPercent: '10' },
  { r0Display: '12', herdFracLatex: '\\frac{11}{12}', herdPercent: '91.7', peakFracLatex: '\\frac{1}{12}', peakPercent: '8.3' },
  { r0Display: '15', herdFracLatex: '\\frac{14}{15}', herdPercent: '93.3', peakFracLatex: '\\frac{1}{15}', peakPercent: '6.7' },
  { r0Display: '1.5', herdFracLatex: '\\frac{1}{3}', herdPercent: '33.3', peakFracLatex: '\\frac{2}{3}', peakPercent: '66.7' },
  { r0Display: '1.25', herdFracLatex: '\\frac{1}{5}', herdPercent: '20', peakFracLatex: '\\frac{4}{5}', peakPercent: '80' },
  { r0Display: '1.2', herdFracLatex: '\\frac{1}{6}', herdPercent: '16.7', peakFracLatex: '\\frac{5}{6}', peakPercent: '83.3' },
  { r0Display: '1.6', herdFracLatex: '\\frac{3}{8}', herdPercent: '37.5', peakFracLatex: '\\frac{5}{8}', peakPercent: '62.5' },
  { r0Display: '1.75', herdFracLatex: '\\frac{3}{7}', herdPercent: '42.9', peakFracLatex: '\\frac{4}{7}', peakPercent: '57.1' },
  { r0Display: '2.25', herdFracLatex: '\\frac{5}{9}', herdPercent: '55.6', peakFracLatex: '\\frac{4}{9}', peakPercent: '44.4' },
  { r0Display: '2.5', herdFracLatex: '\\frac{3}{5}', herdPercent: '60', peakFracLatex: '\\frac{2}{5}', peakPercent: '40' },
  { r0Display: '3.5', herdFracLatex: '\\frac{5}{7}', herdPercent: '71.4', peakFracLatex: '\\frac{2}{7}', peakPercent: '28.6' },
  { r0Display: '4.5', herdFracLatex: '\\frac{7}{9}', herdPercent: '77.8', peakFracLatex: '\\frac{2}{9}', peakPercent: '22.2' },
]

function herdImmunity(entry: ThresholdEntry): Problem {
  return {
    statement: `An infection has basic reproduction number $R_{0} = ${entry.r0Display}$. What fraction of the population must be immune to reach herd immunity (the threshold $1-1/R_{0}$)?`,
    answer: { kind: 'number', value: entry.herdFracLatex },
    solution: [
      { text: 'The herd-immunity threshold is:', tex: `1 - \\frac{1}{R_{0}} = 1 - \\frac{1}{${entry.r0Display}} = ${entry.herdFracLatex} \\approx ${entry.herdPercent}\\%` },
    ],
    hints: HINTS_THRESHOLD,
    inputHint: INPUT_HINT_NUMBER,
  }
}

function peakSusceptibleFraction(entry: ThresholdEntry): Problem {
  return {
    statement: `An infection has basic reproduction number $R_{0} = ${entry.r0Display}$. New infections stop growing once the susceptible fraction falls to $S/N = 1/R_{0}$. What is that peak susceptible fraction?`,
    answer: { kind: 'number', value: entry.peakFracLatex },
    solution: [{ text: 'The peak condition is:', tex: `\\frac{S}{N} = \\frac{1}{R_{0}} = \\frac{1}{${entry.r0Display}} = ${entry.peakFracLatex} \\approx ${entry.peakPercent}\\%` }],
    hints: HINTS_THRESHOLD,
    inputHint: INPUT_HINT_NUMBER,
  }
}

function tier3(rng: Rng): Problem {
  const entry = rng.pick(THRESHOLD_TABLE)
  return rng.chance(0.5) ? herdImmunity(entry) : peakSusceptibleFraction(entry)
}

export const template: SkillTemplate = {
  skillId: 'sir_model',
  theory,
  expectedSeconds: { 1: 70, 2: 110, 3: 120 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
