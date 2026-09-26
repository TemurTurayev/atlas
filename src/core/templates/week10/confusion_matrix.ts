import type { Rng } from '../../random/rng'
import { rat, ratToLatex } from '../../math/rational'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'A diagnostic $2 \\times 2$ matrix classifies results into True Positives ($TP$), False Positives ($FP$), False Negatives ($FN$), and True Negatives ($TN$).',
  'Sensitivity (Recall) $= \\frac{TP}{TP + FN}$ is the proportion of diseased individuals who test positive.',
  'Specificity $= \\frac{TN}{TN + FP}$ is the proportion of healthy individuals who test negative.',
  'Positive Predictive Value (PPV) $= \\frac{TP}{TP + FP}$ is the probability that a person with a positive test actually has the disease.',
  'Negative Predictive Value (NPV) $= \\frac{TN}{TN + FN}$ is the probability that a person with a negative test is actually healthy.',
  'SnNout / SpPin heuristics: a highly Sensitive test when Negative rules out disease (SnNout); a highly Specific test when Positive rules in disease (SpPin).',
  'Common mistakes: confusing Sensitivity $\\frac{TP}{TP+FN}$ with PPV $\\frac{TP}{TP+FP}$, or using the total population as the denominator for Sensitivity.',
].join('\n')

interface DiagContext {
  readonly testName: string
  readonly disease: string
}

const DIAG_CONTEXTS: readonly DiagContext[] = [
  { testName: 'rapid antigen test', disease: 'influenza A infection' },
  { testName: 'high-sensitivity troponin T assay', disease: 'acute myocardial infarction' },
  { testName: 'screening mammography', disease: 'breast carcinoma' },
  { testName: 'fecal immunochemical test (FIT)', disease: 'colorectal neoplasia' },
  { testName: 'D-dimer assay', disease: 'deep vein thrombosis' },
  { testName: 'NT-proBNP immunoassay', disease: 'congestive heart failure' },
  { testName: 'IGRA blood test', disease: 'latent tuberculosis infection' },
  { testName: 'rapid PCR swab', disease: 'RSV bronchiolitis' },
  { testName: 'anti-tTG IgA antibody test', disease: 'celiac disease' },
  { testName: 'high-risk HPV DNA test', disease: 'cervical intraepithelial neoplasia' },
  { testName: 'serum free light chain assay', disease: 'multiple myeloma' },
  { testName: 'rapid streptococcal antigen test', disease: 'group A streptococcal pharyngitis' },
  { testName: 'plasma p-tau217 immunoassay', disease: 'Alzheimer disease' },
]

function withArticle(phrase: string): string {
  const trimmed = phrase.trim()
  const first = trimmed.toLowerCase()[0]
  const article = ['a', 'e', 'i', 'o', 'u'].includes(first) ? 'an' : 'a'
  return `${article} ${trimmed}`
}

interface MatrixCounts {
  readonly tp: number
  readonly fp: number
  readonly fn: number
  readonly tn: number
}

function generateCleanMatrix(rng: Rng): MatrixCounts {
  const diseased = rng.pick([100, 200, 300, 400, 500])
  const healthy = rng.pick([100, 200, 300, 400, 500])
  const sensP = rng.pick([70, 75, 80, 85, 90, 95])
  const specP = rng.pick([70, 75, 80, 85, 90, 95])

  const tp = (diseased * sensP) / 100
  const fn = diseased - tp
  const tn = (healthy * specP) / 100
  const fp = healthy - tn

  return { tp, fp, fn, tn }
}

function calcMetricFromMatrix(rng: Rng): Problem {
  const ctx = rng.pick(DIAG_CONTEXTS)
  const { tp, fp, fn, tn } = generateCleanMatrix(rng)
  const metric = rng.pick(['sensitivity', 'specificity', 'ppv', 'npv', 'accuracy'])

  let num: number
  let den: number
  let metricName: string
  let formulaTex: string
  let descText: string

  if (metric === 'sensitivity') {
    num = tp
    den = tp + fn
    metricName = 'sensitivity'
    formulaTex = '\\text{Sensitivity} = \\frac{TP}{TP + FN}'
    descText = 'proportion of diseased patients correctly identified'
  } else if (metric === 'specificity') {
    num = tn
    den = tn + fp
    metricName = 'specificity'
    formulaTex = '\\text{Specificity} = \\frac{TN}{TN + FP}'
    descText = 'proportion of healthy patients correctly identified'
  } else if (metric === 'ppv') {
    num = tp
    den = tp + fp
    metricName = 'positive predictive value (PPV)'
    formulaTex = '\\text{PPV} = \\frac{TP}{TP + FP}'
    descText = 'probability of disease given a positive test'
  } else if (metric === 'npv') {
    num = tn
    den = tn + fn
    metricName = 'negative predictive value (NPV)'
    formulaTex = '\\text{NPV} = \\frac{TN}{TN + FN}'
    descText = 'probability of no disease given a negative test'
  } else {
    num = tp + tn
    den = tp + fp + fn + tn
    metricName = 'accuracy'
    formulaTex = '\\text{Accuracy} = \\frac{TP + TN}{TP + FP + FN + TN}'
    descText = 'overall proportion of correct classifications'
  }

  const r = rat(num, den)
  const ansTex = ratToLatex(r)
  const testArt = withArticle(ctx.testName)

  return {
    statement: `An evaluation of ${testArt} for ${ctx.disease} yields the following $2 \\times 2$ table of counts: $TP = ${tp}$, $FP = ${fp}$, $FN = ${fn}$, $TN = ${tn}$. Calculate the ${metricName} of the test as a simplified fraction.`,
    answer: { kind: 'number', value: ansTex },
    solution: [
      { text: `Apply the formula for ${metricName}:`, tex: formulaTex },
      { text: 'Substitute the matrix counts:', tex: `\\frac{${num}}{${den}} = ${ansTex}` },
    ],
    hints: [
      `Recall the definition of ${metricName}: ${descText}.`,
      `Divide ${num} by ${den} and simplify to lowest terms.`,
    ],
    inputHint: 'A fraction such as 9/10, or an integer.',
  }
}

function fillMissingMatrixCell(rng: Rng): Problem {
  const ctx = rng.pick(DIAG_CONTEXTS)
  const { tp, fp, fn, tn } = generateCleanMatrix(rng)
  const targetCell = rng.pick(['tp', 'fp', 'fn', 'tn'])
  const testArt = withArticle(ctx.testName)

  let statement: string
  let targetVal: number
  let stepTex: string
  let stepText: string

  if (targetCell === 'tp') {
    targetVal = tp
    const totalPos = tp + fp
    statement = `A clinical study evaluating ${testArt} reports $FP = ${fp}$, $FN = ${fn}$, $TN = ${tn}$, and total positive test results $TP + FP = ${totalPos}$. Find the number of True Positives ($TP$).`
    stepTex = `TP = (TP + FP) - FP = ${totalPos} - ${fp} = ${tp}`
    stepText = 'Subtract FP from total positive tests'
  } else if (targetCell === 'fp') {
    targetVal = fp
    const totalHealthy = fp + tn
    statement = `A clinical trial evaluating ${testArt} reports $TP = ${tp}$, $FN = ${fn}$, $TN = ${tn}$, and total non-diseased subjects $FP + TN = ${totalHealthy}$. Find the number of False Positives ($FP$).`
    stepTex = `FP = (FP + TN) - TN = ${totalHealthy} - ${tn} = ${fp}`
    stepText = 'Subtract TN from total non-diseased subjects'
  } else if (targetCell === 'fn') {
    targetVal = fn
    const totalDiseased = tp + fn
    statement = `In a diagnostic evaluation of ${testArt}, total diseased subjects $TP + FN = ${totalDiseased}$, $TP = ${tp}$, $FP = ${fp}$, and $TN = ${tn}$. Find the number of False Negatives ($FN$).`
    stepTex = `FN = (TP + FN) - TP = ${totalDiseased} - ${tp} = ${fn}`
    stepText = 'Subtract TP from total diseased subjects'
  } else {
    targetVal = tn
    const totalNeg = fn + tn
    statement = `A clinical study evaluating ${testArt} reports $TP = ${tp}$, $FP = ${fp}$, $FN = ${fn}$, and total negative test results $FN + TN = ${totalNeg}$. Find the number of True Negatives ($TN$).`
    stepTex = `TN = (FN + TN) - FN = ${totalNeg} - ${fn} = ${tn}`
    stepText = 'Subtract FN from total negative tests'
  }

  return {
    statement,
    answer: { kind: 'number', value: String(targetVal) },
    solution: [
      { text: `${stepText}:`, tex: stepTex },
    ],
    hints: [
      'Use row/column total relationships in the $2 \\times 2$ table.',
      `Compute the difference to find the missing count: ${targetVal}.`,
    ],
  }
}

function calcFPRorFNR(rng: Rng): Problem {
  const ctx = rng.pick(DIAG_CONTEXTS)
  const { tp, fp, fn, tn } = generateCleanMatrix(rng)
  const isFPR = rng.chance(0.5)
  const testArt = withArticle(ctx.testName)

  let num: number
  let den: number
  let rateName: string
  let formulaTex: string

  if (isFPR) {
    num = fp
    den = fp + tn
    rateName = 'false positive rate (FPR)'
    formulaTex = '\\text{FPR} = \\frac{FP}{FP + TN} = 1 - \\text{Specificity}'
  } else {
    num = fn
    den = tp + fn
    rateName = 'false negative rate (FNR)'
    formulaTex = '\\text{FNR} = \\frac{FN}{TP + FN} = 1 - \\text{Sensitivity}'
  }

  const r = rat(num, den)
  const ansTex = ratToLatex(r)

  return {
    statement: `A trial evaluating ${testArt} for ${ctx.disease} records $TP = ${tp}$, $FP = ${fp}$, $FN = ${fn}$, and $TN = ${tn}$. Calculate the ${rateName} as a simplified fraction.`,
    answer: { kind: 'number', value: ansTex },
    solution: [
      { text: `Apply the formula for ${rateName}:`, tex: formulaTex },
      { text: 'Substitute counts and simplify:', tex: `\\frac{${num}}{${den}} = ${ansTex}` },
    ],
    hints: [
      isFPR ? 'False Positive Rate is the proportion of healthy subjects who test positive: $\\frac{FP}{FP + TN}$.' : 'False Negative Rate is the proportion of diseased subjects who test negative: $\\frac{FN}{TP + FN}$.',
      `Divide ${num} by ${den} and reduce to lowest terms.`,
    ],
    inputHint: 'A fraction such as 1/10, or an integer.',
  }
}

function tier1(rng: Rng): Problem {
  const choice = rng.int(1, 3)
  if (choice === 1) return calcMetricFromMatrix(rng)
  if (choice === 2) return fillMissingMatrixCell(rng)
  return calcFPRorFNR(rng)
}

function matrixWordProblem(rng: Rng): Problem {
  const ctx = rng.pick(DIAG_CONTEXTS)
  const { tp, fp, fn, tn } = generateCleanMatrix(rng)
  const total = tp + fp + fn + tn
  const askMetric = rng.pick(['sensitivity', 'specificity', 'ppv'])
  const testArt = withArticle(ctx.testName)

  let num: number
  let den: number
  let metricLabel: string
  let formulaTex: string

  if (askMetric === 'sensitivity') {
    num = tp
    den = tp + fn
    metricLabel = 'sensitivity'
    formulaTex = '\\text{Sensitivity} = \\frac{TP}{TP + FN}'
  } else if (askMetric === 'specificity') {
    num = tn
    den = tn + fp
    metricLabel = 'specificity'
    formulaTex = '\\text{Specificity} = \\frac{TN}{TN + FP}'
  } else {
    num = tp
    den = tp + fp
    metricLabel = 'positive predictive value (PPV)'
    formulaTex = '\\text{PPV} = \\frac{TP}{TP + FP}'
  }

  const r = rat(num, den)
  const ansTex = ratToLatex(r)

  return {
    statement: `In a clinical validation study of ${testArt} for ${ctx.disease}, $n = ${total}$ individuals were screened. The test yielded $TP = ${tp}$ true positives, $FP = ${fp}$ false positives, $FN = ${fn}$ false negatives, and $TN = ${tn}$ true negatives. Calculate the ${metricLabel} of the test as a simplified fraction.`,
    answer: { kind: 'number', value: ansTex },
    solution: [
      { text: `Identify the formula for ${metricLabel}:`, tex: formulaTex },
      { text: 'Substitute matrix values:', tex: `\\frac{${num}}{${den}} = ${ansTex}` },
    ],
    hints: [
      `Identify the relevant numerator and denominator for ${metricLabel}.`,
      `Divide ${num} by ${den} and reduce to lowest terms.`,
    ],
    inputHint: 'A simplified fraction.',
  }
}

function reconstructMatrixFromRates(rng: Rng): Problem {
  const ctx = rng.pick(DIAG_CONTEXTS)
  const total = 10000
  const prevP = rng.pick([10, 20])
  const sensP = rng.pick([80, 90])
  const specP = rng.pick([80, 90])
  const testArt = withArticle(ctx.testName)

  const diseased = (total * prevP) / 100
  const healthy = total - diseased
  const tp = (diseased * sensP) / 100
  const tn = (healthy * specP) / 100
  const fp = healthy - tn

  const r = rat(tp, tp + fp)
  const ansTex = ratToLatex(r)

  return {
    statement: `A screening study tests $n = ${total}$ patients for ${ctx.disease} using ${testArt}. The disease prevalence is ${prevP}%, test sensitivity is ${sensP}%, and test specificity is ${specP}%. Find the Positive Predictive Value (PPV) as a simplified fraction.`,
    answer: { kind: 'number', value: ansTex },
    solution: [
      { text: `Calculate total diseased: $${total} \\times ${prevP}\\% = ${diseased}$ patients; healthy: $${healthy}$ patients.` },
      { text: `Compute $TP = ${diseased} \\times ${sensP}\\% = ${tp}$ and $FP = ${healthy} \\times (100 - ${specP})\\% = ${fp}$.` },
      { text: 'Calculate PPV:', tex: `\\text{PPV} = \\frac{TP}{TP + FP} = \\frac{${tp}}{${tp} + ${fp}} = \\frac{${tp}}{${tp + fp}} = ${ansTex}` },
    ],
    hints: [
      `First compute the number of diseased patients ($${diseased}$) and healthy patients ($${healthy}$).`,
      `Find $TP = ${tp}$ and $FP = ${fp}$, then compute $\\text{PPV} = \\frac{${tp}}{${tp + fp}}$.`,
    ],
    inputHint: 'A simplified fraction.',
  }
}

function compareTwoTestsMatrix(rng: Rng): Problem {
  const ctx = rng.pick(DIAG_CONTEXTS)
  const pair = rng.pick([
    { tpA: 90, fnA: 10, tpB: 80, fnB: 20, diff: 10, sensA: 90, sensB: 80 },
    { tpA: 95, fnA: 5, tpB: 85, fnB: 15, diff: 10, sensA: 95, sensB: 85 },
    { tpA: 90, fnA: 10, tpB: 75, fnB: 25, diff: 15, sensA: 90, sensB: 75 },
    { tpA: 85, fnA: 15, tpB: 70, fnB: 30, diff: 15, sensA: 85, sensB: 70 },
    { tpA: 95, fnA: 5, tpB: 90, fnB: 10, diff: 5, sensA: 95, sensB: 90 },
    { tpA: 80, fnA: 20, tpB: 60, fnB: 40, diff: 20, sensA: 80, sensB: 60 },
  ])

  return {
    statement: `Two diagnostic assays for ${ctx.disease} are evaluated in separate cohorts of 100 diseased subjects. Assay A identifies $TP_A = ${pair.tpA}$ ($FN_A = ${pair.fnA}$). Assay B identifies $TP_B = ${pair.tpB}$ ($FN_B = ${pair.fnB}$). By how many percentage points does the sensitivity of Assay A exceed that of Assay B?`,
    answer: { kind: 'number', value: String(pair.diff) },
    solution: [
      { text: `Compute Sensitivity of Assay A: $\\frac{${pair.tpA}}{${pair.tpA} + ${pair.fnA}} = ${pair.sensA}\\%$.` },
      { text: `Compute Sensitivity of Assay B: $\\frac{${pair.tpB}}{${pair.tpB} + ${pair.fnB}} = ${pair.sensB}\\%$.` },
      { text: 'Calculate the difference in percentage points:', tex: `${pair.sensA}\\% - ${pair.sensB}\\% = ${pair.diff}\\%` },
    ],
    hints: [
      'Calculate sensitivity for Assay A and Assay B independently.',
      `Subtract the sensitivity of Assay B (${pair.sensB}%) from Assay A (${pair.sensA}%).`,
    ],
  }
}

function tier2(rng: Rng): Problem {
  const choice = rng.int(1, 3)
  if (choice === 1) return matrixWordProblem(rng)
  if (choice === 2) return reconstructMatrixFromRates(rng)
  return compareTwoTestsMatrix(rng)
}

function twoStageScreeningNumeric(rng: Rng): Problem {
  const ctx = rng.pick(DIAG_CONTEXTS)
  const N = 10000
  const prevP = rng.pick([2, 4])
  const sensP = 90
  const specP = 90
  const testArt = withArticle(ctx.testName)

  const diseased = (N * prevP) / 100
  const healthy = N - diseased
  const fpStage1 = (healthy * (100 - specP)) / 100
  const fpStage2 = (fpStage1 * (100 - specP)) / 100

  return {
    statement: `In a two-stage screening program for ${ctx.disease} ($n = 10\\,000$, prevalence ${prevP}%), ${testArt} (sensitivity ${sensP}%, specificity ${specP}%) is used as the initial screen. Patients who test positive undergo a second independent confirmatory test with identical specificity ${specP}%. How many healthy individuals are expected to yield false positive results after both stages?`,
    answer: { kind: 'number', value: String(fpStage2) },
    solution: [
      { text: `Initial healthy population $= 10\\,000 - ${diseased} = ${healthy}$.` },
      { text: `Stage 1 false positives: $${healthy} \\times (100 - ${specP})\\% = ${fpStage1}$.` },
      { text: `Stage 2 false positives: $${fpStage1} \\times (100 - ${specP})\\% = ${fpStage2}$.` },
    ],
    hints: [
      `Calculate healthy population ($${healthy}$) and stage 1 false positives ($${fpStage1}$).`,
      `Apply false positive rate $(100 - ${specP})\\%$ again to stage 1 false positives.`,
    ],
  }
}

function prevalenceShiftNumeric(rng: Rng): Problem {
  const ctx = rng.pick(DIAG_CONTEXTS)
  const p1P = rng.pick([20, 25, 30])
  const p2P = rng.pick([1, 2, 5])
  const sensP = 90
  const specP = 90
  const testArt = withArticle(ctx.testName)

  const N = 10000
  const dis1 = (N * p1P) / 100
  const hea1 = N - dis1
  const tp1 = (dis1 * sensP) / 100
  const fp1 = (hea1 * (100 - specP)) / 100
  const ppv1Rat = rat(tp1, tp1 + fp1)

  const dis2 = (N * p2P) / 100
  const hea2 = N - dis2
  const tp2 = (dis2 * sensP) / 100
  const fp2 = (hea2 * (100 - specP)) / 100
  const ppv2Rat = rat(tp2, tp2 + fp2)

  const ratioRat = rat(tp1 * (tp2 + fp2), (tp1 + fp1) * tp2)
  const ratioTex = ratToLatex(ratioRat)

  return {
    statement: `A clinical trial evaluates ${testArt} (sensitivity 90%, specificity 90%) for ${ctx.disease} in a high-prevalence clinic ($p_1 = ${p1P}\\%$, $\\text{PPV}_1 = ${ratToLatex(ppv1Rat)}$) and a low-prevalence population ($p_2 = ${p2P}\\%$, $\\text{PPV}_2 = ${ratToLatex(ppv2Rat)}$). Find the ratio $\\frac{\\text{PPV}_1}{\\text{PPV}_2}$ as a simplified fraction.`,
    answer: { kind: 'number', value: ratioTex },
    solution: [
      { text: `Compute $\\text{PPV}_1 = ${ratToLatex(ppv1Rat)}$ and $\\text{PPV}_2 = ${ratToLatex(ppv2Rat)}$.` },
      { text: 'Calculate ratio:', tex: `\\frac{\\text{PPV}_1}{\\text{PPV}_2} = ${ratioTex}` },
    ],
    hints: [
      `Calculate $\\text{PPV}_1 = ${ratToLatex(ppv1Rat)}$ and $\\text{PPV}_2 = ${ratToLatex(ppv2Rat)}$.`,
      `Divide $\\text{PPV}_1$ by $\\text{PPV}_2$ and simplify.`,
    ],
    inputHint: 'A simplified fraction.',
  }
}

function metricInterpretationChoice(rng: Rng): Problem {
  const ctx = rng.pick(DIAG_CONTEXTS)
  const testArt = withArticle(ctx.testName)
  const options = rng.shuffle([
    { id: 'ppv_metric', label: 'Positive Predictive Value (PPV)' },
    { id: 'sensitivity_metric', label: 'Sensitivity (Recall)' },
    { id: 'specificity_metric', label: 'Specificity' },
    { id: 'npv_metric', label: 'Negative Predictive Value (NPV)' },
  ])

  return {
    statement: `In evaluating ${testArt} for ${ctx.disease}, which diagnostic metric answers the patient question: "Given that my test result is positive, what is the probability that I actually have ${ctx.disease}?"`,
    answer: { kind: 'choice', options, correctId: 'ppv_metric' },
    solution: [
      { text: 'Positive Predictive Value (PPV) is defined as $P(\\text{Disease} \\mid \\text{Test Pos}) = \\frac{TP}{TP + FP}$, directly answering the patient\'s question.' },
    ],
    hints: [
      'Focus on the conditional probability given a positive test result.',
      'The metric conditioning on positive test results is PPV.',
    ],
  }
}

function snnoutSppinChoice(rng: Rng): Problem {
  const ctx = rng.pick(DIAG_CONTEXTS)
  const testArt = withArticle(ctx.testName)
  const variant = rng.pick([1, 2])

  if (variant === 1) {
    const options = rng.shuffle([
      { id: 'high_sensitivity_snnout', label: 'High Sensitivity (SnNout: a Sensitive test when Negative rules out disease)' },
      { id: 'high_specificity_sppin', label: 'High Specificity (SpPin: a Specific test when Positive rules in disease)' },
      { id: 'high_ppv_only', label: 'High Positive Predictive Value regardless of sensitivity' },
      { id: 'low_sample_size', label: 'Small sample size to minimize false positives' },
    ])
    return {
      statement: `A screening evaluation of ${testArt} for ${ctx.disease} requires a protocol that reliably RULES OUT disease when negative. Which test characteristic is most critical?`,
      answer: { kind: 'choice', options, correctId: 'high_sensitivity_snnout' },
      solution: [
        { text: 'SnNout heuristic: a highly Sensitive test when Negative rules out disease, minimizing false negatives.' },
      ],
      hints: [
        'Recall the SnNout heuristic for ruling out disease.',
        'A negative result in a highly sensitive test makes disease very unlikely.',
      ],
    }
  }

  const options = rng.shuffle([
    { id: 'high_specificity_sppin', label: 'High Specificity (SpPin: a Specific test when Positive rules in disease)' },
    { id: 'high_sensitivity_snnout', label: 'High Sensitivity (SnNout: a Sensitive test when Negative rules out disease)' },
    { id: 'low_npv_only', label: 'Low Negative Predictive Value' },
    { id: 'high_false_negative_rate', label: 'High False Negative Rate' },
  ])
  return {
    statement: `A confirmatory evaluation of ${testArt} for ${ctx.disease} requires a protocol that reliably RULES IN disease when positive. Which test characteristic is most critical?`,
    answer: { kind: 'choice', options, correctId: 'high_specificity_sppin' },
    solution: [
      { text: 'SpPin heuristic: a highly Specific test when Positive rules in disease, minimizing false positives.' },
    ],
    hints: [
      'Recall the SpPin heuristic for ruling in disease.',
      'A positive result in a highly specific test confirms disease.',
    ],
  }
}

function tier3(rng: Rng): Problem {
  const choice = rng.int(1, 4)
  if (choice === 1) return twoStageScreeningNumeric(rng)
  if (choice === 2) return prevalenceShiftNumeric(rng)
  if (choice === 3) return metricInterpretationChoice(rng)
  return snnoutSppinChoice(rng)
}

export const template: SkillTemplate = {
  skillId: 'confusion_matrix',
  theory,
  expectedSeconds: { 1: 45, 2: 75, 3: 110 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
