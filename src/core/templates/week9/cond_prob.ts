import { rat, ratToLatex } from '../../math/rational'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'Conditional probability $P(A|B) = \\frac{P(A \\cap B)}{P(B)}$ measures the likelihood of $A$ given that $B$ has occurred ($P(B) > 0$).',
  'Multiplication rule: $P(A \\cap B) = P(A|B) P(B) = P(B|A) P(A)$.',
  'Two events $A$ and $B$ are independent if and only if $P(A \\cap B) = P(A) P(B)$, or equivalently $P(A|B) = P(A)$.',
  'Two-way contingency tables allow calculating conditional probabilities directly by restricting to the row or column total.',
  'Independence test: compare $P(A \\cap B)$ to $P(A) P(B)$; if they differ, the events are dependent.',
  'Common mistakes: confusing $P(A|B)$ with $P(B|A)$, or assuming events are independent without verifying $P(A \\cap B) = P(A) P(B)$.',
].join('\n')

function directCondProb(rng: Rng): Problem {
  const useDecimal = rng.chance(0.5)
  if (useDecimal) {
    const pairs: [number, number][] = [
      [40, 25], [40, 50], [40, 75],
      [50, 20], [50, 30], [50, 40], [50, 50], [50, 60], [50, 70],
      [60, 25], [60, 50], [60, 75],
      [80, 25], [80, 50], [80, 75], [70, 20], [70, 50], [30, 50],
    ]
    const [pBInt, pCondInt] = rng.pick(pairs)
    const pInterInt = (pBInt * pCondInt) / 100
    const pBStr = (pBInt / 100).toFixed(2)
    const pInterStr = (pInterInt / 100).toFixed(2)
    const expected = (pCondInt / 100).toFixed(2)

    return {
      statement: `Given $P(B) = ${pBStr}$ and $P(A \\cap B) = ${pInterStr}$, find the conditional probability $P(A|B)$.`,
      answer: { kind: 'number', value: expected },
      solution: [
        { text: 'Apply the conditional probability formula:', tex: 'P(A|B) = \\frac{P(A \\cap B)}{P(B)}' },
        { text: `Substitute $P(A \\cap B) = ${pInterStr}$ and $P(B) = ${pBStr}$:`, tex: `P(A|B) = \\frac{${pInterStr}}{${pBStr}} = ${expected}` },
      ],
      hints: [
        'Recall the formula $P(A|B) = \\frac{P(A \\cap B)}{P(B)}$.',
        `Divide $${pInterStr}$ by $${pBStr}$.`,
      ],
      inputHint: 'A decimal with two decimal places.',
    }
  }

  const denB = rng.pick([5, 8, 10, 12])
  const numB = rng.int(2, denB - 1)
  const numInter = rng.int(1, numB - 1)

  const ratInter = rat(numInter, denB)
  const ratB = rat(numB, denB)
  const ratCond = rat(numInter, numB)

  const texInter = ratToLatex(ratInter)
  const texB = ratToLatex(ratB)
  const texCond = ratToLatex(ratCond)

  return {
    statement: `Given $P(B) = ${texB}$ and $P(A \\cap B) = ${texInter}$, find the conditional probability $P(A|B)$.`,
    answer: { kind: 'number', value: texCond },
    solution: [
      { text: 'Apply the conditional probability formula:', tex: 'P(A|B) = \\frac{P(A \\cap B)}{P(B)}' },
      { text: `Substitute $P(A \\cap B) = ${texInter}$ and $P(B) = ${texB}$:`, tex: `P(A|B) = \\frac{${texInter}}{${texB}} = ${texCond}` },
    ],
    hints: [
      'Recall the formula $P(A|B) = \\frac{P(A \\cap B)}{P(B)}$.',
      `Divide $${texInter}$ by $${texB}$.`,
    ],
    inputHint: 'An exact fraction.',
  }
}

function multiplicationRule(rng: Rng): Problem {
  const pBInt = rng.pick([20, 30, 40, 50, 60, 70, 80])
  const pCondInt = rng.pick([15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80])
  const pInterVal = (pBInt * pCondInt) / 10000

  const pBStr = (pBInt / 100).toFixed(2)
  const pCondStr = (pCondInt / 100).toFixed(2)
  const pInterStr = String(pInterVal)

  return {
    statement: `Given $P(B) = ${pBStr}$ and conditional probability $P(A|B) = ${pCondStr}$, find the joint probability $P(A \\cap B)$.`,
    answer: { kind: 'number', value: pInterStr },
    solution: [
      { text: 'Apply the multiplication rule for conditional probability:', tex: 'P(A \\cap B) = P(A|B) \\cdot P(B)' },
      { text: `Substitute $P(A|B) = ${pCondStr}$ and $P(B) = ${pBStr}$:`, tex: `P(A \\cap B) = ${pCondStr} \\cdot ${pBStr} = ${pInterStr}` },
    ],
    hints: [
      'Use the multiplication rule: $P(A \\cap B) = P(A|B) \\cdot P(B)$.',
      `Multiply $${pCondStr}$ by $${pBStr}$.`,
    ],
    inputHint: 'An exact decimal.',
  }
}

function complementaryCondProb(rng: Rng): Problem {
  const pairs: [number, number][] = [
    [40, 25], [40, 50], [40, 75],
    [50, 20], [50, 30], [50, 40], [50, 50], [50, 60], [50, 70],
    [60, 25], [60, 50], [60, 75],
    [80, 25], [80, 50], [80, 75], [70, 20], [70, 50], [30, 50],
  ]
  const [pBInt, pCondInt] = rng.pick(pairs)
  const pInterInt = (pBInt * pCondInt) / 100
  const pBStr = (pBInt / 100).toFixed(2)
  const pInterStr = (pInterInt / 100).toFixed(2)

  const compVal = ((100 - pCondInt) / 100).toFixed(2)

  return {
    statement: `Given $P(B) = ${pBStr}$ and $P(A \\cap B) = ${pInterStr}$, find the conditional probability of the complement $P(A^c \\mid B)$.`,
    answer: { kind: 'number', value: compVal },
    solution: [
      { text: 'First compute $P(A \\mid B)$:', tex: `P(A \\mid B) = \\frac{P(A \\cap B)}{P(B)} = \\frac{${pInterStr}}{${pBStr}} = ${(pCondInt / 100).toFixed(2)}` },
      { text: 'Apply the complement rule for conditional probability:', tex: `P(A^c \\mid B) = 1 - P(A \\mid B) = 1 - ${(pCondInt / 100).toFixed(2)} = ${compVal}` },
    ],
    hints: [
      'Find $P(A|B) = \\frac{P(A \\cap B)}{P(B)}$ first.',
      `Subtract $P(A|B)$ from $1$.`,
    ],
    inputHint: 'A decimal with two decimal places.',
  }
}

function tier1(rng: Rng): Problem {
  const choice = rng.int(1, 3)
  if (choice === 1) return directCondProb(rng)
  if (choice === 2) return multiplicationRule(rng)
  return complementaryCondProb(rng)
}

function contingencyTable(rng: Rng): Problem {
  const a = rng.int(15, 60)
  const b = rng.int(10, 50)
  const c = rng.int(12, 55)
  const d = rng.int(15, 60)

  const rowA = a + b
  const colYes = a + c
  const askTreatment = rng.chance(0.5)

  if (askTreatment) {
    const ansRat = rat(a, rowA)
    const ansTex = ratToLatex(ansRat)
    const unreducedTex = `\\frac{${a}}{${rowA}}`
    const fracTex = unreducedTex === ansTex ? ansTex : `${unreducedTex} = ${ansTex}`

    return {
      statement: `In a clinical trial, $${a}$ treated patients improved, $${b}$ treated patients did not improve, $${c}$ control patients improved, and $${d}$ control patients did not improve. Find the conditional probability that a treated patient improved, $P(\\text{Improved} \\mid \\text{Treated})$.`,
      answer: { kind: 'number', value: ansTex },
      solution: [
        { text: `Restrict the sample space to treated patients ($n = ${a} + ${b} = ${rowA}$):`, tex: `N(\\text{Treated}) = ${a} + ${b} = ${rowA}` },
        { text: `Divide the number of improved treated patients ($${a}$) by the treated total:`, tex: `P(\\text{Improved} \\mid \\text{Treated}) = ${fracTex}` },
      ],
      hints: [
        'Restrict the denominator to the total number of treated patients ($a + b$).',
        `Divide $${a}$ by $${rowA}$.`,
      ],
      inputHint: 'An exact fraction.',
    }
  }

  const ansRat = rat(a, colYes)
  const ansTex = ratToLatex(ansRat)
  const unreducedTex = `\\frac{${a}}{${colYes}}`
  const fracTex = unreducedTex === ansTex ? ansTex : `${unreducedTex} = ${ansTex}`

  return {
    statement: `In a clinical trial, $${a}$ treated patients improved, $${b}$ treated patients did not improve, $${c}$ control patients improved, and $${d}$ control patients did not improve. Find the conditional probability that an improved patient received treatment, $P(\\text{Treated} \\mid \\text{Improved})$.`,
    answer: { kind: 'number', value: ansTex },
    solution: [
      { text: `Restrict the sample space to patients who improved ($n = ${a} + ${c} = ${colYes}$):`, tex: `N(\\text{Improved}) = ${a} + ${c} = ${colYes}` },
      { text: `Divide the number of improved treated patients ($${a}$) by the total improved count:`, tex: `P(\\text{Treated} \\mid \\text{Improved}) = ${fracTex}` },
    ],
    hints: [
      'Restrict the denominator to the total number of improved patients ($a + c$).',
      `Divide $${a}$ by $${colYes}$.`,
    ],
    inputHint: 'An exact fraction.',
  }
}

function testIndependence(rng: Rng): Problem {
  const pAInt = rng.pick([20, 30, 40, 50, 60])
  const pBInt = rng.pick([20, 30, 40, 50])
  const isIndep = rng.chance(0.5)
  const prodVal = (pAInt * pBInt) / 10000
  const prodStr = prodVal.toFixed(2)

  const pAStr = (pAInt / 100).toFixed(2)
  const pBStr = (pBInt / 100).toFixed(2)

  let pInterVal: number
  if (isIndep) {
    pInterVal = prodVal
  } else {
    const minInter = Math.max(5, pAInt + pBInt - 95)
    const maxInter = Math.min(pAInt - 5, pBInt - 5, 95)
    const candidates: number[] = []
    for (let v = minInter; v <= maxInter; v += 5) {
      if (Math.abs(v / 100 - prodVal) > 1e-4) {
        candidates.push(v)
      }
    }
    const pickedVal = candidates.length > 0 ? rng.pick(candidates) : minInter
    pInterVal = pickedVal / 100
  }
  const pInterStr = pInterVal.toFixed(2)

  const correctId = isIndep ? 'yes_indep' : 'no_dep'

  let options
  if (isIndep) {
    options = rng.shuffle([
      { id: 'yes_indep', label: `Yes, because $P(A \\cap B) = P(A)P(B) = ${prodStr}$.` },
      { id: 'no_dep', label: 'No, because $P(A \\cap B) \\neq 0$.' },
      { id: 'no_sum', label: 'No, because $P(A) + P(B) \\neq 1$.' },
      { id: 'cannot_tell', label: 'Cannot be determined without knowing $P(A \\cup B)$.' },
    ])
  } else {
    options = rng.shuffle([
      { id: 'no_dep', label: `No, because $P(A \\cap B) = ${pInterStr} \\neq P(A)P(B) = ${prodStr}$.` },
      { id: 'yes_indep', label: 'Yes, because both probabilities $P(A)$ and $P(B)$ are positive.' },
      { id: 'no_sum', label: 'No, because $P(A) + P(B) \\neq 1$.' },
      { id: 'cannot_tell', label: 'Cannot be determined without knowing $P(A \\cup B)$.' },
    ])
  }

  return {
    statement: `Suppose $P(A) = ${pAStr}$, $P(B) = ${pBStr}$, and $P(A \\cap B) = ${pInterStr}$. Are events $A$ and $B$ independent?`,
    answer: { kind: 'choice', options, correctId },
    solution: [
      { text: 'Calculate the product of individual probabilities:', tex: `P(A) \\cdot P(B) = ${pAStr} \\cdot ${pBStr} = ${prodStr}` },
      { text: `Compare $P(A \\cap B) = ${pInterStr}$ with $P(A)P(B) = ${prodStr}$:` },
      { text: isIndep ? 'Since $P(A \\cap B) = P(A)P(B)$, the events are independent.' : 'Since $P(A \\cap B) \\neq P(A)P(B)$, the events are dependent.' },
    ],
    hints: [
      'Two events are independent if and only if $P(A \\cap B) = P(A) \\cdot P(B)$.',
      `Multiply $${pAStr}$ by $${pBStr}$ and compare to $${pInterStr}$.`,
    ],
  }
}

function tier2(rng: Rng): Problem {
  return rng.chance(0.5) ? contingencyTable(rng) : testIndependence(rng)
}

function reverseCond(rng: Rng): Problem {
  const p11 = rng.pick([10, 12, 15, 20, 24, 30])
  const p10 = rng.int(10, 30)
  const p01 = rng.int(10, 30)

  const pAInt = p10 + p11
  const pBInt = p01 + p11
  const pInterInt = p11

  const pAStr = (pAInt / 100).toFixed(2)
  const pBStr = (pBInt / 100).toFixed(2)
  const pInterStr = (pInterInt / 100).toFixed(2)

  const ratBA = rat(pInterInt, pAInt)
  const texBA = ratToLatex(ratBA)

  return {
    statement: `Given $P(A) = ${pAStr}$, $P(B) = ${pBStr}$, and joint probability $P(A \\cap B) = ${pInterStr}$, find the conditional probability $P(B|A)$.`,
    answer: { kind: 'number', value: texBA },
    solution: [
      { text: 'Apply the definition of conditional probability:', tex: 'P(B|A) = \\frac{P(A \\cap B)}{P(A)}' },
      { text: `Substitute $P(A \\cap B) = ${pInterStr}$ and $P(A) = ${pAStr}$:`, tex: `P(B|A) = \\frac{${pInterStr}}{${pAStr}} = ${texBA}` },
    ],
    hints: [
      'Notice the conditioning event is $A$, so $P(B|A) = \\frac{P(A \\cap B)}{P(A)}$.',
      `Divide $${pInterStr}$ by $${pAStr}$.`,
    ],
    inputHint: 'An exact fraction or decimal.',
  }
}

function diagnosticJoint(rng: Rng): Problem {
  const pPrevInt = rng.pick([4, 5, 8, 10, 12, 15, 20])
  const pSensInt = rng.pick([70, 75, 80, 85, 90, 95])
  const pJointVal = (pPrevInt * pSensInt) / 10000

  const pPrevStr = (pPrevInt / 100).toFixed(2)
  const pSensStr = (pSensInt / 100).toFixed(2)
  const pJointStr = String(pJointVal)

  return {
    statement: `A medical screening test for a condition with prevalence $P(D^+) = ${pPrevStr}$ has sensitivity $P(T^+ \\mid D^+) = ${pSensStr}$. Find the joint probability that a randomly selected person has the condition AND tests positive, $P(D^+ \\cap T^+)$.`,
    answer: { kind: 'number', value: pJointStr },
    solution: [
      { text: 'Apply the multiplication rule:', tex: 'P(D^+ \\cap T^+) = P(T^+ \\mid D^+) \\cdot P(D^+)' },
      { text: `Substitute $P(T^+ \\mid D^+) = ${pSensStr}$ and $P(D^+) = ${pPrevStr}$:`, tex: `P(D^+ \\cap T^+) = ${pSensStr} \\cdot ${pPrevStr} = ${pJointStr}` },
    ],
    hints: [
      'Use the multiplication rule: $P(D^+ \\cap T^+) = P(T^+ \\mid D^+) \\cdot P(D^+)$.',
      `Multiply $${pSensStr}$ by $${pPrevStr}$.`,
    ],
    inputHint: 'An exact decimal.',
  }
}

function tier3(rng: Rng): Problem {
  return rng.chance(0.5) ? reverseCond(rng) : diagnosticJoint(rng)
}

export const template: SkillTemplate = {
  skillId: 'cond_prob',
  theory,
  expectedSeconds: { 1: 60, 2: 75, 3: 120 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
