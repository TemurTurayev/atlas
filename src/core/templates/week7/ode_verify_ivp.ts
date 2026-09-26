import { coefPrefix, joinTerms, linear } from '../../math/latex'
import type { Rng } from '../../random/rng'
import type { ChoiceOption, Problem, SkillTemplate } from '../types'

const theory = [
  'To check whether a function $y(t)$ solves a differential equation, differentiate the candidate and substitute both $y$ and $y\'$ into the equation — it is a solution exactly when both sides agree for every $t$.',
  'A family like $y=Ce^{kt}$ solves $y\'=ky$ for every choice of $C$; an initial condition $y(t_0)=y_0$ singles out the one value of $C$ whose graph also passes through that point.',
  'To pin down $C$: substitute $t=t_0$ into the family, set the result equal to $y_0$, and solve the resulting equation for $C$.',
  'Once $C$ is fixed, the solution is one specific function of $t$ — evaluate it at any other time by direct substitution.',
  'A shifted exponential $y=Ce^{kt}+y_{eq}$ solves $y\'=ky-ky_{eq}$; the extra constant $y_{eq}$ is an equilibrium value, and it shifts where the initial condition pins $C$.',
  'Common mistakes: substituting into only one side of the equation instead of comparing both; plugging the initial condition into the differential equation itself instead of into the solution family; dropping the equilibrium constant when the family is not a pure exponential.',
].join('\n')

const HINTS_VERIFY = [
  'Differentiate the candidate function on its own first, then separately compute the right-hand side of the equation with that same candidate substituted for $y$.',
  'The candidate solves the equation only if those two results are identical for every $t$ — not just for one value.',
]
const HINTS_PIN = [
  'Substitute $t=0$ into the general family — remember $e^{0}=1$ — to get an expression for $y(0)$ purely in terms of $C$.',
  'Set that expression equal to the given initial value and solve the resulting linear equation for $C$.',
]
const HINTS_EVAL = [
  'First pin down $C$ exactly as you would from the initial condition, using $t=0$.',
  'Then substitute the target time into the same family, keeping any additive equilibrium term, and simplify the power of $e$.',
]

const INPUT_HINT_NUMBER = 'A single number; it may be negative'

const withCoef = (coef: number, body: string): string => `${coefPrefix(coef)}${body}`

// ---------- tier 1: does the candidate solve the ODE? ----------

type Flavor = 'valid' | 'sign' | 'extraT' | 'scaledRate' | 'addConst'

function tier1(rng: Rng): Problem {
  const k = rng.intExcept(-3, 3, [0])
  const A = rng.intExcept(-3, 3, [0])
  const flavor = rng.pick<Flavor>(['valid', 'sign', 'extraT', 'scaledRate', 'addConst'])
  const kt = withCoef(k, 't')
  const odeLatex = `y' = ${withCoef(k, 'y')}`

  let candidateLatex: string
  let derivLine: string
  let rhsLine: string
  let valid: boolean
  let verdictNote: string

  if (flavor === 'valid') {
    candidateLatex = withCoef(A, `e^{${kt}}`)
    const derivValue = withCoef(A * k, `e^{${kt}}`)
    derivLine = `y'(t) = ${derivValue}`
    rhsLine = `${k}\\cdot y(t) = ${k}\\left(${candidateLatex}\\right) = ${derivValue}`
    valid = true
    verdictNote = 'Both sides are the same expression, so the candidate does solve the equation.'
  } else if (flavor === 'sign') {
    candidateLatex = withCoef(A, `e^{${withCoef(-k, 't')}}`)
    const derivValue = withCoef(-A * k, `e^{${withCoef(-k, 't')}}`)
    const rhsValue = withCoef(A * k, `e^{${withCoef(-k, 't')}}`)
    derivLine = `y'(t) = ${derivValue}`
    rhsLine = `${k}\\cdot y(t) = ${rhsValue}`
    valid = false
    verdictNote = `The two sides differ by a sign ($${derivValue}$ versus $${rhsValue}$), so the candidate does not solve the equation.`
  } else if (flavor === 'extraT') {
    candidateLatex = withCoef(A, `t\\,e^{${kt}}`)
    const term1 = withCoef(A, `e^{${kt}}`)
    const term2 = withCoef(A * k, `t\\,e^{${kt}}`)
    derivLine = `y'(t) = ${joinTerms([term1, term2])}`
    const rhsValue = withCoef(A * k, `t\\,e^{${kt}}`)
    rhsLine = `${k}\\cdot y(t) = ${rhsValue}`
    valid = false
    verdictNote = `Differentiating leaves an extra term $${term1}$ that $${k}\\cdot y(t)$ does not have, so the candidate does not solve the equation.`
  } else if (flavor === 'scaledRate') {
    const d = rng.intExcept(-3, 3, [0])
    const m = k + d
    candidateLatex = withCoef(A, `e^{${withCoef(m, 't')}}`)
    const derivValue = withCoef(A * m, `e^{${withCoef(m, 't')}}`)
    const rhsValue = withCoef(A * k, `e^{${withCoef(m, 't')}}`)
    derivLine = `y'(t) = ${derivValue}`
    rhsLine = `${k}\\cdot y(t) = ${rhsValue}`
    valid = false
    verdictNote = `The exponent matches, but the multiplier out front does not ($${m}$ from differentiating versus $${k}$ from the equation), so the candidate does not solve the equation.`
  } else {
    const b = rng.intExcept(-4, 4, [0])
    candidateLatex = joinTerms([withCoef(A, `e^{${kt}}`), String(b)])
    const derivValue = withCoef(A * k, `e^{${kt}}`)
    const rhsValue = joinTerms([withCoef(A * k, `e^{${kt}}`), String(k * b)])
    derivLine = `y'(t) = ${derivValue}`
    rhsLine = `${k}\\cdot y(t) = ${rhsValue}`
    valid = false
    verdictNote = `The constant term $${b}$ vanishes when you differentiate but reappears (scaled by $${k}$) on the other side, so the two sides do not match — the candidate does not solve the equation.`
  }

  const options: readonly ChoiceOption[] = [
    { id: 'yes', label: 'Yes' },
    { id: 'no', label: 'No' },
  ]

  return {
    statement: `Does $y(t) = ${candidateLatex}$ solve the differential equation $${odeLatex}$?`,
    answer: { kind: 'choice', options, correctId: valid ? 'yes' : 'no' },
    solution: [
      { text: 'Differentiate the candidate, then substitute the candidate into the right-hand side, and compare the two results.', tex: `${derivLine}, \\qquad ${rhsLine}` },
      { text: verdictNote },
    ],
    hints: HINTS_VERIFY,
  }
}

// ---------- shared family: y = C e^{kt} + e, solving y' = k y - k e ----------

interface Family {
  readonly k: number
  readonly eq: number
  readonly familyLatex: string
  readonly odeLatex: string
}

function buildFamily(rng: Rng): Family {
  const k = rng.intExcept(-3, 3, [0])
  const eq = rng.int(-4, 4)
  const kt = withCoef(k, 't')
  const familyLatex = joinTerms([`Ce^{${kt}}`, eq === 0 ? '' : String(eq)])
  const odeLatex = `y' = ${linear(k, -k * eq, 'y')}`
  return { k, eq, familyLatex, odeLatex }
}

// ---------- tier 2: pin down C from y(0) = y0 ----------

function tier2(rng: Rng): Problem {
  const { eq, familyLatex, odeLatex } = buildFamily(rng)
  const forcedSteadyState = rng.chance(0.25)
  const y0 = forcedSteadyState ? eq : rng.intExcept(-6, 6, [eq])
  const C = y0 - eq

  return {
    statement: `The function $y(t) = ${familyLatex}$ solves $${odeLatex}$ for any constant $C$. Find the value of $C$ for which $y(0) = ${y0}$.`,
    answer: { kind: 'number', value: String(C) },
    solution: [
      { text: 'Substitute $t=0$ into the family; since $e^{0}=1$, this leaves an expression purely in $C$:', tex: `y(0) = ${joinTerms(['C', eq === 0 ? '' : String(eq)])}` },
      { text: 'Set that equal to the initial condition and solve for $C$:', tex: `${joinTerms(['C', eq === 0 ? '' : String(eq)])} = ${y0} \\quad\\Longrightarrow\\quad C = ${C}` },
    ],
    hints: HINTS_PIN,
    inputHint: INPUT_HINT_NUMBER,
  }
}

// ---------- tier 3: pin down C, then evaluate at a later time ----------

/**
 * Builds a family whose evaluated answer is always clean: either a pure exponential (no
 * equilibrium, so C is nonzero and the answer is a clean multiple of e), or a pure equilibrium
 * (the initial condition already sits at rest, so C = 0 and the answer is a whole number).
 */
function tier3(rng: Rng): Problem {
  const k = rng.intExcept(-3, 3, [0])
  const kt = withCoef(k, 't')
  const pureExponential = rng.chance(0.5)
  const eq = pureExponential ? 0 : rng.intExcept(-4, 4, [0])
  const familyLatex = joinTerms([`Ce^{${kt}}`, eq === 0 ? '' : String(eq)])
  const odeLatex = `y' = ${linear(k, -k * eq, 'y')}`
  const y0 = pureExponential ? rng.intExcept(-4, 4, [0]) : eq
  const C = y0 - eq
  const t1 = rng.pick([1, 2, 3])
  const exponent = k * t1
  const answerValue = C === 0 ? String(eq) : withCoef(C, `e^{${exponent}}`)

  const pinStep = {
    text: 'Pin down $C$ from the initial condition, exactly as before:',
    tex: `${joinTerms(['C', eq === 0 ? '' : String(eq)])} = ${y0} \\quad\\Longrightarrow\\quad C = ${C}`,
  }
  const subLatex = joinTerms([withCoef(C, `e^{${exponent}}`), eq === 0 ? '' : String(eq)])
  const evalStep = {
    text: `Substitute $C=${C}$ and $t=${t1}$ into the family:`,
    tex: `y(${t1}) = ${subLatex === answerValue ? answerValue : `${subLatex} = ${answerValue}`}`,
  }

  return {
    statement: `The function $y(t) = ${familyLatex}$ solves $${odeLatex}$ for any constant $C$. If $y(0) = ${y0}$, find $y(${t1})$.`,
    answer: { kind: 'number', value: answerValue },
    solution: [pinStep, evalStep],
    hints: HINTS_EVAL,
    inputHint: INPUT_HINT_NUMBER,
  }
}

export const template: SkillTemplate = {
  skillId: 'ode_verify_ivp',
  theory,
  expectedSeconds: { 1: 60, 2: 80, 3: 110 },
  generate: (rng, tier) => (tier === 1 ? tier1(rng) : tier === 2 ? tier2(rng) : tier3(rng)),
}
