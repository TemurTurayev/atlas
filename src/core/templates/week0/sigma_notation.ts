import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'Summation (sigma notation) $\\Sigma$: $\\sum_{i=m}^{n} a_i = a_m + a_{m+1} + \\dots + a_n$.',
  'The index $i$ runs through all integer values from the lower bound $m$ to the upper bound $n$, inclusive.',
  'Useful formula: $\\sum_{i=1}^{n} i = \\dfrac{n(n+1)}{2}$ — the sum of the first $n$ natural numbers.',
  'Common mistake: forgetting the last term ($i=m$ or $i=n$), or substituting the lower bound incorrectly.',
].join('\n')

const HINTS = [
  'Write out the sum term by term, substituting each value of the index in turn.',
  'For the sum of the first $n$ natural numbers, use the formula $\\frac{n(n+1)}{2}$.',
]
const INPUT_HINT = 'Enter a number'

function tier1(rng: Rng): Problem {
  const n = rng.int(3, 6)
  const terms = Array.from({ length: n }, (_, i) => (i + 1) ** 2)
  const sum = terms.reduce((s, t) => s + t, 0)
  const statement = `\\sum_{i=1}^{${n}} i^{2}`
  return {
    statement: `Evaluate $${statement}$.`,
    answer: { kind: 'number', value: String(sum) },
    solution: [
      { text: 'Write out the terms:', tex: `${terms.map((_, i) => `${i + 1}^{2}`).join('+')} = ${terms.join('+')}` },
      { text: 'Add them up:', tex: `${sum}` },
    ],
    hints: HINTS,
    inputHint: INPUT_HINT,
  }
}

function tier2(rng: Rng): Problem {
  const n = rng.int(3, 7)
  const terms = Array.from({ length: n + 1 }, (_, k) => 2 * k + 1)
  const sum = terms.reduce((s, t) => s + t, 0)
  const statement = `\\sum_{k=0}^{${n}} (2k+1)`
  return {
    statement: `Evaluate $${statement}$.`,
    answer: { kind: 'number', value: String(sum) },
    solution: [
      { text: `Write out the terms for $k=0,1,\\dots,${n}$:`, tex: `${terms.join('+')}` },
      { text: 'Add them up:', tex: `${sum}` },
    ],
    hints: HINTS,
    inputHint: INPUT_HINT,
  }
}

function bigSumBranch(rng: Rng): Problem {
  const n = rng.int(20, 60)
  const sum = (n * (n + 1)) / 2
  const statement = `\\sum_{i=1}^{${n}} i`
  return {
    statement: `Evaluate $${statement}$ using the formula for the sum of the first $n$ natural numbers.`,
    answer: { kind: 'number', value: String(sum) },
    solution: [
      { text: 'Formula for the sum of the first $n$ natural numbers:', tex: '\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}' },
      { text: `Substitute $n=${n}$:`, tex: `\\frac{${n}\\cdot ${n + 1}}{2} = ${sum}` },
    ],
    hints: HINTS,
    inputHint: INPUT_HINT,
  }
}

function shiftedBranch(rng: Rng): Problem {
  const k = rng.int(2, 6)
  const count = rng.int(10, 30)
  const upper = k + count - 1
  let sum = 0
  for (let i = k; i <= upper; i += 1) sum += i
  const statement = `\\sum_{i=${k}}^{${upper}} i`
  return {
    statement: `Evaluate $${statement}$.`,
    answer: { kind: 'number', value: String(sum) },
    solution: [
      {
        text: 'This is a sum of consecutive integers — use the formula for the sum of an arithmetic progression:',
        tex: `\\sum_{i=${k}}^{${upper}} i = \\frac{(${k}+${upper})\\cdot ${count}}{2}`,
      },
      {
        text: 'Check by taking the difference of two sums starting from one:',
        tex: `\\sum_{i=1}^{${upper}} i - \\sum_{i=1}^{${k - 1}} i = \\frac{${upper}\\cdot ${upper + 1}}{2} - \\frac{${k - 1}\\cdot ${k}}{2} = ${sum}`,
      },
    ],
    hints: HINTS,
    inputHint: INPUT_HINT,
  }
}

function tier3(rng: Rng): Problem {
  return rng.chance(0.5) ? bigSumBranch(rng) : shiftedBranch(rng)
}

export const template: SkillTemplate = {
  skillId: 'sigma_notation',
  theory,
  expectedSeconds: { 1: 35, 2: 60, 3: 120 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
