import type { Rng } from '../../random/rng'
import { rat, ratToLatex } from '../../math/rational'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'Positive Predictive Value (PPV) depends strongly on disease prevalence: $\\text{PPV} = \\frac{\\text{sens} \\cdot \\text{prev}}{\\text{sens} \\cdot \\text{prev} + (1-\\text{spec})(1-\\text{prev})}$.',
  'Natural frequencies method: in a population of $N = 1\,000$ or $10\,000$, $\\text{Diseased} = N \\cdot \\text{prev}$, $TP = \\text{Diseased} \\cdot \\text{sens}$, $FP = (N - \\text{Diseased})(1 - \\text{spec})$, and $\\text{PPV} = \\frac{TP}{TP + FP}$.',
  'Negative Predictive Value (NPV): $\\text{NPV} = \\frac{\\text{TN}}{\\text{TN} + \\text{FN}} = \\frac{\\text{spec}(1-\\text{prev})}{\\text{spec}(1-\\text{prev}) + (1-\\text{sens})\\text{prev}}$.',
  'Likelihood Ratios: Positive Likelihood Ratio $\\text{LR}^+ = \\frac{\\text{Sensitivity}}{1 - \\text{Specificity}}$, Negative Likelihood Ratio $\\text{LR}^- = \\frac{1 - \\text{Sensitivity}}{\\text{Specificity}}$.',
  'False Positive Paradox: in low-prevalence screening, even a test with 95% sensitivity and 95% specificity can yield a PPV below 50% because $FP$ outnumbers $TP$.',
  'Common mistakes: assuming PPV is an intrinsic constant of a diagnostic test independent of disease prevalence.',
].join('\n')

interface DiagContext {
  readonly testName: string
  readonly disease: string
}

const DIAG_CONTEXTS: readonly DiagContext[] = [
  { testName: 'rapid antigen test', disease: 'influenza A infection' },
  { testName: 'screening mammography', disease: 'breast carcinoma' },
  { testName: 'fecal immunochemical test (FIT)', disease: 'colorectal neoplasia' },
  { testName: 'D-dimer assay', disease: 'deep vein thrombosis' },
  { testName: 'NT-proBNP immunoassay', disease: 'congestive heart failure' },
  { testName: 'IGRA blood test', disease: 'latent tuberculosis infection' },
  { testName: 'rapid PCR swab', disease: 'RSV infection' },
  { testName: 'anti-tTG IgA antibody test', disease: 'celiac disease' },
  { testName: 'high-risk HPV DNA test', disease: 'cervical intraepithelial neoplasia' },
  { testName: 'serum free light chain assay', disease: 'multiple myeloma' },
]

function withArticle(phrase: string): string {
  const trimmed = phrase.trim()
  const first = trimmed.toLowerCase()[0]
  const article = ['a', 'e', 'i', 'o', 'u'].includes(first) ? 'an' : 'a'
  return `${article} ${trimmed}`
}

function ppvFromNaturalFreq(rng: Rng): Problem {
  const ctx = rng.pick(DIAG_CONTEXTS)
  const N = 10000
  const prevP = rng.pick([1, 2, 4, 5, 10, 20])
  const sensP = rng.pick([80, 85, 90, 95])
  const specP = rng.pick([80, 85, 90, 95])
  const testArt = withArticle(ctx.testName)

  const diseased = (N * prevP) / 100
  const healthy = N - diseased
  const tp = (diseased * sensP) / 100
  const fp = (healthy * (100 - specP)) / 100

  const r = rat(tp, tp + fp)
  const ansTex = ratToLatex(r)

  return {
    statement: `In a population screening program for ${ctx.disease} using ${testArt} ($n = 10\\,000$), disease prevalence is ${prevP}%. The test has sensitivity ${sensP}% and specificity ${specP}%. Calculate the Positive Predictive Value (PPV) as a simplified fraction.`,
    answer: { kind: 'number', value: ansTex },
    solution: [
      { text: `Calculate natural counts in $N = 10\\,000$: diseased $= ${diseased}$, healthy $= ${healthy}$.` },
      { text: `Compute $TP = ${diseased} \\times ${sensP}\\% = ${tp}$ and $FP = ${healthy} \\times (100 - ${specP})\\% = ${fp}$.` },
      { text: 'Calculate PPV:', tex: `\\text{PPV} = \\frac{TP}{TP + FP} = \\frac{${tp}}{${tp} + ${fp}} = \\frac{${tp}}{${tp + fp}} = ${ansTex}` },
    ],
    hints: [
      `Compute the expected $TP = ${tp}$ and $FP = ${fp}$ in a population of 10,000.`,
      `Divide $TP = ${tp}$ by $TP + FP = ${tp + fp}$ and reduce to lowest terms.`,
    ],
    inputHint: 'A simplified fraction.',
  }
}

function npvFromNaturalFreq(rng: Rng): Problem {
  const ctx = rng.pick(DIAG_CONTEXTS)
  const N = 10000
  const prevP = rng.pick([1, 2, 4, 5, 10, 20])
  const sensP = rng.pick([80, 85, 90, 95])
  const specP = rng.pick([80, 85, 90, 95])
  const testArt = withArticle(ctx.testName)

  const diseased = (N * prevP) / 100
  const healthy = N - diseased
  const fn = (diseased * (100 - sensP)) / 100
  const tn = (healthy * specP) / 100

  const r = rat(tn, tn + fn)
  const ansTex = ratToLatex(r)

  return {
    statement: `In a screening trial for ${ctx.disease} using ${testArt} ($n = 10\\,000$), disease prevalence is ${prevP}%. The test has sensitivity ${sensP}% and specificity ${specP}%. Calculate the Negative Predictive Value (NPV) as a simplified fraction.`,
    answer: { kind: 'number', value: ansTex },
    solution: [
      { text: `Calculate natural counts in $N = 10\\,000$: diseased $= ${diseased}$, healthy $= ${healthy}$.` },
      { text: `Compute $TN = ${healthy} \\times ${specP}\\% = ${tn}$ and $FN = ${diseased} \\times (100 - ${sensP})\\% = ${fn}$.` },
      { text: 'Calculate NPV:', tex: `\\text{NPV} = \\frac{TN}{TN + FN} = \\frac{${tn}}{${tn} + ${fn}} = \\frac{${tn}}{${tn + fn}} = ${ansTex}` },
    ],
    hints: [
      `Compute expected $TN = ${tn}$ and $FN = ${fn}$ in a population of 10,000.`,
      `Divide $TN = ${tn}$ by $TN + FN = ${tn + fn}$ and reduce to lowest terms.`,
    ],
    inputHint: 'A simplified fraction.',
  }
}

function likelihoodRatioPositive(rng: Rng): Problem {
  const ctx = rng.pick(DIAG_CONTEXTS)
  const sensP = rng.pick([80, 85, 90, 95])
  const specP = rng.pick([80, 85, 90, 95])
  const fprP = 100 - specP
  const testArt = withArticle(ctx.testName)

  const r = rat(sensP, fprP)
  const ansTex = ratToLatex(r)

  return {
    statement: `A ${testArt} for ${ctx.disease} has sensitivity ${sensP}% and specificity ${specP}%. Calculate the Positive Likelihood Ratio ($\\text{LR}^+$) as a simplified fraction.`,
    answer: { kind: 'number', value: ansTex },
    solution: [
      { text: 'Apply the formula for Positive Likelihood Ratio:', tex: '\\text{LR}^+ = \\frac{\\text{Sensitivity}}{1 - \\text{Specificity}} = \\frac{\\text{Sensitivity}}{\\text{FPR}}' },
      { text: 'Substitute rates:', tex: `\\text{LR}^+ = \\frac{${sensP}\\%}{${fprP}\\%} = \\frac{${sensP}}{${fprP}} = ${ansTex}` },
    ],
    hints: [
      'Use $\\text{LR}^+ = \\frac{\\text{Sensitivity}}{1 - \\text{Specificity}}$.',
      `Divide sensitivity (${sensP}%) by $1 - \\text{specificity} = ${fprP}\\%$ and reduce.`,
    ],
    inputHint: 'A simplified fraction or an integer.',
  }
}

function likelihoodRatioNegative(rng: Rng): Problem {
  const ctx = rng.pick(DIAG_CONTEXTS)
  const sensP = rng.pick([80, 85, 90, 95])
  const specP = rng.pick([80, 85, 90, 95])
  const fnrP = 100 - sensP
  const testArt = withArticle(ctx.testName)

  const r = rat(fnrP, specP)
  const ansTex = ratToLatex(r)

  return {
    statement: `A ${testArt} for ${ctx.disease} has sensitivity ${sensP}% and specificity ${specP}%. Calculate the Negative Likelihood Ratio ($\\text{LR}^-$) as a simplified fraction.`,
    answer: { kind: 'number', value: ansTex },
    solution: [
      { text: 'Apply the formula for Negative Likelihood Ratio:', tex: '\\text{LR}^- = \\frac{1 - \\text{Sensitivity}}{\\text{Specificity}} = \\frac{\\text{FNR}}{\\text{Specificity}}' },
      { text: 'Substitute rates:', tex: `\\text{LR}^- = \\frac{${fnrP}\\%}{${specP}\\%} = \\frac{${fnrP}}{${specP}} = ${ansTex}` },
    ],
    hints: [
      'Use $\\text{LR}^- = \\frac{1 - \\text{Sensitivity}}{\\text{Specificity}}$.',
      `Divide $1 - \\text{sensitivity} = ${fnrP}\\%$ by specificity (${specP}%) and reduce.`,
    ],
    inputHint: 'A simplified fraction.',
  }
}

function tier1(rng: Rng): Problem {
  const choice = rng.int(1, 4)
  if (choice === 1) return ppvFromNaturalFreq(rng)
  if (choice === 2) return npvFromNaturalFreq(rng)
  if (choice === 3) return likelihoodRatioPositive(rng)
  return likelihoodRatioNegative(rng)
}

function ppvClinicVsScreening(rng: Rng): Problem {
  const ctx = rng.pick(DIAG_CONTEXTS)
  const testArt = withArticle(ctx.testName)
  const sensP = rng.pick([80, 90, 95])
  const specP = rng.pick([80, 90, 95])
  const prevClinicP = rng.pick([15, 20, 25, 30])
  const prevScreeningP = rng.pick([1, 2, 5])

  const N = 10000
  const disC = (N * prevClinicP) / 100
  const heaC = N - disC
  const tpC = (disC * sensP) / 100
  const fpC = (heaC * (100 - specP)) / 100
  const ppvC = rat(tpC, tpC + fpC)

  const disS = (N * prevScreeningP) / 100
  const heaS = N - disS
  const tpS = (disS * sensP) / 100
  const fpS = (heaS * (100 - specP)) / 100
  const ppvS = rat(tpS, tpS + fpS)

  const ratioRat = rat(tpC * (tpS + fpS), (tpC + fpC) * tpS)
  const ansTex = ratToLatex(ratioRat)

  return {
    statement: `A ${testArt} (sensitivity ${sensP}%, specificity ${specP}%) is evaluated in a referral clinic (prevalence ${prevClinicP}%, $\\text{PPV}_1 = ${ratToLatex(ppvC)}$) and in general population screening (prevalence ${prevScreeningP}%, $\\text{PPV}_2 = ${ratToLatex(ppvS)}$). Find the ratio $\\frac{\\text{PPV}_1}{\\text{PPV}_2}$ as a simplified fraction.`,
    answer: { kind: 'number', value: ansTex },
    solution: [
      { text: `In referral clinic: $\\text{PPV}_1 = \\frac{${tpC}}{${tpC + fpC}} = ${ratToLatex(ppvC)}$.` },
      { text: `In screening: $\\text{PPV}_2 = \\frac{${tpS}}{${tpS + fpS}} = ${ratToLatex(ppvS)}$.` },
      { text: 'Calculate the ratio:', tex: `\\frac{\\text{PPV}_1}{\\text{PPV}_2} = ${ansTex}` },
    ],
    hints: [
      `Calculate $\\text{PPV}_1 = ${ratToLatex(ppvC)}$ and $\\text{PPV}_2 = ${ratToLatex(ppvS)}$.`,
      `Divide $\\text{PPV}_1$ by $\\text{PPV}_2$ and simplify.`,
    ],
    inputHint: 'A simplified fraction.',
  }
}

function prevalenceForTargetPPV(rng: Rng): Problem {
  const ctx = rng.pick(DIAG_CONTEXTS)
  const testArt = withArticle(ctx.testName)
  const sensP = rng.pick([80, 90, 95])
  const specP = rng.pick([80, 90, 95])
  const targetPPVP = rng.pick([50, 60, 75, 80, 90])

  const fprP = 100 - specP
  const num = targetPPVP * fprP
  const den = sensP * (100 - targetPPVP) + targetPPVP * fprP
  const pRat = rat(num, den)
  const ansTex = ratToLatex(pRat)

  return {
    statement: `A ${testArt} has sensitivity ${sensP}% and specificity ${specP}%. At what disease prevalence $p$ will the Positive Predictive Value (PPV) equal ${targetPPVP}%? Express $p$ as a simplified fraction.`,
    answer: { kind: 'number', value: ansTex },
    solution: [
      { text: 'Set up the PPV equation:', tex: `\\text{PPV} = \\frac{${sensP} p}{${sensP} p + ${fprP}(1 - p)} = \\frac{${targetPPVP}}{100}` },
      { text: 'Solve for $p$:', tex: `p = ${ansTex}` },
    ],
    hints: [
      `Use $\\text{PPV} = \\frac{${sensP} p}{${sensP} p + ${fprP}(1 - p)}$.`,
      `Set $\\text{PPV} = \\frac{${targetPPVP}}{100}$ and solve for $p$.`,
    ],
    inputHint: 'A simplified fraction.',
  }
}

function postTestOddsCalc(rng: Rng): Problem {
  const ctx = rng.pick(DIAG_CONTEXTS)
  const testArt = withArticle(ctx.testName)
  const preOdds = rng.pick([
    { num: 1, den: 9 },
    { num: 1, den: 4 },
    { num: 1, den: 3 },
    { num: 1, den: 2 },
    { num: 2, den: 3 },
    { num: 3, den: 4 },
  ])
  const lr = rng.pick([2, 3, 4, 5, 6, 8, 9, 10, 12, 15])
  const postRat = rat(preOdds.num * lr, preOdds.den)
  const ansTex = ratToLatex(postRat)

  return {
    statement: `Before testing for ${ctx.disease} with ${testArt}, a patient has pre-test odds of $\\frac{${preOdds.num}}{${preOdds.den}}$. If the test yields a positive result with $\\text{LR}^+ = ${lr}$, calculate the post-test odds as a simplified fraction.`,
    answer: { kind: 'number', value: ansTex },
    solution: [
      { text: 'Apply Bayes\' rule in odds form:', tex: '\\text{Post-test odds} = \\text{Pre-test odds} \\times \\text{LR}^+' },
      { text: 'Substitute values:', tex: `\\text{Post-test odds} = \\frac{${preOdds.num}}{${preOdds.den}} \\times ${lr} = ${ansTex}` },
    ],
    hints: [
      'Multiply pre-test odds by $\\text{LR}^+$.',
      `Compute $\\frac{${preOdds.num}}{${preOdds.den}} \\times ${lr} = ${ansTex}$.`,
    ],
    inputHint: 'A simplified fraction or integer.',
  }
}

function tier2(rng: Rng): Problem {
  const choice = rng.int(1, 3)
  if (choice === 1) return ppvClinicVsScreening(rng)
  if (choice === 2) return prevalenceForTargetPPV(rng)
  return postTestOddsCalc(rng)
}

function falsePositiveParadoxNumeric(rng: Rng): Problem {
  const ctx = rng.pick(DIAG_CONTEXTS)
  const testArt = withArticle(ctx.testName)
  const N = 10000
  const prevP = rng.pick([1, 2, 4, 5])
  const sensP = rng.pick([85, 90, 95])
  const specP = rng.pick([85, 90, 95])

  const diseased = (N * prevP) / 100
  const healthy = N - diseased
  const tp = (diseased * sensP) / 100
  const fp = (healthy * (100 - specP)) / 100

  const ratioRat = rat(fp, tp)
  const ansTex = ratToLatex(ratioRat)

  return {
    statement: `In a screening program for ${ctx.disease} ($n = 10\\,000$, prevalence ${prevP}%) using ${testArt} (sensitivity ${sensP}%, specificity ${specP}%), by what factor do False Positives outnumber True Positives? Express $\\frac{FP}{TP}$ as a simplified fraction.`,
    answer: { kind: 'number', value: ansTex },
    solution: [
      { text: `Calculate expected counts: $TP = ${diseased} \\times ${sensP}\\% = ${tp}$ and $FP = ${healthy} \\times (100 - ${specP})\\% = ${fp}$.` },
      { text: 'Calculate ratio:', tex: `\\frac{FP}{TP} = \\frac{${fp}}{${tp}} = ${ansTex}` },
    ],
    hints: [
      `Calculate $TP = ${tp}$ and $FP = ${fp}$.`,
      `Divide $FP = ${fp}$ by $TP = ${tp}$ and reduce.`,
    ],
    inputHint: 'A simplified fraction or an integer.',
  }
}

function falsePositiveParadoxChoice(rng: Rng): Problem {
  const ctx = rng.pick(DIAG_CONTEXTS)
  const testArt = withArticle(ctx.testName)
  const sensP = rng.pick([90, 95])
  const specP = rng.pick([90, 95])

  const options = rng.shuffle([
    { id: 'low_prevalence_false_positive_paradox', label: 'Because in a low-prevalence population, healthy individuals vastly outnumber diseased ones, so False Positives outnumber True Positives.' },
    { id: 'test_is_defective', label: 'Because the test sensitivity drops to zero in low-prevalence settings.' },
    { id: 'specificity_drops', label: 'Because test specificity decreases when applied to large populations.' },
    { id: 'sample_size_too_large', label: 'Because large sample sizes artificially reduce predictive values.' },
  ])

  return {
    statement: `In population screening for ${ctx.disease} using ${testArt} (${sensP}% sensitivity, ${specP}% specificity), why can the Positive Predictive Value (PPV) fall below 50%?`,
    answer: { kind: 'choice', options, correctId: 'low_prevalence_false_positive_paradox' },
    solution: [
      { text: 'This is the False Positive Paradox: when prevalence is very low, the small percentage of false positives among the massive healthy majority exceeds the true positives from the small diseased group.' },
    ],
    hints: [
      'Consider the total number of healthy individuals vs. diseased individuals in a low-prevalence population.',
      'Multiply the small false positive rate by the huge healthy population.',
    ],
  }
}

function prevalenceImpactChoice(rng: Rng): Problem {
  const ctx = rng.pick(DIAG_CONTEXTS)
  const testArt = withArticle(ctx.testName)
  const variant = rng.pick([1, 2])

  if (variant === 1) {
    const options = rng.shuffle([
      { id: 'ppv_increases_npv_decreases', label: 'PPV increases, while NPV decreases.' },
      { id: 'ppv_decreases_npv_increases', label: 'PPV decreases, while NPV increases.' },
      { id: 'both_increase', label: 'Both PPV and NPV increase simultaneously.' },
      { id: 'neither_changes', label: 'Neither PPV nor NPV changes, as they are fixed test properties.' },
    ])
    return {
      statement: `When evaluating ${testArt} for ${ctx.disease}, how do Positive Predictive Value (PPV) and Negative Predictive Value (NPV) change when disease prevalence INCREASES in the population?`,
      answer: { kind: 'choice', options, correctId: 'ppv_increases_npv_decreases' },
      solution: [
        { text: 'As disease prevalence increases, true positives become more frequent relative to false positives, so PPV increases while NPV decreases.' },
      ],
      hints: [
        'Higher prevalence means more diseased subjects relative to healthy ones.',
        'More diseased subjects increase PPV and decrease NPV.',
      ],
    }
  }

  const options = rng.shuffle([
    { id: 'lr_independent_prevalence', label: 'Likelihood Ratios ($\\text{LR}^+$ and $\\text{LR}^-$) are independent of disease prevalence.' },
    { id: 'ppv_independent_prevalence', label: 'PPV is independent of disease prevalence.' },
    { id: 'npv_independent_prevalence', label: 'NPV is independent of disease prevalence.' },
    { id: 'accuracy_independent_prevalence', label: 'Overall accuracy is completely independent of disease prevalence.' },
  ])
  return {
    statement: `When screening for ${ctx.disease} using ${testArt}, which diagnostic metric is an intrinsic property of the test that remains INDEPENDENT of disease prevalence?`,
    answer: { kind: 'choice', options, correctId: 'lr_independent_prevalence' },
    solution: [
      { text: 'Sensitivity, Specificity, and Likelihood Ratios ($\\text{LR}^+, \\text{LR}^-$) are intrinsic test characteristics that do not depend on disease prevalence.' },
    ],
    hints: [
      'Predictive values (PPV/NPV) change with prevalence.',
      'Likelihood Ratios depend only on Sensitivity and Specificity.',
    ],
  }
}

function tier3(rng: Rng): Problem {
  const choice = rng.int(1, 3)
  if (choice === 1) return falsePositiveParadoxNumeric(rng)
  if (choice === 2) return falsePositiveParadoxChoice(rng)
  return prevalenceImpactChoice(rng)
}

export const template: SkillTemplate = {
  skillId: 'ppv_prevalence',
  theory,
  expectedSeconds: { 1: 45, 2: 75, 3: 110 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
