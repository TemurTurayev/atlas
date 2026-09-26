import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'The standard error of the sample mean measures the variability of sample means: $\\text{SE} = \\frac{\\sigma}{\\sqrt{n}}$.',
  'By the Central Limit Theorem (CLT), for a sufficiently large sample size ($n \\ge 30$), the sampling distribution of $\\bar{X}$ is approximately normal $\\bar{X} \\sim \\mathcal{N}\\left(\\mu, \\frac{\\sigma^2}{n}\\right)$, regardless of population shape.',
  'Scaling sample size: multiplying sample size by $k^2$ divides the standard error by $k$ (e.g. quadrupling $n$ halves $\\text{SE}$).',
  'The $z$-score for a sample mean compares $\\bar{x}$ to $\\mu$ in units of standard error: $z = \\frac{\\bar{x} - \\mu}{\\text{SE}} = \\frac{\\bar{x} - \\mu}{\\sigma / \\sqrt{n}}$.',
  'To achieve a target standard error $E$, the required sample size is $n = \\left(\\frac{\\sigma}{E}\\right)^2$.',
  'Common mistakes: confusing population standard deviation $\\sigma$ with standard error $\\text{SE} = \\frac{\\sigma}{\\sqrt{n}}$, or multiplying $\\text{SE}$ by $\\sqrt{n}$ instead of dividing.',
].join('\n')

interface Context {
  readonly topic: string
  readonly phrase: string
  readonly unit: string
  readonly isTemp?: boolean
}

const CONTEXTS: readonly Context[] = [
  { topic: 'systolic blood pressure', phrase: 'monitoring systolic blood pressure', unit: 'mmHg' },
  { topic: 'serum cholesterol', phrase: 'evaluating serum cholesterol levels', unit: 'mg/dL' },
  { topic: 'fasting blood glucose', phrase: 'measuring fasting blood glucose', unit: 'mg/dL' },
  { topic: 'resting heart rate', phrase: 'monitoring resting heart rate', unit: 'bpm' },
  { topic: 'plasma hemoglobin', phrase: 'evaluating plasma hemoglobin levels', unit: 'g/dL' },
  { topic: 'liver enzyme activity', phrase: 'measuring liver enzyme ALT activity', unit: 'U/L' },
  { topic: 'plasma drug concentration', phrase: 'monitoring plasma drug concentration', unit: 'ng/mL' },
  { topic: 'body temperature', phrase: 'measuring core body temperature', unit: '°C', isTemp: true },
  { topic: 'serum triglycerides', phrase: 'evaluating serum triglyceride levels', unit: 'mg/dL' },
  { topic: 'forced expiratory volume', phrase: 'measuring forced expiratory volume FEV1', unit: 'L' },
]

function round3(val: number): number {
  return Math.round(val * 1000) / 1000
}

function calculateSE(rng: Rng): Problem {
  const ctx = rng.pick(CONTEXTS)
  let sqrtN: number
  let sigma: number
  let se: number

  if (ctx.isTemp) {
    sqrtN = rng.pick([5, 10])
    const nTemp = sqrtN * sqrtN
    sigma = 0.5
    se = round3(sigma / sqrtN)
    return {
      statement: `In a clinical study ${ctx.phrase}, the population standard deviation is $\\sigma = ${sigma}\\text{ ${ctx.unit}}$. For a sample of size $n = ${nTemp}$, calculate the standard error of the mean $\\text{SE}$.`,
      answer: { kind: 'number', value: String(se) },
      solution: [
        { text: 'Apply the formula for the standard error of the mean:', tex: '\\text{SE} = \\frac{\\sigma}{\\sqrt{n}}' },
        { text: 'Substitute the given values:', tex: `\\text{SE} = \\frac{${sigma}}{\\sqrt{${nTemp}}} = \\frac{${sigma}}{${sqrtN}} = ${se}` },
      ],
      hints: [
        'Use the standard error formula $\\text{SE} = \\frac{\\sigma}{\\sqrt{n}}$.',
        `Calculate $\\sqrt{${nTemp}} = ${sqrtN}$, then divide $\\sigma = ${sigma}$ by ${sqrtN}.`,
      ],
    }
  }

  sqrtN = rng.pick([2, 3, 4, 5, 6, 7, 8, 10])
  const n = sqrtN * sqrtN
  const mult = rng.pick([1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20])
  sigma = sqrtN * mult
  se = mult

  return {
    statement: `In a clinical study ${ctx.phrase}, the population standard deviation is $\\sigma = ${sigma}\\text{ ${ctx.unit}}$. For a sample of size $n = ${n}$, calculate the standard error of the mean $\\text{SE}$.`,
    answer: { kind: 'number', value: String(se) },
    solution: [
      { text: 'Apply the formula for the standard error of the mean:', tex: '\\text{SE} = \\frac{\\sigma}{\\sqrt{n}}' },
      { text: 'Substitute the given values:', tex: `\\text{SE} = \\frac{${sigma}}{\\sqrt{${n}}} = \\frac{${sigma}}{${sqrtN}} = ${se}` },
    ],
    hints: [
      'Use the standard error formula $\\text{SE} = \\frac{\\sigma}{\\sqrt{n}}$.',
      `Calculate $\\sqrt{${n}} = ${sqrtN}$, then divide $\\sigma = ${sigma}$ by ${sqrtN}.`,
    ],
  }
}

function scaleSE(rng: Rng): Problem {
  const ctx = rng.pick(CONTEXTS)
  const sqrtN1 = rng.pick([2, 3, 4, 5])
  const n1 = sqrtN1 * sqrtN1
  const k = rng.pick([2, 3, 4, 5])
  const n2 = k * k * n1

  if (ctx.isTemp) {
    const se1 = 0.2
    const se2 = round3(se1 / k)
    return {
      statement: `A medical trial ${ctx.phrase} with $n_1 = ${n1}$ patients has a standard error of $\\text{SE}_1 = ${se1}\\text{ ${ctx.unit}}$. If the sample size is increased to $n_2 = ${n2}$, what is the new standard error $\\text{SE}_2$?`,
      answer: { kind: 'number', value: String(se2) },
      solution: [
        { text: 'Determine the factor by which sample size increases:', tex: `\\frac{n_2}{n_1} = \\frac{${n2}}{${n1}} = ${k * k} = ${k}^2` },
        { text: 'Standard error decreases by a factor of $k = \\sqrt{k^2}$:', tex: `\\text{SE}_2 = \\frac{\\text{SE}_1}{${k}} = \\frac{${se1}}{${k}} = ${se2}` },
      ],
      hints: [
        `Notice that $n_2 = ${n2}$ is ${k * k} times $n_1 = ${n1}$.`,
        `Divide $\\text{SE}_1 = ${se1}$ by $\\sqrt{${k * k}} = ${k}$ to get $\\text{SE}_2 = ${se2}$.`,
      ],
    }
  }

  const se1 = rng.pick([6, 8, 12, 16, 20, 24, 30])
  const se2 = se1 / k

  return {
    statement: `A medical trial ${ctx.phrase} with $n_1 = ${n1}$ patients has a standard error of $\\text{SE}_1 = ${se1}\\text{ ${ctx.unit}}$. If the sample size is increased to $n_2 = ${n2}$, what is the new standard error $\\text{SE}_2$?`,
    answer: { kind: 'number', value: String(se2) },
    solution: [
      { text: 'Determine the factor by which sample size increases:', tex: `\\frac{n_2}{n_1} = \\frac{${n2}}{${n1}} = ${k * k} = ${k}^2` },
      { text: 'Standard error decreases by a factor of $k = \\sqrt{k^2}$:', tex: `\\text{SE}_2 = \\frac{\\text{SE}_1}{${k}} = \\frac{${se1}}{${k}} = ${se2}` },
    ],
    hints: [
      `Notice that $n_2 = ${n2}$ is ${k * k} times $n_1 = ${n1}$.`,
      `Since $\\text{SE}$ is inversely proportional to $\\sqrt{n}$, divide $\\text{SE}_1 = ${se1}$ by $\\sqrt{${k * k}} = ${k}$.`,
    ],
  }
}

function samplingDistSD(rng: Rng): Problem {
  const ctx = rng.pick(CONTEXTS)
  const mu = ctx.isTemp ? 37 : rng.int(6, 20) * 10
  const sqrtN = rng.pick([3, 4, 5, 6, 8, 10])
  const n = sqrtN * sqrtN
  const se = ctx.isTemp ? 0.05 : rng.pick([2, 3, 4, 5, 6, 8, 10])
  const sigma = round3(sqrtN * se)

  return {
    statement: `In a study ${ctx.phrase}, the population has mean $\\mu = ${mu}\\text{ ${ctx.unit}}$ and standard deviation $\\sigma = ${sigma}\\text{ ${ctx.unit}}$. For random samples of size $n = ${n}$, what is the standard deviation of the sampling distribution of the sample mean $\\bar{X}$?`,
    answer: { kind: 'number', value: String(se) },
    solution: [
      { text: 'The standard deviation of the sampling distribution of $\\bar{X}$ is the standard error $\\sigma_{\\bar{X}} = \\text{SE}$:', tex: '\\sigma_{\\bar{X}} = \\frac{\\sigma}{\\sqrt{n}}' },
      { text: 'Substitute values:', tex: `\\sigma_{\\bar{X}} = \\frac{${sigma}}{\\sqrt{${n}}} = \\frac{${sigma}}{${sqrtN}} = ${se}` },
    ],
    hints: [
      'The standard deviation of the sample mean $\\bar{X}$ is $\\sigma_{\\bar{X}} = \\frac{\\sigma}{\\sqrt{n}}$.',
      `Divide $\\sigma = ${sigma}$ by $\\sqrt{${n}} = ${sqrtN}$.`,
    ],
  }
}

function tier1(rng: Rng): Problem {
  const choice = rng.int(1, 3)
  if (choice === 1) return calculateSE(rng)
  if (choice === 2) return scaleSE(rng)
  return samplingDistSD(rng)
}

function zForSampleMean(rng: Rng): Problem {
  const ctx = rng.pick(CONTEXTS)
  const mu = ctx.isTemp ? 37 : rng.int(8, 20) * 10
  const sqrtN = rng.pick([2, 3, 4, 5, 6, 8, 10])
  const n = sqrtN * sqrtN
  const se = ctx.isTemp ? 0.1 : rng.pick([1, 2, 3, 4, 5, 6, 8])
  const sigma = round3(sqrtN * se)
  const z = rng.pick([-3, -2.5, -2, -1.5, -1, 1, 1.5, 2, 2.5, 3])
  const xbar = round3(mu + z * se)

  return {
    statement: `In a clinical trial ${ctx.phrase}, population mean is $\\mu = ${mu}\\text{ ${ctx.unit}}$ and $\\sigma = ${sigma}\\text{ ${ctx.unit}}$. A sample of size $n = ${n}$ gives sample mean $\\bar{x} = ${xbar}\\text{ ${ctx.unit}}$. Calculate the $z$-score for this sample mean.`,
    answer: { kind: 'number', value: String(z) },
    solution: [
      { text: 'Calculate the standard error:', tex: `\\text{SE} = \\frac{\\sigma}{\\sqrt{n}} = \\frac{${sigma}}{\\sqrt{${n}}} = ${se}` },
      { text: 'Compute the $z$-score:', tex: `z = \\frac{\\bar{x} - \\mu}{\\text{SE}} = \\frac{${xbar} - ${mu}}{${se}} = ${z}` },
    ],
    hints: [
      'First compute $\\text{SE} = \\frac{\\sigma}{\\sqrt{n}}$.',
      `Then calculate $z = \\frac{\\bar{x} - \\mu}{\\text{SE}} = \\frac{${xbar} - ${mu}}{${se}}$.`,
    ],
  }
}

function sampleSizeForSETarget(rng: Rng): Problem {
  const ctx = rng.pick(CONTEXTS)
  const targetE = ctx.isTemp ? 0.1 : rng.pick([1, 2, 3, 4, 5])
  const r = rng.int(2, 10)
  const sigma = round3(r * targetE)
  const n = r * r

  return {
    statement: `A researcher planning a study ${ctx.phrase} requires the standard error of the mean to be at most $E = ${targetE}\\text{ ${ctx.unit}}$. Given population standard deviation $\\sigma = ${sigma}\\text{ ${ctx.unit}}$, what minimum sample size $n$ is required?`,
    answer: { kind: 'number', value: String(n) },
    solution: [
      { text: 'Set up the standard error condition $\\text{SE} \\le E$:', tex: '\\frac{\\sigma}{\\sqrt{n}} \\le E \\implies \\sqrt{n} \\ge \\frac{\\sigma}{E}' },
      { text: 'Substitute values and solve for $n$:', tex: `n = \\left(\\frac{${sigma}}{${targetE}}\\right)^2 = ${r}^2 = ${n}` },
    ],
    hints: [
      'Use $n = \\left(\\frac{\\sigma}{E}\\right)^2$.',
      `Divide $\\sigma = ${sigma}$ by $E = ${targetE}$ to get ${r}, then square to get $n = ${n}$.`,
    ],
  }
}

function solveXbarFromZ(rng: Rng): Problem {
  const ctx = rng.pick(CONTEXTS)
  const mu = ctx.isTemp ? 37 : rng.int(5, 15) * 10
  const sqrtN = rng.pick([2, 4, 5, 10])
  const n = sqrtN * sqrtN
  const se = ctx.isTemp ? 0.1 : rng.pick([2, 4, 5, 10])
  const sigma = round3(sqrtN * se)
  const z = rng.pick([-2, -1, 1, 2])
  const xbar = round3(mu + z * se)

  return {
    statement: `In a study ${ctx.phrase} with $\\mu = ${mu}\\text{ ${ctx.unit}}$, $\\sigma = ${sigma}\\text{ ${ctx.unit}}$, and sample size $n = ${n}$, a sample mean has $z$-score $z = ${z}$. Find the sample mean $\\bar{x}$.`,
    answer: { kind: 'number', value: String(xbar) },
    solution: [
      { text: 'Calculate the standard error:', tex: `\\text{SE} = \\frac{\\sigma}{\\sqrt{n}} = \\frac{${sigma}}{${sqrtN}} = ${se}` },
      { text: 'Solve $\\bar{x} = \\mu + z \\cdot \\text{SE}$:', tex: `\\bar{x} = ${mu} + (${z}) \\cdot ${se} = ${xbar}` },
    ],
    hints: [
      'Rearrange $z = \\frac{\\bar{x} - \\mu}{\\text{SE}}$ to $\\bar{x} = \\mu + z \\cdot \\text{SE}$.',
      `First compute $\\text{SE} = ${se}$, then $\\bar{x} = ${mu} + (${z})(${se}) = ${xbar}$.`,
    ],
  }
}

function tier2(rng: Rng): Problem {
  const choice = rng.int(1, 3)
  if (choice === 1) return zForSampleMean(rng)
  if (choice === 2) return sampleSizeForSETarget(rng)
  return solveXbarFromZ(rng)
}

function clinicalCompareSE(rng: Rng): Problem {
  const ctx = rng.pick(CONTEXTS.filter((c) => !c.isTemp))
  const sqrtN1 = rng.pick([4, 5, 8, 10])
  const sqrtN2 = rng.pick([2, 3, 4, 5])
  const n1 = sqrtN1 * sqrtN1
  const n2 = sqrtN2 * sqrtN2
  const se1 = rng.pick([2, 3, 4, 5])
  const se2 = rng.pick([6, 8, 10])
  const sigma1 = sqrtN1 * se1
  const sigma2 = sqrtN2 * se2
  const diffSE = se2 - se1

  return {
    statement: `In a trial ${ctx.phrase}, Group A has $n_1 = ${n1}$ with $\\sigma_1 = ${sigma1}\\text{ ${ctx.unit}}$, and Group B has $n_2 = ${n2}$ with $\\sigma_2 = ${sigma2}\\text{ ${ctx.unit}}$. By how much does the standard error of Group B exceed that of Group A?`,
    answer: { kind: 'number', value: String(diffSE) },
    solution: [
      { text: 'Compute standard error for Group A:', tex: `\\text{SE}_A = \\frac{${sigma1}}{\\sqrt{${n1}}} = \\frac{${sigma1}}{${sqrtN1}} = ${se1}` },
      { text: 'Compute standard error for Group B:', tex: `\\text{SE}_B = \\frac{${sigma2}}{\\sqrt{${n2}}} = \\frac{${sigma2}}{${sqrtN2}} = ${se2}` },
      { text: 'Calculate the difference $\\text{SE}_B - \\text{SE}_A$:', tex: `\\text{SE}_B - \\text{SE}_A = ${se2} - ${se1} = ${diffSE}` },
    ],
    hints: [
      'Calculate $\\text{SE}_A = \\frac{\\sigma_1}{\\sqrt{n_1}}$ and $\\text{SE}_B = \\frac{\\sigma_2}{\\sqrt{n_2}}$.',
      `Subtract $\\text{SE}_A = ${se1}$ from $\\text{SE}_B = ${se2}$.`,
    ],
  }
}

function cltSampleMeanProb(rng: Rng): Problem {
  const ctx = rng.pick(CONTEXTS)
  const mu = ctx.isTemp ? 37 : rng.int(8, 15) * 10
  const sqrtN = rng.pick([4, 5, 6, 10])
  const n = sqrtN * sqrtN
  const se = ctx.isTemp ? 0.1 : rng.pick([2, 4, 5, 10])
  const sigma = round3(sqrtN * se)
  const zChoice = rng.pick([1, 2, 3])
  const probType = rng.pick(['upper', 'lower', 'central'])

  let statement: string
  let ansStr: string
  let valTex: string

  if (probType === 'upper') {
    const target = round3(mu + zChoice * se)
    statement = `A population parameter for ${ctx.topic} has $\\mu = ${mu}\\text{ ${ctx.unit}}$ and $\\sigma = ${sigma}\\text{ ${ctx.unit}}$. For samples of size $n = ${n}$, use the Central Limit Theorem and empirical rule to find $P(\\bar{X} > ${target})$.`
    const ansVal = zChoice === 1 ? 0.16 : zChoice === 2 ? 0.025 : 0.0015
    ansStr = String(ansVal)
    valTex = `P(Z > ${zChoice}) = ${ansVal}`
  } else if (probType === 'lower') {
    const target = round3(mu - zChoice * se)
    statement = `A population parameter for ${ctx.topic} has $\\mu = ${mu}\\text{ ${ctx.unit}}$ and $\\sigma = ${sigma}\\text{ ${ctx.unit}}$. For samples of size $n = ${n}$, use the Central Limit Theorem and empirical rule to find $P(\\bar{X} < ${target})$.`
    const ansVal = zChoice === 1 ? 0.16 : zChoice === 2 ? 0.025 : 0.0015
    ansStr = String(ansVal)
    valTex = `P(Z < -${zChoice}) = ${ansVal}`
  } else {
    const low = round3(mu - zChoice * se)
    const high = round3(mu + zChoice * se)
    statement = `A population parameter for ${ctx.topic} has $\\mu = ${mu}\\text{ ${ctx.unit}}$ and $\\sigma = ${sigma}\\text{ ${ctx.unit}}$. For samples of size $n = ${n}$, use the empirical rule to find $P(${low} < \\bar{X} < ${high})$.`
    const ansVal = zChoice === 1 ? 0.68 : zChoice === 2 ? 0.95 : 0.997
    ansStr = String(ansVal)
    valTex = `P(-${zChoice} < Z < ${zChoice}) = ${ansVal}`
  }

  return {
    statement,
    answer: { kind: 'number', value: ansStr },
    solution: [
      { text: 'Calculate standard error:', tex: `\\text{SE} = \\frac{\\sigma}{\\sqrt{n}} = \\frac{${sigma}}{${sqrtN}} = ${se}` },
      { text: 'Apply the empirical rule cutoffs:', tex: valTex },
    ],
    hints: [
      `First compute $\\text{SE} = \\frac{${sigma}}{\\sqrt{${n}}} = ${se}$.`,
      'Determine the number of standard errors from $\\mu$ and use the empirical rule (68-95-99.7%).',
    ],
    inputHint: 'A decimal value.',
  }
}

function cltConceptChoice(rng: Rng): Problem {
  const variant = rng.pick([1, 2, 3])

  if (variant === 1) {
    const options = rng.shuffle([
      { id: 'clt_normal_shape', label: 'The sampling distribution of $\\bar{X}$ approaches a normal distribution as sample size $n$ increases, regardless of population shape.' },
      { id: 'population_becomes_normal', label: 'The original population distribution becomes normal as sample size $n$ increases.' },
      { id: 'se_increases_with_n', label: 'The standard error of the mean increases proportionally with $\\sqrt{n}$.' },
      { id: 'sample_sd_equals_pop_sd', label: 'The sample standard deviation becomes zero for sample sizes $n \\ge 30$.' },
    ])
    return {
      statement: 'Which statement correctly describes the primary conclusion of the Central Limit Theorem (CLT)?',
      answer: { kind: 'choice', options, correctId: 'clt_normal_shape' },
      solution: [
        { text: 'The Central Limit Theorem states that for large sample sizes ($n \\ge 30$), the sampling distribution of the sample mean $\\bar{X}$ is approximately normal.' },
      ],
      hints: [
        'Focus on the distribution of the sample mean $\\bar{X}$, not raw individual population data.',
        'Recall that $\\text{SE} = \\frac{\\sigma}{\\sqrt{n}}$ decreases as $n$ increases.',
      ],
    }
  }

  if (variant === 2) {
    const options = rng.shuffle([
      { id: 'se_decreases', label: 'The standard error of the mean decreases by a factor of 2.' },
      { id: 'se_halves_squared', label: 'The standard error decreases by a factor of 4.' },
      { id: 'se_doubles', label: 'The standard error doubles in magnitude.' },
      { id: 'se_unchanged', label: 'The standard error remains unchanged.' },
    ])
    return {
      statement: 'What happens to the standard error of the sample mean $\\text{SE} = \\frac{\\sigma}{\\sqrt{n}}$ when the sample size $n$ is quadrupled ($n \\to 4n$)?',
      answer: { kind: 'choice', options, correctId: 'se_decreases' },
      solution: [
        { text: 'Since $\\text{SE} = \\frac{\\sigma}{\\sqrt{n}}$, quadrupling $n$ multiplies the denominator by $\\sqrt{4} = 2$, halving the standard error.' },
      ],
      hints: [
        'Substitute $4n$ into the standard error formula.',
        'Evaluate $\\sqrt{4n} = 2\\sqrt{n}$.',
      ],
    }
  }

  const options = rng.shuffle([
    { id: 'sample_size_30', label: 'Sample size $n \\ge 30$ ensures approximate normality for most continuous populations.' },
    { id: 'population_must_be_normal', label: 'The underlying population must already be perfectly normally distributed for any sample size.' },
    { id: 'sample_must_be_small', label: 'Sample size must be small ($n \\le 10$) to prevent over-smoothing.' },
    { id: 'sd_must_be_zero', label: 'Population standard deviation $\\sigma$ must be zero.' },
  ])
  return {
    statement: 'Which condition is typically sufficient for applying the Central Limit Theorem to a moderately skewed population?',
    answer: { kind: 'choice', options, correctId: 'sample_size_30' },
    solution: [
      { text: 'A sample size of $n \\ge 30$ is standard in inferential statistics for applying the CLT to non-normal continuous populations.' },
    ],
    hints: [
      'Think about the standard sample size threshold used for the Central Limit Theorem.',
      'A rule of thumb is $n \\ge 30$.',
    ],
  }
}

function tier3(rng: Rng): Problem {
  const choice = rng.int(1, 3)
  if (choice === 1) return clinicalCompareSE(rng)
  if (choice === 2) return cltSampleMeanProb(rng)
  return cltConceptChoice(rng)
}

export const template: SkillTemplate = {
  skillId: 'std_error',
  theory,
  expectedSeconds: { 1: 45, 2: 75, 3: 110 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
