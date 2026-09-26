import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'One-sample $z$-test (when population $\\sigma$ is known): $z = \\frac{\\bar{x} - \\mu_0}{\\sigma / \\sqrt{n}}$.',
  'One-sample $t$-test (when population $\\sigma$ is unknown, using sample SD $s$): $t = \\frac{\\bar{x} - \\mu_0}{s / \\sqrt{n}}$ with degrees of freedom $\\text{df} = n - 1$.',
  'Decision rule: compare test statistic $|z|$ or $|t|$ with given critical value $z_{\\text{crit}}$ or $t_{\\text{crit}}$. Reject $H_0$ if $|\\text{statistic}| > \\text{critical value}$.',
  'When to use $z$ vs $t$: use $z$-test when population $\\sigma$ is known; use $t$-test when $\\sigma$ is unknown and estimated by sample SD $s$.',
  'A $t$-distribution has heavier tails than $\\mathcal{N}(0, 1)$, adjusting for uncertainty in estimating $\\sigma$. As $\\text{df} \\to \\infty$, $t \\to z$.',
  'Common mistakes: using $n$ instead of $n-1$ for degrees of freedom in a one-sample $t$-test, or using a $z$-test when population standard deviation $\\sigma$ is unknown.',
].join('\n')

interface ClinicalStudy {
  readonly topic: string
  readonly phrase: string
  readonly mu0: number
  readonly unit: string
  readonly isTemp?: boolean
}

const CLINICAL_STUDIES: readonly ClinicalStudy[] = [
  { topic: 'systolic blood pressure', phrase: 'evaluating systolic blood pressure', mu0: 130, unit: 'mmHg' },
  { topic: 'fasting blood glucose', phrase: 'measuring fasting blood glucose', mu0: 100, unit: 'mg/dL' },
  { topic: 'serum cholesterol', phrase: 'evaluating serum cholesterol levels', mu0: 200, unit: 'mg/dL' },
  { topic: 'resting pulse rate', phrase: 'monitoring resting pulse rate', mu0: 72, unit: 'bpm' },
  { topic: 'plasma hemoglobin', phrase: 'evaluating plasma hemoglobin levels', mu0: 14, unit: 'g/dL' },
  { topic: 'core body temperature', phrase: 'measuring core body temperature', mu0: 37, unit: '°C', isTemp: true },
  { topic: 'liver ALT enzyme', phrase: 'measuring liver enzyme ALT activity', mu0: 35, unit: 'U/L' },
  { topic: 'serum triglycerides', phrase: 'evaluating serum triglyceride levels', mu0: 150, unit: 'mg/dL' },
]

function round3(val: number): number {
  return Math.round(val * 1000) / 1000
}

function calculateZStatistic(rng: Rng): Problem {
  const study = rng.pick(CLINICAL_STUDIES)

  if (study.isTemp) {
    const sqrtN = rng.pick([5, 10])
    const n = sqrtN * sqrtN
    const se = 0.1
    const sigma = round3(sqrtN * se)
    const z = rng.pick([-2.5, -2, -1.5, 1.5, 2, 2.5])
    const xbar = round3(study.mu0 + z * se)

    return {
      statement: `In a trial ${study.phrase} with known population $\\sigma = ${sigma}\\text{ ${study.unit}}$, a sample of size $n = ${n}$ yields $\\bar{x} = ${xbar}\\text{ ${study.unit}}$. To test $H_0: \\mu = ${study.mu0}$, calculate the $z$-test statistic.`,
      answer: { kind: 'number', value: String(z) },
      solution: [
        { text: 'Calculate the standard error:', tex: `\\text{SE} = \\frac{\\sigma}{\\sqrt{n}} = \\frac{${sigma}}{\\sqrt{${n}}} = ${se}` },
        { text: 'Compute the $z$-statistic:', tex: `z = \\frac{\\bar{x} - \\mu_0}{\\text{SE}} = \\frac{${xbar} - ${study.mu0}}{${se}} = ${z}` },
      ],
      hints: [
        'First compute $\\text{SE} = \\frac{\\sigma}{\\sqrt{n}}$.',
        `Then calculate $z = \\frac{${xbar} - ${study.mu0}}{\\text{SE}}$.`,
      ],
    }
  }

  const sqrtN = rng.pick([2, 3, 4, 5, 6, 8, 10])
  const n = sqrtN * sqrtN
  const mult = rng.pick([1, 2, 3, 4, 5, 6])
  const sigma = sqrtN * mult
  const z = rng.pick([-3, -2.5, -2, -1.5, -1, 1, 1.5, 2, 2.5, 3])
  const xbar = round3(study.mu0 + z * mult)

  return {
    statement: `In a trial ${study.phrase} with known population $\\sigma = ${sigma}\\text{ ${study.unit}}$, a sample of size $n = ${n}$ yields $\\bar{x} = ${xbar}\\text{ ${study.unit}}$. To test $H_0: \\mu = ${study.mu0}$, calculate the $z$-test statistic.`,
    answer: { kind: 'number', value: String(z) },
    solution: [
      { text: 'Calculate the standard error:', tex: `\\text{SE} = \\frac{\\sigma}{\\sqrt{n}} = \\frac{${sigma}}{\\sqrt{${n}}} = ${mult}` },
      { text: 'Compute the $z$-statistic:', tex: `z = \\frac{\\bar{x} - \\mu_0}{\\text{SE}} = \\frac{${xbar} - ${study.mu0}}{${mult}} = ${z}` },
    ],
    hints: [
      'First compute $\\text{SE} = \\frac{\\sigma}{\\sqrt{n}}$.',
      `Then calculate $z = \\frac{${xbar} - ${study.mu0}}{\\text{SE}}$.`,
    ],
  }
}

function calculateTStatistic(rng: Rng): Problem {
  const study = rng.pick(CLINICAL_STUDIES)

  if (study.isTemp) {
    const sqrtN = rng.pick([5, 10])
    const n = sqrtN * sqrtN
    const se = 0.1
    const s = round3(sqrtN * se)
    const t = rng.pick([-2.5, -2, -1.5, 1.5, 2, 2.5])
    const xbar = round3(study.mu0 + t * se)

    return {
      statement: `In a clinical study testing $H_0: \\mu = ${study.mu0}\\text{ ${study.unit}}$ with unknown $\\sigma$, a sample of size $n = ${n}$ yields $\\bar{x} = ${xbar}\\text{ ${study.unit}}$ and sample standard deviation $s = ${s}\\text{ ${study.unit}}$. Calculate the $t$-test statistic.`,
      answer: { kind: 'number', value: String(t) },
      solution: [
        { text: 'Calculate the estimated standard error:', tex: `\\text{SE} = \\frac{s}{\\sqrt{n}} = \\frac{${s}}{\\sqrt{${n}}} = ${se}` },
        { text: 'Compute the $t$-statistic:', tex: `t = \\frac{\\bar{x} - \\mu_0}{\\text{SE}} = \\frac{${xbar} - ${study.mu0}}{${se}} = ${t}` },
      ],
      hints: [
        'Use $t = \\frac{\\bar{x} - \\mu_0}{s / \\sqrt{n}}$.',
        `Calculate $\\text{SE} = \\frac{${s}}{${sqrtN}} = ${se}$, then divide $\\bar{x} - \\mu_0 = ${round3(xbar - study.mu0)}$ by ${se}.`,
      ],
    }
  }

  const sqrtN = rng.pick([2, 3, 4, 5, 6, 8, 10])
  const n = sqrtN * sqrtN
  const mult = rng.pick([1, 2, 3, 4, 5, 6])
  const s = sqrtN * mult
  const t = rng.pick([-3, -2.5, -2, -1.5, -1, 1, 1.5, 2, 2.5, 3])
  const xbar = round3(study.mu0 + t * mult)

  return {
    statement: `In a clinical study testing $H_0: \\mu = ${study.mu0}\\text{ ${study.unit}}$ with unknown $\\sigma$, a sample of size $n = ${n}$ yields $\\bar{x} = ${xbar}\\text{ ${study.unit}}$ and sample standard deviation $s = ${s}\\text{ ${study.unit}}$. Calculate the $t$-test statistic.`,
    answer: { kind: 'number', value: String(t) },
    solution: [
      { text: 'Calculate the estimated standard error:', tex: `\\text{SE} = \\frac{s}{\\sqrt{n}} = \\frac{${s}}{\\sqrt{${n}}} = ${mult}` },
      { text: 'Compute the $t$-statistic:', tex: `t = \\frac{\\bar{x} - \\mu_0}{\\text{SE}} = \\frac{${xbar} - ${study.mu0}}{${mult}} = ${t}` },
    ],
    hints: [
      'Use $t = \\frac{\\bar{x} - \\mu_0}{s / \\sqrt{n}}$.',
      `Calculate $\\text{SE} = \\frac{${s}}{${sqrtN}} = ${mult}$, then divide $\\bar{x} - \\mu_0 = ${round3(xbar - study.mu0)}$ by ${mult}.`,
    ],
  }
}

function degreesOfFreedom(rng: Rng): Problem {
  const study = rng.pick(CLINICAL_STUDIES)
  const n = rng.pick([10, 12, 15, 16, 20, 25, 30, 36, 40, 50, 60, 100])
  const df = n - 1

  return {
    statement: `A one-sample $t$-test ${study.phrase} is performed with a sample of size $n = ${n}$. Calculate the degrees of freedom $\\text{df}$ for this test.`,
    answer: { kind: 'number', value: String(df) },
    solution: [
      { text: 'For a one-sample $t$-test, degrees of freedom is $\\text{df} = n - 1$:' },
      { text: 'Substitute $n$:', tex: `\\text{df} = ${n} - 1 = ${df}` },
    ],
    hints: [
      'Use $\\text{df} = n - 1$ for a one-sample $t$-test.',
      `Subtract $1$ from $n = ${n}$ to get $\\text{df} = ${df}$.`,
    ],
  }
}

function tier1(rng: Rng): Problem {
  const choice = rng.int(1, 3)
  if (choice === 1) return calculateZStatistic(rng)
  if (choice === 2) return calculateTStatistic(rng)
  return degreesOfFreedom(rng)
}

function zTestDecision(rng: Rng): Problem {
  const study = rng.pick(CLINICAL_STUDIES)
  const zCrit = 1.96
  const isReject = rng.chance(0.5)
  const zStat = isReject ? rng.pick([2.15, 2.35, 2.50, 2.80, -2.25, -2.45]) : rng.pick([0.85, 1.20, 1.45, 1.75, -1.10, -1.60])

  const correctId = isReject ? 'reject_null' : 'fail_to_reject_null'
  const options = rng.shuffle([
    { id: 'reject_null', label: 'Reject $H_0$' },
    { id: 'fail_to_reject_null', label: 'Fail to reject $H_0$' },
    { id: 'accept_null_proved', label: 'Accept $H_0$ as proven true' },
    { id: 'reject_alternative', label: 'Reject $H_1$' },
  ])

  return {
    statement: `A $z$-test ${study.phrase} yields test statistic $z = ${zStat}$. Given two-tailed critical value $z_{\\text{crit}} = ${zCrit}$ at $\\alpha = 0.05$, what is the test decision?`,
    answer: { kind: 'choice', options, correctId },
    solution: [
      { text: `Compare $|z| = |${zStat}| = ${Math.abs(zStat)}$ to $z_{\\text{crit}} = ${zCrit}$:` },
      { text: isReject ? `$${Math.abs(zStat)} > ${zCrit} \\implies$ Reject $H_0$.` : `$${Math.abs(zStat)} \\le ${zCrit} \\implies$ Fail to reject $H_0$.` },
    ],
    hints: [
      'Reject $H_0$ if $|z| > z_{\\text{crit}}$.',
      `Compare $|${zStat}| = ${Math.abs(zStat)}$ with $z_{\\text{crit}} = ${zCrit}$.`,
    ],
  }
}

function tTestDecision(rng: Rng): Problem {
  const study = rng.pick(CLINICAL_STUDIES.filter((c) => !c.isTemp))
  const sqrtN = rng.pick([4, 5])
  const n = sqrtN * sqrtN
  const df = n - 1
  const tCrit = df === 15 ? 2.131 : 2.064
  const mult = rng.pick([2, 3, 4])
  const s = sqrtN * mult
  const isReject = rng.chance(0.5)

  let tStat: number
  if (isReject) {
    tStat = df === 15 ? 2.4 : 2.3
  } else {
    tStat = 1.4
  }

  const xbar = round3(study.mu0 + tStat * mult)
  const correctId = isReject ? 'reject_null' : 'fail_to_reject_null'
  const options = rng.shuffle([
    { id: 'reject_null', label: 'Reject $H_0$' },
    { id: 'fail_to_reject_null', label: 'Fail to reject $H_0$' },
    { id: 'accept_null_proved', label: 'Accept $H_0$ as proven true' },
    { id: 'reject_alternative', label: 'Reject $H_1$' },
  ])

  return {
    statement: `A one-sample $t$-test ${study.phrase} with $n = ${n}$ ($\\text{df} = ${df}$) yields $\\bar{x} = ${xbar}\\text{ ${study.unit}}$ and $s = ${s}\\text{ ${study.unit}}$ for testing $H_0: \\mu = ${study.mu0}$. Given critical value $t_{0.975, ${df}} = ${tCrit}$, what is the decision at $\\alpha = 0.05$?`,
    answer: { kind: 'choice', options, correctId },
    solution: [
      { text: `Calculate estimated standard error: $\\text{SE} = \\frac{${s}}{\\sqrt{${n}}} = ${mult}$.` },
      { text: `Compute test statistic: $t = \\frac{${xbar} - ${study.mu0}}{${mult}} = ${tStat}$.` },
      { text: isReject ? `Since $|t| = ${tStat} > ${tCrit}$, reject $H_0$.` : `Since $|t| = ${tStat} \\le ${tCrit}$, fail to reject $H_0$.` },
    ],
    hints: [
      `First compute $t = \\frac{\\bar{x} - \\mu_0}{s / \\sqrt{n}} = \\frac{${xbar} - ${study.mu0}}{${mult}} = ${tStat}$.`,
      `Compare $|t| = ${tStat}$ with $t_{\\text{crit}} = ${tCrit}$.`,
    ],
  }
}

function zVsTChoice(rng: Rng): Problem {
  const study = rng.pick(CLINICAL_STUDIES.filter((c) => !c.isTemp))
  const options = rng.shuffle([
    { id: 'one_sample_t_test', label: 'One-sample $t$-test (since population $\\sigma$ is unknown and estimated by sample SD $s$)' },
    { id: 'one_sample_z_test', label: 'One-sample $z$-test (assuming sample SD $s$ equals population $\\sigma$)' },
    { id: 'chi_square_test', label: 'Chi-square test for independence' },
    { id: 'paired_z_test', label: 'Two-sample $z$-test' },
  ])

  return {
    statement: `A study measures ${study.topic} in $n = 25$ subjects. The population standard deviation $\\sigma$ is UNKNOWN, and the sample standard deviation $s = 12\\text{ ${study.unit}}$ is calculated. Which statistical test should be used to test $H_0: \\mu = ${study.mu0}$?`,
    answer: { kind: 'choice', options, correctId: 'one_sample_t_test' },
    solution: [
      { text: 'When population standard deviation $\\sigma$ is unknown and estimated by sample SD $s$, a $t$-test must be used.' },
    ],
    hints: [
      'Check whether population standard deviation $\\sigma$ is known or unknown.',
      'When $\\sigma$ is unknown and estimated by $s$, use a $t$-test.',
    ],
  }
}

function tier2(rng: Rng): Problem {
  const choice = rng.int(1, 3)
  if (choice === 1) return zTestDecision(rng)
  if (choice === 2) return tTestDecision(rng)
  return zVsTChoice(rng)
}

function clinicalTTestCalc(rng: Rng): Problem {
  const study = rng.pick(CLINICAL_STUDIES)

  if (study.isTemp) {
    const sqrtN = rng.pick([5, 10])
    const n = sqrtN * sqrtN
    const se = 0.1
    const s = round3(sqrtN * se)
    const t = rng.pick([-2.5, -2, -1.5, 1.5, 2, 2.5])
    const xbar = round3(study.mu0 + t * se)

    return {
      statement: `A Phase II clinical trial measures ${study.topic} in $n = ${n}$ patients, reporting mean $\\bar{x} = ${xbar}\\text{ ${study.unit}}$ and sample standard deviation $s = ${s}\\text{ ${study.unit}}$. Calculate the $t$-test statistic for $H_0: \\mu = ${study.mu0}$.`,
      answer: { kind: 'number', value: String(t) },
      solution: [
        { text: 'Calculate standard error of sample mean:', tex: `\\text{SE} = \\frac{s}{\\sqrt{n}} = \\frac{${s}}{${sqrtN}} = ${se}` },
        { text: 'Compute $t$-statistic:', tex: `t = \\frac{\\bar{x} - \\mu_0}{\\text{SE}} = \\frac{${xbar} - ${study.mu0}}{${se}} = ${t}` },
      ],
      hints: [
        'Use $t = \\frac{\\bar{x} - \\mu_0}{s / \\sqrt{n}}$.',
        `Divide $\\bar{x} - \\mu_0 = ${round3(xbar - study.mu0)}$ by $\\text{SE} = ${se}$ to get $t = ${t}$.`,
      ],
      inputHint: 'A decimal value.',
    }
  }

  const sqrtN = rng.pick([4, 5, 8, 10])
  const n = sqrtN * sqrtN
  const mult = rng.pick([2, 3, 4, 5])
  const s = sqrtN * mult
  const t = rng.pick([-2.5, -2, -1.5, 1.5, 2, 2.5])
  const xbar = round3(study.mu0 + t * mult)

  return {
    statement: `A Phase II clinical trial measures ${study.topic} in $n = ${n}$ patients, reporting mean $\\bar{x} = ${xbar}\\text{ ${study.unit}}$ and sample standard deviation $s = ${s}\\text{ ${study.unit}}$. Calculate the $t$-test statistic for $H_0: \\mu = ${study.mu0}$.`,
    answer: { kind: 'number', value: String(t) },
    solution: [
      { text: 'Calculate standard error of sample mean:', tex: `\\text{SE} = \\frac{s}{\\sqrt{n}} = \\frac{${s}}{${sqrtN}} = ${mult}` },
      { text: 'Compute $t$-statistic:', tex: `t = \\frac{\\bar{x} - \\mu_0}{\\text{SE}} = \\frac{${xbar} - ${study.mu0}}{${mult}} = ${t}` },
    ],
    hints: [
      'Use $t = \\frac{\\bar{x} - \\mu_0}{s / \\sqrt{n}}$.',
      `Divide $\\bar{x} - \\mu_0 = ${round3(xbar - study.mu0)}$ by $\\text{SE} = ${mult}$ to get $t = ${t}$.`,
    ],
    inputHint: 'A decimal value.',
  }
}

function clinicalTestDecision(rng: Rng): Problem {
  const study = rng.pick(CLINICAL_STUDIES)
  const isReject = rng.chance(0.5)
  const zStat = isReject ? rng.pick([2.45, 2.75, 3.10]) : rng.pick([1.15, 1.35, 1.55])
  const zCrit = 1.96

  const correctId = isReject ? 'reject_null_significant' : 'fail_to_reject_insignificant'
  const options = rng.shuffle([
    { id: 'reject_null_significant', label: `Reject $H_0$: statistically significant evidence that mean ${study.topic} differs from baseline ${study.mu0}.` },
    { id: 'fail_to_reject_insignificant', label: `Fail to reject $H_0$: insufficient evidence that mean ${study.topic} differs from baseline ${study.mu0}.` },
    { id: 'accept_null_proved', label: `Accept $H_0$: proven that mean ${study.topic} equals ${study.mu0}.` },
    { id: 'invalid_test', label: 'Invalid test: $z$-test cannot be applied to clinical data.' },
  ])

  return {
    statement: `In a clinical trial ${study.phrase}, the calculated test statistic is $z = ${zStat}$. Given critical value $z_{\\text{crit}} = ${zCrit}$ at $\\alpha = 0.05$, what is the clinical decision?`,
    answer: { kind: 'choice', options, correctId },
    solution: [
      { text: `Compare $|z| = ${zStat}$ with $z_{\\text{crit}} = ${zCrit}$:` },
      { text: isReject ? `$${zStat} > ${zCrit} \\implies$ Reject $H_0$.` : `$${zStat} \\le ${zCrit} \\implies$ Fail to reject $H_0$.` },
    ],
    hints: [
      'Compare $|z|$ to $z_{\\text{crit}} = 1.96$.',
      isReject ? `Since $z = ${zStat} > 1.96$, reject $H_0$.` : `Since $z = ${zStat} \\le 1.96$, fail to reject $H_0$.`,
    ],
  }
}

function tDistributionPropertiesChoice(rng: Rng): Problem {
  const variant = rng.pick([1, 2, 3])

  if (variant === 1) {
    const options = rng.shuffle([
      { id: 't_heavier_tails_approaches_z', label: 'The $t$-distribution has heavier (fatter) tails than the standard normal distribution $Z$, and approaches $Z$ as $\\text{df} \\to \\infty$.' },
      { id: 't_lighter_tails', label: 'The $t$-distribution has lighter tails than $Z$, making critical values smaller for small sample sizes.' },
      { id: 't_independent_df', label: 'The shape of the $t$-distribution is independent of sample size and degrees of freedom.' },
      { id: 't_always_skewed', label: 'The $t$-distribution is skewed to the right for all finite degrees of freedom.' },
    ])
    return {
      statement: 'Which statement correctly describes the relationship between Student\'s $t$-distribution and the standard normal distribution $Z$?',
      answer: { kind: 'choice', options, correctId: 't_heavier_tails_approaches_z' },
      solution: [
        { text: 'The $t$-distribution accounts for additional variance in estimating $\\sigma$ with $s$, giving it heavier tails than $Z$. As $\\text{df} = n-1 \\to \\infty$, $t \\to Z$.' },
      ],
      hints: [
        'Consider how estimating $\\sigma$ with $s$ adds variability to the test statistic.',
        'Think about what happens to the $t$-distribution as sample size $n$ becomes very large.',
      ],
    }
  }

  if (variant === 2) {
    const options = rng.shuffle([
      { id: 't_larger_df_smaller_crit', label: 'As degrees of freedom $\\text{df}$ increase, the critical value $t_{\\text{crit}}$ decreases toward the corresponding $z_{\\text{crit}}$.' },
      { id: 't_larger_df_larger_crit', label: 'As degrees of freedom $\\text{df}$ increase, critical values $t_{\\text{crit}}$ grow infinitely large.' },
      { id: 't_larger_df_no_effect', label: 'Degrees of freedom do not affect critical value cutoffs.' },
      { id: 't_df_inverts_sign', label: 'Higher degrees of freedom invert the sign of the critical value.' },
    ])
    return {
      statement: 'How do critical values $t_{\\text{crit}}$ for a two-tailed $t$-test behave as degrees of freedom $\\text{df}$ increase for a fixed significance level $\\alpha$?',
      answer: { kind: 'choice', options, correctId: 't_larger_df_smaller_crit' },
      solution: [
        { text: 'As $\\text{df} \\to \\infty$, tail uncertainty decreases, so $t_{\\text{crit}}$ decreases toward the normal cutoff $z_{\\text{crit}}$.' },
      ],
      hints: [
        'Recall that $t_{\\text{crit}}$ for small $\\text{df}$ (e.g. 2.131 for $\\text{df}=15$) is larger than $z_{\\text{crit}} = 1.96$.',
        'As sample size grows, the $t$-distribution approaches $Z$.',
      ],
    }
  }

  const options = rng.shuffle([
    { id: 'sigma_unknown_requires_t', label: 'Use a $t$-test when the population standard deviation $\\sigma$ is unknown and estimated by sample SD $s$.' },
    { id: 'sigma_known_requires_t', label: 'Use a $t$-test only when population standard deviation $\\sigma$ is known.' },
    { id: 'sample_size_large_forbids_t', label: 'A $t$-test cannot be used if sample size $n > 30$.' },
    { id: 'mean_zero_forbids_t', label: 'A $t$-test cannot be used if baseline mean $\\mu_0 = 0$.' },
  ])
  return {
    statement: 'Which criterion mandates the use of a one-sample $t$-test rather than a $z$-test?',
    answer: { kind: 'choice', options, correctId: 'sigma_unknown_requires_t' },
    solution: [
      { text: 'The defining condition for a $t$-test is that population standard deviation $\\sigma$ is unknown and estimated using sample SD $s$.' },
    ],
    hints: [
      'Focus on whether population standard deviation $\\sigma$ is known or unknown.',
      'Using sample SD $s$ in place of $\\sigma$ requires the $t$-distribution.',
    ],
  }
}

function tier3(rng: Rng): Problem {
  const choice = rng.int(1, 3)
  if (choice === 1) return clinicalTTestCalc(rng)
  if (choice === 2) return clinicalTestDecision(rng)
  return tDistributionPropertiesChoice(rng)
}

export const template: SkillTemplate = {
  skillId: 'z_t_test',
  theory,
  expectedSeconds: { 1: 45, 2: 75, 3: 110 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
