import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'A $(1-\\alpha)$ confidence interval for a population mean $\\mu$ with known $\\sigma$ is $\\bar{x} \\pm E = \\bar{x} \\pm z_{\\text{crit}} \\frac{\\sigma}{\\sqrt{n}}$.',
  'Margin of error is $E = z_{\\text{crit}} \\frac{\\sigma}{\\sqrt{n}}$, and total interval width is $W = 2E = 2 z_{\\text{crit}} \\frac{\\sigma}{\\sqrt{n}}$.',
  'Common critical values: 90% confidence ($z_{0.95} = 1.645$), 95% confidence ($z_{0.975} = 1.96$), 99% confidence ($z_{0.995} = 2.576$). Critical values are always given.',
  'Required sample size for a target margin of error $E$: $n = \\left(\\frac{z_{\\text{crit}} \\sigma}{E}\\right)^2$.',
  'Interpretation: a 95% confidence interval means 95% of such intervals constructed from repeated random samples will contain the true population mean $\\mu$.',
  'Common mistakes: interpreting a 95% CI as a 95% probability that $\\mu$ lies in that fixed interval, or using $\\sigma$ instead of $\\frac{\\sigma}{\\sqrt{n}}$.',
].join('\n')

interface Context {
  /** What is measured, as a noun phrase. */
  readonly noun: string
  readonly unit: string
}

// The generators draw means of 50–150 and standard deviations up to 100 for every context, so only measures
// that really spread that widely belong here — not blood pressure or haemoglobin.
const CONTEXTS: readonly Context[] = [
  { noun: 'serum triglycerides', unit: 'mg/dL' },
  { noun: 'LDL cholesterol', unit: 'mg/dL' },
  { noun: 'plasma drug concentration', unit: 'ng/mL' },
  { noun: 'serum ferritin', unit: 'ng/mL' },
  { noun: 'creatinine clearance', unit: 'mL/min' },
  { noun: 'hospital length of stay', unit: 'hours' },
  { noun: 'serum ALT', unit: 'U/L' },
]

const CONF_LEVELS = [
  { z: 1.96, confStr: '95%', pct: 95 },
  { z: 1.645, confStr: '90%', pct: 90 },
  { z: 2.576, confStr: '99%', pct: 99 },
]

function round3(val: number): number {
  return Math.round(val * 1000) / 1000
}

function marginOfError(rng: Rng): Problem {
  const ctx = rng.pick(CONTEXTS)
  const { z, confStr } = rng.pick(CONF_LEVELS)
  const sqrtN = rng.pick([2, 3, 4, 5, 6, 8, 10])
  const n = sqrtN * sqrtN
  const mult = rng.pick([1, 2, 3, 4, 5, 6, 8, 10])
  const sigma = sqrtN * mult
  const xbar = rng.int(10, 30) * 5
  const E = round3(z * mult)

  return {
    statement: `In a trial measuring ${ctx.noun}, a sample of size $n = ${n}$ yields mean $\\bar{x} = ${xbar}\\text{ ${ctx.unit}}$ with known population $\\sigma = ${sigma}\\text{ ${ctx.unit}}$. Given $z_{\\text{crit}} = ${z}$ for a ${confStr} confidence interval, compute the margin of error $E$.`,
    answer: { kind: 'number', value: String(E) },
    solution: [
      { text: 'Apply the margin of error formula:', tex: 'E = z_{\\text{crit}} \\frac{\\sigma}{\\sqrt{n}}' },
      { text: 'Substitute the given values:', tex: `E = ${z} \\cdot \\frac{${sigma}}{\\sqrt{${n}}} = ${z} \\cdot ${mult} = ${E}` },
    ],
    hints: [
      'Use $E = z_{\\text{crit}} \\frac{\\sigma}{\\sqrt{n}}$.',
      `Compute $\\frac{\\sigma}{\\sqrt{n}} = \\frac{${sigma}}{${sqrtN}} = ${mult}$, then multiply by $z_{\\text{crit}} = ${z}$.`,
    ],
    inputHint: 'A decimal rounded to at most 3 decimal places.',
  }
}

function ciBound(rng: Rng): Problem {
  const ctx = rng.pick(CONTEXTS)
  const { z, confStr } = rng.pick(CONF_LEVELS)
  const sqrtN = rng.pick([4, 5, 6, 8, 10])
  const n = sqrtN * sqrtN
  const mult = rng.pick([1, 2, 3, 4, 5])
  const sigma = sqrtN * mult
  const xbar = rng.int(12, 30) * 5
  const E = round3(z * mult)
  const isUpper = rng.chance(0.5)
  const bound = isUpper ? round3(xbar + E) : round3(xbar - E)
  const boundName = isUpper ? 'upper bound' : 'lower bound'
  const sign = isUpper ? '+' : '-'

  return {
    statement: `For a study measuring ${ctx.noun}, a sample of size $n = ${n}$ has mean $\\bar{x} = ${xbar}\\text{ ${ctx.unit}}$ and $\\sigma = ${sigma}\\text{ ${ctx.unit}}$. Given $z_{\\text{crit}} = ${z}$ for a ${confStr} confidence level, find the ${boundName} of the confidence interval.`,
    answer: { kind: 'number', value: String(bound) },
    solution: [
      { text: 'Compute the margin of error:', tex: `E = z_{\\text{crit}} \\frac{\\sigma}{\\sqrt{n}} = ${z} \\cdot \\frac{${sigma}}{${sqrtN}} = ${E}` },
      { text: `Calculate the ${boundName}:`, tex: `\\text{Bound} = \\bar{x} ${sign} E = ${xbar} ${sign} ${E} = ${bound}` },
    ],
    hints: [
      `First calculate margin of error $E = ${z} \\cdot \\frac{${sigma}}{\\sqrt{${n}}} = ${E}$.`,
      `Then compute $\\bar{x} ${sign} E = ${xbar} ${sign} ${E} = ${bound}$.`,
    ],
    inputHint: 'A decimal rounded to at most 3 decimal places.',
  }
}

function ciWidth(rng: Rng): Problem {
  const ctx = rng.pick(CONTEXTS)
  const { z, confStr } = rng.pick(CONF_LEVELS)
  const sqrtN = rng.pick([4, 5, 8, 10])
  const n = sqrtN * sqrtN
  const mult = rng.pick([1, 2, 3, 4, 5])
  const sigma = sqrtN * mult
  const xbar = rng.int(10, 25) * 5
  const E = round3(z * mult)
  const width = round3(2 * E)

  return {
    statement: `A sample of $n = ${n}$ patients yields $\\bar{x} = ${xbar}\\text{ ${ctx.unit}}$ with $\\sigma = ${sigma}\\text{ ${ctx.unit}}$. Given $z_{\\text{crit}} = ${z}$ for a ${confStr} confidence level, calculate the total width of the confidence interval.`,
    answer: { kind: 'number', value: String(width) },
    solution: [
      { text: 'Calculate the margin of error:', tex: `E = z_{\\text{crit}} \\frac{\\sigma}{\\sqrt{n}} = ${z} \\cdot \\frac{${sigma}}{${sqrtN}} = ${E}` },
      { text: 'The total width of the confidence interval is $W = 2E$:', tex: `W = 2 \\cdot ${E} = ${width}` },
    ],
    hints: [
      'The total width of a confidence interval is twice its margin of error: $W = 2E$.',
      `Calculate $E = ${E}$, then multiply by $2$ to get $W = ${width}$.`,
    ],
  }
}

function tier1(rng: Rng): Problem {
  const choice = rng.int(1, 3)
  if (choice === 1) return marginOfError(rng)
  if (choice === 2) return ciBound(rng)
  return ciWidth(rng)
}

function sampleSizeForMargin(rng: Rng): Problem {
  const ctx = rng.pick(CONTEXTS)
  const { z, confStr } = rng.pick(CONF_LEVELS)
  const k = rng.pick([4, 5, 6, 8, 10])
  const n = k * k
  const sigma = rng.pick([10, 20, 25, 40, 50, 60, 80, 100])
  const E = round3((z * sigma) / k)

  return {
    statement: `A clinical trial planner wants to construct a ${confStr} confidence interval ($z_{\\text{crit}} = ${z}$) for the mean ${ctx.noun} with a margin of error of at most $E = ${E}\\text{ ${ctx.unit}}$. Given population $\\sigma = ${sigma}\\text{ ${ctx.unit}}$, calculate the required minimum sample size $n$.`,
    answer: { kind: 'number', value: String(n) },
    solution: [
      { text: 'Apply the sample size formula for confidence intervals:', tex: 'n = \\left(\\frac{z_{\\text{crit}} \\sigma}{E}\\right)^2' },
      { text: 'Substitute values and simplify:', tex: `n = \\left(\\frac{${z} \\cdot ${sigma}}{${E}}\\right)^2 = ${k}^2 = ${n}` },
    ],
    hints: [
      'Use $n = \\left(\\frac{z_{\\text{crit}} \\sigma}{E}\\right)^2$.',
      `Multiply $z = ${z}$ by $\\sigma = ${sigma}$, divide by $E = ${E}$ to get ${k}, then square to get $n = ${n}$.`,
    ],
  }
}

function inferMeanAndMarginFromCI(rng: Rng): Problem {
  const ctx = rng.pick(CONTEXTS)
  const xbar = rng.int(10, 30) * 5
  const E = rng.pick([1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 6, 8])
  const L = round3(xbar - E)
  const U = round3(xbar + E)
  const askMean = rng.chance(0.5)

  if (askMean) {
    return {
      statement: `A 95% confidence interval for the mean ${ctx.noun} is calculated as $[${L}, ${U}]\\text{ ${ctx.unit}}$. Find the sample mean $\\bar{x}$.`,
      answer: { kind: 'number', value: String(xbar) },
      solution: [
        { text: 'The sample mean is the midpoint of the confidence interval:', tex: '\\bar{x} = \\frac{\\text{Lower} + \\text{Upper}}{2}' },
        { text: 'Calculate the midpoint:', tex: `\\bar{x} = \\frac{${L} + ${U}}{2} = ${xbar}` },
      ],
      hints: [
        'The sample mean $\\bar{x}$ lies exactly in the center of the confidence interval.',
        `Compute $\\frac{${L} + ${U}}{2} = ${xbar}$.`,
      ],
    }
  }

  return {
    statement: `A 95% confidence interval for the mean ${ctx.noun} is calculated as $[${L}, ${U}]\\text{ ${ctx.unit}}$. Find the margin of error $E$.`,
    answer: { kind: 'number', value: String(E) },
    solution: [
      { text: 'The margin of error is half the width of the confidence interval:', tex: 'E = \\frac{\\text{Upper} - \\text{Lower}}{2}' },
      { text: 'Calculate half the width:', tex: `E = \\frac{${U} - ${L}}{2} = ${E}` },
    ],
    hints: [
      'The margin of error $E$ is half the total width of the interval.',
      `Subtract ${L} from ${U} to get ${round3(U - L)}, then divide by $2$ to get ${E}$.`,
    ],
  }
}

function scaleCIWidth(rng: Rng): Problem {
  const k = rng.pick([2, 3, 4, 5])
  const nFactor = k * k
  const ratio = round3(1 / k)

  return {
    statement: `If the sample size in a clinical trial is increased by a factor of $k^2 = ${nFactor}$ while keeping population standard deviation $\\sigma$ and confidence level constant, by what factor is the margin of error $E$ multiplied?`,
    answer: { kind: 'number', value: String(ratio) },
    solution: [
      { text: 'Recall that margin of error is inversely proportional to $\\sqrt{n}$:', tex: 'E = z_{\\text{crit}} \\frac{\\sigma}{\\sqrt{n}}' },
      { text: 'Increasing $n$ to $' + nFactor + 'n$ multiplies $E$ by:', tex: `\\frac{1}{\\sqrt{${nFactor}}} = \\frac{1}{${k}} = ${ratio}` },
    ],
    hints: [
      'Margin of error $E$ is inversely proportional to $\\sqrt{n}$.',
      `When sample size $n$ is multiplied by $k^2 = ${nFactor}$, the term $\\sqrt{n}$ is multiplied by $k = ${k}$, so $E$ is multiplied by $\\frac{1}{${k}} = ${ratio}$.`,
    ],
  }
}

function tier2(rng: Rng): Problem {
  const choice = rng.int(1, 3)
  if (choice === 1) return sampleSizeForMargin(rng)
  if (choice === 2) return inferMeanAndMarginFromCI(rng)
  return scaleCIWidth(rng)
}

function clinicalCIProblem(rng: Rng): Problem {
  const ctx = rng.pick(CONTEXTS)
  const { z, confStr } = rng.pick(CONF_LEVELS)
  const sqrtN = rng.pick([4, 5, 8, 10])
  const n = sqrtN * sqrtN
  const mult = rng.pick([2, 3, 4, 5])
  const sigma = sqrtN * mult
  const xbar = rng.int(15, 40) * 5
  const E = round3(z * mult)
  const lower = round3(xbar - E)

  return {
    statement: `A study of $n = ${n}$ patients measuring ${ctx.noun} yields $\\bar{x} = ${xbar}\\text{ ${ctx.unit}}$ and $\\sigma = ${sigma}\\text{ ${ctx.unit}}$. Given $z_{\\text{crit}} = ${z}$ for a ${confStr} confidence level, calculate the lower limit of the confidence interval.`,
    answer: { kind: 'number', value: String(lower) },
    solution: [
      { text: 'Calculate the margin of error:', tex: `E = z_{\\text{crit}} \\frac{\\sigma}{\\sqrt{n}} = ${z} \\cdot \\frac{${sigma}}{${sqrtN}} = ${E}` },
      { text: 'Subtract $E$ from $\\bar{x}$:', tex: `\\text{Lower limit} = ${xbar} - ${E} = ${lower}` },
    ],
    hints: [
      `Calculate margin of error $E = ${z} \\cdot \\frac{${sigma}}{\\sqrt{${n}}} = ${E}$.`,
      `Subtract $E = ${E}$ from $\\bar{x} = ${xbar}$ to get ${lower}.`,
    ],
    inputHint: 'A decimal rounded to at most 3 decimal places.',
  }
}

function ciSamplePlanning(rng: Rng): Problem {
  const ctx = rng.pick(CONTEXTS)
  const { z, confStr } = rng.pick(CONF_LEVELS)
  const k = rng.pick([4, 5, 6, 8, 10])
  const n = k * k
  const sigma = rng.pick([15, 20, 25, 30, 40, 50])
  const E = round3((z * sigma) / k)

  return {
    statement: `For an upcoming clinical trial on ${ctx.noun}, researchers specify a ${confStr} confidence interval ($z_{\\text{crit}} = ${z}$) with a target margin of error $E = ${E}\\text{ ${ctx.unit}}$. Given $\\sigma = ${sigma}\\text{ ${ctx.unit}}$, what is the required sample size $n$?`,
    answer: { kind: 'number', value: String(n) },
    solution: [
      { text: 'Use the required sample size formula:', tex: 'n = \\left(\\frac{z_{\\text{crit}} \\sigma}{E}\\right)^2' },
      { text: 'Substitute values:', tex: `n = \\left(\\frac{${z} \\cdot ${sigma}}{${E}}\\right)^2 = ${k}^2 = ${n}` },
    ],
    hints: [
      'Use $n = \\left(\\frac{z_{\\text{crit}} \\sigma}{E}\\right)^2$.',
      `Divide $z \\cdot \\sigma = ${round3(z * sigma)}$ by $E = ${E}$ to get ${k}, then square to get $n = ${n}$.`,
    ],
  }
}

function ciConceptChoice(rng: Rng): Problem {
  const variant = rng.pick([1, 2, 3])

  if (variant === 1) {
    const options = rng.shuffle([
      { id: 'repeated_sampling_coverage', label: 'If the study is repeated many times, 95% of the calculated confidence intervals will contain the true population mean $\\mu$.' },
      { id: 'prob_parameter_in_fixed_ci', label: 'There is a 95% probability that the true population mean $\\mu$ lies within this specific calculated interval.' },
      { id: 'sample_mean_probability', label: '95% of individual patient measurements lie within the confidence interval.' },
      { id: 'wider_sample_narrower_confidence', label: 'Higher confidence levels result in narrower confidence intervals.' },
    ])
    return {
      statement: 'Which statement correctly interprets a 95% confidence interval for a population mean?',
      answer: { kind: 'choice', options, correctId: 'repeated_sampling_coverage' },
      solution: [
        { text: 'A 95% confidence interval is a frequentist concept: under repeated sampling, 95% of independently generated confidence intervals will cover the fixed parameter $\\mu$.' },
      ],
      hints: [
        'Remember that the population mean $\\mu$ is a fixed unknown parameter, not a random variable.',
        'Confidence applies to the procedure across repeated sampling.',
      ],
    }
  }

  if (variant === 2) {
    const options = rng.shuffle([
      { id: 'higher_conf_wider', label: 'Increasing the confidence level (e.g. 90% to 99%) increases $z_{\\text{crit}}$, resulting in a wider confidence interval.' },
      { id: 'higher_conf_narrower', label: 'Increasing the confidence level decreases $z_{\\text{crit}}$, resulting in a narrower confidence interval.' },
      { id: 'higher_conf_no_effect', label: 'The confidence level has no effect on the margin of error or interval width.' },
      { id: 'higher_conf_halves_n', label: 'Higher confidence levels automatically double the sample size $n$.' },
    ])
    return {
      statement: 'How does increasing the confidence level (e.g. from 90% to 99%) affect the width of a confidence interval, assuming $\\sigma$ and $n$ are constant?',
      answer: { kind: 'choice', options, correctId: 'higher_conf_wider' },
      solution: [
        { text: 'A higher confidence level requires a larger critical value $z_{\\text{crit}}$ (e.g. $1.645 \\to 2.576$), increasing the margin of error $E$ and widening the interval.' },
      ],
      hints: [
        'Think about the value of $z_{\\text{crit}}$ for 90% vs 99% confidence.',
        'A larger $z_{\\text{crit}}$ yields a larger margin of error $E = z_{\\text{crit}} \\frac{\\sigma}{\\sqrt{n}}$.',
      ],
    }
  }

  const options = rng.shuffle([
    { id: 'larger_n_narrower', label: 'Increasing sample size $n$ reduces standard error $\\frac{\\sigma}{\\sqrt{n}}$, resulting in a narrower confidence interval.' },
    { id: 'larger_n_wider', label: 'Increasing sample size $n$ increases standard error, resulting in a wider confidence interval.' },
    { id: 'larger_n_no_effect', label: 'Sample size $n$ does not affect interval width.' },
    { id: 'larger_n_zero_width', label: 'Sample size $n$ has no effect unless $n \\ge 1000$.' },
  ])
  return {
    statement: 'How does increasing the sample size $n$ affect the width of a confidence interval for a population mean?',
    answer: { kind: 'choice', options, correctId: 'larger_n_narrower' },
    solution: [
      { text: 'Since $E = z_{\\text{crit}} \\frac{\\sigma}{\\sqrt{n}}$, increasing $n$ decreases standard error and narrows the interval precision.' },
    ],
    hints: [
      'Look at the denominator $\\sqrt{n}$ in $E = z_{\\text{crit}} \\frac{\\sigma}{\\sqrt{n}}$.',
      'As $n$ increases, $\\frac{\\sigma}{\\sqrt{n}}$ decreases.',
    ],
  }
}

function tier3(rng: Rng): Problem {
  const choice = rng.int(1, 3)
  if (choice === 1) return clinicalCIProblem(rng)
  if (choice === 2) return ciSamplePlanning(rng)
  return ciConceptChoice(rng)
}

export const template: SkillTemplate = {
  skillId: 'conf_interval',
  theory,
  expectedSeconds: { 1: 45, 2: 75, 3: 110 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
