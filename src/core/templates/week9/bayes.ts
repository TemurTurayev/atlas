import { rat, ratToLatex } from '../../math/rational'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'Law of Total Probability: for partition $B_1, \\dots, B_k$, $P(A) = \\sum_{i=1}^k P(A|B_i) P(B_i)$.',
  'Bayes’ Theorem calculates posterior probability: $P(B_j|A) = \\frac{P(A|B_j) P(B_j)}{P(A)} = \\frac{P(A|B_j) P(B_j)}{\\sum_{i=1}^k P(A|B_i) P(B_i)}$.',
  'In medical diagnostics: $P(\\text{Disease}|\\text{Test}^+) = \\frac{\\text{Sensitivity} \\cdot \\text{Prevalence}}{P(\\text{Test}^+)}$, known as Positive Predictive Value (PPV).',
  'False positive paradox: when a disease is rare (low prevalence), even a highly accurate test can have a low PPV.',
  'Tree diagrams: multiply probabilities along branches to find joint probabilities, then sum target branches.',
  'Common mistakes: confusing prior $P(D)$ with posterior $P(D|T^+)$, or confusing sensitivity $P(T^+|D)$ with PPV $P(D|T^+)$.',
].join('\n')

function totalProbability2(rng: Rng): Problem {
  const pAInt = rng.pick([30, 40, 50, 60, 70, 80])
  const pBInt = 100 - pAInt
  const dAInt = rng.pick([1, 2, 3, 4, 5])
  const dBInt = rng.pick([4, 5, 6, 8, 10])

  const pAStr = (pAInt / 100).toFixed(2)
  const pBStr = (pBInt / 100).toFixed(2)
  const dAStr = (dAInt / 100).toFixed(2)
  const dBStr = (dBInt / 100).toFixed(2)

  const totDefectNum = pAInt * dAInt + pBInt * dBInt
  const totDefectRat = rat(totDefectNum, 10000)
  const totDefectTex = ratToLatex(totDefectRat)

  const scenario = rng.pick([
    { nameA: 'Factory A', nameB: 'Factory B', item: 'components' },
    { nameA: 'Supplier X', nameB: 'Supplier Y', item: 'microchips' },
    { nameA: 'Assembly Line 1', nameB: 'Assembly Line 2', item: 'batteries' },
  ])

  return {
    statement: `${scenario.nameA} produces $${pAStr}$ of all ${scenario.item} with a defect rate of $${dAStr}$. ${scenario.nameB} produces the remaining $${pBStr}$ of ${scenario.item} with a defect rate of $${dBStr}$. Find the overall probability that a randomly chosen item is defective.`,
    answer: { kind: 'number', value: totDefectTex },
    solution: [
      { text: 'Apply the Law of Total Probability:', tex: 'P(D) = P(D|A)P(A) + P(D|B)P(B)' },
      { text: 'Substitute the given branch probabilities:', tex: `P(D) = (${dAStr})(${pAStr}) + (${dBStr})(${pBStr}) = ${(pAInt * dAInt) / 10000} + ${(pBInt * dBInt) / 10000} = ${totDefectTex}` },
    ],
    hints: [
      'Use the Law of Total Probability: $P(D) = P(D|A)P(A) + P(D|B)P(B)$.',
      `Multiply and sum: $(${dAStr})(${pAStr}) + (${dBStr})(${pBStr})$.`,
    ],
    inputHint: 'An exact fraction or decimal.',
  }
}

function directBayesFormula(rng: Rng): Problem {
  const pSensInt = rng.pick([70, 75, 80, 85, 90, 95])
  const pPrevInt = rng.pick([4, 5, 8, 10, 12, 15, 20])
  const jointPct = (pSensInt * pPrevInt) / 100
  const minTotInt = Math.ceil(jointPct) + 5
  const possibleTot = [minTotInt, minTotInt + 5, minTotInt + 10, minTotInt + 15, minTotInt + 20].filter((v) => v <= 90)
  const pTotInt = rng.pick(possibleTot)

  const ansRat = rat(pSensInt * pPrevInt, 100 * pTotInt)
  const ansTex = ratToLatex(ansRat)

  const pTotStr = (pTotInt / 100).toFixed(2)
  const pSensStr = (pSensInt / 100).toFixed(2)
  const pPrevStr = (pPrevInt / 100).toFixed(2)
  const jointStr = ((pSensInt * pPrevInt) / 10000).toFixed(3)

  return {
    statement: `A screening procedure yields a positive result in $P(T^+) = ${pTotStr}$ of all tested individuals. For individuals with condition $C$, $P(T^+ \\mid C) = ${pSensStr}$, and the prevalence of condition $C$ is $P(C) = ${pPrevStr}$. Find the posterior probability $P(C \\mid T^+)$.`,
    answer: { kind: 'number', value: ansTex },
    solution: [
      { text: 'Apply Bayes’ Theorem:', tex: 'P(C \\mid T^+) = \\frac{P(T^+ \\mid C) P(C)}{P(T^+)}' },
      { text: `Substitute $P(T^+ \\mid C) = ${pSensStr}$, $P(C) = ${pPrevStr}$, and $P(T^+) = ${pTotStr}$:`, tex: `P(C \\mid T^+) = \\frac{${pSensStr} \\cdot ${pPrevStr}}{${pTotStr}} = \\frac{${jointStr}}{${pTotStr}} = ${ansTex}` },
    ],
    hints: [
      'Use Bayes’ Theorem: $P(C \\mid T^+) = \\frac{P(T^+ \\mid C) P(C)}{P(T^+)}$.',
      `Multiply $${pSensStr}$ by $${pPrevStr}$ and divide by $${pTotStr}$.`,
    ],
    inputHint: 'An exact fraction.',
  }
}

function twoBranchBayesPrior(rng: Rng): Problem {
  const pAInt = rng.pick([30, 40, 50, 60, 70])
  const pBInt = 100 - pAInt
  const eAInt = rng.pick([2, 4, 5, 8, 10])
  const eBInt = rng.pick([3, 6, 9, 12, 15])

  const pAStr = (pAInt / 100).toFixed(2)
  const pBStr = (pBInt / 100).toFixed(2)
  const eAStr = (eAInt / 100).toFixed(2)
  const eBStr = (eBInt / 100).toFixed(2)

  const num = pAInt * eAInt
  const den = pAInt * eAInt + pBInt * eBInt
  const ansRat = rat(num, den)
  const ansTex = ratToLatex(ansRat)

  return {
    statement: `Machine A produces $${pAStr}$ of all output with error rate $P(E \\mid A) = ${eAStr}$. Machine B produces the remaining $${pBStr}$ of output with error rate $P(E \\mid B) = ${eBStr}$. An item selected at random is found to have an error. Find the posterior probability $P(A \\mid E)$.`,
    answer: { kind: 'number', value: ansTex },
    solution: [
      { text: 'Calculate the total probability of error $P(E)$:', tex: `P(E) = (${eAStr})(${pAStr}) + (${eBStr})(${pBStr}) = ${(num / 10000).toFixed(4)} + ${(pBInt * eBInt / 10000).toFixed(4)} = ${(den / 10000).toFixed(4)}` },
      { text: 'Apply Bayes’ Theorem for Machine A:', tex: `P(A \\mid E) = \\frac{P(E \\mid A)P(A)}{P(E)} = \\frac{${num}}{${den}} = ${ansTex}` },
    ],
    hints: [
      'First compute total error probability $P(E) = P(E|A)P(A) + P(E|B)P(B)$.',
      `Divide Machine A's error contribution ($${num}$) by total errors ($${den}$).`,
    ],
    inputHint: 'An exact fraction.',
  }
}

function tier1(rng: Rng): Problem {
  const choice = rng.int(1, 3)
  if (choice === 1) return totalProbability2(rng)
  if (choice === 2) return directBayesFormula(rng)
  return twoBranchBayesPrior(rng)
}

function medicalPPV(rng: Rng): Problem {
  const prev = rng.pick([5, 8, 10, 12, 15, 20, 25])
  const sens = rng.pick([75, 80, 85, 90, 95])
  const spec = rng.pick([80, 85, 90, 95])

  const prevStr = (prev / 100).toFixed(2)
  const sensStr = (sens / 100).toFixed(2)
  const fprStr = ((100 - spec) / 100).toFixed(2)

  const tp10000 = prev * sens
  const fp10000 = (100 - prev) * (100 - spec)
  const totPos10000 = tp10000 + fp10000
  const ansRat = rat(tp10000, totPos10000)
  const ansTex = ratToLatex(ansRat)

  const scenario = rng.pick([
    { name: 'diagnostic blood test', cond: 'condition' },
    { name: 'workplace screening test', cond: 'substance exposure' },
    { name: 'clinical antibody assay', cond: 'viral infection' },
  ])

  return {
    statement: `A ${scenario.name} for a ${scenario.cond} with prevalence $P(D^+) = ${prevStr}$ has sensitivity $P(T^+ \\mid D^+) = ${sensStr}$ and false positive rate $P(T^+ \\mid D^-) = ${fprStr}$. A patient tests positive ($T^+$). Find the Positive Predictive Value $P(D^+ \\mid T^+)$.`,
    answer: { kind: 'number', value: ansTex },
    solution: [
      { text: 'Calculate true positive ($TP$) and false positive ($FP$) counts out of 10,000 people:', tex: `TP = 10000 \\cdot (${prevStr}) \\cdot (${sensStr}) = ${tp10000}, \\quad FP = 10000 \\cdot (1 - ${prevStr}) \\cdot (${fprStr}) = ${fp10000}` },
      { text: 'Sum to find total positive tests:', tex: `N(T^+) = ${tp10000} + ${fp10000} = ${totPos10000}` },
      { text: 'Compute the posterior probability (PPV):', tex: `P(D^+ \\mid T^+) = \\frac{TP}{N(T^+)} = \\frac{${tp10000}}{${totPos10000}} = ${ansTex}` },
    ],
    hints: [
      'Calculate true positive rate ($P(T^+ \\mid D^+)P(D^+)$) and false positive rate ($P(T^+ \\mid D^-)P(D^-)$).',
      `Divide true positives ($${tp10000}$) by total positives ($${totPos10000}$).`,
    ],
    inputHint: 'An exact fraction.',
  }
}

function medicalNPV(rng: Rng): Problem {
  const prev = rng.pick([5, 8, 10, 12, 15, 20, 25])
  const sens = rng.pick([75, 80, 85, 90, 95])
  const spec = rng.pick([80, 85, 90, 95])

  const prevStr = (prev / 100).toFixed(2)
  const fnrStr = ((100 - sens) / 100).toFixed(2)
  const specStr = (spec / 100).toFixed(2)

  const tn10000 = (100 - prev) * spec
  const fn10000 = prev * (100 - sens)
  const totNeg10000 = tn10000 + fn10000
  const ansRat = rat(tn10000, totNeg10000)
  const ansTex = ratToLatex(ansRat)

  return {
    statement: `A diagnostic blood test for a condition with prevalence $P(D^+) = ${prevStr}$ has specificity $P(T^- \\mid D^-) = ${specStr}$ and false negative rate $P(T^- \\mid D^+) = ${fnrStr}$. A patient tests negative ($T^-$). Find the Negative Predictive Value $P(D^- \\mid T^-)$.`,
    answer: { kind: 'number', value: ansTex },
    solution: [
      { text: 'Calculate true negative ($TN$) and false negative ($FN$) counts out of 10,000 people:', tex: `TN = 10000 \\cdot (1 - ${prevStr}) \\cdot (${specStr}) = ${tn10000}, \\quad FN = 10000 \\cdot (${prevStr}) \\cdot (${fnrStr}) = ${fn10000}` },
      { text: 'Sum to find total negative tests:', tex: `N(T^-) = ${tn10000} + ${fn10000} = ${totNeg10000}` },
      { text: 'Compute the posterior probability (NPV):', tex: `P(D^- \\mid T^-) = \\frac{TN}{N(T^-)} = \\frac{${tn10000}}{${totNeg10000}} = ${ansTex}` },
    ],
    hints: [
      'Calculate true negatives ($P(T^- \\mid D^-)P(D^-)$) and false negatives ($P(T^- \\mid D^+)P(D^+)$).',
      `Divide true negatives ($${tn10000}$) by total negatives ($${totNeg10000}$).`,
    ],
    inputHint: 'An exact fraction.',
  }
}

function spamFilterPPV(rng: Rng): Problem {
  const spamPct = rng.pick([10, 15, 20, 25, 30])
  const spamDetection = rng.pick([80, 85, 90, 95])
  const hamFalsePositive = rng.pick([5, 10, 15])

  const spamStr = (spamPct / 100).toFixed(2)
  const sensStr = (spamDetection / 100).toFixed(2)
  const fprStr = (hamFalsePositive / 100).toFixed(2)

  const tp = spamPct * spamDetection
  const fp = (100 - spamPct) * hamFalsePositive
  const totPos = tp + fp
  const ansRat = rat(tp, totPos)
  const ansTex = ratToLatex(ansRat)

  return {
    statement: `An email spam filter operates on an inbox where $P(\\text{Spam}) = ${spamStr}$. The filter correctly flags $P(\\text{Flagged} \\mid \\text{Spam}) = ${sensStr}$ of spam emails and incorrectly flags $P(\\text{Flagged} \\mid \\text{Ham}) = ${fprStr}$ of legitimate emails. An email is flagged. Find the probability that it is actually spam, $P(\\text{Spam} \\mid \\text{Flagged})$.`,
    answer: { kind: 'number', value: ansTex },
    solution: [
      { text: 'Calculate flagged spam ($TP$) and flagged legitimate emails ($FP$) per 10,000 emails:', tex: `TP = 10000 \\cdot (${spamStr}) \\cdot (${sensStr}) = ${tp}, \\quad FP = 10000 \\cdot (1 - ${spamStr}) \\cdot (${fprStr}) = ${fp}` },
      { text: 'Sum to find total flagged emails:', tex: `N(\\text{Flagged}) = ${tp} + ${fp} = ${totPos}` },
      { text: 'Compute posterior probability:', tex: `P(\\text{Spam} \\mid \\text{Flagged}) = \\frac{${tp}}{${totPos}} = ${ansTex}` },
    ],
    hints: [
      'Calculate true flagged spam rate and false flagged ham rate.',
      `Divide flagged spam ($${tp}$) by total flagged emails ($${totPos}$).`,
    ],
    inputHint: 'An exact fraction.',
  }
}

function tier2(rng: Rng): Problem {
  const choice = rng.int(1, 3)
  if (choice === 1) return medicalPPV(rng)
  if (choice === 2) return medicalNPV(rng)
  return spamFilterPPV(rng)
}

function threeBranchBayes(rng: Rng): Problem {
  const setup = rng.pick([
    { pA: 50, pB: 30, pC: 20, dA: 2, dB: 4 },
    { pA: 40, pB: 35, pC: 25, dA: 2, dB: 4 },
    { pA: 60, pB: 25, pC: 15, dA: 1, dB: 3 },
    { pA: 45, pB: 35, pC: 20, dA: 2, dB: 3 },
  ])
  const cDefectRate = rng.pick([6, 8, 9, 10, 12, 14, 15])

  const aCount = setup.pA * setup.dA
  const bCount = setup.pB * setup.dB
  const cCount = setup.pC * cDefectRate
  const totDefectCount = aCount + bCount + cCount

  const targetLine = rng.pick(['A', 'B', 'C'])
  const targetCount = targetLine === 'A' ? aCount : targetLine === 'B' ? bCount : cCount

  const ansRat = rat(targetCount, totDefectCount)
  const ansTex = ratToLatex(ansRat)

  return {
    statement: `Three assembly lines A, B, and C supply $${setup.pA}\\%$, $${setup.pB}\\%$, and $${setup.pC}\\%$ of a hospital’s syringes. Line A has a $${setup.dA}\\%$ defect rate, Line B has a $${setup.dB}\\%$ defect rate, and Line C has a $${cDefectRate}\\%$ defect rate. A randomly inspected syringe is found to be defective. What is the probability that it came from Line ${targetLine}?`,
    answer: { kind: 'number', value: ansTex },
    solution: [
      { text: 'Calculate defective counts per 10,000 syringes for Lines A, B, and C:', tex: `A: ${100 * setup.pA} \\cdot 0.0${setup.dA} = ${aCount}, \\quad B: ${100 * setup.pB} \\cdot 0.0${setup.dB} = ${bCount}, \\quad C: ${100 * setup.pC} \\cdot 0.${cDefectRate < 10 ? '0' + cDefectRate : cDefectRate} = ${cCount}` },
      { text: 'Find total defective syringes out of 10,000:', tex: `N(\\text{Defective}) = ${aCount} + ${bCount} + ${cCount} = ${totDefectCount}` },
      { text: `Apply Bayes’ Theorem for Line ${targetLine}:`, tex: `P(${targetLine} \\mid \\text{Defective}) = \\frac{${targetCount}}{${totDefectCount}} = ${ansTex}` },
    ],
    hints: [
      'Use the Law of Total Probability to find the total defective rate, then divide the target line’s contribution by the total.',
      `Divide Line ${targetLine}’s defect count ($${targetCount}$) by total defects ($${totDefectCount}$).`,
    ],
    inputHint: 'An exact fraction.',
  }
}

function falsePositiveParadoxChoice(rng: Rng): Problem {
  const scenario = rng.pick([
    { topic: 'medical screening for a rare disease', prev: '0.001', sens: '99\\%', spec: '99\\%', event: 'Positive Predictive Value', cond: 'P(D^+ \\mid T^+) < 10\\%' },
    { topic: 'automated security screening for rare threats', prev: '0.002', sens: '98\\%', spec: '98\\%', event: 'precision rate', cond: 'P(\\text{Threat} \\mid \\text{Alarm}) < 10\\%' },
    { topic: 'rare financial fraud detection', prev: '0.001', sens: '99\\%', spec: '99\\%', event: 'true fraud rate given alert', cond: 'P(\\text{Fraud} \\mid \\text{Alert}) < 10\\%' },
  ])

  const options = rng.shuffle([
    {
      id: 'low_prevalence',
      label: 'Because the absolute number of false positives from the large healthy population exceeds the true positives from the small diseased population.',
    },
    {
      id: 'low_sensitivity',
      label: 'Because the test sensitivity is too low.',
    },
    {
      id: 'high_prevalence',
      label: 'Because healthy individuals always test positive.',
    },
    {
      id: 'sample_bias',
      label: 'Because the sample size was too small.',
    },
  ])

  return {
    statement: `In ${scenario.topic} ($P(D^+) = ${scenario.prev}$), why can a highly accurate test (e.g. $${scenario.sens}$ sensitivity, $${scenario.spec}$ specificity) still yield a low ${scenario.event} ($${scenario.cond}$)?`,
    answer: { kind: 'choice', options, correctId: 'low_prevalence' },
    solution: [
      { text: 'In a large population, low prevalence means the healthy population is vast compared to the diseased population.' },
      { text: 'Even a small false positive percentage on a huge healthy group generates more false alarms than the true positives from the small diseased group.' },
      { text: 'Thus, the ratio of true positives to total positive tests remains low.' },
    ],
    hints: [
      'Compare the size of the target population to the non-target population.',
      'Multiply the false positive rate by the large non-target population.',
    ],
  }
}

function tier3(rng: Rng): Problem {
  return rng.chance(0.25) ? falsePositiveParadoxChoice(rng) : threeBranchBayes(rng)
}

export const template: SkillTemplate = {
  skillId: 'bayes',
  theory,
  expectedSeconds: { 1: 60, 2: 75, 3: 120 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
