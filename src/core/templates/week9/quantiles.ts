import { rat, ratToLatex } from '../../math/rational'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'The first quartile $Q_1$ (25th percentile) is the median of the lower half of ordered data.',
  'The third quartile $Q_3$ (75th percentile) is the median of the upper half of ordered data.',
  'Convention: when $n$ is odd, the overall median is excluded from both the lower and upper halves.',
  'The interquartile range is $\\text{IQR} = Q_3 - Q_1$, measuring the spread of the middle $50\\%$ of data.',
  'Boxplot outlier limits: lower fence is $Q_1 - 1.5 \\cdot \\text{IQR}$ and upper fence is $Q_3 + 1.5 \\cdot \\text{IQR}$.',
  'Values outside the fences $[Q_1 - 1.5 \\cdot \\text{IQR}, Q_3 + 1.5 \\cdot \\text{IQR}]$ are classified as potential outliers.',
  'Common mistakes: including the median in the lower/upper halves when $n$ is odd, or calculating $\\text{IQR}$ as $Q_3 + Q_1$.',
].join('\n')

function makeQuantileDatasetOdd(rng: Rng) {
  const q1 = rng.int(10, 50)
  const iqrStep = rng.int(1, 15)
  const iqr = iqrStep * 2
  const q3 = q1 + iqr

  const halfIqr = Math.max(1, Math.floor(iqr / 2))
  const x1 = q1 - rng.int(1, 12)
  const x2 = q1
  const x3 = q1 + rng.int(0, halfIqr)
  const x5 = q3 - rng.int(0, halfIqr)
  const x4 = rng.int(x3, x5)
  const x6 = q3
  const x7 = q3 + rng.int(1, 12)

  const sorted = [x1, x2, x3, x4, x5, x6, x7].sort((a, b) => a - b)
  const actualQ1 = sorted[1]
  const actualQ3 = sorted[5]
  const actualIQR = actualQ3 - actualQ1
  return { sorted, q1: actualQ1, q3: actualQ3, iqr: actualIQR }
}

function computeQuartileOdd(rng: Rng): Problem {
  const { sorted, q1, q3, iqr } = makeQuantileDatasetOdd(rng)
  const list = rng.shuffle(sorted)
  const askTarget = rng.pick(['Q1', 'Q3', 'IQR'])

  if (askTarget === 'Q1') {
    return {
      statement: `Find the first quartile $Q_1$ of the dataset: $${list.join(', ')}$.`,
      answer: { kind: 'number', value: String(q1) },
      solution: [
        { text: 'Order the dataset from smallest to largest:', tex: sorted.join(', ') },
        { text: `Because $n = 7$ is odd, the median $x_4 = ${sorted[3]}$ is excluded. The lower half is:`, tex: `${sorted[0]}, ${sorted[1]}, ${sorted[2]}` },
        { text: 'The median of the lower half is $Q_1$:', tex: `Q_1 = ${q1}` },
      ],
      hints: [
        'First, arrange the dataset in ascending order.',
        'Exclude the overall median (4th value) to find the lower half, then pick its middle value.',
      ],
      inputHint: 'An integer.',
    }
  }

  if (askTarget === 'Q3') {
    return {
      statement: `Find the third quartile $Q_3$ of the dataset: $${list.join(', ')}$.`,
      answer: { kind: 'number', value: String(q3) },
      solution: [
        { text: 'Order the dataset from smallest to largest:', tex: sorted.join(', ') },
        { text: `Because $n = 7$ is odd, the median $x_4 = ${sorted[3]}$ is excluded. The upper half is:`, tex: `${sorted[4]}, ${sorted[5]}, ${sorted[6]}` },
        { text: 'The median of the upper half is $Q_3$:', tex: `Q_3 = ${q3}` },
      ],
      hints: [
        'First, arrange the dataset in ascending order.',
        'Exclude the overall median (4th value) to find the upper half, then pick its middle value.',
      ],
      inputHint: 'An integer.',
    }
  }

  return {
    statement: `Find the interquartile range (IQR) of the dataset: $${list.join(', ')}$.`,
    answer: { kind: 'number', value: String(iqr) },
    solution: [
      { text: 'Order the dataset from smallest to largest:', tex: sorted.join(', ') },
      { text: 'Find $Q_1$ (median of lower half) and $Q_3$ (median of upper half):', tex: `Q_1 = ${q1}, \\quad Q_3 = ${q3}` },
      { text: 'Subtract $Q_1$ from $Q_3$:', tex: `\\text{IQR} = Q_3 - Q_1 = ${q3} - ${q1} = ${iqr}` },
    ],
    hints: [
      'Find $Q_1$ (lower half median) and $Q_3$ (upper half median).',
      'Subtract $Q_1$ from $Q_3$: $\\text{IQR} = Q_3 - Q_1$.',
    ],
    inputHint: 'An integer.',
  }
}

function computeIQREven(rng: Rng): Problem {
  const base = rng.int(5, 40)
  const rangeConfig = rng.pick([
    [1, 3],
    [2, 6],
    [3, 8],
    [1, 10],
    [4, 12],
    [5, 15],
  ])

  const [minG, maxG] = rangeConfig
  const g1 = rng.int(minG, maxG)
  const g2 = rng.int(minG, maxG)
  const g3 = rng.int(minG, maxG)
  const g4 = rng.int(minG, maxG)
  const g5 = rng.int(minG, maxG)
  const g6 = rng.int(minG, maxG)
  const g7 = rng.int(minG, maxG)

  const x1 = base
  const x2 = x1 + g1
  const x3 = x2 + g2
  const x4 = x3 + g3
  const x5 = x4 + g4
  const x6 = x5 + g5
  const x7 = x6 + g6
  const x8 = x7 + g7

  const sorted = [x1, x2, x3, x4, x5, x6, x7, x8]
  const list = rng.shuffle(sorted)

  const q1Rat = rat(sorted[1] + sorted[2], 2)
  const q3Rat = rat(sorted[5] + sorted[6], 2)
  const iqrRat = rat(sorted[5] + sorted[6] - (sorted[1] + sorted[2]), 2)
  const iqrVal = ratToLatex(iqrRat)

  return {
    statement: `Find the interquartile range (IQR) of the dataset: $${list.join(', ')}$.`,
    answer: { kind: 'number', value: iqrVal },
    solution: [
      { text: 'Order the dataset from smallest to largest:', tex: sorted.join(', ') },
      { text: `Split into lower half ($${sorted[0]}, ${sorted[1]}, ${sorted[2]}, ${sorted[3]}$) and upper half ($${sorted[4]}, ${sorted[5]}, ${sorted[6]}, ${sorted[7]}$):`, tex: `Q_1 = \\frac{${sorted[1]} + ${sorted[2]}}{2} = ${ratToLatex(q1Rat)}, \\quad Q_3 = \\frac{${sorted[5]} + ${sorted[6]}}{2} = ${ratToLatex(q3Rat)}` },
      { text: 'Subtract $Q_1$ from $Q_3$:', tex: `\\text{IQR} = ${ratToLatex(q3Rat)} - ${ratToLatex(q1Rat)} = ${iqrVal}` },
    ],
    hints: [
      'Divide the 8 values into a lower half of 4 and an upper half of 4.',
      'Compute $Q_1$ as the average of the 2nd and 3rd values, $Q_3$ as the average of the 6th and 7th values, and calculate $Q_3 - Q_1$.',
    ],
    inputHint: 'An integer or fraction.',
  }
}

function quantileFromSortedNine(rng: Rng): Problem {
  const base = rng.int(10, 50)
  const sorted: number[] = [base]
  for (let i = 1; i < 9; i += 1) {
    sorted.push(sorted[i - 1] + rng.int(1, 8))
  }
  const list = rng.shuffle(sorted)

  // n = 9: median is x5 (index 4). Lower half x1..x4 (Q1 = (x2+x3)/2). Upper half x6..x9 (Q3 = (x7+x8)/2)
  const q1Rat = rat(sorted[1] + sorted[2], 2)
  const q3Rat = rat(sorted[6] + sorted[7], 2)
  const iqrRat = rat(sorted[6] + sorted[7] - (sorted[1] + sorted[2]), 2)
  const iqrVal = ratToLatex(iqrRat)

  return {
    statement: `Find the interquartile range (IQR) of the $9$-element dataset: $${list.join(', ')}$.`,
    answer: { kind: 'number', value: iqrVal },
    solution: [
      { text: 'Order the dataset from smallest to largest:', tex: sorted.join(', ') },
      { text: `Exclude the overall median ($x_5 = ${sorted[4]}$). Lower half is $${sorted[0]}, ${sorted[1]}, ${sorted[2]}, ${sorted[3]}$ ($Q_1 = ${ratToLatex(q1Rat)}$) and upper half is $${sorted[5]}, ${sorted[6]}, ${sorted[7]}, ${sorted[8]}$ ($Q_3 = ${ratToLatex(q3Rat)}$).` },
      { text: 'Subtract $Q_1$ from $Q_3$:', tex: `\\text{IQR} = ${ratToLatex(q3Rat)} - ${ratToLatex(q1Rat)} = ${iqrVal}` },
    ],
    hints: [
      'For $n=9$, exclude the 5th value (median).',
      'Calculate $Q_1$ (average of 2nd and 3rd) and $Q_3$ (average of 7th and 8th), then find $Q_3 - Q_1$.',
    ],
    inputHint: 'An integer or fraction.',
  }
}

function tier1(rng: Rng): Problem {
  const choice = rng.int(1, 3)
  if (choice === 1) return computeQuartileOdd(rng)
  if (choice === 2) return computeIQREven(rng)
  return quantileFromSortedNine(rng)
}

function outlierFences(rng: Rng): Problem {
  const q1 = rng.int(10, 50)
  const iqr = rng.int(2, 12) * 2
  const q3 = q1 + iqr
  const isUpper = rng.chance(0.5)

  if (isUpper) {
    const fence = q3 + 1.5 * iqr
    return {
      statement: `A dataset has first quartile $Q_1 = ${q1}$ and third quartile $Q_3 = ${q3}$. Find the upper fence for detecting outliers.`,
      answer: { kind: 'number', value: String(fence) },
      solution: [
        { text: 'Compute the interquartile range:', tex: `\\text{IQR} = Q_3 - Q_1 = ${q3} - ${q1} = ${iqr}` },
        { text: 'Apply the upper fence formula:', tex: `\\text{Upper fence} = Q_3 + 1.5 \\cdot \\text{IQR} = ${q3} + 1.5(${iqr}) = ${fence}` },
      ],
      hints: [
        'First calculate the interquartile range $\\text{IQR} = Q_3 - Q_1$.',
        `Substitute $Q_3 = ${q3}$ and $\\text{IQR} = ${iqr}$ into $Q_3 + 1.5 \\cdot \\text{IQR}$.`,
      ],
      inputHint: 'An integer.',
    }
  }

  const fence = q1 - 1.5 * iqr
  return {
    statement: `A dataset has first quartile $Q_1 = ${q1}$ and third quartile $Q_3 = ${q3}$. Find the lower fence for detecting outliers.`,
    answer: { kind: 'number', value: String(fence) },
    solution: [
      { text: 'Compute the interquartile range:', tex: `\\text{IQR} = Q_3 - Q_1 = ${q3} - ${q1} = ${iqr}` },
      { text: 'Apply the lower fence formula:', tex: `\\text{Lower fence} = Q_1 - 1.5 \\cdot \\text{IQR} = ${q1} - 1.5(${iqr}) = ${fence}` },
    ],
    hints: [
      'First calculate the interquartile range $\\text{IQR} = Q_3 - Q_1$.',
      `Substitute $Q_1 = ${q1}$ and $\\text{IQR} = ${iqr}$ into $Q_1 - 1.5 \\cdot \\text{IQR}$.`,
    ],
    inputHint: 'An integer.',
  }
}

function smallestOutlier(rng: Rng): Problem {
  const q1 = rng.int(10, 50)
  const iqr = rng.int(2, 12) * 2
  const q3 = q1 + iqr
  const upperFence = q3 + 1.5 * iqr
  const ans = upperFence + 1

  return {
    statement: `A dataset has $Q_1 = ${q1}$ and $Q_3 = ${q3}$. What is the smallest integer value that is classified as an upper outlier (strictly greater than $Q_3 + 1.5 \\cdot \\text{IQR}$)?`,
    answer: { kind: 'number', value: String(ans) },
    solution: [
      { text: 'Calculate the interquartile range:', tex: `\\text{IQR} = Q_3 - Q_1 = ${q3} - ${q1} = ${iqr}` },
      { text: 'Find the upper outlier fence:', tex: `\\text{Upper fence} = Q_3 + 1.5 \\cdot \\text{IQR} = ${q3} + 1.5(${iqr}) = ${upperFence}` },
      { text: `The smallest integer strictly greater than $${upperFence}$ is:`, tex: `${upperFence} + 1 = ${ans}` },
    ],
    hints: [
      'Calculate the upper fence $F = Q_3 + 1.5 \\cdot \\text{IQR}$.',
      `Find the smallest integer strictly greater than $${upperFence}$.`,
    ],
    inputHint: 'An integer.',
  }
}

function largestLowerNonOutlier(rng: Rng): Problem {
  const q1 = rng.int(20, 60)
  const iqr = rng.int(2, 12) * 2
  const q3 = q1 + iqr
  const lowerFence = q1 - 1.5 * iqr

  return {
    statement: `A dataset has $Q_1 = ${q1}$ and $Q_3 = ${q3}$. Find the lower fence value ($Q_1 - 1.5 \\cdot \\text{IQR}$) below which any data point is considered a lower outlier.`,
    answer: { kind: 'number', value: String(lowerFence) },
    solution: [
      { text: 'Calculate the interquartile range:', tex: `\\text{IQR} = Q_3 - Q_1 = ${q3} - ${q1} = ${iqr}` },
      { text: 'Apply the lower fence formula:', tex: `\\text{Lower fence} = Q_1 - 1.5 \\cdot \\text{IQR} = ${q1} - 1.5(${iqr}) = ${lowerFence}` },
    ],
    hints: [
      'Calculate $\\text{IQR} = Q_3 - Q_1$.',
      `Compute $Q_1 - 1.5 \\cdot \\text{IQR} = ${q1} - 1.5(${iqr})$.`,
    ],
    inputHint: 'An integer.',
  }
}

function tier2(rng: Rng): Problem {
  const choice = rng.int(1, 3)
  if (choice === 1) return outlierFences(rng)
  if (choice === 2) return smallestOutlier(rng)
  return largestLowerNonOutlier(rng)
}

function fullDatasetFences(rng: Rng): Problem {
  const { sorted, q1, q3, iqr } = makeQuantileDatasetOdd(rng)
  const list = rng.shuffle(sorted)
  const isUpper = rng.chance(0.5)

  if (isUpper) {
    const fence = q3 + 1.5 * iqr
    return {
      statement: `Find the upper outlier fence ($Q_3 + 1.5 \\cdot \\text{IQR}$) for the dataset: $${list.join(', ')}$.`,
      answer: { kind: 'number', value: String(fence) },
      solution: [
        { text: 'Order the dataset to identify $Q_1$ and $Q_3$:', tex: sorted.join(', ') },
        { text: 'Identify $Q_1$ (2nd value) and $Q_3$ (6th value):', tex: `Q_1 = ${q1}, \\quad Q_3 = ${q3}` },
        { text: `Compute $\\text{IQR} = ${q3} - ${q1} = ${iqr}$, then evaluate $Q_3 + 1.5 \\cdot \\text{IQR}$:`, tex: `\\text{Upper fence} = ${q3} + 1.5(${iqr}) = ${fence}` },
      ],
      hints: [
        'Order the dataset to find $Q_1$ (2nd value) and $Q_3$ (6th value).',
        `Calculate $\\text{IQR} = Q_3 - Q_1$, then compute $Q_3 + 1.5 \\cdot \\text{IQR}$.`,
      ],
      inputHint: 'An integer.',
    }
  }

  const fence = q1 - 1.5 * iqr
  return {
    statement: `Find the lower outlier fence ($Q_1 - 1.5 \\cdot \\text{IQR}$) for the dataset: $${list.join(', ')}$.`,
    answer: { kind: 'number', value: String(fence) },
    solution: [
      { text: 'Order the dataset to identify $Q_1$ and $Q_3$:', tex: sorted.join(', ') },
      { text: 'Identify $Q_1$ (2nd value) and $Q_3$ (6th value):', tex: `Q_1 = ${q1}, \\quad Q_3 = ${q3}` },
      { text: `Compute $\\text{IQR} = ${q3} - ${q1} = ${iqr}$, then evaluate $Q_1 - 1.5 \\cdot \\text{IQR}$:`, tex: `\\text{Lower fence} = ${q1} - 1.5(${iqr}) = ${fence}` },
    ],
    hints: [
      'Order the dataset to find $Q_1$ (2nd value) and $Q_3$ (6th value).',
      `Calculate $\\text{IQR} = Q_3 - Q_1$, then compute $Q_1 - 1.5 \\cdot \\text{IQR}$.`,
    ],
    inputHint: 'An integer.',
  }
}

function boxplotOutlierEffect(rng: Rng): Problem {
  const q1 = rng.int(15, 35)
  const med = q1 + rng.int(5, 15)
  const q3 = med + rng.int(5, 15)
  const oldMax = q3 + rng.int(5, 20)
  const newMax = oldMax + rng.int(100, 300)

  const options = rng.shuffle([
    { id: 'unchanged', label: 'The values of $Q_1$, $Q_3$, and $\\text{IQR}$ all remain unchanged.' },
    { id: 'increase_q3', label: 'The third quartile $Q_3$ increases significantly.' },
    { id: 'double_iqr', label: 'The interquartile range $\\text{IQR}$ doubles.' },
    { id: 'increase_med', label: 'The median increases to match $Q_3$.' },
  ])

  return {
    statement: `A dataset of $n = 15$ observations has $Q_1 = ${q1}$, $\\text{Median} = ${med}$, and $Q_3 = ${q3}$. If the maximum value $x_{\\text{max}} = ${oldMax}$ is replaced by an extreme value of $${newMax}$, which of the following statements is true?`,
    answer: { kind: 'choice', options, correctId: 'unchanged' },
    solution: [
      { text: 'Quartiles and medians depend only on the relative ranks of ordered observations.' },
      { text: `Changing the largest observation from $${oldMax}$ to $${newMax}$ does not change any ranks in the lower, middle, or upper quartiles ($Q_1, \\tilde{x}, Q_3$).` },
      { text: 'Thus, $Q_1$, $Q_3$, and $\\text{IQR} = Q_3 - Q_1$ all remain completely unchanged.' },
    ],
    hints: [
      'Quartiles depend on rank order, not on the magnitudes of extreme values.',
      'Changing the largest observation above $Q_3$ does not affect the middle $50\\%$ of the dataset.',
    ],
  }
}

function tier3(rng: Rng): Problem {
  const choice = rng.int(1, 3)
  if (choice === 1) return fullDatasetFences(rng)
  if (choice === 2) return boxplotOutlierEffect(rng)
  return fullDatasetFences(rng)
}

export const template: SkillTemplate = {
  skillId: 'quantiles',
  theory,
  expectedSeconds: { 1: 60, 2: 75, 3: 120 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
