import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'The null hypothesis $H_0$ states no effect/difference ($\\mu = \\mu_0$), while the alternative $H_1$ states an effect ($\\mu \\neq \\mu_0$, $\\mu > \\mu_0$, or $\\mu < \\mu_0$).',
  'Decision rule: reject $H_0$ if $p\\text{-value} \\le \\alpha$; fail to reject $H_0$ if $p\\text{-value} > \\alpha$.',
  'Type I error (probability $\\alpha$): rejecting $H_0$ when $H_0$ is true (false positive). Significance level $\\alpha = P(\\text{Type I Error} \\mid H_0 \\text{ is true})$.',
  'Type II error (probability $\\beta$): failing to reject $H_0$ when $H_0$ is false (false negative).',
  'Statistical power is $1 - \\beta$: the probability of correctly rejecting a false $H_0$. Thus $\\text{Power} = 1 - \\beta$, or $\\beta = 1 - \\text{Power}$.',
  'Common mistakes: confusing $p$-value with $P(H_0 \\text{ is true})$, or confusing Type I error $\\alpha$ with Type II error $\\beta$.',
].join('\n')

interface ClinicalStudy {
  readonly drugName: string
  readonly outcome: string
  readonly baseline: number
  readonly unit: string
}

const CLINICAL_STUDIES: readonly ClinicalStudy[] = [
  { drugName: 'an antihypertensive agent', outcome: 'systolic blood pressure', baseline: 140, unit: 'mmHg' },
  { drugName: 'a statin medication', outcome: 'LDL cholesterol', baseline: 130, unit: 'mg/dL' },
  { drugName: 'a hypoglycemic agent', outcome: 'fasting blood glucose', baseline: 120, unit: 'mg/dL' },
  { drugName: 'an analgesic treatment', outcome: 'pain score', baseline: 7, unit: 'points' },
  { drugName: 'an antiarrhythmic drug', outcome: 'resting heart rate', baseline: 85, unit: 'bpm' },
  { drugName: 'a novel immunosuppressant', outcome: 'inflammatory marker IL-6', baseline: 15, unit: 'pg/mL' },
  { drugName: 'a bronchodilator therapy', outcome: 'forced expiratory volume', baseline: 2.5, unit: 'L' },
  { drugName: 'a lipid-lowering compound', outcome: 'serum triglycerides', baseline: 160, unit: 'mg/dL' },
]

function round3(val: number): number {
  return Math.round(val * 1000) / 1000
}

function pValDecision(rng: Rng): Problem {
  const study = rng.pick(CLINICAL_STUDIES)
  const alpha = rng.pick([0.01, 0.05, 0.10])
  const isSignificant = rng.chance(0.5)

  let pVal: number
  if (isSignificant) {
    pVal = alpha === 0.01 ? rng.pick([0.001, 0.002, 0.005, 0.008]) : alpha === 0.05 ? rng.pick([0.008, 0.012, 0.025, 0.038, 0.045]) : rng.pick([0.02, 0.04, 0.06, 0.08])
  } else {
    pVal = alpha === 0.01 ? rng.pick([0.015, 0.024, 0.035, 0.06]) : alpha === 0.05 ? rng.pick([0.058, 0.072, 0.095, 0.12, 0.18]) : rng.pick([0.11, 0.14, 0.22, 0.35])
  }

  const correctId = pVal <= alpha ? 'reject_null' : 'fail_to_reject_null'
  const options = rng.shuffle([
    { id: 'reject_null', label: 'Reject $H_0$ (statistically significant difference)' },
    { id: 'fail_to_reject_null', label: 'Fail to reject $H_0$ (no statistically significant difference)' },
    { id: 'accept_null_proved_true', label: 'Accept $H_0$ as proven true' },
    { id: 'reject_alternative', label: 'Reject $H_1$' },
  ])

  return {
    statement: `A clinical trial testing ${study.drugName} on ${study.outcome} reports a test statistic with $p\\text{-value} = ${pVal}$. At significance level $\\alpha = ${alpha}$, what is the correct test decision?`,
    answer: { kind: 'choice', options, correctId },
    solution: [
      { text: `Compare $p\\text{-value} = ${pVal}$ with significance level $\\alpha = ${alpha}$:` },
      { text: pVal <= alpha ? `$${pVal} \\le ${alpha} \\implies$ Reject $H_0$.` : `$${pVal} > ${alpha} \\implies$ Fail to reject $H_0$.` },
    ],
    hints: [
      'Reject $H_0$ if $p\\text{-value} \\le \\alpha$; fail to reject if $p\\text{-value} > \\alpha$.',
      `Compare $p = ${pVal}$ to $\\alpha = ${alpha}$.`,
    ],
  }
}

function powerBetaCalc(rng: Rng): Problem {
  const study = rng.pick(CLINICAL_STUDIES)
  const powerPct = rng.pick([75, 80, 85, 90, 95])
  const powerVal = powerPct / 100
  const betaVal = round3(1 - powerVal)
  const askBeta = rng.chance(0.5)

  if (askBeta) {
    return {
      statement: `A clinical trial evaluating ${study.drugName} is designed with a statistical power of ${powerPct}% (${powerVal}). Calculate the probability of a Type II error $\\beta$.`,
      answer: { kind: 'number', value: String(betaVal) },
      solution: [
        { text: 'Statistical power is defined as $\\text{Power} = 1 - \\beta$.' },
        { text: 'Solve for $\\beta$:', tex: `\\beta = 1 - \\text{Power} = 1 - ${powerVal} = ${betaVal}` },
      ],
      hints: [
        'Use $\\text{Power} = 1 - \\beta$.',
        `Subtract $\\text{Power} = ${powerVal}$ from $1$ to get $\\beta = ${betaVal}$.`,
      ],
    }
  }

  return {
    statement: `In a clinical trial study design, the probability of a Type II error is estimated at $\\beta = ${betaVal}$. Calculate the statistical power ($1 - \\beta$) of the test.`,
    answer: { kind: 'number', value: String(powerVal) },
    solution: [
      { text: 'Statistical power is defined as $\\text{Power} = 1 - \\beta$.' },
      { text: 'Calculate power:', tex: `\\text{Power} = 1 - ${betaVal} = ${powerVal}` },
    ],
    hints: [
      'Use $\\text{Power} = 1 - \\beta$.',
      `Subtract $\\beta = ${betaVal}$ from $1$ to get power $= ${powerVal}$.`,
    ],
  }
}

function type1ProbCalc(rng: Rng): Problem {
  const study = rng.pick(CLINICAL_STUDIES)
  const alpha = rng.pick([0.01, 0.02, 0.05, 0.10])

  return {
    statement: `A clinical trial evaluating ${study.drugName} sets the significance level at $\\alpha = ${alpha}$. Assuming the null hypothesis $H_0$ is true, what is the probability of committing a Type I error?`,
    answer: { kind: 'number', value: String(alpha) },
    solution: [
      { text: 'By definition, the significance level $\\alpha$ is the probability of committing a Type I error when $H_0$ is true:' },
      { text: 'Substitute $\\alpha$:', tex: `P(\\text{Type I Error} \\mid H_0 \\text{ is true}) = \\alpha = ${alpha}` },
    ],
    hints: [
      'The significance level $\\alpha$ is defined as $P(\\text{Type I Error} \\mid H_0 \\text{ is true})$.',
      `Therefore, the probability is simply $\\alpha = ${alpha}$.`,
    ],
  }
}

function tier1(rng: Rng): Problem {
  const choice = rng.int(1, 3)
  if (choice === 1) return pValDecision(rng)
  if (choice === 2) return powerBetaCalc(rng)
  return type1ProbCalc(rng)
}

function formulateHypotheses(rng: Rng): Problem {
  const study = rng.pick(CLINICAL_STUDIES)
  const direction = rng.pick(['decrease', 'increase', 'change'])

  let h1Tex: string
  let correctId: string

  if (direction === 'decrease') {
    h1Tex = `\\mu < ${study.baseline}`
    correctId = 'h0_eq_h1_less'
  } else if (direction === 'increase') {
    h1Tex = `\\mu > ${study.baseline}`
    correctId = 'h0_eq_h1_greater'
  } else {
    h1Tex = `\\mu \\neq ${study.baseline}`
    correctId = 'h0_eq_h1_neq'
  }

  const options = rng.shuffle([
    { id: 'h0_eq_h1_less', label: `$H_0: \\mu = ${study.baseline}\\text{ vs } H_1: \\mu < ${study.baseline}$` },
    { id: 'h0_eq_h1_greater', label: `$H_0: \\mu = ${study.baseline}\\text{ vs } H_1: \\mu > ${study.baseline}$` },
    { id: 'h0_eq_h1_neq', label: `$H_0: \\mu = ${study.baseline}\\text{ vs } H_1: \\mu \\neq ${study.baseline}$` },
    { id: 'h0_less_h1_eq', label: `$H_0: \\mu < ${study.baseline}\\text{ vs } H_1: \\mu = ${study.baseline}$` },
  ])

  return {
    statement: `A clinical trial tests whether ${study.drugName} causes a ${direction} in mean ${study.outcome} from the baseline $\\mu_0 = ${study.baseline}\\text{ ${study.unit}}$. Formulate the correct null ($H_0$) and alternative ($H_1$) hypotheses.`,
    answer: { kind: 'choice', options, correctId },
    solution: [
      { text: `The null hypothesis states equality to baseline $H_0: \\mu = ${study.baseline}$.` },
      { text: `Since the research question asks about a ${direction}, the alternative hypothesis is $H_1: ${h1Tex}$.` },
    ],
    hints: [
      `$H_0$ always expresses equality to baseline: $H_0: \\mu = ${study.baseline}$.`,
      `Match the direction of $H_1$ to '${direction}'.`,
    ],
  }
}

function identifyClinicalError(rng: Rng): Problem {
  const study = rng.pick(CLINICAL_STUDIES)
  const scenarioType = rng.pick(['type1', 'type2'])

  let statement: string
  let correctId: string
  let expl: string

  if (scenarioType === 'type1') {
    statement = `A clinical trial concludes that ${study.drugName} significantly improves ${study.outcome}, when in reality the drug is completely ineffective. What type of error occurred?`
    correctId = 'type_1_error'
    expl = 'Rejecting a true null hypothesis (false positive) is a Type I error.'
  } else {
    statement = `A clinical trial fails to demonstrate a treatment effect for ${study.drugName}, even though the drug is actually effective in reducing ${study.outcome}. What type of error occurred?`
    correctId = 'type_2_error'
    expl = 'Failing to reject a false null hypothesis (false negative) is a Type II error.'
  }

  const options = rng.shuffle([
    { id: 'type_1_error', label: 'Type I error (false positive)' },
    { id: 'type_2_error', label: 'Type II error (false negative)' },
    { id: 'correct_decision', label: 'Correct decision' },
    { id: 'measurement_bias', label: 'Confounding selection bias' },
  ])

  return {
    statement,
    answer: { kind: 'choice', options, correctId },
    solution: [
      { text: expl },
    ],
    hints: [
      'Distinguish between false positive (rejecting true $H_0$) and false negative (failing to reject false $H_0$).',
      scenarioType === 'type1' ? 'A false positive is a Type I error.' : 'A false negative is a Type II error.',
    ],
  }
}

function bonferroniAdjust(rng: Rng): Problem {
  const m = rng.pick([2, 4, 5, 8, 10, 16, 20, 25, 50])
  const overallAlpha = rng.pick([0.05, 0.01])
  const adjAlpha = Number((overallAlpha / m).toFixed(4))

  return {
    statement: `A genomic association study evaluates $m = ${m}$ independent biomarkers at an overall significance level $\\alpha_{\\text{overall}} = ${overallAlpha}$. Using the Bonferroni correction, calculate the adjusted significance level per test $\\alpha_{\\text{adj}}$.`,
    answer: { kind: 'number', value: String(adjAlpha) },
    solution: [
      { text: 'Apply the Bonferroni correction formula:', tex: '\\alpha_{\\text{adj}} = \\frac{\\alpha_{\\text{overall}}}{m}' },
      { text: 'Substitute values:', tex: `\\alpha_{\\text{adj}} = \\frac{${overallAlpha}}{${m}} = ${adjAlpha}` },
    ],
    hints: [
      'Bonferroni correction divides overall significance level $\\alpha$ by the number of tests $m$.',
      `Divide ${overallAlpha} by $m = ${m}$.`,
    ],
    inputHint: 'A decimal value.',
  }
}

function alphaBetaDefinition(rng: Rng): Problem {
  const isType1 = rng.chance(0.5)

  if (isType1) {
    const options = rng.shuffle([
      { id: 'type1_def', label: 'Significance level $\\alpha = P(\\text{reject } H_0 \\mid H_0 \\text{ is true})$' },
      { id: 'type2_def', label: 'Type II error rate $\\beta = P(\\text{fail to reject } H_0 \\mid H_0 \\text{ is false})$' },
      { id: 'power_def', label: 'Statistical power $= P(\\text{reject } H_0 \\mid H_0 \\text{ is false})$' },
      { id: 'confidence_def', label: 'Confidence level $= 1 - \\alpha$' },
    ])
    return {
      statement: 'Which probability definition corresponds to the Type I error rate (significance level $\\alpha$)?',
      answer: { kind: 'choice', options, correctId: 'type1_def' },
      solution: [
        { text: 'Type I error is a false positive: rejecting a true null hypothesis, so $\\alpha = P(\\text{reject } H_0 \\mid H_0 \\text{ is true})$.' },
      ],
      hints: [
        'Type I error happens when $H_0$ is true but we reject it.',
        'It conditions on $H_0$ being true.',
      ],
    }
  }

  const options = rng.shuffle([
    { id: 'type2_def', label: 'Type II error rate $\\beta = P(\\text{fail to reject } H_0 \\mid H_0 \\text{ is false})$' },
    { id: 'type1_def', label: 'Significance level $\\alpha = P(\\text{reject } H_0 \\mid H_0 \\text{ is true})$' },
    { id: 'power_def', label: 'Statistical power $= 1 - \\beta$' },
    { id: 'p_val_def', label: '$p$-value $= P(\\text{data} \\mid H_0 \\text{ is true})$' },
  ])
  return {
    statement: 'Which probability definition corresponds to the Type II error rate ($\\beta$)?',
    answer: { kind: 'choice', options, correctId: 'type2_def' },
    solution: [
      { text: 'Type II error is a false negative: failing to reject a false null hypothesis, so $\\beta = P(\\text{fail to reject } H_0 \\mid H_0 \\text{ is false})$.' },
    ],
    hints: [
      'Type II error happens when $H_0$ is false but we fail to reject it.',
      'It conditions on $H_0$ being false.',
    ],
  }
}

function tier2(rng: Rng): Problem {
  const choice = rng.int(1, 4)
  if (choice === 1) return formulateHypotheses(rng)
  if (choice === 2) return identifyClinicalError(rng)
  if (choice === 3) return bonferroniAdjust(rng)
  return alphaBetaDefinition(rng)
}

function pValDefinitionChoice(rng: Rng): Problem {
  const variant = rng.pick([1, 2])

  if (variant === 1) {
    const options = rng.shuffle([
      { id: 'prob_data_given_h0', label: 'The probability of observing a test statistic at least as extreme as the calculated value, assuming $H_0$ is true.' },
      { id: 'prob_h0_true', label: 'The probability that the null hypothesis $H_0$ is true.' },
      { id: 'prob_h1_true', label: 'The probability that the alternative hypothesis $H_1$ is true.' },
      { id: 'prob_type_1', label: 'The probability of committing a Type I error in any future trial.' },
    ])
    return {
      statement: 'Which statement provides the precise definition of a $p\\text{-value}$?',
      answer: { kind: 'choice', options, correctId: 'prob_data_given_h0' },
      solution: [
        { text: 'A $p$-value is $P(\\text{data at least as extreme} \\mid H_0 \\text{ is true})$. It is NOT the probability that $H_0$ is true.' },
      ],
      hints: [
        'A $p$-value conditions on $H_0$ being true.',
        'It measures the likelihood of obtaining observed data under $H_0$.',
      ],
    }
  }

  const options = rng.shuffle([
    { id: 'p_val_not_h0_true', label: 'It does NOT represent the probability that the null hypothesis $H_0$ is true.' },
    { id: 'p_val_not_data_prob', label: 'It does NOT depend on the observed test statistic.' },
    { id: 'p_val_not_alpha_limit', label: 'It cannot be compared directly with $\\alpha$.' },
    { id: 'p_val_not_used_in_t_test', label: 'It is only defined for $z$-tests, not $t$-tests.' },
  ])
  return {
    statement: 'Which statement describes a common misconception regarding what a $p\\text{-value}$ signifies?',
    answer: { kind: 'choice', options, correctId: 'p_val_not_h0_true' },
    solution: [
      { text: 'A major misconception is treating the $p$-value as $P(H_0 \\text{ is true})$. In reality, it assumes $H_0$ is true and evaluates data probability.' },
    ],
    hints: [
      'Remember that $H_0$ is assumed true when computing a $p$-value.',
      'The $p$-value does NOT give the posterior probability of $H_0$.',
    ],
  }
}

function clinicalTrialDecision(rng: Rng): Problem {
  const study = rng.pick(CLINICAL_STUDIES)
  const alpha = rng.pick([0.01, 0.05, 0.10])
  const isReject = rng.chance(0.5)

  let pVal: number
  if (isReject) {
    pVal = alpha === 0.01 ? rng.pick([0.002, 0.006]) : alpha === 0.05 ? rng.pick([0.012, 0.035]) : rng.pick([0.024, 0.075])
  } else {
    pVal = alpha === 0.01 ? rng.pick([0.025, 0.048]) : alpha === 0.05 ? rng.pick([0.072, 0.140]) : rng.pick([0.135, 0.220])
  }

  const correctId = isReject ? 'reject_null_effective' : 'fail_to_reject_ineffective'
  const options = rng.shuffle([
    { id: 'reject_null_effective', label: `Reject $H_0$: evidence supports that ${study.drugName} significantly affects ${study.outcome}.` },
    { id: 'fail_to_reject_ineffective', label: `Fail to reject $H_0$: insufficient evidence that ${study.drugName} affects ${study.outcome}.` },
    { id: 'accept_null_proved', label: `Accept $H_0$: proven that ${study.drugName} has zero physiological effect.` },
    { id: 'reject_alternative_error', label: 'Reject $H_1$: the trial design is invalid.' },
  ])

  return {
    statement: `In a clinical trial evaluating ${study.drugName}, the statistical test for mean ${study.outcome} yields $p\\text{-value} = ${pVal}$. At significance level $\\alpha = ${alpha}$, what is the clinical conclusion?`,
    answer: { kind: 'choice', options, correctId },
    solution: [
      { text: isReject ? `Since $p = ${pVal} \\le \\alpha = ${alpha}$, we reject $H_0$ and conclude there is statistically significant evidence of a treatment effect.` : `Since $p = ${pVal} > \\alpha = ${alpha}$, we fail to reject $H_0$ and conclude there is insufficient evidence of a treatment effect.` },
    ],
    hints: [
      `Compare $p = ${pVal}$ with $\\alpha = ${alpha}$.`,
      isReject ? `Since $p \\le \\alpha$, reject $H_0$ in favor of $H_1$.` : `Since $p > \\alpha$, fail to reject $H_0$.`,
    ],
  }
}

function powerTradeoffChoice(rng: Rng): Problem {
  const variant = rng.pick([1, 2])

  if (variant === 1) {
    const options = rng.shuffle([
      { id: 'increase_sample_size', label: 'Increasing the sample size $n$.' },
      { id: 'decrease_significance_level', label: 'Decreasing the significance level $\\alpha$ from 0.05 to 0.01.' },
      { id: 'increase_measurement_variance', label: 'Increasing measurement variability $\\sigma^2$.' },
      { id: 'decrease_effect_size', label: 'Decreasing the true effect size $|\\mu - \\mu_0|$.' },
    ])

    return {
      statement: 'Which of the following actions will INCREASE the statistical power ($1 - \\beta$) of a hypothesis test?',
      answer: { kind: 'choice', options, correctId: 'increase_sample_size' },
      solution: [
        { text: 'Increasing sample size $n$ reduces standard error $\\text{SE} = \\sigma / \\sqrt{n}$, increasing the test statistic magnitude and statistical power.' },
      ],
      hints: [
        'Power increases when standard error $\\text{SE}$ decreases.',
        'Recall how sample size $n$ affects standard error.',
      ],
    }
  }

  const options = rng.shuffle([
    { id: 'larger_effect_size_power', label: 'A larger true effect size $|\\mu - \\mu_0|$ increases statistical power.' },
    { id: 'smaller_n_power', label: 'Smaller sample sizes always increase statistical power.' },
    { id: 'smaller_alpha_power', label: 'Decreasing significance level $\\alpha$ increases statistical power.' },
    { id: 'higher_sd_power', label: 'Higher measurement variance $\\sigma^2$ increases statistical power.' },
  ])

  return {
    statement: 'Which statement accurately describes a factor influencing statistical power ($1 - \\beta$)?',
    answer: { kind: 'choice', options, correctId: 'larger_effect_size_power' },
    solution: [
      { text: 'A larger true effect size $|\\mu - \\mu_0|$ shifts the distribution of the test statistic under $H_1$ further from critical cutoffs, increasing power.' },
    ],
    hints: [
      'Think about how easier it is to detect a large effect compared to a tiny effect.',
      'Larger effect sizes increase power.',
    ],
  }
}

function tier3(rng: Rng): Problem {
  const choice = rng.int(1, 3)
  if (choice === 1) return pValDefinitionChoice(rng)
  if (choice === 2) return clinicalTrialDecision(rng)
  return powerTradeoffChoice(rng)
}

export const template: SkillTemplate = {
  skillId: 'hypothesis_logic',
  theory,
  expectedSeconds: { 1: 45, 2: 75, 3: 110 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
