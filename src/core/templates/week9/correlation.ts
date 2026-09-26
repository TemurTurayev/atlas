import { rat, ratToLatex } from '../../math/rational'
import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'Covariance $\\text{Cov}(X, Y) = \\dfrac{1}{n-1} \\sum_{i=1}^n (x_i - \\bar{x})(y_i - \\bar{y})$ measures joint variability.',
  'Pearson correlation coefficient $r = \\dfrac{\\text{Cov}(X, Y)}{s_X s_Y} = \\dfrac{\\sum (x_i - \\bar{x})(y_i - \\bar{y})}{\\sqrt{\\sum (x_i - \\bar{x})^2 \\sum (y_i - \\bar{y})^2}}$, with $-1 \\le r \\le 1$.',
  'Effect of linear transformations: $r(aX + b, cY + d) = r(X, Y)$ if $a, c$ have the same sign; if one is negative, $r$ changes sign.',
  'Correlation measures ONLY linear association; $r = 0$ does not imply independence for non-linear relationships.',
  'Correlation does NOT imply causation: a strong correlation may be due to a confounding variable.',
  'Common mistakes: assuming $r = 1$ means $Y = X$, or assuming $r = 0$ means $X$ and $Y$ have no relationship at all.',
].join('\n')

interface DatasetPattern {
  readonly dx: readonly number[]
  readonly dy: readonly number[]
  readonly rStr: string
}

const PATTERNS: readonly DatasetPattern[] = [
  { dx: [-2, -1, 1, 2], dy: [-2, -1, 1, 2], rStr: '1' },
  { dx: [-2, -1, 1, 2], dy: [2, 1, -1, -2], rStr: '-1' },
  { dx: [-2, -1, 0, 1, 2], dy: [-1, -2, 0, 2, 1], rStr: '0.8' },
  { dx: [-2, -1, 0, 1, 2], dy: [1, 2, 0, -2, -1], rStr: '-0.8' },
  { dx: [-2, -1, 0, 1, 2], dy: [-2, 1, 0, -1, 2], rStr: '0.6' },
  { dx: [-2, -1, 0, 1, 2], dy: [2, -1, 0, 1, -2], rStr: '-0.6' },
  { dx: [-2, -1, 1, 2], dy: [-1, 2, -2, 1], rStr: '0' },
  { dx: [-3, -1, 1, 3], dy: [-1, -3, 3, 1], rStr: '0.6' },
  { dx: [-3, -1, 1, 3], dy: [1, 3, -3, -1], rStr: '-0.6' },
  { dx: [-3, -1, 1, 3], dy: [-3, 1, -1, 3], rStr: '0.8' },
  { dx: [-3, -1, 1, 3], dy: [3, -1, 1, -3], rStr: '-0.8' },
  { dx: [-2, -1, 0, 1, 2], dy: [-1, -2, 0, 1, 2], rStr: '0.9' },
  { dx: [-2, -1, 0, 1, 2], dy: [1, 2, 0, -1, -2], rStr: '-0.9' },
]

function makeDataset(rng: Rng) {
  const pattern = rng.pick(PATTERNS)
  const mx = rng.int(5, 50)
  const my = rng.int(5, 50)
  const a = rng.int(1, 5)
  const b = rng.int(1, 5)

  const points = pattern.dx.map((dxVal, i) => ({
    x: mx + a * dxVal,
    y: my + b * pattern.dy[i],
  }))

  return { points, rStr: pattern.rStr, mx, my, a, b, dx: pattern.dx, dy: pattern.dy }
}

function pearsonRSmallData(rng: Rng): Problem {
  const { points, rStr, mx, my } = makeDataset(rng)
  const ptsTex = points.map((p) => `(${p.x}, ${p.y})`).join(', ')

  let sumSxy = 0
  let sumSxx = 0
  let sumSyy = 0
  for (let i = 0; i < points.length; i += 1) {
    const dx = points[i].x - mx
    const dy = points[i].y - my
    sumSxy += dx * dy
    sumSxx += dx * dx
    sumSyy += dy * dy
  }

  return {
    statement: `For the dataset $(x, y) \\in \\{${ptsTex}\\}$, find the Pearson correlation coefficient $r$.`,
    answer: { kind: 'number', value: rStr },
    solution: [
      { text: `Calculate sample means: $\\bar{x} = ${mx}$, $\\bar{y} = ${my}$.` },
      { text: 'Compute deviations and sums:' },
      { text: `$\\sum (x_i - \\bar{x})^2 = ${sumSxx}$, $\\sum (y_i - \\bar{y})^2 = ${sumSyy}$, $\\sum (x_i - \\bar{x})(y_i - \\bar{y}) = ${sumSxy}$.` },
      { text: 'Substitute into Pearson’s correlation formula:', tex: `r = \\frac{\\sum (x_i - \\bar{x})(y_i - \\bar{y})}{\\sqrt{\\sum (x_i - \\bar{x})^2 \\sum (y_i - \\bar{y})^2}} = \\frac{${sumSxy}}{\\sqrt{${sumSxx} \\cdot ${sumSyy}}} = ${rStr}` },
    ],
    hints: [
      `Calculate sample means $\\bar{x} = ${mx}$ and $\\bar{y} = ${my}$ first.`,
      `Compute $\\sum (x_i - \\bar{x})(y_i - \\bar{y}) = ${sumSxy}$ and divide by $\\sqrt{${sumSxx} \\cdot ${sumSyy}}$.`,
    ],
    inputHint: 'An exact number or simple decimal.',
  }
}

function covarianceSmallData(rng: Rng): Problem {
  const { points, a, b, dx, dy, mx, my } = makeDataset(rng)
  const n = points.length
  let sumProd = 0
  for (let i = 0; i < n; i += 1) {
    sumProd += (a * dx[i]) * (b * dy[i])
  }

  const covRat = rat(sumProd, n - 1)
  const ansTex = ratToLatex(covRat)
  const ptsTex = points.map((p) => `(${p.x}, ${p.y})`).join(', ')

  return {
    statement: `Calculate the sample covariance $\\text{Cov}(X, Y)$ for the dataset $(x_i, y_i) \\in \\{${ptsTex}\\}$ with $n = ${n}$ points (sample means are $\\bar{x} = ${mx}$ and $\\bar{y} = ${my}$).`,
    answer: { kind: 'number', value: ansTex },
    solution: [
      { text: 'Apply the sample covariance formula:', tex: '\\text{Cov}(X, Y) = \\frac{1}{n-1} \\sum_{i=1}^n (x_i - \\bar{x})(y_i - \\bar{y})' },
      { text: `Compute the sum of product deviations: $\\sum (x_i - \\bar{x})(y_i - \\bar{y}) = ${sumProd}$.` },
      { text: `Divide by $n - 1 = ${n - 1}$ to get:`, tex: `\\text{Cov}(X, Y) = ${ansTex}` },
    ],
    hints: [
      'Use $\\text{Cov}(X, Y) = \\frac{1}{n-1} \\sum (x_i - \\bar{x})(y_i - \\bar{y})$.',
      `Sum the product of deviations and divide by $n - 1 = ${n - 1}$.`,
    ],
    inputHint: 'An exact integer or fraction.',
  }
}

function formatLinear(slope: number, intercept: number, varName: string): string {
  const slopeStr = slope === 1 ? varName : slope === -1 ? `-${varName}` : `${slope}${varName}`
  if (intercept === 0) return slopeStr
  return intercept > 0 ? `${slopeStr} + ${intercept}` : `${slopeStr} - ${-intercept}`
}

function linearTransformR(rng: Rng): Problem {
  const r0 = rng.pick(['0.8', '0.6', '-0.5', '0.9', '-0.7', '0.4', '-0.8', '0.7', '-0.9'])
  const a = rng.pick([-5, -4, -3, -2, 2, 3, 4, 5])
  const b = rng.pick([-10, -5, -2, 2, 5, 10, 15])
  const c = rng.pick([-5, -4, -3, -2, 2, 3, 4, 5])
  const d = rng.pick([-10, -5, -2, 2, 5, 10, 15])

  const uTex = formatLinear(a, b, 'X')
  const vTex = formatLinear(c, d, 'Y')

  const sameSign = (a * c) > 0
  const r0Num = Number(r0)
  const ansNum = sameSign ? r0Num : -r0Num
  const ansStr = String(ansNum)

  return {
    statement: `The Pearson correlation coefficient between $X$ and $Y$ is $r(X, Y) = ${r0}$. If $U = ${uTex}$ and $V = ${vTex}$, find the correlation coefficient $r(U, V)$.`,
    answer: { kind: 'number', value: ansStr },
    solution: [
      { text: 'Linear transformations $U = aX + b$ and $V = cY + d$ preserve $|r(X, Y)|$.' },
      { text: 'The sign of $r(U, V)$ depends on the product $a \\cdot c$:' },
      { text: `Here $a = ${a}$ and $c = ${c}$, so $a \\cdot c = ${a * c} ${sameSign ? '> 0' : '< 0'}$.` },
      { text: 'Therefore:', tex: `r(U, V) = ${ansStr}` },
    ],
    hints: [
      'Check whether the slope constants $a$ and $c$ have the same or opposite signs.',
      'If $a \\cdot c > 0$, $r$ is unchanged; if $a \\cdot c < 0$, $r$ flips sign.',
    ],
  }
}

function tier1(rng: Rng): Problem {
  const choice = rng.int(1, 3)
  if (choice === 1) return pearsonRSmallData(rng)
  if (choice === 2) return covarianceSmallData(rng)
  return linearTransformR(rng)
}

function rFromDeviations(rng: Rng): Problem {
  const n = rng.pick([6, 8, 10, 12, 15, 20, 25, 30])
  const item = rng.pick([
    { Sxx: 25, Syy: 16, Sxy: 16, rStr: '0.8' },
    { Sxx: 100, Syy: 25, Sxy: 40, rStr: '0.8' },
    { Sxx: 100, Syy: 25, Sxy: -30, rStr: '-0.6' },
    { Sxx: 36, Syy: 64, Sxy: 28.8, rStr: '0.6' },
    { Sxx: 16, Syy: 9, Sxy: 12, rStr: '1' },
    { Sxx: 16, Syy: 9, Sxy: -12, rStr: '-1' },
    { Sxx: 50, Syy: 50, Sxy: 0, rStr: '0' },
    { Sxx: 64, Syy: 36, Sxy: 38.4, rStr: '0.8' },
    { Sxx: 64, Syy: 36, Sxy: -28.8, rStr: '-0.6' },
    { Sxx: 100, Syy: 100, Sxy: 50, rStr: '0.5' },
    { Sxx: 100, Syy: 100, Sxy: -50, rStr: '-0.5' },
    { Sxx: 81, Syy: 49, Sxy: 56.7, rStr: '0.9' },
    { Sxx: 81, Syy: 49, Sxy: -56.7, rStr: '-0.9' },
  ])

  return {
    statement: `In a sample of $n = ${n}$ observations, $\\sum (x_i - \\bar{x})^2 = ${item.Sxx}$, $\\sum (y_i - \\bar{y})^2 = ${item.Syy}$, and $\\sum (x_i - \\bar{x})(y_i - \\bar{y}) = ${item.Sxy}$. Calculate Pearson's $r$.`,
    answer: { kind: 'number', value: item.rStr },
    solution: [
      { text: 'Apply Pearson’s correlation formula using sum of squares:', tex: 'r = \\frac{S_{xy}}{\\sqrt{S_{xx} S_{yy}}}' },
      { text: 'Substitute the given values:', tex: `r = \\frac{${item.Sxy}}{\\sqrt{${item.Sxx} \\cdot ${item.Syy}}} = \\frac{${item.Sxy}}{\\sqrt{${item.Sxx * item.Syy}}} = ${item.rStr}` },
    ],
    hints: [
      'Use $r = \\frac{S_{xy}}{\\sqrt{S_{xx} S_{yy}}}$.',
      `Divide $S_{xy} = ${item.Sxy}$ by $\\sqrt{${item.Sxx} \\cdot ${item.Syy}} = ${Math.sqrt(item.Sxx * item.Syy)}$.`,
    ],
    inputHint: 'An exact number or simple decimal.',
  }
}

function rFromCovAndSD(rng: Rng): Problem {
  const choice = rng.pick([
    { sX: 4, sY: 5, cov: 16, rStr: '0.8' },
    { sX: 10, sY: 5, cov: 30, rStr: '0.6' },
    { sX: 10, sY: 5, cov: -40, rStr: '-0.8' },
    { sX: 6, sY: 8, cov: 24, rStr: '0.5' },
    { sX: 5, sY: 5, cov: 0, rStr: '0' },
    { sX: 8, sY: 6, cov: 38.4, rStr: '0.8' },
    { sX: 12, sY: 10, cov: -108, rStr: '-0.9' },
    { sX: 15, sY: 8, cov: 84, rStr: '0.7' },
    { sX: 20, sY: 10, cov: -120, rStr: '-0.6' },
  ])

  return {
    statement: `Two variables $X$ and $Y$ have sample covariance $\\text{Cov}(X, Y) = ${choice.cov}$, with standard deviations $s_X = ${choice.sX}$ and $s_Y = ${choice.sY}$. Find Pearson's $r$.`,
    answer: { kind: 'number', value: choice.rStr },
    solution: [
      { text: 'Apply the formula relating covariance and correlation:', tex: 'r = \\frac{\\text{Cov}(X, Y)}{s_X s_Y}' },
      { text: 'Substitute values:', tex: `r = \\frac{${choice.cov}}{${choice.sX} \\cdot ${choice.sY}} = \\frac{${choice.cov}}{${choice.sX * choice.sY}} = ${choice.rStr}` },
    ],
    hints: [
      'Use $r = \\frac{\\text{Cov}(X, Y)}{s_X s_Y}$.',
      `Divide $\\text{Cov} = ${choice.cov}$ by $s_X s_Y = ${choice.sX * choice.sY}$.`,
    ],
    inputHint: 'An exact number or simple decimal.',
  }
}

function conceptChoiceProperties(rng: Rng): Problem {
  const isNeg = rng.chance(0.5)

  if (isNeg) {
    const options = rng.shuffle([
      { id: 'strong_neg_linear', label: 'A strong negative linear association between $X$ and $Y$.' },
      { id: 'weak_neg_linear', label: 'A weak negative association between $X$ and $Y$.' },
      { id: 'no_linear', label: 'No linear association whatsoever between $X$ and $Y$.' },
      { id: 'causal_percentage', label: 'That increases in $X$ cause $Y$ to decrease by $90\\%$.' },
    ])
    return {
      statement: 'What does a Pearson correlation coefficient of $r = -0.9$ indicate?',
      answer: { kind: 'choice', options, correctId: 'strong_neg_linear' },
      solution: [
        { text: 'An $r$ value close to $-1$ indicates a strong negative linear relationship.' },
      ],
      hints: [
        'Consider the magnitude $|r| = 0.9$ and the negative sign.',
        'Recall that $r$ measures linear association, not cause.',
      ],
    }
  }

  const options = rng.shuffle([
    { id: 'bounded_minus1_plus1', label: 'Pearson’s $r$ is bounded between $-1$ and $1$, inclusive.' },
    { id: 'unbounded_real', label: 'Pearson’s $r$ can take any real value depending on the units of $X$ and $Y$.' },
    { id: 'always_positive', label: 'Pearson’s $r$ is always strictly positive.' },
    { id: 'equals_slope', label: 'Pearson’s $r$ equals the slope of the regression line.' },
  ])
  return {
    statement: 'Which statement is correct regarding the range of Pearson’s correlation coefficient $r$?',
    answer: { kind: 'choice', options, correctId: 'bounded_minus1_plus1' },
    solution: [
      { text: 'By the Cauchy–Schwarz inequality, $-1 \\le r \\le 1$ for any dataset.' },
    ],
    hints: [
      'Recall the minimum and maximum possible values for $r$.',
      'Check the bounds $[-1, 1]$.',
    ],
  }
}

function tier2(rng: Rng): Problem {
  const choice = rng.int(1, 3)
  if (choice === 1) return rFromDeviations(rng)
  if (choice === 2) return rFromCovAndSD(rng)
  return conceptChoiceProperties(rng)
}

function formatQuad(offset: number): string {
  const inner = offset > 0 ? `(x - ${offset})^2` : offset < 0 ? `(x + ${-offset})^2` : 'x^2'
  const outer = offset > 0 ? ` + ${offset}` : offset < 0 ? ` - ${-offset}` : ''
  return `y = ${inner}${outer}`
}

function interpretRAndOutliers(rng: Rng): Problem {
  const offset = rng.int(-8, 8)
  const pts = [-2, -1, 0, 1, 2].map((x) => `(${x + offset}, ${(x ** 2) + offset})`).join(', ')
  const eqStr = formatQuad(offset)

  return {
    statement: `Consider the data points $(x, y) \\in \\{${pts}\\}$ produced by the non-linear relationship $${eqStr}$. Find the Pearson correlation coefficient $r$.`,
    answer: { kind: 'number', value: '0' },
    solution: [
      { text: 'Calculate deviations from the mean for $x$ and $y$.' },
      { text: 'Because the parabola is symmetric about its vertex, $\\sum (x_i - \\bar{x})(y_i - \\bar{y}) = 0$.' },
      { text: 'Therefore, Pearson’s $r = 0$, demonstrating that $r = 0$ can occur for strong non-linear relationships:', tex: 'r = 0' },
    ],
    hints: [
      'Compute $\\sum (x_i - \\bar{x})(y_i - \\bar{y})$ for this symmetric parabola.',
      'Check if the numerator of Pearson’s $r$ is zero.',
    ],
  }
}

function rChangeUnderNegativeScale(rng: Rng): Problem {
  const r0 = rng.pick(['0.85', '0.75', '0.65', '0.55', '-0.8', '-0.65', '-0.75', '-0.85'])
  const a = rng.pick([-8, -7, -6, -5, -4, -3, -2])
  const b = rng.pick([-10, -5, -2, 2, 5, 10, 15])
  const uTex = formatLinear(a, b, 'X')
  const r0Num = Number(r0)
  const ansNum = -r0Num
  const ansStr = String(ansNum)

  return {
    statement: `Given $r(X, Y) = ${r0}$. If $U = ${uTex}$ and $V = Y$, find $r(U, V)$.`,
    answer: { kind: 'number', value: ansStr },
    solution: [
      { text: `The transformation $U = ${uTex}$ has a negative slope $a = ${a} < 0$.` },
      { text: 'Scaling a variable by a negative constant flips the sign of Pearson’s $r$:' },
      { text: 'Therefore:', tex: `r(U, V) = -r(X, Y) = ${ansStr}` },
    ],
    hints: [
      'Check the sign of the multiplier in $U = aX + b$.',
      'A negative multiplier flips the sign of $r$.',
    ],
  }
}

function conceptChoiceCausation(rng: Rng): Problem {
  const isCausation = rng.chance(0.5)

  if (isCausation) {
    const options = rng.shuffle([
      { id: 'confounding_variable', label: 'Correlation does not imply causation; both variables may be driven by a confounding factor.' },
      { id: 'proves_causation', label: 'A high correlation coefficient proves a direct causal relationship.' },
      { id: 'guaranteed_causation_above_08', label: 'If $r > 0.8$, causation is guaranteed.' },
      { id: 'requires_causal_mechanism', label: 'Correlation can only be calculated when a causal mechanism is proven.' },
    ])
    return {
      statement: 'A researcher observes a strong positive correlation ($r = 0.85$) between ice cream sales and drowning incidents. What is the correct interpretation?',
      answer: { kind: 'choice', options, correctId: 'confounding_variable' },
      solution: [
        { text: 'Correlation indicates association, not causation. Both variables increase in summer due to hot weather (a confounding variable).' },
      ],
      hints: [
        'Recall the principle "correlation does not imply causation".',
        'Consider environmental or seasonal confounding variables.',
      ],
    }
  }

  const options = rng.shuffle([
    { id: 'linear_only_outlier_sensitive', label: 'Pearson’s $r$ measures only linear relationships and can be heavily influenced by outliers.' },
    { id: 'robust_to_outliers', label: 'Pearson’s $r$ is robust to extreme outliers.' },
    { id: 'captures_monotonic_nonlinear', label: 'Pearson’s $r$ perfectly captures monotonic non-linear relationships.' },
    { id: 'equals_1_for_quadratic', label: 'Pearson’s $r$ equals $1$ for any quadratic function.' },
  ])
  return {
    statement: 'Which of the following is a known limitation of Pearson’s correlation coefficient $r$?',
    answer: { kind: 'choice', options, correctId: 'linear_only_outlier_sensitive' },
    solution: [
      { text: 'Pearson’s $r$ only detects linear patterns and single outliers can dramatically inflate or deflate its value.' },
    ],
    hints: [
      'Think about what types of relationships $r$ measures.',
      'Consider the effect of extreme points (outliers).',
    ],
  }
}

function tier3(rng: Rng): Problem {
  const choice = rng.int(1, 3)
  if (choice === 1) return interpretRAndOutliers(rng)
  if (choice === 2) return rChangeUnderNegativeScale(rng)
  return conceptChoiceCausation(rng)
}

export const template: SkillTemplate = {
  skillId: 'correlation',
  theory,
  expectedSeconds: { 1: 45, 2: 75, 3: 110 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
