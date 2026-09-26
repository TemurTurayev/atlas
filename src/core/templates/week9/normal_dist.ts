import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'Normal distribution $X \\sim \\mathcal{N}(\\mu, \\sigma^2)$ with mean $\\mu$ and standard deviation $\\sigma$.',
  'The $z$-score standardises $X$: $z = \\dfrac{x - \\mu}{\\sigma}$, representing distance from $\\mu$ in standard deviations.',
  'Finding $x$ from $z$: $x = \\mu + z \\sigma$.',
  'The 68–95–99.7 empirical rule: $P(\\mu - \\sigma < X < \\mu + \\sigma) \\approx 0.68$, $P(\\mu - 2\\sigma < X < \\mu + 2\\sigma) \\approx 0.95$, $P(\\mu - 3\\sigma < X < \\mu + 3\\sigma) \\approx 0.997$.',
  'Symmetry about $\\mu$: $P(X > \\mu) = P(X < \\mu) = 0.5$, $P(X > \\mu + k\\sigma) = P(X < \\mu - k\\sigma)$.',
  'Common mistakes: dividing by $\\sigma^2$ instead of $\\sigma$ when computing $z = (x - \\mu)/\\sigma$, or confusing $P(X > \\mu + \\sigma)$ with $P(|X - \\mu| < \\sigma)$.',
].join('\n')

function zScore(rng: Rng): Problem {
  const mu = rng.int(10, 30) * 5
  const sigma = rng.pick([2, 4, 5, 8, 10, 12, 15, 20])
  const z = rng.pick([-3, -2, -1, 0, 1, 2, 3, -1.5, 1.5, -2.5, 2.5, -0.5, 0.5])
  const x = mu + z * sigma

  return {
    statement: `A variable $X$ is normally distributed with mean $\\mu = ${mu}$ and standard deviation $\\sigma = ${sigma}$. Find the $z$-score for $x = ${x}$.`,
    answer: { kind: 'number', value: String(z) },
    solution: [
      { text: 'Apply the $z$-score formula:', tex: 'z = \\frac{x - \\mu}{\\sigma}' },
      { text: 'Substitute the given values:', tex: `z = \\frac{${x} - ${mu}}{${sigma}} = \\frac{${x - mu}}{${sigma}} = ${z}` },
    ],
    hints: [
      'Use $z = \\frac{x - \\mu}{\\sigma}$.',
      `Subtract $\\mu = ${mu}$ from $x = ${x}$, then divide by $\\sigma = ${sigma}$.`,
    ],
  }
}

function xFromZ(rng: Rng): Problem {
  const mu = rng.int(10, 40) * 5
  const sigma = rng.pick([2, 4, 5, 8, 10, 12, 15])
  const z = rng.pick([-3, -2, -1, 1, 2, 3, -1.5, 1.5, -0.5, 0.5])
  const x = mu + z * sigma

  return {
    statement: `A random variable $X \\sim \\mathcal{N}(${mu}, ${sigma}^2)$ has mean $\\mu = ${mu}$ and standard deviation $\\sigma = ${sigma}$. Find the value $x$ corresponding to a $z$-score of $z = ${z}$.`,
    answer: { kind: 'number', value: String(x) },
    solution: [
      { text: 'Rearrange the $z$-score formula to solve for $x$:', tex: 'x = \\mu + z \\sigma' },
      { text: 'Substitute the given parameters:', tex: `x = ${mu} + (${z}) \\cdot ${sigma} = ${x}` },
    ],
    hints: [
      'Use $x = \\mu + z \\sigma$.',
      `Multiply $z = ${z}$ by $\\sigma = ${sigma}$, then add to $\\mu = ${mu}$.`,
    ],
  }
}

function symmetryProb(rng: Rng): Problem {
  const mu = rng.int(10, 30) * 5
  const sigma = rng.pick([2, 4, 5, 8, 10, 15, 20])
  const mode = rng.int(1, 4)

  if (mode === 1) {
    const isGreater = rng.chance(0.5)
    const op = isGreater ? '>' : '<'
    return {
      statement: `A variable $X \\sim \\mathcal{N}(${mu}, ${sigma}^2)$ has mean $\\mu = ${mu}$ and standard deviation $\\sigma = ${sigma}$. Find $P(X ${op} ${mu})$.`,
      answer: { kind: 'number', value: '0.5' },
      solution: [
        { text: 'The normal distribution is symmetric about its mean $\\mu$:', tex: `P(X > ${mu}) = P(X < ${mu}) = 0.5` },
      ],
      hints: [
        'Recall that the normal curve is symmetric around $\\mu$.',
        'Half the area lies above $\\mu$ and half lies below.',
      ],
    }
  }

  if (mode === 2) {
    const k = rng.pick([1, 2, 3])
    const low = mu - k * sigma
    const high = mu + k * sigma
    const probMap: Record<number, string> = { 1: '0.68', 2: '0.95', 3: '0.997' }
    const ans = probMap[k]

    return {
      statement: `A variable $X \\sim \\mathcal{N}(${mu}, ${sigma}^2)$ has mean $\\mu = ${mu}$ and standard deviation $\\sigma = ${sigma}$. Using the 68–95–99.7 rule, find $P(${low} < X < ${high})$.`,
      answer: { kind: 'number', value: ans },
      solution: [
        { text: `The interval $[${low}, ${high}]$ corresponds to $\\mu \\pm ${k}\\sigma$.` },
        { text: `By the 68–95–99.7 rule, $P(\\mu - ${k}\\sigma < X < \\mu + ${k}\\sigma) = ${ans}$.` },
      ],
      hints: [
        `Check how many standard deviations $${low}$ and $${high}$ are from $\\mu = ${mu}$.`,
        `The interval is $\\mu \\pm ${k}\\sigma$.`,
      ],
    }
  }

  if (mode === 3) {
    const isUpper = rng.chance(0.5)
    const cutoff = isUpper ? mu + sigma : mu - sigma
    const op = isUpper ? '>' : '<'

    return {
      statement: `For $X \\sim \\mathcal{N}(${mu}, ${sigma}^2)$ with $\\mu = ${mu}$ and $\\sigma = ${sigma}$, use the 68–95–99.7 rule to find $P(X ${op} ${cutoff})$.`,
      answer: { kind: 'number', value: '0.16' },
      solution: [
        { text: 'By the 68–95–99.7 rule, $68\\%$ of the distribution lies within $\\mu \\pm \\sigma$.' },
        { text: 'The remaining $32\\%$ is split equally between the two tails ($16\\%$ in each tail):', tex: 'P(X > \\mu + \\sigma) = P(X < \\mu - \\sigma) = \\frac{1 - 0.68}{2} = 0.16' },
      ],
      hints: [
        'Find the tail area outside $\\mu \\pm \\sigma$.',
        'Divide $(1 - 0.68) = 0.32$ by $2$.',
      ],
    }
  }

  const isUpper = rng.chance(0.5)
  const cutoff = isUpper ? mu + 2 * sigma : mu - 2 * sigma
  const op = isUpper ? '>' : '<'

  return {
    statement: `For $X \\sim \\mathcal{N}(${mu}, ${sigma}^2)$ with $\\mu = ${mu}$ and $\\sigma = ${sigma}$, use the 68–95–99.7 rule to find $P(X ${op} ${cutoff})$.`,
    answer: { kind: 'number', value: '0.025' },
    solution: [
      { text: 'By the 68–95–99.7 rule, $95\\%$ of the distribution lies within $\\mu \\pm 2\\sigma$.' },
      { text: 'The remaining $5\\%$ is split equally between the two tails ($2.5\\%$ in each tail):', tex: 'P(X > \\mu + 2\\sigma) = P(X < \\mu - 2\\sigma) = \\frac{1 - 0.95}{2} = 0.025' },
    ],
    hints: [
      'Find the tail area outside $\\mu \\pm 2\\sigma$.',
      'Divide $(1 - 0.95) = 0.05$ by $2$.',
    ],
  }
}

function tier1(rng: Rng): Problem {
  const choice = rng.int(1, 3)
  if (choice === 1) return zScore(rng)
  if (choice === 2) return xFromZ(rng)
  return symmetryProb(rng)
}

function compareZ(rng: Rng): Problem {
  const m1 = rng.int(10, 25) * 5
  const s1 = rng.pick([4, 5, 8, 10])
  const z1 = rng.pick([-2, -1, 1, 2])
  const x1 = m1 + z1 * s1

  const m2 = rng.int(10, 25) * 5
  const s2 = rng.pick([4, 5, 8, 10])
  const z2 = rng.pick([-2, -1, 1, 2])
  const x2 = m2 + z2 * s2

  return {
    statement: `Patient A scores $x_1 = ${x1}$ on Test 1 ($\\mu_1 = ${m1}, \\sigma_1 = ${s1}$). Patient B scores $x_2 = ${x2}$ on Test 2 ($\\mu_2 = ${m2}, \\sigma_2 = ${s2}$). Calculate Patient A's $z$-score.`,
    answer: { kind: 'number', value: String(z1) },
    solution: [
      { text: "Calculate Patient A's $z$-score using $z_1 = \\frac{x_1 - \\mu_1}{\\sigma_1}$:", tex: `z_1 = \\frac{${x1} - ${m1}}{${s1}} = ${z1}` },
      { text: "For comparison, Patient B's $z$-score is:", tex: `z_2 = \\frac{${x2} - ${m2}}{${s2}} = ${z2}` },
    ],
    hints: [
      "Use $z_1 = \\frac{x_1 - \\mu_1}{\\sigma_1}$ for Patient A.",
      `Subtract $\\mu_1 = ${m1}$ from $x_1 = ${x1}$, then divide by $\\sigma_1 = ${s1}$.`,
    ],
  }
}

function empiricalTailProb(rng: Rng): Problem {
  const mu = rng.int(10, 30) * 5
  const sigma = rng.pick([2, 4, 5, 8, 10])
  const mode = rng.int(1, 3)

  if (mode === 1) {
    const cutoff = mu + sigma
    return {
      statement: `For $X \\sim \\mathcal{N}(${mu}, ${sigma}^2)$, use the 68–95–99.7 rule to find $P(X < ${cutoff})$.`,
      answer: { kind: 'number', value: '0.84' },
      solution: [
        { text: 'Split the probability into $P(X < \\mu)$ and $P(\\mu < X < \\mu + \\sigma)$:', tex: 'P(X < \\mu + \\sigma) = P(X < \\mu) + P(\\mu < X < \\mu + \\sigma)' },
        { text: 'Substitute $0.5$ and $0.34$:', tex: 'P(X < \\mu + \\sigma) = 0.5 + 0.34 = 0.84' },
      ],
      hints: [
        'Add the area below the mean ($0.5$) to the area between $\\mu$ and $\\mu + \\sigma$ ($0.34$).',
        '$0.5 + 0.34 = 0.84$.',
      ],
    }
  }

  if (mode === 2) {
    const cutoff = mu + 2 * sigma
    return {
      statement: `For $X \\sim \\mathcal{N}(${mu}, ${sigma}^2)$, use the 68–95–99.7 rule to find $P(X < ${cutoff})$.`,
      answer: { kind: 'number', value: '0.975' },
      solution: [
        { text: 'Split the probability into $P(X < \\mu)$ and $P(\\mu < X < \\mu + 2\\sigma)$:', tex: 'P(X < \\mu + 2\\sigma) = P(X < \\mu) + P(\\mu < X < \\mu + 2\\sigma)' },
        { text: 'Substitute $0.5$ and $0.475$:', tex: 'P(X < \\mu + 2\\sigma) = 0.5 + 0.475 = 0.975' },
      ],
      hints: [
        'Add the area below the mean ($0.5$) to the area between $\\mu$ and $\\mu + 2\\sigma$ ($0.475$).',
        '$0.5 + 0.475 = 0.975$.',
      ],
    }
  }

  const low = mu - sigma
  const high = mu + 2 * sigma
  return {
    statement: `For $X \\sim \\mathcal{N}(${mu}, ${sigma}^2)$, use the 68–95–99.7 rule to find $P(${low} < X < ${high})$.`,
    answer: { kind: 'number', value: '0.815' },
    solution: [
      { text: 'Split the interval at the mean $\\mu$:', tex: `P(${low} < X < ${high}) = P(\\mu - \\sigma < X < \\mu) + P(\\mu < X < \\mu + 2\\sigma)` },
      { text: 'Substitute $0.34$ and $0.475$:', tex: 'P = 0.34 + 0.475 = 0.815' },
    ],
    hints: [
      'Split the interval into $(\\mu - \\sigma, \\mu)$ and $(\\mu, \\mu + 2\\sigma)$.',
      'Add $0.34$ and $0.475$.',
    ],
  }
}

function scaledSumDist(rng: Rng): Problem {
  const mu = rng.int(10, 30) * 5
  const sigma = rng.pick([2, 4, 5, 8, 10])
  const a = rng.pick([2, 3, 4, 5])
  const b = rng.int(1, 20)
  const askMean = rng.chance(0.5)

  if (askMean) {
    const ansMean = a * mu + b
    return {
      statement: `A variable $X$ follows $\\mathcal{N}(${mu}, ${sigma}^2)$. A linear transformation is defined by $Y = ${a}X + ${b}$. Find the mean of $Y$, $E[Y]$.`,
      answer: { kind: 'number', value: String(ansMean) },
      solution: [
        { text: 'Apply linearity of expectation $E[aX + b] = a E[X] + b$:', tex: 'E[Y] = a \\mu + b' },
        { text: 'Substitute values:', tex: `E[Y] = ${a} \\cdot ${mu} + ${b} = ${ansMean}` },
      ],
      hints: [
        'Use $E[aX + b] = a E[X] + b$.',
        `Multiply $a = ${a}$ by $\\mu = ${mu}$, then add $b = ${b}$.`,
      ],
    }
  }

  const ansSD = Math.abs(a) * sigma
  return {
    statement: `A variable $X$ follows $\\mathcal{N}(${mu}, ${sigma}^2)$. A linear transformation is defined by $Y = ${a}X + ${b}$. Find the standard deviation of $Y$, $\\text{SD}(Y)$.`,
    answer: { kind: 'number', value: String(ansSD) },
    solution: [
      { text: 'For standard deviation under linear transformation, $\\text{SD}(aX + b) = |a| \\text{SD}(X)$:', tex: '\\text{SD}(Y) = |a| \\sigma' },
      { text: 'Substitute values:', tex: `\\text{SD}(Y) = |${a}| \\cdot ${sigma} = ${ansSD}` },
    ],
    hints: [
      'Recall that $\\text{SD}(aX + b) = |a| \\sigma$. Adding a constant $b$ does not change variability.',
      `Multiply $|a| = ${Math.abs(a)}$ by $\\sigma = ${sigma}$.`,
    ],
  }
}

function tier2(rng: Rng): Problem {
  const choice = rng.int(1, 3)
  if (choice === 1) return compareZ(rng)
  if (choice === 2) return empiricalTailProb(rng)
  return scaledSumDist(rng)
}

function clinicalRuleProb(rng: Rng): Problem {
  const mu = rng.int(20, 50) * 5
  const sigma = rng.pick([5, 10, 15, 20])
  const k = rng.pick([1, 2])
  const cutoff = mu + k * sigma
  const ans = k === 1 ? '0.16' : '0.025'

  return {
    statement: `Serum cholesterol in a screening population follows $\\mathcal{N}(${mu}, ${sigma}^2)$ with $\\mu = ${mu}$ mg/dL and $\\sigma = ${sigma}$ mg/dL. A level above $x = ${cutoff}$ mg/dL is classified as high risk. What proportion of the population is high risk by the 68–95–99.7 rule?`,
    answer: { kind: 'number', value: ans },
    solution: [
      { text: `Determine the $z$-score for the cutoff $x = ${cutoff}$ mg/dL:`, tex: `z = \\frac{${cutoff} - ${mu}}{${sigma}} = ${k}` },
      { text: `Using the 68–95–99.7 rule, $P(X > \\mu + ${k}\\sigma) = ${ans}$.` },
    ],
    hints: [
      `Compute the $z$-score for $x = ${cutoff}$.`,
      `Find the upper tail probability for $z = ${k}$.`,
    ],
  }
}

function zScoreSolveSigmaOrMu(rng: Rng): Problem {
  const solveSigma = rng.chance(0.5)
  if (solveSigma) {
    const mu = rng.int(10, 30) * 5
    const sigma = rng.pick([2, 4, 5, 8, 10, 12, 15])
    const z = rng.pick([-3, -2, -1, 1, 2, 3])
    const x = mu + z * sigma

    return {
      statement: `An observation $x = ${x}$ corresponds to a $z$-score of $z = ${z}$ in a normal distribution with mean $\\mu = ${mu}$. Find the standard deviation $\\sigma$.`,
      answer: { kind: 'number', value: String(sigma) },
      solution: [
        { text: 'Rearrange the $z$-score formula for $\\sigma$:', tex: '\\sigma = \\frac{x - \\mu}{z}' },
        { text: 'Substitute the given values:', tex: `\\sigma = \\frac{${x} - ${mu}}{${z}} = \\frac{${x - mu}}{${z}} = ${sigma}` },
      ],
      hints: [
        'Use $\\sigma = \\frac{x - \\mu}{z}$.',
        `Subtract $\\mu = ${mu}$ from $x = ${x}$, then divide by $z = ${z}$.`,
      ],
    }
  }

  const sigma = rng.pick([2, 4, 5, 8, 10, 12, 15])
  const z = rng.pick([-3, -2, -1, 1, 2, 3])
  const mu = rng.int(10, 30) * 5
  const x = mu + z * sigma

  return {
    statement: `An observation $x = ${x}$ corresponds to a $z$-score of $z = ${z}$ in a normal distribution with standard deviation $\\sigma = ${sigma}$. Find the mean $\\mu$.`,
    answer: { kind: 'number', value: String(mu) },
    solution: [
      { text: 'Rearrange the $z$-score formula for $\\mu$:', tex: '\\mu = x - z \\sigma' },
      { text: 'Substitute the given values:', tex: `\\mu = ${x} - (${z}) \\cdot ${sigma} = ${mu}` },
    ],
    hints: [
      'Use $\\mu = x - z \\sigma$.',
      `Multiply $z = ${z}$ by $\\sigma = ${sigma}$ and subtract from $x = ${x}$.`,
    ],
  }
}

function conceptChoice(rng: Rng): Problem {
  const isStandardNormal = rng.chance(0.5)

  if (isStandardNormal) {
    const options = rng.shuffle([
      { id: 'mean_0_sd_1', label: 'It has mean $\\mu = 0$ and standard deviation $\\sigma = 1$.' },
      { id: 'mean_1_sd_0', label: 'It has mean $\\mu = 1$ and standard deviation $\\sigma = 0$.' },
      { id: 'skewed_positive', label: 'It is a skewed distribution with values strictly positive.' },
      { id: 'uniform_minus1_to_1', label: 'It is a uniform distribution bounded between $-1$ and $1$.' },
    ])
    return {
      statement: 'Which statement correctly defines the standard normal distribution $\\mathcal{N}(0, 1)$?',
      answer: { kind: 'choice', options, correctId: 'mean_0_sd_1' },
      solution: [
        { text: 'By definition, a standard normal random variable $Z \\sim \\mathcal{N}(0, 1)$ has mean $\\mu = 0$ and variance $\\sigma^2 = 1$.' },
      ],
      hints: [
        'Recall the parameters of $Z \\sim \\mathcal{N}(0, 1)$.',
        'Check the mean and standard deviation.',
      ],
    }
  }

  const options = rng.shuffle([
    { id: 'z_score_unchanged', label: 'The $z$-score remains unchanged because both $(x-\\mu)$ and $\\sigma$ scale by $k$.' },
    { id: 'z_score_multiplied', label: 'The $z$-score is multiplied by $k$.' },
    { id: 'z_score_divided', label: 'The $z$-score is divided by $k$.' },
    { id: 'z_score_squared', label: 'The $z$-score is squared.' },
  ])
  return {
    statement: 'What happens to the $z$-score of an observation $x$ if all observations in a dataset are multiplied by a positive constant $k > 0$?',
    answer: { kind: 'choice', options, correctId: 'z_score_unchanged' },
    solution: [
      { text: 'If $X\' = kX$, then $\\mu\' = k\\mu$ and $\\sigma\' = k\\sigma$, so $z\' = \\frac{kx - k\\mu}{k\\sigma} = \\frac{x-\\mu}{\\sigma} = z$.' },
    ],
    hints: [
      'Consider how multiplication by $k$ affects the deviation $(x-\\mu)$ and standard deviation $\\sigma$.',
      'Look at the ratio $\\frac{k(x-\\mu)}{k\\sigma}$.',
    ],
  }
}

function tier3(rng: Rng): Problem {
  const choice = rng.int(1, 3)
  if (choice === 1) return clinicalRuleProb(rng)
  if (choice === 2) return zScoreSolveSigmaOrMu(rng)
  return conceptChoice(rng)
}

export const template: SkillTemplate = {
  skillId: 'normal_dist',
  theory,
  expectedSeconds: { 1: 45, 2: 75, 3: 110 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
