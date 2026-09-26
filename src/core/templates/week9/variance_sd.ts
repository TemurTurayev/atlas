import { rat, ratToLatex } from '../../math/rational'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'Population variance $\\sigma^2 = \\frac{1}{n} \\sum_{i=1}^n (x_i - \\mu)^2$ divides by $n$, where $\\mu$ is the population mean.',
  'Sample variance $s^2 = \\frac{1}{n-1} \\sum_{i=1}^n (x_i - \\bar{x})^2$ divides by $n-1$, where $\\bar{x}$ is the sample mean.',
  'Population standard deviation is $\\sigma = \\sqrt{\\sigma^2}$; sample standard deviation is $s = \\sqrt{s^2}$.',
  'Summary statistic formula: $\\sum_{i=1}^n (x_i - \\bar{x})^2 = \\sum_{i=1}^n x_i^2 - n \\bar{x}^2$.',
  'Linear transformation: if $y_i = a x_i + b$, then $\\text{Var}(Y) = a^2 \\text{Var}(X)$ and $\\text{SD}(Y) = |a| \\text{SD}(X)$.',
  'Common mistakes: confusing population variance (divide by $n$) with sample variance (divide by $n-1$), or forgetting to square deviations before summing.',
].join('\n')

function popVariance(rng: Rng): Problem {
  const n = rng.pick([4, 5, 6, 8])
  const mu = rng.int(5, 35)

  let devs: number[]
  if (n === 4) {
    const pairs: [number, number][] = [
      [1, 3], [1, 5], [2, 4], [1, 7], [3, 5], [2, 6], [3, 7], [4, 6], [2, 8], [3, 9], [4, 8],
    ]
    const [a, b] = rng.pick(pairs)
    devs = [-b, -a, a, b]
  } else if (n === 5) {
    const pairs: [number, number][] = [
      [1, 2], [1, 3], [2, 4], [3, 4], [1, 7], [2, 6], [3, 6], [4, 7], [2, 8], [3, 8], [5, 10],
    ]
    const [a, b] = rng.pick(pairs)
    devs = [-b, -a, 0, a, b]
  } else if (n === 6) {
    const triplets: [number, number, number][] = [
      [1, 2, 3], [1, 1, 2], [2, 2, 4], [1, 2, 4], [2, 3, 4], [1, 3, 5], [2, 4, 6], [3, 5, 7],
    ]
    const [a, b, c] = rng.pick(triplets)
    devs = [-c, -b, -a, a, b, c]
  } else {
    const quads: [number, number, number, number][] = [
      [1, 2, 3, 4], [1, 2, 4, 5], [2, 3, 5, 6], [1, 3, 5, 7],
    ]
    const [a, b, c, d] = rng.pick(quads)
    devs = [-d, -c, -b, -a, a, b, c, d]
  }

  const data = devs.map((d) => mu + d)
  const list = rng.shuffle(data)
  const sumSq = devs.reduce((acc, d) => acc + d * d, 0)

  const varRat = rat(sumSq, n)
  const varTex = ratToLatex(varRat)

  const unreducedTex = `\\frac{${sumSq}}{${n}}`
  const texStep = unreducedTex === varTex ? varTex : `${unreducedTex} = ${varTex}`

  return {
    statement: `Find the population variance $\\sigma^2$ (divide by $n$) of the dataset: $${list.join(', ')}$.`,
    answer: { kind: 'number', value: varTex },
    solution: [
      { text: 'First find the population mean $\\mu$:', tex: `\\mu = \\frac{${list.join(' + ')}}{${n}} = ${mu}` },
      { text: 'Calculate the squared deviations $(x_i - \\mu)^2$ and sum them:', tex: `\\sum (x_i - ${mu})^2 = ${sumSq}` },
      { text: `Divide the sum of squared deviations by $n = ${n}$:`, tex: `\\sigma^2 = ${texStep}` },
    ],
    hints: [
      'First calculate the population mean $\\mu$, then sum the squared deviations $(x_i - \\mu)^2$.',
      `Divide the total sum of squared deviations $${sumSq}$ by $n = ${n}$.`,
    ],
    inputHint: 'An integer or fraction.',
  }
}

function sampleSD(rng: Rng): Problem {
  const s = rng.int(1, 15)
  const meanVal = rng.int(10, 60)
  const shape = rng.pick(['n3', 'n5'])

  let devs: number[]
  if (shape === 'n3') {
    devs = [-s, 0, s]
  } else {
    devs = [-s, -s, 0, s, s]
  }

  const n = devs.length
  const sumSq = devs.reduce((acc, d) => acc + d * d, 0)
  const raw = devs.map((d) => meanVal + d)
  const list = rng.shuffle(raw)
  const degFreedom = n - 1

  return {
    statement: `Find the sample standard deviation $s$ (divide by $n-1$) of the dataset: $${list.join(', ')}$.`,
    answer: { kind: 'number', value: String(s) },
    solution: [
      { text: 'Calculate the sample mean $\\bar{x}$:', tex: `\\bar{x} = \\frac{${list.join(' + ')}}{${n}} = ${meanVal}` },
      { text: 'Find the sum of squared deviations:', tex: `\\sum (x_i - \\bar{x})^2 = ${sumSq}` },
      { text: `Divide by $n-1 = ${degFreedom}$ to get sample variance $s^2$, then take $\\sqrt{s^2}$:`, tex: `s^2 = \\frac{${sumSq}}{${degFreedom}} = ${s * s} \\ \\Longrightarrow\\ s = ${s}` },
    ],
    hints: [
      'Calculate the sample mean $\\bar{x}$, find the squared deviations $(x_i - \\bar{x})^2$, and sum them.',
      `Divide the sum of squared deviations by $n-1 = ${degFreedom}$ to get the sample variance $s^2$, then take the square root.`,
    ],
    inputHint: 'A positive integer.',
  }
}

function sampleVariance(rng: Rng): Problem {
  const s = rng.int(2, 12)
  const s2 = s * s
  const meanVal = rng.int(10, 50)
  const devs = [-s, -s, 0, s, s]
  const raw = devs.map((d) => meanVal + d)
  const list = rng.shuffle(raw)

  return {
    statement: `Find the sample variance $s^2$ (divide by $n-1$) of the dataset: $${list.join(', ')}$.`,
    answer: { kind: 'number', value: String(s2) },
    solution: [
      { text: 'Calculate the sample mean $\\bar{x}$:', tex: `\\bar{x} = \\frac{${list.join(' + ')}}{5} = ${meanVal}` },
      { text: 'Find the sum of squared deviations:', tex: `\\sum (x_i - \\bar{x})^2 = ${4 * s2}` },
      { text: 'Divide by $n-1 = 4$:', tex: `s^2 = \\frac{${4 * s2}}{4} = ${s2}` },
    ],
    hints: [
      'Calculate the sample mean $\\bar{x}$ and sum the squared deviations.',
      'Divide the sum of squared deviations by $n-1 = 4$.',
    ],
    inputHint: 'An integer.',
  }
}

function tier1(rng: Rng): Problem {
  const choice = rng.int(1, 3)
  if (choice === 1) return popVariance(rng)
  if (choice === 2) return sampleSD(rng)
  return sampleVariance(rng)
}

function transformVarianceSD(rng: Rng): Problem {
  const askVar = rng.chance(0.5)
  const a = rng.intExcept(-8, 8, [-1, 0, 1])
  const b = rng.intExcept(-15, 15, [0])
  const bSign = b > 0 ? `+ ${b}` : `- ${Math.abs(b)}`

  if (askVar) {
    const origVar = rng.int(2, 25)
    const newVar = a * a * origVar
    return {
      statement: `A dataset $X$ has a population variance of $\\sigma_X^2 = ${origVar}$. A new dataset $Y$ is created by setting $y_i = ${a}x_i ${bSign}$. Find the population variance $\\sigma_Y^2$ of dataset $Y$.`,
      answer: { kind: 'number', value: String(newVar) },
      solution: [
        { text: 'Apply the variance linear transformation rule:', tex: '\\text{Var}(aX + b) = a^2 \\text{Var}(X)' },
        { text: `Substitute $a = ${a}$ and $\\text{Var}(X) = ${origVar}$:`, tex: `\\sigma_Y^2 = (${a})^2 \\cdot ${origVar} = ${a * a} \\cdot ${origVar} = ${newVar}` },
      ],
      hints: [
        'Recall the variance transformation rule: $\\text{Var}(aX + b) = a^2 \\text{Var}(X)$.',
        `Multiply the original variance $${origVar}$ by $a^2 = ${a * a}$.`,
      ],
      inputHint: 'An integer.',
    }
  }

  const origSD = rng.int(2, 20)
  const newSD = Math.abs(a) * origSD
  return {
    statement: `A dataset $X$ has a population standard deviation of $\\sigma_X = ${origSD}$. A new dataset $Y$ is created by setting $y_i = ${a}x_i ${bSign}$. Find the population standard deviation $\\sigma_Y$ of dataset $Y$.`,
    answer: { kind: 'number', value: String(newSD) },
    solution: [
      { text: 'Apply the standard deviation linear transformation rule:', tex: '\\text{SD}(aX + b) = |a| \\text{SD}(X)' },
      { text: `Substitute $a = ${a}$ and $\\text{SD}(X) = ${origSD}$:`, tex: `\\sigma_Y = |${a}| \\cdot ${origSD} = ${Math.abs(a)} \\cdot ${origSD} = ${newSD}` },
    ],
    hints: [
      'Recall the standard deviation transformation rule: $\\text{SD}(aX + b) = |a| \\text{SD}(X)$.',
      `Multiply the original standard deviation $${origSD}$ by $|a| = ${Math.abs(a)}$.`,
    ],
    inputHint: 'An integer.',
  }
}

function sumSquaresFormula(rng: Rng): Problem {
  const n = rng.pick([5, 10, 15, 20, 25, 30])
  const mu = rng.int(5, 40)
  const varVal = rng.int(2, 25)
  const sumX = n * mu
  const sumX2 = n * (varVal + mu * mu)

  return {
    statement: `A dataset of $n = ${n}$ observations has sum $\\sum_{i=1}^{${n}} x_i = ${sumX}$ and sum of squares $\\sum_{i=1}^{${n}} x_i^2 = ${sumX2}$. Find its population variance $\\sigma^2$ (divide by $n$).`,
    answer: { kind: 'number', value: String(varVal) },
    solution: [
      { text: 'Use the summary statistic formula for population variance:', tex: '\\sigma^2 = \\frac{1}{n} \\sum_{i=1}^n x_i^2 - \\bar{x}^2' },
      { text: 'Compute the mean $\\bar{x}$:', tex: `\\bar{x} = \\frac{${sumX}}{${n}} = ${mu}` },
      { text: 'Substitute the values into the formula:', tex: `\\sigma^2 = \\frac{${sumX2}}{${n}} - (${mu})^2 = ${sumX2 / n} - ${mu * mu} = ${varVal}` },
    ],
    hints: [
      'Use the computational formula: $\\sigma^2 = \\frac{1}{n} \\sum x_i^2 - \\bar{x}^2$.',
      `Compute $\\bar{x} = \\frac{${sumX}}{${n}}$, then evaluate $\\frac{${sumX2}}{${n}} - \\bar{x}^2$.`,
    ],
    inputHint: 'An integer.',
  }
}

function populationSDFromVariance(rng: Rng): Problem {
  const s = rng.int(3, 16)
  const varVal = s * s
  const mu = rng.int(10, 50)
  const n = rng.pick([5, 10, 20])
  const sumX = n * mu
  const sumX2 = n * (varVal + mu * mu)

  return {
    statement: `A dataset of $n = ${n}$ observations has sum $\\sum_{i=1}^{${n}} x_i = ${sumX}$ and sum of squares $\\sum_{i=1}^{${n}} x_i^2 = ${sumX2}$. Find its population standard deviation $\\sigma$.`,
    answer: { kind: 'number', value: String(s) },
    solution: [
      { text: 'First find the population variance $\\sigma^2$:', tex: '\\sigma^2 = \\frac{1}{n} \\sum_{i=1}^n x_i^2 - \\bar{x}^2' },
      { text: 'Evaluate the variance:', tex: `\\sigma^2 = \\frac{${sumX2}}{${n}} - (${mu})^2 = ${sumX2 / n} - ${mu * mu} = ${varVal}` },
      { text: 'Take the square root to find $\\sigma$:', tex: `\\sigma = \\sqrt{${varVal}} = ${s}` },
    ],
    hints: [
      'Compute population variance $\\sigma^2 = \\frac{1}{n}\\sum x_i^2 - \\bar{x}^2$ first.',
      `Take the square root of $\\sigma^2 = ${varVal}$.`,
    ],
    inputHint: 'An integer.',
  }
}

function tier2(rng: Rng): Problem {
  const choice = rng.int(1, 3)
  if (choice === 1) return transformVarianceSD(rng)
  if (choice === 2) return sumSquaresFormula(rng)
  return populationSDFromVariance(rng)
}

function pooledVariance(rng: Rng): Problem {
  const n1 = rng.int(4, 15)
  const n2 = rng.int(4, 15)
  const mu = rng.int(10, 40)
  const V = rng.int(5, 30)
  const k = rng.pick([1, 2, 3, 4, -1, -2, -3, -4])

  let v1 = V + k * n2
  let v2 = V - k * n1

  if (v1 <= 0 || v2 <= 0) {
    v1 = V
    v2 = V
  }

  const totalN = n1 + n2
  const totSqDev = n1 * v1 + n2 * v2

  const varRat = rat(totSqDev, totalN)
  const varTex = ratToLatex(varRat)
  const unreducedTex = `\\frac{${totSqDev}}{${totalN}}`
  const texStep = unreducedTex === varTex ? varTex : `${unreducedTex} = ${varTex}`

  return {
    statement: `Group 1 has $n_1 = ${n1}$ values with mean $\\mu = ${mu}$ and population variance $\\sigma_1^2 = ${v1}$. Group 2 has $n_2 = ${n2}$ values with the same mean $\\mu = ${mu}$ and population variance $\\sigma_2^2 = ${v2}$. Find the population variance $\\sigma^2$ of the combined dataset of $${totalN}$ values.`,
    answer: { kind: 'number', value: varTex },
    solution: [
      { text: 'Since both groups share the same mean $\\mu$, the combined sum of squared deviations is:', tex: `\\text{SS}_{\\text{total}} = n_1 \\sigma_1^2 + n_2 \\sigma_2^2 = ${n1} \\cdot ${v1} + ${n2} \\cdot ${v2} = ${totSqDev}` },
      { text: `Divide the total sum of squared deviations by the combined size $n = ${totalN}$:`, tex: `\\sigma^2 = ${texStep}` },
    ],
    hints: [
      'Because both groups share the same mean, the total sum of squared deviations is $n_1 \\sigma_1^2 + n_2 \\sigma_2^2$.',
      `Divide the total sum of squared deviations $${totSqDev}$ by the combined count $${totalN}$.`,
    ],
    inputHint: 'An integer or fraction.',
  }
}

function temperatureSD(rng: Rng): Problem {
  const sC = rng.pick([5, 10, 15, 20, 25, 30, 35, 40, 45, 50])
  const sF = (9 / 5) * sC

  return {
    statement: `A sensor records daily temperatures in degrees Celsius with a sample standard deviation of $s_C = ${sC}\\,{}^\\circ\\text{C}$. To convert temperatures to degrees Fahrenheit, the formula $F = \\frac{9}{5}C + 32$ is used. Find the sample standard deviation in degrees Fahrenheit ($^\\circ\\text{F}$).`,
    answer: { kind: 'number', value: String(sF) },
    solution: [
      { text: 'The linear transformation for standard deviation ignores constant shifts:', tex: 's_F = \\left|\\frac{9}{5}\\right| s_C' },
      { text: `Substitute $s_C = ${sC}$:`, tex: `s_F = \\frac{9}{5} \\cdot ${sC} = ${sF}` },
    ],
    hints: [
      'The constant $+32$ shifts all values but does not affect the standard deviation.',
      `Multiply the Celsius standard deviation $${sC}$ by the scaling factor $\\frac{9}{5}$.`,
    ],
    inputHint: 'An integer.',
  }
}

function scoreScalingSD(rng: Rng): Problem {
  const sOld = rng.int(4, 20)
  const scale = rng.pick([2, 3, 4, 5])
  const shift = rng.int(5, 25)
  const sNew = scale * sOld

  return {
    statement: `A exam raw score distribution $X$ has sample standard deviation $s_X = ${sOld}$. If scores are rescaled using $Y = ${scale}X + ${shift}$, find the new sample standard deviation $s_Y$.`,
    answer: { kind: 'number', value: String(sNew) },
    solution: [
      { text: 'Standard deviation scales by the absolute value of the multiplicative factor:', tex: 's_Y = |a| s_X' },
      { text: `Substitute $a = ${scale}$ and $s_X = ${sOld}$:`, tex: `s_Y = ${scale} \\cdot ${sOld} = ${sNew}` },
    ],
    hints: [
      'Constant additions do not change spread.',
      `Multiply $s_X = ${sOld}$ by the scale factor $${scale}$.`,
    ],
    inputHint: 'An integer.',
  }
}

function tier3(rng: Rng): Problem {
  const choice = rng.int(1, 3)
  if (choice === 1) return pooledVariance(rng)
  if (choice === 2) return temperatureSD(rng)
  return scoreScalingSD(rng)
}

export const template: SkillTemplate = {
  skillId: 'variance_sd',
  theory,
  expectedSeconds: { 1: 60, 2: 75, 3: 120 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
