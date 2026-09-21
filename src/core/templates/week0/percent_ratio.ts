import { mul, rat, ratToLatex, type Rational } from '../../math/rational'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'Percent: one hundredth of a number: $p\\% = \\dfrac{p}{100}$.',
  '$p\\%$ of a number $N$ equals $\\dfrac{p}{100}\\cdot N$.',
  'Percent change: $\\dfrac{\\text{new}-\\text{old}}{\\text{old}}\\cdot100\\%$ (the sign shows an increase or a decrease).',
  'A ratio $m:n$ splits a quantity into $\\dfrac{m}{m+n}$ and $\\dfrac{n}{m+n}$ of the whole.',
  'Common mistakes: dividing by the new value instead of the old one for percent change; adding percentages instead of multiplying factors for successive changes.',
].join('\n')

const HINTS_OF = ['Convert the percent to a fraction: $p\\%=\\frac{p}{100}$.', 'Multiply this fraction by the number.']
const HINTS_CHANGE = ['Find the difference between the new and old values.', 'Divide the difference by the OLD value and multiply by 100%.']
const HINTS_CHAIN = ['Each change is a multiplication by the factor $1+\\frac{c}{100}$.', 'Apply the factors in order: first the first change, then the second.']
const HINTS_RATIO = ['Add the parts of the ratio to find the total number of parts.', 'Divide the total quantity by the number of parts — this gives the value of one part.']

function numProblem(statement: string, value: Rational, solution: Problem['solution'], hints: readonly string[]): Problem {
  return {
    statement,
    answer: { kind: 'number', value: ratToLatex(value) },
    solution,
    hints,
    inputHint: 'The answer is a number (a fraction or a negative number is fine)',
  }
}

function tier1(rng: Rng): Problem {
  const p = rng.pick([5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90])
  const n = rng.int(20, 300)
  const value = rat(p * n, 100)
  const medical = rng.chance(0.5)
  const en = medical
    ? `A tablet contains $${n}$ mg of a substance; the active ingredient is $${p}\\%$ of the mass. Find the mass of the active ingredient, in mg.`
    : `Find $${p}\\%$ of $${n}$.`
    ? `A tablet contains $${n}$ mg of a substance; the active ingredient is $${p}\\%$ of the mass. Find the mass of the active ingredient, in mg.`
    : `Find $${p}\\%$ of $${n}$.`
  return numProblem(
    en,
    value,
    [
    { text: 'Convert the percent to a fraction:', tex: `${p}\\% = \\frac{${p}}{100}` },
    { text: 'Multiply by the number:', tex: `\\frac{${p}}{100} \\cdot ${n} = ${ratToLatex(value)}` },
  ],
    HINTS_OF,
  )
}

function tier2(rng: Rng): Problem {
  const old = rng.pick([20, 40, 60, 80, 100, 120, 140, 160, 180, 200])
  const change = rng.pick([-50, -40, -25, -20, -10, -5, 5, 10, 15, 20, 25, 30, 40, 50])
  const updated = old + (old * change) / 100
  const en = `A quantity changes from $${old}$ to $${updated}$. Find the percent change (use a minus sign for a decrease).`
  return numProblem(
    en,
    rat(change),
    [
    { text: 'Find the difference between the new and old values:', tex: `${updated} - ${old} = ${updated - old}` },
    { text: 'Divide by the old value and convert to a percent:', tex: `\\frac{${updated - old}}{${old}} \\cdot 100\\% = ${change}\\%` },
  ],
    HINTS_CHANGE,
  )
}

function successiveChanges(rng: Rng): Problem {
  const n = rng.int(50, 400)
  const c1 = rng.pick([-30, -25, -20, -10, 10, 15, 20, 25, 30, 40])
  const c2 = rng.pick([-30, -25, -20, -10, 10, 15, 20, 25, 30, 40])
  const afterFirst = mul(rat(n), rat(100 + c1, 100))
  const value = mul(afterFirst, rat(100 + c2, 100))
  const describe = (c: number) => (c >= 0 ? `increases by ${c}%` : `decreases by ${-c}%`)
  const en = `A quantity of $${n}$ first ${describe(c1)}, then ${describe(c2)}. Find the final value.`
  return numProblem(
    en,
    value,
    [
    { text: 'After the first change:', tex: `${n} \\cdot \\frac{${100 + c1}}{100} = ${ratToLatex(afterFirst)}` },
    { text: 'After the second change:', tex: `${ratToLatex(afterFirst)} \\cdot \\frac{${100 + c2}}{100} = ${ratToLatex(value)}` },
  ],
    HINTS_CHAIN,
  )
}

const RATIO_PAIRS: readonly (readonly [number, number])[] = [
  [2, 3], [3, 4], [2, 5], [3, 5], [4, 5], [3, 7], [2, 7], [5, 7], [4, 7], [5, 9], [2, 9], [4, 9], [7, 9],
]

function ratioSplit(rng: Rng): Problem {
  const [m0, n0] = rng.pick(RATIO_PAIRS)
  const [m, n] = rng.chance(0.5) ? [m0, n0] : [n0, m0]
  const k = rng.int(2, 9)
  const total = k * (m + n)
  const larger = k * Math.max(m, n)
  const en = `A total of $${total}$ is split in the ratio $${m}:${n}$. Find the larger share.`
  return numProblem(
    en,
    rat(larger),
    [
    { text: 'Total number of parts in the ratio:', tex: `${m} + ${n} = ${m + n}` },
    { text: 'Value of one part:', tex: `\\frac{${total}}{${m + n}} = ${k}` },
    { text: 'Larger share:', tex: `${k} \\cdot ${Math.max(m, n)} = ${larger}` },
  ],
    HINTS_RATIO,
  )
}

function tier3(rng: Rng): Problem {
  return rng.chance(0.5) ? successiveChanges(rng) : ratioSplit(rng)
}

export const template: SkillTemplate = {
  skillId: 'percent_ratio',
  theory,
  expectedSeconds: { 1: 35, 2: 70, 3: 130 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
