import { joinTerms } from '../../math/latex'
import { rat, ratToLatex } from '../../math/rational'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'The arithmetic mean $\\bar{x} = \\frac{1}{n} \\sum_{i=1}^n x_i$ is the average of a dataset of $n$ numbers.',
  'The median $\\tilde{x}$ is the middle value of an ordered dataset; for an even number of values $n$, it is the average of the two central numbers.',
  'The mode is the data value that occurs with the highest frequency in the dataset.',
  'Linear transformation: adding a constant $c$ or multiplying by $a$ changes the mean to $\\bar{y} = a\\bar{x} + c$ and median to $\\tilde{y} = a\\tilde{x} + c$.',
  'For missing-value problems, use the total sum formula: $\\sum_{i=1}^n x_i = n \\bar{x}$.',
  'Common mistakes: taking the middle value of an unsorted list as the median, or averaging group means without weighting by group sizes.',
].join('\n')

function computeMean(rng: Rng): Problem {
  const n = rng.pick([4, 5, 6, 7])
  const M = rng.int(5, 35)
  const vals: number[] = []
  for (let i = 0; i < n - 1; i += 1) {
    vals.push(rng.int(Math.max(1, M - 10), M + 10))
  }
  const sumKnown = vals.reduce((a, b) => a + b, 0)
  const xLast = n * M - sumKnown
  const rawList = [...vals, xLast]
  const list = rng.shuffle(rawList)
  const sum = list.reduce((a, b) => a + b, 0)

  return {
    statement: `Find the mean of the dataset: $${list.join(', ')}$.`,
    answer: { kind: 'number', value: String(M) },
    solution: [
      { text: `Add all $${n}$ values in the dataset:`, tex: `${joinTerms(list.map(String))} = ${sum}` },
      { text: `Divide the total sum by $n = ${n}$:`, tex: `\\bar{x} = \\frac{${sum}}{${n}} = ${M}` },
    ],
    hints: [
      'To find the mean, sum all the numbers in the dataset and divide by the count $n$.',
      `Sum the values to get $${sum}$, then divide by $${n}$.`,
    ],
    inputHint: 'An integer or simple fraction.',
  }
}

function computeMedian(rng: Rng): Problem {
  const n = rng.pick([5, 6, 7, 8])
  const base = rng.int(2, 30)

  if (n % 2 === 1) {
    const half = (n - 1) / 2
    const sorted: number[] = [base]
    for (let i = 1; i < n; i += 1) {
      sorted.push(sorted[i - 1] + rng.int(1, 6))
    }
    const list = rng.shuffle(sorted)
    const med = sorted[half]
    return {
      statement: `Find the median of the dataset: $${list.join(', ')}$.`,
      answer: { kind: 'number', value: String(med) },
      solution: [
        { text: 'Order the dataset from smallest to largest:', tex: sorted.join(', ') },
        { text: `Because $n = ${n}$ is odd, the median is the middle (${half + 1}th) value:`, tex: `\\tilde{x} = ${med}` },
      ],
      hints: [
        'First, arrange the dataset in ascending order.',
        `For an odd number of values ($n=${n}$), the median is the middle (${half + 1}th) value.`,
      ],
      inputHint: 'An integer or simple fraction.',
    }
  }

  const half = n / 2
  const sorted: number[] = [base]
  for (let i = 1; i < n; i += 1) {
    sorted.push(sorted[i - 1] + rng.int(1, 6))
  }
  const list = rng.shuffle(sorted)
  const m1 = sorted[half - 1]
  const m2 = sorted[half]
  const medRat = rat(m1 + m2, 2)
  const medVal = ratToLatex(medRat)

  return {
    statement: `Find the median of the dataset: $${list.join(', ')}$.`,
    answer: { kind: 'number', value: medVal },
    solution: [
      { text: 'Order the dataset from smallest to largest:', tex: sorted.join(', ') },
      { text: `Because $n = ${n}$ is even, average the ${half}th and ${half + 1}th values ($${m1}$ and $${m2}$):`, tex: `\\tilde{x} = \\frac{${m1} + ${m2}}{2} = ${medVal}` },
    ],
    hints: [
      'First, arrange the dataset in ascending order.',
      `For an even number of values ($n=${n}$), average the ${half}th and ${half + 1}th values.`,
    ],
    inputHint: 'An integer or simple fraction.',
  }
}

function findMode(rng: Rng): Problem {
  const modeVal = rng.int(2, 25)
  const allNums = Array.from({ length: 40 }, (_, i) => i + 1)
  const count = rng.pick([3, 4])
  const others = rng.shuffle(allNums.filter((v) => v !== modeVal)).slice(0, rng.int(3, 5))
  const raw = [...Array(count).fill(modeVal), ...others]
  const list = rng.shuffle(raw)

  return {
    statement: `Find the mode of the dataset: $${list.join(', ')}$.`,
    answer: { kind: 'number', value: String(modeVal) },
    solution: [
      { text: 'Count how many times each number appears in the dataset.' },
      { text: `The value $${modeVal}$ appears $${count}$ times, which is more frequent than any other value. Thus, the mode is $${modeVal}$.` },
    ],
    hints: [
      'The mode is the number that appears most frequently in the dataset.',
      `Identify which number occurs $${count}$ times in the list.`,
    ],
    inputHint: 'An integer.',
  }
}

function tier1(rng: Rng): Problem {
  const choice = rng.int(1, 3)
  if (choice === 1) return computeMean(rng)
  if (choice === 2) return computeMedian(rng)
  return findMode(rng)
}

function missingValue(rng: Rng): Problem {
  const n = rng.pick([4, 5, 6, 7])
  const M = rng.int(15, 60)
  const known: number[] = []
  for (let i = 0; i < n - 1; i += 1) {
    known.push(rng.int(Math.max(1, M - 12), M + 12))
  }
  const sumKnown = known.reduce((a, b) => a + b, 0)
  const xMiss = n * M - sumKnown

  return {
    statement: `A dataset of $${n}$ numbers has a mean of $${M}$. $${n - 1}$ of the numbers are $${known.join(', ')}$. Find the missing number $x$.`,
    answer: { kind: 'number', value: String(xMiss) },
    solution: [
      { text: `Multiply the target mean by $n = ${n}$ to find the total sum required:`, tex: `\\text{Total sum} = ${n} \\cdot ${M} = ${n * M}` },
      { text: `Subtract the sum of the known $${n - 1}$ values ($${sumKnown}$) from the total sum:`, tex: `x = ${n * M} - ${sumKnown} = ${xMiss}` },
    ],
    hints: [
      'Use the total sum formula: $\\sum x_i = n \\bar{x}$.',
      `Multiply $${M}$ by $${n}$ to get the total sum, then subtract the sum of the given numbers.`,
    ],
    inputHint: 'An integer.',
  }
}

function groupedMean(rng: Rng): Problem {
  const nA = rng.int(4, 12)
  const nB = rng.int(4, 12)
  const M = rng.int(55, 95)
  const d = rng.pick([1, 2, 3, 4, 5, -1, -2, -3, -4, -5])
  const mA = M + d * nB
  const mB = M - d * nA
  const totN = nA + nB
  const sumA = nA * mA
  const sumB = nB * mB
  const totSum = sumA + sumB

  return {
    statement: `Group A has $${nA}$ students with a mean score of $${mA}$. Group B has $${nB}$ students with a mean score of $${mB}$. Find the combined mean score of all $${totN}$ students.`,
    answer: { kind: 'number', value: String(M) },
    solution: [
      { text: 'Compute the total sum of scores for Group A and Group B:', tex: `S_A = ${nA} \\cdot ${mA} = ${sumA}, \\quad S_B = ${nB} \\cdot ${mB} = ${sumB}` },
      { text: `Divide the total combined sum by the total number of students ($${totN}$):`, tex: `\\bar{x} = \\frac{${sumA} + ${sumB}}{${totN}} = \\frac{${totSum}}{${totN}} = ${M}` },
    ],
    hints: [
      'Calculate the total sum of scores for both groups combined.',
      `Multiply each group size by its mean, add them together, and divide by $${totN}$.`,
    ],
    inputHint: 'An integer.',
  }
}

function linearTransformMean(rng: Rng): Problem {
  const M = rng.int(10, 50)
  const a = rng.intExcept(-5, 8, [0])
  const b = rng.intExcept(-15, 15, [0])
  const newM = a * M + b
  const bSign = b > 0 ? `+ ${b}` : `- ${Math.abs(b)}`

  return {
    statement: `A dataset has a mean of $\\bar{x} = ${M}$. If every value $x_i$ in the dataset is transformed to $y_i = ${a}x_i ${bSign}$, find the new mean $\\bar{y}$.`,
    answer: { kind: 'number', value: String(newM) },
    solution: [
      { text: 'Apply the linear transformation property of the arithmetic mean:', tex: '\\bar{y} = a\\bar{x} + c' },
      { text: `Substitute $a = ${a}$, $\\bar{x} = ${M}$, and $c = ${b}$:`, tex: `\\bar{y} = ${a} \\cdot ${M} ${bSign} = ${newM}` },
    ],
    hints: [
      'Recall the linear transformation rule for means: $\\bar{y} = a\\bar{x} + c$.',
      `Multiply the original mean $${M}$ by $${a}$ and then add $${b}$.`,
    ],
    inputHint: 'An integer.',
  }
}

function tier2(rng: Rng): Problem {
  const choice = rng.int(1, 3)
  if (choice === 1) return missingValue(rng)
  if (choice === 2) return groupedMean(rng)
  return linearTransformMean(rng)
}

function correctedMean(rng: Rng): Problem {
  const n = rng.pick([5, 10, 20, 25])
  const M = rng.int(20, 70)
  const shift = rng.intExcept(-8, 8, [0])
  const newM = M + shift

  const initSum = n * M
  const newSum = n * newM
  const xWrong = rng.int(10, 60)
  const xCorrect = xWrong + (newSum - initSum)

  return {
    statement: `A sample of $${n}$ observations has an initial mean of $${M}$. It was later discovered that an observation recorded as $${xWrong}$ was actually $${xCorrect}$. Find the corrected mean.`,
    answer: { kind: 'number', value: String(newM) },
    solution: [
      { text: 'Find the original total sum:', tex: `S = ${n} \\cdot ${M} = ${initSum}` },
      { text: `Adjust the sum by removing the wrong value $${xWrong}$ and adding the correct value $${xCorrect}$:`, tex: `S' = ${joinTerms([String(initSum), String(-xWrong), String(xCorrect)])} = ${newSum}` },
      { text: `Divide the updated sum by $n = ${n}$:`, tex: `\\bar{x}' = \\frac{${newSum}}{${n}} = ${newM}` },
    ],
    hints: [
      'Find the initial total sum $n \\bar{x}$, then subtract the wrong value and add the correct value.',
      `Divide the updated sum $${newSum}$ by $${n}$.`,
    ],
    inputHint: 'An integer.',
  }
}

function weightedGrade(rng: Rng): Problem {
  const w1 = 30
  const w2 = 30
  const w3 = 40
  const h = rng.int(60, 95)
  const m = rng.int(60, 95)
  const f = rng.int(50, 100)
  const T = (w1 * h + w2 * m + w3 * f) / 100
  const targetStr = Number.isInteger(T) ? String(T) : T.toFixed(1)

  return {
    statement: `A student's final grade is a weighted mean: Homework ($${w1}\\%$), Midterm ($${w2}\\%$), and Final Exam ($${w3}\\%$). The student scored $${h}$ on Homework and $${m}$ on the Midterm. What score must they achieve on the Final Exam to obtain an overall grade of $${targetStr}$?`,
    answer: { kind: 'number', value: String(f) },
    solution: [
      { text: 'Set up the weighted average formula for the overall grade:', tex: `0.${w1} \\cdot ${h} + 0.${w2} \\cdot ${m} + 0.${w3} \\cdot f = ${targetStr}` },
      { text: 'Simplify the known weighted components:', tex: `${(w1 * h) / 100} + ${(w2 * m) / 100} + 0.${w3} f = ${targetStr}` },
      { text: 'Solve for the Final Exam score $f$:', tex: `0.${w3} f = ${(w3 * f) / 100} \\ \\Longrightarrow\\ f = ${f}` },
    ],
    hints: [
      'Write the weighted mean equation: $0.30(h) + 0.30(m) + 0.40(f) = \\text{Grade}$.',
      'Substitute the known scores and solve for the Final Exam score $f$.',
    ],
    inputHint: 'An integer.',
  }
}

function weightedThreeGroups(rng: Rng): Problem {
  const n1 = rng.int(10, 30)
  const n2 = rng.int(10, 30)
  const n3 = rng.int(10, 30)
  const m1 = rng.int(60, 90)
  const m2 = rng.int(60, 90)
  const m3 = rng.int(60, 90)
  const totN = n1 + n2 + n3
  const totSum = n1 * m1 + n2 * m2 + n3 * m3
  const meanRat = rat(totSum, totN)
  const meanTex = ratToLatex(meanRat)

  const unreducedTex = `\\frac{${totSum}}{${totN}}`
  const texStep = unreducedTex === meanTex ? meanTex : `${unreducedTex} = ${meanTex}`

  return {
    statement: `A course has three sections: Section 1 ($${n1}$ students, mean $${m1}$), Section 2 ($${n2}$ students, mean $${m2}$), and Section 3 ($${n3}$ students, mean $${m3}$). Find the combined mean score across all $${totN}$ students.`,
    answer: { kind: 'number', value: meanTex },
    solution: [
      { text: 'Compute total score for each section:', tex: `S_1 = ${n1} \\cdot ${m1} = ${n1 * m1}, \\ S_2 = ${n2} \\cdot ${m2} = ${n2 * m2}, \\ S_3 = ${n3} \\cdot ${m3} = ${n3 * m3}` },
      { text: `Divide the total sum ($${totSum}$) by total students ($${totN}$):`, tex: `\\bar{x} = ${texStep}` },
    ],
    hints: [
      'Multiply each section size by its mean and sum them to get the total points.',
      `Divide the total points $${totSum}$ by the combined size $${totN}$.`,
    ],
    inputHint: 'An exact fraction or decimal.',
  }
}

function tier3(rng: Rng): Problem {
  const choice = rng.int(1, 3)
  if (choice === 1) return correctedMean(rng)
  if (choice === 2) return weightedGrade(rng)
  return weightedThreeGroups(rng)
}

export const template: SkillTemplate = {
  skillId: 'desc_stats',
  theory,
  expectedSeconds: { 1: 60, 2: 75, 3: 120 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
