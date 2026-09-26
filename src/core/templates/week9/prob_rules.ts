import { rat, ratToLatex } from '../../math/rational'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'Probability of an event $A$ satisfies $0 \\le P(A) \\le 1$, with sample space probability $P(\\Omega) = 1$.',
  'Complement rule: $P(A^c) = 1 - P(A)$, where $A^c$ is the event that $A$ does not occur.',
  'Addition rule (general): $P(A \\cup B) = P(A) + P(B) - P(A \\cap B)$.',
  'Mutually exclusive (disjoint) events cannot happen together: $P(A \\cap B) = 0$, so $P(A \\cup B) = P(A) + P(B)$.',
  'De Morgan’s laws for complements: $P((A \\cup B)^c) = P(A^c \\cap B^c) = 1 - P(A \\cup B)$.',
  'Common mistakes: forgetting to subtract $P(A \\cap B)$ when events overlap, or assuming $P(A \\cap B) = P(A)P(B)$ without independence.',
].join('\n')

function pickVennPartition(rng: Rng) {
  const p11 = rng.int(10, 30)
  const p10 = rng.int(10, 35)
  const p01 = rng.int(10, 35)
  const p00 = 100 - (p11 + p10 + p01)

  const pAInt = p10 + p11
  const pBInt = p01 + p11
  const pInterInt = p11
  const pUnionInt = p10 + p01 + p11
  const pNeitherInt = p00

  return { pAInt, pBInt, pInterInt, pUnionInt, pNeitherInt }
}

function complementRule(rng: Rng): Problem {
  const useDecimal = rng.chance(0.5)
  if (useDecimal) {
    const pA = rng.int(10, 90) / 100
    const pAc = Math.round((1 - pA) * 100) / 100
    const pAStr = pA.toFixed(2)
    const pAcStr = pAc.toFixed(2)

    return {
      statement: `If $P(A) = ${pAStr}$, find the probability of the complement $P(A^c)$.`,
      answer: { kind: 'number', value: pAcStr },
      solution: [
        { text: 'Apply the complement rule:', tex: 'P(A^c) = 1 - P(A)' },
        { text: `Substitute $P(A) = ${pAStr}$:`, tex: `P(A^c) = 1 - ${pAStr} = ${pAcStr}` },
      ],
      hints: [
        'Recall the complement rule: $P(A^c) = 1 - P(A)$.',
        `Subtract $${pAStr}$ from $1$.`,
      ],
      inputHint: 'A decimal with two decimal places.',
    }
  }

  const den = rng.pick([4, 5, 8, 10, 12, 16, 20])
  const numA = rng.int(1, den - 1)
  const ratA = rat(numA, den)
  const ratAc = rat(den - numA, den)
  const texA = ratToLatex(ratA)
  const texAc = ratToLatex(ratAc)

  return {
    statement: `If $P(A) = ${texA}$, find the probability of the complement $P(A^c)$.`,
    answer: { kind: 'number', value: texAc },
    solution: [
      { text: 'Apply the complement rule:', tex: 'P(A^c) = 1 - P(A)' },
      { text: `Substitute $P(A) = ${texA}$:`, tex: `P(A^c) = 1 - ${texA} = ${texAc}` },
    ],
    hints: [
      'Recall the complement rule: $P(A^c) = 1 - P(A)$.',
      `Subtract $${texA}$ from $1$.`,
    ],
    inputHint: 'An exact fraction.',
  }
}

function disjointAddition(rng: Rng): Problem {
  const pAInt = rng.int(10, 45)
  const pBInt = rng.int(10, 45)
  const pUnionInt = pAInt + pBInt

  const pAStr = (pAInt / 100).toFixed(2)
  const pBStr = (pBInt / 100).toFixed(2)
  const pUnionStr = (pUnionInt / 100).toFixed(2)

  return {
    statement: `Events $A$ and $B$ are mutually exclusive with $P(A) = ${pAStr}$ and $P(B) = ${pBStr}$. Find $P(A \\cup B)$.`,
    answer: { kind: 'number', value: pUnionStr },
    solution: [
      { text: 'For mutually exclusive (disjoint) events, $P(A \\cap B) = 0$, so the addition rule simplifies to:', tex: 'P(A \\cup B) = P(A) + P(B)' },
      { text: `Substitute $P(A) = ${pAStr}$ and $P(B) = ${pBStr}$:`, tex: `P(A \\cup B) = ${pAStr} + ${pBStr} = ${pUnionStr}` },
    ],
    hints: [
      'For mutually exclusive events, $P(A \\cap B) = 0$.',
      'Use the addition rule: $P(A \\cup B) = P(A) + P(B)$.',
    ],
    inputHint: 'A decimal with two decimal places.',
  }
}

function complementWordProblem(rng: Rng): Problem {
  const pDefectPct = rng.int(2, 25)
  const pDefect = pDefectPct / 100
  const pGood = Math.round((1 - pDefect) * 100) / 100
  const pDefectStr = pDefect.toFixed(2)
  const pGoodStr = pGood.toFixed(2)

  return {
    statement: `A component produced by a factory has a defect probability of $P(A) = ${pDefectStr}$. Find the probability $P(A^c)$ that a randomly selected component is non-defective.`,
    answer: { kind: 'number', value: pGoodStr },
    solution: [
      { text: 'The event "non-defective" is the complement of "defective":', tex: 'P(A^c) = 1 - P(A)' },
      { text: `Substitute $P(A) = ${pDefectStr}$:`, tex: `P(A^c) = 1 - ${pDefectStr} = ${pGoodStr}` },
    ],
    hints: [
      'Use the complement rule: $P(A^c) = 1 - P(A)$.',
      `Subtract $${pDefectStr}$ from $1$.`,
    ],
    inputHint: 'A decimal with two decimal places.',
  }
}

function tier1(rng: Rng): Problem {
  const choice = rng.int(1, 3)
  if (choice === 1) return complementRule(rng)
  if (choice === 2) return disjointAddition(rng)
  return complementWordProblem(rng)
}

function generalAddition(rng: Rng): Problem {
  const findUnion = rng.chance(0.5)
  const { pAInt, pBInt, pInterInt, pUnionInt } = pickVennPartition(rng)

  const pAStr = (pAInt / 100).toFixed(2)
  const pBStr = (pBInt / 100).toFixed(2)
  const pInterStr = (pInterInt / 100).toFixed(2)
  const pUnionStr = (pUnionInt / 100).toFixed(2)

  if (findUnion) {
    return {
      statement: `Events $A$ and $B$ satisfy $P(A) = ${pAStr}$, $P(B) = ${pBStr}$, and $P(A \\cap B) = ${pInterStr}$. Find $P(A \\cup B)$.`,
      answer: { kind: 'number', value: pUnionStr },
      solution: [
        { text: 'Apply the general addition rule:', tex: 'P(A \\cup B) = P(A) + P(B) - P(A \\cap B)' },
        { text: 'Substitute the given values:', tex: `P(A \\cup B) = ${pAStr} + ${pBStr} - ${pInterStr} = ${pUnionStr}` },
      ],
      hints: [
        'Use the general addition rule: $P(A \\cup B) = P(A) + P(B) - P(A \\cap B)$.',
        `Add $${pAStr}$ and $${pBStr}$, then subtract $${pInterStr}$.`,
      ],
      inputHint: 'A decimal with two decimal places.',
    }
  }

  return {
    statement: `Events $A$ and $B$ satisfy $P(A) = ${pAStr}$, $P(B) = ${pBStr}$, and $P(A \\cup B) = ${pUnionStr}$. Find $P(A \\cap B)$.`,
    answer: { kind: 'number', value: pInterStr },
    solution: [
      { text: 'Rearrange the general addition rule to solve for $P(A \\cap B)$:', tex: 'P(A \\cap B) = P(A) + P(B) - P(A \\cup B)' },
      { text: 'Substitute the given values:', tex: `P(A \\cap B) = ${pAStr} + ${pBStr} - ${pUnionStr} = ${pInterStr}` },
    ],
    hints: [
      'Rearrange $P(A \\cup B) = P(A) + P(B) - P(A \\cap B)$ to solve for $P(A \\cap B)$.',
      `Add $${pAStr}$ and $${pBStr}$, then subtract $${pUnionStr}$.`,
    ],
    inputHint: 'A decimal with two decimal places.',
  }
}

function neitherEvent(rng: Rng): Problem {
  const { pAInt, pBInt, pInterInt, pUnionInt, pNeitherInt } = pickVennPartition(rng)

  const pAStr = (pAInt / 100).toFixed(2)
  const pBStr = (pBInt / 100).toFixed(2)
  const pInterStr = (pInterInt / 100).toFixed(2)
  const pNeitherStr = (pNeitherInt / 100).toFixed(2)
  const pUnionStr = (pUnionInt / 100).toFixed(2)

  return {
    statement: `Events $A$ and $B$ have $P(A) = ${pAStr}$, $P(B) = ${pBStr}$, and $P(A \\cap B) = ${pInterStr}$. Find the probability that neither $A$ nor $B$ occurs, $P(A^c \\cap B^c)$.`,
    answer: { kind: 'number', value: pNeitherStr },
    solution: [
      { text: 'By De Morgan’s laws, the event that neither occurs is the complement of the union:', tex: 'P(A^c \\cap B^c) = 1 - P(A \\cup B)' },
      { text: 'Calculate the union probability $P(A \\cup B)$:', tex: `P(A \\cup B) = ${pAStr} + ${pBStr} - ${pInterStr} = ${pUnionStr}` },
      { text: 'Subtract from $1$:', tex: `P(A^c \\cap B^c) = 1 - ${pUnionStr} = ${pNeitherStr}` },
    ],
    hints: [
      'By De Morgan’s laws, $P(A^c \\cap B^c) = 1 - P(A \\cup B)$.',
      `Calculate $P(A \\cup B) = P(A) + P(B) - P(A \\cap B)$ first, then subtract from $1$.`,
    ],
    inputHint: 'A decimal with two decimal places.',
  }
}

function generalAdditionSolveForB(rng: Rng): Problem {
  const { pAInt, pBInt, pInterInt, pUnionInt } = pickVennPartition(rng)

  const pAStr = (pAInt / 100).toFixed(2)
  const pBStr = (pBInt / 100).toFixed(2)
  const pInterStr = (pInterInt / 100).toFixed(2)
  const pUnionStr = (pUnionInt / 100).toFixed(2)

  return {
    statement: `Given $P(A) = ${pAStr}$, $P(A \\cap B) = ${pInterStr}$, and $P(A \\cup B) = ${pUnionStr}$, find $P(B)$.`,
    answer: { kind: 'number', value: pBStr },
    solution: [
      { text: 'Rearrange the general addition rule $P(A \\cup B) = P(A) + P(B) - P(A \\cap B)$ for $P(B)$:', tex: 'P(B) = P(A \\cup B) - P(A) + P(A \\cap B)' },
      { text: 'Substitute the given values:', tex: `P(B) = ${pUnionStr} - ${pAStr} + ${pInterStr} = ${pBStr}` },
    ],
    hints: [
      'Use $P(A \\cup B) = P(A) + P(B) - P(A \\cap B)$ and solve for $P(B)$.',
      `Evaluate $${pUnionStr} - ${pAStr} + ${pInterStr}$.`,
    ],
    inputHint: 'A decimal with two decimal places.',
  }
}

function tier2(rng: Rng): Problem {
  const choice = rng.int(1, 3)
  if (choice === 1) return generalAddition(rng)
  if (choice === 2) return neitherEvent(rng)
  return generalAdditionSolveForB(rng)
}

function vennWordProblem(rng: Rng): Problem {
  const total = 100
  const { pAInt: nA, pBInt: nB, pInterInt: nAB } = pickVennPartition(rng)

  const nOnlyA = nA - nAB
  const nOnlyB = nB - nAB
  const nEitherNotBoth = nOnlyA + nOnlyB

  const ansRat = rat(nEitherNotBoth, total)
  const ansVal = ratToLatex(ansRat)
  const unreducedTex = `\\frac{${nEitherNotBoth}}{100}`
  const texStep = unreducedTex === ansVal ? `P = ${ansVal}` : `P = ${unreducedTex} = ${ansVal}`

  return {
    statement: `In a cohort of $100$ students, $${nA}$ take Biology, $${nB}$ take Chemistry, and $${nAB}$ take both. Find the probability that a randomly chosen student takes Biology or Chemistry, but NOT both.`,
    answer: { kind: 'number', value: ansVal },
    solution: [
      { text: 'Find the number of students taking only Biology and only Chemistry:', tex: `N(\\text{only Bio}) = ${nA} - ${nAB} = ${nOnlyA}, \\quad N(\\text{only Chem}) = ${nB} - ${nAB} = ${nOnlyB}` },
      { text: 'Sum the two disjoint groups:', tex: `N(\\text{either, not both}) = ${nOnlyA} + ${nOnlyB} = ${nEitherNotBoth}` },
      { text: 'Divide by the total number of students ($100$):', tex: texStep },
    ],
    hints: [
      'Find the number of students taking only Biology ($N_A - N_{AB}$) and only Chemistry ($N_B - N_{AB}$).',
      `Sum these two disjoint groups ($${nOnlyA} + ${nOnlyB} = ${nEitherNotBoth}$) and divide by $100$.`,
    ],
    inputHint: 'An exact fraction or simplified decimal.',
  }
}

function mutuallyExclusiveAxiomChoice(rng: Rng): Problem {
  const pAInt = rng.int(55, 80)
  const pBInt = rng.int(50, 75)
  const sumInt = pAInt + pBInt

  const pAStr = (pAInt / 100).toFixed(2)
  const pBStr = (pBInt / 100).toFixed(2)
  const sumStr = (sumInt / 100).toFixed(2)

  const options = rng.shuffle([
    {
      id: 'exceeds_one',
      label: `No, because if they were mutually exclusive, $P(A \\cup B) = P(A) + P(B) = ${sumStr}$, which exceeds $1$.`,
    },
    { id: 'any_under_one', label: 'Yes, any two events with probabilities under $1$ can be mutually exclusive.' },
    { id: 'product_inter', label: `Yes, provided that $P(A \\cap B) = ${pAStr} \\times ${pBStr}$.` },
    { id: 'must_sum_one', label: 'No, because $P(A) + P(B)$ must sum to exactly $1$.' },
  ])

  return {
    statement: `Suppose $P(A) = ${pAStr}$ and $P(B) = ${pBStr}$. Can events $A$ and $B$ be mutually exclusive?`,
    answer: { kind: 'choice', options, correctId: 'exceeds_one' },
    solution: [
      { text: 'For mutually exclusive events, $P(A \\cap B) = 0$, so $P(A \\cup B) = P(A) + P(B)$.' },
      { text: `Here $P(A) + P(B) = ${pAStr} + ${pBStr} = ${sumStr} > 1$.` },
      { text: 'Since the probability of any event cannot exceed $1$, $A$ and $B$ cannot be mutually exclusive.' },
    ],
    hints: [
      'For mutually exclusive events, $P(A \\cup B) = P(A) + P(B)$.',
      'Recall that the probability of any event cannot exceed $1$.',
    ],
  }
}

function vennWordProblemSolveNeither(rng: Rng): Problem {
  const total = 100
  const { pAInt: nA, pBInt: nB, pInterInt: nAB, pUnionInt: nUnion, pNeitherInt: nNeither } = pickVennPartition(rng)

  const ansRat = rat(nNeither, total)
  const ansVal = ratToLatex(ansRat)
  const unreducedTex = `\\frac{${nNeither}}{100}`
  const texStep = unreducedTex === ansVal ? `P = ${ansVal}` : `P = ${unreducedTex} = ${ansVal}`

  return {
    statement: `In a cohort of $100$ students, $${nA}$ take Biology, $${nB}$ take Chemistry, and $${nAB}$ take both. Find the probability that a randomly chosen student takes neither Biology nor Chemistry.`,
    answer: { kind: 'number', value: ansVal },
    solution: [
      { text: 'Find the total number of students taking at least one subject:', tex: `N(\\text{at least one}) = ${nA} + ${nB} - ${nAB} = ${nUnion}` },
      { text: 'Subtract from $100$ to find students taking neither subject:', tex: `N(\\text{neither}) = 100 - ${nUnion} = ${nNeither}` },
      { text: 'Divide by $100$:', tex: texStep },
    ],
    hints: [
      'Calculate $N(\\text{Bio} \\cup \\text{Chem}) = N_A + N_B - N_{AB}$.',
      `Subtract from $100$ to get $N(\\text{neither}) = ${nNeither}$, then divide by $100$.`,
    ],
    inputHint: 'An exact fraction or simplified decimal.',
  }
}

function tier3(rng: Rng): Problem {
  const choice = rng.int(1, 3)
  if (choice === 1) return vennWordProblem(rng)
  if (choice === 2) return mutuallyExclusiveAxiomChoice(rng)
  return vennWordProblemSolveNeither(rng)
}

export const template: SkillTemplate = {
  skillId: 'prob_rules',
  theory,
  expectedSeconds: { 1: 60, 2: 75, 3: 120 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
