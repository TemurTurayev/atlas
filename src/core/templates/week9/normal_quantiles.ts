import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'Quantiles of a normal distribution $X \\sim \\mathcal{N}(\\mu, \\sigma^2)$ are given by $x_p = \\mu + z_p \\sigma$, where $z_p$ is the $p$-th quantile of $\\mathcal{N}(0, 1)$.',
  'By the 68–95–99.7 rule: 68% central interval is $[\\mu - \\sigma, \\mu + \\sigma]$, 95% interval is $[\\mu - 2\\sigma, \\mu + 2\\sigma]$, 99.7% interval is $[\\mu - 3\\sigma, \\mu + 3\\sigma]$.',
  'Percentiles from the empirical rule: 16th percentile $\\approx \\mu - \\sigma$, 84th percentile $\\approx \\mu + \\sigma$, 2.5th percentile $\\approx \\mu - 2\\sigma$, 97.5th percentile $\\approx \\mu + 2\\sigma$.',
  'Given explicit $z$-quantiles (e.g. $z_{0.975} = 1.96$, $z_{0.95} = 1.645$): the $p$-th quantile is $x = \\mu + z_p \\sigma$.',
  'Symmetric central $(1-\\alpha)$ interval: $[\\mu - z_{1-\\alpha/2}\\sigma, \\mu + z_{1-\\alpha/2}\\sigma]$.',
  'Common mistakes: using variance $\\sigma^2$ instead of $\\sigma$ in $x = \\mu + z\\sigma$, or using one-tailed $z_{0.95}$ for a 95% two-tailed central interval.',
].join('\n')

const Z_TABLE: readonly { readonly pStr: string; readonly z: number; readonly pct: number }[] = [
  { pStr: '0.975', z: 1.96, pct: 97.5 },
  { pStr: '0.95', z: 1.645, pct: 95 },
  { pStr: '0.90', z: 1.282, pct: 90 },
  { pStr: '0.99', z: 2.326, pct: 99 },
]

function round3(val: number): number {
  return Math.round(val * 1000) / 1000
}

function quantileGivenZ(rng: Rng): Problem {
  const { pStr, z, pct } = rng.pick(Z_TABLE)
  const mu = rng.int(10, 40) * 5
  const sigma = rng.pick([5, 10, 20, 50, 100])
  const x = round3(mu + z * sigma)

  return {
    statement: `A normal distribution $X \\sim \\mathcal{N}(${mu}, ${sigma}^2)$ has mean $\\mu = ${mu}$ and standard deviation $\\sigma = ${sigma}$. Given that $z_{${pStr}} = ${z}$, find the $${pct}\\%$ quantile $x_{${pStr}}$.`,
    answer: { kind: 'number', value: String(x) },
    solution: [
      { text: 'Apply the quantile formula $x_p = \\mu + z_p \\sigma$:', tex: `x_{${pStr}} = \\mu + z_{${pStr}} \\sigma` },
      { text: 'Substitute the given values:', tex: `x_{${pStr}} = ${mu} + (${z}) \\cdot ${sigma} = ${x}` },
    ],
    hints: [
      `Use $x_{${pStr}} = \\mu + z_{${pStr}} \\sigma$.`,
      `Multiply $z = ${z}$ by $\\sigma = ${sigma}$, then add $\\mu = ${mu}$.`,
    ],
    inputHint: 'A decimal rounded to at most 3 decimal places.',
  }
}

function empiricalInterval(rng: Rng): Problem {
  const mu = rng.int(10, 30) * 5
  const sigma = rng.pick([2, 4, 5, 8, 10, 15, 20])
  const k = rng.pick([1, 2, 3])
  const pctMap: Record<number, number> = { 1: 68, 2: 95, 3: 99.7 }
  const pct = pctMap[k]
  const upper = mu + k * sigma

  return {
    statement: `A physiological parameter follows $\\mathcal{N}(${mu}, ${sigma}^2)$ with $\\mu = ${mu}$ and $\\sigma = ${sigma}$. Find the upper bound of the symmetric interval containing $${pct}\\%$ of the distribution by the 68–95–99.7 rule.`,
    answer: { kind: 'number', value: String(upper) },
    solution: [
      { text: `By the 68–95–99.7 rule, $${pct}\\%$ of the distribution lies within $\\mu \\pm ${k}\\sigma$.` },
      { text: 'Calculate the upper bound:', tex: `\\text{Upper bound} = \\mu + ${k}\\sigma = ${mu} + ${k} \\cdot ${sigma} = ${upper}` },
    ],
    hints: [
      `The $${pct}\\%$ interval corresponds to $\\mu \\pm ${k}\\sigma$.`,
      `Add $${k} \\cdot \\sigma = ${k * sigma}$ to $\\mu = ${mu}$.`,
    ],
  }
}

function empiricalPercentile(rng: Rng): Problem {
  const mu = rng.int(10, 30) * 5
  const sigma = rng.pick([2, 4, 5, 8, 10, 15, 20])
  const isUpper = rng.chance(0.5)
  const k = rng.pick([1, 2])

  let percentile: number
  let val: number
  if (k === 1) {
    percentile = isUpper ? 84 : 16
    val = isUpper ? mu + sigma : mu - sigma
  } else {
    percentile = isUpper ? 97.5 : 2.5
    val = isUpper ? mu + 2 * sigma : mu - 2 * sigma
  }

  const sign = isUpper ? '+' : '-'
  return {
    statement: `For $X \\sim \\mathcal{N}(${mu}, ${sigma}^2)$ with $\\mu = ${mu}$ and $\\sigma = ${sigma}$, use the 68–95–99.7 rule to find the value $x$ at the $${percentile}$th percentile.`,
    answer: { kind: 'number', value: String(val) },
    solution: [
      { text: `The $${percentile}$th percentile corresponds to $x = \\mu ${sign} ${k}\\sigma$ by empirical symmetry.` },
      { text: 'Calculate $x$:', tex: `x = ${mu} ${sign} ${k} \\cdot ${sigma} = ${val}` },
    ],
    hints: [
      `Identify the distance from $\\mu$ for the $${percentile}$th percentile.`,
      `Compute $\\mu ${sign} ${k}\\sigma = ${mu} ${sign} ${k * sigma}$.`,
    ],
  }
}

function tier1(rng: Rng): Problem {
  const choice = rng.int(1, 3)
  if (choice === 1) return quantileGivenZ(rng)
  if (choice === 2) return empiricalInterval(rng)
  return empiricalPercentile(rng)
}

function symmetricCentralIntervalGivenZ(rng: Rng): Problem {
  const mu = rng.int(10, 30) * 5
  const sigma = rng.pick([5, 10, 20, 50])
  const z = 1.96
  const target = rng.pick(['lower', 'upper', 'width'] as const)

  if (target === 'lower') {
    const ans = round3(mu - z * sigma)
    return {
      statement: `A clinical measure follows $X \\sim \\mathcal{N}(${mu}, ${sigma}^2)$. Given $z_{0.975} = 1.96$, find the lower bound of the 95% symmetric central interval.`,
      answer: { kind: 'number', value: String(ans) },
      solution: [
        { text: 'The 95% symmetric central interval is given by $[\\mu - z_{0.975}\\sigma, \\mu + z_{0.975}\\sigma]$:', tex: '\\text{Lower bound} = \\mu - 1.96 \\sigma' },
        { text: 'Substitute values:', tex: `\\text{Lower bound} = ${mu} - 1.96 \\cdot ${sigma} = ${ans}` },
      ],
      hints: [
        'Use $\\text{Lower bound} = \\mu - z_{0.975}\\sigma$.',
        `Subtract $1.96 \\cdot ${sigma} = ${round3(1.96 * sigma)}$ from $\\mu = ${mu}$.`,
      ],
      inputHint: 'A decimal rounded to at most 3 decimal places.',
    }
  }

  if (target === 'upper') {
    const ans = round3(mu + z * sigma)
    return {
      statement: `A clinical measure follows $X \\sim \\mathcal{N}(${mu}, ${sigma}^2)$. Given $z_{0.975} = 1.96$, find the upper bound of the 95% symmetric central interval.`,
      answer: { kind: 'number', value: String(ans) },
      solution: [
        { text: 'The 95% symmetric central interval is given by $[\\mu - z_{0.975}\\sigma, \\mu + z_{0.975}\\sigma]$:', tex: '\\text{Upper bound} = \\mu + 1.96 \\sigma' },
        { text: 'Substitute values:', tex: `\\text{Upper bound} = ${mu} + 1.96 \\cdot ${sigma} = ${ans}` },
      ],
      hints: [
        'Use $\\text{Upper bound} = \\mu + z_{0.975}\\sigma$.',
        `Add $1.96 \\cdot ${sigma} = ${round3(1.96 * sigma)}$ to $\\mu = ${mu}$.`,
      ],
      inputHint: 'A decimal rounded to at most 3 decimal places.',
    }
  }

  const ans = round3(2 * z * sigma)
  return {
    statement: `A clinical measure follows $X \\sim \\mathcal{N}(${mu}, ${sigma}^2)$. Given $z_{0.975} = 1.96$, find the total width of the 95% symmetric central interval.`,
    answer: { kind: 'number', value: String(ans) },
    solution: [
      { text: 'The total width of a symmetric central interval is $2 \\cdot z_{1-\\alpha/2} \\cdot \\sigma$:', tex: '\\text{Width} = 2 \\cdot 1.96 \\cdot \\sigma' },
      { text: 'Substitute values:', tex: `\\text{Width} = 2 \\cdot 1.96 \\cdot ${sigma} = ${ans}` },
    ],
    hints: [
      'Use $\\text{Width} = 2 \\cdot z_{0.975} \\cdot \\sigma$.',
      `Multiply $2 \\cdot 1.96 = 3.92$ by $\\sigma = ${sigma}$.`,
    ],
    inputHint: 'A decimal rounded to at most 3 decimal places.',
  }
}

function quantileLowerTailGivenZ(rng: Rng): Problem {
  const mu = rng.int(10, 30) * 5
  const sigma = rng.pick([5, 10, 20, 50])
  const is5th = rng.chance(0.5)

  if (is5th) {
    const z = 1.645
    const ans = round3(mu - z * sigma)
    return {
      statement: `A test score is $X \\sim \\mathcal{N}(${mu}, ${sigma}^2)$. Given $z_{0.95} = 1.645$, find the 5th percentile $x_{0.05} = \\mu - z_{0.95}\\sigma$.`,
      answer: { kind: 'number', value: String(ans) },
      solution: [
        { text: 'By symmetry, the 5th percentile is $x_{0.05} = \\mu - z_{0.95}\\sigma$:', tex: `x_{0.05} = ${mu} - 1.645 \\cdot ${sigma} = ${ans}` },
      ],
      hints: [
        'Use $x_{0.05} = \\mu - z_{0.95}\\sigma$.',
        `Subtract $1.645 \\cdot ${sigma} = ${round3(1.645 * sigma)}$ from $\\mu = ${mu}$.`,
      ],
      inputHint: 'A decimal rounded to at most 3 decimal places.',
    }
  }

  const z = 1.96
  const ans = round3(mu - z * sigma)
  return {
    statement: `A test score is $X \\sim \\mathcal{N}(${mu}, ${sigma}^2)$. Given $z_{0.975} = 1.96$, find the 2.5th percentile $x_{0.025} = \\mu - z_{0.975}\\sigma$.`,
    answer: { kind: 'number', value: String(ans) },
    solution: [
      { text: 'By symmetry, the 2.5th percentile is $x_{0.025} = \\mu - z_{0.975}\\sigma$:', tex: `x_{0.025} = ${mu} - 1.96 \\cdot ${sigma} = ${ans}` },
    ],
    hints: [
      'Use $x_{0.025} = \\mu - z_{0.975}\\sigma$.',
      `Subtract $1.96 \\cdot ${sigma} = ${round3(1.96 * sigma)}$ from $\\mu = ${mu}$.`,
    ],
    inputHint: 'A decimal rounded to at most 3 decimal places.',
  }
}

function solveMuOrSigmaFromQuantile(rng: Rng): Problem {
  const solveMu = rng.chance(0.5)
  const z = 1.96
  const sigma = rng.pick([5, 10, 20])

  if (solveMu) {
    const mu = rng.int(10, 30) * 5
    const x = round3(mu + z * sigma)

    return {
      statement: `The 97.5th percentile of a normal distribution $X \\sim \\mathcal{N}(\\mu, ${sigma}^2)$ is $x = ${x}$. Given $z_{0.975} = 1.96$, find the mean $\\mu$.`,
      answer: { kind: 'number', value: String(mu) },
      solution: [
        { text: 'Rearrange the quantile equation $x = \\mu + z \\sigma$ for $\\mu$:', tex: '\\mu = x - z_{0.975} \\sigma' },
        { text: 'Substitute values:', tex: `\\mu = ${x} - 1.96 \\cdot ${sigma} = ${mu}` },
      ],
      hints: [
        'Use $\\mu = x - z_{0.975}\\sigma$.',
        `Subtract $1.96 \\cdot ${sigma} = ${round3(1.96 * sigma)}$ from $x = ${x}$.`,
      ],
    }
  }

  const mu = rng.int(10, 30) * 5
  const x = round3(mu + z * sigma)

  return {
    statement: `The 97.5th percentile of $X \\sim \\mathcal{N}(${mu}, \\sigma^2)$ is $x = ${x}$. Given $z_{0.975} = 1.96$, find the standard deviation $\\sigma$.`,
    answer: { kind: 'number', value: String(sigma) },
    solution: [
      { text: 'Rearrange the quantile equation $x = \\mu + z \\sigma$ for $\\sigma$:', tex: '\\sigma = \\frac{x - \\mu}{z_{0.975}}' },
      { text: 'Substitute values:', tex: `\\sigma = \\frac{${x} - ${mu}}{1.96} = ${sigma}` },
    ],
    hints: [
      'Use $\\sigma = \\frac{x - \\mu}{z_{0.975}}$.',
      `Subtract $\\mu = ${mu}$ from $x = ${x}$, then divide by $1.96$.`,
    ],
  }
}

function tier2(rng: Rng): Problem {
  const choice = rng.int(1, 3)
  if (choice === 1) return symmetricCentralIntervalGivenZ(rng)
  if (choice === 2) return quantileLowerTailGivenZ(rng)
  return solveMuOrSigmaFromQuantile(rng)
}

function referenceRangeClinical(rng: Rng): Problem {
  const mu = rng.int(15, 40) * 5
  const sigma = rng.pick([5, 10, 15, 20])
  const isUpper = rng.chance(0.5)

  if (isUpper) {
    const ans = round3(mu + 1.96 * sigma)
    return {
      statement: `A laboratory defines the 95% reference range for blood glucose as $[\\mu - 1.96\\sigma, \\mu + 1.96\\sigma]$. If $\\mu = ${mu}$ mg/dL and $\\sigma = ${sigma}$ mg/dL, find the upper reference limit.`,
      answer: { kind: 'number', value: String(ans) },
      solution: [
        { text: 'The upper reference limit is given by $\\mu + 1.96 \\sigma$:', tex: `\\text{Upper limit} = ${mu} + 1.96 \\cdot ${sigma} = ${ans}` },
      ],
      hints: [
        'Use $\\text{Upper limit} = \\mu + 1.96\\sigma$.',
        `Add $1.96 \\cdot ${sigma} = ${round3(1.96 * sigma)}$ to $\\mu = ${mu}$.`,
      ],
      inputHint: 'A decimal rounded to at most 3 decimal places.',
    }
  }

  const ans = round3(mu - 1.96 * sigma)
  return {
    statement: `A laboratory defines the 95% reference range for blood glucose as $[\\mu - 1.96\\sigma, \\mu + 1.96\\sigma]$. If $\\mu = ${mu}$ mg/dL and $\\sigma = ${sigma}$ mg/dL, find the lower reference limit.`,
    answer: { kind: 'number', value: String(ans) },
    solution: [
      { text: 'The lower reference limit is given by $\\mu - 1.96 \\sigma$:', tex: `\\text{Lower limit} = ${mu} - 1.96 \\cdot ${sigma} = ${ans}` },
    ],
    hints: [
      'Use $\\text{Lower limit} = \\mu - 1.96\\sigma$.',
      `Subtract $1.96 \\cdot ${sigma} = ${round3(1.96 * sigma)}$ from $\\mu = ${mu}$.`,
    ],
    inputHint: 'A decimal rounded to at most 3 decimal places.',
  }
}

function percentileRankGivenZ(rng: Rng): Problem {
  const mu = rng.int(10, 30) * 5
  const sigma = rng.pick([2, 4, 5, 8, 10])
  const k = rng.pick([1, 2])
  const isUpper = rng.chance(0.5)

  let x: number
  let ansPct: string
  if (k === 1) {
    x = isUpper ? mu + sigma : mu - sigma
    ansPct = isUpper ? '84' : '16'
  } else {
    x = isUpper ? mu + 2 * sigma : mu - 2 * sigma
    ansPct = isUpper ? '97.5' : '2.5'
  }

  return {
    statement: `A patient has body temperature $X = ${x}$ °C, where $X \\sim \\mathcal{N}(${mu}, ${sigma}^2)$ with $\\mu = ${mu}$ and $\\sigma = ${sigma}$. Using the 68–95–99.7 rule, what percentage of the population has a temperature below $x$?`,
    answer: { kind: 'number', value: ansPct },
    solution: [
      { text: `Determine the $z$-score for $x = ${x}$:` , tex: `z = \\frac{${x} - ${mu}}{${sigma}} = ${isUpper ? k : -k}` },
      { text: `By the empirical rule, the cumulative area below $z = ${isUpper ? k : -k}$ is $${ansPct}\\%$.` },
    ],
    hints: [
      `Calculate the $z$-score $z = \\frac{x - \\mu}{\\sigma}$.`,
      `Find the cumulative area below $z = ${isUpper ? k : -k}$ using the 68–95–99.7 rule.`,
    ],
    inputHint: 'A number representing the percentage, e.g. 97.5 or 84.',
  }
}

function conceptChoice(rng: Rng): Problem {
  const isSymmetric = rng.chance(0.5)

  if (isSymmetric) {
    const options = rng.shuffle([
      { id: 'symmetric_around_mean', label: 'The interval is symmetric around $\\mu$, so $\\mu = \\frac{L + U}{2}$.' },
      { id: 'mean_equals_lower', label: 'The mean $\\mu$ is always equal to the lower limit $L$.' },
      { id: 'mean_equals_upper', label: 'The mean $\\mu$ is always equal to the upper limit $U$.' },
      { id: 'extends_twice_right', label: 'The interval extends twice as far to the right of $\\mu$ as to the left.' },
    ])
    return {
      statement: 'If $X \\sim \\mathcal{N}(\\mu, \\sigma^2)$, what is the relationship between the symmetric 95% central interval $[L, U]$ and the mean $\\mu$?',
      answer: { kind: 'choice', options, correctId: 'symmetric_around_mean' },
      solution: [
        { text: 'A symmetric central interval around the mean has $L = \\mu - z\\sigma$ and $U = \\mu + z\\sigma$, so $\\frac{L+U}{2} = \\mu$.' },
      ],
      hints: [
        'Recall that normal curves are symmetric around their mean.',
        'Check the midpoint of $[L, U]$.',
      ],
    }
  }

  const options = rng.shuffle([
    { id: 'central_95_pct', label: 'It means $95\\%$ of central values fall within $\\mu \\pm 1.96\\sigma$.' },
    { id: 'greater_than_upper', label: 'It means $95\\%$ of values are greater than $\\mu + 1.96\\sigma$.' },
    { id: 'sd_equals_z', label: 'It means the standard deviation $\\sigma$ equals $1.96$.' },
    { id: 'outside_unit_range', label: 'It means $5\\%$ of the distribution lies outside the range $[0, 1.96]$.' },
  ])
  return {
    statement: 'What does $z_{0.975} = 1.96$ signify for a normal distribution?',
    answer: { kind: 'choice', options, correctId: 'central_95_pct' },
    solution: [
      { text: 'Since $z_{0.975} = 1.96$, $97.5\\%$ of values lie below $\\mu + 1.96\\sigma$ and $2.5\\%$ lie below $\\mu - 1.96\\sigma$, so $95\\%$ lie within $\\mu \\pm 1.96\\sigma$.' },
    ],
    hints: [
      'Consider the lower and upper tail cutoffs for a central interval.',
      'Think about $1.96$ standard deviations in both directions.',
    ],
  }
}

function tier3(rng: Rng): Problem {
  const choice = rng.int(1, 3)
  if (choice === 1) return referenceRangeClinical(rng)
  if (choice === 2) return percentileRankGivenZ(rng)
  return conceptChoice(rng)
}

export const template: SkillTemplate = {
  skillId: 'normal_quantiles',
  theory,
  expectedSeconds: { 1: 45, 2: 75, 3: 110 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
