import type { Rng } from '../../random/rng'
import type { Problem, SkillTemplate } from '../types'

const theory = [
  'For independent variables $x \\pm \\sigma_x$ and $y \\pm \\sigma_y$:',
  'Addition and subtraction ($f = x + y$ or $f = x - y$): absolute error is $\\sigma_f = \\sqrt{\\sigma_x^2 + \\sigma_y^2}$.',
  'Constant scaling ($f = a \\cdot x$): absolute error is $\\sigma_f = |a| \\sigma_x$.',
  'Multiplication and division ($f = x \\cdot y$ or $f = \\frac{x}{y}$): relative errors combine quadratically: $\\left(\\frac{\\sigma_f}{f}\\right)^2 = \\left(\\frac{\\sigma_x}{x}\\right)^2 + \\left(\\frac{\\sigma_y}{y}\\right)^2$.',
  'Power law ($f = x^n$): relative error is $\\frac{\\sigma_f}{|f|} = |n| \\frac{\\sigma_x}{|x|}$.',
  'General formula: $\\sigma_f^2 = \\left(\\frac{\\partial f}{\\partial x}\\right)^2 \\sigma_x^2 + \\left(\\frac{\\partial f}{\\partial y}\\right)^2 \\sigma_y^2$.',
  'Common mistakes: adding errors linearly $\\sigma_x + \\sigma_y$ instead of quadratically $\\sqrt{\\sigma_x^2 + \\sigma_y^2}$, or forgetting the absolute value $|n|$ for powers.',
].join('\n')

interface PythPair {
  readonly a: number
  readonly b: number
  readonly c: number
}

const PYTH_TRIPLES: readonly PythPair[] = [
  { a: 3, b: 4, c: 5 },
  { a: 5, b: 12, c: 13 },
  { a: 6, b: 8, c: 10 },
  { a: 8, b: 15, c: 17 },
  { a: 9, b: 12, c: 15 },
  { a: 12, b: 16, c: 20 },
  { a: 15, b: 20, c: 25 },
  { a: 10, b: 24, c: 26 },
  { a: 20, b: 21, c: 29 },
]

function addSubErrorPythagoras(rng: Rng): Problem {
  const triple = rng.pick(PYTH_TRIPLES)
  const isAdd = rng.chance(0.5)
  const sx = triple.a
  const sy = triple.b
  const sf = triple.c

  // A reported value is well above its uncertainty: at least twice it, as in any real measurement.
  const xVal = 2 * sx + 2 * rng.int(2, 25)
  const yVal = 2 * sy + 2 * rng.int(2, 15)
  const opSymbol = isAdd ? '+' : '-'
  const fVal = isAdd ? xVal + yVal : xVal - yVal

  return {
    statement: `Two independent clinical measurements are given as $x = ${xVal} \\pm ${sx}$ and $y = ${yVal} \\pm ${sy}$. For $f = x ${opSymbol} y = ${fVal}$, calculate the absolute uncertainty $\\sigma_f$.`,
    answer: { kind: 'number', value: String(sf) },
    solution: [
      { text: 'For addition or subtraction, absolute uncertainties combine quadratically:' },
      { text: 'Calculate uncertainty:', tex: `\\sigma_f = \\sqrt{${sx}^2 + ${sy}^2} = \\sqrt{${sx * sx} + ${sy * sy}} = \\sqrt{${sf * sf}} = ${sf}` },
    ],
    hints: [
      'Use $\\sigma_f = \\sqrt{\\sigma_x^2 + \\sigma_y^2}$.',
      `Square $\\sigma_x = ${sx}$ and $\\sigma_y = ${sy}$, add them ($${sx * sx + sy * sy}$), then take the square root ($${sf}$).`,
    ],
  }
}

function scaledError(rng: Rng): Problem {
  const sx = rng.pick([2, 3, 4, 5, 6, 8, 10])
  const a = rng.pick([-5, -4, -3, -2, 2, 3, 4, 5, 10])
  const absA = Math.abs(a)
  const sf = absA * sx
  const xVal = 2 * sx + rng.int(2, 30)

  return {
    statement: `A measured physiological parameter $x = ${xVal} \\pm ${sx}$ is scaled to $f = ${a}x$. Calculate the absolute uncertainty $\\sigma_f$.`,
    answer: { kind: 'number', value: String(sf) },
    solution: [
      { text: 'For constant scaling $f = a \\cdot x$, absolute uncertainty is $\\sigma_f = |a| \\sigma_x$:' },
      { text: 'Calculate uncertainty:', tex: `\\sigma_f = |${a}| \\cdot ${sx} = ${absA} \\cdot ${sx} = ${sf}` },
    ],
    hints: [
      'Use $\\sigma_f = |a| \\sigma_x$.',
      `Multiply $|${a}| = ${absA}$ by $\\sigma_x = ${sx}$ to get $\\sigma_f = ${sf}$.`,
    ],
  }
}

function powerLawRelativeError(rng: Rng): Problem {
  const rx = rng.pick([1, 2, 3, 4, 5])
  const n = rng.pick([-3, -2, -1, 2, 3, 4])
  const absN = Math.abs(n)
  const rf = absN * rx
  const nStr = n < 0 ? `{${n}}` : String(n)

  return {
    statement: `A clinical parameter $x$ has a percentage relative error of $r_x = \\frac{\\sigma_x}{|x|} = ${rx}\\%$. Calculate the percentage relative error $r_f = \\frac{\\sigma_f}{|f|}$ of $f = x^{${nStr}}$.`,
    answer: { kind: 'number', value: String(rf) },
    solution: [
      { text: 'For a power law $f = x^n$, relative errors satisfy $\\frac{\\sigma_f}{|f|} = |n| \\frac{\\sigma_x}{|x|}$:' },
      { text: 'Calculate relative error:', tex: `r_f = |${n}| \\cdot ${rx}\\% = ${absN} \\cdot ${rx}\\% = ${rf}\\%` },
    ],
    hints: [
      'Use $\\frac{\\sigma_f}{|f|} = |n| \\frac{\\sigma_x}{|x|}$.',
      `Multiply $|${n}| = ${absN}$ by $r_x = ${rx}\\%$ to get $r_f = ${rf}\\%$.`,
    ],
  }
}

function tier1(rng: Rng): Problem {
  const choice = rng.int(1, 3)
  if (choice === 1) return addSubErrorPythagoras(rng)
  if (choice === 2) return scaledError(rng)
  return powerLawRelativeError(rng)
}

function multDivRelativeErrorPythagoras(rng: Rng): Problem {
  const triple = rng.pick(PYTH_TRIPLES)
  const isMult = rng.chance(0.5)
  const rx = triple.a
  const ry = triple.b
  const rf = triple.c
  const opStr = isMult ? 'multiplication $f = x \\cdot y$' : 'division $f = \\frac{x}{y}$'

  return {
    statement: `In a clinical laboratory calculation involving ${opStr}, the independent variables have percentage relative errors $r_x = ${rx}\\%$ and $r_y = ${ry}\\%$. Find the percentage relative error $r_f = \\frac{\\sigma_f}{|f|}$.`,
    answer: { kind: 'number', value: String(rf) },
    solution: [
      { text: 'For multiplication or division, relative errors combine quadratically:' },
      { text: 'Calculate relative error:', tex: `r_f = \\sqrt{${rx}^2 + ${ry}^2} = \\sqrt{${rx * rx} + ${ry * ry}} = \\sqrt{${rf * rf}} = ${rf}\\%` },
    ],
    hints: [
      'Use $r_f = \\sqrt{r_x^2 + r_y^2}$.',
      `Square $r_x = ${rx}\\%$ and $r_y = ${ry}\\%$, sum them ($${rx * rx + ry * ry}$), then take the square root ($${rf}\\%$).`,
    ],
  }
}

interface ExactDerivProblemSpec {
  readonly statement: string
  readonly answerVal: number
  readonly step1Tex: string
  readonly step2Tex: string
  readonly hint2Text: string
}

const DERIV_CONTEXTS = [
  'In a biophysical model',
  'In a clinical transducer calibration',
  'For a physiological transfer function',
  'In a laboratory measurement system',
  'In a signal processing pipeline',
  'For a hemodynamic potential equation',
]

/** A small uncertainty that divides `c` and stays below half the value it produces (c / sigma). */
function smallDivisor(rng: Rng, c: number): number {
  const options = [1, 2, 3].filter((d) => c % d === 0 && 2 * d * d < c)
  return options.length > 0 ? rng.pick(options) : 1
}

interface Contributions {
  readonly fLatex: string
  readonly x: number
  readonly y: number
  readonly sx: number
  readonly sy: number
  /** Partial derivatives at the point, as LaTeX "formula = value". */
  readonly dx: string
  readonly dy: string
  readonly dxVal: number
  readonly dyVal: number
}

// Every shape is built backwards from a Pythagorean pair of contributions (∂f/∂x·σx, ∂f/∂y·σy),
// so σ_f is an exact integer, and each uncertainty stays below half its value.
function productShape(rng: Rng, a: number, b: number): Contributions {
  const sx = smallDivisor(rng, a)
  const sy = smallDivisor(rng, b)
  const y = a / sx
  const x = b / sy
  return { fLatex: 'x \\cdot y', x, y, sx, sy, dx: `y = ${y}`, dy: `x = ${x}`, dxVal: y, dyVal: x }
}

function squaresShape(rng: Rng, a: number, b: number, minus: boolean): Contributions {
  const sx = smallDivisor(rng, a)
  const sy = smallDivisor(rng, b)
  const x = a / sx
  const y = b / sy
  return {
    fLatex: minus ? 'x^2 - y^2' : 'x^2 + y^2',
    x, y, sx, sy,
    dx: `2x = ${2 * x}`,
    dy: minus ? `-2y = ${-2 * y}` : `2y = ${2 * y}`,
    dxVal: 2 * x,
    dyVal: minus ? -2 * y : 2 * y,
  }
}

function squareTimesShape(rng: Rng, big: number, small: number): Contributions {
  // 2xy·1 = k·big and x²·σy = k·small with k = 2x²j: y = j·big·x, σy = 2j·small; x > 4·small/big keeps σy < y/2.
  const minX = Math.floor((4 * small) / big) + 1
  const x = rng.int(Math.max(3, minX), Math.max(3, minX) + 2)
  const j = 1
  const y = j * big * x
  const sy = 2 * j * small
  return { fLatex: 'x^2 y', x, y, sx: 1, sy, dx: `2xy = ${2 * x * y}`, dy: `x^2 = ${x * x}`, dxVal: 2 * x * y, dyVal: x * x }
}

function generateExactDerivProblem(rng: Rng, isComplex: boolean): ExactDerivProblemSpec {
  const contextPhrase = rng.pick(DERIV_CONTEXTS)
  const v = isComplex ? rng.pick(['V', 'U', 'W', 'P']) : 'f'
  const triple = rng.pick(PYTH_TRIPLES)
  const [a, b] = rng.chance(0.5) ? [triple.a, triple.b] : [triple.b, triple.a]
  const shape = rng.pick(['product', 'plus', 'minus', 'squareTimes'] as const)
  const c =
    shape === 'product'
      ? productShape(rng, a, b)
      : shape === 'squareTimes'
        ? squareTimesShape(rng, Math.max(a, b), Math.min(a, b))
        : squaresShape(rng, a, b, shape === 'minus')
  const px = c.dxVal * c.sx
  const py = c.dyVal * c.sy
  const answer = Math.sqrt(px * px + py * py)
  const term = (d: number, s: number) => `(${d} \\cdot ${s})^2`
  return {
    answerVal: answer,
    statement: `${contextPhrase}, a function $${v}(x, y) = ${c.fLatex}$ is evaluated at $x = ${c.x} \\pm ${c.sx}$ and $y = ${c.y} \\pm ${c.sy}$. Using partial derivatives, calculate the absolute uncertainty $\\sigma_${v}$.`,
    step1Tex: `\\frac{\\partial ${v}}{\\partial x} = ${c.dx}, \\quad \\frac{\\partial ${v}}{\\partial y} = ${c.dy}`,
    step2Tex: `\\sigma_${v} = \\sqrt{${term(c.dxVal, c.sx)} + ${term(c.dyVal, c.sy)}} = \\sqrt{${px * px} + ${py * py}} = \\sqrt{${answer * answer}} = ${answer}`,
    hint2Text: `Evaluate $\\frac{\\partial ${v}}{\\partial x} = ${c.dxVal}$ and $\\frac{\\partial ${v}}{\\partial y} = ${c.dyVal}$ at the point, then combine the two contributions in quadrature.`,
  }
}

function generalPartialDerivErrorSimple(rng: Rng): Problem {
  const p = generateExactDerivProblem(rng, false)
  return {
    statement: p.statement,
    answer: { kind: 'number', value: String(p.answerVal) },
    solution: [
      { text: 'Compute partial derivatives:', tex: p.step1Tex },
      { text: 'Apply general error propagation formula:', tex: p.step2Tex },
    ],
    hints: [
      'Use $\\sigma_f = \\sqrt{(\\frac{\\partial f}{\\partial x})^2 \\sigma_x^2 + (\\frac{\\partial f}{\\partial y})^2 \\sigma_y^2}$.',
      p.hint2Text,
    ],
  }
}

function volumeOrAreaError(rng: Rng): Problem {
  const triple = rng.pick(PYTH_TRIPLES)
  const rx = triple.a
  const ry = triple.b
  const rf = triple.c
  const shape = rng.pick([
    { name: 'histological cross-section area', formula: 'A = x \\cdot y', r1: 'r_x', r2: 'r_y', rfName: 'r_A' },
    { name: 'micro-fluidic channel volume', formula: 'V = A \\cdot h', r1: 'r_A', r2: 'r_h', rfName: 'r_V' },
    { name: 'electrical power dissipation', formula: 'P = I \\cdot V', r1: 'r_I', r2: 'r_V', rfName: 'r_P' },
    { name: 'kinetic energy', formula: 'E = m \\cdot v', r1: 'r_m', r2: 'r_v', rfName: 'r_E' },
    { name: 'vascular pressure drop', formula: '\\Delta P = Q \\cdot R', r1: 'r_Q', r2: 'r_R', rfName: 'r_{\\Delta P}' },
  ])

  return {
    statement: `The ${shape.name} is given by $${shape.formula}$. If $${shape.r1} = ${rx}\\%$ and $${shape.r2} = ${ry}\\%$, calculate the percentage relative error $${shape.rfName}$ of the product.`,
    answer: { kind: 'number', value: String(rf) },
    solution: [
      { text: `For product $${shape.formula}$, relative errors combine quadratically:` },
      { text: 'Calculate relative error:', tex: `r = \\sqrt{${rx}^2 + ${ry}^2} = \\sqrt{${rx * rx} + ${ry * ry}} = ${rf}\\%` },
    ],
    hints: [
      'Use $r = \\sqrt{r_1^2 + r_2^2}$.',
      `Square $${rx}\\%$ and $${ry}\\%$, sum them to get $${rx * rx + ry * ry}$, and take the square root to get $${rf}\\%$.`,
    ],
  }
}

function tier2(rng: Rng): Problem {
  const choice = rng.int(1, 3)
  if (choice === 1) return multDivRelativeErrorPythagoras(rng)
  if (choice === 2) return generalPartialDerivErrorSimple(rng)
  return volumeOrAreaError(rng)
}

function clinicalLabMeasurementPropagation(rng: Rng): Problem {
  const setting = rng.pick([
    'In an intensive care unit',
    'In a clinical trial cohort',
    'During routine patient evaluation',
    'In a physiology lab protocol',
    'During exercise stress testing',
    'In a cardiovascular monitoring study',
  ])
  const variant = rng.pick([1, 2, 3, 4])

  if (variant === 1) {
    const triple = rng.pick(PYTH_TRIPLES)
    const rSV = triple.a
    const rHR = triple.b
    const rCO = triple.c

    return {
      statement: `${setting}, Cardiac Output is calculated as $CO = SV \\times HR$. If Stroke Volume $SV$ has relative error $r_{SV} = ${rSV}\\%$ and Heart Rate $HR$ has relative error $r_{HR} = ${rHR}\\%$, calculate the percentage relative error $r_{CO}$ of Cardiac Output.`,
      answer: { kind: 'number', value: String(rCO) },
      solution: [
        { text: 'For product $CO = SV \\times HR$, relative errors combine quadratically:' },
        { text: 'Calculate relative error:', tex: `r_{CO} = \\sqrt{r_{SV}^2 + r_{HR}^2} = \\sqrt{${rSV}^2 + ${rHR}^2} = \\sqrt{${rSV * rSV} + ${rHR * rHR}} = ${rCO}\\%` },
      ],
      hints: [
        'Apply $r_{CO} = \\sqrt{r_{SV}^2 + r_{HR}^2}$.',
        `Square ${rSV}% and ${rHR}%, sum to ${rSV * rSV + rHR * rHR}, and take $\\sqrt{${rSV * rSV + rHR * rHR}} = ${rCO}\\%$.`,
      ],
    }
  }

  if (variant === 2) {
    const triple = rng.pick([
      { sNa: 2, sCl: 3, sHCO3: 6, sAG: 7 },
      { sNa: 1, sCl: 4, sHCO3: 8, sAG: 9 },
      { sNa: 2, sCl: 6, sHCO3: 9, sAG: 11 },
      { sNa: 4, sCl: 4, sHCO3: 7, sAG: 9 },
      { sNa: 1, sCl: 2, sHCO3: 2, sAG: 3 },
      { sNa: 3, sCl: 4, sHCO3: 12, sAG: 13 },
      { sNa: 2, sCl: 10, sHCO3: 11, sAG: 15 },
    ])
    const { sNa, sCl, sHCO3, sAG } = triple

    return {
      statement: `${setting}, Serum Anion Gap is calculated as $AG = Na - (Cl + HCO_3)$. Measurement uncertainties are $\\sigma_{Na} = ${sNa}\\text{ mEq/L}$, $\\sigma_{Cl} = ${sCl}\\text{ mEq/L}$, and $\\sigma_{HCO_3} = ${sHCO3}\\text{ mEq/L}$. Calculate the absolute uncertainty $\\sigma_{AG}$.`,
      answer: { kind: 'number', value: String(sAG) },
      solution: [
        { text: 'For addition and subtraction, absolute uncertainties combine quadratically:' },
        { text: 'Calculate uncertainty:', tex: `\\sigma_{AG} = \\sqrt{\\sigma_{Na}^2 + \\sigma_{Cl}^2 + \\sigma_{HCO_3}^2} = \\sqrt{${sNa}^2 + ${sCl}^2 + ${sHCO3}^2} = \\sqrt{${sNa * sNa + sCl * sCl + sHCO3 * sHCO3}} = ${sAG}` },
      ],
      hints: [
        'Use $\\sigma_{AG} = \\sqrt{\\sigma_{Na}^2 + \\sigma_{Cl}^2 + \\sigma_{HCO_3}^2}$.',
        `Square ${sNa}, ${sCl}, and ${sHCO3}, add them to get ${sNa * sNa + sCl * sCl + sHCO3 * sHCO3}, then take the square root to get ${sAG}.`,
      ],
    }
  }

  if (variant === 3) {
    const triple = rng.pick(PYTH_TRIPLES)
    const rFlow = triple.a
    const rPress = triple.b
    const rRes = triple.c

    return {
      statement: `${setting}, Vascular resistance is calculated as $R = \\frac{\\Delta P}{Q}$. If pressure gradient $\\Delta P$ has relative error $r_P = ${rPress}\\%$ and blood flow $Q$ has relative error $r_Q = ${rFlow}\\%$, calculate the percentage relative error $r_R$ of resistance.`,
      answer: { kind: 'number', value: String(rRes) },
      solution: [
        { text: 'For quotient $R = \\frac{\\Delta P}{Q}$, relative errors combine quadratically:' },
        { text: 'Calculate relative error:', tex: `r_R = \\sqrt{r_P^2 + r_Q^2} = \\sqrt{${rPress}^2 + ${rFlow}^2} = \\sqrt{${rPress * rPress} + ${rFlow * rFlow}} = ${rRes}\\%` },
      ],
      hints: [
        'Apply $r_R = \\sqrt{r_P^2 + r_Q^2}$.',
        `Square ${rPress}% and ${rFlow}%, sum to ${rPress * rPress + rFlow * rFlow}, and take square root to get ${rRes}%.`,
      ],
    }
  }

  const triple = rng.pick(PYTH_TRIPLES)
  const rCO = triple.a
  const rCaO2 = triple.b
  const rDO2 = triple.c

  return {
    statement: `${setting}, systemic Oxygen Delivery is $DO_2 = CO \\times CaO_2$. If Cardiac Output $CO$ has relative error $r_{CO} = ${rCO}\\%$ and arterial oxygen content $CaO_2$ has relative error $r_{CaO_2} = ${rCaO2}\\%$, calculate the percentage relative error $r_{DO_2}$ of oxygen delivery.`,
    answer: { kind: 'number', value: String(rDO2) },
    solution: [
      { text: 'For product $DO_2 = CO \\times CaO_2$, relative errors combine quadratically:' },
      { text: 'Calculate relative error:', tex: `r_{DO_2} = \\sqrt{r_{CO}^2 + r_{CaO_2}^2} = \\sqrt{${rCO}^2 + ${rCaO2}^2} = ${rDO2}\\%` },
    ],
    hints: [
      'Apply $r_{DO_2} = \\sqrt{r_{CO}^2 + r_{CaO_2}^2}$.',
      `Square ${rCO}% and ${rCaO2}%, sum them up, and take the square root to get ${rDO2}%.`,
    ],
  }
}

function generalPartialDerivErrorComplex(rng: Rng): Problem {
  const p = generateExactDerivProblem(rng, true)
  return {
    statement: p.statement,
    answer: { kind: 'number', value: String(p.answerVal) },
    solution: [
      { text: 'Compute partial derivatives:', tex: p.step1Tex },
      { text: 'Apply error propagation:', tex: p.step2Tex },
    ],
    hints: [
      'Compute partial derivatives and evaluate at the given point.',
      p.hint2Text,
    ],
  }
}

function errorPropagationConceptChoice(rng: Rng): Problem {
  const variant = rng.pick([1, 2])
  const param = rng.pick([
    { name: 'oxygen saturation $SpO_2$', xSymbol: 'x', ySymbol: 'y' },
    { name: 'blood pressure measurement $BP$', xSymbol: 'x', ySymbol: 'y' },
    { name: 'cardiac output $CO$', xSymbol: 'x', ySymbol: 'y' },
  ])

  if (variant === 1) {
    const options = rng.shuffle([
      { id: 'random_uncorrelated_cancellation', label: 'Because random, uncorrelated errors are independent and can partially cancel each other, making variances additive.' },
      { id: 'linear_addition_worst_case', label: 'Linear addition $\\sigma_x + \\sigma_y$ represents the worst-case bound, not the expected standard deviation.' },
      { id: 'relative_error_only', label: 'Quadratic addition is only used for fractional measurements.' },
      { id: 'derivatives_always_one', label: 'Because partial derivatives are always equal to 1.' },
    ])

    return {
      statement: `When measuring ${param.name} with independent variables $x$ and $y$, why do random, uncorrelated uncertainties combine quadratically ($\\sqrt{\\sigma_x^2 + \\sigma_y^2}$) rather than linearly ($\\sigma_x + \\sigma_y$)?`,
      answer: { kind: 'choice', options, correctId: 'random_uncorrelated_cancellation' },
      solution: [
        { text: 'Uncorrelated random errors have zero covariance $Cov(X, Y) = 0$, so their variances add linearly $Var(X + Y) = Var(X) + Var(Y)$, making standard deviations add quadratically.' },
      ],
      hints: [
        'Recall that for independent variables, variances (squares of standard deviations) add directly.',
        'Covariance between independent random variables is zero.',
      ],
    }
  }

  const n = rng.pick([2, 3, 4, -1, -2])
  const options = rng.shuffle([
    { id: 'power_law_multiplier', label: `The percentage relative error of $f = x^{${n}}$ is multiplied by $|${n}|$.` },
    { id: 'power_law_exponent', label: `The percentage relative error is raised to the power ${n}.` },
    { id: 'power_law_unchanged', label: 'The percentage relative error remains unchanged regardless of exponent.' },
    { id: 'power_law_squared', label: 'The percentage relative error is always squared.' },
  ])

  return {
    statement: `For a physiological relationship $f = x^{${n}}$, how does the exponent ${n} affect the percentage relative error of $f$ relative to $x$?`,
    answer: { kind: 'choice', options, correctId: 'power_law_multiplier' },
    solution: [
      { text: `For power law $f = x^n$, logarithmic differentiation shows that $\\frac{\\sigma_f}{|f|} = |n| \\frac{\\sigma_x}{|x|}$.` },
    ],
    hints: [
      'Recall the power law error propagation rule: $\\frac{\\sigma_f}{|f|} = |n| \\frac{\\sigma_x}{|x|}$.',
      `The relative error is multiplied by the magnitude $|${n}|$.`,
    ],
  }
}

function tier3(rng: Rng): Problem {
  const choice = rng.int(1, 3)
  if (choice === 1) return clinicalLabMeasurementPropagation(rng)
  if (choice === 2) return generalPartialDerivErrorComplex(rng)
  return errorPropagationConceptChoice(rng)
}

export const template: SkillTemplate = {
  skillId: 'error_propagation',
  theory,
  expectedSeconds: { 1: 45, 2: 75, 3: 110 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
